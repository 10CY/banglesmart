import { query } from "../../db.js";
import { ok, fail } from "../../utils/http.js";

export async function quote(req, res) {
  try {
    const settings =
      (
        await query(
          `SELECT * FROM shipping_settings ORDER BY id LIMIT 1`,
        )
      )[0] || {
        flat_shipping_amount: 0,
        free_shipping_minimum: null,
        shipping_enabled: 1,
      };

    const amount = Number(
      req.query.amount ?? req.query.subtotal ?? 0,
    );

    if (!Number.isFinite(amount) || amount < 0) {
      return fail(res, "Invalid order amount.", 422);
    }

    const enabled = Boolean(settings.shipping_enabled);
    const freeMinimum =
      settings.free_shipping_minimum == null
        ? null
        : Number(settings.free_shipping_minimum);

    const flatAmount = Number(
      settings.flat_shipping_amount || 0,
    );

    const freeShipping =
      enabled &&
      freeMinimum != null &&
      freeMinimum > 0 &&
      amount >= freeMinimum;

    const shippingAmount =
      !enabled || freeShipping ? 0 : flatAmount;

    return ok(res, {
      success: true,
      data: {
        shipping_enabled: enabled,
        shipping_amount: shippingAmount,
        free_shipping: freeShipping,
        free_shipping_minimum: freeMinimum,
        flat_shipping_amount: flatAmount,
      },
    });
  } catch (error) {
    console.error("Customer shipping quote error:", error);
    return fail(res, "Unable to calculate shipping.", 500);
  }
}
