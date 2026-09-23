import { env } from "../config/env.js";

export function imageUrl(v) {
  if (!v) return null;

  const str = String(v).trim();
  if (!str) return null;

  const httpMatch = str.match(/(https?:\/\/[^\s]+)/i);
  if (httpMatch) {
    return httpMatch[1];
  }

  return `${env.BACKEND_URL}/storage/${str.replace(/^\/+/, "")}`;
}