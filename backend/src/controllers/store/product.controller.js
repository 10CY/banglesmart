import { query } from "../../db.js";
import { ok, fail } from "../../utils/http.js";
import { imageUrl } from "../../utils/serialize.js";

/*
|--------------------------------------------------------------------------
| Product serializer
|--------------------------------------------------------------------------
*/

function product(p, images = []) {
  return {
    ...p,

    mrp: Number(p.mrp || 0),
    selling_price: Number(p.selling_price || 0),

    featured: !!p.featured,
    best_seller: !!p.best_seller,
    new_arrival: !!p.new_arrival,

    /*
    |--------------------------------------------------------------------------
    | Category
    |--------------------------------------------------------------------------
    */

    category:
      p.category_id
        ? {
            id: Number(p.category_id),
            name: p.category_name || "",
            slug: p.category_slug || "",
          }
        : null,

    /*
    |--------------------------------------------------------------------------
    | Primary image
    |--------------------------------------------------------------------------
    */

    primary_image:
      images.find(
        (x) =>
          Number(x.is_primary) === 1 ||
          x.is_primary === true
      ) ||
      images[0] ||
      null,

    /*
    |--------------------------------------------------------------------------
    | Images
    |--------------------------------------------------------------------------
    */

    images: images.map((i) => ({
      id: Number(i.id),
      product_id: Number(i.product_id),
      image: i.image,
      alt_text: i.alt_text || null,
      is_primary:
        Number(i.is_primary) === 1 ||
        i.is_primary === true,
      sort_order: Number(i.sort_order || 0),

      /*
      | Frontend should use this URL directly.
      */
      url: imageUrl(i.image),
    })),
  };
}

/*
|--------------------------------------------------------------------------
| Serialize variants
|--------------------------------------------------------------------------
|
| IMPORTANT:
| Frontend expects:
|
| variant.size
| variant.color
| variant.inventory
|
*/

function serializeVariant(v) {
  const quantity =
    v.quantity === null ||
    v.quantity === undefined
      ? 0
      : Number(v.quantity);

  const reservedQuantity =
    v.reserved_quantity === null ||
    v.reserved_quantity === undefined
      ? 0
      : Number(v.reserved_quantity);

  const availableQuantity =
    Math.max(
      0,
      quantity - reservedQuantity
    );

  return {
    id: Number(v.id),

    size_id:
      v.size_id !== null &&
      v.size_id !== undefined
        ? Number(v.size_id)
        : null,

    color_id:
      v.color_id !== null &&
      v.color_id !== undefined
        ? Number(v.color_id)
        : null,

    sku: v.sku || "",

    mrp: Number(v.mrp || 0),

    selling_price:
      Number(v.selling_price || 0),

    status:
      v.status || "active",

    /*
    |--------------------------------------------------------------------------
    | Size
    |--------------------------------------------------------------------------
    */

    size:
      v.size_id
        ? {
            id: Number(v.size_id),
            name: v.size_name || "",
            display_name:
              v.size_display_name ||
              v.size_name ||
              null,
          }
        : null,

    /*
    |--------------------------------------------------------------------------
    | Color
    |--------------------------------------------------------------------------
    */

    color:
      v.color_id
        ? {
            id: Number(v.color_id),
            name: v.color_name || "",
            display_name:
              v.color_display_name ||
              v.color_name ||
              null,
            hex_code:
              v.color_hex_code ||
              v.hex_code ||
              null,
          }
        : null,

    /*
    |--------------------------------------------------------------------------
    | Inventory
    |--------------------------------------------------------------------------
    */

    inventory:
      v.inventory_id ||
      v.quantity !== null ||
      v.reserved_quantity !== null
        ? {
            quantity,
            reserved_quantity:
              reservedQuantity,
            available_quantity:
              availableQuantity,
          }
        : null,
  };
}

/*
|--------------------------------------------------------------------------
| GET /store/products
|--------------------------------------------------------------------------
*/

export async function index(req, res) {
  try {
    let sql = `
      SELECT
        p.*,
        c.name AS category_name,
        c.slug AS category_slug
      FROM products p
      LEFT JOIN categories c
        ON c.id = p.category_id
      WHERE p.status = 'active'
    `;

    const ps = [];

    /*
    |--------------------------------------------------------------------------
    | Search
    |--------------------------------------------------------------------------
    */

    if (req.query.search) {
      sql += `
        AND (
          p.name LIKE ?
          OR p.short_description LIKE ?
          OR p.sku LIKE ?
        )
      `;

      const s =
        `%${req.query.search}%`;

      ps.push(
        s,
        s,
        s
      );
    }

    /*
    |--------------------------------------------------------------------------
    | Category
    |--------------------------------------------------------------------------
    */

    if (req.query.category_id) {
      sql += `
        AND p.category_id = ?
      `;

      ps.push(
        req.query.category_id
      );
    } else if (req.query.category) {
      const categoryRows =
        await query(
          `
            SELECT id
            FROM categories
            WHERE slug = ?
              AND status = 'active'
            LIMIT 1
          `,
          [req.query.category]
        );

      if (
        categoryRows.length === 0
      ) {
        return ok(res, {
          success: true,
          data: [],
          meta: {
            total: 0,
          },
        });
      }

      const categoryId =
        Number(
          categoryRows[0].id
        );

      sql += `
        AND (
          p.category_id = ?
          OR p.category_id IN (
            SELECT id
            FROM categories
            WHERE parent_id = ?
              AND status = 'active'
          )
        )
      `;

      ps.push(
        categoryId,
        categoryId
      );
    }

    /*
    |--------------------------------------------------------------------------
    | Price
    |--------------------------------------------------------------------------
    */

    if (req.query.min_price) {
      sql += `
        AND p.selling_price >= ?
      `;

      ps.push(
        req.query.min_price
      );
    }

    if (req.query.max_price) {
      sql += `
        AND p.selling_price <= ?
      `;

      ps.push(
        req.query.max_price
      );
    }

    /*
    |--------------------------------------------------------------------------
    | Flags
    |--------------------------------------------------------------------------
    */

    for (const f of [
      "featured",
      "best_seller",
      "new_arrival",
    ]) {
      if (
        ["1", "true"].includes(
          String(req.query[f])
        )
      ) {
        sql += `
          AND p.${f} = 1
        `;
      }
    }

    /*
    |--------------------------------------------------------------------------
    | Sorting
    |--------------------------------------------------------------------------
    */

    const sort =
      req.query.sort === "price_low"
        ? "p.selling_price ASC"
        : req.query.sort === "price_high"
          ? "p.selling_price DESC"
          : req.query.sort === "oldest"
            ? "p.id ASC"
            : "p.id DESC";

    sql += `
      ORDER BY ${sort}
    `;

    /*
    |--------------------------------------------------------------------------
    | Products
    |--------------------------------------------------------------------------
    */

    const rows =
      await query(
        sql,
        ps
      );

    /*
    |--------------------------------------------------------------------------
    | Images
    |--------------------------------------------------------------------------
    */

    for (const p of rows) {
      p.images =
        await query(
          `
            SELECT *
            FROM product_images
            WHERE product_id = ?
            ORDER BY
              is_primary DESC,
              sort_order,
              id
          `,
          [p.id]
        );
    }

    /*
    |--------------------------------------------------------------------------
    | Response
    |--------------------------------------------------------------------------
    */

    return ok(res, {
      success: true,

      data: rows.map(
        (p) =>
          product(
            p,
            p.images
          )
      ),

      meta: {
        total:
          rows.length,
      },
    });
  } catch (error) {
    console.error(
      "Store products error:",
      error
    );

    return fail(
      res,
      "Unable to load products.",
      500
    );
  }
}

/*
|--------------------------------------------------------------------------
| GET /store/products/:slug
|--------------------------------------------------------------------------
*/

export async function show(req, res) {
  try {
    /*
    |--------------------------------------------------------------------------
    | Product
    |--------------------------------------------------------------------------
    */

    const p =
      (
        await query(
          `
            SELECT
              p.*,
              c.name AS category_name,
              c.slug AS category_slug
            FROM products p
            LEFT JOIN categories c
              ON c.id = p.category_id
            WHERE p.slug = ?
              AND p.status = 'active'
            LIMIT 1
          `,
          [req.params.slug]
        )
      )[0];

    if (!p) {
      return fail(
        res,
        "Product not found.",
        404
      );
    }

    /*
    |--------------------------------------------------------------------------
    | Images
    |--------------------------------------------------------------------------
    */

    const images =
      await query(
        `
          SELECT *
          FROM product_images
          WHERE product_id = ?
          ORDER BY
            is_primary DESC,
            sort_order,
            id
        `,
        [p.id]
      );

    /*
    |--------------------------------------------------------------------------
    | Variants
    |--------------------------------------------------------------------------
    |
    | IMPORTANT:
    | Return nested size/color/inventory objects.
    |
    */

    const variantRows =
      await query(
        `
          SELECT
            pv.id,
            pv.product_id,
            pv.size_id,
            pv.color_id,
            pv.sku,
            pv.mrp,
            pv.selling_price,
            pv.status,

            s.name AS size_name,
            s.display_name AS size_display_name,

            c.name AS color_name,
            c.display_name AS color_display_name,
            c.hex_code AS color_hex_code,

            i.id AS inventory_id,
            i.quantity,
            i.reserved_quantity

          FROM product_variants pv

          LEFT JOIN sizes s
            ON s.id = pv.size_id

          LEFT JOIN colors c
            ON c.id = pv.color_id

          LEFT JOIN inventories i
            ON i.product_variant_id = pv.id

          WHERE pv.product_id = ?
            AND pv.status = 'active'

          ORDER BY
            pv.id ASC
        `,
        [p.id]
      );

    const variants =
      variantRows.map(
        serializeVariant
      );

    /*
    |--------------------------------------------------------------------------
    | Reviews
    |--------------------------------------------------------------------------
    */

    const reviews =
      await query(
        `
          SELECT
            r.*,
            u.name AS user_name

          FROM reviews r

          JOIN users u
            ON u.id = r.user_id

          WHERE r.product_id = ?
            AND r.status = 'approved'

          ORDER BY
            r.id DESC
        `,
        [p.id]
      );

    /*
    |--------------------------------------------------------------------------
    | Review statistics
    |--------------------------------------------------------------------------
    */

    const reviewStats =
      await query(
        `
          SELECT
            COUNT(*) AS review_count,
            COALESCE(
              AVG(rating),
              0
            ) AS review_average

          FROM reviews

          WHERE product_id = ?
            AND status = 'approved'
        `,
        [p.id]
      );

    const reviewCount =
      Number(
        reviewStats[0]?.review_count ||
          0
      );

    const reviewAverage =
      Number(
        reviewStats[0]?.review_average ||
          0
      );

    /*
    |--------------------------------------------------------------------------
    | Recommended products
    |--------------------------------------------------------------------------
    |
    | Same category.
    | Current product excluded.
    */

    let recommended =
      [];

    if (p.category_id) {
      const recommendedRows =
        await query(
          `
            SELECT
              p.*,
              c.name AS category_name,
              c.slug AS category_slug

            FROM products p

            LEFT JOIN categories c
              ON c.id = p.category_id

            WHERE p.status = 'active'
              AND p.category_id = ?
              AND p.id <> ?

            ORDER BY
              p.best_seller DESC,
              p.featured DESC,
              p.new_arrival DESC,
              p.id DESC

            LIMIT 4
          `,
          [
            p.category_id,
            p.id,
          ]
        );

      /*
      |----------------------------------------------------------------------
      | Load recommendation images
      |----------------------------------------------------------------------
      */

      for (
        const recommendation
        of recommendedRows
      ) {
        recommendation.images =
          await query(
            `
              SELECT *
              FROM product_images

              WHERE product_id = ?

              ORDER BY
                is_primary DESC,
                sort_order,
                id
            `,
            [
              recommendation.id,
            ]
          );
      }

      recommended =
        recommendedRows.map(
          (recommendation) =>
            product(
              recommendation,
              recommendation.images
            )
        );
    }

    /*
    |--------------------------------------------------------------------------
    | Global fallback
    |--------------------------------------------------------------------------
    |
    | A product page should not lose its recommendation area simply because
    | its category contains fewer than two active products.
    |
    */

    if (recommended.length === 0) {
      const fallbackRows = await query(
        `
          SELECT
            p.*,
            c.name AS category_name,
            c.slug AS category_slug
          FROM products p
          LEFT JOIN categories c
            ON c.id = p.category_id
          WHERE p.status = 'active'
            AND p.id <> ?
          ORDER BY
            p.best_seller DESC,
            p.featured DESC,
            p.new_arrival DESC,
            p.id DESC
          LIMIT 4
        `,
        [p.id]
      );

      for (const recommendation of fallbackRows) {
        recommendation.images = await query(
          `
            SELECT *
            FROM product_images
            WHERE product_id = ?
            ORDER BY is_primary DESC, sort_order, id
          `,
          [recommendation.id]
        );
      }

      recommended = fallbackRows.map((recommendation) =>
        product(recommendation, recommendation.images)
      );
    }

    /*
    |--------------------------------------------------------------------------
    | Final response
    |--------------------------------------------------------------------------
    */

    const serializedProduct =
      product(
        p,
        images
      );

    return ok(res, {
      success: true,

      data: {
        ...serializedProduct,

        /*
        |--------------------------------------------------------------------------
        | Variants
        |--------------------------------------------------------------------------
        */

        variants,

        /*
        |--------------------------------------------------------------------------
        | Reviews
        |--------------------------------------------------------------------------
        */

        reviews,

        review_count:
          reviewCount,

        review_average:
          reviewAverage,

        /*
        |--------------------------------------------------------------------------
        | Recommended
        |--------------------------------------------------------------------------
        */

        recommended,
      },
    });
  } catch (error) {
    console.error(
      "Store product show error:",
      error
    );

    return fail(
      res,
      "Unable to load product.",
      500
    );
  }
}

/*
|--------------------------------------------------------------------------
| GET /store/categories
|--------------------------------------------------------------------------
*/

export async function categories(
  req,
  res
) {
  try {
    const roots =
      await query(
        `
          SELECT *
          FROM categories

          WHERE status = 'active'
            AND (
              parent_id IS NULL
              OR parent_id = 0
            )

          ORDER BY
            sort_order,
            name
        `
      );

    for (
      const r of roots
    ) {
      r.children =
        await query(
          `
            SELECT *
            FROM categories

            WHERE parent_id = ?
              AND status = 'active'

            ORDER BY
              sort_order,
              name
          `,
          [r.id]
        );
    }

    return ok(res, {
      success: true,
      data: roots,
    });
  } catch (error) {
    console.error(
      "Store categories error:",
      error
    );

    return fail(
      res,
      "Unable to load categories.",
      500
    );
  }
}