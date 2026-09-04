"use client";

import { useEffect, useState } from "react";

import Link from "next/link";

import {
  ArrowRight,
  Bell,
  ChevronRight,
  Heart,
  LogOut,
  MapPin,
  PackageCheck,
  RotateCcw,
  Settings,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  UserRound,
  Mail,
  Phone,
  CalendarDays,
  Crown,
} from "lucide-react";

import { useRouter } from "next/navigation";

import { customerApiFetch } from "@/lib/customerApi";

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

type Customer = {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  status: string;
  created_at: string;
};

type AccountCard = {
  title: string;
  description: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
};

/* -------------------------------------------------------------------------- */
/* Page                                                                       */
/* -------------------------------------------------------------------------- */

export default function AccountPage() {
  const router = useRouter();

  const [customer, setCustomer] = useState<Customer | null>(null);

  const [loading, setLoading] = useState(true);

  const [loggingOut, setLoggingOut] = useState(false);

  /* ------------------------------------------------------------------------ */
  /* Load Customer                                                            */
  /* ------------------------------------------------------------------------ */

  useEffect(() => {
    async function loadCustomer() {
      const token = localStorage.getItem("customer_token");

      if (!token) {
        router.replace("/login");
        return;
      }

      try {
        const response = await customerApiFetch("/customer/me");

        const data = await response.json();

        if (
          response.status === 401 ||
          response.status === 403 ||
          !response.ok
        ) {
          localStorage.removeItem("customer_token");

          localStorage.removeItem("customer_user");

          router.replace("/login");

          return;
        }

        setCustomer(data.data);

        localStorage.setItem("customer_user", JSON.stringify(data.data));
      } catch {
        localStorage.removeItem("customer_token");

        localStorage.removeItem("customer_user");

        router.replace("/login");
      } finally {
        setLoading(false);
      }
    }

    loadCustomer();
  }, [router]);

  /* ------------------------------------------------------------------------ */
  /* Logout                                                                   */
  /* ------------------------------------------------------------------------ */

  async function logout() {
    if (loggingOut) {
      return;
    }

    try {
      setLoggingOut(true);

      await customerApiFetch("/customer/logout", {
        method: "POST",
      });
    } catch {
      // Remove local session even if API fails.
    } finally {
      localStorage.removeItem("customer_token");

      localStorage.removeItem("customer_user");

      window.dispatchEvent(new Event("banglesmart:customer-refresh"));

      router.replace("/login");
    }
  }

  /* ------------------------------------------------------------------------ */
  /* Date                                                                     */
  /* ------------------------------------------------------------------------ */

  function formatDate(value: string) {
    try {
      return new Intl.DateTimeFormat("en-IN", {
        dateStyle: "medium",
      }).format(new Date(value));
    } catch {
      return value;
    }
  }

  /* ------------------------------------------------------------------------ */
  /* Name Initials                                                            */
  /* ------------------------------------------------------------------------ */

  function getInitials(name: string) {
    return name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join("");
  }

  /* ------------------------------------------------------------------------ */
  /* Account Navigation                                                       */
  /* ------------------------------------------------------------------------ */

  const accountCards: AccountCard[] = [
    {
      title: "My Orders",
      description: "Track orders, payments and delivery updates.",
      href: "/account/orders",
      icon: PackageCheck,
    },
    {
      title: "My Addresses",
      description: "Manage your shipping and delivery addresses.",
      href: "/account/addresses",
      icon: MapPin,
    },
    {
      title: "My Wishlist",
      description: "Your favourite products saved for later.",
      href: "/account/wishlist",
      icon: Heart,
    },
    {
      title: "Returns",
      description: "Track return and refund requests easily.",
      href: "/account/returns",
      icon: RotateCcw,
    },
    {
      title: "Notifications",
      description: "Stay updated with orders and account alerts.",
      href: "/account/notifications",
      icon: Bell,
    },
    {
      title: "Profile Settings",
      description: "Update your personal details and password.",
      href: "/account/profile",
      icon: Settings,
    },
  ];

  /* ------------------------------------------------------------------------ */
  /* Loading                                                                  */
  /* ------------------------------------------------------------------------ */

  if (loading) {
    return (
      <main className="min-h-screen bg-[#faf7f5] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <div className="mx-auto max-w-7xl">
          {/* Header Skeleton */}

          <div className="mb-6 h-32 animate-pulse rounded-3xl bg-white sm:mb-8 sm:h-40" />

          {/* Profile Skeleton */}

          <div className="mb-6 animate-pulse rounded-3xl border border-[#eadfda] bg-white p-5 sm:p-7">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <div className="h-20 w-20 rounded-2xl bg-[#f1ebe8]" />

                <div className="space-y-3">
                  <div className="h-6 w-44 rounded bg-[#f1ebe8]" />

                  <div className="h-4 w-56 rounded bg-[#f4efec]" />

                  <div className="h-4 w-36 rounded bg-[#f4efec]" />
                </div>
              </div>

              <div className="h-11 w-32 rounded-xl bg-[#f1ebe8]" />
            </div>
          </div>

          {/* Cards Skeleton */}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((item) => (
              <div
                key={item}
                className="animate-pulse rounded-2xl border border-[#eadfda] bg-white p-5"
              >
                <div className="h-12 w-12 rounded-xl bg-[#f1ebe8]" />

                <div className="mt-5 h-5 w-2/3 rounded bg-[#f1ebe8]" />

                <div className="mt-3 h-4 w-full rounded bg-[#f4efec]" />

                <div className="mt-2 h-4 w-3/4 rounded bg-[#f4efec]" />
              </div>
            ))}
          </div>
        </div>
      </main>
    );
  }

  if (!customer) {
    return null;
  }

  const initials = getInitials(customer.name);

  /* ------------------------------------------------------------------------ */
  /* UI                                                                       */
  /* ------------------------------------------------------------------------ */

  return (
    <main className="min-h-screen overflow-hidden bg-[#faf7f5] px-4 py-5 sm:px-6 sm:py-8 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* ================================================================= */}
        {/* HERO HEADER                                                        */}
        {/* ================================================================= */}

        <section className="relative mb-6 overflow-hidden rounded-3xl border border-[#eadfda] bg-white shadow-sm sm:mb-8">
          {/* Decorative Elements */}

          <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[#fff1ed]" />

          <div className="pointer-events-none absolute -bottom-24 right-1/4 h-56 w-56 rounded-full bg-[#fff8e8]" />

          <div className="pointer-events-none absolute left-0 top-0 h-full w-1 bg-[#8f0828]" />

          <div className="relative px-5 py-6 sm:px-8 sm:py-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              {/* Heading */}

              <div>
                <div className="flex items-center gap-2">
                  <Sparkles size={15} className="text-[#b68b3a]" />

                  <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#a07425] sm:text-xs">
                    BanglesMart Account
                  </span>
                </div>

                <h1 className="mt-3 text-3xl font-semibold tracking-tight text-[#3b101b] sm:text-4xl">
                  Hello,{" "}
                  <span className="text-[#8f0828]">
                    {customer.name.split(" ")[0]}
                  </span>
                  ✨
                </h1>

                <p className="mt-3 max-w-xl text-sm leading-6 text-gray-500 sm:text-base">
                  Manage your orders, saved products, addresses and personal
                  information all in one place.
                </p>
              </div>

              {/* Logout */}

              <button
                type="button"
                onClick={logout}
                disabled={loggingOut}
                className="group inline-flex w-full items-center justify-center gap-2 rounded-xl border border-red-100 bg-white px-5 py-3 text-sm font-semibold text-[#8f0828] shadow-sm transition hover:border-red-200 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
              >
                {loggingOut ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#8f0828] border-t-transparent" />
                    Logging out...
                  </>
                ) : (
                  <>
                    <LogOut
                      size={17}
                      className="transition group-hover:-translate-x-0.5"
                    />
                    Logout
                  </>
                )}
              </button>
            </div>
          </div>
        </section>

        {/* ================================================================= */}
        {/* PROFILE SUMMARY                                                    */}
        {/* ================================================================= */}

        <section className="relative overflow-hidden rounded-3xl border border-[#eadfda] bg-white shadow-sm">
          {/* Decorative */}

          <div className="pointer-events-none absolute right-0 top-0 h-40 w-40 rounded-bl-full bg-[#fff8e8]" />

          <div className="relative p-5 sm:p-7 lg:p-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              {/* Profile */}

              <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                {/* Avatar */}

                <div className="relative mx-auto sm:mx-0">
                  <div className="flex h-24 w-24 items-center justify-center rounded-[28px] bg-gradient-to-br from-[#8f0828] to-[#5c1527] text-2xl font-bold text-white shadow-xl shadow-[#8f0828]/20 sm:h-28 sm:w-28 sm:text-3xl">
                    {initials}
                  </div>

                  <div className="absolute -bottom-1 -right-1 flex h-9 w-9 items-center justify-center rounded-full border-4 border-white bg-[#b68b3a] text-white">
                    <Crown size={15} />
                  </div>
                </div>

                {/* Details */}

                <div className="text-center sm:text-left">
                  <div className="flex flex-col items-center gap-2 sm:flex-row sm:justify-start">
                    <h2 className="text-2xl font-semibold text-[#351019]">
                      {customer.name}
                    </h2>

                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${
                        customer.status === "active"
                          ? "bg-green-50 text-green-700 ring-1 ring-green-100"
                          : "bg-red-50 text-red-700 ring-1 ring-red-100"
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          customer.status === "active"
                            ? "bg-green-500"
                            : "bg-red-500"
                        }`}
                      />

                      {customer.status}
                    </span>
                  </div>

                  <div className="mt-4 flex flex-col gap-2 text-sm text-gray-500 sm:items-start">
                    <div className="flex items-center justify-center gap-2 sm:justify-start">
                      <Mail size={15} className="text-[#8f0828]" />

                      <span className="break-all">{customer.email}</span>
                    </div>

                    {customer.phone && (
                      <div className="flex items-center justify-center gap-2 sm:justify-start">
                        <Phone size={15} className="text-[#8f0828]" />

                        <span>{customer.phone}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Profile Button */}

              <Link
                href="/account/profile"
                className="group inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#8f0828] px-5 py-3.5 text-sm font-semibold text-white shadow-lg shadow-[#8f0828]/20 transition hover:bg-[#70061f] sm:w-auto"
              >
                <Settings size={17} />
                Manage Profile
                <ChevronRight
                  size={16}
                  className="transition group-hover:translate-x-1"
                />
              </Link>
            </div>
          </div>
        </section>

        {/* ================================================================= */}
        {/* QUICK ACCESS                                                       */}
        {/* ================================================================= */}

        <section className="mt-8">
          <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Sparkles size={14} className="text-[#b68b3a]" />

                <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#a07425]">
                  Everything You Need
                </span>
              </div>

              <h2 className="mt-2 text-2xl font-semibold text-[#351019] sm:text-3xl">
                Manage your account
              </h2>
            </div>

            <p className="max-w-md text-sm leading-6 text-gray-500 sm:text-right">
              Quickly access everything related to your BanglesMart experience.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {accountCards.map((item) => {
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="group relative overflow-hidden rounded-2xl border border-[#eadfda] bg-white p-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-[#d8b8ad] hover:shadow-xl hover:shadow-[#8f0828]/5 sm:p-6"
                >
                  {/* Hover Decoration */}

                  <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-[#fff4f1] opacity-0 transition duration-300 group-hover:opacity-100" />

                  <div className="relative">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#fff4f1] text-[#8f0828] transition duration-300 group-hover:scale-110 group-hover:bg-[#8f0828] group-hover:text-white">
                        <Icon size={21} />
                      </div>

                      <div className="flex h-8 w-8 items-center justify-center rounded-full border border-[#eadfda] text-gray-400 transition group-hover:border-[#8f0828] group-hover:bg-[#8f0828] group-hover:text-white">
                        <ArrowRight size={15} />
                      </div>
                    </div>

                    <h3 className="mt-6 text-base font-semibold text-[#351019] sm:text-lg">
                      {item.title}
                    </h3>

                    <p className="mt-2 text-sm leading-6 text-gray-500">
                      {item.description}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        {/* ================================================================= */}
        {/* ACCOUNT INFORMATION                                                */}
        {/* ================================================================= */}

        <section className="mt-8 overflow-hidden rounded-3xl border border-[#eadfda] bg-white shadow-sm">
          {/* Header */}

          <div className="border-b border-[#f1e9e5] bg-[#fffaf8] px-5 py-5 sm:px-7 sm:py-6">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#8f0828] text-white">
                <ShieldCheck size={20} />
              </div>

              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#a07425]">
                  Your Details
                </p>

                <h2 className="mt-1 text-lg font-semibold text-[#351019]">
                  Account Information
                </h2>
              </div>
            </div>
          </div>

          {/* Details */}

          <div className="grid grid-cols-1 divide-y divide-[#f1e9e5] sm:grid-cols-2 sm:divide-x sm:divide-y-0 lg:grid-cols-4">
            {/* Customer ID */}

            <div className="p-5 sm:p-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#fff4f1] text-[#8f0828]">
                <UserRound size={18} />
              </div>

              <p className="mt-4 text-[10px] font-semibold uppercase tracking-[0.16em] text-gray-400">
                Customer ID
              </p>

              <p className="mt-2 text-base font-semibold text-[#351019]">
                #{customer.id}
              </p>
            </div>

            {/* Email */}

            <div className="p-5 sm:p-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#fff4f1] text-[#8f0828]">
                <Mail size={18} />
              </div>

              <p className="mt-4 text-[10px] font-semibold uppercase tracking-[0.16em] text-gray-400">
                Email Address
              </p>

              <p className="mt-2 break-all text-sm font-semibold text-[#351019]">
                {customer.email}
              </p>
            </div>

            {/* Phone */}

            <div className="p-5 sm:p-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#fff4f1] text-[#8f0828]">
                <Phone size={18} />
              </div>

              <p className="mt-4 text-[10px] font-semibold uppercase tracking-[0.16em] text-gray-400">
                Phone Number
              </p>

              <p className="mt-2 text-sm font-semibold text-[#351019]">
                {customer.phone || "Not added"}
              </p>
            </div>

            {/* Member Since */}

            <div className="p-5 sm:p-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#fff4f1] text-[#8f0828]">
                <CalendarDays size={18} />
              </div>

              <p className="mt-4 text-[10px] font-semibold uppercase tracking-[0.16em] text-gray-400">
                Member Since
              </p>

              <p className="mt-2 text-sm font-semibold text-[#351019]">
                {formatDate(customer.created_at)}
              </p>
            </div>
          </div>
        </section>

        {/* ================================================================= */}
        {/* SHOPPING CTA                                                       */}
        {/* ================================================================= */}

        <section className="relative mt-8 overflow-hidden rounded-3xl bg-[#3b101b] px-5 py-7 shadow-xl sm:px-8 sm:py-9 lg:px-10">
          {/* Decorations */}

          <div className="pointer-events-none absolute -right-10 -top-16 h-64 w-64 rounded-full border-[30px] border-[#8f0828]/40" />

          <div className="pointer-events-none absolute -bottom-24 left-1/3 h-56 w-56 rounded-full bg-[#5c1527]" />

          <div className="relative flex flex-col gap-7 lg:flex-row lg:items-center lg:justify-between">
            {/* Text */}

            <div className="max-w-2xl">
              <div className="flex items-center gap-2">
                <ShoppingBag size={16} className="text-[#d9b55a]" />

                <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#d9b55a]">
                  Discover More
                </span>
              </div>

              <h2 className="mt-3 text-2xl font-semibold text-white sm:text-3xl">
                Find your next favourite bangle
              </h2>

              <p className="mt-3 text-sm leading-6 text-[#e6d7d1] sm:text-base">
                Explore our latest collection and discover beautiful designs
                made for every occasion.
              </p>
            </div>

            {/* CTA */}

            <Link
              href="/shop"
              className="group inline-flex w-full items-center justify-center gap-3 rounded-xl bg-white px-6 py-4 text-sm font-semibold text-[#5c1527] shadow-lg transition hover:-translate-y-0.5 hover:bg-[#fff8f6] sm:w-auto"
            >
              <ShoppingBag size={18} />
              Explore Collection
              <ArrowRight
                size={17}
                className="transition group-hover:translate-x-1"
              />
            </Link>
          </div>
        </section>

        {/* ================================================================= */}
        {/* FOOTER NOTE                                                        */}
        {/* ================================================================= */}

        <div className="flex flex-col items-center justify-center gap-2 py-8 text-center sm:flex-row">
          <ShieldCheck size={15} className="text-[#b68b3a]" />

          <p className="text-xs text-gray-400">
            Your BanglesMart account information is securely protected.
          </p>
        </div>
      </div>
    </main>
  );
}
