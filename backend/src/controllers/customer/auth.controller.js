import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import { query } from "../../db.js";

import { env } from "../../config/env.js";

import { fail, ok } from "../../utils/http.js";

import { normalizeIndianPhone } from "../../utils/phone.js";

import {
  requestPhoneOtp,
  verifyPhoneOtp,
  verifyMsg91AccessToken,
} from "../../services/otp.service.js";

/* ==========================================================================
   BANGLESMART JWT
   ========================================================================== */

const token = (user) =>
  jwt.sign(
    {
      sub: user.id,

      role: "customer",

      type: "customer",
    },

    env.JWT_SECRET,

    {
      expiresIn: env.JWT_EXPIRES_IN,
    },
  );

/* ==========================================================================
   PUBLIC USER
   ========================================================================== */

const pub = (user) => ({
  id: Number(user.id),

  name: user.name,

  email: user.email,

  phone: user.phone,

  phone_verified_at: user.phone_verified_at || null,

  role: user.role,

  status: user.status,

  created_at: user.created_at,
});

/* ==========================================================================
   EXTRACT VERIFIED PHONE FROM MSG91 RESPONSE
   ========================================================================== */

function findIdentifier(value) {
  if (!value || typeof value !== "object") {
    return null;
  }

  const candidates = [
    value.message,
    value.identifier,
    value.mobile,
    value.phone,
    value.phone_number,
    value.phoneNumber,
    value.userIdentifier,
  ];

  for (const candidate of candidates) {
    if (candidate === null || candidate === undefined) {
      continue;
    }

    const cleaned = String(candidate)
      .trim()
      .replace(/\s+/g, "");

    if (
      /^\+?91\d{10}$/.test(cleaned) ||
      /^[6-9]\d{9}$/.test(cleaned)
    ) {
      return cleaned;
    }
  }

  const nestedKeys = [
    "data",
    "user",
    "result",
    "payload",
  ];

  for (const key of nestedKeys) {
    if (
      value[key] &&
      typeof value[key] === "object"
    ) {
      const result = findIdentifier(value[key]);

      if (result) {
        return result;
      }
    }
  }

  return null;
}

/* ==========================================================================
   EXTRACT PHONE FROM VERIFIED MSG91 JWT
   ========================================================================== */

function phoneFromMsg91Token(accessToken) {
  try {
    const decoded = jwt.decode(accessToken);

    if (!decoded || typeof decoded !== "object") {
      return null;
    }

    return findIdentifier(decoded);
  } catch {
    return null;
  }
}

/* ==========================================================================
   REGISTER
   ========================================================================== */

export async function register(req, res) {
  try {
    const { name, email, phone, password, password_confirmation } =
      req.body || {};

    if (!name || !email || !password) {
      return fail(res, "Name, email and password are required.", 422);
    }

    if (String(password).length < 8) {
      return fail(res, "Password must be at least 8 characters.", 422);
    }

    if (
      password_confirmation !== undefined &&
      password !== password_confirmation
    ) {
      return fail(res, "Passwords do not match.", 422);
    }

    const normalizedEmail = String(email).trim().toLowerCase();

    const normalizedPhone = phone ? normalizeIndianPhone(phone) : null;

    if (phone && !normalizedPhone) {
      return fail(res, "Enter a valid mobile number.", 422);
    }

    const duplicate = await query(
      `
          SELECT id
          FROM users
          WHERE
            email = ?
            OR (
              ? IS NOT NULL
              AND phone = ?
            )
          LIMIT 1
        `,

      [normalizedEmail, normalizedPhone, normalizedPhone],
    );

    if (duplicate.length) {
      return fail(
        res,
        "An account with this email or phone already exists.",
        422,
      );
    }

    const hash = await bcrypt.hash(password, 12);

    const result = await query(
      `
          INSERT INTO users
          (
            name,
            email,
            phone,
            password,
            role,
            status,
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
            'active',
            NOW(),
            NOW()
          )
        `,

      [String(name).trim(), normalizedEmail, normalizedPhone, hash, "customer"],
    );

    const user = (
      await query(
        `
            SELECT *
            FROM users
            WHERE id = ?
            LIMIT 1
          `,

        [result.insertId],
      )
    )[0];

    return ok(
      res,
      {
        success: true,

        message: "Account created successfully.",

        token: token(user),

        user: pub(user),
      },
      201,
    );
  } catch (error) {
    console.error("Customer register error:", error);

    return fail(res, error?.message || "Unable to create account.", 500);
  }
}

/* ==========================================================================
   EMAIL LOGIN
   ========================================================================== */

export async function login(req, res) {
  try {
    const { email, password } = req.body || {};

    const user = (
      await query(
        `
            SELECT *
            FROM users
            WHERE email = ?
            LIMIT 1
          `,

        [
          String(email || "")
            .trim()
            .toLowerCase(),
        ],
      )
    )[0];

    if (
      !user ||
      !user.password ||
      !(await bcrypt.compare(password || "", user.password))
    ) {
      return fail(res, "Invalid email or password.", 422);
    }

    if (user.role !== "customer") {
      return fail(res, "This account cannot use customer login.", 403);
    }

    if (user.status !== "active") {
      return fail(res, "Your account is currently inactive.", 403);
    }

    return ok(res, {
      success: true,

      message: "Login successful.",

      token: token(user),

      user: pub(user),
    });
  } catch (error) {
    console.error("Customer login error:", error);

    return fail(res, "Unable to log in.", 500);
  }
}

/* ==========================================================================
   MSG91 WIDGET LOGIN
   ========================================================================== */

export async function msg91Login(req, res) {
  try {
    const body = req.body || {};

    /*
    |--------------------------------------------------------------------------
    | Accept all common frontend property names
    |--------------------------------------------------------------------------
    */

    const accessToken = String(
      body.access_token ??
        body.accessToken ??
        body["access-token"] ??
        ""
    ).trim();

    if (!accessToken) {
      return fail(
        res,
        "MSG91 access token is required.",
        422
      );
    }

    /*
    |--------------------------------------------------------------------------
    | Requested phone
    |--------------------------------------------------------------------------
    */

    const requestedPhone = normalizeIndianPhone(body.phone);

    if (!requestedPhone) {
      return fail(
        res,
        "Enter a valid mobile number.",
        422
      );
    }

    /*
    |--------------------------------------------------------------------------
    | Verify Token With MSG91
    |--------------------------------------------------------------------------
    */

    const providerData =
      await verifyMsg91AccessToken(accessToken);

    console.log("[MSG91] Access-token verification:", {
      status: providerData?.status,
      ok: providerData?.ok,
      type: providerData?.type,
      message: providerData?.message,
    });

    /*
    |--------------------------------------------------------------------------
    | Get the identifier verified by MSG91
    |--------------------------------------------------------------------------
    */

    let providerIdentifier =
      findIdentifier(providerData);

    /*
    |--------------------------------------------------------------------------
    | If provider response does not expose identifier directly,
    | inspect the already provider-verified JWT.
    |--------------------------------------------------------------------------
    */

    if (!providerIdentifier) {
      providerIdentifier =
        phoneFromMsg91Token(accessToken);
    }

    console.log(
      "[MSG91] Extracted verified mobile number:",
      providerIdentifier
    );

    /*
    |--------------------------------------------------------------------------
    | Normalize verified phone
    |--------------------------------------------------------------------------
    */

    const verifiedPhone =
      normalizeIndianPhone(providerIdentifier);

    console.log("[MSG91] Phone comparison:", {
      requestedPhone,
      verifiedPhone,
    });

    if (!verifiedPhone) {
      console.error(
        "[MSG91] Could not extract verified mobile number.",
        {
          providerData,
          providerIdentifier,
        }
      );

      return fail(
        res,
        "MSG91 verified the OTP but the verified mobile number could not be confirmed.",
        422
      );
    }

    /*
    |--------------------------------------------------------------------------
    | Critical Security Check
    |--------------------------------------------------------------------------
    | Customer must not be able to verify number A and submit number B.
    |--------------------------------------------------------------------------
    */

    if (verifiedPhone !== requestedPhone) {
      console.error("[MSG91] Phone mismatch.", {
        requestedPhone,
        verifiedPhone,
      });

      return fail(
        res,
        "Verified mobile number does not match the requested mobile number.",
        422
      );
    }

    /*
    |--------------------------------------------------------------------------
    | Find Existing Customer
    |--------------------------------------------------------------------------
    */

    let user = (
      await query(
        `
          SELECT *
          FROM users
          WHERE
            phone = ?
            AND role = 'customer'
          LIMIT 1
        `,
        [verifiedPhone]
      )
    )[0];

    /*
    |--------------------------------------------------------------------------
    | Create New Customer
    |--------------------------------------------------------------------------
    */

    if (!user) {
      const name =
        String(body.name || "Customer").trim() ||
        "Customer";

      const result = await query(
        `
          INSERT INTO users
          (
            name,
            email,
            phone,
            password,
            phone_verified_at,
            role,
            status,
            created_at,
            updated_at
          )
          VALUES
          (
            ?,
            NULL,
            ?,
            NULL,
            NOW(),
            'customer',
            'active',
            NOW(),
            NOW()
          )
        `,
        [name, verifiedPhone]
      );

      user = (
        await query(
          `
            SELECT *
            FROM users
            WHERE id = ?
            LIMIT 1
          `,
          [result.insertId]
        )
      )[0];
    } else {
      /*
      |--------------------------------------------------------------------------
      | Existing Customer Status
      |--------------------------------------------------------------------------
      */

      if (user.status !== "active") {
        return fail(
          res,
          "Your account is currently inactive.",
          403
        );
      }

      /*
      |--------------------------------------------------------------------------
      | Mark Phone Verified
      |--------------------------------------------------------------------------
      */

      await query(
        `
          UPDATE users
          SET
            phone_verified_at =
              COALESCE(
                phone_verified_at,
                NOW()
              ),
            updated_at = NOW()
          WHERE id = ?
        `,
        [user.id]
      );

      user = (
        await query(
          `
            SELECT *
            FROM users
            WHERE id = ?
            LIMIT 1
          `,
          [user.id]
        )
      )[0];
    }

    /*
    |--------------------------------------------------------------------------
    | BanglesMart Login
    |--------------------------------------------------------------------------
    */

    return ok(res, {
      success: true,
      message: "Phone verified successfully.",
      token: token(user),
      user: pub(user),
    });
  } catch (error) {
    console.error(
      "MSG91 customer login error:",
      error
    );

    return fail(
      res,
      error?.message ||
        "Unable to verify phone number.",
      error?.status || 500
    );
  }
}

/* ==========================================================================
   LEGACY REQUEST OTP
   ========================================================================== */

export async function requestOtp(req, res) {
  try {
    const data = await requestPhoneOtp(req.body?.phone, "login");

    return ok(res, {
      success: true,

      message: "OTP sent successfully.",

      data,
    });
  } catch (error) {
    return fail(
      res,
      error?.message || "Unable to send OTP.",

      error?.status || 500,
    );
  }
}

/* ==========================================================================
   LEGACY VERIFY OTP
   ========================================================================== */

export async function verifyOtp(req, res) {
  try {
    const phone = await verifyPhoneOtp(
      req.body?.phone,

      req.body?.otp,

      "login",
    );

    let user = (
      await query(
        `
            SELECT *
            FROM users
            WHERE
              phone = ?
              AND role = 'customer'
            LIMIT 1
          `,

        [phone],
      )
    )[0];

    if (!user) {
      const name = String(req.body?.name || "Customer").trim() || "Customer";

      const result = await query(
        `
            INSERT INTO users
            (
              name,
              email,
              phone,
              password,
              phone_verified_at,
              role,
              status,
              created_at,
              updated_at
            )
            VALUES
            (
              ?,
              NULL,
              ?,
              NULL,
              NOW(),
              'customer',
              'active',
              NOW(),
              NOW()
            )
          `,

        [name, phone],
      );

      user = (
        await query(
          `
              SELECT *
              FROM users
              WHERE id = ?
              LIMIT 1
            `,

          [result.insertId],
        )
      )[0];
    } else {
      if (user.status !== "active") {
        return fail(res, "Your account is currently inactive.", 403);
      }

      await query(
        `
          UPDATE users

          SET
            phone_verified_at =
              COALESCE(
                phone_verified_at,
                NOW()
              ),

            updated_at =
              NOW()

          WHERE id = ?
        `,

        [user.id],
      );

      user = (
        await query(
          `
              SELECT *
              FROM users
              WHERE id = ?
            `,

          [user.id],
        )
      )[0];
    }

    return ok(res, {
      success: true,

      message: "Phone verified successfully.",

      token: token(user),

      user: pub(user),
    });
  } catch (error) {
    return fail(
      res,
      error?.message || "Unable to verify OTP.",

      error?.status || 500,
    );
  }
}

/* ==========================================================================
   ME
   ========================================================================== */

export async function me(req, res) {
  if (req.user.role !== "customer") {
    return fail(res, "Customer not found.", 403);
  }

  return ok(res, {
    success: true,

    data: pub(req.user),
  });
}

/* ==========================================================================
   LOGOUT
   ========================================================================== */

export async function logout(req, res) {
  return ok(res, {
    success: true,

    message: "Logged out successfully.",
  });
}
