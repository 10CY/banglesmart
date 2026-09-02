"use client";

import {
  FormEvent,
  useState,
} from "react";

import Link from "next/link";

import {
  Eye,
  EyeOff,
} from "lucide-react";

import {
  useRouter,
} from "next/navigation";

import { API_URL } from "@/lib/api";

export default function LoginPage() {
  const router =
    useRouter();

  const [
    email,
    setEmail,
  ] = useState("");

  const [
    password,
    setPassword,
  ] = useState("");

  const [
    showPassword,
    setShowPassword,
  ] = useState(false);

  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `${API_URL}/customer/login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            email,
            password,
          }),
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        const validationErrors =
          data.errors as
            | Record<
                string,
                string[]
              >
            | undefined;

        const firstError =
          validationErrors
            ? Object.values(
                validationErrors
              )[0]?.[0]
            : undefined;

        setError(
          firstError ||
            data.message ||
            "Unable to login."
        );

        return;
      }

      localStorage.setItem(
        "customer_token",
        data.token
      );

      localStorage.setItem(
        "customer_user",
        JSON.stringify(
          data.user
        )
      );

      window.dispatchEvent(new Event("banglesmart:customer-refresh"));

      router.push(
        "/account"
      );

      router.refresh();
    } catch {
      setError(
        "Unable to connect to server."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">

      <div className="w-full max-w-md">

        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">

          <div className="mb-7">

            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gray-500">
              BanglesMart
            </p>

            <h1 className="mt-3 text-3xl font-semibold text-gray-900">
              Welcome back
            </h1>

            <p className="mt-2 text-sm text-gray-500">
              Login to your
              BanglesMart account.
            </p>

          </div>

          {error && (
            <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            className="space-y-5"
          >

            <div>

              <label className="mb-2 block text-sm font-medium text-gray-700">
                Email Address
              </label>

              <input
                type="email"
                required
                value={email}
                onChange={(event) =>
                  setEmail(
                    event.target.value
                  )
                }
                placeholder="you@example.com"
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-gray-700"
              />

            </div>

            <div>

              <label className="mb-2 block text-sm font-medium text-gray-700">
                Password
              </label>

              <div className="relative">

                <input
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  required
                  value={password}
                  onChange={(event) =>
                    setPassword(
                      event.target.value
                    )
                  }
                  placeholder="Enter password"
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 pr-11 text-sm text-gray-900 outline-none transition focus:border-gray-700"
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowPassword(
                      !showPassword
                    )
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
                >
                  {showPassword ? (
                    <EyeOff
                      size={18}
                    />
                  ) : (
                    <Eye
                      size={18}
                    />
                  )}
                </button>

              </div>

            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-gray-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-black disabled:opacity-50"
            >
              {loading
                ? "Logging in..."
                : "Login"}
            </button>

          </form>

          <div className="mt-4 text-center">
            <Link href="/forgot-password" className="text-sm font-semibold text-[#8f0828] hover:underline">Forgot password?</Link>
          </div>

          <p className="mt-6 text-center text-sm text-gray-500">

            New to BanglesMart?{" "}

            <Link
              href="/register"
              className="font-medium text-gray-900 hover:underline"
            >
              Create account
            </Link>

          </p>

        </div>

      </div>

    </main>
  );
}