import { API_URL } from "@/lib/api";

const BACKEND_URL = API_URL.replace(
  /\/api\/?$/,
  ""
);

const CLOUDINARY_BASE_URL = "https://res.cloudinary.com/dvqm3ilsg/image/upload/";

export function getProductImageUrl(
  image?: string | null
): string | null {
  if (!image) {
    return null;
  }

  if (
    image.startsWith("http://") ||
    image.startsWith("https://")
  ) {
    return image;
  }

  const clean = image.replace(/^\/+/, "").replace(/^storage\//, "");
  const pathWithFolder = clean.startsWith("banglesmart/")
    ? clean
    : `banglesmart/${clean}`;

  return `${CLOUDINARY_BASE_URL}${pathWithFolder}`;
}