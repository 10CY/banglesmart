import { env } from "../config/env.js";
import { appError } from "../utils/errors.js";

/*
|--------------------------------------------------------------------------
| MSG91 Widget Server Verification
|--------------------------------------------------------------------------
*/

const MSG91_VERIFY_ACCESS_TOKEN_URL =
  "https://control.msg91.com/api/v5/widget/verifyAccessToken";

/*
|--------------------------------------------------------------------------
| Ensure Configuration
|--------------------------------------------------------------------------
*/

function ensureMsg91Configured() {
  if (!env.MSG91_AUTH_KEY) {
    console.error("[MSG91] MSG91_AUTH_KEY is missing.");

    throw appError("Phone verification service is not configured.", 503);
  }
}

/*
|--------------------------------------------------------------------------
| Parse MSG91 Response
|--------------------------------------------------------------------------
*/

async function parseResponse(response) {
  const raw = await response.text();

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw);
  } catch {
    return {
      raw,
    };
  }
}

/*
|--------------------------------------------------------------------------
| Provider Error Message
|--------------------------------------------------------------------------
*/

function providerMessage(data, fallback) {
  if (typeof data?.message === "string" && data.message.trim()) {
    return data.message.trim();
  }

  if (typeof data?.error === "string" && data.error.trim()) {
    return data.error.trim();
  }

  if (typeof data?.description === "string" && data.description.trim()) {
    return data.description.trim();
  }

  return fallback;
}

/*
|--------------------------------------------------------------------------
| VERIFY MSG91 WIDGET ACCESS TOKEN
|--------------------------------------------------------------------------
|
| This function runs AFTER window.verifyOtp() succeeds.
|
| Important:
|
| MSG91 expects the field literally as:
|
| "access-token"
|
|--------------------------------------------------------------------------
*/

export async function verifyMsg91AccessToken(rawAccessToken) {
  ensureMsg91Configured();

  const accessToken = String(rawAccessToken || "").trim();

  if (!accessToken) {
    throw appError("MSG91 access token is required.", 422);
  }

  let response;

  try {
    response = await fetch(MSG91_VERIFY_ACCESS_TOKEN_URL, {
      method: "POST",

      headers: {
        Accept: "application/json",

        "Content-Type": "application/json",

        /*
          |--------------------------------------------------------------------------
          | Keep account authkey server-side only
          |--------------------------------------------------------------------------
          */

        authkey: env.MSG91_AUTH_KEY,
      },

      /*
        |--------------------------------------------------------------------------
        | IMPORTANT
        |--------------------------------------------------------------------------
        |
        | Do not send:
        |
        | access_token
        | accessToken
        |
        | MSG91 requires:
        |
        | "access-token"
        |
        |--------------------------------------------------------------------------
        */

      body: JSON.stringify({
        authkey: env.MSG91_AUTH_KEY,

        "access-token": accessToken,
      }),
    });
  } catch (error) {
    console.error("[MSG91] Access token network error:", error);

    throw appError("Unable to connect to phone verification service.", 503);
  }

  const data = await parseResponse(response);

  console.log("[MSG91] Access-token verification:", {
    status: response.status,

    ok: response.ok,

    type: data?.type || null,

    message: data?.message || null,
  });

  /*
  |--------------------------------------------------------------------------
  | Authentication failure
  |--------------------------------------------------------------------------
  */

  if (response.status === 401 || response.status === 403) {
    throw appError(
      "MSG91 authentication failed. Check your backend MSG91 Auth Key.",
      503,
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Provider rejected token
  |--------------------------------------------------------------------------
  */

  if (!response.ok) {
    throw appError(
      providerMessage(data, "Phone verification failed."),
      response.status === 422 ? 422 : 503,
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Explicit provider error
  |--------------------------------------------------------------------------
  */

  if (String(data?.type || "").toLowerCase() === "error") {
    throw appError(providerMessage(data, "Phone verification failed."), 422);
  }

  return data;
}

/*
|--------------------------------------------------------------------------
| Legacy Direct OTP Endpoints
|--------------------------------------------------------------------------
|
| Your new frontend does NOT use these anymore.
|
| They remain exported so your existing controller imports don't make
| Node crash.
|
|--------------------------------------------------------------------------
*/

export async function requestPhoneOtp() {
  throw appError(
    "Legacy OTP endpoint is disabled. Use the MSG91 OTP Widget.",
    410,
  );
}

export async function verifyPhoneOtp() {
  throw appError(
    "Legacy OTP endpoint is disabled. Use the MSG91 OTP Widget.",
    410,
  );
}
