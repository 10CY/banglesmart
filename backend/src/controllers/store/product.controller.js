import { query } from "../../db.js";
import { ok, fail } from "../../utils/http.js";
import { imageUrl } from "../../utils/serialize.js";
import { getProductDesignOptions } from "../../services/product.service.js";

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

    category: p.category_id
      ? {
          id: Number(p.category_id),
          name: p.category_name || "",
          slug: p.category_slug || "",
        }
      : null,

    /*
    |--------------------------------------------------------------------------
    | Material
    |--------------------------------------------------------------------------
    */

    material: p.material_id
      ? {
          id: Number(p.material_id),
          name: p.material_name || "",
        }
      : null,

    /*
    |--------------------------------------------------------------------------
    | Primary image
    |--------------------------------------------------------------------------
    |
    | Prefer a generic primary image.
    |
    | A generic image has color_id = NULL and can be used as fallback
    | when no specific color has been selected yet.
    |
    |--------------------------------------------------------------------------
    */

    primary_image:
      images.find(
        (x) =>
          (x.color_id === null || x.color_id === undefined) &&
          (Number(x.is_primary) === 1 || x.is_primary === true),
      ) ||
      images.find((x) => x.color_id === null || x.color_id === undefined) ||
      images.find((x) => Number(x.is_primary) === 1 || x.is_primary === true) ||
      images[0] ||
      null,

    /*
    |--------------------------------------------------------------------------
    | Product images
    |--------------------------------------------------------------------------
    */

    images: images.map((i) => ({
      id: Number(i.id),

      product_id: Number(i.product_id),

      /*
      |--------------------------------------------------------------------------
      | IMPORTANT
      |
      | color_id lets the frontend know which color this image belongs to.
      |
      | NULL = General / all colors
      |
      |--------------------------------------------------------------------------
      */

      color_id:
        i.color_id !== null && i.color_id !== undefined
          ? Number(i.color_id)
          : null,

      image: i.image,

      alt_text: i.alt_text || null,

      is_primary: Number(i.is_primary) === 1 || i.is_primary === true,

      sort_order: Number(i.sort_order || 0),

      url: imageUrl(i.image),
    })),
  };
}

/*
|--------------------------------------------------------------------------
| Serialize variant
|--------------------------------------------------------------------------
*/

function serializeVariant(v) {
  const quantity =
    v.quantity === null || v.quantity === undefined ? 0 : Number(v.quantity);

  const reservedQuantity =
    v.reserved_quantity === null || v.reserved_quantity === undefined
      ? 0
      : Number(v.reserved_quantity);

  const availableQuantity = Math.max(0, quantity - reservedQuantity);

  return {
    id: Number(v.id),

    product_id:
      v.product_id !== null && v.product_id !== undefined
        ? Number(v.product_id)
        : null,

    size_id:
      v.size_id !== null && v.size_id !== undefined ? Number(v.size_id) : null,

    color_id:
      v.color_id !== null && v.color_id !== undefined
        ? Number(v.color_id)
        : null,

    sku: v.sku || "",

    mrp: Number(v.mrp || 0),

    selling_price: Number(v.selling_price || 0),

    status: v.status || "active",

    /*
    |--------------------------------------------------------------------------
    | Size
    |--------------------------------------------------------------------------
    */

    size: v.size_id
      ? {
          id: Number(v.size_id),

          name: v.size_name || "",

          display_name: v.size_display_name || v.size_name || null,
        }
      : null,

    /*
    |--------------------------------------------------------------------------
    | Color
    |--------------------------------------------------------------------------
    */

    color: v.color_id
      ? {
          id: Number(v.color_id),

          name: v.color_name || "",

          display_name: v.color_display_name || v.color_name || null,

          hex_code: v.color_hex_code || v.hex_code || null,
        }
      : null,

    /*
    |--------------------------------------------------------------------------
    | Inventory
    |--------------------------------------------------------------------------
    */

    inventory:
      v.inventory_id || v.quantity !== null || v.reserved_quantity !== null
        ? {
            quantity,

            reserved_quantity: reservedQuantity,

            available_quantity: availableQuantity,
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
        c.slug AS category_slug,

        m.name AS material_name

      FROM products p

      LEFT JOIN categories c
        ON c.id = p.category_id

      LEFT JOIN materials m
        ON m.id = p.material_id

      WHERE p.status = 'active'
    `;

    const params = [];

    /*
    |--------------------------------------------------------------------------
    | Search
    |--------------------------------------------------------------------------
    */

    if (req.query.search && String(req.query.search).trim()) {
      sql += `
        AND (
          p.name LIKE ?
          OR p.short_description LIKE ?
          OR p.sku LIKE ?
        )
      `;

      const search = `%${String(req.query.search).trim()}%`;

      params.push(search, search, search);
    }

    /*
    |--------------------------------------------------------------------------
    | Category by ID
    |--------------------------------------------------------------------------
    */

    if (req.query.category_id) {
      sql += `
        AND p.category_id = ?
      `;

      params.push(req.query.category_id);
    } else if (req.query.category) {
      /*
      |--------------------------------------------------------------------------
      | Category by slug
      |--------------------------------------------------------------------------
      */

      const categoryRows = await query(
        `
            SELECT id

            FROM categories

            WHERE slug = ?
              AND status = 'active'

            LIMIT 1
          `,
        [req.query.category],
      );

      if (categoryRows.length === 0) {
        return ok(res, {
          success: true,

          data: [],

          meta: {
            total: 0,
          },
        });
      }

      const categoryId = Number(categoryRows[0].id);

      /*
      |--------------------------------------------------------------------------
      | Include root category + immediate child categories
      |--------------------------------------------------------------------------
      */

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

      params.push(categoryId, categoryId);
    }

    /*
    |--------------------------------------------------------------------------
    | Minimum price
    |--------------------------------------------------------------------------
    */

    if (req.query.min_price !== undefined && req.query.min_price !== "") {
      sql += `
        AND p.selling_price >= ?
      `;

      params.push(req.query.min_price);
    }

    /*
    |--------------------------------------------------------------------------
    | Maximum price
    |--------------------------------------------------------------------------
    */

    if (req.query.max_price !== undefined && req.query.max_price !== "") {
      sql += `
        AND p.selling_price <= ?
      `;

      params.push(req.query.max_price);
    }

    /*
    |--------------------------------------------------------------------------
    | Product flags
    |--------------------------------------------------------------------------
    */

    for (const field of ["featured", "best_seller", "new_arrival"]) {
      if (["1", "true"].includes(String(req.query[field]).toLowerCase())) {
        sql += `
          AND p.${field} = 1
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

    const rows = await query(sql, params);

    /*
    |--------------------------------------------------------------------------
    | Load images
    |--------------------------------------------------------------------------
    |
    | IMPORTANT:
    |
    | We return every image, including:
    |
    | color_id = NULL       → General
    | color_id = Pink ID    → Pink
    | color_id = Black ID   → Black
    | color_id = Maroon ID  → Maroon
    |
    |--------------------------------------------------------------------------
    */

    for (const row of rows) {
      row.images = await query(
        `
            SELECT *

            FROM product_images

            WHERE product_id = ?

            ORDER BY
              is_primary DESC,
              sort_order ASC,
              id ASC
          `,
        [row.id],
      );
    }

    /*
    |--------------------------------------------------------------------------
    | Response
    |--------------------------------------------------------------------------
    */

    return ok(res, {
      success: true,

      data: rows.map((row) => product(row, row.images)),

      meta: {
        total: rows.length,
      },
    });
  } catch (error) {
    console.error("Store products error:", error);

    return fail(res, "Unable to load products.", 500);
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

    const productRows = await query(
      `
          SELECT
            p.*,

            c.name AS category_name,
            c.slug AS category_slug,

            m.name AS material_name

          FROM products p

          LEFT JOIN categories c
            ON c.id = p.category_id

          LEFT JOIN materials m
            ON m.id = p.material_id

          WHERE p.slug = ?
            AND p.status = 'active'

          LIMIT 1
        `,
      [req.params.slug],
    );

    const currentProduct = productRows[0];

    if (!currentProduct) {
      return fail(res, "Product not found.", 404);
    }

    /*
    |--------------------------------------------------------------------------
    | Product Images
    |--------------------------------------------------------------------------
    |
    | color_id is now included automatically because we SELECT *.
    |
    |--------------------------------------------------------------------------
    */

    const images = await query(
      `
          SELECT *

          FROM product_images

          WHERE product_id = ?

          ORDER BY
            is_primary DESC,
            sort_order ASC,
            id ASC
        `,
      [currentProduct.id],
    );

    /*
    |--------------------------------------------------------------------------
    | Product Variants
    |--------------------------------------------------------------------------
    */

    const variantRows = await query(
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
      [currentProduct.id],
    );

    const variants = variantRows.map(serializeVariant);

    /*
    |--------------------------------------------------------------------------
    | Design Options
    |--------------------------------------------------------------------------
    |
    | product_design_images now also returns color_id.
    |
    |--------------------------------------------------------------------------
    */

    const designOptions = await getProductDesignOptions(currentProduct.id, {
      activeOnly: true,
    });

    /*
    |--------------------------------------------------------------------------
    | Reviews
    |--------------------------------------------------------------------------
    */

    const reviews = await query(
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
      [currentProduct.id],
    );

    /*
    |--------------------------------------------------------------------------
    | Review Statistics
    |--------------------------------------------------------------------------
    */

    const reviewStats = await query(
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
      [currentProduct.id],
    );

    const reviewCount = Number(reviewStats[0]?.review_count || 0);

    const reviewAverage = Number(reviewStats[0]?.review_average || 0);

    /*
    |--------------------------------------------------------------------------
    | Recommended products
    |--------------------------------------------------------------------------
    */

    let recommended = [];

    if (currentProduct.category_id) {
      const recommendedRows = await query(
        `
            SELECT
              p.*,

              c.name AS category_name,
              c.slug AS category_slug,

              m.name AS material_name

            FROM products p

            LEFT JOIN categories c
              ON c.id = p.category_id

            LEFT JOIN materials m
              ON m.id = p.material_id

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
        [currentProduct.category_id, currentProduct.id],
      );

      /*
      |--------------------------------------------------------------------------
      | Recommended images
      |--------------------------------------------------------------------------
      */

      for (const recommendation of recommendedRows) {
        recommendation.images = await query(
          `
              SELECT *

              FROM product_images

              WHERE product_id = ?

              ORDER BY
                is_primary DESC,
                sort_order ASC,
                id ASC
            `,
          [recommendation.id],
        );
      }

      recommended = recommendedRows.map((recommendation) =>
        product(recommendation, recommendation.images),
      );
    }

    /*
    |--------------------------------------------------------------------------
    | Global fallback recommendations
    |--------------------------------------------------------------------------
    */

    if (recommended.length === 0) {
      const fallbackRows = await query(
        `
            SELECT
              p.*,

              c.name AS category_name,
              c.slug AS category_slug,

              m.name AS material_name

            FROM products p

            LEFT JOIN categories c
              ON c.id = p.category_id

            LEFT JOIN materials m
              ON m.id = p.material_id

            WHERE p.status = 'active'

              AND p.id <> ?

            ORDER BY
              p.best_seller DESC,
              p.featured DESC,
              p.new_arrival DESC,
              p.id DESC

            LIMIT 4
          `,
        [currentProduct.id],
      );

      /*
      |--------------------------------------------------------------------------
      | Fallback product images
      |--------------------------------------------------------------------------
      */

      for (const recommendation of fallbackRows) {
        recommendation.images = await query(
          `
              SELECT *

              FROM product_images

              WHERE product_id = ?

              ORDER BY
                is_primary DESC,
                sort_order ASC,
                id ASC
            `,
          [recommendation.id],
        );
      }

      recommended = fallbackRows.map((recommendation) =>
        product(recommendation, recommendation.images),
      );
    }

    /*
    |--------------------------------------------------------------------------
    | Serialized Product
    |--------------------------------------------------------------------------
    */

    const serializedProduct = product(currentProduct, images);

    /*
    |--------------------------------------------------------------------------
    | Final Response
    |--------------------------------------------------------------------------
    */

    return ok(res, {
      success: true,

      data: {
        ...serializedProduct,

        variants,

        design_options: designOptions,

        reviews,

        review_count: reviewCount,

        review_average: reviewAverage,

        recommended,
      },
    });
  } catch (error) {
    console.error("Store product show error:", error);

    return fail(res, "Unable to load product.", 500);
  }
}

/*
|--------------------------------------------------------------------------
| GET /store/categories
|--------------------------------------------------------------------------
*/

export async function categories(req, res) {
  try {
    /*
    |--------------------------------------------------------------------------
    | Root Categories
    |--------------------------------------------------------------------------
    */

    const roots = await query(
      `
          SELECT *

          FROM categories

          WHERE status = 'active'

            AND (
              parent_id IS NULL
              OR parent_id = 0
            )

          ORDER BY
            sort_order ASC,
            name ASC
        `,
    );

    /*
    |--------------------------------------------------------------------------
    | Child Categories
    |--------------------------------------------------------------------------
    */

    for (const root of roots) {
      root.image_url = root.image ? imageUrl(root.image) : null;
      root.children = await query(
        `
            SELECT *

            FROM categories

            WHERE parent_id = ?

              AND status = 'active'

            ORDER BY
              sort_order ASC,
              name ASC
          `,
        [root.id],
      );

      if (Array.isArray(root.children)) {
        for (const child of root.children) {
          child.image_url = child.image ? imageUrl(child.image) : null;
        }
      }
    }

    return ok(res, {
      success: true,
      data: roots,
    });
  } catch (error) {
    console.error("Store categories error:", error);

    return fail(res, "Unable to load categories.", 500);
  }
}
