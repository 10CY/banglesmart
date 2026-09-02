"use client";

import {
  useEffect,
  useState,
} from "react";

import Link from "next/link";

import {
  Heart,
  LogOut,
  MapPin,
  PackageCheck,
  Settings,
  ShoppingBag,
  UserRound,
  RotateCcw,
  Bell
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

  phone?:
    | string
    | null;

  status: string;

  created_at: string;
};

/* -------------------------------------------------------------------------- */
/* Page                                                                       */
/* -------------------------------------------------------------------------- */

export default function AccountPage() {
  const router =
    useRouter();

  const [
    customer,
    setCustomer,
  ] = useState<Customer | null>(
    null
  );

  const [
    loading,
    setLoading,
  ] = useState(true);

  /* ------------------------------------------------------------------------ */
  /* Load Customer                                                            */
  /* ------------------------------------------------------------------------ */

  useEffect(() => {
    async function loadCustomer() {
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
        const response =
          await customerApiFetch(
            "/customer/me"
          );

        const data =
          await response.json();

        if (
          response.status === 401 ||
          response.status === 403 ||
          !response.ok
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

        setCustomer(
          data.data
        );

        /*
        |--------------------------------------------------------------------------
        | Keep Cached Customer Updated
        |--------------------------------------------------------------------------
        */

        localStorage.setItem(
          "customer_user",
          JSON.stringify(
            data.data
          )
        );
      } catch {
        localStorage.removeItem(
          "customer_token"
        );

        localStorage.removeItem(
          "customer_user"
        );

        router.replace(
          "/login"
        );
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
    try {
      await customerApiFetch(
        "/customer/logout",
        {
          method: "POST",
        }
      );
    } catch {
      /*
      |--------------------------------------------------------------------------
      | Even if backend logout fails,
      | remove local customer session.
      |--------------------------------------------------------------------------
      */
    } finally {
      localStorage.removeItem(
        "customer_token"
      );

      localStorage.removeItem(
        "customer_user"
      );

      router.replace(
        "/login"
      );
    }
  }

  /* ------------------------------------------------------------------------ */
  /* Date                                                                     */
  /* ------------------------------------------------------------------------ */

  function formatDate(
    value: string
  ) {
    return new Intl.DateTimeFormat(
      "en-IN",
      {
        dateStyle: "medium",
      }
    ).format(
      new Date(value)
    );
  }

  /* ------------------------------------------------------------------------ */
  /* Loading                                                                  */
  /* ------------------------------------------------------------------------ */

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50">

        <p className="text-sm text-gray-500">
          Loading account...
        </p>

      </main>
    );
  }

  if (!customer) {
    return null;
  }

  /* ------------------------------------------------------------------------ */
  /* UI                                                                       */
  /* ------------------------------------------------------------------------ */

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-10">

      <div className="mx-auto max-w-6xl">

        {/* ------------------------------------------------------------------ */}
        {/* Header                                                             */}
        {/* ------------------------------------------------------------------ */}

        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">

          <div>

            <h1 className="text-3xl font-semibold text-gray-900">
              My Account
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              Manage your BanglesMart account, orders and saved products.
            </p>

          </div>

          <button
            type="button"
            onClick={logout}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:border-gray-400 hover:bg-gray-50"
          >
            <LogOut
              size={18}
            />

            Logout
          </button>

        </div>

        {/* ------------------------------------------------------------------ */}
        {/* Profile Summary                                                    */}
        {/* ------------------------------------------------------------------ */}

        <section className="rounded-xl border border-gray-200 bg-white p-6">

          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">

            <div className="flex items-center gap-4">

              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-gray-100">

                <UserRound
                  size={28}
                  className="text-gray-600"
                />

              </div>

              <div>

                <div className="flex flex-wrap items-center gap-3">

                  <h2 className="text-xl font-semibold text-gray-900">
                    {customer.name}
                  </h2>

                  <span
                    className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium capitalize ${
                      customer.status ===
                      "active"
                        ? "bg-green-50 text-green-700"
                        : "bg-red-50 text-red-700"
                    }`}
                  >
                    {customer.status}
                  </span>

                </div>

                <p className="mt-1 text-sm text-gray-500">
                  {customer.email}
                </p>

                {customer.phone && (

                  <p className="mt-1 text-sm text-gray-500">
                    {customer.phone}
                  </p>

                )}

                <p className="mt-2 text-xs text-gray-400">
                  Customer #{customer.id}
                </p>

              </div>

            </div>

            <Link
              href="/account/profile"
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
            >
              <Settings
                size={17}
              />

              Edit Profile
            </Link>

          </div>

        </section>

        {/* ------------------------------------------------------------------ */}
        {/* Account Navigation                                                 */}
        {/* ------------------------------------------------------------------ */}

        <section className="mt-6">

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-6">

            {/* Addresses */}

            <Link
              href="/account/addresses"
              className="group rounded-xl border border-gray-200 bg-white p-5 transition hover:border-gray-400 hover:shadow-sm"
            >

              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-gray-100 text-gray-600 transition group-hover:bg-gray-900 group-hover:text-white">

                <MapPin
                  size={22}
                />

              </div>

              <h2 className="mt-4 font-semibold text-gray-900">
                My Addresses
              </h2>

              <p className="mt-1 text-sm leading-6 text-gray-500">
                Manage shipping and billing addresses.
              </p>

            </Link>

            {/* Orders */}

            <Link
              href="/account/orders"
              className="group rounded-xl border border-gray-200 bg-white p-5 transition hover:border-gray-400 hover:shadow-sm"
            >

              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-gray-100 text-gray-600 transition group-hover:bg-gray-900 group-hover:text-white">

                <PackageCheck
                  size={22}
                />

              </div>

              <h2 className="mt-4 font-semibold text-gray-900">
                My Orders
              </h2>

              <p className="mt-1 text-sm leading-6 text-gray-500">
                View orders, payments and delivery status.
              </p>

            </Link>

            {/* Wishlist */}

            <Link
              href="/account/wishlist"
              className="group rounded-xl border border-gray-200 bg-white p-5 transition hover:border-gray-400 hover:shadow-sm"
            >

              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-gray-100 text-gray-600 transition group-hover:bg-gray-900 group-hover:text-white">

                <Heart
                  size={22}
                />

              </div>

              <h2 className="mt-4 font-semibold text-gray-900">
                My Wishlist
              </h2>

              <p className="mt-1 text-sm leading-6 text-gray-500">
                View and manage your saved products.
              </p>

            </Link>

            {/* Returns */}

            <Link
              href="/account/returns"
              className="group rounded-xl border border-gray-200 bg-white p-5 transition hover:border-gray-400 hover:shadow-sm"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-gray-100 text-gray-600 transition group-hover:bg-gray-900 group-hover:text-white">
                <RotateCcw size={22} />
              </div>
              <h2 className="mt-4 font-semibold text-gray-900">Returns</h2>
              <p className="mt-1 text-sm leading-6 text-gray-500">Track return and refund requests.</p>
            </Link>

            {/* Notifications */}

            <Link
              href="/account/notifications"
              className="group rounded-xl border border-gray-200 bg-white p-5 transition hover:border-gray-400 hover:shadow-sm"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-gray-100 text-gray-600 transition group-hover:bg-gray-900 group-hover:text-white">
                <Bell size={22} />
              </div>
              <h2 className="mt-4 font-semibold text-gray-900">Notifications</h2>
              <p className="mt-1 text-sm leading-6 text-gray-500">Order and account updates.</p>
            </Link>

            {/* Profile Settings */}

            <Link
              href="/account/profile"
              className="group rounded-xl border border-gray-200 bg-white p-5 transition hover:border-gray-400 hover:shadow-sm"
            >

              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-gray-100 text-gray-600 transition group-hover:bg-gray-900 group-hover:text-white">

                <Settings
                  size={22}
                />

              </div>

              <h2 className="mt-4 font-semibold text-gray-900">
                Profile Settings
              </h2>

              <p className="mt-1 text-sm leading-6 text-gray-500">
                Update your name, email, phone and password.
              </p>

            </Link>

          </div>

        </section>

        {/* ------------------------------------------------------------------ */}
        {/* Account Information                                                */}
        {/* ------------------------------------------------------------------ */}

        <section className="mt-6 rounded-xl border border-gray-200 bg-white p-6">

          <div>

            <h2 className="font-semibold text-gray-900">
              Account Information
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Basic information associated with your BanglesMart account.
            </p>

          </div>

          <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">

            {/* Customer ID */}

            <div>

              <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                Customer ID
              </p>

              <p className="mt-2 text-sm font-semibold text-gray-900">
                #{customer.id}
              </p>

            </div>

            {/* Email */}

            <div>

              <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                Email Address
              </p>

              <p className="mt-2 break-all text-sm font-medium text-gray-900">
                {customer.email}
              </p>

            </div>

            {/* Phone */}

            <div>

              <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                Phone Number
              </p>

              <p className="mt-2 text-sm font-medium text-gray-900">
                {customer.phone ||
                  "Not added"}
              </p>

            </div>

            {/* Member Since */}

            <div>

              <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                Member Since
              </p>

              <p className="mt-2 text-sm font-medium text-gray-900">
                {formatDate(
                  customer.created_at
                )}
              </p>

            </div>

          </div>

        </section>

        {/* ------------------------------------------------------------------ */}
        {/* Continue Shopping                                                  */}
        {/* ------------------------------------------------------------------ */}

        <section className="mt-6 rounded-xl border border-gray-200 bg-white p-6">

          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">

            <div className="flex items-center gap-4">

              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-600">

                <ShoppingBag
                  size={21}
                />

              </div>

              <div>

                <h2 className="font-semibold text-gray-900">
                  Continue Shopping
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Discover more bangles from the BanglesMart collection.
                </p>

              </div>

            </div>

            <Link
              href="/shop"
              className="inline-flex items-center justify-center rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-black"
            >
              Shop Now
            </Link>

          </div>

        </section>

      </div>

    </main>
  );
}