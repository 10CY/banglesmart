"use client";

import { useCallback, useEffect, useState } from "react";

import Link from "next/link";

import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  Clock3,
  PackageCheck,
  ShoppingBag,
  Truck,
  XCircle,
  CreditCard,
  ReceiptIndianRupee,
  Sparkles,
  Package,
} from "lucide-react";

import { useRouter } from "next/navigation";

import { customerApiFetch } from "@/lib/customerApi";

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

type Order = {
  id: number;

  order_number: string;

  status:
    | "pending"
    | "processing"
    | "shipped"
    | "delivered"
    | "cancelled";

  payment_method: string;

  payment_status:
    | "pending"
    | "paid"
    | "failed"
    | string;

  subtotal: string;

  shipping_amount: string;

  discount_amount: string;

  total_amount: string;

  items_count: number;

  created_at: string;
};

type Pagination = {
  current_page: number;

  last_page: number;

  total: number;
};

/* -------------------------------------------------------------------------- */
/* Page                                                                       */
/* -------------------------------------------------------------------------- */

export default function CustomerOrdersPage() {
  const router = useRouter();

  const [orders, setOrders] =
    useState<Order[]>([]);

  const [pagination, setPagination] =
    useState<Pagination>({
      current_page: 1,
      last_page: 1,
      total: 0,
    });

  const [page, setPage] =
    useState(1);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  /* ------------------------------------------------------------------------ */
  /* Load Orders                                                              */
  /* ------------------------------------------------------------------------ */

  const loadOrders =
    useCallback(async () => {
      const token =
        localStorage.getItem(
          "customer_token"
        );

      if (!token) {
        router.replace("/login");
        return;
      }

      try {
        setLoading(true);
        setError("");

        const response =
          await customerApiFetch(
            `/customer/orders?page=${page}`
          );

        const data =
          await response.json();

        if (
          response.status === 401 ||
          response.status === 403
        ) {
          localStorage.removeItem(
            "customer_token"
          );

          localStorage.removeItem(
            "customer_user"
          );

          router.replace("/login");

          return;
        }

        if (!response.ok) {
          setError(
            data.message ||
              "Unable to load orders."
          );

          return;
        }

        const paginator =
          data.data;

        setOrders(
          paginator.data || []
        );

        setPagination({
          current_page:
            paginator.current_page || 1,

          last_page:
            paginator.last_page || 1,

          total:
            paginator.total || 0,
        });
      } catch {
        setError(
          "Unable to connect to server."
        );
      } finally {
        setLoading(false);
      }
    }, [page, router]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  /* ------------------------------------------------------------------------ */
  /* Price                                                                    */
  /* ------------------------------------------------------------------------ */

  function formatPrice(
    value: string | number
  ) {
    return new Intl.NumberFormat(
      "en-IN",
      {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
      }
    ).format(Number(value));
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
        timeStyle: "short",
      }
    ).format(
      new Date(value)
    );
  }

  /* ------------------------------------------------------------------------ */
  /* Status                                                                    */
  /* ------------------------------------------------------------------------ */

  function statusClass(
    status: Order["status"]
  ) {
    switch (status) {
      case "pending":
        return "border-yellow-200 bg-yellow-50 text-yellow-700";

      case "processing":
        return "border-blue-200 bg-blue-50 text-blue-700";

      case "shipped":
        return "border-purple-200 bg-purple-50 text-purple-700";

      case "delivered":
        return "border-green-200 bg-green-50 text-green-700";

      case "cancelled":
        return "border-red-200 bg-red-50 text-red-700";

      default:
        return "border-gray-200 bg-gray-100 text-gray-700";
    }
  }

  function statusIcon(
    status: Order["status"]
  ) {
    switch (status) {
      case "pending":
        return (
          <Clock3 size={15} />
        );

      case "processing":
        return (
          <PackageCheck size={15} />
        );

      case "shipped":
        return (
          <Truck size={15} />
        );

      case "delivered":
        return (
          <CheckCircle2 size={15} />
        );

      case "cancelled":
        return (
          <XCircle size={15} />
        );

      default:
        return (
          <Package size={15} />
        );
    }
  }

  function statusMessage(
    status: Order["status"]
  ) {
    switch (status) {
      case "pending":
        return "Your order is waiting for confirmation.";

      case "processing":
        return "Your order is being prepared.";

      case "shipped":
        return "Your order is on the way.";

      case "delivered":
        return "Your order has been delivered.";

      case "cancelled":
        return "This order has been cancelled.";

      default:
        return "Order status updated.";
    }
  }

  /* ------------------------------------------------------------------------ */
  /* Loading                                                                  */
  /* ------------------------------------------------------------------------ */

  if (loading) {
    return (
      <main className="min-h-screen bg-[#faf7f5] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">

        <div className="mx-auto max-w-6xl">

          {/* Header Skeleton */}

          <div className="mb-8 flex items-center gap-4">

            <div className="h-11 w-11 animate-pulse rounded-xl bg-[#eee4e0]" />

            <div>

              <div className="h-7 w-40 animate-pulse rounded bg-[#eee4e0]" />

              <div className="mt-3 h-4 w-64 animate-pulse rounded bg-[#f2ebe8]" />

            </div>

          </div>

          {/* Stats Skeleton */}

          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">

            {[1, 2, 3].map(
              (item) => (
                <div
                  key={item}
                  className="h-28 animate-pulse rounded-2xl bg-white"
                />
              )
            )}

          </div>

          {/* Orders Skeleton */}

          <div className="space-y-4">

            {[1, 2, 3].map(
              (item) => (
                <div
                  key={item}
                  className="animate-pulse rounded-2xl border border-[#eadfda] bg-white p-5 sm:p-6"
                >

                  <div className="flex items-center justify-between">

                    <div>

                      <div className="h-5 w-36 rounded bg-[#eee4e0]" />

                      <div className="mt-3 h-4 w-48 rounded bg-[#f3edeb]" />

                    </div>

                    <div className="h-9 w-24 rounded-full bg-[#eee4e0]" />

                  </div>

                  <div className="mt-6 h-px bg-[#f2e9e5]" />

                  <div className="mt-5 flex justify-between">

                    <div className="h-4 w-32 rounded bg-[#f3edeb]" />

                    <div className="h-5 w-24 rounded bg-[#eee4e0]" />

                  </div>

                </div>
              )
            )}

          </div>

        </div>

      </main>
    );
  }

  /* ------------------------------------------------------------------------ */
  /* UI                                                                       */
  /* ------------------------------------------------------------------------ */

  return (
    <main className="min-h-screen bg-[#faf7f5] px-4 py-5 sm:px-6 sm:py-8 lg:px-8">

      <div className="mx-auto max-w-6xl">

        {/* ================================================================= */}
        {/* HEADER                                                              */}
        {/* ================================================================= */}

        <section className="mb-7">

          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">

            <div className="flex items-start gap-4">

              <Link
                href="/account"
                className="group mt-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#eadfda] bg-white text-[#8f0828] shadow-sm transition hover:-translate-x-0.5 hover:border-[#8f0828] hover:bg-[#8f0828] hover:text-white"
              >
                <ArrowLeft
                  size={19}
                  className="transition"
                />
              </Link>

              <div>

                <div className="flex items-center gap-2">

                  <Sparkles
                    size={14}
                    className="text-[#b68b3a]"
                  />

                  <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#a07425]">

                    BanglesMart Account

                  </span>

                </div>

                <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[#351019] sm:text-4xl">

                  My Orders

                </h1>

                <p className="mt-2 text-sm text-gray-500 sm:text-base">

                  Track and manage all your
                  BanglesMart purchases.

                </p>

              </div>

            </div>

            <Link
              href="/shop"
              className="group inline-flex items-center justify-center gap-2 rounded-xl bg-[#8f0828] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-[#8f0828]/15 transition hover:bg-[#70061f]"
            >

              <ShoppingBag size={17} />

              Continue Shopping

              <ArrowRight
                size={16}
                className="transition group-hover:translate-x-1"
              />

            </Link>

          </div>

        </section>

        {/* ================================================================= */}
        {/* SUMMARY CARD                                                        */}
        {/* ================================================================= */}

        <section className="mb-7 grid grid-cols-1 gap-4 sm:grid-cols-3">

          {/* Total */}

          <div className="rounded-2xl border border-[#eadfda] bg-white p-5 shadow-sm">

            <div className="flex items-center justify-between">

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#fff4f1] text-[#8f0828]">

                <ShoppingBag size={20} />

              </div>

              <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">

                Total

              </span>

            </div>

            <p className="mt-5 text-3xl font-semibold text-[#351019]">

              {pagination.total}

            </p>

            <p className="mt-1 text-sm text-gray-500">

              Total orders placed

            </p>

          </div>

          {/* Page */}

          <div className="rounded-2xl border border-[#eadfda] bg-white p-5 shadow-sm">

            <div className="flex items-center justify-between">

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#fff8e8] text-[#b68b3a]">

                <ReceiptIndianRupee
                  size={20}
                />

              </div>

              <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">

                Current

              </span>

            </div>

            <p className="mt-5 text-3xl font-semibold text-[#351019]">

              {pagination.current_page}

              <span className="text-lg text-gray-400">

                /{pagination.last_page}

              </span>

            </p>

            <p className="mt-1 text-sm text-gray-500">

              Order history page

            </p>

          </div>

          {/* Secure */}

          <div className="rounded-2xl border border-[#eadfda] bg-[#3b101b] p-5 shadow-sm">

            <div className="flex items-center justify-between">

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 text-[#d9b55a]">

                <CreditCard size={20} />

              </div>

              <span className="text-xs font-semibold uppercase tracking-wider text-[#d9b55a]">

                Secure

              </span>

            </div>

            <p className="mt-5 text-lg font-semibold text-white">

              Safe Shopping

            </p>

            <p className="mt-1 text-sm text-[#e7d9d4]">

              Your order details are protected.

            </p>

          </div>

        </section>

        {/* ================================================================= */}
        {/* ERROR                                                               */}
        {/* ================================================================= */}

        {error && (

          <div className="mb-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">

            <XCircle
              size={19}
              className="mt-0.5 shrink-0"
            />

            <div>

              <p className="font-semibold">

                Unable to load orders

              </p>

              <p className="mt-1 text-red-600">

                {error}

              </p>

            </div>

          </div>

        )}

        {/* ================================================================= */}
        {/* EMPTY STATE                                                         */}
        {/* ================================================================= */}

        {!error &&
          orders.length === 0 && (

          <section className="relative overflow-hidden rounded-3xl border border-[#eadfda] bg-white px-6 py-16 text-center shadow-sm sm:px-10 sm:py-20">

            {/* Decorations */}

            <div className="pointer-events-none absolute -left-16 -top-16 h-40 w-40 rounded-full bg-[#fff4f1]" />

            <div className="pointer-events-none absolute -bottom-20 -right-16 h-48 w-48 rounded-full bg-[#fff8e8]" />

            <div className="relative">

              <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-[28px] bg-[#fff4f1] text-[#8f0828]">

                <ShoppingBag size={40} />

              </div>

              <div className="mt-7">

                <div className="flex justify-center">

                  <span className="rounded-full bg-[#fff8e8] px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-[#a07425]">

                    Start Your Journey

                  </span>

                </div>

                <h2 className="mt-5 text-2xl font-semibold text-[#351019] sm:text-3xl">

                  No orders yet

                </h2>

                <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-gray-500">

                  Your beautiful BanglesMart
                  purchases will appear here.
                  Explore our collection and
                  find something you love.

                </p>

              </div>

              <Link
                href="/shop"
                className="group mt-8 inline-flex items-center gap-3 rounded-xl bg-[#8f0828] px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-[#8f0828]/20 transition hover:-translate-y-0.5 hover:bg-[#70061f]"
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

        )}

        {/* ================================================================= */}
        {/* ORDERS                                                              */}
        {/* ================================================================= */}

        {orders.length > 0 && (

          <section>

            {/* Section Header */}

            <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">

              <div>

                <h2 className="text-xl font-semibold text-[#351019]">

                  Recent Orders

                </h2>

                <p className="mt-1 text-sm text-gray-500">

                  Click any order to view its
                  complete details.

                </p>

              </div>

              <div className="inline-flex w-fit items-center rounded-full border border-[#eadfda] bg-white px-4 py-2 text-xs font-medium text-gray-500">

                <Package
                  size={14}
                  className="mr-2 text-[#8f0828]"
                />

                {pagination.total}{" "}

                {pagination.total === 1
                  ? "Order"
                  : "Orders"}

              </div>

            </div>

            <div className="space-y-4">

              {orders.map(
                (order) => (

                <Link
                  key={order.id}
                  href={`/account/orders/${order.id}`}
                  className="group relative block overflow-hidden rounded-2xl border border-[#eadfda] bg-white shadow-sm transition duration-300 hover:-translate-y-0.5 hover:border-[#d6b5aa] hover:shadow-xl hover:shadow-[#8f0828]/5"
                >

                  {/* Top Accent */}

                  <div className="h-1 bg-gradient-to-r from-[#8f0828] via-[#b68b3a] to-transparent opacity-70" />

                  <div className="p-5 sm:p-6">

                    {/* TOP */}

                    <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">

                      {/* Order Info */}

                      <div className="min-w-0">

                        <div className="flex flex-wrap items-center gap-3">

                          <div>

                            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-gray-400">

                              Order Number

                            </p>

                            <h3 className="mt-1 font-mono text-base font-bold text-[#351019] sm:text-lg">

                              {order.order_number}

                            </h3>

                          </div>

                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold capitalize ${statusClass(
                              order.status
                            )}`}
                          >

                            {statusIcon(
                              order.status
                            )}

                            {order.status}

                          </span>

                        </div>

                        <p className="mt-4 flex items-center gap-2 text-sm text-gray-500">

                          <Clock3
                            size={15}
                            className="text-[#8f0828]"
                          />

                          Placed{" "}

                          {formatDate(
                            order.created_at
                          )}

                        </p>

                      </div>

                      {/* Total */}

                      <div className="flex items-center justify-between gap-5 rounded-xl bg-[#fffaf8] p-4 lg:min-w-[190px]">

                        <div>

                          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-400">

                            Order Total

                          </p>

                          <p className="mt-1 text-xl font-bold text-[#351019]">

                            {formatPrice(
                              order.total_amount
                            )}

                          </p>

                        </div>

                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-[#8f0828] shadow-sm transition group-hover:bg-[#8f0828] group-hover:text-white">

                          <ChevronRight
                            size={18}
                          />

                        </div>

                      </div>

                    </div>

                    {/* Divider */}

                    <div className="my-5 h-px bg-[#f1e8e4]" />

                    {/* Bottom */}

                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

                      {/* Meta */}

                      <div className="flex flex-wrap gap-x-6 gap-y-3 text-sm">

                        <div className="flex items-center gap-2 text-gray-500">

                          <Package
                            size={16}
                            className="text-[#8f0828]"
                          />

                          <span>

                            <strong className="font-semibold text-[#351019]">

                              {order.items_count}

                            </strong>{" "}

                            {order.items_count === 1
                              ? "item"
                              : "items"}

                          </span>

                        </div>

                        <div className="flex items-center gap-2 text-gray-500">

                          <CreditCard
                            size={16}
                            className="text-[#8f0828]"
                          />

                          <span className="capitalize">

                            {order.payment_method}

                          </span>

                        </div>

                      </div>

                      {/* Payment */}

                      <div
                        className={`inline-flex w-fit items-center gap-2 rounded-full px-3 py-2 text-xs font-semibold ${
                          order.payment_status ===
                          "paid"
                            ? "bg-green-50 text-green-700"
                            : order.payment_status ===
                              "failed"
                            ? "bg-red-50 text-red-700"
                            : "bg-orange-50 text-orange-700"
                        }`}
                      >

                        <span
                          className={`h-2 w-2 rounded-full ${
                            order.payment_status ===
                            "paid"
                              ? "bg-green-500"
                              : order.payment_status ===
                                "failed"
                              ? "bg-red-500"
                              : "bg-orange-500"
                          }`}
                        />

                        Payment{" "}

                        <span className="capitalize">

                          {order.payment_status}

                        </span>

                      </div>

                    </div>

                    {/* Status Message */}

                    <div className="mt-5 rounded-xl border border-[#f0e7e2] bg-[#fffaf8] px-4 py-3">

                      <p className="text-xs text-gray-500">

                        <span className="font-semibold text-[#8f0828]">

                          Order Update:

                        </span>{" "}

                        {statusMessage(
                          order.status
                        )}

                      </p>

                    </div>

                  </div>

                </Link>

              ))}

            </div>

          </section>

        )}

        {/* ================================================================= */}
        {/* PAGINATION                                                          */}
        {/* ================================================================= */}

        {pagination.last_page > 1 && (

          <section className="mt-8 flex flex-col gap-4 rounded-2xl border border-[#eadfda] bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-5">

            <p className="text-center text-sm text-gray-500 sm:text-left">

              Page{" "}

              <span className="font-semibold text-[#351019]">

                {pagination.current_page}

              </span>{" "}

              of{" "}

              <span className="font-semibold text-[#351019]">

                {pagination.last_page}

              </span>

            </p>

            <div className="flex gap-3">

              <button
                type="button"
                disabled={page <= 1}
                onClick={() =>
                  setPage(
                    Math.max(
                      1,
                      page - 1
                    )
                  )
                }
                className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-[#eadfda] bg-white px-5 py-3 text-sm font-semibold text-[#351019] transition hover:border-[#8f0828] hover:bg-[#fff4f1] disabled:cursor-not-allowed disabled:opacity-40 sm:flex-none"
              >

                <ArrowLeft size={16} />

                Previous

              </button>

              <button
                type="button"
                disabled={
                  page >=
                  pagination.last_page
                }
                onClick={() =>
                  setPage(
                    page + 1
                  )
                }
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#8f0828] px-5 py-3 text-sm font-semibold text-white shadow-md shadow-[#8f0828]/15 transition hover:bg-[#70061f] disabled:cursor-not-allowed disabled:opacity-40 sm:flex-none"
              >

                Next

                <ArrowRight size={16} />

              </button>

            </div>

          </section>

        )}

        {/* ================================================================= */}
        {/* HELP CTA                                                            */}
        {/* ================================================================= */}

        {orders.length > 0 && (

          <section className="mt-8 rounded-2xl border border-[#eadfda] bg-[#fffaf8] p-5 text-center sm:p-7">

            <p className="text-sm font-semibold text-[#351019]">

              Need help with an order?

            </p>

            <p className="mt-2 text-sm text-gray-500">

              Select an order to view complete
              details, delivery updates and
              available actions.

            </p>

          </section>

        )}

      </div>

    </main>
  );
}