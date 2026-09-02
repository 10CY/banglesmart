"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import Link from "next/link";

import {
  CheckCircle2,
  Clock3,
  Eye,
  PackageCheck,
  Search,
  ShoppingBag,
  Truck,
} from "lucide-react";

import { apiFetch } from "@/lib/api";

/*
 * --------------------------------------------------------------------------
 * Types
 * --------------------------------------------------------------------------
 */

type Order = {
  id: number;

  order_number: string;

  status:
    | "pending"
    | "processing"
    | "shipped"
    | "delivered"
    | "cancelled"
    | string;

  payment_method: string;

  payment_status: string;

  subtotal: number | string;

  shipping_amount: number | string;

  discount_amount: number | string;

  total_amount: number | string;

  items_count?: number | string;

  user_id?: number;

  customer_name?: string | null;

  customer_email?: string | null;

  customer_phone?: string | null;

  created_at: string;
};

type Summary = {
  total: number;
  pending: number;
  processing: number;
  shipped: number;
  delivered: number;
  cancelled: number;
};

/*
 * --------------------------------------------------------------------------
 * Page
 * --------------------------------------------------------------------------
 */

export default function AdminOrdersPage() {
  const [orders, setOrders] =
    useState<Order[]>([]);

  const [summary, setSummary] =
    useState<Summary>({
      total: 0,
      pending: 0,
      processing: 0,
      shipped: 0,
      delivered: 0,
      cancelled: 0,
    });

  const [loading, setLoading] =
    useState(true);

  const [search, setSearch] =
    useState("");

  const [status, setStatus] =
    useState("");

  const [
    paymentStatus,
    setPaymentStatus,
  ] = useState("");

  /*
   * ------------------------------------------------------------------------
   * Load Orders
   * ------------------------------------------------------------------------
   */

  const loadOrders =
    useCallback(async () => {
      try {
        setLoading(true);

        const params =
          new URLSearchParams();

        if (search.trim()) {
          params.set(
            "search",
            search.trim()
          );
        }

        if (status) {
          params.set(
            "status",
            status
          );
        }

        if (paymentStatus) {
          params.set(
            "payment_status",
            paymentStatus
          );
        }

        const queryString =
          params.toString();

        const response =
          await apiFetch(
            `/admin/orders${
              queryString
                ? `?${queryString}`
                : ""
            }`
          );

        const data =
          await response.json();

        if (!response.ok) {
          console.error(
            data?.message ||
              "Unable to load orders."
          );

          setOrders([]);

          return;
        }

        /*
         * Node API returns:
         *
         * {
         *   success: true,
         *   data: [...]
         * }
         *
         * Therefore:
         *
         * data.data
         */

        const rows =
          Array.isArray(data?.data)
            ? data.data
            : [];

        setOrders(rows);

        /*
         * Calculate summary from
         * current API results.
         */

        setSummary({
          total: rows.length,

          pending: rows.filter(
            (order: Order) =>
              order.status ===
              "pending"
          ).length,

          processing: rows.filter(
            (order: Order) =>
              order.status ===
              "processing"
          ).length,

          shipped: rows.filter(
            (order: Order) =>
              order.status ===
              "shipped"
          ).length,

          delivered: rows.filter(
            (order: Order) =>
              order.status ===
              "delivered"
          ).length,

          cancelled: rows.filter(
            (order: Order) =>
              order.status ===
              "cancelled"
          ).length,
        });
      } catch (error) {
        console.error(
          "Order loading error:",
          error
        );

        setOrders([]);

        setSummary({
          total: 0,
          pending: 0,
          processing: 0,
          shipped: 0,
          delivered: 0,
          cancelled: 0,
        });
      } finally {
        setLoading(false);
      }
    }, [
      search,
      status,
      paymentStatus,
    ]);

  /*
   * ------------------------------------------------------------------------
   * Fetch
   * ------------------------------------------------------------------------
   */

  useEffect(() => {
    const timer =
      window.setTimeout(() => {
        loadOrders();
      }, 300);

    return () =>
      window.clearTimeout(timer);
  }, [loadOrders]);

  /*
   * ------------------------------------------------------------------------
   * Price
   * ------------------------------------------------------------------------
   */

  function formatPrice(
    amount: number | string
  ) {
    return new Intl.NumberFormat(
      "en-IN",
      {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
      }
    ).format(
      Number(amount || 0)
    );
  }

  /*
   * ------------------------------------------------------------------------
   * Date
   * ------------------------------------------------------------------------
   */

  function formatDate(
    value: string
  ) {
    if (!value) {
      return "-";
    }

    const date =
      new Date(value);

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return value;
    }

    return new Intl.DateTimeFormat(
      "en-IN",
      {
        dateStyle: "medium",
        timeStyle: "short",
      }
    ).format(date);
  }

  /*
   * ------------------------------------------------------------------------
   * Status Classes
   * ------------------------------------------------------------------------
   */

  function statusClasses(
    value: string
  ) {
    switch (value) {
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

  /*
   * ------------------------------------------------------------------------
   * Render
   * ------------------------------------------------------------------------
   */

  return (
    <div>
      {/* Header */}

      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">
          Orders
        </h1>

        <p className="mt-1 text-sm text-gray-500">
          Manage customer orders and
          fulfillment.
        </p>
      </div>

      {/* Summary */}

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
        <SummaryCard
          title="Total Orders"
          value={summary.total}
          icon={
            <ShoppingBag
              size={21}
            />
          }
        />

        <SummaryCard
          title="Pending"
          value={summary.pending}
          icon={
            <Clock3 size={21} />
          }
        />

        <SummaryCard
          title="Processing"
          value={
            summary.processing
          }
          icon={
            <PackageCheck
              size={21}
            />
          }
        />

        <SummaryCard
          title="Shipped"
          value={summary.shipped}
          icon={
            <Truck size={21} />
          }
        />

        <SummaryCard
          title="Delivered"
          value={
            summary.delivered
          }
          icon={
            <CheckCircle2
              size={21}
            />
          }
        />
      </div>

      {/* Filters */}

      <div className="mb-5 rounded-xl border border-gray-200 bg-white p-4">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_200px_200px]">
          {/* Search */}

          <div className="relative">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />

            <input
              type="text"
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
              placeholder="Search order, customer or email..."
              className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-gray-500"
            />
          </div>

          {/* Status */}

          <select
            value={status}
            onChange={(event) =>
              setStatus(
                event.target.value
              )
            }
            className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm outline-none"
          >
            <option value="">
              All Status
            </option>

            <option value="pending">
              Pending
            </option>

            <option value="processing">
              Processing
            </option>

            <option value="shipped">
              Shipped
            </option>

            <option value="delivered">
              Delivered
            </option>

            <option value="cancelled">
              Cancelled
            </option>
          </select>

          {/* Payment */}

          <select
            value={paymentStatus}
            onChange={(event) =>
              setPaymentStatus(
                event.target.value
              )
            }
            className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm outline-none"
          >
            <option value="">
              All Payment
            </option>

            <option value="pending">
              Pending
            </option>

            <option value="paid">
              Paid
            </option>

            <option value="failed">
              Failed
            </option>

            <option value="refunded">
              Refunded
            </option>
          </select>
        </div>
      </div>

      {/* Table */}

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px]">
            <thead className="border-b border-gray-200 bg-gray-50">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-medium uppercase text-gray-500">
                  Order
                </th>

                <th className="px-5 py-3 text-left text-xs font-medium uppercase text-gray-500">
                  Customer
                </th>

                <th className="px-5 py-3 text-left text-xs font-medium uppercase text-gray-500">
                  Items
                </th>

                <th className="px-5 py-3 text-left text-xs font-medium uppercase text-gray-500">
                  Total
                </th>

                <th className="px-5 py-3 text-left text-xs font-medium uppercase text-gray-500">
                  Payment
                </th>

                <th className="px-5 py-3 text-left text-xs font-medium uppercase text-gray-500">
                  Status
                </th>

                <th className="px-5 py-3 text-left text-xs font-medium uppercase text-gray-500">
                  Date
                </th>

                <th className="px-5 py-3 text-right text-xs font-medium uppercase text-gray-500">
                  Action
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-200">
              {/* Loading */}

              {loading ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-5 py-14 text-center text-sm text-gray-500"
                  >
                    Loading orders...
                  </td>
                </tr>
              ) : orders.length ===
                0 ? (
                /* Empty */

                <tr>
                  <td
                    colSpan={8}
                    className="px-5 py-14 text-center"
                  >
                    <ShoppingBag
                      size={36}
                      className="mx-auto text-gray-300"
                    />

                    <p className="mt-3 font-medium text-gray-700">
                      No orders found
                    </p>

                    <p className="mt-1 text-sm text-gray-500">
                      There are no
                      orders matching
                      your filters.
                    </p>
                  </td>
                </tr>
              ) : (
                orders.map(
                  (order) => (
                    <tr
                      key={order.id}
                      className="hover:bg-gray-50"
                    >
                      {/* Order */}

                      <td className="px-5 py-4">
                        <p className="font-mono text-sm font-semibold text-gray-900">
                          {
                            order.order_number
                          }
                        </p>

                        <p className="mt-1 text-xs text-gray-400">
                          ID #
                          {order.id}
                        </p>
                      </td>

                      {/* Customer */}

                      <td className="px-5 py-4">
                        <p className="text-sm font-medium text-gray-900">
                          {
                            order.customer_name ||
                            "Customer"
                          }
                        </p>

                        <p className="mt-1 text-xs text-gray-500">
                          {
                            order.customer_email ||
                            "-"
                          }
                        </p>
                      </td>

                      {/* Items */}

                      <td className="px-5 py-4 text-sm text-gray-600">
                        {Number(
                          order.items_count ||
                            0
                        )}
                      </td>

                      {/* Total */}

                      <td className="px-5 py-4 font-semibold text-gray-900">
                        {formatPrice(
                          order.total_amount
                        )}
                      </td>

                      {/* Payment */}

                      <td className="px-5 py-4">
                        <p className="text-sm font-medium uppercase text-gray-700">
                          {
                            order.payment_method ||
                            "-"
                          }
                        </p>

                        <p
                          className={`mt-1 text-xs capitalize ${
                            order.payment_status ===
                            "paid"
                              ? "text-green-600"
                              : order.payment_status ===
                                  "failed"
                                ? "text-red-600"
                                : "text-orange-600"
                          }`}
                        >
                          {
                            order.payment_status ||
                            "-"
                          }
                        </p>
                      </td>

                      {/* Status */}

                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium capitalize ${statusClasses(
                            order.status
                          )}`}
                        >
                          {
                            order.status
                          }
                        </span>
                      </td>

                      {/* Date */}

                      <td className="px-5 py-4 text-sm text-gray-500">
                        {formatDate(
                          order.created_at
                        )}
                      </td>

                      {/* Action */}

                      <td className="px-5 py-4">
                        <div className="flex justify-end">
                          <Link
                            href={`/admin/orders/${order.id}`}
                            className="rounded-lg border border-gray-200 p-2 text-gray-700 hover:bg-gray-100"
                          >
                            <Eye
                              size={16}
                            />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  )
                )
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/*
 * --------------------------------------------------------------------------
 * Summary Card
 * --------------------------------------------------------------------------
 */

function SummaryCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">
            {title}
          </p>

          <p className="mt-2 text-2xl font-semibold text-gray-900">
            {value}
          </p>
        </div>

        <div className="rounded-lg bg-gray-100 p-3 text-gray-600">
          {icon}
        </div>
      </div>
    </div>
  );
}