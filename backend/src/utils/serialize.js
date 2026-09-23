import { env } from "../config/env.js";

export function imageUrl(v) {
  if (!v) return null;

  const str = String(v).trim();
  if (!str) return null;

  const httpMatch = str.match(/(https?:\/\/[^\s]+)/i);
  if (httpMatch) {
    return httpMatch[1];
  }

  const cloudName = env.CLOUDINARY_CLOUD_NAME || "dvqm3ilsg";
  if (str.includes("banglesmart/") || str.includes("cloudinary")) {
    const cleanPath = str.replace(/^categories\//, "");
    return `https://res.cloudinary.com/${cloudName}/image/upload/${cleanPath}`;
  }

  return `${env.BACKEND_URL}/storage/${str.replace(/^\/+/, "")}`;
}