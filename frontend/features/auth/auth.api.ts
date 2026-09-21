import { customerApiFetch } from "@/lib/customerApi";
import { API_ROUTES } from "@/lib/routes";
import type { Customer } from "@/types/ecommerce";

type AuthResult = { token: string; user: Customer };

async function parse(response: Response) {
  const json = await response.json();
  if (!response.ok) throw new Error(json?.message || "Authentication failed.");
  return json;
}

export async function requestPhoneOtp(phone: string) {
  const json = await parse(
    await customerApiFetch(API_ROUTES.customer.requestOtp, {
      method: "POST",
      body: JSON.stringify({ phone }),
    }),
  );
  return {
    message: json?.message || "OTP sent successfully.",
    debugOtp: json?.data?.debug_otp as string | undefined,
  };
}

export async function verifyPhoneOtp(phone: string, otp: string, name?: string): Promise<AuthResult> {
  const json = await parse(
    await customerApiFetch(API_ROUTES.customer.verifyOtp, {
      method: "POST",
      body: JSON.stringify({ phone, otp, name }),
    }),
  );
  return { token: json.token, user: json.user };
}

export async function loginWithEmail(email: string, password: string): Promise<AuthResult> {
  const json = await parse(
    await customerApiFetch(API_ROUTES.customer.login, {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
  );
  return { token: json.token, user: json.user };
}
