import { API_URL } from "@/lib/api";

const BACKEND_URL = API_URL.replace(
  /\/api\/?$/,
  ""
);

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

  return `${BACKEND_URL}${
    image.startsWith("/")
      ? ""
      : "/"
  }${image}`;
}