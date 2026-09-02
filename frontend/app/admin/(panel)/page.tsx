"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import Link from "next/link";

import {
  AlertTriangle,
  ArrowRight,
  Banknote,
  CheckCircle2,
  Clock3,
  Package,
  ShoppingBag,
  Truck,
  UserRound,
  XCircle,
} from "lucide-react";

import {
  apiFetch,
  BACKEND_URL,
} from "@/lib/api";

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

type Summary = {
  total_revenue: number;

  total_orders: number;

  pending_orders: number;

  processing_orders: number;

  shipped_orders: number;

  delivered_orders: number;

  cancelled_orders: number;

  total_customers: number;

  active_customers: number;

  low_stock_count: number;

  today_orders: number;

  today_revenue: number;
};

type SalesChartItem = {
  date: string;
  label: string;
  revenue: number;
  orders: number;
};

type RecentOrder = {
  id: number;

  order_number: string;

  status: string;

  payment_method: string;
  payment_status: string;

  total_amount: string;

  items_count: number;

  created_at: string;

  user:
    | {
        id: number;
        name: string;
        email: string;
      }
    | null;
};

type LowStockItem = {
  inventory_id: number;

  variant_id:
    | number
    | null;

  product_name:
    | string
    | null;

  product_slug:
    | string
    | null;

  image:
    | string
    | null;

  sku:
    | string
    | null;

  size:
    | string
    | null;

  color:
    | string
    | null;

  quantity: number;

  reserved_quantity: number;

  available_quantity: number;

  low_stock_limit: number;
};

type BestSellingProduct = {
  product_id:
    | number
    | null;

  product_name: string;

  image:
    | string
    | null;

  total_quantity:
    | string
    | number;

  total_sales:
    | string
    | number;
};

type DashboardData = {
  summary: Summary;

  sales_chart:
    SalesChartItem[];

  recent_orders:
    RecentOrder[];

  low_stock_items:
    LowStockItem[];

  best_selling_products:
    BestSellingProduct[];
};

/* -------------------------------------------------------------------------- */
/* Page                                                                       */
/* -------------------------------------------------------------------------- */

export default function AdminDashboardPage() {
  const [
    dashboard,
    setDashboard,
  ] = useState<DashboardData | null>(
    null
  );

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");

  /* ------------------------------------------------------------------------ */
  /* Load                                                                     */
  /* ------------------------------------------------------------------------ */

  const loadDashboard =
    useCallback(async () => {
      try {
        setLoading(true);
        setError("");

        const response =
          await apiFetch(
            "/admin/dashboard"
          );

        const data =
          await response.json();

        if (!response.ok) {
          setError(
            data.message ||
              "Unable to load dashboard."
          );

          return;
        }

        setDashboard(
          data.data
        );
      } catch {
        setError(
          "Unable to connect to server."
        );
      } finally {
        setLoading(false);
      }
    }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  /* ------------------------------------------------------------------------ */
  /* Helpers                                                                  */
  /* ------------------------------------------------------------------------ */

  function formatPrice(
    value:
      | string
      | number
      | null
  ) {
    return new Intl.NumberFormat(
      "en-IN",
      {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
      }
    ).format(
      Number(value || 0)
    );
  }

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

  function statusClasses(
    status: string
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

  /* ------------------------------------------------------------------------ */
  /* Chart                                                                    */
  /* ------------------------------------------------------------------------ */

  const maxChartRevenue =
    useMemo(() => {
      if (
        !dashboard ||
        dashboard.sales_chart
          .length === 0
      ) {
        return 1;
      }

      return Math.max(
        1,

        ...dashboard
          .sales_chart
          .map(
            (item) =>
              Number(
                item.revenue
              )
          )
      );
    }, [dashboard]);

  /* ------------------------------------------------------------------------ */
  /* Loading                                                                  */
  /* ------------------------------------------------------------------------ */

  if (loading) {
    return (
      <div className="flex min-h-[500px] items-center justify-center">

        <p className="text-sm text-gray-500">
          Loading dashboard...
        </p>

      </div>
    );
  }

  if (
    error ||
    !dashboard
  ) {
    return (
      <div>

        <h1 className="text-2xl font-semibold text-gray-900">
          Dashboard
        </h1>

        <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error ||
            "Unable to load dashboard."}
        </div>

        <button
          type="button"
          onClick={
            loadDashboard
          }
          className="mt-4 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white"
        >
          Try Again
        </button>

      </div>
    );
  }

  const {
    summary,
    sales_chart,
    recent_orders,
    low_stock_items,
    best_selling_products,
  } = dashboard;

  /* ------------------------------------------------------------------------ */
  /* UI                                                                       */
  /* ------------------------------------------------------------------------ */

  return (
    <div>

      {/* Header */}

      <div className="mb-7">

        <h1 className="text-2xl font-semibold text-gray-900">
          Dashboard
        </h1>

        <p className="mt-1 text-sm text-gray-500">
          BanglesMart business overview and store performance.
        </p>

      </div>

      {/* -------------------------------------------------------------------- */}
      {/* Main Statistics                                                      */}
      {/* -------------------------------------------------------------------- */}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

        {/* Revenue */}

        <div className="rounded-xl border border-gray-200 bg-white p-5">

          <div className="flex items-start justify-between gap-4">

            <div>

              <p className="text-sm text-gray-500">
                Total Revenue
              </p>

              <p className="mt-2 text-2xl font-semibold text-gray-900">
                {formatPrice(
                  summary.total_revenue
                )}
              </p>

              <p className="mt-2 text-xs text-gray-400">
                Paid orders only
              </p>

            </div>

            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-green-50 text-green-700">

              <Banknote
                size={21}
              />

            </div>

          </div>

        </div>

        {/* Orders */}

        <div className="rounded-xl border border-gray-200 bg-white p-5">

          <div className="flex items-start justify-between gap-4">

            <div>

              <p className="text-sm text-gray-500">
                Total Orders
              </p>

              <p className="mt-2 text-2xl font-semibold text-gray-900">
                {
                  summary.total_orders
                }
              </p>

              <p className="mt-2 text-xs text-gray-400">

                {
                  summary.today_orders
                }{" "}
                today

              </p>

            </div>

            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-700">

              <ShoppingBag
                size={21}
              />

            </div>

          </div>

        </div>

        {/* Customers */}

        <div className="rounded-xl border border-gray-200 bg-white p-5">

          <div className="flex items-start justify-between gap-4">

            <div>

              <p className="text-sm text-gray-500">
                Customers
              </p>

              <p className="mt-2 text-2xl font-semibold text-gray-900">
                {
                  summary.total_customers
                }
              </p>

              <p className="mt-2 text-xs text-gray-400">

                {
                  summary.active_customers
                }{" "}
                active

              </p>

            </div>

            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-purple-50 text-purple-700">

              <UserRound
                size={21}
              />

            </div>

          </div>

        </div>

        {/* Low Stock */}

        <Link
          href="/admin/inventory"
          className="rounded-xl border border-gray-200 bg-white p-5 transition hover:border-orange-300 hover:shadow-sm"
        >

          <div className="flex items-start justify-between gap-4">

            <div>

              <p className="text-sm text-gray-500">
                Low Stock
              </p>

              <p className="mt-2 text-2xl font-semibold text-gray-900">
                {
                  summary.low_stock_count
                }
              </p>

              <p className="mt-2 text-xs text-orange-600">
                Variants need attention
              </p>

            </div>

            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-orange-50 text-orange-700">

              <AlertTriangle
                size={21}
              />

            </div>

          </div>

        </Link>

      </div>

      {/* -------------------------------------------------------------------- */}
      {/* Order Status                                                         */}
      {/* -------------------------------------------------------------------- */}

      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-5">

        <Link
          href="/admin/orders?status=pending"
          className="rounded-xl border border-gray-200 bg-white p-4 transition hover:shadow-sm"
        >

          <Clock3
            size={20}
            className="text-yellow-600"
          />

          <p className="mt-3 text-2xl font-semibold text-gray-900">
            {
              summary.pending_orders
            }
          </p>

          <p className="mt-1 text-sm text-gray-500">
            Pending
          </p>

        </Link>

        <Link
          href="/admin/orders?status=processing"
          className="rounded-xl border border-gray-200 bg-white p-4 transition hover:shadow-sm"
        >

          <Package
            size={20}
            className="text-blue-600"
          />

          <p className="mt-3 text-2xl font-semibold text-gray-900">
            {
              summary.processing_orders
            }
          </p>

          <p className="mt-1 text-sm text-gray-500">
            Processing
          </p>

        </Link>

        <Link
          href="/admin/orders?status=shipped"
          className="rounded-xl border border-gray-200 bg-white p-4 transition hover:shadow-sm"
        >

          <Truck
            size={20}
            className="text-purple-600"
          />

          <p className="mt-3 text-2xl font-semibold text-gray-900">
            {
              summary.shipped_orders
            }
          </p>

          <p className="mt-1 text-sm text-gray-500">
            Shipped
          </p>

        </Link>

        <Link
          href="/admin/orders?status=delivered"
          className="rounded-xl border border-gray-200 bg-white p-4 transition hover:shadow-sm"
        >

          <CheckCircle2
            size={20}
            className="text-green-600"
          />

          <p className="mt-3 text-2xl font-semibold text-gray-900">
            {
              summary.delivered_orders
            }
          </p>

          <p className="mt-1 text-sm text-gray-500">
            Delivered
          </p>

        </Link>

        <Link
          href="/admin/orders?status=cancelled"
          className="rounded-xl border border-gray-200 bg-white p-4 transition hover:shadow-sm"
        >

          <XCircle
            size={20}
            className="text-red-600"
          />

          <p className="mt-3 text-2xl font-semibold text-gray-900">
            {
              summary.cancelled_orders
            }
          </p>

          <p className="mt-1 text-sm text-gray-500">
            Cancelled
          </p>

        </Link>

      </div>

      {/* -------------------------------------------------------------------- */}
      {/* Sales Chart + Today                                                  */}
      {/* -------------------------------------------------------------------- */}

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">

        {/* Chart */}

        <section className="rounded-xl border border-gray-200 bg-white p-6">

          <div>

            <h2 className="font-semibold text-gray-900">
              Sales — Last 7 Days
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Revenue from paid orders.
            </p>

          </div>

          <div className="mt-8 flex h-64 items-end gap-3">

            {sales_chart.map(
              (item) => {

                const height =
                  Math.max(
                    item.revenue > 0
                      ? 8
                      : 2,

                    (
                      Number(
                        item.revenue
                      ) /
                      maxChartRevenue
                    ) *
                      100
                  );

                return (

                  <div
                    key={
                      item.date
                    }
                    className="flex h-full flex-1 flex-col justify-end"
                  >

                    <div className="mb-2 text-center">

                      <p className="text-xs font-medium text-gray-700">
                        {item.revenue >
                        0
                          ? formatPrice(
                              item.revenue
                            )
                          : "₹0"}
                      </p>

                    </div>

                    <div className="flex flex-1 items-end justify-center">

                      <div
                        className="w-full max-w-14 rounded-t-md bg-gray-900 transition-all"
                        style={{
                          height:
                            `${height}%`,
                        }}
                        title={`${item.orders} orders`}
                      />

                    </div>

                    <div className="mt-3 text-center">

                      <p className="text-xs font-medium text-gray-500">
                        {
                          item.label
                        }
                      </p>

                      <p className="mt-1 text-[11px] text-gray-400">
                        {
                          item.orders
                        }{" "}
                        order
                        {item.orders ===
                        1
                          ? ""
                          : "s"}
                      </p>

                    </div>

                  </div>

                );
              }
            )}

          </div>

        </section>

        {/* Today */}

        <section className="rounded-xl border border-gray-200 bg-white p-6">

          <h2 className="font-semibold text-gray-900">
            Today
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Current day's activity.
          </p>

          <div className="mt-6 space-y-5">

            <div className="rounded-xl bg-gray-50 p-4">

              <p className="text-sm text-gray-500">
                Revenue
              </p>

              <p className="mt-2 text-2xl font-semibold text-gray-900">
                {formatPrice(
                  summary.today_revenue
                )}
              </p>

            </div>

            <div className="rounded-xl bg-gray-50 p-4">

              <p className="text-sm text-gray-500">
                Orders
              </p>

              <p className="mt-2 text-2xl font-semibold text-gray-900">
                {
                  summary.today_orders
                }
              </p>

            </div>

          </div>

        </section>

      </div>

      {/* -------------------------------------------------------------------- */}
      {/* Recent Orders                                                        */}
      {/* -------------------------------------------------------------------- */}

      <section className="mt-6 overflow-hidden rounded-xl border border-gray-200 bg-white">

        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 px-5 py-4">

          <div>

            <h2 className="font-semibold text-gray-900">
              Recent Orders
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Latest customer orders.
            </p>

          </div>

          <Link
            href="/admin/orders"
            className="inline-flex items-center gap-1 text-sm font-medium text-gray-700 hover:text-black"
          >
            View All

            <ArrowRight
              size={16}
            />
          </Link>

        </div>

        {recent_orders.length ===
        0 ? (

          <div className="p-10 text-center text-sm text-gray-500">
            No orders yet.
          </div>

        ) : (

          <div className="overflow-x-auto">

            <table className="w-full min-w-[850px]">

              <thead className="bg-gray-50">

                <tr>

                  <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                    Order
                  </th>

                  <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                    Customer
                  </th>

                  <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                    Items
                  </th>

                  <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                    Total
                  </th>

                  <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                    Status
                  </th>

                  <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                    Date
                  </th>

                </tr>

              </thead>

              <tbody className="divide-y divide-gray-200">

                {recent_orders.map(
                  (order) => (

                    <tr
                      key={
                        order.id
                      }
                      className="hover:bg-gray-50"
                    >

                      <td className="px-5 py-4">

                        <Link
                          href={`/admin/orders/${order.id}`}
                          className="font-medium text-gray-900 hover:underline"
                        >
                          {
                            order.order_number
                          }
                        </Link>

                        <p className="mt-1 text-xs uppercase text-gray-400">
                          {
                            order.payment_method
                          }{" "}
                          /{" "}
                          {
                            order.payment_status
                          }
                        </p>

                      </td>

                      <td className="px-5 py-4">

                        <p className="text-sm font-medium text-gray-800">
                          {order.user
                            ?.name ||
                            "-"}
                        </p>

                        <p className="mt-1 text-xs text-gray-400">
                          {order.user
                            ?.email ||
                            "-"}
                        </p>

                      </td>

                      <td className="px-5 py-4 text-sm text-gray-600">
                        {
                          order.items_count
                        }
                      </td>

                      <td className="px-5 py-4 text-sm font-semibold text-gray-900">
                        {formatPrice(
                          order.total_amount
                        )}
                      </td>

                      <td className="px-5 py-4">

                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ${statusClasses(
                            order.status
                          )}`}
                        >
                          {
                            order.status
                          }
                        </span>

                      </td>

                      <td className="whitespace-nowrap px-5 py-4 text-sm text-gray-500">
                        {formatDate(
                          order.created_at
                        )}
                      </td>

                    </tr>

                  )
                )}

              </tbody>

            </table>

          </div>

        )}

      </section>

      {/* -------------------------------------------------------------------- */}
      {/* Low Stock + Best Sellers                                             */}
      {/* -------------------------------------------------------------------- */}

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-2">

        {/* Low Stock */}

        <section className="overflow-hidden rounded-xl border border-gray-200 bg-white">

          <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">

            <div>

              <h2 className="font-semibold text-gray-900">
                Low Stock
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Variants at or below their stock limit.
              </p>

            </div>

            <Link
              href="/admin/inventory"
              className="text-sm font-medium text-gray-700 hover:underline"
            >
              Inventory
            </Link>

          </div>

          {low_stock_items.length ===
          0 ? (

            <div className="p-8 text-center">

              <CheckCircle2
                size={32}
                className="mx-auto text-green-500"
              />

              <p className="mt-3 text-sm font-medium text-gray-700">
                Stock levels look good
              </p>

            </div>

          ) : (

            <div className="divide-y divide-gray-200">

              {low_stock_items.map(
                (item) => (

                  <div
                    key={
                      item.inventory_id
                    }
                    className="flex items-center gap-4 p-4"
                  >

                    <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-gray-200 bg-gray-50">

                      {item.image ? (

                        <img
                          src={`${BACKEND_URL}/storage/${item.image}`}
                          alt={
                            item.product_name ||
                            ""
                          }
                          className="h-full w-full object-cover"
                        />

                      ) : (

                        <Package
                          size={20}
                          className="text-gray-300"
                        />

                      )}

                    </div>

                    <div className="min-w-0 flex-1">

                      <p className="truncate text-sm font-medium text-gray-900">
                        {item.product_name ||
                          "Product"}
                      </p>

                      <p className="mt-1 text-xs text-gray-400">

                        {item.sku ||
                          "-"}

                        {item.size
                          ? ` • ${item.size}`
                          : ""}

                        {item.color
                          ? ` • ${item.color}`
                          : ""}

                      </p>

                    </div>

                    <div className="text-right">

                      <p
                        className={`text-sm font-semibold ${
                          item.available_quantity ===
                          0
                            ? "text-red-600"
                            : "text-orange-600"
                        }`}
                      >
                        {
                          item.available_quantity
                        }{" "}
                        left
                      </p>

                      <p className="mt-1 text-xs text-gray-400">
                        Limit{" "}
                        {
                          item.low_stock_limit
                        }
                      </p>

                    </div>

                  </div>

                )
              )}

            </div>

          )}

        </section>

        {/* Best Selling */}

        <section className="overflow-hidden rounded-xl border border-gray-200 bg-white">

          <div className="border-b border-gray-200 px-5 py-4">

            <h2 className="font-semibold text-gray-900">
              Best-Selling Products
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Based on delivered order quantity.
            </p>

          </div>

          {best_selling_products.length ===
          0 ? (

            <div className="p-8 text-center text-sm text-gray-500">
              No delivered product sales yet.
            </div>

          ) : (

            <div className="divide-y divide-gray-200">

              {best_selling_products.map(
                (
                  product,
                  index
                ) => (

                  <div
                    key={`${product.product_id}-${index}`}
                    className="flex items-center gap-4 p-4"
                  >

                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100 text-sm font-semibold text-gray-600">
                      {index + 1}
                    </div>

                    <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-gray-200 bg-gray-50">

                      {product.image ? (

                        <img
                          src={`${BACKEND_URL}/storage/${product.image}`}
                          alt={
                            product.product_name
                          }
                          className="h-full w-full object-cover"
                        />

                      ) : (

                        <Package
                          size={20}
                          className="text-gray-300"
                        />

                      )}

                    </div>

                    <div className="min-w-0 flex-1">

                      <p className="truncate text-sm font-medium text-gray-900">
                        {
                          product.product_name
                        }
                      </p>

                      <p className="mt-1 text-xs text-gray-400">

                        {
                          Number(
                            product.total_quantity
                          )
                        }{" "}
                        sold

                      </p>

                    </div>

                    <p className="text-sm font-semibold text-gray-900">
                      {formatPrice(
                        product.total_sales
                      )}
                    </p>

                  </div>

                )
              )}

            </div>

          )}

        </section>

      </div>

    </div>
  );
}