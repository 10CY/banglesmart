import "dotenv/config";

export const env = {
  /* ============================================================
     APP
     ============================================================ */

  NODE_ENV: process.env.NODE_ENV || "development",

  PORT: Number(process.env.PORT || 8000),

  BACKEND_URL: (
    process.env.BACKEND_URL || `http://127.0.0.1:${process.env.PORT || 8000}`
  ).replace(/\/$/, ""),

  /* ============================================================
     DATABASE
     ============================================================ */

  DB_HOST: process.env.DB_HOST || "127.0.0.1",

  DB_PORT: Number(process.env.DB_PORT || 3306),

  DB_DATABASE: process.env.DB_DATABASE || "banglesmart",

  DB_USERNAME: process.env.DB_USERNAME || "root",

  DB_PASSWORD: process.env.DB_PASSWORD || "",

  DB_ENABLE_SSL:
    String(process.env.DB_ENABLE_SSL || "false").toLowerCase() === "true",

  DB_CA_PATH: process.env.DB_CA_PATH || "",

  /* ============================================================
     JWT
     ============================================================ */

  JWT_SECRET: process.env.JWT_SECRET || "dev-secret-change-me",

  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "30d",

  /* ============================================================
     CORS
     ============================================================ */

  CORS_ORIGINS: (
    process.env.CORS_ORIGINS || "http://localhost:3000,http://127.0.0.1:3000"
  )
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean),

  /* ============================================================
     STORAGE
     ============================================================ */

  STORAGE_DIR: process.env.STORAGE_DIR || "./storage",

  /* ============================================================
     CLOUDINARY
     ============================================================ */

  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME || "",

  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY || "",

  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET || "",

  /* ============================================================
     EMAIL
     ============================================================ */

  RESEND_API_KEY: process.env.RESEND_API_KEY || "",

  MAIL_FROM: process.env.MAIL_FROM || "BanglesMart <onboarding@resend.dev>",

  /* ============================================================
     GENERAL OTP
     ============================================================ */

  OTP_TTL_MINUTES: Math.max(1, Number(process.env.OTP_TTL_MINUTES || 5)),

  OTP_MAX_ATTEMPTS: Math.max(1, Number(process.env.OTP_MAX_ATTEMPTS || 5)),

  /* ============================================================
     OLD SMS PROVIDER
     ============================================================ */

  SMS_API_URL: process.env.SMS_API_URL || "",

  SMS_API_KEY: process.env.SMS_API_KEY || "",

  /* ============================================================
     MSG91
     ============================================================ */

  MSG91_AUTH_KEY: process.env.MSG91_AUTH_KEY || "",

  /* ============================================================
     RAZORPAY
     ============================================================ */

  RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID || "",

  RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET || "",

  RAZORPAY_WEBHOOK_SECRET: process.env.RAZORPAY_WEBHOOK_SECRET || "",
};
