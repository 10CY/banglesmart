import { env } from "../config/env.js";

export function imageUrl(v) {
  if (!v) return null;

  // If already a complete URL
  if (/^https?:\/\//i.test(v)) {
    return v;
  }

  const clean = String(v).replace(/^\/+/, "");

  if (env.CLOUDINARY_CLOUD_NAME) {
    const pathWithFolder = clean.startsWith("banglesmart/")
      ? clean
      : `banglesmart/${clean}`;
    return `https://res.cloudinary.com/${env.CLOUDINARY_CLOUD_NAME}/image/upload/${pathWithFolder}`;
  }

  return `${env.BACKEND_URL}/storage/${clean}`;
}