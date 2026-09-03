import { query, transaction } from "../../db.js";
import { ok, fail } from "../../utils/http.js";
import { randomUUID } from "crypto";
import { createNotification } from "../../utils/notify.js";

async function details(id, uid) {
  const order = (
    await query(
      `SELECT * FROM orders WHERE id=? AND user_id=?`,
      [id, uid],
    )
  )[0];

  if (!order) return null;

  try {
    order.shipping_address = JSON.parse(order.shipping_address || "{}");
  } catch {
    order.shipping_address = {};
  }

  try {
    order.billing_address = order.billing_address
      ? JSON.parse(order.billing_address)
      : null;
  } catch {
    order.billing_address = null;
  }

  order.items = await query(
    `SELECT * FROM order_items WHERE order_id=? ORDER BY id ASC`,
    [id],
  );

  order.timeline = [
    { status: "pending", label: "Order placed", at: order.created_at },
    ...(order.status !== "pending" && order.status !== "cancelled" ? [{ status: "processing", label: "Processing", at: order.updated_at }] : []),
    ...(order.shipped_at ? [{ status: "shipped", label: "Shipped", at: order.shipped_at }] : []),
    ...(order.delivered_at ? [{ status: "delivered", label: "Delivered", at: order.delivered_at }] : []),
    ...(order.cancelled_at ? [{ status: "cancelled", label: "Cancelled", at: order.cancelled_at }] : []),
  ];

  return order;
}

export async function index(req, res) {
  try {
    const page = Math.max(
      1,
      Number.parseInt(req.query.page || "1", 10) || 1,
    );

    const perPage = Math.min(
      50,
      Math.max(
        1,
        Number.parseInt(req.query.per_page || "10", 10) || 10,
      ),
    );

    const offset = (page - 1) * perPage;

    const countRows = await query(
      `SELECT COUNT(*) AS total FROM orders WHERE user_id=?`,
      [req.user.id],
    );

    const total = Number(countRows[0]?.total || 0);

    const rows = await query(
      `
        SELECT *
        FROM orders
        WHERE user_id = ?
        ORDER BY id DESC
        LIMIT ${limit} OFFSET ${offset}
      `,
      [userId]
    );

    return ok(res, {
      success: true,
      data: {
        data: rows,
        current_page: page,
        last_page: total > 0 ? Math.ceil(total / perPage) : 1,
        per_page: perPage,
        total,
      },
    });
  } catch (error) {
    console.error("Customer order index error:", error);
    return fail(res, "Unable to load orders.", 500);
  }
}

export async function show(req, res) {
  try {
    const order = await details(req.params.id, req.user.id);
    return order
      ? ok(res, { success: true, data: order })
      : fail(res, "Order not found.", 404);
  } catch (error) {
    console.error("Customer order show error:", error);
    return fail(res, "Unable to load order.", 500);
  }
}

export async function store(req, res) {
  try {
    const {
      shipping_address_id,
      billing_address_id,
      shipping_address,
      billing_address,
      payment_method = "cod",
      customer_note,
      coupon_code,
    } = req.body || {};

    if (!shipping_address_id && !shipping_address) {
      return fail(res, "Shipping address is required.", 422);
    }

    if (payment_method !== "cod") {
      return fail(
        res,
        "This store currently supports Cash on Delivery only.",
        422,
      );
    }

    return await transaction(async (c) => {
      /* ------------------------------------------------------------------ */
      /* Address resolution                                                 */
      /* ------------------------------------------------------------------ */

      let shippingSnapshot = shipping_address || null;
      let billingSnapshot = billing_address || null;

      if (shipping_address_id) {
        const [rows] = await c.execute(
          `
            SELECT *
            FROM addresses
            WHERE id=? AND user_id=?
            LIMIT 1
          `,
          [shipping_address_id, req.user.id],
        );

        const address = rows[0];
        if (!address) {
          throw Object.assign(
            new Error("Shipping address not found."),
            { status: 422 },
          );
        }

        shippingSnapshot = address;
      }

      if (billing_address_id) {
        const [rows] = await c.execute(
          `
            SELECT *
            FROM addresses
            WHERE id=? AND user_id=?
            LIMIT 1
          `,
          [billing_address_id, req.user.id],
        );

        const address = rows[0];
        if (!address) {
          throw Object.assign(
            new Error("Billing address not found."),
            { status: 422 },
          );
        }

        billingSnapshot = address;
      }

      if (!shippingSnapshot) {
        throw Object.assign(
          new Error("Shipping address is required."),
          { status: 422 },
        );
      }

      /* ------------------------------------------------------------------ */
      /* Cart                                                               */
      /* ------------------------------------------------------------------ */

      const [cartRows] = await c.execute(
        `SELECT id FROM carts WHERE user_id=? LIMIT 1`,
        [req.user.id],
      );

      const cart = cartRows[0];

      if (!cart) {
        throw Object.assign(
          new Error("Cart is empty."),
          { status: 422 },
        );
      }

      const [items] = await c.execute(
        `
          SELECT
            ci.*,
            pv.product_id,
            pv.sku,
            pv.mrp,
            pv.selling_price,
            pv.status AS variant_status,
            s.name AS size_name,
            co.name AS color_name,
            p.name AS product_name,
            p.status AS product_status,
            pi.image
          FROM cart_items ci
          JOIN product_variants pv
            ON pv.id=ci.product_variant_id
          JOIN products p
            ON p.id=pv.product_id
          LEFT JOIN sizes s
            ON s.id=pv.size_id
          LEFT JOIN colors co
            ON co.id=pv.color_id
          LEFT JOIN product_images pi
            ON pi.product_id=p.id
            AND pi.is_primary=1
          WHERE ci.cart_id=?
          ORDER BY ci.id ASC
        `,
        [cart.id],
      );

      if (!items.length) {
        throw Object.assign(
          new Error("Cart is empty."),
          { status: 422 },
        );
      }

      /* ------------------------------------------------------------------ */
      /* Stock + subtotal                                                   */
      /* ------------------------------------------------------------------ */

      let subtotal = 0;

      for (const item of items) {
        if (item.variant_status !== "active") {
          throw Object.assign(
            new Error(`${item.product_name} is no longer available.`),
            { status: 422 },
          );
        }

        if (item.product_status !== "active") {
          throw Object.assign(
            new Error(`${item.product_name} is no longer available.`),
            { status: 422 },
          );
        }

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
        const available = Math.max(
          0,
          Number(inventory?.quantity || 0) -
            Number(inventory?.reserved_quantity || 0),
        );

        if (available < Number(item.quantity)) {
          throw Object.assign(
            new Error(
              `Only ${available} item(s) available for ${item.product_name}.`,
            ),
            { status: 422 },
          );
        }

        subtotal +=
          Number(item.selling_price || 0) *
          Number(item.quantity || 0);
      }

      /* ------------------------------------------------------------------ */
      /* Coupon                                                             */
      /* ------------------------------------------------------------------ */

      let coupon = null;
      let discountAmount = 0;

      const normalizedCouponCode = String(
        coupon_code || "",
      )
        .trim()
        .toUpperCase();

      if (normalizedCouponCode) {
        const [couponRows] = await c.execute(
          `
            SELECT *
            FROM coupons
            WHERE UPPER(code)=?
            LIMIT 1
            FOR UPDATE
          `,
          [normalizedCouponCode],
        );

        coupon = couponRows[0];

        if (!coupon) {
          throw Object.assign(
            new Error("Invalid coupon code."),
            { status: 422 },
          );
        }

        const now = new Date();

        if (
          coupon.status !== "active" ||
          (coupon.starts_at && new Date(coupon.starts_at) > now) ||
          (coupon.expires_at && new Date(coupon.expires_at) < now)
        ) {
          throw Object.assign(
            new Error("Coupon is not active."),
            { status: 422 },
          );
        }

        if (
          subtotal <
          Number(coupon.minimum_order_amount || 0)
        ) {
          throw Object.assign(
            new Error(
              `Minimum order amount is ₹${coupon.minimum_order_amount}.`,
            ),
            { status: 422 },
          );
        }

        if (coupon.usage_limit != null) {
          const [usageRows] = await c.execute(
            `SELECT COUNT(*) AS count FROM coupon_usages WHERE coupon_id=?`,
            [coupon.id],
          );

          if (
            Number(usageRows[0]?.count || 0) >=
            Number(coupon.usage_limit)
          ) {
            throw Object.assign(
              new Error("This coupon has reached its usage limit."),
              { status: 422 },
            );
          }
        }

        const [userUsageRows] = await c.execute(
          `
            SELECT COUNT(*) AS count
            FROM coupon_usages
            WHERE coupon_id=? AND user_id=?
          `,
          [coupon.id, req.user.id],
        );

        if (
          Number(userUsageRows[0]?.count || 0) >=
          Number(coupon.per_user_limit || 1)
        ) {
          throw Object.assign(
            new Error("You have already used this coupon the maximum number of times."),
            { status: 422 },
          );
        }

        discountAmount =
          coupon.type === "percentage"
            ? (subtotal * Number(coupon.value || 0)) / 100
            : Number(coupon.value || 0);

        if (coupon.maximum_discount_amount != null) {
          discountAmount = Math.min(
            discountAmount,
            Number(coupon.maximum_discount_amount),
          );
        }

        discountAmount = Math.max(
          0,
          Math.min(discountAmount, subtotal),
        );
      }

      /* ------------------------------------------------------------------ */
      /* Shipping                                                           */
      /* ------------------------------------------------------------------ */

      const [shippingRows] = await c.execute(
        `SELECT * FROM shipping_settings ORDER BY id LIMIT 1`,
      );

      const shippingSettings =
        shippingRows[0] || {
          shipping_enabled: 1,
          flat_shipping_amount: 0,
          free_shipping_minimum: null,
        };

      const shippingEnabled = Boolean(
        shippingSettings.shipping_enabled,
      );

      const freeMinimum =
        shippingSettings.free_shipping_minimum == null
          ? null
          : Number(shippingSettings.free_shipping_minimum);

      const shippingAmount =
        !shippingEnabled ||
        (freeMinimum != null &&
          freeMinimum > 0 &&
          subtotal >= freeMinimum)
          ? 0
          : Number(shippingSettings.flat_shipping_amount || 0);

      const totalAmount = Math.max(
        0,
        subtotal + shippingAmount - discountAmount,
      );

      /* ------------------------------------------------------------------ */
      /* Create order                                                       */
      /* ------------------------------------------------------------------ */

      const orderNumber = `BM-${new Date()
        .toISOString()
        .slice(0, 10)
        .replaceAll("-", "")}-${randomUUID()
        .slice(0, 6)
        .toUpperCase()}`;

      const [orderResult] = await c.execute(
        `
          INSERT INTO orders
          (
            user_id,
            order_number,
            status,
            payment_method,
            payment_status,
            subtotal,
            shipping_amount,
            discount_amount,
            coupon_id,
            coupon_code,
            total_amount,
            shipping_address,
            billing_address,
            customer_note,
            created_at,
            updated_at
          )
          VALUES
          (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
        `,
        [
          req.user.id,
          orderNumber,
          "pending",
          "cod",
          "pending",
          subtotal,
          shippingAmount,
          discountAmount,
          coupon?.id || null,
          coupon?.code || null,
          totalAmount,
          JSON.stringify(shippingSnapshot),
          billingSnapshot
            ? JSON.stringify(billingSnapshot)
            : null,
          customer_note?.trim?.() || null,
        ],
      );

      /* ------------------------------------------------------------------ */
      /* Order items + reserve stock                                        */
      /* ------------------------------------------------------------------ */

      for (const item of items) {
        const lineTotal =
          Number(item.selling_price || 0) *
          Number(item.quantity || 0);

        await c.execute(
          `
            INSERT INTO order_items
            (
              order_id,
              product_id,
              product_variant_id,
              product_name,
              variant_sku,
              size_name,
              color_name,
              image,
              mrp,
              price,
              quantity,
              line_total,
              created_at,
              updated_at
            )
            VALUES
            (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
          `,
          [
            orderResult.insertId,
            item.product_id,
            item.product_variant_id,
            item.product_name,
            item.sku,
            item.size_name,
            item.color_name,
            item.image,
            item.mrp,
            item.selling_price,
            item.quantity,
            lineTotal,
          ],
        );

        await c.execute(
          `
            UPDATE inventories
            SET
              reserved_quantity=reserved_quantity+?,
              updated_at=NOW()
            WHERE product_variant_id=?
          `,
          [item.quantity, item.product_variant_id],
        );
      }

      /* ------------------------------------------------------------------ */
      /* Coupon usage                                                       */
      /* ------------------------------------------------------------------ */

      if (coupon) {
        await c.execute(
          `
            INSERT INTO coupon_usages
            (
              coupon_id,
              user_id,
              order_id,
              discount_amount,
              created_at,
              updated_at
            )
            VALUES (?, ?, ?, ?, NOW(), NOW())
          `,
          [
            coupon.id,
            req.user.id,
            orderResult.insertId,
            discountAmount,
          ],
        );
      }

      /* ------------------------------------------------------------------ */
      /* Clear cart                                                         */
      /* ------------------------------------------------------------------ */

      await c.execute(
        `DELETE FROM cart_items WHERE cart_id=?`,
        [cart.id],
      );

      const [createdRows] = await c.execute(
        `SELECT * FROM orders WHERE id=? LIMIT 1`,
        [orderResult.insertId],
      );

      await createNotification(
        req.user.id,
        "order",
        "Order placed",
        `Your order ${createdRows[0].order_number} has been placed successfully.`,
        { order_id: createdRows[0].id },
      );

      return ok(
        res,
        {
          success: true,
          message: "Order placed successfully.",
          data: createdRows[0],
        },
        201,
      );
    });
  } catch (error) {
    console.error("Customer order store error:", error);

    return fail(
      res,
      error?.message || "Unable to place order.",
      error?.status || 500,
    );
  }
}

export async function cancel(req, res) {
  try {
    const order = (
      await query(
        `SELECT * FROM orders WHERE id=? AND user_id=? LIMIT 1`,
        [req.params.id, req.user.id],
      )
    )[0];

    if (!order) return fail(res, "Order not found.", 404);

    if (!["pending", "processing"].includes(order.status)) {
      return fail(res, "Order cannot be cancelled.", 422);
    }

    await transaction(async (c) => {
      const [items] = await c.execute(
        `SELECT product_variant_id,quantity FROM order_items WHERE order_id=?`,
        [order.id],
      );

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

      await c.execute(
        `
          UPDATE orders
          SET status='cancelled',cancelled_at=NOW(),updated_at=NOW()
          WHERE id=? AND user_id=?
        `,
        [order.id, req.user.id],
      );
    });

    return ok(res, {
      success: true,
      message: "Order cancelled successfully.",
    });
  } catch (error) {
    console.error("Customer order cancel error:", error);
    return fail(res, "Unable to cancel order.", 500);
  }
}


export async function reorder(req, res) {
  try {
    const order = (await query(`SELECT * FROM orders WHERE id=? AND user_id=? LIMIT 1`, [req.params.id, req.user.id]))[0];
    if (!order) return fail(res, "Order not found.", 404);
    if (order.status !== "delivered") return fail(res, "Only delivered orders can be reordered.", 422);

    return await transaction(async (c) => {
      const [carts] = await c.execute(`SELECT id FROM carts WHERE user_id=? LIMIT 1`, [req.user.id]);
      let cartId = carts[0]?.id;
      if (!cartId) {
        const [created] = await c.execute(`INSERT INTO carts (user_id,created_at,updated_at) VALUES (?,NOW(),NOW())`, [req.user.id]);
        cartId = created.insertId;
      }
      const [items] = await c.execute(`SELECT * FROM order_items WHERE order_id=?`, [order.id]);
      let added = 0;
      for (const item of items) {
        if (!item.product_variant_id) continue;
        const [variants] = await c.execute(`SELECT pv.id,pv.status,p.status AS product_status FROM product_variants pv JOIN products p ON p.id=pv.product_id WHERE pv.id=? LIMIT 1`, [item.product_variant_id]);
        const variant = variants[0];
        if (!variant || variant.status !== "active" || variant.product_status !== "active") continue;
        const [inv] = await c.execute(`SELECT quantity,reserved_quantity FROM inventories WHERE product_variant_id=? LIMIT 1`, [item.product_variant_id]);
        const available = Math.max(0, Number(inv[0]?.quantity || 0) - Number(inv[0]?.reserved_quantity || 0));
        if (available < Number(item.quantity)) continue;
        const [existing] = await c.execute(`SELECT id,quantity FROM cart_items WHERE cart_id=? AND product_variant_id=? LIMIT 1`, [cartId, item.product_variant_id]);
        if (existing[0]) {
          const next = Math.min(available, Number(existing[0].quantity) + Number(item.quantity));
          await c.execute(`UPDATE cart_items SET quantity=?,updated_at=NOW() WHERE id=?`, [next, existing[0].id]);
        } else {
          await c.execute(`INSERT INTO cart_items (cart_id,product_variant_id,quantity,created_at,updated_at) VALUES (?,?,?,NOW(),NOW())`, [cartId, item.product_variant_id, Math.min(available, Number(item.quantity))]);
        }
        added += 1;
      }
      if (!added) throw Object.assign(new Error("None of the products from this order are currently available."), { status: 422 });
      await c.execute(`UPDATE carts SET updated_at=NOW() WHERE id=?`, [cartId]);
      return ok(res, { success: true, message: `${added} product(s) added to your bag.`, data: { cart_id: cartId, added_items: added } });
    });
  } catch (error) {
    console.error("Customer reorder error:", error);
    return fail(res, error?.message || "Unable to reorder this purchase.", error?.status || 500);
  }
}
