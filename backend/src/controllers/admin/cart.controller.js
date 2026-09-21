import { query } from "../../db.js";
import { ok, fail } from "../../utils/http.js";

/*
|--------------------------------------------------------------------------
| ADMIN CART LIST
|--------------------------------------------------------------------------
*/

export async function index(req, res) {
  try {
    const search = String(req.query.search || "").trim();

    const params = [];

    let where = `
      WHERE 1=1
    `;

    /*
    |--------------------------------------------------------------------------
    | Search
    |--------------------------------------------------------------------------
    */

    if (search) {
      const like = `%${search}%`;

      where += `
        AND (
          u.name LIKE ?
          OR u.email LIKE ?
          OR u.phone LIKE ?
        )
      `;

      params.push(like, like, like);
    }

    /*
    |--------------------------------------------------------------------------
    | Cart List
    |--------------------------------------------------------------------------
    |
    | This query is safe because:
    |
    | carts
    | → cart_items
    | → product_variants
    |
    | Each cart item has one variant.
    |
    | No product_images join here.
    |
    |--------------------------------------------------------------------------
    */

    const rows = await query(
      `
          SELECT

            c.id,
            c.user_id,
            c.status,
            c.created_at,
            c.updated_at,

            u.name
              AS customer_name,

            u.email
              AS customer_email,

            u.phone
              AS customer_phone,

            COUNT(ci.id)
              AS line_count,

            COALESCE(
              SUM(ci.quantity),
              0
            ) AS item_count,

            COALESCE(
              SUM(
                ci.quantity *
                pv.selling_price
              ),
              0
            ) AS cart_value,

            MAX(ci.updated_at)
              AS last_item_activity


          FROM carts c


          LEFT JOIN users u
            ON u.id =
               c.user_id


          LEFT JOIN cart_items ci
            ON ci.cart_id =
               c.id


          LEFT JOIN product_variants pv
            ON pv.id =
               ci.product_variant_id


          ${where}


          GROUP BY
            c.id,
            c.user_id,
            c.status,
            c.created_at,
            c.updated_at,
            u.name,
            u.email,
            u.phone


          ORDER BY
            COALESCE(
              MAX(ci.updated_at),
              c.updated_at
            ) DESC,

            c.id DESC


          LIMIT 300
        `,
      params,
    );

    /*
    |--------------------------------------------------------------------------
    | Response
    |--------------------------------------------------------------------------
    |
    | IMPORTANT:
    |
    | Keep data directly as ARRAY because your existing admin page expects:
    |
    | data.data.map(...)
    |
    |--------------------------------------------------------------------------
    */

    return ok(res, {
      success: true,

      data: rows.map((row) => ({
        ...row,

        id: Number(row.id),

        user_id: row.user_id ? Number(row.user_id) : null,

        line_count: Number(row.line_count || 0),

        item_count: Number(row.item_count || 0),

        cart_value: Number(row.cart_value || 0),
      })),
    });
  } catch (error) {
    console.error("Admin cart index error:", error);

    return fail(res, "Unable to load customer carts.", 500);
  }
}

/*
|--------------------------------------------------------------------------
| ADMIN CART DETAIL
|--------------------------------------------------------------------------
*/

export async function show(req, res) {
  try {
    const id = Number(req.params.id);

    /*
    |--------------------------------------------------------------------------
    | Validate
    |--------------------------------------------------------------------------
    */

    if (!Number.isInteger(id) || id <= 0) {
      return fail(res, "Invalid cart ID.", 422);
    }

    /*
    |--------------------------------------------------------------------------
    | Cart
    |--------------------------------------------------------------------------
    */

    const cart = (
      await query(
        `
          SELECT

            c.*,

            u.name
              AS customer_name,

            u.email
              AS customer_email,

            u.phone
              AS customer_phone


          FROM carts c


          LEFT JOIN users u
            ON u.id =
               c.user_id


          WHERE
            c.id = ?


          LIMIT 1
        `,
        [id],
      )
    )[0];

    if (!cart) {
      return fail(res, "Cart not found.", 404);
    }

    /*
    |--------------------------------------------------------------------------
    | Cart Items
    |--------------------------------------------------------------------------
    |
    | IMPORTANT FIX
    |--------------------------------------------------------------------------
    |
    | DO NOT JOIN product_images directly.
    |
    | Because now this product can have:
    |
    | General Primary
    | Pink Primary
    | Black Primary
    | Maroon Primary
    |
    | A normal JOIN with:
    |
    | pi.is_primary = 1
    |
    | returns multiple rows for ONE cart item.
    |
    | Instead we use correlated subqueries and LIMIT 1.
    |
    |--------------------------------------------------------------------------
    |
    | IMAGE PRIORITY
    |
    | 1. Design + selected color
    | 2. Product + selected color
    | 3. General design image
    | 4. General product image
    | 5. Any design image
    | 6. Any product image
    |
    |--------------------------------------------------------------------------
    */

    const items = await query(
      `
          SELECT

            /* -----------------------------------------------------------
               CART ITEM
            ----------------------------------------------------------- */

            ci.id,

            ci.quantity,

            ci.design_option_id,

            ci.created_at,

            ci.updated_at,


            /* -----------------------------------------------------------
               VARIANT
            ----------------------------------------------------------- */

            pv.id
              AS variant_id,

            pv.sku,

            pv.mrp,

            pv.selling_price,

            pv.size_id,

            pv.color_id,


            /* -----------------------------------------------------------
               PRODUCT
            ----------------------------------------------------------- */

            p.id
              AS product_id,

            p.name
              AS product_name,

            p.slug
              AS product_slug,


            /* -----------------------------------------------------------
               SIZE
            ----------------------------------------------------------- */

            COALESCE(
              s.display_name,
              s.name
            ) AS size_name,


            /* -----------------------------------------------------------
               COLOR
            ----------------------------------------------------------- */

            COALESCE(
              c.display_name,
              c.name
            ) AS color_name,

            c.hex_code,


            /* -----------------------------------------------------------
               DESIGN
            ----------------------------------------------------------- */

            pdo.label
              AS design_label,


            /* -----------------------------------------------------------
               CORRECT SINGLE IMAGE
            ----------------------------------------------------------- */

            COALESCE(

              /* =========================================================
                 1. DESIGN + COLOR
              ========================================================= */

              (
                SELECT
                  pdi1.image

                FROM product_design_images pdi1

                WHERE
                  pdi1.design_option_id =
                    ci.design_option_id

                  AND
                  pdi1.color_id =
                    pv.color_id

                ORDER BY
                  pdi1.is_primary DESC,
                  pdi1.sort_order ASC,
                  pdi1.id ASC

                LIMIT 1
              ),


              /* =========================================================
                 2. PRODUCT + COLOR
              ========================================================= */

              (
                SELECT
                  pi1.image

                FROM product_images pi1

                WHERE
                  pi1.product_id =
                    p.id

                  AND
                  pi1.color_id =
                    pv.color_id

                ORDER BY
                  pi1.is_primary DESC,
                  pi1.sort_order ASC,
                  pi1.id ASC

                LIMIT 1
              ),


              /* =========================================================
                 3. GENERAL DESIGN
              ========================================================= */

              (
                SELECT
                  pdi2.image

                FROM product_design_images pdi2

                WHERE
                  pdi2.design_option_id =
                    ci.design_option_id

                  AND
                  pdi2.color_id
                    IS NULL

                ORDER BY
                  pdi2.is_primary DESC,
                  pdi2.sort_order ASC,
                  pdi2.id ASC

                LIMIT 1
              ),


              /* =========================================================
                 4. GENERAL PRODUCT
              ========================================================= */

              (
                SELECT
                  pi2.image

                FROM product_images pi2

                WHERE
                  pi2.product_id =
                    p.id

                  AND
                  pi2.color_id
                    IS NULL

                ORDER BY
                  pi2.is_primary DESC,
                  pi2.sort_order ASC,
                  pi2.id ASC

                LIMIT 1
              ),


              /* =========================================================
                 5. ANY DESIGN IMAGE
              ========================================================= */

              (
                SELECT
                  pdi3.image

                FROM product_design_images pdi3

                WHERE
                  pdi3.design_option_id =
                    ci.design_option_id

                ORDER BY
                  pdi3.is_primary DESC,
                  pdi3.sort_order ASC,
                  pdi3.id ASC

                LIMIT 1
              ),


              /* =========================================================
                 6. ANY PRODUCT IMAGE
              ========================================================= */

              (
                SELECT
                  pi3.image

                FROM product_images pi3

                WHERE
                  pi3.product_id =
                    p.id

                ORDER BY

                  CASE

                    WHEN
                      pi3.color_id
                        IS NULL
                      AND
                      pi3.is_primary = 1

                      THEN 1


                    WHEN
                      pi3.color_id
                        IS NULL

                      THEN 2


                    WHEN
                      pi3.is_primary = 1

                      THEN 3


                    ELSE 4

                  END ASC,

                  pi3.sort_order ASC,

                  pi3.id ASC

                LIMIT 1
              )

            ) AS image


          FROM cart_items ci


          /* -------------------------------------------------------------
             VARIANT
          ------------------------------------------------------------- */

          INNER JOIN product_variants pv
            ON pv.id =
               ci.product_variant_id


          /* -------------------------------------------------------------
             PRODUCT
          ------------------------------------------------------------- */

          INNER JOIN products p
            ON p.id =
               pv.product_id


          /* -------------------------------------------------------------
             SIZE
          ------------------------------------------------------------- */

          LEFT JOIN sizes s
            ON s.id =
               pv.size_id


          /* -------------------------------------------------------------
             COLOR
          ------------------------------------------------------------- */

          LEFT JOIN colors c
            ON c.id =
               pv.color_id


          /* -------------------------------------------------------------
             DESIGN
          ------------------------------------------------------------- */

          LEFT JOIN product_design_options pdo
            ON pdo.id =
               ci.design_option_id

            AND pdo.product_id =
                p.id


          WHERE
            ci.cart_id = ?


          ORDER BY
            ci.id DESC
        `,
      [id],
    );

    /*
    |--------------------------------------------------------------------------
    | Defensive Deduplication
    |--------------------------------------------------------------------------
    |
    | SQL should already return exactly one row per cart item.
    |
    | Still keep this protection so the frontend never receives
    | duplicate cart_item IDs.
    |
    |--------------------------------------------------------------------------
    */

    const uniqueItems = Array.from(
      new Map(items.map((item) => [Number(item.id), item])).values(),
    );

    /*
    |--------------------------------------------------------------------------
    | Response
    |--------------------------------------------------------------------------
    |
    | Keep same response structure as your original code.
    |
    |--------------------------------------------------------------------------
    */

    return ok(res, {
      success: true,

      data: {
        ...cart,

        id: Number(cart.id),

        user_id: cart.user_id ? Number(cart.user_id) : null,

        items: uniqueItems.map((item) => ({
          ...item,

          id: Number(item.id),

          variant_id: Number(item.variant_id),

          product_id: Number(item.product_id),

          design_option_id: item.design_option_id
            ? Number(item.design_option_id)
            : null,

          quantity: Number(item.quantity || 0),

          selling_price: Number(item.selling_price || 0),

          mrp: Number(item.mrp || 0),

          line_total:
            Number(item.selling_price || 0) * Number(item.quantity || 0),
        })),
      },
    });
  } catch (error) {
    console.error("Admin cart show error:", error);

    return fail(res, "Unable to load cart.", 500);
  }
}
