"use client";

import {
  FormEvent,
  useCallback,
  useEffect,
  useState,
} from "react";

import Link from "next/link";

import {
  ArrowLeft,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Save,
  UserRound,
} from "lucide-react";

import {
  useRouter,
} from "next/navigation";

import {
  customerApiFetch,
} from "@/lib/customerApi";

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

type Customer = {
  id: number;

  name: string;
  email: string;

  phone:
    | string
    | null;

  status: string;
  role: string;

  created_at: string;
};

/* -------------------------------------------------------------------------- */
/* Page                                                                       */
/* -------------------------------------------------------------------------- */

export default function CustomerProfilePage() {
  const router =
    useRouter();

  const [
    customer,
    setCustomer,
  ] = useState<Customer | null>(
    null
  );

  const [
    name,
    setName,
  ] = useState("");

  const [
    email,
    setEmail,
  ] = useState("");

  const [
    phone,
    setPhone,
  ] = useState("");

  /* ------------------------------------------------------------------------ */
  /* Password                                                                 */
  /* ------------------------------------------------------------------------ */

  const [
    currentPassword,
    setCurrentPassword,
  ] = useState("");

  const [
    password,
    setPassword,
  ] = useState("");

  const [
    passwordConfirmation,
    setPasswordConfirmation,
  ] = useState("");

  const [
    showCurrentPassword,
    setShowCurrentPassword,
  ] = useState(false);

  const [
    showPassword,
    setShowPassword,
  ] = useState(false);

  /* ------------------------------------------------------------------------ */
  /* State                                                                    */
  /* ------------------------------------------------------------------------ */

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    saving,
    setSaving,
  ] = useState(false);

  const [
    passwordSaving,
    setPasswordSaving,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  const [
    success,
    setSuccess,
  ] = useState("");

  const [
    passwordError,
    setPasswordError,
  ] = useState("");

  const [
    passwordSuccess,
    setPasswordSuccess,
  ] = useState("");

  /* ------------------------------------------------------------------------ */
  /* Load                                                                     */
  /* ------------------------------------------------------------------------ */

  const loadProfile =
    useCallback(async () => {
      const token =
        localStorage.getItem(
          "customer_token"
        );

      if (!token) {
        router.replace(
          "/login"
        );

        return;
      }

      try {
        setLoading(true);
        setError("");

        const response =
          await customerApiFetch(
            "/customer/profile"
          );

        const data =
          await response.json();

        if (
          response.status ===
            401 ||
          response.status ===
            403
        ) {
          localStorage.removeItem(
            "customer_token"
          );

          localStorage.removeItem(
            "customer_user"
          );

          router.replace(
            "/login"
          );

          return;
        }

        if (!response.ok) {
          setError(
            data.message ||
              "Unable to load profile."
          );

          return;
        }

        const profile:
          Customer =
          data.data;

        setCustomer(
          profile
        );

        setName(
          profile.name || ""
        );

        setEmail(
          profile.email || ""
        );

        setPhone(
          profile.phone || ""
        );
      } catch {
        setError(
          "Unable to connect to server."
        );
      } finally {
        setLoading(false);
      }
    }, [router]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  /* ------------------------------------------------------------------------ */
  /* Laravel Error                                                            */
  /* ------------------------------------------------------------------------ */

  function firstError(
    data: any
  ) {
    if (!data?.errors) {
      return (
        data?.message ||
        "Something went wrong."
      );
    }

    const errors =
      Object.values(
        data.errors
      ).flat();

    return String(
      errors[0] ||
        data.message ||
        "Something went wrong."
    );
  }

  /* ------------------------------------------------------------------------ */
  /* Save Profile                                                             */
  /* ------------------------------------------------------------------------ */

  async function saveProfile(
    event: FormEvent
  ) {
    event.preventDefault();

    if (!name.trim()) {
      setError(
        "Name is required."
      );

      return;
    }

    if (!email.trim()) {
      setError(
        "Email address is required."
      );

      return;
    }

    try {
      setSaving(true);

      setError("");
      setSuccess("");

      const response =
        await customerApiFetch(
          "/customer/profile",
          {
            method: "PUT",

            body:
              JSON.stringify({
                name:
                  name.trim(),

                email:
                  email
                    .trim()
                    .toLowerCase(),

                phone:
                  phone.trim()
                    ? phone.trim()
                    : null,
              }),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        setError(
          firstError(
            data
          )
        );

        return;
      }

      setCustomer(
        data.data
      );

      /*
      |--------------------------------------------------------------------------
      | Update Cached Customer
      |--------------------------------------------------------------------------
      */

      localStorage.setItem(
        "customer_user",
        JSON.stringify(
          data.data
        )
      );

      setSuccess(
        "Profile updated successfully."
      );
    } catch {
      setError(
        "Unable to connect to server."
      );
    } finally {
      setSaving(false);
    }
  }

  /* ------------------------------------------------------------------------ */
  /* Change Password                                                          */
  /* ------------------------------------------------------------------------ */

  async function changePassword(
    event: FormEvent
  ) {
    event.preventDefault();

    setPasswordError("");
    setPasswordSuccess("");

    if (!currentPassword) {
      setPasswordError(
        "Enter your current password."
      );

      return;
    }

    if (
      password.length <
      8
    ) {
      setPasswordError(
        "New password must be at least 8 characters."
      );

      return;
    }

    if (
      password !==
      passwordConfirmation
    ) {
      setPasswordError(
        "Password confirmation does not match."
      );

      return;
    }

    try {
      setPasswordSaving(
        true
      );

      const response =
        await customerApiFetch(
          "/customer/profile/password",
          {
            method: "PUT",

            body:
              JSON.stringify({
                current_password:
                  currentPassword,

                password,

                password_confirmation:
                  passwordConfirmation,
              }),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        setPasswordError(
          firstError(
            data
          )
        );

        return;
      }

      setCurrentPassword("");
      setPassword("");
      setPasswordConfirmation("");

      setPasswordSuccess(
        data.message ||
          "Password changed successfully."
      );
    } catch {
      setPasswordError(
        "Unable to connect to server."
      );
    } finally {
      setPasswordSaving(
        false
      );
    }
  }

  /* ------------------------------------------------------------------------ */
  /* Loading                                                                  */
  /* ------------------------------------------------------------------------ */

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50">

        <p className="text-sm text-gray-500">
          Loading profile...
        </p>

      </main>
    );
  }

  /* ------------------------------------------------------------------------ */
  /* UI                                                                       */
  /* ------------------------------------------------------------------------ */

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-10">

      <div className="mx-auto max-w-4xl">

        {/* Back */}

        <Link
          href="/account"
          className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 transition hover:text-gray-900"
        >
          <ArrowLeft
            size={17}
          />

          My Account
        </Link>

        {/* Header */}

        <div className="mt-5">

          <h1 className="text-3xl font-semibold text-gray-900">
            Profile Settings
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Update your personal information and password.
          </p>

        </div>

        {/* ================================================================ */}
        {/* Profile                                                           */}
        {/* ================================================================ */}

        <section className="mt-7 rounded-xl border border-gray-200 bg-white">

          <div className="flex items-center gap-3 border-b border-gray-200 p-6">

            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-gray-100">

              <UserRound
                size={21}
                className="text-gray-600"
              />

            </div>

            <div>

              <h2 className="font-semibold text-gray-900">
                Personal Information
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Manage your BanglesMart account details.
              </p>

            </div>

          </div>

          <form
            onSubmit={
              saveProfile
            }
            className="p-6"
          >

            {error && (

              <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>

            )}

            {success && (

              <div className="mb-5 flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">

                <CheckCircle2
                  size={17}
                />

                {success}

              </div>

            )}

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

              {/* Name */}

              <div>

                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Full Name *
                </label>

                <input
                  type="text"
                  value={name}
                  onChange={(
                    event
                  ) => {
                    setName(
                      event.target.value
                    );

                    setSuccess("");
                  }}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none transition focus:border-gray-600"
                />

              </div>

              {/* Email */}

              <div>

                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Email Address *
                </label>

                <input
                  type="email"
                  value={email}
                  onChange={(
                    event
                  ) => {
                    setEmail(
                      event.target.value
                    );

                    setSuccess("");
                  }}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none transition focus:border-gray-600"
                />

              </div>

              {/* Phone */}

              <div>

                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Phone Number
                </label>

                <input
                  type="tel"
                  value={phone}
                  onChange={(
                    event
                  ) => {
                    setPhone(
                      event.target.value
                    );

                    setSuccess("");
                  }}
                  placeholder="9876543210"
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none transition focus:border-gray-600"
                />

              </div>

              {/* Customer ID */}

              <div>

                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Customer ID
                </label>

                <input
                  type="text"
                  value={
                    customer
                      ? `#${customer.id}`
                      : ""
                  }
                  disabled
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-500"
                />

              </div>

            </div>

            <div className="mt-6 flex justify-end">

              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-50"
              >

                <Save
                  size={17}
                />

                {saving
                  ? "Saving..."
                  : "Save Profile"}

              </button>

            </div>

          </form>

        </section>

        {/* ================================================================ */}
        {/* Password                                                          */}
        {/* ================================================================ */}

        <section className="mt-6 rounded-xl border border-gray-200 bg-white">

          <div className="flex items-center gap-3 border-b border-gray-200 p-6">

            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-gray-100">

              <KeyRound
                size={21}
                className="text-gray-600"
              />

            </div>

            <div>

              <h2 className="font-semibold text-gray-900">
                Change Password
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Choose a strong password for your account.
              </p>

            </div>

          </div>

          <form
            onSubmit={
              changePassword
            }
            className="p-6"
          >

            {passwordError && (

              <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {passwordError}
              </div>

            )}

            {passwordSuccess && (

              <div className="mb-5 flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">

                <CheckCircle2
                  size={17}
                />

                {passwordSuccess}

              </div>

            )}

            <div className="space-y-5">

              {/* Current */}

              <div>

                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Current Password *
                </label>

                <div className="relative">

                  <input
                    type={
                      showCurrentPassword
                        ? "text"
                        : "password"
                    }
                    value={
                      currentPassword
                    }
                    onChange={(
                      event
                    ) =>
                      setCurrentPassword(
                        event.target.value
                      )
                    }
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 pr-11 text-sm outline-none focus:border-gray-600"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowCurrentPassword(
                        !showCurrentPassword
                      )
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
                  >

                    {showCurrentPassword ? (
                      <EyeOff size={18} />
                    ) : (
                      <Eye size={18} />
                    )}

                  </button>

                </div>

              </div>

              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

                {/* New */}

                <div>

                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    New Password *
                  </label>

                  <div className="relative">

                    <input
                      type={
                        showPassword
                          ? "text"
                          : "password"
                      }
                      value={
                        password
                      }
                      onChange={(
                        event
                      ) =>
                        setPassword(
                          event.target.value
                        )
                      }
                      className="w-full rounded-lg border border-gray-300 px-4 py-2.5 pr-11 text-sm outline-none focus:border-gray-600"
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
                        <EyeOff size={18} />
                      ) : (
                        <Eye size={18} />
                      )}

                    </button>

                  </div>

                </div>

                {/* Confirm */}

                <div>

                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Confirm New Password *
                  </label>

                  <input
                    type={
                      showPassword
                        ? "text"
                        : "password"
                    }
                    value={
                      passwordConfirmation
                    }
                    onChange={(
                      event
                    ) =>
                      setPasswordConfirmation(
                        event.target.value
                      )
                    }
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-gray-600"
                  />

                </div>

              </div>

              <p className="text-xs leading-5 text-gray-400">
                Password must be at least 8 characters and contain letters and numbers.
              </p>

            </div>

            <div className="mt-6 flex justify-end">

              <button
                type="submit"
                disabled={
                  passwordSaving
                }
                className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-black disabled:opacity-50"
              >

                <KeyRound
                  size={17}
                />

                {passwordSaving
                  ? "Changing..."
                  : "Change Password"}

              </button>

            </div>

          </form>

        </section>

      </div>

    </main>
  );
}