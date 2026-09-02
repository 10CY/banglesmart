import { query } from "../../db.js";
import { ok, fail } from "../../utils/http.js";

const fields = [
  "code",
  "type",
  "value",
  "minimum_order_amount",
  "maximum_discount_amount",
  "usage_limit",
  "per_user_limit",
  "starts_at",
  "expires_at",
  "status",
];

/**
 * GET /api/admin/coupons
 *
 * Supports:
 * ?search=SAVE
 * ?type=fixed
 * ?type=percentage
 * ?status=active
 * ?status=inactive
 * ?page=1
 * ?per_page=20
 */
export async function index(req, res) {
  try {
    const search = String(req.query.search || "").trim();
    const type = String(req.query.type || "").trim();
    const status = String(req.query.status || "").trim();

    let page = Number(req.query.page || 1);
    let perPage = Number(req.query.per_page || 20);

    if (!Number.isFinite(page) || page < 1) {
      page = 1;
    }

    if (!Number.isFinite(perPage) || perPage < 1) {
      perPage = 20;
    }

    // Prevent unnecessarily large queries.
    perPage = Math.min(perPage, 100);

    const offset = (page - 1) * perPage;

    const where = [];
    const params = [];

    /*
    |--------------------------------------------------------------------------
    | Search
    |--------------------------------------------------------------------------
    */

    if (search) {
      where.push("code LIKE ?");
      params.push(`%${search}%`);
    }

    /*
    |--------------------------------------------------------------------------
    | Type
    |--------------------------------------------------------------------------
    */

    if (type && ["fixed", "percentage"].includes(type)) {
      where.push("type = ?");
      params.push(type);
    }

    /*
    |--------------------------------------------------------------------------
    | Status
    |--------------------------------------------------------------------------
    */

    if (status && ["active", "inactive"].includes(status)) {
      where.push("status = ?");
      params.push(status);
    }

    const whereSql =
      where.length > 0
        ? `WHERE ${where.join(" AND ")}`
        : "";

    /*
    |--------------------------------------------------------------------------
    | Total Count
    |--------------------------------------------------------------------------
    */

    const countRows = await query(
      `SELECT COUNT(*) AS total
       FROM coupons
       ${whereSql}`,
      params,
    );

    const total = Number(countRows[0]?.total || 0);

    /*
    |--------------------------------------------------------------------------
    | Coupon Data
    |--------------------------------------------------------------------------
    |
    | usages_count is returned as 0 for now because your current
    | coupon controller does not show a coupon-usage table/relation.
    |
    | When you have a coupon usage table, this can be replaced
    | with the actual COUNT().
    |
    */

    const rows = await query(
      `SELECT
        c.*,
        (
          SELECT COUNT(*)
          FROM coupon_usages cu
          WHERE cu.coupon_id = c.id
        ) AS usages_count
       FROM coupons c
       ${whereSql}
       ORDER BY c.id DESC
       LIMIT ? OFFSET ?`,
      [...params, perPage, offset],
    );

    const lastPage =
      total > 0
        ? Math.ceil(total / perPage)
        : 1;

    return ok(res, {
      success: true,

      data: {
        data: rows,

        current_page: page,

        last_page: lastPage,

        per_page: perPage,

        total: total,
      },
    });
  } catch (error) {
    console.error("Coupon index error:", error);

    return fail(
      res,
      "Unable to load coupons.",
      500,
    );
  }
}


/**
 * POST /api/admin/coupons
 */
export async function store(req, res) {
  try {
    const x = req.body || {};

    /*
    |--------------------------------------------------------------------------
    | Validation
    |--------------------------------------------------------------------------
    */

    if (!String(x.code || "").trim()) {
      return fail(
        res,
        "Coupon code is required.",
        422,
      );
    }

    const code = String(x.code)
      .trim()
      .toUpperCase();

    const type =
      x.type === "percentage"
        ? "percentage"
        : "fixed";

    const value = Number(x.value || 0);

    if (!Number.isFinite(value) || value <= 0) {
      return fail(
        res,
        "Discount value must be greater than 0.",
        422,
      );
    }

    if (
      type === "percentage" &&
      value > 100
    ) {
      return fail(
        res,
        "Percentage discount cannot exceed 100%.",
        422,
      );
    }

    /*
    |--------------------------------------------------------------------------
    | Duplicate Code
    |--------------------------------------------------------------------------
    */

    const existing = await query(
      "SELECT id FROM coupons WHERE code=? LIMIT 1",
      [code],
    );

    if (existing.length > 0) {
      return fail(
        res,
        "Coupon code already exists.",
        422,
      );
    }

    /*
    |--------------------------------------------------------------------------
    | Values
    |--------------------------------------------------------------------------
    */

    const minimumOrder =
      x.minimum_order_amount === null ||
      x.minimum_order_amount === undefined ||
      x.minimum_order_amount === ""
        ? 0
        : Number(x.minimum_order_amount);

    const maximumDiscount =
      x.maximum_discount_amount === null ||
      x.maximum_discount_amount === undefined ||
      x.maximum_discount_amount === ""
        ? null
        : Number(x.maximum_discount_amount);

    const usageLimit =
      x.usage_limit === null ||
      x.usage_limit === undefined ||
      x.usage_limit === ""
        ? null
        : Number(x.usage_limit);

    const perUserLimit =
      Number(x.per_user_limit || 1);

    const startsAt =
      x.starts_at || null;

    const expiresAt =
      x.expires_at || null;

    const status =
      ["active", "inactive"].includes(
        x.status,
      )
        ? x.status
        : "active";

    /*
    |--------------------------------------------------------------------------
    | Insert
    |--------------------------------------------------------------------------
    */

    const result = await query(
      `INSERT INTO coupons
      (
        code,
        type,
        value,
        minimum_order_amount,
        maximum_discount_amount,
        usage_limit,
        per_user_limit,
        starts_at,
        expires_at,
        status,
        created_at,
        updated_at
      )
      VALUES
      (
        ?,
        ?,
        ?,
        ?,
        ?,
        ?,
        ?,
        ?,
        ?,
        ?,
        NOW(),
        NOW()
      )`,
      [
        code,
        type,
        value,
        minimumOrder,
        maximumDiscount,
        usageLimit,
        perUserLimit,
        startsAt,
        expiresAt,
        status,
      ],
    );

    const coupon = (
      await query(
        "SELECT * FROM coupons WHERE id=?",
        [result.insertId],
      )
    )[0];

    return ok(
      res,
      {
        success: true,
        message:
          "Coupon created successfully.",
        data: coupon,
      },
      201,
    );
  } catch (error) {
    console.error(
      "Coupon store error:",
      error,
    );

    return fail(
      res,
      "Unable to create coupon.",
      500,
    );
  }
}


/**
 * GET /api/admin/coupons/:id
 */
export async function show(req, res) {
  try {
    const coupon = (
      await query(
        "SELECT * FROM coupons WHERE id=?",
        [req.params.id],
      )
    )[0];

    if (!coupon) {
      return fail(
        res,
        "Coupon not found.",
        404,
      );
    }

    return ok(res, {
      success: true,
      data: coupon,
    });
  } catch (error) {
    console.error(
      "Coupon show error:",
      error,
    );

    return fail(
      res,
      "Unable to load coupon.",
      500,
    );
  }
}


/**
 * PUT /api/admin/coupons/:id
 */
export async function update(req, res) {
  try {
    const id = req.params.id;
    const x = req.body || {};

    const old = (
      await query(
        "SELECT * FROM coupons WHERE id=?",
        [id],
      )
    )[0];

    if (!old) {
      return fail(
        res,
        "Coupon not found.",
        404,
      );
    }

    /*
    |--------------------------------------------------------------------------
    | Values
    |--------------------------------------------------------------------------
    */

    const code = String(
      x.code ?? old.code,
    )
      .trim()
      .toUpperCase();

    if (!code) {
      return fail(
        res,
        "Coupon code is required.",
        422,
      );
    }

    const type =
      x.type ??
      old.type ??
      "fixed";

    if (
      !["fixed", "percentage"].includes(
        type,
      )
    ) {
      return fail(
        res,
        "Invalid coupon type.",
        422,
      );
    }

    const value = Number(
      x.value ?? old.value ?? 0,
    );

    if (!Number.isFinite(value) || value <= 0) {
      return fail(
        res,
        "Discount value must be greater than 0.",
        422,
      );
    }

    if (
      type === "percentage" &&
      value > 100
    ) {
      return fail(
        res,
        "Percentage discount cannot exceed 100%.",
        422,
      );
    }

    /*
    |--------------------------------------------------------------------------
    | Duplicate Code
    |--------------------------------------------------------------------------
    */

    const duplicate = await query(
      `SELECT id
       FROM coupons
       WHERE code=?
       AND id!=?
       LIMIT 1`,
      [code, id],
    );

    if (duplicate.length > 0) {
      return fail(
        res,
        "Coupon code already exists.",
        422,
      );
    }

    /*
    |--------------------------------------------------------------------------
    | Other Fields
    |--------------------------------------------------------------------------
    */

    const minimumOrder =
      x.minimum_order_amount === null ||
      x.minimum_order_amount === undefined ||
      x.minimum_order_amount === ""
        ? 0
        : Number(
            x.minimum_order_amount ??
              old.minimum_order_amount ??
              0,
          );

    const maximumDiscount =
      x.maximum_discount_amount === null ||
      x.maximum_discount_amount === undefined ||
      x.maximum_discount_amount === ""
        ? null
        : Number(
            x.maximum_discount_amount,
          );

    const usageLimit =
      x.usage_limit === null ||
      x.usage_limit === undefined ||
      x.usage_limit === ""
        ? null
        : Number(x.usage_limit);

    const perUserLimit = Number(
      x.per_user_limit ??
        old.per_user_limit ??
        1,
    );

    const startsAt =
      x.starts_at !== undefined
        ? x.starts_at || null
        : old.starts_at;

    const expiresAt =
      x.expires_at !== undefined
        ? x.expires_at || null
        : old.expires_at;

    const status =
      ["active", "inactive"].includes(
        x.status,
      )
        ? x.status
        : old.status;

    /*
    |--------------------------------------------------------------------------
    | Update
    |--------------------------------------------------------------------------
    */

    await query(
      `UPDATE coupons SET
        code=?,
        type=?,
        value=?,
        minimum_order_amount=?,
        maximum_discount_amount=?,
        usage_limit=?,
        per_user_limit=?,
        starts_at=?,
        expires_at=?,
        status=?,
        updated_at=NOW()
       WHERE id=?`,
      [
        code,
        type,
        value,
        minimumOrder,
        maximumDiscount,
        usageLimit,
        perUserLimit,
        startsAt,
        expiresAt,
        status,
        id,
      ],
    );

    const coupon = (
      await query(
        "SELECT * FROM coupons WHERE id=?",
        [id],
      )
    )[0];

    return ok(res, {
      success: true,
      message:
        "Coupon updated successfully.",
      data: coupon,
    });
  } catch (error) {
    console.error(
      "Coupon update error:",
      error,
    );

    return fail(
      res,
      "Unable to update coupon.",
      500,
    );
  }
}


/**
 * DELETE /api/admin/coupons/:id
 */
export async function destroy(req, res) {
  try {
    const id = req.params.id;

    const existing = (
      await query(
        "SELECT id FROM coupons WHERE id=?",
        [id],
      )
    )[0];

    if (!existing) {
      return fail(
        res,
        "Coupon not found.",
        404,
      );
    }

    await query(
      "DELETE FROM coupons WHERE id=?",
      [id],
    );

    return ok(res, {
      success: true,
      message:
        "Coupon deleted successfully.",
    });
  } catch (error) {
    console.error(
      "Coupon delete error:",
      error,
    );

    return fail(
      res,
      "Unable to delete coupon.",
      500,
    );
  }
}