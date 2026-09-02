import { query } from "../../db.js";
import { ok, fail } from "../../utils/http.js";
import { audit } from "../../utils/audit.js";

/*
|--------------------------------------------------------------------------
| Customer List
|--------------------------------------------------------------------------
*/

export async function index(req, res) {
  try {
    const search = String(req.query.search || "").trim();
    const status = String(req.query.status || "").trim();

    const page = Math.max(
      1,
      Number.parseInt(req.query.page || "1", 10) || 1,
    );

    const perPage = Math.min(
      100,
      Math.max(
        1,
        Number.parseInt(req.query.per_page || "20", 10) || 20,
      ),
    );

    const offset = (page - 1) * perPage;

    /*
    |--------------------------------------------------------------------------
    | Base WHERE
    |--------------------------------------------------------------------------
    */

    let where = `WHERE u.role='customer'`;
    const params = [];

    /*
    |--------------------------------------------------------------------------
    | Search
    |--------------------------------------------------------------------------
    */

    if (search) {
      where += `
        AND (
          u.name LIKE ?
          OR u.email LIKE ?
          OR u.phone LIKE ?
        )
      `;

      const s = `%${search}%`;

      params.push(s, s, s);
    }

    /*
    |--------------------------------------------------------------------------
    | Status Filter
    |--------------------------------------------------------------------------
    */

    if (status && ["active", "inactive"].includes(status)) {
      where += ` AND u.status=?`;
      params.push(status);
    }

    /*
    |--------------------------------------------------------------------------
    | Total filtered customers
    |--------------------------------------------------------------------------
    */

    const countResult = await query(
      `
      SELECT COUNT(*) AS total
      FROM users u
      ${where}
      `,
      params,
    );

    const total = Number(countResult[0]?.total || 0);

    /*
    |--------------------------------------------------------------------------
    | Customers
    |--------------------------------------------------------------------------
    */

    const rows = await query(
      `
      SELECT
        u.id,
        u.name,
        u.email,
        u.phone,
        u.role,
        u.status,
        u.created_at,
        u.updated_at
      FROM users u
      ${where}
      ORDER BY u.id DESC
      LIMIT ? OFFSET ?
      `,
      [...params, perPage, offset],
    );

    /*
    |--------------------------------------------------------------------------
    | Pagination
    |--------------------------------------------------------------------------
    */

    const lastPage =
      total > 0
        ? Math.ceil(total / perPage)
        : 1;

    /*
    |--------------------------------------------------------------------------
    | Summary
    |--------------------------------------------------------------------------
    |
    | These counts are NOT affected by search/pagination.
    | They represent all customer accounts.
    |
    */

    const summaryRows = await query(
      `
      SELECT
        COUNT(*) AS total,
        SUM(CASE WHEN status='active' THEN 1 ELSE 0 END) AS active,
        SUM(CASE WHEN status='inactive' THEN 1 ELSE 0 END) AS inactive
      FROM users
      WHERE role='customer'
      `,
    );

    const summaryRow = summaryRows[0] || {};

    const summary = {
      total: Number(summaryRow.total || 0),
      active: Number(summaryRow.active || 0),
      inactive: Number(summaryRow.inactive || 0),
    };

    /*
    |--------------------------------------------------------------------------
    | Response
    |--------------------------------------------------------------------------
    */

    return ok(res, {
      success: true,

      data: {
        data: rows,

        current_page: page,

        last_page: lastPage,

        per_page: perPage,

        total: total,
      },

      summary,
    });
  } catch (error) {
    console.error("Customer index error:", error);

    return fail(
      res,
      "Unable to load customers.",
      500,
    );
  }
}


/*
|--------------------------------------------------------------------------
| Show Customer
|--------------------------------------------------------------------------
*/

export async function show(req, res) {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return fail(res, "Invalid customer ID.", 422);
    }

    const customer = (
      await query(
        `
          SELECT
            id,
            name,
            email,
            phone,
            role,
            status,
            created_at,
            updated_at
          FROM users
          WHERE id=?
            AND role='customer'
          LIMIT 1
        `,
        [id],
      )
    )[0];

    if (!customer) {
      return fail(res, "Customer not found.", 404);
    }

    const addresses = await query(
      `
        SELECT *
        FROM addresses
        WHERE user_id=?
        ORDER BY is_default DESC,id DESC
      `,
      [id],
    );

    const orders = await query(
      `
        SELECT
          o.id,
          o.order_number,
          o.status,
          o.payment_method,
          o.payment_status,
          o.subtotal,
          o.shipping_amount,
          o.discount_amount,
          o.total_amount,
          o.created_at,
          COALESCE(
            (
              SELECT SUM(oi.quantity)
              FROM order_items oi
              WHERE oi.order_id=o.id
            ),
            0
          ) AS items_count
        FROM orders o
        WHERE o.user_id=?
        ORDER BY o.id DESC
        LIMIT 20
      `,
      [id],
    );

    const summary = (
      await query(
        `
          SELECT
            COUNT(*) AS orders_count,
            COALESCE(
              SUM(
                CASE
                  WHEN payment_status='paid'
                   AND status <> 'cancelled'
                  THEN total_amount
                  ELSE 0
                END
              ),
              0
            ) AS total_spent,
            SUM(CASE WHEN status='pending' THEN 1 ELSE 0 END) AS pending_orders,
            SUM(CASE WHEN status='processing' THEN 1 ELSE 0 END) AS processing_orders,
            SUM(CASE WHEN status='shipped' THEN 1 ELSE 0 END) AS shipped_orders,
            SUM(CASE WHEN status='delivered' THEN 1 ELSE 0 END) AS delivered_orders,
            SUM(CASE WHEN status='cancelled' THEN 1 ELSE 0 END) AS cancelled_orders
          FROM orders
          WHERE user_id=?
        `,
        [id],
      )
    )[0] || {};

    return ok(res, {
      success: true,
      data: {
        ...customer,
        addresses,
        orders: orders.map((order) => ({
          ...order,
          items_count: Number(order.items_count || 0),
        })),
        summary: {
          orders_count: Number(summary.orders_count || 0),
          total_spent: Number(summary.total_spent || 0),
          pending_orders: Number(summary.pending_orders || 0),
          processing_orders: Number(summary.processing_orders || 0),
          shipped_orders: Number(summary.shipped_orders || 0),
          delivered_orders: Number(summary.delivered_orders || 0),
          cancelled_orders: Number(summary.cancelled_orders || 0),
          addresses_count: addresses.length,
        },
      },
    });
  } catch (error) {
    console.error("Customer show error:", error);
    return fail(res, "Unable to load customer.", 500);
  }
}

/*
|--------------------------------------------------------------------------
| Update Customer
|--------------------------------------------------------------------------
*/

export async function update(req, res) {
  try {
    const id = req.params.id;
    const x = req.body || {};

    const existing = (
      await query(
        `
        SELECT id
        FROM users
        WHERE id=?
          AND role='customer'
        LIMIT 1
        `,
        [id],
      )
    )[0];

    if (!existing) {
      return fail(
        res,
        "Customer not found.",
        404,
      );
    }

    if (!x.name || !String(x.name).trim()) {
      return fail(
        res,
        "Name is required.",
        422,
      );
    }

    if (!x.email || !String(x.email).trim()) {
      return fail(
        res,
        "Email is required.",
        422,
      );
    }

    await query(
      `
      UPDATE users
      SET
        name=?,
        email=?,
        phone=?,
        updated_at=NOW()
      WHERE id=?
        AND role='customer'
      `,
      [
        String(x.name).trim(),
        String(x.email).trim(),
        x.phone
          ? String(x.phone).trim()
          : null,
        id,
      ],
    );

    const customer = (
      await query(
        `
        SELECT
          id,
          name,
          email,
          phone,
          role,
          status,
          created_at,
          updated_at
        FROM users
        WHERE id=?
          AND role='customer'
        LIMIT 1
        `,
        [id],
      )
    )[0];

    return ok(res, {
      success: true,
      message: "Customer updated successfully.",
      data: customer,
    });
  } catch (error) {
    console.error(
      "Customer update error:",
      error,
    );

    return fail(
      res,
      "Unable to update customer.",
      500,
    );
  }
}


/*
|--------------------------------------------------------------------------
| Update Customer Status
|--------------------------------------------------------------------------
*/

export async function updateStatus(req, res) {
  try {
    const id = req.params.id;
    const status = req.body?.status;

    if (!["active", "inactive"].includes(status)) {
      return fail(
        res,
        "Invalid status.",
        422,
      );
    }

    const existing = (
      await query(
        `
        SELECT id
        FROM users
        WHERE id=?
          AND role='customer'
        LIMIT 1
        `,
        [id],
      )
    )[0];

    if (!existing) {
      return fail(
        res,
        "Customer not found.",
        404,
      );
    }

    await query(
      `
      UPDATE users
      SET
        status=?,
        updated_at=NOW()
      WHERE id=?
        AND role='customer'
      `,
      [status, id],
    );

    const customer = (
      await query(
        `
          SELECT
            id,
            name,
            email,
            phone,
            role,
            status,
            created_at,
            updated_at
          FROM users
          WHERE id=?
            AND role='customer'
          LIMIT 1
        `,
        [id],
      )
    )[0];

    await audit(req, "customer_status_updated", "customer", id, { status });

    return ok(res, {
      success: true,
      message: "Customer status updated successfully.",
      data: customer,
    });
  } catch (error) {
    console.error(
      "Customer status error:",
      error,
    );

    return fail(
      res,
      "Unable to update customer status.",
      500,
    );
  }
}