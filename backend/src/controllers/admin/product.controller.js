import { query } from "../../db.js";
import { ok, fail } from "../../utils/http.js";
import { uniqueSlug } from "../../utils/slug.js";
import { imageUrl } from "../../utils/serialize.js";

/*
|--------------------------------------------------------------------------
| Product fields
|--------------------------------------------------------------------------
*/

const productFields = [
  "category_id",
  "name",
  "sku",
  "short_description",
  "description",
  "mrp",
  "selling_price",
  "set_quantity",
  "featured",
  "best_seller",
  "new_arrival",
  "status",
  "seo_title",
  "seo_description",
];

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

function toNumber(value, fallback = 0) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return fallback;
  }

  const n = Number(value);

  return Number.isFinite(n)
    ? n
    : fallback;
}

function toBool(value) {
  return (
    value === true ||
    value === 1 ||
    value === "1" ||
    value === "true"
  );
}

/*
|--------------------------------------------------------------------------
| Prevent undefined values from ever reaching MySQL
|--------------------------------------------------------------------------
*/

function nullableString(value) {
  if (
    value === undefined ||
    value === null
  ) {
    return null;
  }

  const text = String(value).trim();

  return text === "" ? null : text;
}

/*
|--------------------------------------------------------------------------
| Shape Product
|--------------------------------------------------------------------------
*/

function shapeProduct(
  product,
  images = [],
  variants = []
) {
  if (!product) {
    return null;
  }

  return {
    ...product,

    category_id:
      product.category_id !== null &&
      product.category_id !== undefined
        ? Number(product.category_id)
        : null,

    mrp: toNumber(product.mrp),

    selling_price:
      toNumber(product.selling_price),

    set_quantity:
      toNumber(
        product.set_quantity,
        1
      ),

    featured:
      toBool(product.featured),

    best_seller:
      toBool(product.best_seller),

    new_arrival:
      toBool(product.new_arrival),

    images: Array.isArray(images)
      ? images.map((image) => ({
          ...image,

          url: image.image
            ? imageUrl(image.image)
            : null,
        }))
      : [],

    variants: Array.isArray(variants)
      ? variants
      : [],
  };
}

/*
|--------------------------------------------------------------------------
| GET PRODUCTS
|--------------------------------------------------------------------------
*/

export async function index(req, res) {
  try {
    let sql = `
      SELECT
        p.*,
        c.name AS category_name
      FROM products p
      LEFT JOIN categories c
        ON c.id = p.category_id
      WHERE 1=1
    `;

    const params = [];

    /*
    |--------------------------------------------------------------------------
    | Search
    |--------------------------------------------------------------------------
    */

    if (
      req.query.search !== undefined &&
      req.query.search !== null &&
      String(req.query.search).trim() !== ""
    ) {
      const search =
        `%${String(
          req.query.search
        ).trim()}%`;

      sql += `
        AND (
          p.name LIKE ?
          OR p.sku LIKE ?
          OR p.short_description LIKE ?
        )
      `;

      params.push(
        search,
        search,
        search
      );
    }

    /*
    |--------------------------------------------------------------------------
    | Category filter
    |--------------------------------------------------------------------------
    */

    if (
      req.query.category_id !== undefined &&
      req.query.category_id !== null &&
      req.query.category_id !== ""
    ) {
      const categoryId =
        Number(req.query.category_id);

      if (Number.isFinite(categoryId)) {
        sql += `
          AND p.category_id = ?
        `;

        params.push(categoryId);
      }
    }

    /*
    |--------------------------------------------------------------------------
    | Status filter
    |--------------------------------------------------------------------------
    */

    if (
      req.query.status !== undefined &&
      req.query.status !== null &&
      String(req.query.status).trim() !== ""
    ) {
      sql += `
        AND p.status = ?
      `;

      params.push(
        String(req.query.status).trim()
      );
    }

    sql += `
      ORDER BY p.id DESC
    `;

    const rows = await query(
      sql,
      params
    );

    return ok(res, {
      success: true,
      data: rows,
    });
  } catch (error) {
    console.error(
      "GET PRODUCTS ERROR:",
      error
    );

    return fail(
      res,
      error.message ||
        "Unable to load products.",
      500
    );
  }
}

/*
|--------------------------------------------------------------------------
| CREATE PRODUCT
|--------------------------------------------------------------------------
*/

export async function store(req, res) {
  try {
    const x = req.body || {};

    /*
    |--------------------------------------------------------------------------
    | Validate product name
    |--------------------------------------------------------------------------
    */

    const name =
      typeof x.name === "string"
        ? x.name.trim()
        : "";

    if (!name) {
      return fail(
        res,
        "Product name is required.",
        422
      );
    }

    /*
    |--------------------------------------------------------------------------
    | Generate unique slug
    |--------------------------------------------------------------------------
    */

    const slug =
      await uniqueSlug(
        name,
        "products"
      );

    /*
    |--------------------------------------------------------------------------
    | Build safe values
    |--------------------------------------------------------------------------
    */

    const values =
      productFields.map(
        (field) => {
          /*
          |--------------------------------------------------------------------------
          | Boolean fields
          |--------------------------------------------------------------------------
          */

          if (
            field === "featured" ||
            field === "best_seller" ||
            field === "new_arrival"
          ) {
            return toBool(
              x[field]
            )
              ? 1
              : 0;
          }

          /*
          |--------------------------------------------------------------------------
          | Numeric fields
          |--------------------------------------------------------------------------
          */

          if (
            field === "mrp" ||
            field === "selling_price"
          ) {
            return toNumber(
              x[field],
              0
            );
          }

          if (
            field === "set_quantity"
          ) {
            return toNumber(
              x[field],
              1
            );
          }

          /*
          |--------------------------------------------------------------------------
          | Status
          |--------------------------------------------------------------------------
          */

          if (
            field === "status"
          ) {
            const status =
              nullableString(
                x[field]
              );

            return (
              status || "active"
            );
          }

          /*
          |--------------------------------------------------------------------------
          | Category
          |--------------------------------------------------------------------------
          */

          if (
            field === "category_id"
          ) {
            if (
              x[field] ===
                undefined ||
              x[field] === null ||
              x[field] === ""
            ) {
              return null;
            }

            const categoryId =
              Number(x[field]);

            return Number.isFinite(
              categoryId
            )
              ? categoryId
              : null;
          }

          /*
          |--------------------------------------------------------------------------
          | Everything else
          |--------------------------------------------------------------------------
          */

          return nullableString(
            x[field]
          );
        }
      );

    /*
    |--------------------------------------------------------------------------
    | INSERT
    |--------------------------------------------------------------------------
    */

    const sql = `
      INSERT INTO products
      (
        ${productFields.join(",")},
        slug,
        created_at,
        updated_at
      )
      VALUES
      (
        ${productFields
          .map(() => "?")
          .join(",")},
        ?,
        NOW(),
        NOW()
      )
    `;

    const result =
      await query(
        sql,
        [
          ...values,
          slug,
        ]
      );

    /*
    |--------------------------------------------------------------------------
    | Get created product
    |--------------------------------------------------------------------------
    */

    const productRows =
      await query(
        `
        SELECT
          p.*,
          c.name AS category_name
        FROM products p
        LEFT JOIN categories c
          ON c.id = p.category_id
        WHERE p.id = ?
        LIMIT 1
        `,
        [
          result.insertId,
        ]
      );

    const product =
      productRows[0];

    return ok(
      res,
      {
        success: true,

        message:
          "Product created successfully.",

        data:
          shapeProduct(
            product
          ),
      },
      201
    );
  } catch (error) {
    console.error(
      "CREATE PRODUCT ERROR:",
      error
    );

    return fail(
      res,
      error.message ||
        "Unable to create product.",
      500
    );
  }
}

/*
|--------------------------------------------------------------------------
| GET SINGLE PRODUCT
|--------------------------------------------------------------------------
|
| IMPORTANT:
|
| Frontend calls:
| /admin/products/9
|
| Therefore we MUST use:
| req.params.id
|
| Never req.params.slug here.
|--------------------------------------------------------------------------
*/

export async function show(req, res) {
  try {
    const rawId =
      req.params.id;

    const id =
      Number(rawId);

    /*
    |--------------------------------------------------------------------------
    | Validate ID
    |--------------------------------------------------------------------------
    */

    if (
      !Number.isInteger(id) ||
      id <= 0
    ) {
      return fail(
        res,
        "Invalid product ID.",
        422
      );
    }

    /*
    |--------------------------------------------------------------------------
    | PRODUCT
    |--------------------------------------------------------------------------
    */

    const productRows =
      await query(
        `
        SELECT
          p.*,
          c.name AS category_name
        FROM products p
        LEFT JOIN categories c
          ON c.id = p.category_id
        WHERE p.id = ?
        LIMIT 1
        `,
        [id]
      );

    const product =
      productRows[0];

    if (!product) {
      return fail(
        res,
        "Product not found.",
        404
      );
    }

    /*
    |--------------------------------------------------------------------------
    | PRODUCT IMAGES
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
          sort_order ASC,
          id ASC
        `,
        [id]
      );

    /*
    |--------------------------------------------------------------------------
    | PRODUCT VARIANTS
    |--------------------------------------------------------------------------
    */

    const variants =
      await query(
        `
        SELECT
          pv.*,

          s.name AS size_name,
          s.display_name AS size_display_name,

          c.name AS color_name,
          c.display_name AS color_display_name,
          c.hex_code,

          i.id AS inventory_id,
          COALESCE(i.quantity, 0) AS quantity,
          COALESCE(i.reserved_quantity, 0) AS reserved_quantity,
          COALESCE(i.low_stock_limit, 5) AS low_stock_limit,

          (
            COALESCE(i.quantity, 0) -
            COALESCE(i.reserved_quantity, 0)
          ) AS available_quantity

        FROM product_variants pv

        LEFT JOIN sizes s
          ON s.id = pv.size_id

        LEFT JOIN colors c
          ON c.id = pv.color_id

        LEFT JOIN inventories i
          ON i.product_variant_id =
             pv.id

        WHERE pv.product_id = ?

        ORDER BY pv.id ASC
        `,
        [id]
      );

    /*
    |--------------------------------------------------------------------------
    | RESPONSE
    |--------------------------------------------------------------------------
    */

    return ok(res, {
      success: true,

      data:
        shapeProduct(
          product,
          images,
          variants
        ),
    });
  } catch (error) {
    console.error(
      "GET SINGLE PRODUCT ERROR:",
      error
    );

    return fail(
      res,
      error.message ||
        "Unable to load product.",
      500
    );
  }
}

/*
|--------------------------------------------------------------------------
| UPDATE PRODUCT
|--------------------------------------------------------------------------
*/

export async function update(req, res) {
  try {
    const id =
      Number(req.params.id);

    /*
    |--------------------------------------------------------------------------
    | Validate ID
    |--------------------------------------------------------------------------
    */

    if (
      !Number.isInteger(id) ||
      id <= 0
    ) {
      return fail(
        res,
        "Invalid product ID.",
        422
      );
    }

    /*
    |--------------------------------------------------------------------------
    | Get old product
    |--------------------------------------------------------------------------
    */

    const oldRows =
      await query(
        `
        SELECT *
        FROM products
        WHERE id = ?
        LIMIT 1
        `,
        [id]
      );

    const old =
      oldRows[0];

    if (!old) {
      return fail(
        res,
        "Product not found.",
        404
      );
    }

    const x =
      req.body || {};

    /*
    |--------------------------------------------------------------------------
    | Product name
    |--------------------------------------------------------------------------
    */

    const name =
      x.name !== undefined
        ? String(
            x.name
          ).trim()
        : old.name;

    if (!name) {
      return fail(
        res,
        "Product name is required.",
        422
      );
    }

    /*
    |--------------------------------------------------------------------------
    | Slug
    |--------------------------------------------------------------------------
    */

    let slug =
      old.slug;

    if (
      name !== old.name
    ) {
      slug =
        await uniqueSlug(
          name,
          "products",
          id
        );
    }

    /*
    |--------------------------------------------------------------------------
    | Build update values
    |--------------------------------------------------------------------------
    */

    const values =
      productFields.map(
        (field) => {
          /*
          |--------------------------------------------------------------------------
          | Name
          |--------------------------------------------------------------------------
          */

          if (
            field === "name"
          ) {
            return name;
          }

          /*
          |--------------------------------------------------------------------------
          | Boolean
          |--------------------------------------------------------------------------
          */

          if (
            field === "featured" ||
            field === "best_seller" ||
            field === "new_arrival"
          ) {
            if (
              x[field] ===
                undefined
            ) {
              return toBool(
                old[field]
              )
                ? 1
                : 0;
            }

            return toBool(
              x[field]
            )
              ? 1
              : 0;
          }

          /*
          |--------------------------------------------------------------------------
          | Numeric
          |--------------------------------------------------------------------------
          */

          if (
            field === "mrp"
          ) {
            return toNumber(
              x[field],
              toNumber(
                old.mrp
              )
            );
          }

          if (
            field ===
            "selling_price"
          ) {
            return toNumber(
              x[field],
              toNumber(
                old.selling_price
              )
            );
          }

          if (
            field ===
            "set_quantity"
          ) {
            return toNumber(
              x[field],
              toNumber(
                old.set_quantity,
                1
              )
            );
          }

          /*
          |--------------------------------------------------------------------------
          | Category
          |--------------------------------------------------------------------------
          */

          if (
            field ===
            "category_id"
          ) {
            if (
              x[field] ===
                undefined
            ) {
              return old.category_id;
            }

            if (
              x[field] ===
                null ||
              x[field] === ""
            ) {
              return null;
            }

            const categoryId =
              Number(
                x[field]
              );

            return Number.isFinite(
              categoryId
            )
              ? categoryId
              : null;
          }

          /*
          |--------------------------------------------------------------------------
          | Status
          |--------------------------------------------------------------------------
          */

          if (
            field === "status"
          ) {
            return (
              nullableString(
                x[field]
              ) ||
              old.status ||
              "active"
            );
          }

          /*
          |--------------------------------------------------------------------------
          | Strings
          |--------------------------------------------------------------------------
          */

          if (
            x[field] ===
            undefined
          ) {
            return old[field] ??
              null;
          }

          return nullableString(
            x[field]
          );
        }
      );

    /*
    |--------------------------------------------------------------------------
    | UPDATE
    |--------------------------------------------------------------------------
    */

    await query(
      `
      UPDATE products
      SET
        ${productFields
          .map(
            (field) =>
              `${field} = ?`
          )
          .join(",")},
        slug = ?,
        updated_at = NOW()
      WHERE id = ?
      `,
      [
        ...values,
        slug,
        id,
      ]
    );

    /*
    |--------------------------------------------------------------------------
    | Get updated product
    |--------------------------------------------------------------------------
    */

    const productRows =
      await query(
        `
        SELECT
          p.*,
          c.name AS category_name
        FROM products p
        LEFT JOIN categories c
          ON c.id = p.category_id
        WHERE p.id = ?
        LIMIT 1
        `,
        [id]
      );

    const product =
      productRows[0];

    return ok(res, {
      success: true,

      message:
        "Product updated successfully.",

      data:
        shapeProduct(
          product
        ),
    });
  } catch (error) {
    console.error(
      "UPDATE PRODUCT ERROR:",
      error
    );

    return fail(
      res,
      error.message ||
        "Unable to update product.",
      500
    );
  }
}

/*
|--------------------------------------------------------------------------
| DELETE PRODUCT
|--------------------------------------------------------------------------
*/

export async function destroy(req, res) {
  try {
    const id =
      Number(req.params.id);

    if (
      !Number.isInteger(id) ||
      id <= 0
    ) {
      return fail(
        res,
        "Invalid product ID.",
        422
      );
    }

    const productRows =
      await query(
        `
        SELECT id
        FROM products
        WHERE id = ?
        LIMIT 1
        `,
        [id]
      );

    if (!productRows[0]) {
      return fail(
        res,
        "Product not found.",
        404
      );
    }

    await query(
      `
      DELETE FROM products
      WHERE id = ?
      `,
      [id]
    );

    return ok(res, {
      success: true,

      message:
        "Product deleted successfully.",
    });
  } catch (error) {
    console.error(
      "DELETE PRODUCT ERROR:",
      error
    );

    return fail(
      res,
      error.message ||
        "Unable to delete product.",
      500
    );
  }
}

/*
|--------------------------------------------------------------------------
| UPLOAD PRODUCT IMAGE
|--------------------------------------------------------------------------
|
| IMPORTANT:
|
| This function expects:
|
| req.file
|
| Therefore multer must use:
|
| upload.single("image")
|
|--------------------------------------------------------------------------
*/

export async function images(req, res) {
  try {
    const productId =
      Number(
        req.params.id
      );

    if (
      !Number.isInteger(
        productId
      ) ||
      productId <= 0
    ) {
      return fail(
        res,
        "Invalid product ID.",
        422
      );
    }

    /*
    |--------------------------------------------------------------------------
    | File check
    |--------------------------------------------------------------------------
    */

    if (!req.file) {
      return fail(
        res,
        "Image file is required.",
        422
      );
    }

    /*
    |--------------------------------------------------------------------------
    | Product check
    |--------------------------------------------------------------------------
    */

    const productRows =
      await query(
        `
        SELECT id
        FROM products
        WHERE id = ?
        LIMIT 1
        `,
        [productId]
      );

    if (!productRows[0]) {
      return fail(
        res,
        "Product not found.",
        404
      );
    }

    /*
    |--------------------------------------------------------------------------
    | Existing image count
    |--------------------------------------------------------------------------
    */

    const countRows =
      await query(
        `
        SELECT
          COUNT(*) AS count
        FROM product_images
        WHERE product_id = ?
        `,
        [productId]
      );

    const count =
      Number(
        countRows[0]?.count || 0
      );

    /*
    |--------------------------------------------------------------------------
    | Primary image
    |--------------------------------------------------------------------------
    */

    const requestedPrimary =
      toBool(
        req.body?.is_primary
      );

    const isPrimary =
      count === 0 ||
      requestedPrimary
        ? 1
        : 0;

    /*
    |--------------------------------------------------------------------------
    | Remove previous primary
    |--------------------------------------------------------------------------
    */

    if (isPrimary) {
      await query(
        `
        UPDATE product_images
        SET is_primary = 0
        WHERE product_id = ?
        `,
        [productId]
      );
    }

    /*
    |--------------------------------------------------------------------------
    | Sort order
    |--------------------------------------------------------------------------
    */

    let sortOrder =
      Number(
        req.body?.sort_order
      );

    if (
      !Number.isFinite(
        sortOrder
      )
    ) {
      sortOrder = count;
    }

    /*
    |--------------------------------------------------------------------------
    | Image path
    |--------------------------------------------------------------------------
    */

    const imagePath =
      `products/${req.file.filename}`;

    /*
    |--------------------------------------------------------------------------
    | Alt text
    |--------------------------------------------------------------------------
    */

    const altText =
      nullableString(
        req.body?.alt_text
      );

    /*
    |--------------------------------------------------------------------------
    | Insert image
    |--------------------------------------------------------------------------
    */

    const result =
      await query(
        `
        INSERT INTO product_images
        (
          product_id,
          image,
          alt_text,
          sort_order,
          is_primary,
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
          NOW(),
          NOW()
        )
        `,
        [
          productId,
          imagePath,
          altText,
          sortOrder,
          isPrimary,
        ]
      );

    /*
    |--------------------------------------------------------------------------
    | Get image
    |--------------------------------------------------------------------------
    */

    const imageRows =
      await query(
        `
        SELECT *
        FROM product_images
        WHERE id = ?
        LIMIT 1
        `,
        [result.insertId]
      );

    const image =
      imageRows[0];

    return ok(
      res,
      {
        success: true,

        message:
          "Image uploaded successfully.",

        data: {
          ...image,

          url:
            imageUrl(
              image.image
            ),
        },
      },
      201
    );
  } catch (error) {
    console.error(
      "IMAGE UPLOAD ERROR:",
      error
    );

    return fail(
      res,
      error.message ||
        "Unable to upload image.",
      500
    );
  }
}

/*
|--------------------------------------------------------------------------
| DELETE IMAGE
|--------------------------------------------------------------------------
*/

export async function deleteImage(
  req,
  res
) {
  try {
    const id =
      Number(
        req.params.id
      );

    if (
      !Number.isInteger(id) ||
      id <= 0
    ) {
      return fail(
        res,
        "Invalid image ID.",
        422
      );
    }

    const imageRows =
      await query(
        `
        SELECT *
        FROM product_images
        WHERE id = ?
        LIMIT 1
        `,
        [id]
      );

    const image =
      imageRows[0];

    if (!image) {
      return fail(
        res,
        "Image not found.",
        404
      );
    }

    await query(
      `
      DELETE FROM product_images
      WHERE id = ?
      `,
      [id]
    );

    return ok(res, {
      success: true,

      message:
        "Image deleted successfully.",
    });
  } catch (error) {
    console.error(
      "DELETE IMAGE ERROR:",
      error
    );

    return fail(
      res,
      error.message ||
        "Unable to delete image.",
      500
    );
  }
}

/*
|--------------------------------------------------------------------------
| SET PRIMARY IMAGE
|--------------------------------------------------------------------------
*/

export async function primaryImage(
  req,
  res
) {
  try {
    const id =
      Number(
        req.params.id
      );

    if (
      !Number.isInteger(id) ||
      id <= 0
    ) {
      return fail(
        res,
        "Invalid image ID.",
        422
      );
    }

    const imageRows =
      await query(
        `
        SELECT *
        FROM product_images
        WHERE id = ?
        LIMIT 1
        `,
        [id]
      );

    const image =
      imageRows[0];

    if (!image) {
      return fail(
        res,
        "Image not found.",
        404
      );
    }

    await query(
      `
      UPDATE product_images
      SET is_primary = 0
      WHERE product_id = ?
      `,
      [
        image.product_id,
      ]
    );

    await query(
      `
      UPDATE product_images
      SET is_primary = 1
      WHERE id = ?
      `,
      [id]
    );

    return ok(res, {
      success: true,

      message:
        "Primary image updated.",
    });
  } catch (error) {
    console.error(
      "PRIMARY IMAGE ERROR:",
      error
    );

    return fail(
      res,
      error.message ||
        "Unable to set primary image.",
      500
    );
  }
}