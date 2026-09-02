import { query } from "../../db.js";
import { ok, fail } from "../../utils/http.js";

/*
|--------------------------------------------------------------------------
| Build complete cart response
|--------------------------------------------------------------------------
| Frontend expects:
|
| item.variant.product
| item.variant.size
| item.variant.color
| item.variant.sku
| item.variant.mrp
| item.variant.selling_price
| item.variant.available_quantity
|
*/

async function getCart(userId) {
  /*
  |--------------------------------------------------------------------------
  | Find user's cart
  |--------------------------------------------------------------------------
  */

  let cartRow = (
    await query(
      `
        SELECT *
        FROM carts
        WHERE user_id = ?
        LIMIT 1
      `,
      [userId]
    )
  )[0];

  /*
  |--------------------------------------------------------------------------
  | Create cart if it doesn't exist
  |--------------------------------------------------------------------------
  */

  if (!cartRow) {
    const result = await query(
      `
        INSERT INTO carts
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
      [userId]
    );

    cartRow = (
      await query(
        `
          SELECT *
          FROM carts
          WHERE id = ?
          LIMIT 1
        `,
        [result.insertId]
      )
    )[0];
  }

  /*
  |--------------------------------------------------------------------------
  | Get cart items
  |--------------------------------------------------------------------------
  */

  const rows = await query(
    `
      SELECT

        /* Cart item */
        ci.id AS cart_item_id,
        ci.cart_id,
        ci.product_variant_id,
        ci.quantity AS cart_quantity,
        ci.created_at AS cart_created_at,
        ci.updated_at AS cart_updated_at,

        /* Variant */
        pv.id AS variant_id,
        pv.product_id,
        pv.sku AS variant_sku,
        pv.mrp AS variant_mrp,
        pv.selling_price AS variant_selling_price,
        pv.size_id AS variant_size_id,
        pv.color_id AS variant_color_id,
        pv.status AS variant_status,

        /* Product */
        p.id AS product_id,
        p.name AS product_name,
        p.slug AS product_slug,
        p.status AS product_status,

        /* Size */
        s.id AS size_id,
        s.name AS size_name,
        s.display_name AS size_display_name,

        /* Color */
        c.id AS color_id,
        c.name AS color_name,
        c.display_name AS color_display_name,
        c.hex_code AS color_hex_code,

        /* Inventory */
        i.quantity AS inventory_quantity,
        i.reserved_quantity,

        /* Primary product image */
        pi.id AS image_id,
        pi.image AS image_path,
        pi.alt_text AS image_alt_text,
        pi.sort_order AS image_sort_order,
        pi.is_primary AS image_is_primary

      FROM cart_items ci

      INNER JOIN product_variants pv
        ON pv.id = ci.product_variant_id

      INNER JOIN products p
        ON p.id = pv.product_id

      LEFT JOIN sizes s
        ON s.id = pv.size_id

      LEFT JOIN colors c
        ON c.id = pv.color_id

      LEFT JOIN inventories i
        ON i.product_variant_id = pv.id

      LEFT JOIN product_images pi
        ON pi.product_id = p.id
        AND pi.is_primary = 1

      WHERE ci.cart_id = ?

      ORDER BY ci.id DESC
    `,
    [cartRow.id]
  );

  /*
  |--------------------------------------------------------------------------
  | Format items
  |--------------------------------------------------------------------------
  */

  let subtotal = 0;

  const items = rows.map((row) => {
    const quantity = Number(
      row.cart_quantity || 0
    );

    const mrp = Number(
      row.variant_mrp || 0
    );

    const sellingPrice = Number(
      row.variant_selling_price || 0
    );

    const inventoryQuantity = Number(
      row.inventory_quantity || 0
    );

    const reservedQuantity = Number(
      row.reserved_quantity || 0
    );

    const availableQuantity = Math.max(
      0,
      inventoryQuantity - reservedQuantity
    );

    const lineTotal =
      sellingPrice * quantity;

    subtotal += lineTotal;

    /*
    |--------------------------------------------------------------------------
    | Primary image
    |--------------------------------------------------------------------------
    */

    const primaryImage = row.image_id
      ? {
          id: row.image_id,
          image: row.image_path,
          alt_text:
            row.image_alt_text ||
            row.product_name,
          sort_order:
            Number(row.image_sort_order || 0),
          is_primary:
            Boolean(row.image_is_primary),
        }
      : null;

    /*
    |--------------------------------------------------------------------------
    | Return EXACT structure expected by frontend
    |--------------------------------------------------------------------------
    */

    return {
      id: row.cart_item_id,

      cart_id: row.cart_id,

      product_variant_id:
        row.product_variant_id,

      quantity,

      created_at:
        row.cart_created_at,

      updated_at:
        row.cart_updated_at,

      line_total: lineTotal,

      variant: {
        id: row.variant_id,

        product_id: row.product_id,

        sku: row.variant_sku,

        mrp,

        selling_price: sellingPrice,

        size_id: row.variant_size_id,

        color_id: row.variant_color_id,

        status:
          row.variant_status,

        available_quantity:
          availableQuantity,

        /*
        |--------------------------------------------------------------------------
        | Product
        |--------------------------------------------------------------------------
        */

        product: {
          id: row.product_id,

          name: row.product_name,

          slug: row.product_slug,

          status:
            row.product_status,

          primary_image:
            primaryImage,
        },

        /*
        |--------------------------------------------------------------------------
        | Size
        |--------------------------------------------------------------------------
        */

        size: row.size_id
          ? {
              id: row.size_id,

              name:
                row.size_name,

              display_name:
                row.size_display_name ||
                row.size_name,
            }
          : null,

        /*
        |--------------------------------------------------------------------------
        | Color
        |--------------------------------------------------------------------------
        */

        color: row.color_id
          ? {
              id: row.color_id,

              name:
                row.color_name,

              display_name:
                row.color_display_name ||
                row.color_name,

              hex_code:
                row.color_hex_code || null,
            }
          : null,
      },
    };
  });

  /*
  |--------------------------------------------------------------------------
  | Cart totals
  |--------------------------------------------------------------------------
  */

  const itemCount = items.reduce(
    (total, item) =>
      total + Number(item.quantity),
    0
  );

  /*
  |--------------------------------------------------------------------------
  | Final cart object
  |--------------------------------------------------------------------------
  */

  return {
    id: cartRow.id,

    user_id: cartRow.user_id,

    items,

    item_count: itemCount,

    subtotal,

    total: subtotal,
  };
}

/*
|--------------------------------------------------------------------------
| GET CART
|--------------------------------------------------------------------------
| GET /api/customer/cart
|--------------------------------------------------------------------------
*/

export async function index(req, res) {
  try {
    const data = await getCart(
      req.user.id
    );

    return ok(res, {
      success: true,
      data,
    });
  } catch (error) {
    console.error(
      "GET CART ERROR:",
      error
    );

    return fail(
      res,
      "Unable to load cart.",
      500
    );
  }
}

/*
|--------------------------------------------------------------------------
| ADD TO CART
|--------------------------------------------------------------------------
| POST /api/customer/cart
|--------------------------------------------------------------------------
*/

export async function store(req, res) {
  try {
    const {
    product_variant_id,
    product_id,
    quantity = 1,
  } = req.body || {};

    const requestedQuantity =
      Number(quantity);

    /*
    |--------------------------------------------------------------------------
    | Validation
    |--------------------------------------------------------------------------
    */

    let resolvedVariantId =
  product_variant_id
    ? Number(product_variant_id)
    : null;

/*
|--------------------------------------------------------------------------
| If frontend sends product_id instead of a variant,
| automatically select the first available variant.
|--------------------------------------------------------------------------
*/

if (!resolvedVariantId && product_id) {
  const availableVariant = (
    await query(
      `
        SELECT
          pv.id

        FROM product_variants pv

        INNER JOIN products p
          ON p.id = pv.product_id

        LEFT JOIN inventories i
          ON i.product_variant_id = pv.id

        WHERE pv.product_id = ?
          AND pv.status = 'active'
          AND p.status = 'active'

          AND (
            COALESCE(i.quantity, 0)
            -
            COALESCE(i.reserved_quantity, 0)
          ) > 0

        ORDER BY
          pv.id ASC

        LIMIT 1
      `,
      [product_id]
    )
  )[0];

  if (!availableVariant) {
          return fail(
            res,
            "This product is currently out of stock.",
            422
          );
        }

        resolvedVariantId =
          Number(availableVariant.id);
      }

      /*
      |--------------------------------------------------------------------------
      | Variant is still required if neither
      | product_id nor product_variant_id was supplied.
      |--------------------------------------------------------------------------
      */

      if (!resolvedVariantId) {
        return fail(
          res,
          "Product variant is required.",
          422
        );
      }

    if (
      !Number.isInteger(
        requestedQuantity
      ) ||
      requestedQuantity < 1
    ) {
      return fail(
        res,
        "Quantity must be at least 1.",
        422
      );
    }

    /*
    |--------------------------------------------------------------------------
    | Get variant + inventory
    |--------------------------------------------------------------------------
    */

    const variant = (
      await query(
        `
          SELECT

            pv.id,
            pv.product_id,
            pv.sku,
            pv.mrp,
            pv.selling_price,
            pv.size_id,
            pv.color_id,
            pv.status,

            i.quantity AS inventory_quantity,
            i.reserved_quantity

          FROM product_variants pv

          LEFT JOIN inventories i
            ON i.product_variant_id =
               pv.id

          WHERE pv.id = ?

            AND pv.status = 'active'

          LIMIT 1
        `,
        [resolvedVariantId]
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
    | Calculate available stock
    |--------------------------------------------------------------------------
    */

    const availableQuantity =
      Math.max(
        0,
        Number(
          variant.inventory_quantity || 0
        ) -
          Number(
            variant.reserved_quantity || 0
          )
      );

    /*
    |--------------------------------------------------------------------------
    | Find user's cart
    |--------------------------------------------------------------------------
    */

    let cartRow = (
      await query(
        `
          SELECT id
          FROM carts
          WHERE user_id = ?
          LIMIT 1
        `,
        [req.user.id]
      )
    )[0];

    /*
    |--------------------------------------------------------------------------
    | Create cart if required
    |--------------------------------------------------------------------------
    */

    if (!cartRow) {
      const result = await query(
        `
          INSERT INTO carts
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
        [req.user.id]
      );

      cartRow = {
        id: result.insertId,
      };
    }

    /*
    |--------------------------------------------------------------------------
    | Check existing cart item
    |--------------------------------------------------------------------------
    */

    const existing = (
      await query(
        `
          SELECT
            id,
            quantity

          FROM cart_items

          WHERE cart_id = ?

            AND product_variant_id = ?

          LIMIT 1
        `,
        [
          cartRow.id,
          resolvedVariantId,
        ]
      )
    )[0];

    const existingQuantity =
      Number(
        existing?.quantity || 0
      );

    const finalQuantity =
      existingQuantity +
      requestedQuantity;

    /*
    |--------------------------------------------------------------------------
    | Stock validation
    |--------------------------------------------------------------------------
    */

    if (
      finalQuantity >
      availableQuantity
    ) {
      return fail(
        res,
        `Only ${availableQuantity} item(s) available.`,
        422
      );
    }

    /*
    |--------------------------------------------------------------------------
    | Update existing item
    |--------------------------------------------------------------------------
    */

    if (existing) {
      await query(
        `
          UPDATE cart_items

          SET
            quantity = ?,
            updated_at = NOW()

          WHERE id = ?
        `,
        [
          finalQuantity,
          existing.id,
        ]
      );
    }

    /*
    |--------------------------------------------------------------------------
    | Insert new item
    |--------------------------------------------------------------------------
    */

    else {
      await query(
        `
          INSERT INTO cart_items
          (
            cart_id,
            product_variant_id,
            quantity,
            created_at,
            updated_at
          )
          VALUES
          (
            ?,
            ?,
            ?,
            NOW(),
            NOW()
          )
        `,
        [
          cartRow.id,
          resolvedVariantId,
          requestedQuantity,
        ]
      );
    }

    /*
    |--------------------------------------------------------------------------
    | Return updated cart
    |--------------------------------------------------------------------------
    */

    const data = await getCart(
      req.user.id
    );

    return ok(
      res,
      {
        success: true,
        data,
      },
      201
    );
  } catch (error) {
    console.error(
      "ADD TO CART ERROR:",
      error
    );

    return fail(
      res,
      "Unable to add product to cart.",
      500
    );
  }
}

/*
|--------------------------------------------------------------------------
| UPDATE CART ITEM
|--------------------------------------------------------------------------
| PUT /api/customer/cart/:id
|--------------------------------------------------------------------------
*/

export async function update(req, res) {
  try {
    const quantity = Number(
      req.body?.quantity
    );

    /*
    |--------------------------------------------------------------------------
    | Validate quantity
    |--------------------------------------------------------------------------
    */

    if (
      !Number.isInteger(quantity) ||
      quantity < 1
    ) {
      return fail(
        res,
        "Quantity must be at least 1.",
        422
      );
    }

    /*
    |--------------------------------------------------------------------------
    | Find cart item belonging to user
    |--------------------------------------------------------------------------
    */

    const item = (
      await query(
        `
          SELECT

            ci.id,
            ci.product_variant_id

          FROM cart_items ci

          INNER JOIN carts c
            ON c.id = ci.cart_id

          WHERE ci.id = ?

            AND c.user_id = ?

          LIMIT 1
        `,
        [
          req.params.id,
          req.user.id,
        ]
      )
    )[0];

    if (!item) {
      return fail(
        res,
        "Cart item not found.",
        404
      );
    }

    /*
    |--------------------------------------------------------------------------
    | Check variant stock
    |--------------------------------------------------------------------------
    */

    const variant = (
      await query(
        `
          SELECT

            pv.id,
            pv.status,

            i.quantity AS inventory_quantity,
            i.reserved_quantity

          FROM product_variants pv

          LEFT JOIN inventories i
            ON i.product_variant_id =
               pv.id

          WHERE pv.id = ?

          LIMIT 1
        `,
        [item.product_variant_id]
      )
    )[0];

    if (!variant) {
      return fail(
        res,
        "Product variant not found.",
        404
      );
    }

    /*
    |--------------------------------------------------------------------------
    | Calculate available stock
    |--------------------------------------------------------------------------
    */

    const availableQuantity =
      Math.max(
        0,
        Number(
          variant.inventory_quantity || 0
        ) -
          Number(
            variant.reserved_quantity || 0
          )
      );

    if (
      quantity >
      availableQuantity
    ) {
      return fail(
        res,
        `Only ${availableQuantity} item(s) available.`,
        422
      );
    }

    /*
    |--------------------------------------------------------------------------
    | Update quantity
    |--------------------------------------------------------------------------
    */

    await query(
      `
        UPDATE cart_items

        SET
          quantity = ?,
          updated_at = NOW()

        WHERE id = ?
      `,
      [
        quantity,
        item.id,
      ]
    );

    /*
    |--------------------------------------------------------------------------
    | Return updated cart
    |--------------------------------------------------------------------------
    */

    const data = await getCart(
      req.user.id
    );

    return ok(res, {
      success: true,
      data,
    });
  } catch (error) {
    console.error(
      "UPDATE CART ERROR:",
      error
    );

    return fail(
      res,
      "Unable to update cart.",
      500
    );
  }
}

/*
|--------------------------------------------------------------------------
| REMOVE CART ITEM
|--------------------------------------------------------------------------
| DELETE /api/customer/cart/:id
|--------------------------------------------------------------------------
*/

export async function destroy(req, res) {
  try {
    await query(
      `
        DELETE ci

        FROM cart_items ci

        INNER JOIN carts c
          ON c.id = ci.cart_id

        WHERE ci.id = ?

          AND c.user_id = ?
      `,
      [
        req.params.id,
        req.user.id,
      ]
    );

    /*
    |--------------------------------------------------------------------------
    | Return updated cart
    |--------------------------------------------------------------------------
    */

    const data = await getCart(
      req.user.id
    );

    return ok(res, {
      success: true,
      data,
    });
  } catch (error) {
    console.error(
      "REMOVE CART ITEM ERROR:",
      error
    );

    return fail(
      res,
      "Unable to remove cart item.",
      500
    );
  }
}

/*
|--------------------------------------------------------------------------
| CLEAR CART
|--------------------------------------------------------------------------
| DELETE /api/customer/cart
|--------------------------------------------------------------------------
*/

export async function clear(req, res) {
  try {
    await query(
      `
        DELETE ci

        FROM cart_items ci

        INNER JOIN carts c
          ON c.id = ci.cart_id

        WHERE c.user_id = ?
      `,
      [req.user.id]
    );

    /*
    |--------------------------------------------------------------------------
    | Return empty cart
    |--------------------------------------------------------------------------
    */

    const data = await getCart(
      req.user.id
    );

    return ok(res, {
      success: true,
      data,
    });
  } catch (error) {
    console.error(
      "CLEAR CART ERROR:",
      error
    );

    return fail(
      res,
      "Unable to clear cart.",
      500
    );
  }
} 