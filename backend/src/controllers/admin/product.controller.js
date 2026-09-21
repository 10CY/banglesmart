import { query } from "../../db.js";
import { ok, fail } from "../../utils/http.js";
import { uniqueSlug } from "../../utils/slug.js";
import { imageUrl } from "../../utils/serialize.js";

import {
  PRODUCT_FIELDS,
  nullableString,
  toBool,
  toNumber,
} from "../../modules/products/product.definition.js";

import {
  createProductWithRelations,
  getProductDesignOptions,
} from "../../services/product.service.js";

import { uploadedImageValue } from "../../utils/uploadPath.js";

/*
|--------------------------------------------------------------------------
| Product fields
|--------------------------------------------------------------------------
*/

const productFields = PRODUCT_FIELDS;

/*
|--------------------------------------------------------------------------
| Shape Product
|--------------------------------------------------------------------------
*/

function shapeProduct(product, images = [], variants = [], designOptions = []) {
  if (!product) {
    return null;
  }

  return {
    ...product,

    category_id:
      product.category_id !== null && product.category_id !== undefined
        ? Number(product.category_id)
        : null,

    material_id:
      product.material_id !== null && product.material_id !== undefined
        ? Number(product.material_id)
        : null,

    mrp: toNumber(product.mrp),

    selling_price: toNumber(product.selling_price),

    set_quantity: toNumber(product.set_quantity, 1),

    featured: toBool(product.featured),

    best_seller: toBool(product.best_seller),

    new_arrival: toBool(product.new_arrival),

    /*
    |--------------------------------------------------------------------------
    | Product Images
    |--------------------------------------------------------------------------
    */

    images: Array.isArray(images)
      ? images.map((image) => ({
          ...image,

          id:
            image.id !== null && image.id !== undefined
              ? Number(image.id)
              : null,

          product_id:
            image.product_id !== null && image.product_id !== undefined
              ? Number(image.product_id)
              : null,

          /*
              |--------------------------------------------------------------------------
              | COLOR-SPECIFIC IMAGE
              |--------------------------------------------------------------------------
              |
              | NULL = General image
              |
              */

          color_id:
            image.color_id !== null && image.color_id !== undefined
              ? Number(image.color_id)
              : null,

          sort_order: Number(image.sort_order || 0),

          is_primary: toBool(image.is_primary),

          url: image.image ? imageUrl(image.image) : null,
        }))
      : [],

    /*
    |--------------------------------------------------------------------------
    | Variants
    |--------------------------------------------------------------------------
    */

    variants: Array.isArray(variants)
      ? variants.map((variant) => ({
          ...variant,

          id:
            variant.id !== null && variant.id !== undefined
              ? Number(variant.id)
              : null,

          product_id:
            variant.product_id !== null && variant.product_id !== undefined
              ? Number(variant.product_id)
              : null,

          size_id:
            variant.size_id !== null && variant.size_id !== undefined
              ? Number(variant.size_id)
              : null,

          color_id:
            variant.color_id !== null && variant.color_id !== undefined
              ? Number(variant.color_id)
              : null,

          mrp: toNumber(variant.mrp),

          selling_price: toNumber(variant.selling_price),

          quantity: toNumber(variant.quantity),

          reserved_quantity: toNumber(variant.reserved_quantity),

          low_stock_limit: toNumber(variant.low_stock_limit, 5),

          available_quantity: toNumber(variant.available_quantity),
        }))
      : [],

    /*
    |--------------------------------------------------------------------------
    | Design Options
    |--------------------------------------------------------------------------
    */

    design_options: Array.isArray(designOptions) ? designOptions : [],
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
        c.name AS category_name,
        m.name AS material_name

      FROM products p

      LEFT JOIN categories c
        ON c.id = p.category_id

      LEFT JOIN materials m
        ON m.id = p.material_id

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
      const search = `%${String(req.query.search).trim()}%`;

      sql += `
        AND (
          p.name LIKE ?
          OR p.sku LIKE ?
          OR p.short_description LIKE ?
        )
      `;

      params.push(search, search, search);
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
      const categoryId = Number(req.query.category_id);

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

      params.push(String(req.query.status).trim());
    }

    sql += `
      ORDER BY p.id DESC
    `;

    const rows = await query(sql, params);

    return ok(res, {
      success: true,
      data: rows,
    });
  } catch (error) {
    console.error("GET PRODUCTS ERROR:", error);

    return fail(res, error.message || "Unable to load products.", 500);
  }
}

/*
|--------------------------------------------------------------------------
| CREATE PRODUCT
|--------------------------------------------------------------------------
*/

export async function store(req, res) {
  try {
    /*
    |--------------------------------------------------------------------------
    | Centralized Product Creation
    |--------------------------------------------------------------------------
    |
    | Creates:
    |
    | Product
    | Product Variants
    | Inventory
    | Optional Design Options
    |
    |--------------------------------------------------------------------------
    */

    const created = await createProductWithRelations(req.body || {});

    return ok(
      res,
      {
        success: true,

        message: "Product, variants and inventory created successfully.",

        data: created,
      },
      201,
    );
  } catch (error) {
    console.error("CREATE PRODUCT ERROR:", error);

    return fail(
      res,
      error?.message || "Unable to create product.",
      error?.status || 500,
    );
  }
}

/*
|--------------------------------------------------------------------------
| GET SINGLE PRODUCT
|--------------------------------------------------------------------------
|
| Frontend:
|
| /admin/products/:id
|
|--------------------------------------------------------------------------
*/

export async function show(req, res) {
  try {
    const id = Number(req.params.id);

    /*
    |--------------------------------------------------------------------------
    | Validate ID
    |--------------------------------------------------------------------------
    */

    if (!Number.isInteger(id) || id <= 0) {
      return fail(res, "Invalid product ID.", 422);
    }

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

            m.name AS material_name

          FROM products p

          LEFT JOIN categories c
            ON c.id =
               p.category_id

          LEFT JOIN materials m
            ON m.id =
               p.material_id

          WHERE p.id = ?

          LIMIT 1
        `,
      [id],
    );

    const product = productRows[0];

    if (!product) {
      return fail(res, "Product not found.", 404);
    }

    /*
    |--------------------------------------------------------------------------
    | Product Images
    |--------------------------------------------------------------------------
    |
    | Includes color_id.
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
      [id],
    );

    /*
    |--------------------------------------------------------------------------
    | Product Variants
    |--------------------------------------------------------------------------
    */

    const variants = await query(
      `
          SELECT
            pv.*,

            s.name
              AS size_name,

            s.display_name
              AS size_display_name,

            c.name
              AS color_name,

            c.display_name
              AS color_display_name,

            c.hex_code,

            i.id
              AS inventory_id,

            COALESCE(
              i.quantity,
              0
            ) AS quantity,

            COALESCE(
              i.reserved_quantity,
              0
            ) AS reserved_quantity,

            COALESCE(
              i.low_stock_limit,
              5
            ) AS low_stock_limit,

            (
              COALESCE(
                i.quantity,
                0
              )
              -
              COALESCE(
                i.reserved_quantity,
                0
              )
            ) AS available_quantity

          FROM product_variants pv

          LEFT JOIN sizes s
            ON s.id =
               pv.size_id

          LEFT JOIN colors c
            ON c.id =
               pv.color_id

          LEFT JOIN inventories i
            ON i.product_variant_id =
               pv.id

          WHERE pv.product_id = ?

          ORDER BY
            pv.id ASC
        `,
      [id],
    );

    /*
    |--------------------------------------------------------------------------
    | Design Options
    |--------------------------------------------------------------------------
    */

    const designOptions = await getProductDesignOptions(id);

    /*
    |--------------------------------------------------------------------------
    | Response
    |--------------------------------------------------------------------------
    */

    return ok(res, {
      success: true,

      data: shapeProduct(product, images, variants, designOptions),
    });
  } catch (error) {
    console.error("GET SINGLE PRODUCT ERROR:", error);

    return fail(res, error.message || "Unable to load product.", 500);
  }
}

/*
|--------------------------------------------------------------------------
| UPDATE PRODUCT
|--------------------------------------------------------------------------
*/

export async function update(req, res) {
  try {
    const id = Number(req.params.id);

    /*
    |--------------------------------------------------------------------------
    | Validate ID
    |--------------------------------------------------------------------------
    */

    if (!Number.isInteger(id) || id <= 0) {
      return fail(res, "Invalid product ID.", 422);
    }

    /*
    |--------------------------------------------------------------------------
    | Existing Product
    |--------------------------------------------------------------------------
    */

    const oldRows = await query(
      `
          SELECT *

          FROM products

          WHERE id = ?

          LIMIT 1
        `,
      [id],
    );

    const old = oldRows[0];

    if (!old) {
      return fail(res, "Product not found.", 404);
    }

    const x = req.body || {};

    /*
    |--------------------------------------------------------------------------
    | Product Name
    |--------------------------------------------------------------------------
    */

    const name = x.name !== undefined ? String(x.name).trim() : old.name;

    if (!name) {
      return fail(res, "Product name is required.", 422);
    }

    /*
    |--------------------------------------------------------------------------
    | Slug
    |--------------------------------------------------------------------------
    */

    let slug = old.slug;

    if (name !== old.name) {
      slug = await uniqueSlug(name, "products", id);
    }

    /*
    |--------------------------------------------------------------------------
    | Build Update Values
    |--------------------------------------------------------------------------
    */

    const values = productFields.map((field) => {
      /*
          |--------------------------------------------------------------------------
          | Name
          |--------------------------------------------------------------------------
          */

      if (field === "name") {
        return name;
      }

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
        if (x[field] === undefined) {
          return toBool(old[field]) ? 1 : 0;
        }

        return toBool(x[field]) ? 1 : 0;
      }

      /*
          |--------------------------------------------------------------------------
          | MRP
          |--------------------------------------------------------------------------
          */

      if (field === "mrp") {
        return toNumber(x[field], toNumber(old.mrp));
      }

      /*
          |--------------------------------------------------------------------------
          | Selling Price
          |--------------------------------------------------------------------------
          */

      if (field === "selling_price") {
        return toNumber(x[field], toNumber(old.selling_price));
      }

      /*
          |--------------------------------------------------------------------------
          | Set Quantity
          |--------------------------------------------------------------------------
          */

      if (field === "set_quantity") {
        return toNumber(x[field], toNumber(old.set_quantity, 1));
      }

      /*
          |--------------------------------------------------------------------------
          | Category
          |--------------------------------------------------------------------------
          */

      if (field === "category_id") {
        if (x[field] === undefined) {
          return old.category_id;
        }

        if (x[field] === null || x[field] === "") {
          return null;
        }

        const categoryId = Number(x[field]);

        return Number.isFinite(categoryId) ? categoryId : null;
      }

      /*
          |--------------------------------------------------------------------------
          | Material
          |--------------------------------------------------------------------------
          */

      if (field === "material_id") {
        if (x[field] === undefined) {
          return old.material_id ?? null;
        }

        if (x[field] === null || x[field] === "") {
          return null;
        }

        const materialId = Number(x[field]);

        return Number.isFinite(materialId) ? materialId : null;
      }

      /*
          |--------------------------------------------------------------------------
          | Status
          |--------------------------------------------------------------------------
          */

      if (field === "status") {
        return nullableString(x[field]) || old.status || "active";
      }

      /*
          |--------------------------------------------------------------------------
          | String / Optional Fields
          |--------------------------------------------------------------------------
          */

      if (x[field] === undefined) {
        return old[field] ?? null;
      }

      return nullableString(x[field]);
    });

    /*
    |--------------------------------------------------------------------------
    | Update Product
    |--------------------------------------------------------------------------
    */

    await query(
      `
        UPDATE products

        SET
          ${productFields.map((field) => `${field} = ?`).join(",")},

          slug = ?,

          updated_at = NOW()

        WHERE id = ?
      `,
      [...values, slug, id],
    );

    /*
    |--------------------------------------------------------------------------
    | Updated Product
    |--------------------------------------------------------------------------
    */

    const productRows = await query(
      `
          SELECT
            p.*,

            c.name
              AS category_name,

            m.name
              AS material_name

          FROM products p

          LEFT JOIN categories c
            ON c.id =
               p.category_id

          LEFT JOIN materials m
            ON m.id =
               p.material_id

          WHERE p.id = ?

          LIMIT 1
        `,
      [id],
    );

    const product = productRows[0];

    return ok(res, {
      success: true,

      message: "Product updated successfully.",

      data: shapeProduct(product),
    });
  } catch (error) {
    console.error("UPDATE PRODUCT ERROR:", error);

    return fail(res, error.message || "Unable to update product.", 500);
  }
}

/*
|--------------------------------------------------------------------------
| DELETE PRODUCT
|--------------------------------------------------------------------------
*/

export async function destroy(req, res) {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return fail(res, "Invalid product ID.", 422);
    }

    /*
    |--------------------------------------------------------------------------
    | Product Exists
    |--------------------------------------------------------------------------
    */

    const productRows = await query(
      `
          SELECT id

          FROM products

          WHERE id = ?

          LIMIT 1
        `,
      [id],
    );

    if (!productRows[0]) {
      return fail(res, "Product not found.", 404);
    }

    /*
    |--------------------------------------------------------------------------
    | Delete
    |--------------------------------------------------------------------------
    */

    await query(
      `
        DELETE FROM products

        WHERE id = ?
      `,
      [id],
    );

    return ok(res, {
      success: true,

      message: "Product deleted successfully.",
    });
  } catch (error) {
    console.error("DELETE PRODUCT ERROR:", error);

    return fail(res, error.message || "Unable to delete product.", 500);
  }
}

/*
|--------------------------------------------------------------------------
| UPLOAD PRODUCT IMAGE
|--------------------------------------------------------------------------
|
| Route must use:
|
| upload.single("image")
|
| Body can contain:
|
| color_id
| is_primary
| sort_order
| alt_text
|
| color_id:
|
| NULL / empty = General image
| Number       = Specific color
|
|--------------------------------------------------------------------------
*/

export async function images(req, res) {
  try {
    const productId = Number(req.params.id);

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
    | Image Required
    |--------------------------------------------------------------------------
    */

    if (!req.file) {
      return fail(res, "Image file is required.", 422);
    }

    /*
    |--------------------------------------------------------------------------
    | Validate Product
    |--------------------------------------------------------------------------
    */

    const product = (
      await query(
        `
          SELECT id

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

    /*
    |--------------------------------------------------------------------------
    | Optional Color
    |--------------------------------------------------------------------------
    */

    const rawColorId = req.body?.color_id;

    const colorId =
      rawColorId === undefined || rawColorId === null || rawColorId === ""
        ? null
        : Number(rawColorId);

    /*
    |--------------------------------------------------------------------------
    | Validate Selected Color
    |--------------------------------------------------------------------------
    */

    if (colorId !== null) {
      if (!Number.isInteger(colorId) || colorId <= 0) {
        return fail(res, "Invalid color.", 422);
      }

      /*
      |--------------------------------------------------------------------------
      | The selected color must actually belong to this product's variants.
      |--------------------------------------------------------------------------
      */

      const color = (
        await query(
          `
            SELECT DISTINCT
              c.id

            FROM product_variants pv

            INNER JOIN colors c
              ON c.id =
                 pv.color_id

            WHERE
              pv.product_id = ?

              AND pv.color_id = ?

              AND c.status =
                  'active'

            LIMIT 1
          `,
          [productId, colorId],
        )
      )[0];

      if (!color) {
        return fail(
          res,
          "Selected color is not available for this product.",
          422,
        );
      }
    }

    /*
    |--------------------------------------------------------------------------
    | Existing Images in Same Group
    |--------------------------------------------------------------------------
    |
    | Each group has its own primary:
    |
    | General / NULL
    | Pink
    | Black
    | Maroon
    |
    | MySQL <=> performs NULL-safe comparison.
    |
    |--------------------------------------------------------------------------
    */

    const countRow = (
      await query(
        `
          SELECT
            COUNT(*) AS count

          FROM product_images

          WHERE
            product_id = ?

            AND color_id <=> ?
        `,
        [productId, colorId],
      )
    )[0];

    const count = Number(countRow?.count || 0);

    /*
    |--------------------------------------------------------------------------
    | Primary
    |--------------------------------------------------------------------------
    */

    const requestedPrimary = toBool(req.body?.is_primary);

    /*
    | First image in each color group becomes primary automatically.
    */

    const isPrimary = count === 0 || requestedPrimary ? 1 : 0;

    /*
    |--------------------------------------------------------------------------
    | Remove Existing Primary Only From Same Color Group
    |--------------------------------------------------------------------------
    */

    if (isPrimary) {
      await query(
        `
          UPDATE product_images

          SET
            is_primary = 0

          WHERE
            product_id = ?

            AND color_id <=> ?
        `,
        [productId, colorId],
      );
    }

    /*
    |--------------------------------------------------------------------------
    | Sort Order
    |--------------------------------------------------------------------------
    */

    let sortOrder = Number(req.body?.sort_order);

    if (!Number.isFinite(sortOrder)) {
      sortOrder = count;
    }

    /*
    |--------------------------------------------------------------------------
    | Image Path
    |--------------------------------------------------------------------------
    */

    const imagePath = uploadedImageValue(req.file, "products");

    if (!imagePath) {
      return fail(res, "Unable to determine uploaded image path.", 500);
    }

    /*
    |--------------------------------------------------------------------------
    | Alt Text
    |--------------------------------------------------------------------------
    */

    const altText = nullableString(req.body?.alt_text);

    /*
    |--------------------------------------------------------------------------
    | Insert Product Image
    |--------------------------------------------------------------------------
    */

    const result = await query(
      `
          INSERT INTO product_images
          (
            product_id,
            color_id,
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
            ?,
            NOW(),
            NOW()
          )
        `,
      [productId, colorId, imagePath, altText, sortOrder, isPrimary],
    );

    /*
    |--------------------------------------------------------------------------
    | Return Created Image
    |--------------------------------------------------------------------------
    */

    const image = (
      await query(
        `
          SELECT *

          FROM product_images

          WHERE id = ?

          LIMIT 1
        `,
        [result.insertId],
      )
    )[0];

    return ok(
      res,
      {
        success: true,

        message: "Image uploaded successfully.",

        data: {
          ...image,

          id: Number(image.id),

          product_id: Number(image.product_id),

          color_id:
            image.color_id !== null && image.color_id !== undefined
              ? Number(image.color_id)
              : null,

          sort_order: Number(image.sort_order || 0),

          is_primary: toBool(image.is_primary),

          url: imageUrl(image.image),
        },
      },
      201,
    );
  } catch (error) {
    console.error("IMAGE UPLOAD ERROR:", error);

    return fail(res, error.message || "Unable to upload image.", 500);
  }
}

/*
|--------------------------------------------------------------------------
| DELETE IMAGE
|--------------------------------------------------------------------------
*/

export async function deleteImage(req, res) {
  try {
    const id = Number(req.params.id);

    /*
    |--------------------------------------------------------------------------
    | Validate ID
    |--------------------------------------------------------------------------
    */

    if (!Number.isInteger(id) || id <= 0) {
      return fail(res, "Invalid image ID.", 422);
    }

    /*
    |--------------------------------------------------------------------------
    | Find Image
    |--------------------------------------------------------------------------
    */

    const image = (
      await query(
        `
          SELECT *

          FROM product_images

          WHERE id = ?

          LIMIT 1
        `,
        [id],
      )
    )[0];

    if (!image) {
      return fail(res, "Image not found.", 404);
    }

    /*
    |--------------------------------------------------------------------------
    | Delete
    |--------------------------------------------------------------------------
    */

    await query(
      `
        DELETE FROM product_images

        WHERE id = ?
      `,
      [id],
    );

    /*
    |--------------------------------------------------------------------------
    | If Deleted Image Was Primary
    |--------------------------------------------------------------------------
    |
    | Promote the first image from the same color group.
    |
    |--------------------------------------------------------------------------
    */

    if (toBool(image.is_primary)) {
      const replacement = (
        await query(
          `
            SELECT id

            FROM product_images

            WHERE
              product_id = ?

              AND color_id <=> ?

            ORDER BY
              sort_order ASC,
              id ASC

            LIMIT 1
          `,
          [image.product_id, image.color_id ?? null],
        )
      )[0];

      if (replacement) {
        await query(
          `
            UPDATE product_images

            SET
              is_primary = 1,
              updated_at = NOW()

            WHERE id = ?
          `,
          [replacement.id],
        );
      }
    }

    return ok(res, {
      success: true,

      message: "Image deleted successfully.",
    });
  } catch (error) {
    console.error("DELETE IMAGE ERROR:", error);

    return fail(res, error.message || "Unable to delete image.", 500);
  }
}

/*
|--------------------------------------------------------------------------
| SET PRIMARY IMAGE
|--------------------------------------------------------------------------
|
| IMPORTANT:
|
| Primary is scoped by:
|
| product_id + color_id
|
| Example:
|
| General        → one primary
| Light Pink     → one primary
| Black          → one primary
| Deep Maroon    → one primary
|
|--------------------------------------------------------------------------
*/

export async function primaryImage(req, res) {
  try {
    const id = Number(req.params.id);

    /*
    |--------------------------------------------------------------------------
    | Validate ID
    |--------------------------------------------------------------------------
    */

    if (!Number.isInteger(id) || id <= 0) {
      return fail(res, "Invalid image ID.", 422);
    }

    /*
    |--------------------------------------------------------------------------
    | Find Image
    |--------------------------------------------------------------------------
    */

    const image = (
      await query(
        `
          SELECT *

          FROM product_images

          WHERE id = ?

          LIMIT 1
        `,
        [id],
      )
    )[0];

    if (!image) {
      return fail(res, "Image not found.", 404);
    }

    /*
    |--------------------------------------------------------------------------
    | Remove Primary From Same Color Group Only
    |--------------------------------------------------------------------------
    */

    await query(
      `
        UPDATE product_images

        SET
          is_primary = 0

        WHERE
          product_id = ?

          AND color_id <=> ?
      `,
      [image.product_id, image.color_id ?? null],
    );

    /*
    |--------------------------------------------------------------------------
    | Set Requested Image Primary
    |--------------------------------------------------------------------------
    */

    await query(
      `
        UPDATE product_images

        SET
          is_primary = 1,
          updated_at = NOW()

        WHERE id = ?
      `,
      [id],
    );

    return ok(res, {
      success: true,

      message: "Primary image updated.",
    });
  } catch (error) {
    console.error("PRIMARY IMAGE ERROR:", error);

    return fail(res, error.message || "Unable to set primary image.", 500);
  }
}
