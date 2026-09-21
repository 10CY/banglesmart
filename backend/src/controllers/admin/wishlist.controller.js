import { query } from "../../db.js";
import { ok, fail } from "../../utils/http.js";

/*
|--------------------------------------------------------------------------
| ADMIN WISHLIST LIST
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
    | Wishlist List
    |--------------------------------------------------------------------------
    |
    | COUNT DISTINCT product_id protects against any old duplicate
    | wishlist rows as well.
    |
    |--------------------------------------------------------------------------
    */

    const rows = await query(
      `
          SELECT

            w.id,

            w.user_id,

            w.created_at,

            w.updated_at,


            /* -----------------------------------------------------------
               CUSTOMER
            ----------------------------------------------------------- */

            u.name
              AS customer_name,

            u.email
              AS customer_email,

            u.phone
              AS customer_phone,


            /* -----------------------------------------------------------
               UNIQUE SAVED PRODUCTS
            ----------------------------------------------------------- */

            COUNT(
              DISTINCT wi.product_id
            ) AS item_count,


            MAX(
              wi.updated_at
            ) AS last_item_activity


          FROM wishlists w


          LEFT JOIN users u
            ON u.id =
               w.user_id


          LEFT JOIN wishlist_items wi
            ON wi.wishlist_id =
               w.id


          ${where}


          GROUP BY
            w.id,
            w.user_id,
            w.created_at,
            w.updated_at,
            u.name,
            u.email,
            u.phone


          ORDER BY
            COALESCE(
              MAX(
                wi.updated_at
              ),
              w.updated_at
            ) DESC,

            w.id DESC


          LIMIT 300
        `,
      params,
    );

    /*
    |--------------------------------------------------------------------------
    | Response
    |--------------------------------------------------------------------------
    |
    | Keep data directly as ARRAY.
    |
    |--------------------------------------------------------------------------
    */

    return ok(res, {
      success: true,

      data: rows.map((row) => ({
        ...row,

        id: Number(row.id),

        user_id: Number(row.user_id),

        item_count: Number(row.item_count || 0),
      })),
    });
  } catch (error) {
    console.error("Admin wishlist index error:", error);

    return fail(res, "Unable to load customer wishlists.", 500);
  }
}

/*
|--------------------------------------------------------------------------
| ADMIN WISHLIST DETAIL
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
      return fail(res, "Invalid wishlist ID.", 422);
    }

    /*
    |--------------------------------------------------------------------------
    | Wishlist
    |--------------------------------------------------------------------------
    */

    const wishlist = (
      await query(
        `
          SELECT

            w.*,

            u.name
              AS customer_name,

            u.email
              AS customer_email,

            u.phone
              AS customer_phone


          FROM wishlists w


          INNER JOIN users u
            ON u.id =
               w.user_id


          WHERE
            w.id = ?


          LIMIT 1
        `,
        [id],
      )
    )[0];

    if (!wishlist) {
      return fail(res, "Wishlist not found.", 404);
    }

    /*
    |--------------------------------------------------------------------------
    | Wishlist Items
    |--------------------------------------------------------------------------
    |
    | IMPORTANT FIX
    |--------------------------------------------------------------------------
    |
    | Previously:
    |
    | LEFT JOIN product_images pi
    |   ON pi.product_id=p.id
    |   AND pi.is_primary=1
    |
    | Now a product can have multiple primary images:
    |
    | General
    | Pink
    | Black
    | Maroon
    |
    | so that JOIN duplicated the same wishlist product.
    |
    | Now we use ONE image subquery.
    |
    |--------------------------------------------------------------------------
    */

    const rows = await query(
      `
          SELECT

            wi.id,

            wi.created_at,

            wi.updated_at,


            /* -----------------------------------------------------------
               PRODUCT
            ----------------------------------------------------------- */

            p.id
              AS product_id,

            p.name
              AS product_name,

            p.slug,

            p.mrp,

            p.selling_price,


            /* -----------------------------------------------------------
               ONE DISPLAY IMAGE
            -----------------------------------------------------------
               
               Priority:
               
               1. General Primary
               2. General image
               3. Any primary
               4. Any image
               
            ----------------------------------------------------------- */

            (
              SELECT
                pi.image

              FROM product_images pi

              WHERE
                pi.product_id =
                  p.id

              ORDER BY

                CASE

                  WHEN
                    pi.color_id
                      IS NULL

                    AND
                    pi.is_primary = 1

                    THEN 1


                  WHEN
                    pi.color_id
                      IS NULL

                    THEN 2


                  WHEN
                    pi.is_primary = 1

                    THEN 3


                  ELSE 4

                END ASC,


                pi.sort_order ASC,

                pi.id ASC


              LIMIT 1

            ) AS image


          FROM wishlist_items wi


          INNER JOIN products p
            ON p.id =
               wi.product_id


          WHERE
            wi.wishlist_id = ?


          ORDER BY
            wi.id DESC
        `,
      [id],
    );

    /*
    |--------------------------------------------------------------------------
    | Product-Level Deduplication
    |--------------------------------------------------------------------------
    |
    | Wishlist is product-level:
    |
    | Product #15
    |
    | not:
    |
    | Product #15 Pink
    | Product #15 Black
    | Product #15 Maroon
    |
    | Also protects against any duplicate legacy DB rows.
    |
    |--------------------------------------------------------------------------
    */

    const productMap = new Map();

    for (const item of rows) {
      const productId = Number(item.product_id);

      if (!productMap.has(productId)) {
        productMap.set(productId, item);
      }
    }

    const items = Array.from(productMap.values()).map((item) => ({
      ...item,

      id: Number(item.id),

      product_id: Number(item.product_id),

      mrp: Number(item.mrp || 0),

      selling_price: Number(item.selling_price || 0),
    }));

    /*
    |--------------------------------------------------------------------------
    | Response
    |--------------------------------------------------------------------------
    |
    | Keep EXACT same structure expected by current admin detail page:
    |
    | data: {
    |   ...wishlist,
    |   items: []
    | }
    |
    |--------------------------------------------------------------------------
    */

    return ok(res, {
      success: true,

      data: {
        ...wishlist,

        id: Number(wishlist.id),

        user_id: Number(wishlist.user_id),

        items,
      },
    });
  } catch (error) {
    console.error("Admin wishlist show error:", error);

    return fail(res, "Unable to load wishlist.", 500);
  }
}
