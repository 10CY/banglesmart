import bcrypt from "bcryptjs";
import { query } from "../../db.js";
import { ok, fail } from "../../utils/http.js";
import { normalizeIndianPhone } from "../../utils/phone.js";

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

function normalizeEmail(value) {
  if (value === null || value === undefined) {
    return null;
  }

  const email = String(value).trim().toLowerCase();

  return email || null;
}

function validEmail(email) {
  if (!email) {
    return false;
  }

  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/*
|--------------------------------------------------------------------------
| GET PROFILE
|--------------------------------------------------------------------------
*/

export async function show(req, res) {
  try {
    const user = (
      await query(
        `
          SELECT
            id,
            name,
            email,
            phone,
            phone_verified_at,
            role,
            status,
            created_at,
            updated_at

          FROM users

          WHERE id = ?

          LIMIT 1
        `,
        [req.user.id],
      )
    )[0];

    if (!user) {
      return fail(res, "User not found.", 404);
    }

    return ok(res, {
      success: true,
      data: user,
    });
  } catch (error) {
    console.error("Profile show error:", error);

    return fail(res, "Unable to load profile.", 500);
  }
}

/*
|--------------------------------------------------------------------------
| UPDATE PROFILE
|--------------------------------------------------------------------------
*/

export async function update(req, res) {
  try {
    const input = req.body || {};

    /*
    |--------------------------------------------------------------------------
    | Fresh Current User
    |--------------------------------------------------------------------------
    */

    const currentUser = (
      await query(
        `
          SELECT
            id,
            name,
            email,
            phone,
            phone_verified_at,
            role,
            status,
            created_at,
            updated_at

          FROM users

          WHERE id = ?

          LIMIT 1
        `,
        [req.user.id],
      )
    )[0];

    if (!currentUser) {
      return fail(res, "User not found.", 404);
    }

    /*
    |--------------------------------------------------------------------------
    | Name
    |--------------------------------------------------------------------------
    */

    const name =
      String(input.name ?? currentUser.name ?? "Customer").trim() || "Customer";

    if (name.length < 2) {
      return fail(res, "Name must be at least 2 characters.", 422);
    }

    if (name.length > 150) {
      return fail(res, "Name is too long.", 422);
    }

    /*
    |--------------------------------------------------------------------------
    | Email
    |--------------------------------------------------------------------------
    */

    const email = normalizeEmail(
      Object.prototype.hasOwnProperty.call(input, "email")
        ? input.email
        : currentUser.email,
    );

    if (!email) {
      return fail(res, "Email address is required.", 422);
    }

    if (!validEmail(email)) {
      return fail(res, "Enter a valid email address.", 422);
    }

    /*
    |--------------------------------------------------------------------------
    | Duplicate Email
    |--------------------------------------------------------------------------
    */

    const duplicateEmail = (
      await query(
        `
          SELECT id

          FROM users

          WHERE
            LOWER(email) = LOWER(?)

            AND id <> ?

          LIMIT 1
        `,
        [email, currentUser.id],
      )
    )[0];

    if (duplicateEmail) {
      return fail(res, "This email address is already in use.", 422);
    }

    /*
    |--------------------------------------------------------------------------
    | Phone
    |--------------------------------------------------------------------------
    |
    | Frontend sends:
    |
    | +919685989568
    |
    | Database stores:
    |
    | +919685989568
    |
    |--------------------------------------------------------------------------
    */

    let phone = currentUser.phone || null;

    if (Object.prototype.hasOwnProperty.call(input, "phone")) {
      if (
        input.phone === null ||
        input.phone === undefined ||
        String(input.phone).trim() === ""
      ) {
        phone = null;
      } else {
        phone = normalizeIndianPhone(input.phone);

        if (!phone) {
          return fail(res, "Enter a valid 10-digit mobile number.", 422);
        }
      }
    }

    /*
    |--------------------------------------------------------------------------
    | Duplicate Phone
    |--------------------------------------------------------------------------
    */

    if (phone) {
      const duplicatePhone = (
        await query(
          `
            SELECT id

            FROM users

            WHERE
              phone = ?

              AND id <> ?

            LIMIT 1
          `,
          [phone, currentUser.id],
        )
      )[0];

      if (duplicatePhone) {
        return fail(res, "This phone number is already in use.", 422);
      }
    }

    /*
    |--------------------------------------------------------------------------
    | Detect Phone Change
    |--------------------------------------------------------------------------
    */

    const oldPhone = currentUser.phone
      ? normalizeIndianPhone(currentUser.phone) || currentUser.phone
      : null;

    const phoneChanged = oldPhone !== phone;

    /*
    |--------------------------------------------------------------------------
    | Update Profile
    |--------------------------------------------------------------------------
    */

    await query(
      `
        UPDATE users

        SET
          name = ?,

          email = ?,

          phone = ?,

          phone_verified_at =
            CASE

              WHEN ? = 1
                THEN NULL

              ELSE
                phone_verified_at

            END,

          updated_at = NOW()

        WHERE id = ?
      `,
      [name, email, phone, phoneChanged ? 1 : 0, currentUser.id],
    );

    /*
    |--------------------------------------------------------------------------
    | Return Fresh Profile
    |--------------------------------------------------------------------------
    */

    const user = (
      await query(
        `
          SELECT
            id,
            name,
            email,
            phone,
            phone_verified_at,
            role,
            status,
            created_at,
            updated_at

          FROM users

          WHERE id = ?

          LIMIT 1
        `,
        [currentUser.id],
      )
    )[0];

    return ok(res, {
      success: true,

      message: "Profile updated successfully.",

      data: user,
    });
  } catch (error) {
    console.error("Profile update error:", error);

    return fail(res, error?.message || "Unable to update profile.", 500);
  }
}

/*
|--------------------------------------------------------------------------
| CHANGE PASSWORD
|--------------------------------------------------------------------------
*/

export async function changePassword(req, res) {
  try {
    const { current_password, password, password_confirmation } =
      req.body || {};

    /*
    |--------------------------------------------------------------------------
    | User
    |--------------------------------------------------------------------------
    */

    const user = (
      await query(
        `
          SELECT
            id,
            password

          FROM users

          WHERE id = ?

          LIMIT 1
        `,
        [req.user.id],
      )
    )[0];

    if (!user) {
      return fail(res, "User not found.", 404);
    }

    /*
    |--------------------------------------------------------------------------
    | Existing Password
    |--------------------------------------------------------------------------
    */

    if (user.password) {
      if (!current_password) {
        return fail(res, "Current password is required.", 422);
      }

      const matches = await bcrypt.compare(
        String(current_password),
        user.password,
      );

      if (!matches) {
        return fail(res, "Current password is incorrect.", 422);
      }
    }

    /*
    |--------------------------------------------------------------------------
    | New Password
    |--------------------------------------------------------------------------
    */

    if (!password || String(password).length < 8) {
      return fail(res, "Password must be at least 8 characters.", 422);
    }

    /*
    |--------------------------------------------------------------------------
    | Confirmation
    |--------------------------------------------------------------------------
    */

    if (password !== password_confirmation) {
      return fail(res, "Passwords do not match.", 422);
    }

    /*
    |--------------------------------------------------------------------------
    | Prevent Same Password
    |--------------------------------------------------------------------------
    */

    if (user.password) {
      const samePassword = await bcrypt.compare(
        String(password),
        user.password,
      );

      if (samePassword) {
        return fail(
          res,
          "New password must be different from your current password.",
          422,
        );
      }
    }

    /*
    |--------------------------------------------------------------------------
    | Hash
    |--------------------------------------------------------------------------
    */

    const hashedPassword = await bcrypt.hash(String(password), 12);

    /*
    |--------------------------------------------------------------------------
    | Save
    |--------------------------------------------------------------------------
    */

    await query(
      `
        UPDATE users

        SET
          password = ?,

          updated_at = NOW()

        WHERE id = ?
      `,
      [hashedPassword, user.id],
    );

    return ok(res, {
      success: true,

      message: user.password
        ? "Password changed successfully."
        : "Password created successfully.",
    });
  } catch (error) {
    console.error("Password change error:", error);

    return fail(res, error?.message || "Unable to update password.", 500);
  }
}
