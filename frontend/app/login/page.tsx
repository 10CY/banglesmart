"use client";

import {
  FormEvent,
  Suspense,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import Script from "next/script";
import { ArrowLeft, KeyRound, Phone, ShieldCheck } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { customerApiFetch } from "@/lib/customerApi";

/* ==========================================================================
   TYPES
   ========================================================================== */

type PhoneStep = "phone" | "otp";

type Msg91SuccessCallback = (data: unknown) => void;

type Msg91FailureCallback = (error: unknown) => void;

type Msg91Configuration = {
  widgetId: string;
  tokenAuth: string;
  identifier?: string;
  exposeMethods: boolean;
  success: Msg91SuccessCallback;
  failure: Msg91FailureCallback;
};

/* ==========================================================================
   MSG91 WINDOW TYPES
   ========================================================================== */

declare global {
  interface Window {
    initSendOTP?: (configuration: Msg91Configuration) => void;

    sendOtp?: (
      identifier: string,
      success?: Msg91SuccessCallback,
      failure?: Msg91FailureCallback,
    ) => void;

    retryOtp?: (
      channel: string | null,
      success?: Msg91SuccessCallback,
      failure?: Msg91FailureCallback,
      reqId?: string,
    ) => void;

    verifyOtp?: (
      otp: number,
      success?: Msg91SuccessCallback,
      failure?: Msg91FailureCallback,
      reqId?: string,
    ) => void;

    getWidgetData?: () => unknown;

    isCaptchaVerified?: () => boolean;
  }
}

/* ==========================================================================
   MSG91 ENVIRONMENT
   ========================================================================== */

const MSG91_WIDGET_ID = process.env.NEXT_PUBLIC_MSG91_WIDGET_ID || "";

const MSG91_WIDGET_TOKEN = process.env.NEXT_PUBLIC_MSG91_WIDGET_TOKEN || "";

const RESEND_COOLDOWN_SECONDS = 30;

/* ==========================================================================
   HELPERS
   ========================================================================== */

function sanitizePhone(value: string): string {
  return String(value || "")
    .replace(/\D/g, "")
    .slice(0, 10);
}

/**
 * MSG91 expects:
 * 91XXXXXXXXXX
 *
 * Do not include +.
 */
function toMsg91Phone(phone: string): string {
  return `91${sanitizePhone(phone)}`;
}

/**
 * BanglesMart backend expects:
 * +91XXXXXXXXXX
 */
function toBackendPhone(phone: string): string {
  return `+91${sanitizePhone(phone)}`;
}

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error) {
    return error.message || fallback;
  }

  if (typeof error === "string" && error.trim()) {
    return error.trim();
  }

  if (error && typeof error === "object") {
    const object = error as Record<string, unknown>;

    const possibleMessages = [
      object.message,
      object.error,
      object.reason,
      object.description,
    ];

    for (const value of possibleMessages) {
      if (typeof value === "string" && value.trim()) {
        return value.trim();
      }
    }
  }

  return fallback;
}

function extractReqId(data: unknown): string | null {
  if (!data || typeof data !== "object") {
    return null;
  }

  const object = data as Record<string, unknown>;

  const candidates = [
    object.reqId,
    object.req_id,
    object.requestId,
    object.request_id,
  ];

  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim()) {
      return candidate.trim();
    }
  }

  if (object.data && typeof object.data === "object") {
    return extractReqId(object.data);
  }

  return null;
}

function looksLikeJwt(value: string): boolean {
  return value.trim().split(".").length === 3;
}

function extractAccessToken(data: unknown): string | null {
  if (typeof data === "string") {
    const value = data.trim();

    return looksLikeJwt(value) ? value : null;
  }

  if (!data || typeof data !== "object") {
    return null;
  }

  const object = data as Record<string, unknown>;

  const tokenCandidates = [
    object["access-token"],
    object.accessToken,
    object.access_token,
    object.token,
    object.jwt,
  ];

  for (const candidate of tokenCandidates) {
    if (typeof candidate === "string" && candidate.trim()) {
      return candidate.trim();
    }
  }

  if (typeof object.message === "string" && looksLikeJwt(object.message)) {
    return object.message.trim();
  }

  if (object.data && typeof object.data === "object") {
    return extractAccessToken(object.data);
  }

  return null;
}

/* ==========================================================================
   LOGIN CONTENT
   ========================================================================== */

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const redirectTo = searchParams.get("redirect") || "/account";

  /* ------------------------------------------------------------------------
     MSG91 INIT GUARD
     ------------------------------------------------------------------------ */

  const msg91InitStarted = useRef(false);

  /* ------------------------------------------------------------------------
     PHONE OTP STATE
     ------------------------------------------------------------------------ */

  const [phoneStep, setPhoneStep] = useState<PhoneStep>("phone");

  const [phone, setPhone] = useState("");

  const [otp, setOtp] = useState("");

  const [msg91Ready, setMsg91Ready] = useState(false);

  const [msg91ReqId, setMsg91ReqId] = useState<string | null>(null);

  // Actual deadline prevents the timer from drifting in background tabs.
  const [resendAvailableAt, setResendAvailableAt] = useState<number | null>(
    null,
  );
  const [resendSecondsLeft, setResendSecondsLeft] = useState(0);

  /* ------------------------------------------------------------------------
     COMMON STATE
     ------------------------------------------------------------------------ */

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");

  const [otpError, setOtpError] = useState("");

  const [message, setMessage] = useState("");

  /* ==========================================================================
     RESEND OTP COOLDOWN
     ========================================================================== */

  useEffect(() => {
    if (!resendAvailableAt || phoneStep !== "otp") {
      setResendSecondsLeft(0);
      return;
    }

    const refreshCountdown = () => {
      setResendSecondsLeft(
        Math.max(0, Math.ceil((resendAvailableAt - Date.now()) / 1000)),
      );
    };

    refreshCountdown();
    const intervalId = window.setInterval(refreshCountdown, 1000);

    return () => window.clearInterval(intervalId);
  }, [resendAvailableAt, phoneStep]);

  const resendCountdownLabel = `${String(Math.floor(resendSecondsLeft / 30)).padStart(2, "0")}:${String(resendSecondsLeft % 30).padStart(2, "0")}`;

  /* ==========================================================================
     SAFE REDIRECT
     ========================================================================== */

  const safeRedirect = useMemo(() => {
    if (redirectTo.startsWith("/") && !redirectTo.startsWith("//")) {
      return redirectTo;
    }

    return "/account";
  }, [redirectTo]);

  /* ==========================================================================
     SAVE SESSION
     ========================================================================== */

  function saveSession(token: string, user: unknown) {
    localStorage.setItem("customer_token", token);

    localStorage.setItem("customer_user", JSON.stringify(user));

    window.dispatchEvent(new Event("banglesmart:customer-refresh"));

    router.push(safeRedirect);
    router.refresh();
  }

  /* ==========================================================================
     MSG91 INITIALIZATION
     ========================================================================== */

  function initializeMsg91() {
    /*
     * Prevent duplicate initialization during HMR
     * and development re-renders.
     */

    if (msg91InitStarted.current) {
      if (
        typeof window.sendOtp === "function" &&
        typeof window.verifyOtp === "function"
      ) {
        setMsg91Ready(true);
      }

      return;
    }

    setError("");

    if (!MSG91_WIDGET_ID || !MSG91_WIDGET_TOKEN) {
      setMsg91Ready(false);

      setError(
        "MSG91 Widget ID or Widget Token is missing in frontend .env.local.",
      );

      console.warn("[MSG91] Frontend widget configuration is missing.");

      return;
    }

    if (typeof window.initSendOTP !== "function") {
      setMsg91Ready(false);

      setError("MSG91 verification service could not be initialized.");

      return;
    }

    msg91InitStarted.current = true;

    const configuration: Msg91Configuration = {
      widgetId: MSG91_WIDGET_ID,
      tokenAuth: MSG91_WIDGET_TOKEN,
      exposeMethods: true,

      /*
       * MSG91 requires these global callbacks.
       * Do not complete BanglesMart login here.
       * Login is completed only after verifyOtp succeeds.
       */

      success: (data) => {
        if (process.env.NODE_ENV === "development") {
          console.log("[MSG91] Global success event:", data);
        }
      },

      /*
       * Invalid OTP is an expected user error.
       * Use console.warn instead of console.error.
       */

      failure: (providerError) => {
        console.warn("[MSG91] Global provider failure:", providerError);
      },
    };

    try {
      window.initSendOTP(configuration);

      window.setTimeout(() => {
        const sendReady = typeof window.sendOtp === "function";

        const verifyReady = typeof window.verifyOtp === "function";

        const retryReady = typeof window.retryOtp === "function";

        if (process.env.NODE_ENV === "development") {
          console.log("[MSG91] SDK methods:", {
            sendOtp: sendReady,
            verifyOtp: verifyReady,
            retryOtp: retryReady,
          });
        }

        if (!sendReady || !verifyReady) {
          msg91InitStarted.current = false;
          setMsg91Ready(false);

          setError(
            "MSG91 verification service did not initialize correctly. Please refresh and try again.",
          );

          return;
        }

        setMsg91Ready(true);
        setError("");

        console.log("[MSG91] Widget ready.");
      }, 500);
    } catch (initializationError) {
      msg91InitStarted.current = false;
      setMsg91Ready(false);

      console.warn("[MSG91] Initialization failed:", initializationError);

      setError("Unable to initialize phone verification.");
    }
  }

  /* ==========================================================================
     SEND OTP
     ========================================================================== */

  async function sendOtp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setOtpError("");
    setMessage("");

    const cleanPhone = sanitizePhone(phone);

    if (cleanPhone.length !== 10) {
      setError("Enter a valid 10-digit mobile number.");

      return;
    }

    if (!msg91Ready || typeof window.sendOtp !== "function") {
      setError(
        "Phone verification is still loading. Please refresh and try again.",
      );

      return;
    }

    try {
      setLoading(true);

      const identifier = toMsg91Phone(cleanPhone);

      const result = await new Promise<unknown>((resolve, reject) => {
        window.sendOtp?.(
          identifier,

          (responseData) => {
            resolve(responseData);
          },

          (providerError) => {
            reject(
              new Error(getErrorMessage(providerError, "Unable to send OTP.")),
            );
          },
        );
      });

      const reqId = extractReqId(result);

      setMsg91ReqId(reqId);

      if (process.env.NODE_ENV === "development") {
        console.log("[MSG91] OTP sent.", {
          reqIdReceived: Boolean(reqId),
        });
      }

      setPhone(cleanPhone);
      setOtp("");
      setOtpError("");
      setPhoneStep("otp");
      setResendAvailableAt(Date.now() + RESEND_COOLDOWN_SECONDS * 1000);
      setResendSecondsLeft(RESEND_COOLDOWN_SECONDS);
      setMessage("OTP sent successfully.");
    } catch (sendError) {
      setError(getErrorMessage(sendError, "Unable to send OTP."));
    } finally {
      setLoading(false);
    }
  }

  /* ==========================================================================
     VERIFY OTP
     ========================================================================== */

  async function verifyOtp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setOtpError("");
    setMessage("");

    const cleanOtp = otp.replace(/\D/g, "");

    if (cleanOtp.length !== 6) {
      setOtpError("Enter the complete 6-digit OTP.");

      return;
    }

    if (typeof window.verifyOtp !== "function") {
      setError("MSG91 verification service is not ready.");

      return;
    }

    try {
      setLoading(true);
      setOtpError("");

      /*
       * Important:
       *
       * The failure callback MUST reject the Promise.
       * If it only updates state, the Promise remains pending.
       *
       * Also, do not use console.error for an invalid OTP.
       */

      const verificationResult = await new Promise<unknown>(
        (resolve, reject) => {
          window.verifyOtp?.(
            Number(cleanOtp),

            /*
             * MSG91 OTP verification success
             */

            (responseData) => {
              if (process.env.NODE_ENV === "development") {
                console.log("[MSG91] OTP verification successful.");
              }

              resolve(responseData);
            },

            /*
             * MSG91 OTP verification failure
             *
             * Invalid OTP is handled as a normal form error.
             */

            (providerError) => {
              console.warn("[MSG91] Invalid OTP:", providerError);

              reject(new Error("Invalid OTP. Please enter the correct OTP."));
            },

            msg91ReqId || undefined,
          );
        },
      );

      if (process.env.NODE_ENV === "development") {
        console.log(
          "[MSG91] Verification response received:",
          verificationResult,
        );
      }

      const accessToken = extractAccessToken(verificationResult);

      if (!accessToken) {
        console.warn(
          "[MSG91] Access token was not found in verification response.",
          verificationResult,
        );

        throw new Error(
          "MSG91 verified the OTP but did not return a usable access token.",
        );
      }

      /* ----------------------------------------------------------------------
         SEND MSG91 ACCESS TOKEN TO BACKEND
         ---------------------------------------------------------------------- */

      const response = await customerApiFetch(
        "/customer/auth/phone/msg91-login",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            phone: toBackendPhone(phone),
            access_token: accessToken,
          }),
        },
      );

      const data = await response.json();

      if (process.env.NODE_ENV === "development") {
        console.log("[BanglesMart] Login response:", data);
      }

      if (!response.ok) {
        throw new Error(
          data?.message ||
            data?.data?.message ||
            "Unable to complete phone login.",
        );
      }

      /* ----------------------------------------------------------------------
         READ BACKEND JWT
         ---------------------------------------------------------------------- */

      /*
       * Supported backend response formats:
       *
       * {
       *   success: true,
       *   data: {
       *     token: "...",
       *     user: {}
       *   }
       * }
       *
       * OR:
       *
       * {
       *   success: true,
       *   token: "...",
       *   user: {}
       * }
       */

      const loginToken = data?.data?.token || data?.token;

      const loginUser = data?.data?.user || data?.user || null;

      if (!loginToken) {
        console.warn("[BanglesMart] Login token missing.", data);

        throw new Error("Login token was not received from BanglesMart.");
      }

      /* ----------------------------------------------------------------------
         SAVE CUSTOMER SESSION
         ---------------------------------------------------------------------- */

      saveSession(loginToken, loginUser);

      console.log("[BanglesMart] Phone login successful.");
    } catch (verifyError) {
      /*
       * Do not use console.error for wrong OTP.
       * This prevents the Next.js red error overlay.
       */

      const messageText = getErrorMessage(verifyError, "Unable to verify OTP.");

      if (messageText.toLowerCase().includes("invalid otp")) {
        setOtpError(messageText);
      } else {
        setError(messageText);
      }
    } finally {
      setLoading(false);
    }
  }

  /* ==========================================================================
     RESEND OTP
     ========================================================================== */

  async function resendOtp() {
    if (
      loading ||
      (resendAvailableAt !== null && Date.now() < resendAvailableAt)
    ) {
      return;
    }

    setError("");
    setOtpError("");
    setMessage("");

    if (typeof window.retryOtp !== "function") {
      setError("MSG91 resend service is not ready.");

      return;
    }

    try {
      setLoading(true);

      const retryResult = await new Promise<unknown>((resolve, reject) => {
        window.retryOtp?.(
          "11", // MSG91 SMS channel

          (responseData) => {
            resolve(responseData);
          },

          (providerError) => {
            reject(
              new Error(
                getErrorMessage(providerError, "Unable to resend OTP."),
              ),
            );
          },

          msg91ReqId || undefined,
        );
      });

      const nextReqId = extractReqId(retryResult);

      if (nextReqId) {
        setMsg91ReqId(nextReqId);
      }

      setOtp("");
      setOtpError("");
      setResendAvailableAt(Date.now() + RESEND_COOLDOWN_SECONDS * 1000);
      setResendSecondsLeft(RESEND_COOLDOWN_SECONDS);
      setMessage("A new OTP has been sent.");
    } catch (retryError) {
      setError(getErrorMessage(retryError, "Unable to resend OTP."));
    } finally {
      setLoading(false);
    }
  }

  /* ==========================================================================
     CHANGE PHONE NUMBER
     ========================================================================== */

  function changePhone() {
    setPhoneStep("phone");
    setResendAvailableAt(null);
    setResendSecondsLeft(0);
    setOtp("");
    setMsg91ReqId(null);
    setError("");
    setOtpError("");
    setMessage("");
  }

  /* ==========================================================================
     RENDER
     ========================================================================== */

  return (
    <>
      {/* ======================================================================
          MSG91 WEB SDK
          ====================================================================== */}

      <Script
        id="msg91-otp-provider"
        src="https://verify.msg91.com/otp-provider.js"
        strategy="afterInteractive"
        onReady={initializeMsg91}
        onError={() => {
          msg91InitStarted.current = false;
          setMsg91Ready(false);

          setError("Unable to load MSG91 phone verification.");
        }}
      />

      <main className="min-h-screen bg-[#faf7f2] px-4 py-12 sm:py-16">
        <div className="mx-auto grid w-full max-w-5xl overflow-hidden rounded-[28px] border border-[#e8e1d7] bg-white shadow-[0_24px_80px_rgba(56,32,20,.10)] lg:grid-cols-[1.05fr_.95fr]">
          {/* ==================================================================
              LEFT SIDE
              ================================================================== */}

          <section className="hidden bg-[#650b12] p-12 text-white lg:flex lg:flex-col lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[.28em] text-white/70">
                BanglesMart
              </p>

              <h1 className="mt-7 max-w-md text-4xl font-semibold leading-tight">
                Your jewellery, wishlist and orders — all in one place.
              </h1>

              <p className="mt-5 max-w-md text-sm leading-7 text-white/75">
                Use your mobile number for a quick OTP login. New customers are
                created automatically after successful verification.
              </p>
            </div>

            <div className="space-y-4 text-sm text-white/85">
              <div className="flex items-center gap-3">
                <ShieldCheck size={19} />
                Secure OTP verification
              </div>

              <div className="flex items-center gap-3">
                <KeyRound size={19} />
                No password required for phone login
              </div>

              <div className="flex items-center gap-3">
                <Phone size={19} />
                Cart and wishlist linked to your account
              </div>
            </div>
          </section>

          {/* ==================================================================
              RIGHT SIDE
              ================================================================== */}

          <section className="p-6 sm:p-10 lg:p-12">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm text-[#6f6259] transition hover:text-[#650b12]"
            >
              <ArrowLeft size={16} />
              Back to store
            </Link>

            <p className="mt-8 text-xs font-semibold uppercase tracking-[.22em] text-[#8f0828]">
              Customer account
            </p>

            <h2 className="mt-3 text-3xl font-semibold text-[#241b17]">
              Welcome back
            </h2>

            <p className="mt-2 text-sm leading-6 text-[#776b63]">
              Login using your mobile number and OTP.
            </p>

            {/* ==================================================================
                ERROR MESSAGE
                ================================================================== */}

            {error && (
              <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            {/* ==================================================================
                OTP ERROR MESSAGE
                ================================================================== */}

            {otpError && (
              <div
                role="alert"
                className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
              >
                {otpError}
              </div>
            )}

            {/* ==================================================================
                SUCCESS MESSAGE
                ================================================================== */}

            {message && (
              <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                {message}
              </div>
            )}

            {/* ==================================================================
                PHONE LOGIN
                ================================================================== */}

            {phoneStep === "phone" ? (
              <form onSubmit={sendOtp} className="mt-6 space-y-5">
                <div>
                  <label
                    htmlFor="phone"
                    className="mb-2 block text-sm font-medium text-[#453a34]"
                  >
                    Mobile number
                  </label>

                  <div className="flex overflow-hidden rounded-xl border border-[#d9d0c7] bg-white focus-within:border-[#650b12]">
                    <span className="flex items-center border-r border-[#e5ddd5] bg-[#fbf9f6] px-4 text-sm font-semibold text-[#5f544d]">
                      +91
                    </span>

                    <input
                      id="phone"
                      name="phone"
                      type="tel"
                      inputMode="numeric"
                      autoComplete="tel-national"
                      required
                      maxLength={10}
                      value={phone}
                      onChange={(event) => {
                        setPhone(sanitizePhone(event.target.value));

                        setError("");
                        setOtpError("");
                        setMessage("");
                      }}
                      placeholder="10-digit mobile number"
                      className="min-w-0 flex-1 px-4 py-3 text-sm outline-none"
                    />
                  </div>

                  <p className="mt-2 text-xs text-[#8b817a]">
                    We will send a 6-digit verification code.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading || phone.length !== 10 || !msg91Ready}
                  className="w-full rounded-xl bg-[#650b12] px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-[#7b0d17] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading
                    ? "Sending OTP..."
                    : !msg91Ready
                      ? "Preparing verification..."
                      : "Continue with phone"}
                </button>
              </form>
            ) : (
              <form onSubmit={verifyOtp} className="mt-6 space-y-5">
                <div className="flex items-center justify-between gap-4">
                  <label
                    htmlFor="otp"
                    className="text-sm font-medium text-[#453a34]"
                  >
                    Verification code
                  </label>

                  <button
                    type="button"
                    onClick={changePhone}
                    disabled={loading}
                    className="text-xs font-semibold text-[#8f0828] disabled:opacity-50"
                  >
                    Change number
                  </button>
                </div>

                <div>
                  <p className="mb-3 text-xs leading-5 text-[#8b817a]">
                    Enter the 6-digit OTP sent to{" "}
                    <strong className="font-semibold text-[#453a34]">
                      +91 {phone}
                    </strong>
                  </p>

                  <input
                    id="otp"
                    name="otp"
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    required
                    maxLength={6}
                    value={otp}
                    onChange={(event) => {
                      setOtp(event.target.value.replace(/\D/g, "").slice(0, 6));

                      /*
                       * Clear the previous invalid OTP message
                       * as soon as the user starts typing again.
                       */

                      setOtpError("");
                      setError("");
                      setMessage("");
                    }}
                    placeholder="Enter 6-digit OTP"
                    className="w-full rounded-xl border border-[#d9d0c7] px-4 py-3 text-center text-lg tracking-[.35em] outline-none focus:border-[#650b12]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || otp.length !== 6}
                  className="w-full rounded-xl bg-[#650b12] px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-[#7b0d17] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading ? "Verifying..." : "Verify & continue"}
                </button>

                <button
                  type="button"
                  disabled={loading || resendSecondsLeft > 0 || !msg91Ready}
                  onClick={() => void resendOtp()}
                  className="w-full text-sm font-semibold text-[#8f0828] transition hover:underline disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {resendSecondsLeft > 0
                    ? `Resend OTP in ${resendCountdownLabel}`
                    : "Resend OTP"}
                </button>
              </form>
            )}

            {/* ==================================================================
                REGISTER LINK
                ================================================================== */}

            <p className="mt-8 border-t border-[#eee8e1] pt-6 text-center text-sm text-[#756961]">
              New to BanglesMart?{" "}
              <Link
                href="/register"
                className="font-semibold text-[#650b12] hover:underline"
              >
                Create an account
              </Link>
            </p>
          </section>
        </div>
      </main>
    </>
  );
}

/* ==========================================================================
   PAGE
   ========================================================================== */

export default function LoginPage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-[#faf7f2]" />}>
      <LoginContent />
    </Suspense>
  );
}
