import { apiFetch } from "@/lib/api";

function filenameFromDisposition(value: string | null) {
  if (!value) return null;
  const utf8 = value.match(/filename\*=UTF-8''([^;]+)/i)?.[1];
  if (utf8) return decodeURIComponent(utf8.replace(/["']/g, ""));
  return value.match(/filename="?([^";]+)"?/i)?.[1] || null;
}

export async function downloadAdminFile(endpoint: string, fallbackName: string) {
  const response = await apiFetch(endpoint);
  if (!response.ok) {
    const json = await response.json().catch(() => null);
    throw new Error(json?.message || "Unable to download file.");
  }

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filenameFromDisposition(response.headers.get("content-disposition")) || fallbackName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
