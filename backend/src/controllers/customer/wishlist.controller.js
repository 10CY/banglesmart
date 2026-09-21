import { query } from "../../db.js";
import { ok, fail } from "../../utils/http.js";
import { imageUrl } from "../../utils/serialize.js";

/*
|--------------------------------------------------------------------------
| Find / Create Customer Wishlist
|--------------------------------------------------------------------------
*/

async function findOrCreateWishlist(userId) {
  let wishlist = (
    await query(
      `
        SELECT *
        FROM wishlists

        WHERE user_id = ?

        LIMIT 1
      `,
      [userId],
    )
  )[0];

  if (!wishlist) {
    const result = await query(
      `
          INSERT INTO wishlists
          (
            user_id,
            created_at,
            updated_at
          )

          VALUES
          (
            ?,
            NOW(),
            NOW()
          )
        `,
      [userId],
    );

    wishlist = (
      await query(
        `
          SELECT *
          FROM wishlists

          WHERE id = ?

          LIMIT 1
        `,
        [result.insertId],
      )
    )[0];
  }

  return wishlist;
}

/*
|--------------------------------------------------------------------------
| Product Image Resolver
|--------------------------------------------------------------------------
|
| Wishlist is PRODUCT LEVEL.
|
| Do not join product_images directly because:
|
| Product
| ├── General
| ├── Pink
| ├── Black
| └── Maroon
|
| would produce the same wishlist item four times.
|
| Instead we resolve ONE display image using a correlated subquery.
|
| Image Priority:
|
| 1. General Primary
| 2. General First
| 3. Any Primary
| 4. Any Product Image
|
|--------------------------------------------------------------------------
*/

function serializeWishlistItem(row) {
  const mrp = Number(row.mrp || 0);

  const sellingPrice = Number(row.selling_price || 0);

  return {
    id: Number(row.wishlist_item_id),

    wishlist_id: Number(row.wishlist_id),

    product_id: Number(row.product_id),

    created_at: row.wishlist_item_created_at,

    product: {
      id: Number(row.product_id),

      name: row.product_name,

      slug: row.product_slug,

      sku: row.product_sku || null,

      short_description: row.short_description || null,

      description: row.description || null,

      mrp,

      selling_price: sellingPrice,

      featured: Boolean(Number(row.featured || 0)),

      best_seller: Boolean(Number(row.best_seller || 0)),

      new_arrival: Boolean(Number(row.new_arrival || 0)),

      status: row.product_status,

      image: row.image ? imageUrl(row.image) : null,

      primary_image: row.image
        ? {
            image: row.image,

            url: imageUrl(row.image),
          }
        : null,

      category: row.category_id
        ? {
            id: Number(row.category_id),

            name: row.category_name,

            slug: row.category_slug,
          }
        : null,

      material: row.material_id
        ? {
            id: Number(row.material_id),

            name: row.material_name,
          }
        : null,
    },
  };
}

/*
|--------------------------------------------------------------------------
| GET WISHLIST
|--------------------------------------------------------------------------
|
| GET /customer/wishlist
|
|--------------------------------------------------------------------------
*/

export async function index(req, res) {
  try {
    const userId = Number(req.user.id);

    const wishlist = await findOrCreateWishlist(userId);

    /*
    |--------------------------------------------------------------------------
    | IMPORTANT
    |--------------------------------------------------------------------------
    |
    | There is NO:
    |
    | JOIN product_images
    | JOIN product_variants
    | JOIN colors
    |
    | here.
    |
    | Therefore every wishlist_items row appears EXACTLY ONCE.
    |
    |--------------------------------------------------------------------------
    */

    const rows = await query(
      `
          SELECT

            wi.id
              AS wishlist_item_id,

            wi.wishlist_id,

            wi.product_id,

            wi.created_at
              AS wishlist_item_created_at,


            /* -----------------------------------------------------------
               PRODUCT
            ----------------------------------------------------------- */

            p.name
              AS product_name,

            p.slug
              AS product_slug,

            p.sku
              AS product_sku,

            p.short_description,

            p.description,

            p.mrp,

            p.selling_price,

            p.featured,

            p.best_seller,

            p.new_arrival,

            p.status
              AS product_status,


            /* -----------------------------------------------------------
               CATEGORY
            ----------------------------------------------------------- */

            cat.id
              AS category_id,

            cat.name
              AS category_name,

            cat.slug
              AS category_slug,


            /* -----------------------------------------------------------
               MATERIAL
            ----------------------------------------------------------- */

            mat.id
              AS material_id,

            mat.name
              AS material_name,


            /* -----------------------------------------------------------
               ONE PRODUCT IMAGE ONLY
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


          LEFT JOIN categories cat
            ON cat.id =
               p.category_id


          LEFT JOIN materials mat
            ON mat.id =
               p.material_id


          WHERE
            wi.wishlist_id = ?


          ORDER BY
            wi.id DESC
        `,
      [wishlist.id],
    );

    const items = rows.map(serializeWishlistItem);

    return ok(res, {
      success: true,

      data: {
        id: Number(wishlist.id),

        user_id: Number(wishlist.user_id),

        items,

        item_count: items.length,
      },
    });
  } catch (error) {
    console.error("Wishlist index error:", error);

    return fail(res, error?.message || "Unable to load wishlist.", 500);
  }
}

/*
|--------------------------------------------------------------------------
| ADD PRODUCT TO WISHLIST
|--------------------------------------------------------------------------
|
| POST /customer/wishlist
|
| Body:
|
| {
|   product_id: 6
| }
|
|--------------------------------------------------------------------------
*/

export async function store(req, res) {
  try {
    const userId = Number(req.user.id);

    const productId = Number(req.body?.product_id);

    /*
    |--------------------------------------------------------------------------
    | Validate Product ID
    |--------------------------------------------------------------------------
    */

    if (!Number.isInteger(productId) || productId <= 0) {
      return fail(res, "Invalid product ID.", 422);
    }

    /*
    |--------------------------------------------------------------------------
    | Product Exists
    |--------------------------------------------------------------------------
    */

    const product = (
      await query(
        `
          SELECT
            id,
            status

          FROM products

          WHERE id = ?

          LIMIT 1
        `,
        [productId],
      )
    )[0];

    if (!product) {
      return fail(res, "Product not found.", 404);
    }

    if (product.status !== "active") {
      return fail(res, "This product is currently unavailable.", 422);
    }

    /*
    |--------------------------------------------------------------------------
    | Wishlist
    |--------------------------------------------------------------------------
    */

    const wishlist = await findOrCreateWishlist(userId);

    /*
    |--------------------------------------------------------------------------
    | Already Wishlisted?
    |--------------------------------------------------------------------------
    |
    | IMPORTANT:
    |
    | We search only:
    |
    | wishlist_id
    | +
    | product_id
    |
    | NOT variant/color/size.
    |
    |--------------------------------------------------------------------------
    */

    const existing = (
      await query(
        `
          SELECT
            id

          FROM wishlist_items

          WHERE
            wishlist_id = ?

            AND product_id = ?

          LIMIT 1
        `,
        [wishlist.id, productId],
      )
    )[0];

    if (existing) {
      const countRow = (
        await query(
          `
            SELECT
              COUNT(*) AS count

            FROM wishlist_items

            WHERE
              wishlist_id = ?
          `,
          [wishlist.id],
        )
      )[0];

      return ok(res, {
        success: true,

        message: "Product is already in your wishlist.",

        data: {
          wishlist_item_id: Number(existing.id),

          item_count: Number(countRow?.count || 0),
        },
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Insert ONE Product
    |--------------------------------------------------------------------------
    */

    const result = await query(
      `
          INSERT INTO wishlist_items
          (
            wishlist_id,
            product_id,
            created_at,
            updated_at
          )

          VALUES
          (
            ?,
            ?,
            NOW(),
            NOW()
          )
        `,
      [wishlist.id, productId],
    );

    /*
    |--------------------------------------------------------------------------
    | Update Wishlist Timestamp
    |--------------------------------------------------------------------------
    */

    await query(
      `
        UPDATE wishlists

        SET
          updated_at = NOW()

        WHERE id = ?
      `,
      [wishlist.id],
    );

    /*
    |--------------------------------------------------------------------------
    | Count
    |--------------------------------------------------------------------------
    */

    const countRow = (
      await query(
        `
          SELECT
            COUNT(*) AS count

          FROM wishlist_items

          WHERE
            wishlist_id = ?
        `,
        [wishlist.id],
      )
    )[0];

    return ok(
      res,
      {
        success: true,

        message: "Product added to wishlist.",

        data: {
          wishlist_item_id: Number(result.insertId),

          product_id: productId,

          item_count: Number(countRow?.count || 0),
        },
      },
      201,
    );
  } catch (error) {
    console.error("Wishlist store error:", error);

    return fail(
      res,
      error?.message || "Unable to add product to wishlist.",
      500,
    );
  }
}

/*
|--------------------------------------------------------------------------
| CHECK PRODUCT WISHLIST STATUS
|--------------------------------------------------------------------------
|
| GET /customer/wishlist/check/:productId
|
|--------------------------------------------------------------------------
*/

export async function check(req, res) {
  try {
    const userId = Number(req.user.id);

    const productId = Number(
      req.params.productId || req.params.product || req.params.id,
    );

    if (!Number.isInteger(productId) || productId <= 0) {
      return fail(res, "Invalid product ID.", 422);
    }

    /*
    |--------------------------------------------------------------------------
    | Find Wishlist
    |--------------------------------------------------------------------------
    */

    const wishlist = (
      await query(
        `
          SELECT id

          FROM wishlists

          WHERE user_id = ?

          LIMIT 1
        `,
        [userId],
      )
    )[0];

    if (!wishlist) {
      return ok(res, {
        success: true,

        data: {
          wishlisted: false,

          wishlist_item_id: null,
        },
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Product Level Check
    |--------------------------------------------------------------------------
    */

    const item = (
      await query(
        `
          SELECT id

          FROM wishlist_items

          WHERE
            wishlist_id = ?

            AND product_id = ?

          LIMIT 1
        `,
        [wishlist.id, productId],
      )
    )[0];

    return ok(res, {
      success: true,

      data: {
        wishlisted: Boolean(item),

        wishlist_item_id: item ? Number(item.id) : null,
      },
    });
  } catch (error) {
    console.error("Wishlist check error:", error);

    return fail(res, error?.message || "Unable to check wishlist.", 500);
  }
}

/*
|--------------------------------------------------------------------------
| DELETE WISHLIST ITEM
|--------------------------------------------------------------------------
|
| DELETE /customer/wishlist/:id
|
|--------------------------------------------------------------------------
*/

export async function destroy(req, res) {
  try {
    const userId = Number(req.user.id);

    const itemId = Number(req.params.id);

    if (!Number.isInteger(itemId) || itemId <= 0) {
      return fail(res, "Invalid wishlist item.", 422);
    }

    /*
    |--------------------------------------------------------------------------
    | Ensure Item Belongs To Customer
    |--------------------------------------------------------------------------
    */

    const item = (
      await query(
        `
          SELECT
            wi.id,
            wi.wishlist_id,
            wi.product_id

          FROM wishlist_items wi

          INNER JOIN wishlists w
            ON w.id =
               wi.wishlist_id

          WHERE
            wi.id = ?

            AND w.user_id = ?

          LIMIT 1
        `,
        [itemId, userId],
      )
    )[0];

    if (!item) {
      return fail(res, "Wishlist item not found.", 404);
    }

    /*
    |--------------------------------------------------------------------------
    | Delete
    |--------------------------------------------------------------------------
    */

    await query(
      `
        DELETE FROM wishlist_items

        WHERE id = ?
      `,
      [item.id],
    );

    /*
    |--------------------------------------------------------------------------
    | Count
    |--------------------------------------------------------------------------
    */

    const countRow = (
      await query(
        `
          SELECT
            COUNT(*) AS count

          FROM wishlist_items

          WHERE
            wishlist_id = ?
        `,
        [item.wishlist_id],
      )
    )[0];

    return ok(res, {
      success: true,

      message: "Product removed from wishlist.",

      data: {
        product_id: Number(item.product_id),

        item_count: Number(countRow?.count || 0),
      },
    });
  } catch (error) {
    console.error("Wishlist delete error:", error);

    return fail(
      res,
      error?.message || "Unable to remove product from wishlist.",
      500,
    );
  }
}

/*
|--------------------------------------------------------------------------
| CLEAR WISHLIST
|--------------------------------------------------------------------------
*/

export async function clear(req, res) {
  try {
    const userId = Number(req.user.id);

    const wishlist = (
      await query(
        `
          SELECT id

          FROM wishlists

          WHERE user_id = ?

          LIMIT 1
        `,
        [userId],
      )
    )[0];

    if (!wishlist) {
      return ok(res, {
        success: true,

        message: "Wishlist is already empty.",

        data: {
          item_count: 0,
        },
      });
    }

    await query(
      `
        DELETE FROM wishlist_items

        WHERE wishlist_id = ?
      `,
      [wishlist.id],
    );

    await query(
      `
        UPDATE wishlists

        SET
          updated_at = NOW()

        WHERE id = ?
      `,
      [wishlist.id],
    );

    return ok(res, {
      success: true,

      message: "Wishlist cleared.",

      data: {
        item_count: 0,
      },
    });
  } catch (error) {
    console.error("Wishlist clear error:", error);

    return fail(res, error?.message || "Unable to clear wishlist.", 500);
  }
}
