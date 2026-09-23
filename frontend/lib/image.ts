import { API_URL } from "@/lib/api";

const BACKEND_URL = API_URL.replace(
  /\/api\/?$/,
  ""
);

export function getMediaUrl(image?: string | null): string | null {
  if (!image) {
    return null;
  }

  const str = String(image).trim();
  if (!str) {
    return null;
  }

  const httpMatch = str.match(/(https?:\/\/[^\s]+)/i);
  if (httpMatch) {
    return httpMatch[1];
  }

  if (str.includes("banglesmart/") || str.includes("cloudinary")) {
    const cleanPath = str.replace(/^categories\//, "");
    return `https://res.cloudinary.com/dvqm3ilsg/image/upload/${cleanPath}`;
  }

  const cleanPath = str.replace(/^\/+/, "");
  const finalPath = cleanPath.startsWith("storage/")
    ? cleanPath
    : `storage/${cleanPath}`;

  return `${BACKEND_URL}/${finalPath}`;
}

export function getProductImageUrl(
  image?: string | null
): string | null {
  return getMediaUrl(image);
}

export function getCategoryImageUrl(
  category?: { image?: string | null; image_url?: string | null } | null
): string {
  if (!category) return "";
  if (category.image_url) {
    const url = getMediaUrl(category.image_url);
    if (url) return url;
  }
  return getMediaUrl(category.image) || "";
}