import { query, transaction } from "../../db.js";
import { ok, fail } from "../../utils/http.js";
import { randomUUID } from "crypto";
import { createNotification } from "../../utils/notify.js";

/*
|--------------------------------------------------------------------------
| Order Details
|--------------------------------------------------------------------------
*/

async function details(id, uid) {
  const order = (
    await query(
      `
        SELECT *
        FROM orders
        WHERE id = ?
          AND user_id = ?
      `,
      [id, uid],
    )
  )[0];

  if (!order) {
    return null;
  }

  /*
  |--------------------------------------------------------------------------
  | Decode Shipping Address
  |--------------------------------------------------------------------------
  */

  try {
    order.shipping_address = JSON.parse(order.shipping_address || "{}");
  } catch {
    order.shipping_address = {};
  }

  /*
  |--------------------------------------------------------------------------
  | Decode Billing Address
  |--------------------------------------------------------------------------
  */

  try {
    order.billing_address = order.billing_address
      ? JSON.parse(order.billing_address)
      : null;
  } catch {
    order.billing_address = null;
  }

  /*
  |--------------------------------------------------------------------------
  | Order Items
  |--------------------------------------------------------------------------
  */

  order.items = await query(
    `
      SELECT *
      FROM order_items
      WHERE order_id = ?
      ORDER BY id ASC
    `,
    [id],
  );

  /*
  |--------------------------------------------------------------------------
  | Order Timeline
  |--------------------------------------------------------------------------
  */

  order.timeline = [
    {
      status: "pending",
      label: "Order placed",
      at: order.created_at,
    },

    ...(order.status !== "pending" && order.status !== "cancelled"
      ? [
          {
            status: "processing",
            label: "Processing",
            at: order.updated_at,
          },
        ]
      : []),

    ...(order.shipped_at
      ? [
          {
            status: "shipped",
            label: "Shipped",
            at: order.shipped_at,
          },
        ]
      : []),

    ...(order.delivered_at
      ? [
          {
            status: "delivered",
            label: "Delivered",
            at: order.delivered_at,
          },
        ]
      : []),

    ...(order.cancelled_at
      ? [
          {
            status: "cancelled",
            label: "Cancelled",
            at: order.cancelled_at,
          },
        ]
      : []),
  ];

  return order;
}

/*
|--------------------------------------------------------------------------
| GET CUSTOMER ORDERS
|--------------------------------------------------------------------------
*/

export async function index(req, res) {
  try {
    const page = Math.max(1, Number.parseInt(req.query.page || "1", 10) || 1);

    const perPage = Math.min(
      50,
      Math.max(1, Number.parseInt(req.query.per_page || "10", 10) || 10),
    );

    const offset = (page - 1) * perPage;

    /*
    |--------------------------------------------------------------------------
    | Count
    |--------------------------------------------------------------------------
    */

    const countRows = await query(
      `
          SELECT COUNT(*) AS total
          FROM orders
          WHERE user_id = ?
        `,
      [req.user.id],
    );

    const total = Number(countRows[0]?.total || 0);

    /*
    |--------------------------------------------------------------------------
    | Orders
    |--------------------------------------------------------------------------
    */

    const rows = await query(
      `
          SELECT *
          FROM orders
          WHERE user_id = ?
          ORDER BY id DESC
          LIMIT ${perPage}
          OFFSET ${offset}
        `,
      [req.user.id],
    );

    return ok(res, {
      success: true,

      data: {
        data: rows,

        current_page: page,

        last_page: total > 0 ? Math.ceil(total / perPage) : 1,

        per_page: perPage,

        total,
      },
    });
  } catch (error) {
    console.error("Customer order index error:", error);

    return fail(res, "Unable to load orders.", 500);
  }
}

/*
|--------------------------------------------------------------------------
| GET SINGLE CUSTOMER ORDER
|--------------------------------------------------------------------------
*/

export async function show(req, res) {
  try {
    const order = await details(req.params.id, req.user.id);

    return order
      ? ok(res, {
          success: true,
          data: order,
        })
      : fail(res, "Order not found.", 404);
  } catch (error) {
    console.error("Customer order show error:", error);

    return fail(res, "Unable to load order.", 500);
  }
}

/*
|--------------------------------------------------------------------------
| PLACE ORDER
|--------------------------------------------------------------------------
|
| NORMAL CHECKOUT
|
| items come from:
|
| carts
| +
| cart_items
|
| Cart gets cleared after successful order.
|
|--------------------------------------------------------------------------
|
| BUY NOW
|
| items come from:
|
| req.body.buy_now
|
| {
|   product_variant_id,
|   design_option_id,
|   quantity
| }
|
| Customer's normal cart is never changed.
|
|--------------------------------------------------------------------------
|
| IMAGE PRIORITY
|
| 1. Selected Design + Selected Color
| 2. Selected Color Product Image
| 3. General Design Image
| 4. General Product Image
|
|--------------------------------------------------------------------------
*/

export async function store(req, res) {
  try {
    const {
      shipping_address_id,
      billing_address_id,

      shipping_address,
      billing_address,

      payment_method = payment_method,

      customer_note,

      coupon_code,

      /*
      |--------------------------------------------------------------------------
      | Buy Now Payload
      |--------------------------------------------------------------------------
      */

      buy_now,
    } = req.body || {};

    /*
    |--------------------------------------------------------------------------
    | Checkout Mode
    |--------------------------------------------------------------------------
    */

    const isBuyNow = Boolean(buy_now);

    /*
    |--------------------------------------------------------------------------
    | Shipping Address Validation
    |--------------------------------------------------------------------------
    */

    if (!shipping_address_id && !shipping_address) {
      return fail(res, "Shipping address is required.", 422);
    }

    /*
    |--------------------------------------------------------------------------
    | Payment Method
    |--------------------------------------------------------------------------
    */

    const allowedPaymentMethods = [
  "cod",
  "razorpay",
];

if (
  !allowedPaymentMethods.includes(
    payment_method,
  )
) {
  return fail(
    res,
    "Invalid payment method.",
    422,
  );
}

    /*
    |--------------------------------------------------------------------------
    | Buy Now Validation
    |--------------------------------------------------------------------------
    */

    let buyNowVariantId = null;

    let buyNowDesignOptionId = null;

    let buyNowQuantity = null;

    if (isBuyNow) {
      buyNowVariantId = Number(buy_now?.product_variant_id);

      buyNowDesignOptionId = buy_now?.design_option_id
        ? Number(buy_now.design_option_id)
        : null;

      buyNowQuantity = Number(buy_now?.quantity || 1);

      /*
      |--------------------------------------------------------------------------
      | Variant
      |--------------------------------------------------------------------------
      */

      if (!Number.isInteger(buyNowVariantId) || buyNowVariantId <= 0) {
        return fail(res, "Invalid Buy Now product variant.", 422);
      }

      /*
      |--------------------------------------------------------------------------
      | Design
      |--------------------------------------------------------------------------
      */

      if (
        buyNowDesignOptionId !== null &&
        (!Number.isInteger(buyNowDesignOptionId) || buyNowDesignOptionId <= 0)
      ) {
        return fail(res, "Invalid Buy Now design option.", 422);
      }

      /*
      |--------------------------------------------------------------------------
      | Quantity
      |--------------------------------------------------------------------------
      */

      if (!Number.isInteger(buyNowQuantity) || buyNowQuantity <= 0) {
        return fail(res, "Invalid Buy Now quantity.", 422);
      }
    }

    /*
    |--------------------------------------------------------------------------
    | Transaction
    |--------------------------------------------------------------------------
    */

    return await transaction(async (c) => {
      /*
        |--------------------------------------------------------------------------
        | Address Resolution
        |--------------------------------------------------------------------------
        */

      let shippingSnapshot = shipping_address || null;

      let billingSnapshot = billing_address || null;

      /*
        |--------------------------------------------------------------------------
        | Shipping Address From Saved Address
        |--------------------------------------------------------------------------
        */

      if (shipping_address_id) {
        const [rows] = await c.execute(
          `
                SELECT *

                FROM addresses

                WHERE
                  id = ?

                  AND user_id = ?

                LIMIT 1
              `,
          [shipping_address_id, req.user.id],
        );

        const address = rows[0];

        if (!address) {
          throw Object.assign(new Error("Shipping address not found."), {
            status: 422,
          });
        }

        shippingSnapshot = address;
      }

      /*
        |--------------------------------------------------------------------------
        | Billing Address From Saved Address
        |--------------------------------------------------------------------------
        */

      if (billing_address_id) {
        const [rows] = await c.execute(
          `
                SELECT *

                FROM addresses

                WHERE
                  id = ?

                  AND user_id = ?

                LIMIT 1
              `,
          [billing_address_id, req.user.id],
        );

        const address = rows[0];

        if (!address) {
          throw Object.assign(new Error("Billing address not found."), {
            status: 422,
          });
        }

        billingSnapshot = address;
      }

      /*
        |--------------------------------------------------------------------------
        | Shipping Snapshot Required
        |--------------------------------------------------------------------------
        */

      if (!shippingSnapshot) {
        throw Object.assign(new Error("Shipping address is required."), {
          status: 422,
        });
      }

      /*
        |--------------------------------------------------------------------------
        | ORDER SOURCE
        |--------------------------------------------------------------------------
        |
        | Normal:
        |
        | cart → cart_items
        |
        | Buy Now:
        |
        | selected variant only
        |
        */

      let cart = null;

      let items = [];

      /*
        |--------------------------------------------------------------------------
        | BUY NOW
        |--------------------------------------------------------------------------
        */

      if (isBuyNow) {
        const [buyNowRows] = await c.execute(
          `
                SELECT

                  /* -------------------------------------------------------
                     VARIANT
                  ------------------------------------------------------- */

                  pv.id
                    AS product_variant_id,

                  pv.product_id,

                  pv.sku,

                  pv.mrp,

                  pv.selling_price,

                  pv.status
                    AS variant_status,

                  pv.color_id,

                  pv.size_id,


                  /* -------------------------------------------------------
                     SIZE
                  ------------------------------------------------------- */

                  s.name
                    AS size_name,


                  /* -------------------------------------------------------
                     COLOR
                  ------------------------------------------------------- */

                  co.name
                    AS color_name,


                  /* -------------------------------------------------------
                     PRODUCT
                  ------------------------------------------------------- */

                  p.name
                    AS product_name,

                  p.status
                    AS product_status,


                  /* -------------------------------------------------------
                     DESIGN
                  ------------------------------------------------------- */

                  pdo.id
                    AS design_option_id,

                  pdo.label
                    AS design_name,

                  pdo.status
                    AS design_status,


                  /* -------------------------------------------------------
                     IMAGE
                  -------------------------------------------------------

                     Priority:

                     1. Design + Color
                     2. Product + Color
                     3. Design General
                     4. Product General

                  ------------------------------------------------------- */

                  COALESCE(

                    (
                      SELECT
                        pdi1.image

                      FROM
                        product_design_images
                          pdi1

                      WHERE
                        pdi1.design_option_id =
                          pdo.id

                        AND
                        pdi1.color_id =
                          pv.color_id

                      ORDER BY
                        pdi1.is_primary
                          DESC,

                        pdi1.sort_order
                          ASC,

                        pdi1.id
                          ASC

                      LIMIT 1
                    ),

                    (
                      SELECT
                        pi1.image

                      FROM
                        product_images
                          pi1

                      WHERE
                        pi1.product_id =
                          p.id

                        AND
                        pi1.color_id =
                          pv.color_id

                      ORDER BY
                        pi1.is_primary
                          DESC,

                        pi1.sort_order
                          ASC,

                        pi1.id
                          ASC

                      LIMIT 1
                    ),

                    (
                      SELECT
                        pdi2.image

                      FROM
                        product_design_images
                          pdi2

                      WHERE
                        pdi2.design_option_id =
                          pdo.id

                        AND
                        pdi2.color_id
                          IS NULL

                      ORDER BY
                        pdi2.is_primary
                          DESC,

                        pdi2.sort_order
                          ASC,

                        pdi2.id
                          ASC

                      LIMIT 1
                    ),

                    (
                      SELECT
                        pi2.image

                      FROM
                        product_images
                          pi2

                      WHERE
                        pi2.product_id =
                          p.id

                        AND
                        pi2.color_id
                          IS NULL

                      ORDER BY
                        pi2.is_primary
                          DESC,

                        pi2.sort_order
                          ASC,

                        pi2.id
                          ASC

                      LIMIT 1
                    )

                  ) AS image


                FROM
                  product_variants
                    pv


                /* -------------------------------------------------------
                   PRODUCT
                ------------------------------------------------------- */

                JOIN products p
                  ON p.id =
                     pv.product_id


                /* -------------------------------------------------------
                   SIZE
                ------------------------------------------------------- */

                LEFT JOIN sizes s
                  ON s.id =
                     pv.size_id


                /* -------------------------------------------------------
                   COLOR
                ------------------------------------------------------- */

                LEFT JOIN colors co
                  ON co.id =
                     pv.color_id


                /* -------------------------------------------------------
                   SELECTED DESIGN
                ------------------------------------------------------- */

                LEFT JOIN
                  product_design_options
                    pdo

                  ON
                    pdo.id = ?

                  AND
                    pdo.product_id =
                      pv.product_id


                WHERE
                  pv.id = ?

                LIMIT 1
              `,
          [buyNowDesignOptionId, buyNowVariantId],
        );

        const item = buyNowRows[0];

        /*
          |--------------------------------------------------------------------------
          | Variant Exists
          |--------------------------------------------------------------------------
          */

        if (!item) {
          throw Object.assign(new Error("Selected product is unavailable."), {
            status: 422,
          });
        }

        /*
          |--------------------------------------------------------------------------
          | Design Validation
          |--------------------------------------------------------------------------
          */

        if (buyNowDesignOptionId !== null) {
          if (
            !item.design_option_id ||
            Number(item.design_option_id) !== Number(buyNowDesignOptionId)
          ) {
            throw Object.assign(
              new Error("Selected design does not belong to this product."),
              {
                status: 422,
              },
            );
          }

          if (item.design_status !== "active") {
            throw Object.assign(new Error("Selected design is unavailable."), {
              status: 422,
            });
          }
        }

        /*
          |--------------------------------------------------------------------------
          | Quantity
          |--------------------------------------------------------------------------
          */

        item.quantity = buyNowQuantity;

        /*
          |--------------------------------------------------------------------------
          | Explicit Design Value
          |--------------------------------------------------------------------------
          */

        item.design_option_id = buyNowDesignOptionId;

        /*
          |--------------------------------------------------------------------------
          | Only ONE Buy Now Item
          |--------------------------------------------------------------------------
          */

        items = [item];
      } else {
        /*
          |--------------------------------------------------------------------------
          | NORMAL CART CHECKOUT
          |--------------------------------------------------------------------------
          */

        const [cartRows] = await c.execute(
          `
                SELECT id

                FROM carts

                WHERE
                  user_id = ?

                LIMIT 1
              `,
          [req.user.id],
        );

        cart = cartRows[0];

        if (!cart) {
          throw Object.assign(new Error("Cart is empty."), {
            status: 422,
          });
        }

        /*
          |--------------------------------------------------------------------------
          | Cart Items
          |--------------------------------------------------------------------------
          */

        const [cartItems] = await c.execute(
          `
                SELECT
                  ci.*,


                  /* -----------------------------------------------------
                     VARIANT
                  ----------------------------------------------------- */

                  pv.product_id,

                  pv.sku,

                  pv.mrp,

                  pv.selling_price,

                  pv.status
                    AS variant_status,

                  pv.color_id,

                  pv.size_id,


                  /* -----------------------------------------------------
                     SIZE
                  ----------------------------------------------------- */

                  s.name
                    AS size_name,


                  /* -----------------------------------------------------
                     COLOR
                  ----------------------------------------------------- */

                  co.name
                    AS color_name,


                  /* -----------------------------------------------------
                     PRODUCT
                  ----------------------------------------------------- */

                  p.name
                    AS product_name,

                  p.status
                    AS product_status,


                  /* -----------------------------------------------------
                     DESIGN
                  ----------------------------------------------------- */

                  pdo.label
                    AS design_name,

                  pdo.status
                    AS design_status,


                  /* -----------------------------------------------------
                     IMAGE
                  ----------------------------------------------------- */

                  COALESCE(

                    (
                      SELECT
                        pdi1.image

                      FROM
                        product_design_images
                          pdi1

                      WHERE
                        pdi1.design_option_id =
                          ci.design_option_id

                        AND
                        pdi1.color_id =
                          pv.color_id

                      ORDER BY
                        pdi1.is_primary
                          DESC,

                        pdi1.sort_order
                          ASC,

                        pdi1.id
                          ASC

                      LIMIT 1
                    ),

                    (
                      SELECT
                        pi1.image

                      FROM
                        product_images
                          pi1

                      WHERE
                        pi1.product_id =
                          p.id

                        AND
                        pi1.color_id =
                          pv.color_id

                      ORDER BY
                        pi1.is_primary
                          DESC,

                        pi1.sort_order
                          ASC,

                        pi1.id
                          ASC

                      LIMIT 1
                    ),

                    (
                      SELECT
                        pdi2.image

                      FROM
                        product_design_images
                          pdi2

                      WHERE
                        pdi2.design_option_id =
                          ci.design_option_id

                        AND
                        pdi2.color_id
                          IS NULL

                      ORDER BY
                        pdi2.is_primary
                          DESC,

                        pdi2.sort_order
                          ASC,

                        pdi2.id
                          ASC

                      LIMIT 1
                    ),

                    (
                      SELECT
                        pi2.image

                      FROM
                        product_images
                          pi2

                      WHERE
                        pi2.product_id =
                          p.id

                        AND
                        pi2.color_id
                          IS NULL

                      ORDER BY
                        pi2.is_primary
                          DESC,

                        pi2.sort_order
                          ASC,

                        pi2.id
                          ASC

                      LIMIT 1
                    )

                  ) AS image


                FROM
                  cart_items
                    ci


                /* -----------------------------------------------------
                   VARIANT
                ----------------------------------------------------- */

                JOIN
                  product_variants
                    pv

                  ON
                    pv.id =
                      ci.product_variant_id


                /* -----------------------------------------------------
                   PRODUCT
                ----------------------------------------------------- */

                JOIN products p
                  ON p.id =
                     pv.product_id


                /* -----------------------------------------------------
                   SIZE
                ----------------------------------------------------- */

                LEFT JOIN sizes s
                  ON s.id =
                     pv.size_id


                /* -----------------------------------------------------
                   COLOR
                ----------------------------------------------------- */

                LEFT JOIN colors co
                  ON co.id =
                     pv.color_id


                /* -----------------------------------------------------
                   DESIGN
                ----------------------------------------------------- */

                LEFT JOIN
                  product_design_options
                    pdo

                  ON
                    pdo.id =
                      ci.design_option_id

                  AND
                    pdo.product_id =
                      pv.product_id


                WHERE
                  ci.cart_id = ?

                ORDER BY
                  ci.id ASC
              `,
          [cart.id],
        );

        items = cartItems;

        /*
          |--------------------------------------------------------------------------
          | Empty Cart
          |--------------------------------------------------------------------------
          */

        if (!items.length) {
          throw Object.assign(new Error("Cart is empty."), {
            status: 422,
          });
        }
      }

      /*
        |--------------------------------------------------------------------------
        | Stock + Subtotal
        |--------------------------------------------------------------------------
        */

      let subtotal = 0;

      for (const item of items) {
        /*
          |--------------------------------------------------------------------------
          | Variant Availability
          |--------------------------------------------------------------------------
          */

        if (item.variant_status !== "active") {
          throw Object.assign(
            new Error(`${item.product_name} is no longer available.`),
            {
              status: 422,
            },
          );
        }

        /*
          |--------------------------------------------------------------------------
          | Product Availability
          |--------------------------------------------------------------------------
          */

        if (item.product_status !== "active") {
          throw Object.assign(
            new Error(`${item.product_name} is no longer available.`),
            {
              status: 422,
            },
          );
        }

        /*
          |--------------------------------------------------------------------------
          | Design Availability
          |--------------------------------------------------------------------------
          */

        if (item.design_option_id) {
          if (!item.design_name || item.design_status !== "active") {
            throw Object.assign(
              new Error(
                `Selected design for ${item.product_name} is unavailable.`,
              ),
              {
                status: 422,
              },
            );
          }
        }

        /*
          |--------------------------------------------------------------------------
          | Lock Inventory
          |--------------------------------------------------------------------------
          */

        const [inventoryRows] = await c.execute(
          `
                SELECT
                  quantity,

                  reserved_quantity

                FROM
                  inventories

                WHERE
                  product_variant_id = ?

                FOR UPDATE
              `,
          [item.product_variant_id],
        );

        const inventory = inventoryRows[0];

        /*
          |--------------------------------------------------------------------------
          | Available Stock
          |--------------------------------------------------------------------------
          */

        const available = Math.max(
          0,

          Number(inventory?.quantity || 0) -
            Number(inventory?.reserved_quantity || 0),
        );

        /*
          |--------------------------------------------------------------------------
          | Stock Check
          |--------------------------------------------------------------------------
          */

        if (available < Number(item.quantity)) {
          throw Object.assign(
            new Error(
              `Only ${available} item(s) available for ${item.product_name}.`,
            ),
            {
              status: 422,
            },
          );
        }

        /*
          |--------------------------------------------------------------------------
          | Subtotal
          |--------------------------------------------------------------------------
          */

        subtotal +=
          Number(item.selling_price || 0) * Number(item.quantity || 0);
      }

      /*
        |--------------------------------------------------------------------------
        | Coupon
        |--------------------------------------------------------------------------
        */

      let coupon = null;

      let discountAmount = 0;

      const normalizedCouponCode = String(coupon_code || "")
        .trim()
        .toUpperCase();

      if (normalizedCouponCode) {
        /*
          |--------------------------------------------------------------------------
          | Coupon
          |--------------------------------------------------------------------------
          */

        const [couponRows] = await c.execute(
          `
                SELECT *

                FROM coupons

                WHERE
                  UPPER(code) = ?

                LIMIT 1

                FOR UPDATE
              `,
          [normalizedCouponCode],
        );

        coupon = couponRows[0];

        if (!coupon) {
          throw Object.assign(new Error("Invalid coupon code."), {
            status: 422,
          });
        }

        /*
          |--------------------------------------------------------------------------
          | Coupon Dates
          |--------------------------------------------------------------------------
          */

        const now = new Date();

        if (
          coupon.status !== "active" ||
          (coupon.starts_at && new Date(coupon.starts_at) > now) ||
          (coupon.expires_at && new Date(coupon.expires_at) < now)
        ) {
          throw Object.assign(new Error("Coupon is not active."), {
            status: 422,
          });
        }

        /*
          |--------------------------------------------------------------------------
          | Minimum Order
          |--------------------------------------------------------------------------
          */

        if (subtotal < Number(coupon.minimum_order_amount || 0)) {
          throw Object.assign(
            new Error(
              `Minimum order amount is ₹${coupon.minimum_order_amount}.`,
            ),
            {
              status: 422,
            },
          );
        }

        /*
          |--------------------------------------------------------------------------
          | Global Usage Limit
          |--------------------------------------------------------------------------
          */

        if (coupon.usage_limit != null) {
          const [usageRows] = await c.execute(
            `
                  SELECT
                    COUNT(*) AS count

                  FROM
                    coupon_usages

                  WHERE
                    coupon_id = ?
                `,
            [coupon.id],
          );

          if (Number(usageRows[0]?.count || 0) >= Number(coupon.usage_limit)) {
            throw Object.assign(
              new Error("This coupon has reached its usage limit."),
              {
                status: 422,
              },
            );
          }
        }

        /*
          |--------------------------------------------------------------------------
          | Per User Coupon Limit
          |--------------------------------------------------------------------------
          */

        const [userUsageRows] = await c.execute(
          `
                SELECT
                  COUNT(*) AS count

                FROM
                  coupon_usages

                WHERE
                  coupon_id = ?

                  AND
                  user_id = ?
              `,
          [coupon.id, req.user.id],
        );

        if (
          Number(userUsageRows[0]?.count || 0) >=
          Number(coupon.per_user_limit || 1)
        ) {
          throw Object.assign(
            new Error(
              "You have already used this coupon the maximum number of times.",
            ),
            {
              status: 422,
            },
          );
        }

        /*
          |--------------------------------------------------------------------------
          | Calculate Discount
          |--------------------------------------------------------------------------
          */

        discountAmount =
          coupon.type === "percentage"
            ? (subtotal * Number(coupon.value || 0)) / 100
            : Number(coupon.value || 0);

        /*
          |--------------------------------------------------------------------------
          | Maximum Discount
          |--------------------------------------------------------------------------
          */

        if (coupon.maximum_discount_amount != null) {
          discountAmount = Math.min(
            discountAmount,

            Number(coupon.maximum_discount_amount),
          );
        }

        /*
          |--------------------------------------------------------------------------
          | Clamp Discount
          |--------------------------------------------------------------------------
          */

        discountAmount = Math.max(
          0,

          Math.min(discountAmount, subtotal),
        );
      }

      /*
        |--------------------------------------------------------------------------
        | Shipping Settings
        |--------------------------------------------------------------------------
        */

      const [shippingRows] = await c.execute(
        `
              SELECT *

              FROM
                shipping_settings

              ORDER BY id

              LIMIT 1
            `,
      );

      const shippingSettings = shippingRows[0] || {
        shipping_enabled: 1,

        flat_shipping_amount: 0,

        free_shipping_minimum: null,
      };

      const shippingEnabled = Boolean(shippingSettings.shipping_enabled);

      const freeMinimum =
        shippingSettings.free_shipping_minimum == null
          ? null
          : Number(shippingSettings.free_shipping_minimum);

      /*
        |--------------------------------------------------------------------------
        | Shipping Amount
        |--------------------------------------------------------------------------
        */

      const shippingAmount =
        !shippingEnabled ||
        (freeMinimum != null && freeMinimum > 0 && subtotal >= freeMinimum)
          ? 0
          : Number(shippingSettings.flat_shipping_amount || 0);

      /*
        |--------------------------------------------------------------------------
        | Total
        |--------------------------------------------------------------------------
        */

      const totalAmount = Math.max(
        0,

        subtotal + shippingAmount - discountAmount,
      );

      /*
        |--------------------------------------------------------------------------
        | Order Number
        |--------------------------------------------------------------------------
        */

      const orderNumber = `BM-${new Date()
        .toISOString()
        .slice(0, 10)
        .replaceAll("-", "")}-${randomUUID().slice(0, 6).toUpperCase()}`;

      /*
        |--------------------------------------------------------------------------
        | Create Order
        |--------------------------------------------------------------------------
        */

      const [orderResult] = await c.execute(
        `
              INSERT INTO orders
              (
                user_id,

                order_number,

                status,

                payment_method,

                payment_status,

                subtotal,

                shipping_amount,

                discount_amount,

                coupon_id,

                coupon_code,

                total_amount,

                shipping_address,

                billing_address,

                customer_note,

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
          req.user.id,

          orderNumber,

          "pending",

          payment_method,

          "pending",

          subtotal,

          shippingAmount,

          discountAmount,

          coupon?.id || null,

          coupon?.code || null,

          totalAmount,

          JSON.stringify(shippingSnapshot),

          billingSnapshot ? JSON.stringify(billingSnapshot) : null,

          customer_note?.trim?.() || null,
        ],
      );

      /*
        |--------------------------------------------------------------------------
        | Order Items + Inventory Reservation
        |--------------------------------------------------------------------------
        */

      for (const item of items) {
        const lineTotal =
          Number(item.selling_price || 0) * Number(item.quantity || 0);

        /*
          |--------------------------------------------------------------------------
          | Save Permanent Snapshot
          |--------------------------------------------------------------------------
          */

        await c.execute(
          `
              INSERT INTO order_items
              (
                order_id,

                product_id,

                product_variant_id,

                design_option_id,

                product_name,

                variant_sku,

                size_name,

                color_name,

                design_name,

                image,

                mrp,

                price,

                quantity,

                line_total,

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
            orderResult.insertId,

            item.product_id,

            item.product_variant_id,

            item.design_option_id || null,

            item.product_name,

            item.sku,

            item.size_name,

            item.color_name,

            item.design_name || null,

            /*
              |--------------------------------------------------------------------------
              | Correct Color / Design Image
              |--------------------------------------------------------------------------
              */

            item.image || null,

            item.mrp,

            item.selling_price,

            item.quantity,

            lineTotal,
          ],
        );

        /*
          |--------------------------------------------------------------------------
          | Reserve Inventory
          |--------------------------------------------------------------------------
          */

        await c.execute(
          `
              UPDATE inventories

              SET
                reserved_quantity =
                  reserved_quantity + ?,

                updated_at =
                  NOW()

              WHERE
                product_variant_id = ?
            `,
          [item.quantity, item.product_variant_id],
        );
      }

      /*
        |--------------------------------------------------------------------------
        | Coupon Usage
        |--------------------------------------------------------------------------
        */

      if (coupon) {
        await c.execute(
          `
              INSERT INTO coupon_usages
              (
                coupon_id,

                user_id,

                order_id,

                discount_amount,

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
          [coupon.id, req.user.id, orderResult.insertId, discountAmount],
        );
      }

      /*
        |--------------------------------------------------------------------------
        | CLEAR CART
        |--------------------------------------------------------------------------
        |
        | Normal Checkout:
        |
        | ✓ Clear cart
        |
        | Buy Now:
        |
        | ✗ Never clear cart
        | ✗ Never modify cart
        |
        */

      if (!isBuyNow && cart) {
        await c.execute(
          `
              DELETE FROM
                cart_items

              WHERE
                cart_id = ?
            `,
          [cart.id],
        );
      }

      /*
        |--------------------------------------------------------------------------
        | Created Order
        |--------------------------------------------------------------------------
        */

      const [createdRows] = await c.execute(
        `
              SELECT *

              FROM orders

              WHERE
                id = ?

              LIMIT 1
            `,
        [orderResult.insertId],
      );

      /*
        |--------------------------------------------------------------------------
        | Notification
        |--------------------------------------------------------------------------
        */

      await createNotification(
        req.user.id,

        "order",

        "Order placed",

        `Your order ${createdRows[0].order_number} has been placed successfully.`,

        {
          order_id: createdRows[0].id,
        },
      );

      /*
        |--------------------------------------------------------------------------
        | Response
        |--------------------------------------------------------------------------
        */

      return ok(
        res,
        {
          success: true,

          message: "Order placed successfully.",

          data: createdRows[0],
        },
        201,
      );
    });
  } catch (error) {
    console.error("Customer order store error:", error);

    return fail(
      res,

      error?.message || "Unable to place order.",

      error?.status || 500,
    );
  }
}

/*
|--------------------------------------------------------------------------
| CANCEL ORDER
|--------------------------------------------------------------------------
*/

export async function cancel(req, res) {
  try {
    /*
    |--------------------------------------------------------------------------
    | Order
    |--------------------------------------------------------------------------
    */

    const order = (
      await query(
        `
          SELECT *

          FROM orders

          WHERE
            id = ?

            AND user_id = ?

          LIMIT 1
        `,
        [req.params.id, req.user.id],
      )
    )[0];

    if (!order) {
      return fail(res, "Order not found.", 404);
    }

    /*
    |--------------------------------------------------------------------------
    | Cancel Allowed Statuses
    |--------------------------------------------------------------------------
    */

    if (!["pending", "processing"].includes(order.status)) {
      return fail(res, "Order cannot be cancelled.", 422);
    }

    /*
    |--------------------------------------------------------------------------
    | Transaction
    |--------------------------------------------------------------------------
    */

    await transaction(async (c) => {
      /*
        |--------------------------------------------------------------------------
        | Order Items
        |--------------------------------------------------------------------------
        */

      const [items] = await c.execute(
        `
              SELECT
                product_variant_id,

                quantity

              FROM
                order_items

              WHERE
                order_id = ?
            `,
        [order.id],
      );

      /*
        |--------------------------------------------------------------------------
        | Release Reserved Inventory
        |--------------------------------------------------------------------------
        */

      for (const item of items) {
        await c.execute(
          `
              UPDATE inventories

              SET
                reserved_quantity =
                  GREATEST(
                    0,

                    reserved_quantity - ?
                  ),

                updated_at =
                  NOW()

              WHERE
                product_variant_id = ?
            `,
          [item.quantity, item.product_variant_id],
        );
      }

      /*
        |--------------------------------------------------------------------------
        | Cancel Order
        |--------------------------------------------------------------------------
        */

      await c.execute(
        `
            UPDATE orders

            SET
              status =
                'cancelled',

              cancelled_at =
                NOW(),

              updated_at =
                NOW()

            WHERE
              id = ?

              AND user_id = ?
          `,
        [order.id, req.user.id],
      );
    });

    return ok(res, {
      success: true,

      message: "Order cancelled successfully.",
    });
  } catch (error) {
    console.error("Customer order cancel error:", error);

    return fail(res, "Unable to cancel order.", 500);
  }
}

/*
|--------------------------------------------------------------------------
| REORDER
|--------------------------------------------------------------------------
*/

export async function reorder(req, res) {
  try {
    /*
    |--------------------------------------------------------------------------
    | Order
    |--------------------------------------------------------------------------
    */

    const order = (
      await query(
        `
          SELECT *

          FROM orders

          WHERE
            id = ?

            AND user_id = ?

          LIMIT 1
        `,
        [req.params.id, req.user.id],
      )
    )[0];

    if (!order) {
      return fail(res, "Order not found.", 404);
    }

    /*
    |--------------------------------------------------------------------------
    | Only Delivered Orders
    |--------------------------------------------------------------------------
    */

    if (order.status !== "delivered") {
      return fail(res, "Only delivered orders can be reordered.", 422);
    }

    /*
    |--------------------------------------------------------------------------
    | Transaction
    |--------------------------------------------------------------------------
    */

    return await transaction(async (c) => {
      /*
        |--------------------------------------------------------------------------
        | Cart
        |--------------------------------------------------------------------------
        */

      const [carts] = await c.execute(
        `
              SELECT id

              FROM carts

              WHERE
                user_id = ?

              LIMIT 1
            `,
        [req.user.id],
      );

      let cartId = carts[0]?.id;

      /*
        |--------------------------------------------------------------------------
        | Create Cart if Missing
        |--------------------------------------------------------------------------
        */

      if (!cartId) {
        const [created] = await c.execute(
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
          [req.user.id],
        );

        cartId = created.insertId;
      }

      /*
        |--------------------------------------------------------------------------
        | Previous Order Items
        |--------------------------------------------------------------------------
        */

      const [items] = await c.execute(
        `
              SELECT *

              FROM
                order_items

              WHERE
                order_id = ?
            `,
        [order.id],
      );

      let added = 0;

      /*
        |--------------------------------------------------------------------------
        | Re-add Available Items
        |--------------------------------------------------------------------------
        */

      for (const item of items) {
        /*
          |--------------------------------------------------------------------------
          | Must Have Variant
          |--------------------------------------------------------------------------
          */

        if (!item.product_variant_id) {
          continue;
        }

        /*
          |--------------------------------------------------------------------------
          | Validate Variant + Product
          |--------------------------------------------------------------------------
          */

        const [variants] = await c.execute(
          `
                SELECT
                  pv.id,

                  pv.status,

                  p.status
                    AS product_status

                FROM
                  product_variants
                    pv

                JOIN products p
                  ON p.id =
                     pv.product_id

                WHERE
                  pv.id = ?

                LIMIT 1
              `,
          [item.product_variant_id],
        );

        const variant = variants[0];

        if (
          !variant ||
          variant.status !== "active" ||
          variant.product_status !== "active"
        ) {
          continue;
        }

        /*
          |--------------------------------------------------------------------------
          | Inventory
          |--------------------------------------------------------------------------
          */

        const [inv] = await c.execute(
          `
                SELECT
                  quantity,

                  reserved_quantity

                FROM
                  inventories

                WHERE
                  product_variant_id = ?

                LIMIT 1
              `,
          [item.product_variant_id],
        );

        const available = Math.max(
          0,

          Number(inv[0]?.quantity || 0) -
            Number(inv[0]?.reserved_quantity || 0),
        );

        /*
          |--------------------------------------------------------------------------
          | Skip if Nothing Available
          |--------------------------------------------------------------------------
          */

        if (available < Number(item.quantity)) {
          continue;
        }

        /*
          |--------------------------------------------------------------------------
          | Existing Cart Line
          |--------------------------------------------------------------------------
          |
          | Product Variant + Design must match.
          |
          */

        const [existing] = await c.execute(
          `
                SELECT
                  id,

                  quantity

                FROM
                  cart_items

                WHERE
                  cart_id = ?

                  AND
                  product_variant_id = ?

                  AND
                  design_option_id <=> ?

                LIMIT 1
              `,
          [cartId, item.product_variant_id, item.design_option_id || null],
        );

        /*
          |--------------------------------------------------------------------------
          | Update Existing
          |--------------------------------------------------------------------------
          */

        if (existing[0]) {
          const next = Math.min(
            available,

            Number(existing[0].quantity) + Number(item.quantity),
          );

          await c.execute(
            `
                UPDATE
                  cart_items

                SET
                  quantity = ?,

                  updated_at =
                    NOW()

                WHERE
                  id = ?
              `,
            [next, existing[0].id],
          );
        } else {
          /*
            |--------------------------------------------------------------------------
            | Add New Cart Line
            |--------------------------------------------------------------------------
            */

          await c.execute(
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
              cartId,

              item.product_variant_id,

              item.design_option_id || null,

              Math.min(
                available,

                Number(item.quantity),
              ),
            ],
          );
        }

        added += 1;
      }

      /*
        |--------------------------------------------------------------------------
        | Nothing Available
        |--------------------------------------------------------------------------
        */

      if (!added) {
        throw Object.assign(
          new Error(
            "None of the products from this order are currently available.",
          ),
          {
            status: 422,
          },
        );
      }

      /*
        |--------------------------------------------------------------------------
        | Update Cart Timestamp
        |--------------------------------------------------------------------------
        */

      await c.execute(
        `
            UPDATE carts

            SET
              updated_at =
                NOW()

            WHERE
              id = ?
          `,
        [cartId],
      );

      /*
        |--------------------------------------------------------------------------
        | Response
        |--------------------------------------------------------------------------
        */

      return ok(res, {
        success: true,

        message: `${added} product(s) added to your bag.`,

        data: {
          cart_id: cartId,

          added_items: added,
        },
      });
    });
  } catch (error) {
    console.error("Customer reorder error:", error);

    return fail(
      res,

      error?.message || "Unable to reorder this purchase.",

      error?.status || 500,
    );
  }
}
