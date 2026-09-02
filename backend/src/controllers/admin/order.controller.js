import { query, transaction } from "../../db.js";
import { ok, fail } from "../../utils/http.js";
import { createNotification } from "../../utils/notify.js";
import { audit } from "../../utils/audit.js";

export async function index(req, res) {
  let sql = `
    SELECT
      o.*,
      u.name AS customer_name,
      u.email AS customer_email
    FROM orders o
    JOIN users u ON u.id = o.user_id
    WHERE 1=1
  `;

  const params = [];

  /*
   * Search
   */

  if (req.query.search) {
    sql += `
      AND (
        o.order_number LIKE ?
        OR u.name LIKE ?
        OR u.email LIKE ?
      )
    `;

    const search =
      `%${req.query.search}%`;

    params.push(
      search,
      search,
      search
    );
  }

  /*
   * Order status
   */

  if (req.query.status) {
    sql += `
      AND o.status=?
    `;

    params.push(
      req.query.status
    );
  }

  /*
   * Payment status
   */

  if (req.query.payment_status) {
    sql += `
      AND o.payment_status=?
    `;

    params.push(
      req.query.payment_status
    );
  }

  /*
   * Latest first
   */

  sql += `
    ORDER BY o.id DESC
  `;

  const rows =
    await query(
      sql,
      params
    );

  /*
   * Return plain array.
   *
   * Frontend expects:
   *
   * data.data
   */

  return ok(res, {
    success: true,
    data: rows,
  });
}

/*
 * --------------------------------------------------------------------------
 * Show Order
 * --------------------------------------------------------------------------
 */

export async function show(
  req,
  res
) {
  const order =
    (
      await query(
        `
        SELECT
          o.*,
          u.name AS customer_name,
          u.email AS customer_email,
          u.phone AS customer_phone
        FROM orders o
        JOIN users u
          ON u.id = o.user_id
        WHERE o.id=?
        `,
        [req.params.id]
      )
    )[0];

  if (!order) {
    return fail(
      res,
      "Order not found.",
      404
    );
  }

  /*
   * Shipping address
   */

  try {
    order.shipping_address =
      JSON.parse(
        order.shipping_address ||
          "{}"
      );
  } catch {
    order.shipping_address = {};
  }

  /*
   * Billing address
   */

  try {
    order.billing_address =
      order.billing_address
        ? JSON.parse(
            order.billing_address
          )
        : null;
  } catch {
    order.billing_address = null;
  }

  /*
   * Order items
   */

  order.items =
    await query(
      `
      SELECT *
      FROM order_items
      WHERE order_id=?
      ORDER BY id ASC
      `,
      [order.id]
    );

  return ok(res, {
    success: true,
    data: order,
  });
}

/*
 * --------------------------------------------------------------------------
 * Update Order Status
 * --------------------------------------------------------------------------
 */

export async function updateStatus(
  req,
  res
) {
  const status = String(req.body?.status || "").trim();

  const allowedStatuses = [
    "pending",
    "processing",
    "shipped",
    "delivered",
    "cancelled",
  ];

  if (!allowedStatuses.includes(status)) {
    return fail(res, "Invalid order status.", 422);
  }

  try {
    const existing = (
      await query(
        `SELECT * FROM orders WHERE id=? LIMIT 1`,
        [req.params.id],
      )
    )[0];

    if (!existing) {
      return fail(res, "Order not found.", 404);
    }

    if (existing.status === status) {
      return ok(res, {
        success: true,
        message: "Order status is already up to date.",
        data: existing,
      });
    }

    const terminalStatuses = ["delivered", "cancelled"];

    if (
      terminalStatuses.includes(existing.status) &&
      existing.status !== status
    ) {
      return fail(
        res,
        "A delivered or cancelled order cannot be moved to another status.",
        422,
      );
    }

    await transaction(async (c) => {
      const [items] = await c.execute(
        `SELECT product_variant_id,quantity FROM order_items WHERE order_id=?`,
        [existing.id],
      );

      /*
       * Cancellation releases reserved stock.
       */
      if (status === "cancelled") {
        for (const item of items) {
          await c.execute(
            `
              UPDATE inventories
              SET
                reserved_quantity=GREATEST(0,reserved_quantity-?),
                updated_at=NOW()
              WHERE product_variant_id=?
            `,
            [item.quantity, item.product_variant_id],
          );
        }
      }

      /*
       * Delivery converts reserved stock into sold stock.
       * This prevents reserved_quantity from permanently
       * making otherwise available stock look unavailable.
       */
      if (status === "delivered") {
        for (const item of items) {
          const [inventoryRows] = await c.execute(
            `
              SELECT quantity,reserved_quantity
              FROM inventories
              WHERE product_variant_id=?
              FOR UPDATE
            `,
            [item.product_variant_id],
          );

          const inventory = inventoryRows[0];
          const reserved = Number(inventory?.reserved_quantity || 0);
          const quantity = Number(item.quantity || 0);

          if (!inventory || reserved < quantity) {
            throw Object.assign(
              new Error("Inventory reservation is inconsistent for this order."),
              { status: 422 },
            );
          }

          if (Number(inventory.quantity || 0) < quantity) {
            throw Object.assign(
              new Error("Inventory quantity is insufficient to complete this order."),
              { status: 422 },
            );
          }

          await c.execute(
            `
              UPDATE inventories
              SET
                quantity=quantity-?,
                reserved_quantity=reserved_quantity-?,
                updated_at=NOW()
              WHERE product_variant_id=?
            `,
            [quantity, quantity, item.product_variant_id],
          );
        }
      }

      await c.execute(
        `
          UPDATE orders
          SET
            status=?,
            cancelled_at=IF(?='cancelled',COALESCE(cancelled_at,NOW()),cancelled_at),
            shipped_at=IF(?='shipped',COALESCE(shipped_at,NOW()),shipped_at),
            delivered_at=IF(?='delivered',COALESCE(delivered_at,NOW()),delivered_at),
            updated_at=NOW()
          WHERE id=?
        `,
        [status, status, status, status, existing.id],
      );
    });

    const updated = (
      await query(
        `SELECT * FROM orders WHERE id=? LIMIT 1`,
        [existing.id],
      )
    )[0];

    const labels = {
      pending: "Order placed",
      processing: "Order processing",
      shipped: "Order shipped",
      delivered: "Order delivered",
      cancelled: "Order cancelled",
    };

    await audit(req, "order_status_updated", "order", existing.id, { from: existing.status, to: status });

    await createNotification(
      existing.user_id,
      "order_status",
      labels[status] || "Order updated",
      `Your order ${existing.order_number} is now ${status}.`,
      { order_id: existing.id, status },
    );

    return ok(res, {
      success: true,
      message: "Order status updated.",
      data: updated,
    });
  } catch (error) {
    console.error("Admin order status error:", error);
    return fail(
      res,
      error?.message || "Unable to update order status.",
      error?.status || 500,
    );
  }
}

/*
 * --------------------------------------------------------------------------
 * Update Shipping
 * --------------------------------------------------------------------------
 */

export async function updateShipping(
  req,
  res
) {
  const order =
    (
      await query(
        `
        SELECT id
        FROM orders
        WHERE id=?
        `,
        [req.params.id]
      )
    )[0];

  if (!order) {
    return fail(
      res,
      "Order not found.",
      404
    );
  }

  await query(
    `
    UPDATE orders
    SET
      courier_name=?,
      tracking_number=?,
      updated_at=NOW()
    WHERE id=?
    `,
    [
      req.body?.courier_name ||
        null,

      req.body?.tracking_number ||
        null,

      req.params.id,
    ]
  );

  return ok(res, {
    success: true,
    message:
      "Shipping details updated.",
  });
}

export async function updatePaymentStatus(req,res) {
  const status=String(req.body?.payment_status||'').trim();
  const allowed=['pending','paid','failed','refunded'];
  if(!allowed.includes(status)) return fail(res,'Invalid payment status.',422);
  const order=(await query(`SELECT * FROM orders WHERE id=? LIMIT 1`,[req.params.id]))[0];
  if(!order) return fail(res,'Order not found.',404);
  await query(`UPDATE orders SET payment_status=?,updated_at=NOW() WHERE id=?`,[status,order.id]);
  await audit(req,'payment_status_updated','order',order.id,{from:order.payment_status,to:status});
  await createNotification(order.user_id,'payment_status','Payment status updated',`Payment for order ${order.order_number} is now ${status}.`,{order_id:order.id,payment_status:status});
  return ok(res,{success:true,message:'Payment status updated.',data:(await query(`SELECT * FROM orders WHERE id=?`,[order.id]))[0]});
}
