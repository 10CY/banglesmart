export async function readApiJson<T = unknown>(
  response: Response,
  fallbackMessage = "Request failed.",
): Promise<T> {
  const json = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      json && typeof json === "object" && "message" in json
        ? String((json as { message?: unknown }).message || fallbackMessage)
        : fallbackMessage;
    throw new Error(message);
  }

  return json as T;
}
