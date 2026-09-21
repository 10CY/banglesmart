import {
  query,
  transaction,
} from "../../db.js";

import {
  ok,
  fail,
} from "../../utils/http.js";

import {
  createRazorpayOrder,
  fetchRazorpayPayment,
  verifyRazorpaySignature,
} from "../../services/razorpay.service.js";

import { env } from "../../config/env.js";

/*
|--------------------------------------------------------------------------
| CREATE RAZORPAY ORDER
|--------------------------------------------------------------------------
|
| POST /customer/payments/razorpay/order
|
|--------------------------------------------------------------------------
*/

export async function createPaymentOrder(
  req,
  res,
) {
  try {
    const orderId =
      Number(req.body?.order_id);

    if (
      !Number.isInteger(orderId) ||
      orderId <= 0
    ) {
      return fail(
        res,
        "Invalid order.",
        422,
      );
    }

    /*
    |--------------------------------------------------------------------------
    | Get BanglesMart order
    |--------------------------------------------------------------------------
    */

    const order = (
      await query(
        `
          SELECT *
          FROM orders
          WHERE id = ?
            AND user_id = ?
          LIMIT 1
        `,
        [
          orderId,
          req.user.id,
        ],
      )
    )[0];

    if (!order) {
      return fail(
        res,
        "Order not found.",
        404,
      );
    }

    if (
      order.payment_method !==
      "razorpay"
    ) {
      return fail(
        res,
        "This order is not an online payment order.",
        422,
      );
    }

    if (
      order.payment_status ===
      "paid"
    ) {
      return fail(
        res,
        "Order is already paid.",
        409,
      );
    }

    /*
    |--------------------------------------------------------------------------
    | Reuse Razorpay order if already created
    |--------------------------------------------------------------------------
    */

    if (
      order.razorpay_order_id
    ) {
      return ok(res, {
        success: true,

        data: {
          key_id:
            env.RAZORPAY_KEY_ID,

          banglesmart_order_id:
            order.id,

          order_number:
            order.order_number,

          razorpay_order_id:
            order.razorpay_order_id,

          amount:
            Math.round(
              Number(
                order.total_amount,
              ) * 100,
            ),

          currency:
            "INR",
        },
      });
    }

    /*
    |--------------------------------------------------------------------------
    | IMPORTANT
    |
    | Use amount from DATABASE.
    |
    | Never trust amount sent by frontend.
    |--------------------------------------------------------------------------
    */

    const amount =
      Math.round(
        Number(
          order.total_amount,
        ) * 100,
      );

    if (
      !Number.isInteger(amount) ||
      amount <= 0
    ) {
      return fail(
        res,
        "Invalid order amount.",
        422,
      );
    }

    /*
    |--------------------------------------------------------------------------
    | Create Razorpay Order
    |--------------------------------------------------------------------------
    */

    const razorpayOrder =
      await createRazorpayOrder({
        amount,

        receipt:
          order.order_number,

        notes: {
          banglesmart_order_id:
            String(order.id),

          banglesmart_order_number:
            String(
              order.order_number,
            ),

          customer_id:
            String(req.user.id),
        },
      });

    /*
    |--------------------------------------------------------------------------
    | Save Razorpay Order ID
    |--------------------------------------------------------------------------
    */

    await query(
      `
        UPDATE orders

        SET
          razorpay_order_id = ?,
          updated_at = NOW()

        WHERE id = ?
          AND user_id = ?
      `,
      [
        razorpayOrder.id,
        order.id,
        req.user.id,
      ],
    );

    return ok(res, {
      success: true,

      data: {
        key_id:
          env.RAZORPAY_KEY_ID,

        banglesmart_order_id:
          order.id,

        order_number:
          order.order_number,

        razorpay_order_id:
          razorpayOrder.id,

        amount:
          razorpayOrder.amount,

        currency:
          razorpayOrder.currency,
      },
    });
  } catch (error) {
    console.error(
      "Create Razorpay order error:",
      error,
    );

    return fail(
      res,
      error?.message ||
        "Unable to start payment.",
      error?.status || 500,
    );
  }
}

/*
|--------------------------------------------------------------------------
| VERIFY RAZORPAY PAYMENT
|--------------------------------------------------------------------------
|
| POST /customer/payments/razorpay/verify
|
|--------------------------------------------------------------------------
*/

export async function verifyPayment(
  req,
  res,
) {
  try {
    const {
      banglesmart_order_id,

      razorpay_order_id,

      razorpay_payment_id,

      razorpay_signature,
    } = req.body || {};

    const orderId =
      Number(
        banglesmart_order_id,
      );

    if (
      !orderId ||
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature
    ) {
      return fail(
        res,
        "Incomplete payment verification information.",
        422,
      );
    }

    /*
    |--------------------------------------------------------------------------
    | Load OUR order
    |--------------------------------------------------------------------------
    */

    const order = (
      await query(
        `
          SELECT *
          FROM orders

          WHERE id = ?
            AND user_id = ?

          LIMIT 1
        `,
        [
          orderId,
          req.user.id,
        ],
      )
    )[0];

    if (!order) {
      return fail(
        res,
        "Order not found.",
        404,
      );
    }

    /*
    |--------------------------------------------------------------------------
    | Already Paid = idempotent success
    |--------------------------------------------------------------------------
    */

    if (
      order.payment_status ===
      "paid"
    ) {
      return ok(res, {
        success: true,

        message:
          "Payment already verified.",

        data: order,
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Order ID must match DATABASE
    |--------------------------------------------------------------------------
    */

    if (
      !order.razorpay_order_id ||
      order.razorpay_order_id !==
        razorpay_order_id
    ) {
      return fail(
        res,
        "Razorpay order mismatch.",
        422,
      );
    }

    /*
    |--------------------------------------------------------------------------
    | Verify HMAC Signature
    |--------------------------------------------------------------------------
    */

    const signatureValid =
      verifyRazorpaySignature({
        orderId:
          order.razorpay_order_id,

        paymentId:
          razorpay_payment_id,

        signature:
          razorpay_signature,
      });

    if (!signatureValid) {
      return fail(
        res,
        "Invalid payment signature.",
        422,
      );
    }

    /*
    |--------------------------------------------------------------------------
    | Fetch Payment From Razorpay
    |--------------------------------------------------------------------------
    */

    const payment =
      await fetchRazorpayPayment(
        razorpay_payment_id,
      );

    /*
    |--------------------------------------------------------------------------
    | Payment must belong to our Razorpay Order
    |--------------------------------------------------------------------------
    */

    if (
      payment.order_id !==
      order.razorpay_order_id
    ) {
      return fail(
        res,
        "Payment does not belong to this order.",
        422,
      );
    }

    /*
    |--------------------------------------------------------------------------
    | Verify Amount
    |--------------------------------------------------------------------------
    */

    const expectedAmount =
      Math.round(
        Number(
          order.total_amount,
        ) * 100,
      );

    if (
      Number(payment.amount) !==
      expectedAmount
    ) {
      return fail(
        res,
        "Payment amount mismatch.",
        422,
      );
    }

    /*
    |--------------------------------------------------------------------------
    | Verify Currency
    |--------------------------------------------------------------------------
    */

    if (
      payment.currency !==
      "INR"
    ) {
      return fail(
        res,
        "Invalid payment currency.",
        422,
      );
    }

    /*
    |--------------------------------------------------------------------------
    | Require Captured Payment
    |--------------------------------------------------------------------------
    */

    if (
      payment.status !==
      "captured"
    ) {
      return fail(
        res,
        `Payment is ${payment.status}.`,
        409,
      );
    }

    /*
    |--------------------------------------------------------------------------
    | Mark Paid
    |--------------------------------------------------------------------------
    */

    await transaction(
      async (connection) => {
        await connection.execute(
          `
            UPDATE orders

            SET
              payment_status = 'paid',

              razorpay_payment_id = ?,

              razorpay_signature = ?,

              paid_at = NOW(),

              updated_at = NOW()

            WHERE id = ?
              AND user_id = ?
              AND payment_status <> 'paid'
          `,
          [
            razorpay_payment_id,
            razorpay_signature,
            order.id,
            req.user.id,
          ],
        );
      },
    );

    /*
    |--------------------------------------------------------------------------
    | Return Updated Order
    |--------------------------------------------------------------------------
    */

    const updatedOrder = (
      await query(
        `
          SELECT *
          FROM orders

          WHERE id = ?
            AND user_id = ?

          LIMIT 1
        `,
        [
          order.id,
          req.user.id,
        ],
      )
    )[0];

    return ok(res, {
      success: true,

      message:
        "Payment verified successfully.",

      data: updatedOrder,
    });
  } catch (error) {
    console.error(
      "Verify Razorpay payment error:",
      error,
    );

    return fail(
      res,
      error?.message ||
        "Unable to verify payment.",
      error?.status || 500,
    );
  }
}