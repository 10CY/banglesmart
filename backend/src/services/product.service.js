import { transaction, query } from "../db.js";
import { uniqueSlug } from "../utils/slug.js";
import { appError } from "../utils/errors.js";
import { imageUrl } from "../utils/serialize.js";
import {
  PRODUCT_FIELDS,
  buildProductValues,
  nullableString,
  toNumber,
} from "../modules/products/product.definition.js";

function cleanVariants(input) {
  if (!Array.isArray(input) || input.length === 0) {
    throw appError("At least one size and color combination is required.");
  }

  const combinations = new Set();
  const skus = new Set();

  return input.map((row, index) => {
    const sizeId = Number(row?.size_id);
    const colorId = Number(row?.color_id);
    const sku = String(row?.sku || "").trim();

    const mrp = toNumber(row?.mrp, 0);
    const sellingPrice = toNumber(row?.selling_price, 0);

    const quantity = Math.max(0, Math.floor(toNumber(row?.quantity, 0)));

    const lowStockLimit = Math.max(
      0,
      Math.floor(toNumber(row?.low_stock_limit, 5)),
    );

    const status = nullableString(row?.status) || "active";

    if (!Number.isInteger(sizeId) || sizeId <= 0) {
      throw appError(`Size is required for variant ${index + 1}.`);
    }

    if (!Number.isInteger(colorId) || colorId <= 0) {
      throw appError(`Color is required for variant ${index + 1}.`);
    }

    if (!sku) {
      throw appError(`SKU is required for variant ${index + 1}.`);
    }

    if (mrp < 0 || sellingPrice < 0) {
      throw appError(`Invalid price for variant ${index + 1}.`);
    }

    if (sellingPrice > mrp && mrp > 0) {
      throw appError(
        `Selling price cannot exceed MRP for variant ${index + 1}.`,
      );
    }

    /*
    |--------------------------------------------------------------------------
    | Prevent duplicate size + color combinations
    |--------------------------------------------------------------------------
    */

    const combinationKey = `${sizeId}:${colorId}`;

    if (combinations.has(combinationKey)) {
      throw appError(
        `Duplicate size/color combination in variant ${index + 1}.`,
      );
    }

    combinations.add(combinationKey);

    /*
    |--------------------------------------------------------------------------
    | Prevent duplicate SKUs inside request
    |--------------------------------------------------------------------------
    */

    const skuKey = sku.toLowerCase();

    if (skus.has(skuKey)) {
      throw appError(`Duplicate variant SKU: ${sku}.`);
    }

    skus.add(skuKey);

    return {
      size_id: sizeId,
      color_id: colorId,

      sku,

      mrp,

      selling_price: sellingPrice,

      quantity,

      low_stock_limit: lowStockLimit,

      status,
    };
  });
}

/*
|--------------------------------------------------------------------------
| Clean Design Options
|--------------------------------------------------------------------------
*/

function cleanDesignOptions(input) {
  if (!Array.isArray(input)) {
    return [];
  }

  return input
    .map((row, index) => ({
      client_key: nullableString(row?.client_key) || `design-${index + 1}`,

      label: nullableString(row?.label) || `Design ${index + 1}`,

      sort_order: Math.max(0, Math.floor(toNumber(row?.sort_order, index))),

      status: nullableString(row?.status) || "active",
    }))
    .filter((row) => row.label);
}

/*
|--------------------------------------------------------------------------
| Validate Sizes, Colors and Variant SKUs
|--------------------------------------------------------------------------
*/

async function validateVariantReferences(connection, variants) {
  const sizeIds = [...new Set(variants.map((row) => row.size_id))];

  const colorIds = [...new Set(variants.map((row) => row.color_id))];

  const skus = variants.map((row) => row.sku);

  /*
  |--------------------------------------------------------------------------
  | Validate Sizes
  |--------------------------------------------------------------------------
  */

  const [sizeRows] = await connection.query(
    `
        SELECT id
        FROM sizes
        WHERE status = 'active'
        AND id IN (?)
      `,
    [sizeIds],
  );

  if (sizeRows.length !== sizeIds.length) {
    throw appError("One or more selected sizes are invalid or inactive.");
  }

  /*
  |--------------------------------------------------------------------------
  | Validate Colors
  |--------------------------------------------------------------------------
  */

  const [colorRows] = await connection.query(
    `
        SELECT id
        FROM colors
        WHERE status = 'active'
        AND id IN (?)
      `,
    [colorIds],
  );

  if (colorRows.length !== colorIds.length) {
    throw appError("One or more selected colors are invalid or inactive.");
  }

  /*
  |--------------------------------------------------------------------------
  | Validate SKU uniqueness globally
  |--------------------------------------------------------------------------
  */

  if (skus.length) {
    const [duplicateSkuRows] = await connection.query(
      `
          SELECT sku
          FROM product_variants
          WHERE sku IN (?)
          LIMIT 1
        `,
      [skus],
    );

    if (duplicateSkuRows.length) {
      throw appError(`Variant SKU already exists: ${duplicateSkuRows[0].sku}.`);
    }
  }
}

/*
|--------------------------------------------------------------------------
| Create Product + Variants + Inventory + Design Options
|--------------------------------------------------------------------------
*/

export async function createProductWithRelations(input = {}) {
  const name = String(input.name || "").trim();

  if (!name) {
    throw appError("Product name is required.");
  }

  /*
  |--------------------------------------------------------------------------
  | Clean payload
  |--------------------------------------------------------------------------
  */

  const variants = cleanVariants(input.variants);

  const designOptions = cleanDesignOptions(input.design_options);

  /*
  |--------------------------------------------------------------------------
  | Product slug + normal product fields
  |--------------------------------------------------------------------------
  */

  const slug = await uniqueSlug(name, "products");

  const values = buildProductValues({
    ...input,
    name,
  });

  /*
  |--------------------------------------------------------------------------
  | Transaction
  |--------------------------------------------------------------------------
  */

  const created = await transaction(async (connection) => {
    /*
        |--------------------------------------------------------------------------
        | Validate all variant references first
        |--------------------------------------------------------------------------
        */

    await validateVariantReferences(connection, variants);

    /*
        |--------------------------------------------------------------------------
        | Create Product
        |--------------------------------------------------------------------------
        */

    const [productResult] = await connection.execute(
      `
              INSERT INTO products
              (
                ${PRODUCT_FIELDS.join(",")},
                slug,
                created_at,
                updated_at
              )
              VALUES
              (
                ${PRODUCT_FIELDS.map(() => "?").join(",")},
                ?,
                NOW(),
                NOW()
              )
            `,
      [...values, slug],
    );

    const productId = Number(productResult.insertId);

    /*
        |--------------------------------------------------------------------------
        | Create Variants
        |--------------------------------------------------------------------------
        */

    const createdVariants = [];

    for (const variant of variants) {
      const [variantResult] = await connection.execute(
        `
                INSERT INTO product_variants
                (
                  product_id,
                  size_id,
                  color_id,
                  sku,
                  mrp,
                  selling_price,
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
                  NOW(),
                  NOW()
                )
              `,
        [
          productId,
          variant.size_id,
          variant.color_id,
          variant.sku,
          variant.mrp,
          variant.selling_price,
          variant.status,
        ],
      );

      const variantId = Number(variantResult.insertId);

      /*
          |--------------------------------------------------------------------------
          | Create Inventory for Variant
          |--------------------------------------------------------------------------
          */

      await connection.execute(
        `
              INSERT INTO inventories
              (
                product_variant_id,
                quantity,
                reserved_quantity,
                low_stock_limit,
                created_at,
                updated_at
              )
              VALUES
              (
                ?,
                ?,
                0,
                ?,
                NOW(),
                NOW()
              )
            `,
        [variantId, variant.quantity, variant.low_stock_limit],
      );

      createdVariants.push({
        id: variantId,
        ...variant,
      });
    }

    /*
        |--------------------------------------------------------------------------
        | Create Optional Design Options
        |--------------------------------------------------------------------------
        */

    const createdDesignOptions = [];

    for (const design of designOptions) {
      const [designResult] = await connection.execute(
        `
                INSERT INTO product_design_options
                (
                  product_id,
                  label,
                  sort_order,
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
                  NOW(),
                  NOW()
                )
              `,
        [productId, design.label, design.sort_order, design.status],
      );

      createdDesignOptions.push({
        id: Number(designResult.insertId),

        ...design,
      });
    }

    return {
      productId,

      variants: createdVariants,

      design_options: createdDesignOptions,
    };
  });

  /*
  |--------------------------------------------------------------------------
  | Return Created Product
  |--------------------------------------------------------------------------
  */

  const product = (
    await query(
      `
        SELECT
          p.*,
          c.name AS category_name,
          m.name AS material_name

        FROM products p

        LEFT JOIN categories c
          ON c.id = p.category_id

        LEFT JOIN materials m
          ON m.id = p.material_id

        WHERE p.id = ?

        LIMIT 1
      `,
      [created.productId],
    )
  )[0];

  return {
    ...product,

    variants: created.variants,

    design_options: created.design_options,
  };
}

/*
|--------------------------------------------------------------------------
| Get Product Design Options
|--------------------------------------------------------------------------
|
| IMPORTANT:
|
| product_design_images now contains color_id.
|
| This means one design can have different images for:
|
| Square + Pink
| Square + Black
| Square + Deep Maroon
|
| Diamond + Pink
| Diamond + Black
| Diamond + Deep Maroon
|
|--------------------------------------------------------------------------
*/

export async function getProductDesignOptions(
  productId,
  { activeOnly = false } = {},
) {
  /*
  |--------------------------------------------------------------------------
  | Design Options
  |--------------------------------------------------------------------------
  */

  const rows = await query(
    `
        SELECT *
        FROM product_design_options

        WHERE product_id = ?

        ${activeOnly ? "AND status = 'active'" : ""}

        ORDER BY
          sort_order ASC,
          id ASC
      `,
    [productId],
  );

  /*
  |--------------------------------------------------------------------------
  | Load Images for Every Design
  |--------------------------------------------------------------------------
  */

  for (const row of rows) {
    row.images = await query(
      `
          SELECT *
          FROM product_design_images

          WHERE design_option_id = ?

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
  | Normalize Response
  |--------------------------------------------------------------------------
  */

  return rows.map((row) => ({
    ...row,

    id: Number(row.id),

    product_id: Number(row.product_id),

    sort_order: Number(row.sort_order || 0),

    images: (row.images || []).map((image) => ({
      ...image,

      id: Number(image.id),

      design_option_id: Number(image.design_option_id),

      /*
          |--------------------------------------------------------------------------
          | COLOR-SPECIFIC IMAGE
          |--------------------------------------------------------------------------
          */

      color_id:
        image.color_id !== null && image.color_id !== undefined
          ? Number(image.color_id)
          : null,

      sort_order: Number(image.sort_order || 0),

      is_primary: Boolean(Number(image.is_primary)),

      url: imageUrl(image.image),
    })),
  }));
}
