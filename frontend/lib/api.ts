export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://127.0.0.1:8000/api";

export const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  "http://127.0.0.1:8000";

export async function apiFetch(
  endpoint: string,
  options: RequestInit = {},
) {
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("admin_token")
      : null;

  const headers = new Headers(
    options.headers,
  );

  headers.set(
    "Accept",
    "application/json",
  );

  /*
   * FormData must NOT receive
   * application/json.
   * Browser will automatically set
   * multipart/form-data + boundary.
   */
  if (
    options.body &&
    !(options.body instanceof FormData)
  ) {
    headers.set(
      "Content-Type",
      "application/json",
    );
  }

  /*
   * Admin authentication
   */
  if (token) {
    headers.set(
      "Authorization",
      `Bearer ${token}`,
    );
  }

  const response = await fetch(
    `${API_URL}${endpoint}`,
    {
      ...options,
      headers,
    },
  );

  /*
   * If backend says unauthenticated,
   * don't silently continue.
   */
  if (
    response.status === 401 &&
    typeof window !== "undefined"
  ) {
    console.error(
      "ADMIN AUTHENTICATION FAILED",
      {
        endpoint,
        hasToken: !!token,
        tokenLength: token?.length || 0,
      },
    );
  }

  return response;
}