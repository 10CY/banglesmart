"use client";

import {
  FormEvent,
  useCallback,
  useEffect,
  useState,
} from "react";

import Link from "next/link";

import {
  AlertCircle,
  ArrowLeft,
  BadgeCheck,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  LockKeyhole,
  Mail,
  Phone,
  Save,
  ShieldCheck,
  UserRound,
  X,
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
  phone: string | null;
  status: string;
  role: string;
  created_at: string;
};

type Toast = {
  type: "success" | "error";
  message: string;
} | null;

/* -------------------------------------------------------------------------- */
/* Page                                                                       */
/* -------------------------------------------------------------------------- */

export default function CustomerProfilePage() {
  const router = useRouter();

  /* ------------------------------------------------------------------------ */
  /* Customer                                                                 */
  /* ------------------------------------------------------------------------ */

  const [
    customer,
    setCustomer,
  ] = useState<Customer | null>(null);

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

  const [
    showConfirmPassword,
    setShowConfirmPassword,
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
    passwordError,
    setPasswordError,
  ] = useState("");

  const [
    toast,
    setToast,
  ] = useState<Toast>(null);

  /* ------------------------------------------------------------------------ */
  /* Toast                                                                    */
  /* ------------------------------------------------------------------------ */

  function showToast(
    type: "success" | "error",
    message: string,
  ) {
    setToast({
      type,
      message,
    });

    window.setTimeout(() => {
      setToast(null);
    }, 3500);
  }

  /* ------------------------------------------------------------------------ */
  /* Load Profile                                                             */
  /* ------------------------------------------------------------------------ */

  const loadProfile =
    useCallback(async () => {
      const token =
        localStorage.getItem(
          "customer_token",
        );

      if (!token) {
        router.replace(
          "/login",
        );

        return;
      }

      try {
        setLoading(true);

        setError("");

        const response =
          await customerApiFetch(
            "/customer/profile",
          );

        const data =
          await response.json();

        if (
          response.status === 401 ||
          response.status === 403
        ) {
          localStorage.removeItem(
            "customer_token",
          );

          localStorage.removeItem(
            "customer_user",
          );

          router.replace(
            "/login",
          );

          return;
        }

        if (!response.ok) {
          setError(
            data.message ||
              "Unable to load profile.",
          );

          return;
        }

        const profile:
          Customer =
          data.data;

        setCustomer(
          profile,
        );

        setName(
          profile.name || "",
        );

        setEmail(
          profile.email || "",
        );

        setPhone(
          profile.phone || "",
        );
      } catch {
        setError(
          "Unable to connect to server.",
        );
      } finally {
        setLoading(false);
      }
    }, [router]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  /* ------------------------------------------------------------------------ */
  /* Error Helper                                                             */
  /* ------------------------------------------------------------------------ */

  function firstError(
    data: any,
  ) {
    if (!data?.errors) {
      return (
        data?.message ||
        "Something went wrong."
      );
    }

    const errors =
      Object.values(
        data.errors,
      ).flat();

    return String(
      errors[0] ||
        data.message ||
        "Something went wrong.",
    );
  }

  /* ------------------------------------------------------------------------ */
  /* Save Profile                                                             */
  /* ------------------------------------------------------------------------ */

  async function saveProfile(
    event: FormEvent,
  ) {
    event.preventDefault();

    if (!name.trim()) {
      setError(
        "Name is required.",
      );

      return;
    }

    if (!email.trim()) {
      setError(
        "Email address is required.",
      );

      return;
    }

    try {
      setSaving(true);

      setError("");

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
          },
        );

      const data =
        await response.json();

      if (!response.ok) {
        setError(
          firstError(
            data,
          ),
        );

        return;
      }

      setCustomer(
        data.data,
      );

      localStorage.setItem(
        "customer_user",
        JSON.stringify(
          data.data,
        ),
      );

      window.dispatchEvent(
        new Event(
          "banglesmart:customer-refresh",
        ),
      );

      showToast(
        "success",
        "Profile updated successfully.",
      );
    } catch {
      setError(
        "Unable to connect to server.",
      );
    } finally {
      setSaving(false);
    }
  }

  /* ------------------------------------------------------------------------ */
  /* Change Password                                                          */
  /* ------------------------------------------------------------------------ */

  async function changePassword(
    event: FormEvent,
  ) {
    event.preventDefault();

    setPasswordError("");

    if (!currentPassword) {
      setPasswordError(
        "Enter your current password.",
      );

      return;
    }

    if (
      password.length < 8
    ) {
      setPasswordError(
        "New password must be at least 8 characters.",
      );

      return;
    }

    if (
      password !==
      passwordConfirmation
    ) {
      setPasswordError(
        "Password confirmation does not match.",
      );

      return;
    }

    try {
      setPasswordSaving(
        true,
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
          },
        );

      const data =
        await response.json();

      if (!response.ok) {
        setPasswordError(
          firstError(
            data,
          ),
        );

        return;
      }

      setCurrentPassword(
        "",
      );

      setPassword(
        "",
      );

      setPasswordConfirmation(
        "",
      );

      showToast(
        "success",
        data.message ||
          "Password changed successfully.",
      );
    } catch {
      setPasswordError(
        "Unable to connect to server.",
      );
    } finally {
      setPasswordSaving(
        false,
      );
    }
  }

  /* ------------------------------------------------------------------------ */
  /* Initial                                                                  */
  /* ------------------------------------------------------------------------ */

  const initial =
    customer?.name
      ?.trim()
      ?.charAt(0)
      ?.toUpperCase() ||
    "U";

  /* ------------------------------------------------------------------------ */
  /* Loading                                                                  */
  /* ------------------------------------------------------------------------ */

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#faf9f9] px-4">

        <div className="flex flex-col items-center">

          <div className="relative">

            <div className="h-20 w-20 animate-pulse rounded-full bg-[#8f0828]/10" />

            <UserRound
              size={30}
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-[#8f0828]"
            />

          </div>

          <p className="mt-5 text-sm font-medium text-gray-500">
            Loading your profile...
          </p>

        </div>

      </main>
    );
  }

  /* ------------------------------------------------------------------------ */
  /* UI                                                                       */
  /* ------------------------------------------------------------------------ */

  return (
    <main className="min-h-screen bg-[#faf9f9] px-4 py-6 sm:px-6 sm:py-10">

      {/* ================================================================ */}
      {/* Toast                                                             */}
      {/* ================================================================ */}

      {toast && (

        <div className="fixed right-4 top-4 z-[100] w-[calc(100%-2rem)] max-w-sm sm:right-6">

          <div
            className={`flex items-start gap-3 rounded-2xl border bg-white p-4 shadow-2xl ${
              toast.type ===
              "success"
                ? "border-green-100"
                : "border-red-100"
            }`}
          >

            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                toast.type ===
                "success"
                  ? "bg-green-50 text-green-600"
                  : "bg-red-50 text-red-600"
              }`}
            >

              {toast.type ===
              "success" ? (

                <CheckCircle2
                  size={20}
                />

              ) : (

                <AlertCircle
                  size={20}
                />

              )}

            </div>

            <div className="flex-1">

              <p className="text-sm font-bold text-gray-900">

                {toast.type ===
                "success"
                  ? "Success"
                  : "Something went wrong"}

              </p>

              <p className="mt-1 text-sm leading-5 text-gray-500">
                {toast.message}
              </p>

            </div>

            <button
              type="button"
              onClick={() =>
                setToast(null)
              }
              className="text-gray-400 transition hover:text-gray-700"
            >

              <X size={18} />

            </button>

          </div>

        </div>

      )}

      <div className="mx-auto max-w-6xl">

        {/* ================================================================ */}
        {/* Hero Header                                                       */}
        {/* ================================================================ */}

        <section className="overflow-hidden rounded-3xl border border-[#eadfe2] bg-white shadow-sm">

          <div className="relative overflow-hidden bg-gradient-to-r from-[#8f0828] via-[#780620] to-[#520416] px-5 py-7 sm:px-8 sm:py-9">

            {/* Decorative circles */}

            <div className="absolute -right-10 -top-20 h-56 w-56 rounded-full bg-white/5" />

            <div className="absolute -bottom-28 right-20 h-56 w-56 rounded-full bg-white/5" />

            <div className="relative">

              <Link
                href="/account"
                className="inline-flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs font-semibold text-white/75 transition hover:bg-white/10 hover:text-white"
              >

                <ArrowLeft
                  size={16}
                />

                Back to Account

              </Link>

              <div className="mt-6 flex flex-col gap-6 sm:flex-row sm:items-center">

                {/* Avatar */}

                <div className="relative">

                  <div className="flex h-20 w-20 items-center justify-center rounded-3xl border border-white/20 bg-white/15 text-3xl font-bold text-white shadow-xl backdrop-blur">

                    {initial}

                  </div>

                  <div className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full border-2 border-[#8f0828] bg-white text-[#8f0828]">

                    <BadgeCheck
                      size={16}
                    />

                  </div>

                </div>

                {/* Name */}

                <div className="min-w-0 flex-1">

                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/60">
                    My Account
                  </p>

                  <h1 className="mt-2 truncate text-2xl font-bold tracking-tight text-white sm:text-3xl">

                    {customer?.name ||
                      "Customer Profile"}

                  </h1>

                  <p className="mt-2 text-sm text-white/70">

                    Manage your personal information and account security.

                  </p>

                </div>

                {/* Status */}

                <div className="inline-flex w-fit items-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur">

                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-400/15 text-green-300">

                    <ShieldCheck
                      size={17}
                    />

                  </div>

                  <div>

                    <p className="text-[10px] font-semibold uppercase tracking-wider text-white/55">
                      Account Status
                    </p>

                    <p className="text-sm font-bold text-white">
                      Active & Secure
                    </p>

                  </div>

                </div>

              </div>

            </div>

          </div>

          {/* Quick information */}

          <div className="grid grid-cols-1 divide-y divide-gray-100 sm:grid-cols-3 sm:divide-x sm:divide-y-0">

            <div className="flex items-center gap-3 px-5 py-4 sm:px-7">

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#8f0828]/5 text-[#8f0828]">

                <Mail
                  size={18}
                />

              </div>

              <div className="min-w-0">

                <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                  Email
                </p>

                <p className="truncate text-sm font-semibold text-gray-800">

                  {customer?.email ||
                    "Not available"}

                </p>

              </div>

            </div>

            <div className="flex items-center gap-3 px-5 py-4 sm:px-7">

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#8f0828]/5 text-[#8f0828]">

                <Phone
                  size={18}
                />

              </div>

              <div className="min-w-0">

                <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                  Phone
                </p>

                <p className="truncate text-sm font-semibold text-gray-800">

                  {customer?.phone
                    ? `+91 ${customer.phone}`
                    : "Not added"}

                </p>

              </div>

            </div>

            <div className="flex items-center gap-3 px-5 py-4 sm:px-7">

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#8f0828]/5 text-[#8f0828]">

                <UserRound
                  size={18}
                />

              </div>

              <div>

                <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                  Customer ID
                </p>

                <p className="text-sm font-semibold text-gray-800">

                  {customer
                    ? `#${customer.id}`
                    : "-"}

                </p>

              </div>

            </div>

          </div>

        </section>

        {/* ================================================================ */}
        {/* Load Error                                                         */}
        {/* ================================================================ */}

        {error && !customer && (

          <div className="mt-6 flex items-start gap-3 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">

            <AlertCircle
              size={20}
              className="mt-0.5 shrink-0"
            />

            <div className="flex-1">

              <p className="font-bold">
                Unable to load profile
              </p>

              <p className="mt-1">
                {error}
              </p>

            </div>

            <button
              type="button"
              onClick={loadProfile}
              className="rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white"
            >
              Retry
            </button>

          </div>

        )}

        {/* ================================================================ */}
        {/* Main Grid                                                          */}
        {/* ================================================================ */}

        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-[1.25fr_0.75fr]">

          {/* ============================================================ */}
          {/* Profile Information                                          */}
          {/* ============================================================ */}

          <section className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">

            {/* Section Header */}

            <div className="flex flex-col gap-4 border-b border-gray-100 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-7">

              <div className="flex items-center gap-3">

                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#8f0828]/5 text-[#8f0828]">

                  <UserRound
                    size={21}
                  />

                </div>

                <div>

                  <h2 className="text-base font-bold text-gray-900">
                    Personal Information
                  </h2>

                  <p className="mt-1 text-xs text-gray-500">
                    Keep your account details up to date.
                  </p>

                </div>

              </div>

              <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-green-50 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide text-green-700">

                <CheckCircle2
                  size={13}
                />

                Verified Account

              </span>

            </div>

            <form
              onSubmit={
                saveProfile
              }
              className="p-5 sm:p-7"
            >

              {error && customer && (

                <div className="mb-5 flex items-start gap-3 rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">

                  <AlertCircle
                    size={18}
                    className="mt-0.5 shrink-0"
                  />

                  <span>
                    {error}
                  </span>

                </div>

              )}

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">

                {/* Name */}

                <div className="sm:col-span-2">

                  <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-gray-500">

                    Full Name *

                  </label>

                  <div className="relative">

                    <UserRound
                      size={18}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                    />

                    <input
                      type="text"
                      value={
                        name
                      }
                      onChange={(
                        event,
                      ) => {
                        setName(
                          event.target.value,
                        );

                        setError(
                          "",
                        );
                      }}
                      placeholder="Enter your full name"
                      className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3 pl-11 pr-4 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-[#8f0828] focus:bg-white focus:ring-4 focus:ring-[#8f0828]/5"
                    />

                  </div>

                </div>

                {/* Email */}

                <div>

                  <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-gray-500">

                    Email Address *

                  </label>

                  <div className="relative">

                    <Mail
                      size={18}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                    />

                    <input
                      type="email"
                      value={
                        email
                      }
                      onChange={(
                        event,
                      ) => {
                        setEmail(
                          event.target.value,
                        );

                        setError(
                          "",
                        );
                      }}
                      placeholder="you@example.com"
                      className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3 pl-11 pr-4 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-[#8f0828] focus:bg-white focus:ring-4 focus:ring-[#8f0828]/5"
                    />

                  </div>

                </div>

                {/* Phone */}

                <div>

                  <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-gray-500">

                    Phone Number

                  </label>

                  <div className="relative">

                    <Phone
                      size={18}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                    />

                    <input
                      type="tel"
                      value={
                        phone
                      }
                      onChange={(
                        event,
                      ) => {
                        setPhone(
                          event.target.value
                            .replace(
                              /\D/g,
                              "",
                            )
                            .slice(
                              0,
                              10,
                            ),
                        );

                        setError(
                          "",
                        );
                      }}
                      placeholder="9876543210"
                      className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3 pl-11 pr-4 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-[#8f0828] focus:bg-white focus:ring-4 focus:ring-[#8f0828]/5"
                    />

                  </div>

                </div>

              </div>

              {/* Customer ID */}

              <div className="mt-5 rounded-2xl border border-gray-100 bg-gray-50 p-4">

                <div className="flex items-center justify-between gap-4">

                  <div>

                    <p className="text-xs font-semibold text-gray-500">
                      Customer ID
                    </p>

                    <p className="mt-1 text-sm font-bold text-gray-900">

                      {customer
                        ? `#${customer.id}`
                        : "-"}

                    </p>

                  </div>

                  <span className="rounded-lg bg-white px-3 py-2 text-xs font-medium text-gray-500 shadow-sm">

                    Account ID cannot be changed

                  </span>

                </div>

              </div>

              {/* Save */}

              <div className="mt-6 flex flex-col-reverse gap-3 border-t border-gray-100 pt-5 sm:flex-row sm:items-center sm:justify-between">

                <p className="text-xs text-gray-400">
                  Your information is securely stored.
                </p>

                <button
                  type="submit"
                  disabled={
                    saving
                  }
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#8f0828] px-5 py-3 text-sm font-bold text-white shadow-lg shadow-[#8f0828]/20 transition hover:-translate-y-0.5 hover:bg-[#760620] hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60"
                >

                  {saving ? (

                    <Loader2
                      size={17}
                      className="animate-spin"
                    />

                  ) : (

                    <Save
                      size={17}
                    />

                  )}

                  {saving
                    ? "Saving..."
                    : "Save Changes"}

                </button>

              </div>

            </form>

          </section>

          {/* ============================================================ */}
          {/* Security Sidebar                                              */}
          {/* ============================================================ */}

          <aside className="space-y-6">

            {/* Security Card */}

            <div className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">

              <div className="bg-gradient-to-br from-[#8f0828] to-[#5d061a] p-6 text-white">

                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15">

                  <ShieldCheck
                    size={22}
                  />

                </div>

                <h3 className="mt-5 text-lg font-bold">
                  Account Security
                </h3>

                <p className="mt-2 text-sm leading-6 text-white/70">
                  Keep your BanglesMart account protected with a strong password.
                </p>

              </div>

              <div className="space-y-4 p-5">

                <div className="flex items-start gap-3">

                  <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-green-50 text-green-600">

                    <CheckCircle2
                      size={15}
                    />

                  </div>

                  <div>

                    <p className="text-sm font-semibold text-gray-800">
                      Secure login
                    </p>

                    <p className="mt-1 text-xs leading-5 text-gray-500">
                      Your account is protected with secure authentication.
                    </p>

                  </div>

                </div>

                <div className="flex items-start gap-3">

                  <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#8f0828]/5 text-[#8f0828]">

                    <LockKeyhole
                      size={14}
                    />

                  </div>

                  <div>

                    <p className="text-sm font-semibold text-gray-800">
                      Password protection
                    </p>

                    <p className="mt-1 text-xs leading-5 text-gray-500">
                      Update your password regularly for better security.
                    </p>

                  </div>

                </div>

              </div>

            </div>

            {/* Account Summary */}

            <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">

              <h3 className="text-sm font-bold text-gray-900">
                Account Summary
              </h3>

              <div className="mt-4 space-y-4">

                <div className="flex items-center justify-between gap-4">

                  <span className="text-xs text-gray-500">
                    Status
                  </span>

                  <span className="rounded-full bg-green-50 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-green-700">
                    {customer?.status ||
                      "Active"}
                  </span>

                </div>

                <div className="h-px bg-gray-100" />

                <div className="flex items-center justify-between gap-4">

                  <span className="text-xs text-gray-500">
                    Account Type
                  </span>

                  <span className="text-xs font-semibold capitalize text-gray-800">
                    {customer?.role ||
                      "Customer"}
                  </span>

                </div>

              </div>

            </div>

          </aside>

        </div>

        {/* ================================================================ */}
        {/* Change Password                                                    */}
        {/* ================================================================ */}

        <section className="mt-6 overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">

          {/* Header */}

          <div className="flex flex-col gap-4 border-b border-gray-100 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-7">

            <div className="flex items-center gap-3">

              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#8f0828]/5 text-[#8f0828]">

                <KeyRound
                  size={21}
                />

              </div>

              <div>

                <h2 className="text-base font-bold text-gray-900">
                  Change Password
                </h2>

                <p className="mt-1 text-xs text-gray-500">
                  Choose a strong and unique password for your account.
                </p>

              </div>

            </div>

            <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide text-gray-600">

              <LockKeyhole
                size={12}
              />

              Security Settings

            </span>

          </div>

          <form
            onSubmit={
              changePassword
            }
            className="p-5 sm:p-7"
          >

            {passwordError && (

              <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">

                <AlertCircle
                  size={18}
                  className="mt-0.5 shrink-0"
                />

                <span>
                  {passwordError}
                </span>

              </div>

            )}

            <div className="grid grid-cols-1 gap-5 md:grid-cols-3">

              {/* Current Password */}

              <div>

                <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-gray-500">

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
                      event,
                    ) => {
                      setCurrentPassword(
                        event.target.value,
                      );

                      setPasswordError(
                        "",
                      );
                    }}
                    placeholder="Enter current password"
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 pr-12 text-sm outline-none transition placeholder:text-gray-400 focus:border-[#8f0828] focus:bg-white focus:ring-4 focus:ring-[#8f0828]/5"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowCurrentPassword(
                        !showCurrentPassword,
                      )
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
                    aria-label="Toggle current password visibility"
                  >

                    {showCurrentPassword ? (

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

              {/* New Password */}

              <div>

                <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-gray-500">

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
                      event,
                    ) => {
                      setPassword(
                        event.target.value,
                      );

                      setPasswordError(
                        "",
                      );
                    }}
                    placeholder="Minimum 8 characters"
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 pr-12 text-sm outline-none transition placeholder:text-gray-400 focus:border-[#8f0828] focus:bg-white focus:ring-4 focus:ring-[#8f0828]/5"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword(
                        !showPassword,
                      )
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
                    aria-label="Toggle password visibility"
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

              {/* Confirm Password */}

              <div>

                <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-gray-500">

                  Confirm Password *

                </label>

                <div className="relative">

                  <input
                    type={
                      showConfirmPassword
                        ? "text"
                        : "password"
                    }
                    value={
                      passwordConfirmation
                    }
                    onChange={(
                      event,
                    ) => {
                      setPasswordConfirmation(
                        event.target.value,
                      );

                      setPasswordError(
                        "",
                      );
                    }}
                    placeholder="Repeat new password"
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 pr-12 text-sm outline-none transition placeholder:text-gray-400 focus:border-[#8f0828] focus:bg-white focus:ring-4 focus:ring-[#8f0828]/5"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowConfirmPassword(
                        !showConfirmPassword,
                      )
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
                    aria-label="Toggle confirm password visibility"
                  >

                    {showConfirmPassword ? (

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

            </div>

            {/* Password Rules */}

            <div className="mt-5 rounded-2xl border border-[#8f0828]/10 bg-[#8f0828]/[0.03] p-4">

              <div className="flex items-start gap-3">

                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#8f0828]/10 text-[#8f0828]">

                  <ShieldCheck
                    size={16}
                  />

                </div>

                <div>

                  <p className="text-xs font-bold text-gray-800">
                    Password requirements
                  </p>

                  <p className="mt-1 text-xs leading-5 text-gray-500">
                    Use at least 8 characters. For better security, combine uppercase letters, lowercase letters, numbers, and symbols.
                  </p>

                </div>

              </div>

            </div>

            {/* Footer */}

            <div className="mt-6 flex flex-col-reverse gap-3 border-t border-gray-100 pt-5 sm:flex-row sm:items-center sm:justify-between">

              <p className="text-xs text-gray-400">
                Never share your password with anyone.
              </p>

              <button
                type="submit"
                disabled={
                  passwordSaving
                }
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-gray-900 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-gray-900/10 transition hover:-translate-y-0.5 hover:bg-black disabled:cursor-not-allowed disabled:opacity-60"
              >

                {passwordSaving ? (

                  <Loader2
                    size={17}
                    className="animate-spin"
                  />

                ) : (

                  <KeyRound
                    size={17}
                  />

                )}

                {passwordSaving
                  ? "Changing Password..."
                  : "Change Password"}

              </button>

            </div>

          </form>

        </section>

      </div>

    </main>
  );
}