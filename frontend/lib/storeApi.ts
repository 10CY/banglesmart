import {
  API_URL,
} from "./apiConfig";

export async function storeApiFetch(
  endpoint: string,
  options: RequestInit = {}
) {
  const headers =
    new Headers(options.headers);

  headers.set(
    "Accept",
    "application/json"
  );

  /*
   * Customer authentication
   */
  if (
    typeof window !== "undefined"
  ) {
    const token =
      localStorage.getItem(
        "customer_token"
      );

    if (token) {
      headers.set(
        "Authorization",
        `Bearer ${token}`
      );
    }
  }

  /*
   * JSON requests
   *
   * Do NOT set Content-Type for FormData.
   */
  if (
    options.body &&
    !(options.body instanceof FormData)
  ) {
    headers.set(
      "Content-Type",
      "application/json"
    );
  }

  return fetch(
    `${API_URL}${endpoint}`,
    {
      ...options,
      headers,
    }
  );
}