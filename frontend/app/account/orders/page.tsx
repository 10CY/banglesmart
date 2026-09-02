"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import Link from "next/link";

import {
  ArrowLeft,
  ChevronRight,
  Clock3,
  PackageCheck,
  ShoppingBag,
  Truck,
  XCircle,
  CheckCircle2,
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
  const router =
    useRouter();

  const [
    orders,
    setOrders,
  ] = useState<Order[]>([]);

  const [
    pagination,
    setPagination,
  ] = useState<Pagination>({
    current_page: 1,
    last_page: 1,
    total: 0,
  });

  const [
    page,
    setPage,
  ] = useState(1);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");

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

          router.replace(
            "/login"
          );

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
    }, [
      page,
      router,
    ]);

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
    ).format(
      Number(value)
    );
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
  /* Status                                                                   */
  /* ------------------------------------------------------------------------ */

  function statusClass(
    status: Order["status"]
  ) {
    switch (status) {
      case "pending":
        return "bg-yellow-50 text-yellow-700";

      case "processing":
        return "bg-blue-50 text-blue-700";

      case "shipped":
        return "bg-purple-50 text-purple-700";

      case "delivered":
        return "bg-green-50 text-green-700";

      case "cancelled":
        return "bg-red-50 text-red-700";

      default:
        return "bg-gray-100 text-gray-700";
    }
  }

  function statusIcon(
    status: Order["status"]
  ) {
    switch (status) {
      case "pending":
        return (
          <Clock3 size={16} />
        );

      case "processing":
        return (
          <PackageCheck size={16} />
        );

      case "shipped":
        return (
          <Truck size={16} />
        );

      case "delivered":
        return (
          <CheckCircle2 size={16} />
        );

      case "cancelled":
        return (
          <XCircle size={16} />
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
          Loading orders...
        </p>

      </main>
    );
  }

  /* ------------------------------------------------------------------------ */
  /* UI                                                                       */
  /* ------------------------------------------------------------------------ */

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-10">

      <div className="mx-auto max-w-5xl">

        {/* Header */}

        <div className="mb-7 flex items-center gap-4">

          <Link
            href="/account"
            className="rounded-lg border border-gray-200 bg-white p-2 text-gray-700 transition hover:bg-gray-100"
          >
            <ArrowLeft
              size={19}
            />
          </Link>

          <div>

            <h1 className="text-3xl font-semibold text-gray-900">
              My Orders
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              View and track your BanglesMart orders.
            </p>

          </div>

        </div>

        {/* Error */}

        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Empty */}

        {orders.length === 0 ? (

          <div className="rounded-2xl border border-gray-200 bg-white px-6 py-16 text-center">

            <ShoppingBag
              size={44}
              className="mx-auto text-gray-300"
            />

            <h2 className="mt-5 text-xl font-semibold text-gray-900">
              No orders yet
            </h2>

            <p className="mt-2 text-sm text-gray-500">
              Your BanglesMart orders will appear here.
            </p>

            <Link
              href="/shop"
              className="mt-6 inline-flex rounded-lg bg-gray-900 px-6 py-3 text-sm font-medium text-white transition hover:bg-black"
            >
              Start Shopping
            </Link>

          </div>

        ) : (

          <div className="space-y-4">

            {orders.map(
              (order) => (

                <Link
                  key={order.id}
                  href={`/account/orders/${order.id}`}
                  className="block rounded-xl border border-gray-200 bg-white p-5 transition hover:border-gray-400 hover:shadow-sm"
                >

                  <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">

                    {/* Left */}

                    <div>

                      <div className="flex flex-wrap items-center gap-3">

                        <p className="font-mono font-semibold text-gray-900">
                          {order.order_number}
                        </p>

                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium capitalize ${statusClass(
                            order.status
                          )}`}
                        >
                          {statusIcon(
                            order.status
                          )}

                          {order.status}
                        </span>

                      </div>

                      <p className="mt-2 text-sm text-gray-500">
                        Placed{" "}
                        {formatDate(
                          order.created_at
                        )}
                      </p>

                      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-gray-500">

                        <span>
                          {
                            order.items_count
                          }{" "}
                          item(s)
                        </span>

                        <span className="uppercase">
                          {
                            order.payment_method
                          }
                        </span>

                        <span
                          className={
                            order.payment_status ===
                            "paid"
                              ? "text-green-600"
                              : "text-orange-600"
                          }
                        >
                          Payment:{" "}
                          <span className="capitalize">
                            {
                              order.payment_status
                            }
                          </span>
                        </span>

                      </div>

                    </div>

                    {/* Right */}

                    <div className="flex items-center justify-between gap-5 sm:justify-end">

                      <div className="text-right">

                        <p className="text-xs text-gray-400">
                          Order Total
                        </p>

                        <p className="mt-1 text-lg font-semibold text-gray-900">
                          {formatPrice(
                            order.total_amount
                          )}
                        </p>

                      </div>

                      <ChevronRight
                        size={20}
                        className="text-gray-400"
                      />

                    </div>

                  </div>

                </Link>

              )
            )}

          </div>

        )}

        {/* Pagination */}

        {pagination.last_page >
          1 && (

          <div className="mt-7 flex items-center justify-between">

            <p className="text-sm text-gray-500">
              {pagination.total} orders
            </p>

            <div className="flex gap-2">

              <button
                type="button"
                disabled={
                  page <= 1
                }
                onClick={() =>
                  setPage(
                    Math.max(
                      1,
                      page - 1
                    )
                  )
                }
                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 disabled:opacity-40"
              >
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
                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 disabled:opacity-40"
              >
                Next
              </button>

            </div>

          </div>

        )}

      </div>

    </main>
  );
}