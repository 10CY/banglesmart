import Razorpay from "razorpay";
import crypto from "node:crypto";

import { env } from "../config/env.js";
import { appError } from "../utils/errors.js";

/*
|--------------------------------------------------------------------------
| Ensure Configuration
|--------------------------------------------------------------------------
*/

function ensureRazorpayConfigured() {
  if (
    !env.RAZORPAY_KEY_ID ||
    !env.RAZORPAY_KEY_SECRET
  ) {
    throw appError(
      "Razorpay payment service is not configured.",
      503,
    );
  }
}

/*
|--------------------------------------------------------------------------
| Razorpay Client
|--------------------------------------------------------------------------
*/

function getRazorpayClient() {
  ensureRazorpayConfigured();

  return new Razorpay({
    key_id: env.RAZORPAY_KEY_ID,
    key_secret: env.RAZORPAY_KEY_SECRET,
  });
}

/*
|--------------------------------------------------------------------------
| Create Razorpay Order
|--------------------------------------------------------------------------
|
| amount = paise
|
| ₹500 = 50000
|
|--------------------------------------------------------------------------
*/

export async function createRazorpayOrder({
  amount,
  receipt,
  notes = {},
}) {
  const cleanAmount = Number(amount);

  if (
    !Number.isInteger(cleanAmount) ||
    cleanAmount <= 0
  ) {
    throw appError(
      "Invalid Razorpay payment amount.",
      422,
    );
  }

  const razorpay = getRazorpayClient();

  return razorpay.orders.create({
    amount: cleanAmount,

    currency: "INR",

    receipt:
      String(receipt || "")
        .slice(0, 40),

    notes,

    partial_payment: false,
  });
}

/*
|--------------------------------------------------------------------------
| Verify Checkout Signature
|--------------------------------------------------------------------------
*/

export function verifyRazorpaySignature({
  orderId,
  paymentId,
  signature,
}) {
  ensureRazorpayConfigured();

  const expectedSignature =
    crypto
      .createHmac(
        "sha256",
        env.RAZORPAY_KEY_SECRET,
      )
      .update(
        `${orderId}|${paymentId}`,
      )
      .digest("hex");

  const expected =
    Buffer.from(
      expectedSignature,
      "utf8",
    );

  const received =
    Buffer.from(
      String(signature || ""),
      "utf8",
    );

  if (
    expected.length !==
    received.length
  ) {
    return false;
  }

  return crypto.timingSafeEqual(
    expected,
    received,
  );
}

/*
|--------------------------------------------------------------------------
| Fetch Razorpay Payment
|--------------------------------------------------------------------------
*/

export async function fetchRazorpayPayment(
  paymentId,
) {
  ensureRazorpayConfigured();

  const razorpay =
    getRazorpayClient();

  return razorpay.payments.fetch(
    paymentId,
  );
}