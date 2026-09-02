import { query } from "../../db.js";
import { ok, fail } from "../../utils/http.js";

function normalizeCoupon(coupon) {
  if (!coupon) return null;

  return {
    id: Number(coupon.id),
    code: coupon.code,
    type: coupon.type,
    value: Number(coupon.value || 0),
    minimum_order_amount: Number(coupon.minimum_order_amount || 0),
    maximum_discount_amount:
      coupon.maximum_discount_amount == null
        ? null
        : Number(coupon.maximum_discount_amount),
    usage_limit:
      coupon.usage_limit == null ? null : Number(coupon.usage_limit),
    per_user_limit: Number(coupon.per_user_limit || 1),
    starts_at: coupon.starts_at,
    expires_at: coupon.expires_at,
    status: coupon.status,
  };
}

export async function validateCoupon(req, res) {
  try {
    const code = String(req.body?.code || "").trim().toUpperCase();
    const amount = Number(req.body?.order_amount ?? req.body?.subtotal ?? 0);

    if (!code) return fail(res, "Coupon code is required.", 422);
    if (!Number.isFinite(amount) || amount < 0) {
      return fail(res, "Invalid order amount.", 422);
    }

    const coupon = (
      await query(
        `SELECT * FROM coupons WHERE UPPER(code)=? LIMIT 1`,
        [code],
      )
    )[0];

    if (!coupon) return fail(res, "Invalid coupon code.", 422);

    const now = new Date();

    if (
      coupon.status !== "active" ||
      (coupon.starts_at && new Date(coupon.starts_at) > now) ||
      (coupon.expires_at && new Date(coupon.expires_at) < now)
    ) {
      return fail(res, "Coupon is not active.", 422);
    }

    if (amount < Number(coupon.minimum_order_amount || 0)) {
      return fail(
        res,
        `Minimum order amount is ₹${coupon.minimum_order_amount}.`,
        422,
      );
    }

    if (coupon.usage_limit != null) {
      const usageRows = await query(
        `SELECT COUNT(*) AS count FROM coupon_usages WHERE coupon_id=?`,
        [coupon.id],
      );

      if (Number(usageRows[0]?.count || 0) >= Number(coupon.usage_limit)) {
        return fail(res, "This coupon has reached its usage limit.", 422);
      }
    }

    const userUsageRows = await query(
      `SELECT COUNT(*) AS count FROM coupon_usages WHERE coupon_id=? AND user_id=?`,
      [coupon.id, req.user.id],
    );

    if (
      Number(userUsageRows[0]?.count || 0) >=
      Number(coupon.per_user_limit || 1)
    ) {
      return fail(res, "You have already used this coupon the maximum number of times.", 422);
    }

    const couponType = String(
  coupon.type || ""
)
  .trim()
  .toLowerCase();

const couponValue = Number(
  coupon.value || 0
);

let discount = 0;

if (
  couponType === "percentage" ||
  couponType === "percent"
) {
  discount =
    (amount * couponValue) / 100;
} else if (
  couponType === "fixed" ||
  couponType === "flat" ||
  couponType === "amount"
) {
  discount = couponValue;
}

    if (coupon.maximum_discount_amount != null) {
      discount = Math.min(
        discount,
        Number(coupon.maximum_discount_amount),
      );
    }

    discount = Math.max(0, Math.min(discount, amount));

    const normalized = normalizeCoupon(coupon);

    return ok(res, {
      success: true,
      message: "Coupon applied successfully.",
      data: {
        coupon: normalized,
        discount_amount: Number(discount.toFixed(2)),
      },
    });
  } catch (error) {
    console.error("Customer coupon validation error:", error);
    return fail(res, "Unable to validate coupon.", 500);
  }
}
