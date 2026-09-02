import { query } from "../../db.js";
import { ok, fail } from "../../utils/http.js";

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

function normalizeVariant(row) {
  if (!row) return null;

  const quantity = Math.max(
    0,
    Number(row.quantity ?? 0)
  );

  const reservedQuantity = Math.max(
    0,
    Number(row.reserved_quantity ?? 0)
  );

  const lowStockLimit = Math.max(
    0,
    Number(row.low_stock_limit ?? 5)
  );

  const availableQuantity = Math.max(
    0,
    Number(
      row.available_quantity ??
        quantity - reservedQuantity
    )
  );

  return {
    id: Number(row.id),
    product_id: Number(row.product_id),

    size_id: Number(row.size_id),
    color_id: Number(row.color_id),

    sku: row.sku,

    mrp: String(row.mrp ?? "0"),
    selling_price: String(
      row.selling_price ?? "0"
    ),

    status: row.status || "active",

    /*
    |--------------------------------------------------------------------------
    | Nested size
    |--------------------------------------------------------------------------
    */

    size: row.size_id
      ? {
          id: Number(row.size_id),
          name:
            row.size_name || "",
          display_name:
            row.size_display_name ||
            row.size_name ||
            "",
        }
      : null,

    /*
    |--------------------------------------------------------------------------
    | Nested color
    |--------------------------------------------------------------------------
    */

    color: row.color_id
      ? {
          id: Number(row.color_id),
          name:
            row.color_name || "",
          display_name:
            row.color_display_name ||
            row.color_name ||
            "",
          hex_code:
            row.color_hex_code ||
            null,
        }
      : null,

    /*
    |--------------------------------------------------------------------------
    | Inventory
    |--------------------------------------------------------------------------
    */

    inventory: {
      id:
        row.inventory_id
          ? Number(row.inventory_id)
          : undefined,

      product_variant_id:
        Number(row.id),

      quantity,

      reserved_quantity:
        reservedQuantity,

      low_stock_limit:
        lowStockLimit,

      available_quantity:
        availableQuantity,
    },

    /*
    |--------------------------------------------------------------------------
    | Flat fields
    |--------------------------------------------------------------------------
    |
    | Keep these too because some admin screens may use them directly.
    |
    */

    size_name:
      row.size_name || null,

    size_display_name:
      row.size_display_name || null,

    color_name:
      row.color_name || null,

    color_display_name:
      row.color_display_name || null,

    color_hex_code:
      row.color_hex_code || null,

    quantity,

    reserved_quantity:
      reservedQuantity,

    low_stock_limit:
      lowStockLimit,

    available_quantity:
      availableQuantity,
  };
}


/*
|--------------------------------------------------------------------------
| Reusable variant SELECT
|--------------------------------------------------------------------------
*/

const VARIANT_SELECT = `
  SELECT
    pv.*,

    s.name AS size_name,
    s.display_name AS size_display_name,

    c.name AS color_name,
    c.display_name AS color_display_name,
    c.hex_code AS color_hex_code,

    i.id AS inventory_id,

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
      COALESCE(i.quantity, 0) -
      COALESCE(i.reserved_quantity, 0)
    ) AS available_quantity

  FROM product_variants pv

  LEFT JOIN sizes s
    ON s.id = pv.size_id

  LEFT JOIN colors c
    ON c.id = pv.color_id

  LEFT JOIN inventories i
    ON i.product_variant_id = pv.id
`;


/*
|--------------------------------------------------------------------------
| GET /admin/products/:product/variants
|--------------------------------------------------------------------------
*/

export async function index(req, res) {
  try {
    const productId =
      Number(req.params.product);

    if (!productId) {
      return fail(
        res,
        "Invalid product ID.",
        422
      );
    }

    const rows = await query(
      `
      ${VARIANT_SELECT}

      WHERE pv.product_id = ?

      ORDER BY pv.id DESC
      `,
      [productId]
    );

    return ok(res, {
      success: true,
      data: rows.map(normalizeVariant),
    });
  } catch (error) {
    console.error(
      "Variant index error:",
      error
    );

    return fail(
      res,
      "Unable to load variants.",
      500
    );
  }
}


/*
|--------------------------------------------------------------------------
| POST /admin/products/:product/variants
|--------------------------------------------------------------------------
*/

export async function store(req, res) {
  try {
    const productId =
      Number(req.params.product);

    const x =
      req.body || {};

    if (!productId) {
      return fail(
        res,
        "Invalid product ID.",
        422
      );
    }

    if (!x.size_id) {
      return fail(
        res,
        "Size is required.",
        422
      );
    }

    if (!x.color_id) {
      return fail(
        res,
        "Color is required.",
        422
      );
    }

    if (
      !x.sku ||
      !String(x.sku).trim()
    ) {
      return fail(
        res,
        "SKU is required.",
        422
      );
    }

    const sizeId =
      Number(x.size_id);

    const colorId =
      Number(x.color_id);

    const sku =
      String(x.sku).trim();

    const mrp =
      Number(x.mrp || 0);

    const sellingPrice =
      Number(x.selling_price || 0);

    const quantity =
      Math.max(
        0,
        Number(x.quantity ?? 0)
      );

    const lowStockLimit =
      Math.max(
        0,
        Number(
          x.low_stock_limit ?? 5
        )
      );

    /*
    |--------------------------------------------------------------------------
    | Product
    |--------------------------------------------------------------------------
    */

    const product = (
      await query(
        `
        SELECT id
        FROM products
        WHERE id=?
        `,
        [productId]
      )
    )[0];

    if (!product) {
      return fail(
        res,
        "Product not found.",
        404
      );
    }

    /*
    |--------------------------------------------------------------------------
    | Size
    |--------------------------------------------------------------------------
    */

    const size = (
      await query(
        `
        SELECT id
        FROM sizes
        WHERE id=?
        AND status='active'
        `,
        [sizeId]
      )
    )[0];

    if (!size) {
      return fail(
        res,
        "Size not found.",
        404
      );
    }

    /*
    |--------------------------------------------------------------------------
    | Color
    |--------------------------------------------------------------------------
    */

    const color = (
      await query(
        `
        SELECT id
        FROM colors
        WHERE id=?
        AND status='active'
        `,
        [colorId]
      )
    )[0];

    if (!color) {
      return fail(
        res,
        "Color not found.",
        404
      );
    }

    /*
    |--------------------------------------------------------------------------
    | Duplicate SKU
    |--------------------------------------------------------------------------
    */

    const existingSku = (
      await query(
        `
        SELECT id
        FROM product_variants
        WHERE sku=?
        `,
        [sku]
      )
    )[0];

    if (existingSku) {
      return fail(
        res,
        "SKU already exists.",
        422
      );
    }

    /*
    |--------------------------------------------------------------------------
    | Prevent duplicate Size + Color
    |--------------------------------------------------------------------------
    */

    const existingCombination = (
      await query(
        `
        SELECT id
        FROM product_variants
        WHERE product_id=?
        AND size_id=?
        AND color_id=?
        `,
        [
          productId,
          sizeId,
          colorId,
        ]
      )
    )[0];

    if (existingCombination) {
      return fail(
        res,
        "This size and color combination already exists.",
        422
      );
    }

    /*
    |--------------------------------------------------------------------------
    | Create variant
    |--------------------------------------------------------------------------
    */

    const result =
      await query(
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
        (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
        `,
        [
          productId,
          sizeId,
          colorId,
          sku,
          mrp,
          sellingPrice,
          x.status || "active",
        ]
      );

    const variantId =
      result.insertId;

    /*
    |--------------------------------------------------------------------------
    | ALWAYS create inventory
    |--------------------------------------------------------------------------
    */

    await query(
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
      (?, ?, 0, ?, NOW(), NOW())
      `,
      [
        variantId,
        quantity,
        lowStockLimit,
      ]
    );

    /*
    |--------------------------------------------------------------------------
    | Return complete variant
    |--------------------------------------------------------------------------
    */

    const variant = (
      await query(
        `
        ${VARIANT_SELECT}

        WHERE pv.id=?
        `,
        [variantId]
      )
    )[0];

    return ok(
      res,
      {
        success: true,

        message:
          "Variant created successfully.",

        data:
          normalizeVariant(
            variant
          ),
      },
      201
    );
  } catch (error) {
    console.error(
      "Variant store error:",
      error
    );

    return fail(
      res,
      error?.message ||
        "Unable to create variant.",
      500
    );
  }
}


/*
|--------------------------------------------------------------------------
| PUT /admin/products/:product/variants/:id
|--------------------------------------------------------------------------
*/

export async function update(req, res) {
  try {
    const variantId =
      Number(req.params.id);

    const x =
      req.body || {};

    if (!variantId) {
      return fail(
        res,
        "Invalid variant ID.",
        422
      );
    }

    /*
    |--------------------------------------------------------------------------
    | Existing variant
    |--------------------------------------------------------------------------
    */

    const old = (
      await query(
        `
        SELECT *
        FROM product_variants
        WHERE id=?
        `,
        [variantId]
      )
    )[0];

    if (!old) {
      return fail(
        res,
        "Variant not found.",
        404
      );
    }

    const sizeId =
      Number(
        x.size_id ??
          old.size_id
      );

    const colorId =
      Number(
        x.color_id ??
          old.color_id
      );

    const sku =
      String(
        x.sku ??
          old.sku ??
          ""
      ).trim();

    const mrp =
      Number(
        x.mrp ??
          old.mrp ??
          0
      );

    const sellingPrice =
      Number(
        x.selling_price ??
          old.selling_price ??
          0
      );

    const status =
      x.status ??
      old.status ??
      "active";

    /*
    |--------------------------------------------------------------------------
    | Validate size
    |--------------------------------------------------------------------------
    */

    const size = (
      await query(
        `
        SELECT id
        FROM sizes
        WHERE id=?
        AND status='active'
        `,
        [sizeId]
      )
    )[0];

    if (!size) {
      return fail(
        res,
        "Size not found.",
        404
      );
    }

    /*
    |--------------------------------------------------------------------------
    | Validate color
    |--------------------------------------------------------------------------
    */

    const color = (
      await query(
        `
        SELECT id
        FROM colors
        WHERE id=?
        AND status='active'
        `,
        [colorId]
      )
    )[0];

    if (!color) {
      return fail(
        res,
        "Color not found.",
        404
      );
    }

    /*
    |--------------------------------------------------------------------------
    | SKU
    |--------------------------------------------------------------------------
    */

    if (!sku) {
      return fail(
        res,
        "SKU is required.",
        422
      );
    }

    const duplicateSku = (
      await query(
        `
        SELECT id
        FROM product_variants
        WHERE sku=?
        AND id<>?
        `,
        [
          sku,
          variantId,
        ]
      )
    )[0];

    if (duplicateSku) {
      return fail(
        res,
        "SKU already exists.",
        422
      );
    }

    /*
    |--------------------------------------------------------------------------
    | Prevent duplicate Size + Color
    |--------------------------------------------------------------------------
    */

    const duplicateCombination = (
      await query(
        `
        SELECT id
        FROM product_variants
        WHERE product_id=?
        AND size_id=?
        AND color_id=?
        AND id<>?
        `,
        [
          old.product_id,
          sizeId,
          colorId,
          variantId,
        ]
      )
    )[0];

    if (duplicateCombination) {
      return fail(
        res,
        "This size and color combination already exists.",
        422
      );
    }

    /*
    |--------------------------------------------------------------------------
    | Update variant
    |--------------------------------------------------------------------------
    */

    await query(
      `
      UPDATE product_variants

      SET
        size_id=?,
        color_id=?,
        sku=?,
        mrp=?,
        selling_price=?,
        status=?,
        updated_at=NOW()

      WHERE id=?
      `,
      [
        sizeId,
        colorId,
        sku,
        mrp,
        sellingPrice,
        status,
        variantId,
      ]
    );

    /*
    |--------------------------------------------------------------------------
    | Inventory
    |--------------------------------------------------------------------------
    |
    | IMPORTANT:
    | Inventory is now guaranteed to exist after every update.
    |
    */

    const existingInventory = (
      await query(
        `
        SELECT *
        FROM inventories
        WHERE product_variant_id=?
        LIMIT 1
        `,
        [variantId]
      )
    )[0];

    const quantity =
      Math.max(
        0,
        Number(
          x.quantity ??
            existingInventory?.quantity ??
            0
        )
      );

    const lowStockLimit =
      Math.max(
        0,
        Number(
          x.low_stock_limit ??
            existingInventory?.low_stock_limit ??
            5
        )
      );

    if (existingInventory) {
      await query(
        `
        UPDATE inventories

        SET
          quantity=?,
          low_stock_limit=?,
          updated_at=NOW()

        WHERE product_variant_id=?
        `,
        [
          quantity,
          lowStockLimit,
          variantId,
        ]
      );
    } else {
      await query(
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
        (?, ?, 0, ?, NOW(), NOW())
        `,
        [
          variantId,
          quantity,
          lowStockLimit,
        ]
      );
    }

    /*
    |--------------------------------------------------------------------------
    | Return updated variant
    |--------------------------------------------------------------------------
    */

    const updated = (
      await query(
        `
        ${VARIANT_SELECT}

        WHERE pv.id=?
        `,
        [variantId]
      )
    )[0];

    return ok(res, {
      success: true,

      message:
        "Variant updated successfully.",

      data:
        normalizeVariant(
          updated
        ),
    });
  } catch (error) {
    console.error(
      "Variant update error:",
      error
    );

    return fail(
      res,
      error?.message ||
        "Unable to update variant.",
      500
    );
  }
}


/*
|--------------------------------------------------------------------------
| DELETE /admin/products/:product/variants/:id
|--------------------------------------------------------------------------
*/

export async function destroy(req, res) {
  try {
    const variantId =
      Number(req.params.id);

    if (!variantId) {
      return fail(
        res,
        "Invalid variant ID.",
        422
      );
    }

    const variant = (
      await query(
        `
        SELECT id
        FROM product_variants
        WHERE id=?
        `,
        [variantId]
      )
    )[0];

    if (!variant) {
      return fail(
        res,
        "Variant not found.",
        404
      );
    }

    /*
    |--------------------------------------------------------------------------
    | Delete inventory movements
    |--------------------------------------------------------------------------
    */

    await query(
      `
      DELETE FROM inventory_movements
      WHERE product_variant_id=?
      `,
      [variantId]
    );

    /*
    |--------------------------------------------------------------------------
    | Delete inventory
    |--------------------------------------------------------------------------
    */

    await query(
      `
      DELETE FROM inventories
      WHERE product_variant_id=?
      `,
      [variantId]
    );

    /*
    |--------------------------------------------------------------------------
    | Delete variant
    |--------------------------------------------------------------------------
    */

    await query(
      `
      DELETE FROM product_variants
      WHERE id=?
      `,
      [variantId]
    );

    return ok(res, {
      success: true,

      message:
        "Variant deleted successfully.",
    });
  } catch (error) {
    console.error(
      "Variant delete error:",
      error
    );

    return fail(
      res,
      error?.message ||
        "Unable to delete variant.",
      500
    );
  }
}