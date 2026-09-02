import {
  API_URL,
} from "./apiConfig";

export async function customerApiFetch(
  endpoint: string,
  options: RequestInit = {}
) {
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem(
          "customer_token"
        )
      : null;

  const headers =
    new Headers(options.headers);

  headers.set(
    "Accept",
    "application/json"
  );

  if (
    options.body &&
    !(options.body instanceof FormData)
  ) {
    headers.set(
      "Content-Type",
      "application/json"
    );
  }

  if (token) {
    headers.set(
      "Authorization",
      `Bearer ${token}`
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