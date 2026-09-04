import "dotenv/config";

export const env = {
  PORT: Number(process.env.PORT || 8000),

  DB_HOST: process.env.DB_HOST || "127.0.0.1",

  DB_PORT: Number(process.env.DB_PORT || 3306),

  DB_DATABASE: process.env.DB_DATABASE || "banglesmart",

  DB_USERNAME: process.env.DB_USERNAME || "root",

  DB_PASSWORD: process.env.DB_PASSWORD || "",

  DB_ENABLE_SSL:
    String(process.env.DB_ENABLE_SSL || "false").toLowerCase() === "true",

  DB_CA_PATH: process.env.DB_CA_PATH || "",

  JWT_SECRET: process.env.JWT_SECRET || "dev-secret-change-me",

  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "30d",

  BACKEND_URL: (
    process.env.BACKEND_URL ||
    `http://127.0.0.1:${process.env.PORT || 8000}`
  ).replace(/\/$/, ""),

  // Local storage - kept for backward compatibility
  STORAGE_DIR: process.env.STORAGE_DIR || "./storage",

  // Cloudinary
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME || "",
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY || "",
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET || "",

  CORS_ORIGINS: (
    process.env.CORS_ORIGINS || "http://localhost:3000"
  )
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean),

  RESEND_API_KEY: process.env.RESEND_API_KEY || "",

  MAIL_FROM:
    process.env.MAIL_FROM || "BanglesMart <onboarding@resend.dev>",
};