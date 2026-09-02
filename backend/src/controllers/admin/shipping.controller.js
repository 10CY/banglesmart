import { query } from "../../db.js";
import { ok, fail } from "../../utils/http.js";

function toNumberOrNull(value) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return null;
  }

  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : null;
}

function toNumber(value, fallback = 0) {
  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : fallback;
}

export async function show(req, res) {
  try {
    const setting = (
      await query(
        "SELECT * FROM shipping_settings ORDER BY id LIMIT 1"
      )
    )[0] || null;

    /*
    |--------------------------------------------------------------------------
    | If settings don't exist yet
    |--------------------------------------------------------------------------
    */

    if (!setting) {
      return ok(res, {
        success: true,
        data: {
          id: null,
          flat_shipping_amount: "99.00",
          free_shipping_minimum: "2000.00",
          shipping_enabled: true,
        },
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Normalize MySQL values
    |--------------------------------------------------------------------------
    |
    | MySQL may return shipping_enabled as:
    | 0 / 1 / "0" / "1"
    |
    | Frontend receives a proper boolean.
    |
    */

    return ok(res, {
      success: true,

      data: {
        ...setting,

        shipping_enabled:
          Boolean(
            Number(
              setting.shipping_enabled
            )
          ),
      },
    });
  } catch (error) {
    console.error(
      "Shipping settings show error:",
      error
    );

    return fail(
      res,
      "Unable to load shipping settings.",
      500
    );
  }
}


export async function update(req, res) {
  try {
    const x = req.body || {};

    /*
    |--------------------------------------------------------------------------
    | Validate Shipping Enabled
    |--------------------------------------------------------------------------
    */

    let shippingEnabled = x.shipping_enabled;

    if (
      shippingEnabled === true ||
      shippingEnabled === 1 ||
      shippingEnabled === "1" ||
      shippingEnabled === "true"
    ) {
      shippingEnabled = 1;
    } else if (
      shippingEnabled === false ||
      shippingEnabled === 0 ||
      shippingEnabled === "0" ||
      shippingEnabled === "false"
    ) {
      shippingEnabled = 0;
    } else {
      shippingEnabled = 1;
    }

    /*
    |--------------------------------------------------------------------------
    | Flat Shipping
    |--------------------------------------------------------------------------
    */

    const flatShippingAmount =
      toNumber(
        x.flat_shipping_amount,
        0
      );

    if (flatShippingAmount < 0) {
      return fail(
        res,
        "Flat shipping charge cannot be negative.",
        422
      );
    }

    /*
    |--------------------------------------------------------------------------
    | Free Shipping Minimum
    |--------------------------------------------------------------------------
    |
    | IMPORTANT:
    | Empty/null is intentionally converted to NULL.
    | This allows the admin to remove the free-shipping threshold.
    |
    */

    const freeShippingMinimum =
      toNumberOrNull(
        x.free_shipping_minimum
      );

    if (
      freeShippingMinimum !== null &&
      freeShippingMinimum < 0
    ) {
      return fail(
        res,
        "Free shipping minimum cannot be negative.",
        422
      );
    }

    /*
    |--------------------------------------------------------------------------
    | Logical Validation
    |--------------------------------------------------------------------------
    |
    | If both are configured, the free-shipping threshold should normally
    | be greater than the shipping charge.
    |
    */

    if (
      shippingEnabled === 1 &&
      freeShippingMinimum !== null &&
      freeShippingMinimum > 0 &&
      flatShippingAmount >= freeShippingMinimum
    ) {
      return fail(
        res,
        "Free shipping minimum should be greater than the flat shipping charge.",
        422
      );
    }

    /*
    |--------------------------------------------------------------------------
    | Existing Settings
    |--------------------------------------------------------------------------
    */

    const old = (
      await query(
        "SELECT * FROM shipping_settings ORDER BY id LIMIT 1"
      )
    )[0];

    /*
    |--------------------------------------------------------------------------
    | Update Existing
    |--------------------------------------------------------------------------
    */

    if (old) {
      await query(
        `UPDATE shipping_settings
         SET
           flat_shipping_amount=?,
           free_shipping_minimum=?,
           shipping_enabled=?,
           updated_at=NOW()
         WHERE id=?`,
        [
          flatShippingAmount,
          freeShippingMinimum,
          shippingEnabled,
          old.id,
        ]
      );
    }

    /*
    |--------------------------------------------------------------------------
    | Create Settings
    |--------------------------------------------------------------------------
    */

    else {
      await query(
        `INSERT INTO shipping_settings
         (
           flat_shipping_amount,
           free_shipping_minimum,
           shipping_enabled,
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
         )`,
        [
          flatShippingAmount,
          freeShippingMinimum,
          shippingEnabled,
        ]
      );
    }

    /*
    |--------------------------------------------------------------------------
    | Return Fresh Settings
    |--------------------------------------------------------------------------
    */

    const setting = (
      await query(
        "SELECT * FROM shipping_settings ORDER BY id LIMIT 1"
      )
    )[0];

    return ok(res, {
      success: true,

      message:
        "Shipping settings saved successfully.",

      data: {
        ...setting,

        shipping_enabled:
          Boolean(
            Number(
              setting.shipping_enabled
            )
          ),
      },
    });
  } catch (error) {
    console.error(
      "Shipping settings update error:",
      error
    );

    return fail(
      res,
      "Unable to save shipping settings.",
      500
    );
  }
}