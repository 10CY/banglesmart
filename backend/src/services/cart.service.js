import { query } from "../db.js";
import { appError } from "../utils/errors.js";

/*
|--------------------------------------------------------------------------
| Find / Create Active Cart
|--------------------------------------------------------------------------
*/

async function findOrCreateCart(userId) {
  let cart = (
    await query(
      `
        SELECT *

        FROM carts

        WHERE user_id = ?
          AND status = 'active'

        ORDER BY id DESC

        LIMIT 1
      `,
      [userId],
    )
  )[0];

  if (!cart) {
    const result = await query(
      `
        INSERT INTO carts
        (
          user_id,
          status,
          created_at,
          updated_at
        )

        VALUES
        (
          ?,
          'active',
          NOW(),
          NOW()
        )
      `,
      [userId],
    );

    cart = (
      await query(
        `
          SELECT *

          FROM carts

          WHERE id = ?

          LIMIT 1
        `,
        [result.insertId],
      )
    )[0];
  }

  return cart;
}

/*
|--------------------------------------------------------------------------
| GET CART
|--------------------------------------------------------------------------
|
| Image priority:
|
| 1. Selected Design + Selected Color
| 2. Selected Color Product Image
| 3. Selected Design General Image
| 4. General Product Image
|
| Example:
|
| Square + Deep Maroon
|
| First preference:
| product_design_images
| design_option_id = Square
| color_id = Deep Maroon
|
|--------------------------------------------------------------------------
*/

export async function getCart(userId) {
  const cart =
    await findOrCreateCart(
      userId,
    );

  const rows =
    await query(
      `
        SELECT
          /* ---------------------------------------------------------------
             CART ITEM
          --------------------------------------------------------------- */

          ci.id
            AS cart_item_id,

          ci.cart_id,

          ci.product_variant_id,

          ci.design_option_id,

          ci.quantity
            AS cart_quantity,

          ci.created_at
            AS cart_created_at,

          ci.updated_at
            AS cart_updated_at,


          /* ---------------------------------------------------------------
             VARIANT
          --------------------------------------------------------------- */

          pv.id
            AS variant_id,

          pv.product_id,

          pv.sku
            AS variant_sku,

          pv.mrp
            AS variant_mrp,

          pv.selling_price
            AS variant_selling_price,

          pv.size_id
            AS variant_size_id,

          pv.color_id
            AS variant_color_id,

          pv.status
            AS variant_status,


          /* ---------------------------------------------------------------
             PRODUCT
          --------------------------------------------------------------- */

          p.id
            AS product_id,

          p.name
            AS product_name,

          p.slug
            AS product_slug,

          p.status
            AS product_status,


          /* ---------------------------------------------------------------
             SIZE
          --------------------------------------------------------------- */

          s.id
            AS size_id,

          s.name
            AS size_name,

          s.display_name
            AS size_display_name,


          /* ---------------------------------------------------------------
             COLOR
          --------------------------------------------------------------- */

          c.id
            AS color_id,

          c.name
            AS color_name,

          c.display_name
            AS color_display_name,

          c.hex_code
            AS color_hex_code,


          /* ---------------------------------------------------------------
             INVENTORY
          --------------------------------------------------------------- */

          COALESCE(
            i.quantity,
            0
          ) AS inventory_quantity,

          COALESCE(
            i.reserved_quantity,
            0
          ) AS reserved_quantity,


          /* ---------------------------------------------------------------
             DESIGN OPTION
          --------------------------------------------------------------- */

          pdo.id
            AS design_id,

          pdo.label
            AS design_label,

          pdo.status
            AS design_status,


          /* ---------------------------------------------------------------
             FINAL IMAGE
          ---------------------------------------------------------------

             PRIORITY:

             1. Design + Color
             2. Product + Color
             3. General Design
             4. General Product

          --------------------------------------------------------------- */

          COALESCE(
            pdi_color.id,
            pi_color.id,
            pdi_general.id,
            pi_general.id
          ) AS image_id,


          COALESCE(
            pdi_color.image,
            pi_color.image,
            pdi_general.image,
            pi_general.image
          ) AS image_path,


          COALESCE(
            pdi_color.alt_text,
            pi_color.alt_text,
            pdi_general.alt_text,
            pi_general.alt_text,
            p.name
          ) AS image_alt_text,


          COALESCE(
            pdi_color.color_id,
            pi_color.color_id,
            pdi_general.color_id,
            pi_general.color_id
          ) AS image_color_id,


          CASE

            WHEN pdi_color.id IS NOT NULL
              THEN 'design_color'

            WHEN pi_color.id IS NOT NULL
              THEN 'product_color'

            WHEN pdi_general.id IS NOT NULL
              THEN 'design_general'

            WHEN pi_general.id IS NOT NULL
              THEN 'product_general'

            ELSE NULL

          END AS image_source


        FROM cart_items ci


        /* ---------------------------------------------------------------
           VARIANT
        --------------------------------------------------------------- */

        INNER JOIN product_variants pv
          ON pv.id =
             ci.product_variant_id


        /* ---------------------------------------------------------------
           PRODUCT
        --------------------------------------------------------------- */

        INNER JOIN products p
          ON p.id =
             pv.product_id


        /* ---------------------------------------------------------------
           SIZE
        --------------------------------------------------------------- */

        LEFT JOIN sizes s
          ON s.id =
             pv.size_id


        /* ---------------------------------------------------------------
           COLOR
        --------------------------------------------------------------- */

        LEFT JOIN colors c
          ON c.id =
             pv.color_id


        /* ---------------------------------------------------------------
           INVENTORY
        --------------------------------------------------------------- */

        LEFT JOIN inventories i
          ON i.product_variant_id =
             pv.id


        /* ---------------------------------------------------------------
           DESIGN OPTION
        --------------------------------------------------------------- */

        LEFT JOIN product_design_options pdo
          ON pdo.id =
             ci.design_option_id

          AND pdo.product_id =
              p.id


        /* ---------------------------------------------------------------
           1. DESIGN + SELECTED COLOR IMAGE
        --------------------------------------------------------------- */

        LEFT JOIN product_design_images pdi_color
          ON pdi_color.design_option_id =
             pdo.id

          AND pdi_color.color_id =
              pv.color_id

          AND pdi_color.is_primary = 1


        /* ---------------------------------------------------------------
           2. PRODUCT + SELECTED COLOR IMAGE
        --------------------------------------------------------------- */

        LEFT JOIN product_images pi_color
          ON pi_color.product_id =
             p.id

          AND pi_color.color_id =
              pv.color_id

          AND pi_color.is_primary = 1


        /* ---------------------------------------------------------------
           3. GENERAL DESIGN IMAGE
        --------------------------------------------------------------- */

        LEFT JOIN product_design_images pdi_general
          ON pdi_general.design_option_id =
             pdo.id

          AND pdi_general.color_id IS NULL

          AND pdi_general.is_primary = 1


        /* ---------------------------------------------------------------
           4. GENERAL PRODUCT IMAGE
        --------------------------------------------------------------- */

        LEFT JOIN product_images pi_general
          ON pi_general.product_id =
             p.id

          AND pi_general.color_id IS NULL

          AND pi_general.is_primary = 1


        WHERE ci.cart_id = ?


        ORDER BY
          ci.id DESC
      `,
      [cart.id],
    );

  /*
  |--------------------------------------------------------------------------
  | Calculate Cart
  |--------------------------------------------------------------------------
  */

  let subtotal = 0;

  const items =
    rows.map(
      (row) => {
        const quantity =
          Math.max(
            0,
            Number(
              row.cart_quantity ||
                0,
            ),
          );

        const mrp =
          Number(
            row.variant_mrp ||
              0,
          );

        const sellingPrice =
          Number(
            row.variant_selling_price ||
              0,
          );

        const inventoryQuantity =
          Number(
            row.inventory_quantity ||
              0,
          );

        const reservedQuantity =
          Number(
            row.reserved_quantity ||
              0,
          );

        const availableQuantity =
          Math.max(
            0,
            inventoryQuantity -
              reservedQuantity,
          );

        const lineTotal =
          sellingPrice *
          quantity;

        subtotal +=
          lineTotal;

        return {
          /*
          |--------------------------------------------------------------------------
          | Cart Item
          |--------------------------------------------------------------------------
          */

          id:
            Number(
              row.cart_item_id,
            ),

          cart_id:
            Number(
              row.cart_id,
            ),

          product_variant_id:
            Number(
              row.product_variant_id,
            ),

          design_option_id:
            row.design_option_id
              ? Number(
                  row.design_option_id,
                )
              : null,

          quantity,

          created_at:
            row.cart_created_at,

          updated_at:
            row.cart_updated_at,

          line_total:
            lineTotal,

          /*
          |--------------------------------------------------------------------------
          | Selected Design
          |--------------------------------------------------------------------------
          */

          design_option:
            row.design_id
              ? {
                  id: Number(
                    row.design_id,
                  ),

                  label:
                    row.design_label ||
                    `Design ${row.design_id}`,

                  status:
                    row.design_status ||
                    "active",
                }
              : null,

          /*
          |--------------------------------------------------------------------------
          | Variant
          |--------------------------------------------------------------------------
          */

          variant: {
            id:
              Number(
                row.variant_id,
              ),

            product_id:
              Number(
                row.product_id,
              ),

            sku:
              row.variant_sku,

            mrp,

            selling_price:
              sellingPrice,

            size_id:
              row.variant_size_id
                ? Number(
                    row.variant_size_id,
                  )
                : null,

            color_id:
              row.variant_color_id
                ? Number(
                    row.variant_color_id,
                  )
                : null,

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
              id:
                Number(
                  row.product_id,
                ),

              name:
                row.product_name,

              slug:
                row.product_slug,

              status:
                row.product_status,

              /*
              |--------------------------------------------------------------------------
              | CORRECT CART / CHECKOUT IMAGE
              |--------------------------------------------------------------------------
              |
              | This image now matches:
              |
              | selected Design
              | +
              | selected Color
              |
              | whenever such an image exists.
              |
              |--------------------------------------------------------------------------
              */

              primary_image:
                row.image_path
                  ? {
                      id:
                        row.image_id
                          ? Number(
                              row.image_id,
                            )
                          : null,

                      image:
                        row.image_path,

                      alt_text:
                        row.image_alt_text ||
                        row.product_name,

                      color_id:
                        row.image_color_id !==
                          null &&
                        row.image_color_id !==
                          undefined
                          ? Number(
                              row.image_color_id,
                            )
                          : null,

                      source:
                        row.image_source ||
                        null,

                      is_primary:
                        true,
                    }
                  : null,
            },

            /*
            |--------------------------------------------------------------------------
            | Size
            |--------------------------------------------------------------------------
            */

            size:
              row.size_id
                ? {
                    id:
                      Number(
                        row.size_id,
                      ),

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

            color:
              row.color_id
                ? {
                    id:
                      Number(
                        row.color_id,
                      ),

                    name:
                      row.color_name,

                    display_name:
                      row.color_display_name ||
                      row.color_name,

                    hex_code:
                      row.color_hex_code ||
                      null,
                  }
                : null,
          },
        };
      },
    );

  /*
  |--------------------------------------------------------------------------
  | Final Cart
  |--------------------------------------------------------------------------
  */

  return {
    id:
      Number(
        cart.id,
      ),

    user_id:
      cart.user_id
        ? Number(
            cart.user_id,
          )
        : null,

    status:
      cart.status ||
      "active",

    items,

    item_count:
      items.reduce(
        (
          total,
          item,
        ) =>
          total +
          item.quantity,
        0,
      ),

    subtotal,

    total:
      subtotal,

    updated_at:
      cart.updated_at,
  };
}

/*
|--------------------------------------------------------------------------
| Resolve Product Variant
|--------------------------------------------------------------------------
*/

async function resolveVariant({
  productVariantId,
  productId,
}) {
  let variantId =
    productVariantId
      ? Number(
          productVariantId,
        )
      : null;

  /*
  |--------------------------------------------------------------------------
  | Fallback
  |--------------------------------------------------------------------------
  |
  | If only product_id is supplied, choose first available variant.
  |
  | Your Product Detail page should normally send product_variant_id.
  |
  |--------------------------------------------------------------------------
  */

  if (
    !variantId &&
    productId
  ) {
    const first = (
      await query(
        `
          SELECT
            pv.id

          FROM product_variants pv

          INNER JOIN products p
            ON p.id =
               pv.product_id

          LEFT JOIN inventories i
            ON i.product_variant_id =
               pv.id

          WHERE
            pv.product_id = ?

            AND pv.status =
                'active'

            AND p.status =
                'active'

            AND (
              COALESCE(
                i.quantity,
                0
              )
              -
              COALESCE(
                i.reserved_quantity,
                0
              )
            ) > 0

          ORDER BY
            pv.id ASC

          LIMIT 1
        `,
        [productId],
      )
    )[0];

    if (!first) {
      throw appError(
        "This product is currently out of stock.",
      );
    }

    variantId =
      Number(
        first.id,
      );
  }

  /*
  |--------------------------------------------------------------------------
  | Variant Required
  |--------------------------------------------------------------------------
  */

  if (!variantId) {
    throw appError(
      "Product variant is required.",
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Get Variant + Inventory
  |--------------------------------------------------------------------------
  */

  const variant = (
    await query(
      `
        SELECT
          pv.*,

          p.status
            AS product_status,

          COALESCE(
            i.quantity,
            0
          ) AS inventory_quantity,

          COALESCE(
            i.reserved_quantity,
            0
          ) AS reserved_quantity

        FROM product_variants pv

        INNER JOIN products p
          ON p.id =
             pv.product_id

        LEFT JOIN inventories i
          ON i.product_variant_id =
             pv.id

        WHERE pv.id = ?

        LIMIT 1
      `,
      [variantId],
    )
  )[0];

  /*
  |--------------------------------------------------------------------------
  | Availability
  |--------------------------------------------------------------------------
  */

  if (
    !variant ||
    variant.status !==
      "active" ||
    variant.product_status !==
      "active"
  ) {
    throw appError(
      "Product variant is unavailable.",
      404,
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Available Quantity
  |--------------------------------------------------------------------------
  */

  variant.available_quantity =
    Math.max(
      0,

      Number(
        variant.inventory_quantity ||
          0,
      ) -
        Number(
          variant.reserved_quantity ||
            0,
        ),
    );

  return variant;
}

/*
|--------------------------------------------------------------------------
| Validate Design Option
|--------------------------------------------------------------------------
*/

async function validateDesignOption(
  designOptionId,
  productId,
) {
  /*
  |--------------------------------------------------------------------------
  | No Design Selected
  |--------------------------------------------------------------------------
  */

  if (!designOptionId) {
    return null;
  }

  const id =
    Number(
      designOptionId,
    );

  if (
    !Number.isInteger(id) ||
    id <= 0
  ) {
    throw appError(
      "Invalid design option.",
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Design Must Belong to This Product
  |--------------------------------------------------------------------------
  */

  const design = (
    await query(
      `
        SELECT
          id,
          product_id,
          label,
          status

        FROM product_design_options

        WHERE
          id = ?

          AND product_id = ?

        LIMIT 1
      `,
      [
        id,
        productId,
      ],
    )
  )[0];

  if (
    !design ||
    design.status !==
      "active"
  ) {
    throw appError(
      "Selected design is unavailable.",
    );
  }

  return design;
}

/*
|--------------------------------------------------------------------------
| ADD CART ITEM
|--------------------------------------------------------------------------
|
| Important:
|
| Cart uniqueness is:
|
| product_variant_id
| +
| design_option_id
|
| Because product_variant_id already contains:
|
| size_id
| color_id
|
|--------------------------------------------------------------------------
*/

export async function addCartItem(
  userId,
  input = {},
) {
  /*
  |--------------------------------------------------------------------------
  | Quantity
  |--------------------------------------------------------------------------
  */

  const quantity =
    Number(
      input.quantity ?? 1,
    );

  if (
    !Number.isInteger(
      quantity,
    ) ||
    quantity < 1
  ) {
    throw appError(
      "Quantity must be at least 1.",
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Resolve Exact Size + Color Variant
  |--------------------------------------------------------------------------
  */

  const variant =
    await resolveVariant({
      productVariantId:
        input.product_variant_id,

      productId:
        input.product_id,
    });

  /*
  |--------------------------------------------------------------------------
  | Validate Optional Design
  |--------------------------------------------------------------------------
  */

  const design =
    await validateDesignOption(
      input.design_option_id,
      variant.product_id,
    );

  /*
  |--------------------------------------------------------------------------
  | Cart
  |--------------------------------------------------------------------------
  */

  const cart =
    await findOrCreateCart(
      userId,
    );

  /*
  |--------------------------------------------------------------------------
  | Existing Same Variant + Same Design
  |--------------------------------------------------------------------------
  |
  | Example:
  |
  | Deep Maroon + Size 2.4 + Square
  |
  | is separate from:
  |
  | Deep Maroon + Size 2.4 + Diamond
  |
  |--------------------------------------------------------------------------
  */

  const existing = (
    await query(
      `
        SELECT
          id,
          quantity

        FROM cart_items

        WHERE
          cart_id = ?

          AND product_variant_id = ?

          AND design_option_id <=> ?

        LIMIT 1
      `,
      [
        cart.id,
        variant.id,
        design?.id ||
          null,
      ],
    )
  )[0];

  /*
  |--------------------------------------------------------------------------
  | Final Quantity
  |--------------------------------------------------------------------------
  */

  const finalQuantity =
    Number(
      existing?.quantity ||
        0,
    ) + quantity;

  /*
  |--------------------------------------------------------------------------
  | Stock Check
  |--------------------------------------------------------------------------
  */

  if (
    finalQuantity >
    Number(
      variant.available_quantity ||
        0,
    )
  ) {
    throw appError(
      `Only ${variant.available_quantity} item(s) available.`,
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Update Existing
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
      ],
    );
  } else {
    /*
    |--------------------------------------------------------------------------
    | Create New Cart Item
    |--------------------------------------------------------------------------
    */

    await query(
      `
        INSERT INTO cart_items
        (
          cart_id,
          product_variant_id,
          design_option_id,
          quantity,
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
      [
        cart.id,
        variant.id,
        design?.id ||
          null,
        quantity,
      ],
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Update Cart Timestamp
  |--------------------------------------------------------------------------
  */

  await query(
    `
      UPDATE carts

      SET
        updated_at = NOW()

      WHERE id = ?
    `,
    [cart.id],
  );

  /*
  |--------------------------------------------------------------------------
  | Return Complete Cart
  |--------------------------------------------------------------------------
  */

  return getCart(
    userId,
  );
}

/*
|--------------------------------------------------------------------------
| UPDATE CART ITEM QUANTITY
|--------------------------------------------------------------------------
*/

export async function updateCartItem(
  userId,
  itemId,
  quantity,
) {
  const nextQuantity =
    Number(quantity);

  /*
  |--------------------------------------------------------------------------
  | Validate Quantity
  |--------------------------------------------------------------------------
  */

  if (
    !Number.isInteger(
      nextQuantity,
    ) ||
    nextQuantity < 1
  ) {
    throw appError(
      "Quantity must be at least 1.",
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Find User Cart Item
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
          ON c.id =
             ci.cart_id

        WHERE
          ci.id = ?

          AND c.user_id = ?

          AND c.status =
              'active'

        LIMIT 1
      `,
      [
        itemId,
        userId,
      ],
    )
  )[0];

  if (!item) {
    throw appError(
      "Cart item not found.",
      404,
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Variant Stock
  |--------------------------------------------------------------------------
  */

  const variant =
    await resolveVariant({
      productVariantId:
        item.product_variant_id,
    });

  if (
    nextQuantity >
    variant.available_quantity
  ) {
    throw appError(
      `Only ${variant.available_quantity} item(s) available.`,
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Update
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
      nextQuantity,
      item.id,
    ],
  );

  return getCart(
    userId,
  );
}

/*
|--------------------------------------------------------------------------
| REMOVE CART ITEM
|--------------------------------------------------------------------------
*/

export async function removeCartItem(
  userId,
  itemId,
) {
  await query(
    `
      DELETE ci

      FROM cart_items ci

      INNER JOIN carts c
        ON c.id =
           ci.cart_id

      WHERE
        ci.id = ?

        AND c.user_id = ?

        AND c.status =
            'active'
    `,
    [
      itemId,
      userId,
    ],
  );

  return getCart(
    userId,
  );
}

/*
|--------------------------------------------------------------------------
| CLEAR CART
|--------------------------------------------------------------------------
*/

export async function clearCart(
  userId,
) {
  await query(
    `
      DELETE ci

      FROM cart_items ci

      INNER JOIN carts c
        ON c.id =
           ci.cart_id

      WHERE
        c.user_id = ?

        AND c.status =
            'active'
    `,
    [userId],
  );

  return getCart(
    userId,
  );
}