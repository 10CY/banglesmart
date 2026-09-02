"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import Link from "next/link";

import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  Download,
  MapPin,
  Package,
  Truck,
  UserRound,
  XCircle,
} from "lucide-react";

import {
  useParams,
  useRouter,
} from "next/navigation";

import {
  apiFetch,
  BACKEND_URL,
} from "@/lib/api";

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

type AddressSnapshot = {
  full_name?: string;
  phone?: string;
  address_line_1?: string;
  address_line_2?: string | null;
  landmark?: string | null;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
};

type User = {
  id: number;
  name: string;
  email: string;
};

type OrderItem = {
  id: number;

  product_id:
    | number
    | null;

  product_variant_id:
    | number
    | null;

  product_name: string;

  variant_sku:
    | string
    | null;

  size_name:
    | string
    | null;

  color_name:
    | string
    | null;

  image:
    | string
    | null;

  mrp: string;
  price: string;

  quantity: number;

  line_total: string;
};

type Order = {
  id: number;

  order_number: string;

  status: string;

  payment_method: string;
  payment_status: string;

  subtotal: string;
  shipping_amount: string;
  discount_amount: string;

  coupon_id:
    | number
    | null;

  coupon_code:
    | string
    | null;

  total_amount: string;

  shipping_address:
    | AddressSnapshot
    | null;

  billing_address:
    | AddressSnapshot
    | null;

  customer_note:
    | string
    | null;

  created_at: string;
  updated_at: string;
  courier_name?: string | null;
  tracking_number?: string | null;
  shipped_at?: string | null;
  delivered_at?: string | null;

  user:
    | User
    | null;

  items: OrderItem[];
};

/* -------------------------------------------------------------------------- */
/* Page                                                                       */
/* -------------------------------------------------------------------------- */

export default function AdminOrderDetailPage() {
  const params =
    useParams();

  const router =
    useRouter();

  const id =
    String(
      params.id
    );

  const [
    order,
    setOrder,
  ] = useState<Order | null>(
    null
  );

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    updating,
    setUpdating,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  /* ------------------------------------------------------------------------ */
  /* Load                                                                     */
  /* ------------------------------------------------------------------------ */

  const loadOrder =
    useCallback(async () => {
      try {
        setLoading(true);
        setError("");

        const response =
          await apiFetch(
            `/admin/orders/${id}`
          );

        const data =
          await response.json();

        if (
          response.status === 401
        ) {
          router.replace(
            "/admin/login"
          );

          return;
        }

        if (!response.ok) {
          setError(
            data.message ||
              "Unable to load order."
          );

          return;
        }

        setOrder(
          data.data
        );
      } catch {
        setError(
          "Unable to connect to server."
        );
      } finally {
        setLoading(false);
      }
    }, [
      id,
      router,
    ]);

  useEffect(() => {
    loadOrder();
  }, [loadOrder]);

  /* ------------------------------------------------------------------------ */
  /* Price                                                                    */
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
  /* Update Status                                                            */
  /* ------------------------------------------------------------------------ */

  async function updateStatus(
    newStatus: string
  ) {
    if (!order) {
      return;
    }

    let message =
      `Change order status to ${newStatus}?`;

    if (
      newStatus ===
      "delivered"
    ) {
      message =
        "Mark this order as delivered? Physical inventory will be deducted.";
    }

    if (
      newStatus ===
      "cancelled"
    ) {
      message =
        "Cancel this order? Reserved inventory will be released.";
    }

    const confirmed =
      window.confirm(
        message
      );

    if (!confirmed) {
      return;
    }

    try {
      setUpdating(true);
      setError("");

      const response =
        await apiFetch(
          `/admin/orders/${order.id}/status`,
          {
            method: "PUT",

            body:
              JSON.stringify({
                status:
                  newStatus,
              }),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        setError(
          data.message ||
            "Unable to update order."
        );

        return;
      }

      await loadOrder();
    } catch {
      setError(
        "Unable to connect to server."
      );
    } finally {
      setUpdating(false);
    }
  }

  async function updatePaymentStatus(newStatus: string) {
    if (!order) return;
    try {
      setUpdating(true);
      const response = await apiFetch(`/admin/orders/${order.id}/payment`, {
        method: "PUT",
        body: JSON.stringify({ payment_status: newStatus }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data?.message || "Unable to update payment status.");
        return;
      }
      await loadOrder();
    } catch {
      setError("Unable to connect to server.");
    } finally {
      setUpdating(false);
    }
  }

  /* ------------------------------------------------------------------------ */
  /* Address                                                                  */
  /* ------------------------------------------------------------------------ */

  function AddressBlock({
    address,
  }: {
    address:
      | AddressSnapshot
      | null;
  }) {
    if (!address) {
      return (
        <p className="text-sm text-gray-400">
          Address unavailable.
        </p>
      );
    }

    return (
      <div className="text-sm leading-6 text-gray-600">

        <p className="font-semibold text-gray-900">
          {address.full_name ||
            "-"}
        </p>

        {address.phone && (
          <p>
            {address.phone}
          </p>
        )}

        <p className="mt-2">

          {address.address_line_1}

          {address.address_line_2
            ? `, ${address.address_line_2}`
            : ""}

          {address.landmark
            ? `, ${address.landmark}`
            : ""}

        </p>

        <p>

          {address.city}

          {address.city &&
          address.state
            ? ", "
            : ""}

          {address.state}

          {address.postal_code
            ? ` - ${address.postal_code}`
            : ""}

        </p>

        {address.country && (
          <p>
            {address.country}
          </p>
        )}

      </div>
    );
  }

  /* ------------------------------------------------------------------------ */
  /* Loading                                                                  */
  /* ------------------------------------------------------------------------ */

  if (loading) {
    return (
      <div className="py-20 text-center text-sm text-gray-500">
        Loading order...
      </div>
    );
  }

  if (
    error &&
    !order
  ) {
    return (
      <div>

        <Link
          href="/admin/orders"
          className="inline-flex items-center gap-2 text-sm text-gray-600"
        >
          <ArrowLeft size={17} />
          Back to Orders
        </Link>

        <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>

      </div>
    );
  }

  if (!order) {
    return null;
  }

  const discount =
    Number(
      order.discount_amount ||
        0
    );

  async function downloadInvoice() {
    const response = await apiFetch(`/admin/orders/${order!.id}/invoice`);
    if (!response.ok) {
      const body = await response.text().catch(() => "");
      let message = "Unable to download invoice.";
      try {
        const json = JSON.parse(body);
        message = json?.message || message;
      } catch {
        if (body.trim()) message = body.trim();
      }
      setError(message);
      return;
    }
    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("application/pdf")) { setError("Invoice service returned an invalid file."); return; }
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${order?.order_number || "order"}-invoice.pdf`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  /* ------------------------------------------------------------------------ */
  /* UI                                                                       */
  /* ------------------------------------------------------------------------ */

  return (
    <div>

      {/* Header */}

      <div className="mb-6">

        <Link
          href="/admin/orders"
          className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 transition hover:text-gray-900"
        >
          <ArrowLeft
            size={17}
          />

          Back to Orders
        </Link>

        <div className="mt-4 flex flex-wrap items-start justify-between gap-4">

          <div>

            <h1 className="text-2xl font-semibold text-gray-900">
              {order.order_number}
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              Placed on{" "}
              {formatDate(
                order.created_at
              )}
            </p>

          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button type="button" onClick={downloadInvoice} className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-800 hover:border-[#c9a227]">
              <Download size={16} /> Invoice
            </button>
            <span className={`rounded-full px-3 py-1.5 text-sm font-medium capitalize ${statusClasses(order.status)}`}>
              {order.status}
            </span>
          </div>

        </div>

      </div>

      {error && (

        <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>

      )}

      {/* Status Actions */}

      {![
        "delivered",
        "cancelled",
      ].includes(
        order.status
      ) && (

        <section className="mb-6 rounded-xl border border-gray-200 bg-white p-5">

          <h2 className="font-semibold text-gray-900">
            Order Actions
          </h2>

          <div className="mt-4 flex flex-wrap gap-3">

            {order.status ===
              "pending" && (

              <button
                type="button"
                disabled={
                  updating
                }
                onClick={() =>
                  updateStatus(
                    "processing"
                  )
                }
                className="rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50"
              >
                Start Processing
              </button>

            )}

            {order.status ===
              "processing" && (

              <button
                type="button"
                disabled={
                  updating
                }
                onClick={() =>
                  updateStatus(
                    "shipped"
                  )
                }
                className="rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50"
              >
                Mark Shipped
              </button>

            )}

            {order.status ===
              "shipped" && (

              <button
                type="button"
                disabled={
                  updating
                }
                onClick={() =>
                  updateStatus(
                    "delivered"
                  )
                }
                className="rounded-lg bg-green-600 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50"
              >
                Mark Delivered
              </button>

            )}

            {[
              "pending",
              "processing",
            ].includes(
              order.status
            ) && (

              <button
                type="button"
                disabled={
                  updating
                }
                onClick={() =>
                  updateStatus(
                    "cancelled"
                  )
                }
                className="rounded-lg border border-red-200 bg-white px-4 py-2.5 text-sm font-medium text-red-600 disabled:opacity-50"
              >
                Cancel Order
              </button>

            )}

          </div>

        </section>

      )}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">

        {/* Left */}

        <div className="space-y-6">

          {/* Items */}

          <section className="overflow-hidden rounded-xl border border-gray-200 bg-white">

            <div className="border-b border-gray-200 px-5 py-4">

              <h2 className="font-semibold text-gray-900">
                Order Items
              </h2>

            </div>

            <div className="divide-y divide-gray-200">

              {order.items.map(
                (item) => (

                <div
                  key={
                    item.id
                  }
                  className="flex gap-4 p-5"
                >

                  <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-gray-200 bg-gray-50">

                    {item.image ? (

                      <img
                        src={`${BACKEND_URL}/storage/${item.image}`}
                        alt={
                          item.product_name
                        }
                        className="h-full w-full object-cover"
                      />

                    ) : (

                      <Package
                        size={25}
                        className="text-gray-300"
                      />

                    )}

                  </div>

                  <div className="min-w-0 flex-1">

                    <h3 className="font-medium text-gray-900">
                      {item.product_name}
                    </h3>

                    <p className="mt-1 font-mono text-xs text-gray-400">
                      {item.variant_sku ||
                        "-"}
                    </p>

                    <p className="mt-2 text-sm text-gray-500">

                      {item.size_name ||
                        "-"}

                      {" / "}

                      {item.color_name ||
                        "-"}

                    </p>

                    <div className="mt-3 flex flex-wrap items-center justify-between gap-3">

                      <p className="text-sm text-gray-500">
                        {formatPrice(
                          item.price
                        )}{" "}
                        ×{" "}
                        {item.quantity}
                      </p>

                      <p className="font-semibold text-gray-900">
                        {formatPrice(
                          item.line_total
                        )}
                      </p>

                    </div>

                  </div>

                </div>

              ))}

            </div>

          </section>

          {/* Addresses */}

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">

            <section className="rounded-xl border border-gray-200 bg-white p-5">

              <div className="mb-4 flex items-center gap-2">

                <MapPin
                  size={18}
                />

                <h2 className="font-semibold text-gray-900">
                  Shipping Address
                </h2>

              </div>

              <AddressBlock
                address={
                  order.shipping_address
                }
              />

            </section>

            <section className="rounded-xl border border-gray-200 bg-white p-5">

              <div className="mb-4 flex items-center gap-2">

                <MapPin
                  size={18}
                />

                <h2 className="font-semibold text-gray-900">
                  Billing Address
                </h2>

              </div>

              <AddressBlock
                address={
                  order.billing_address
                }
              />

            </section>

          </div>

          {/* Note */}

          {order.customer_note && (

            <section className="rounded-xl border border-gray-200 bg-white p-5">

              <h2 className="font-semibold text-gray-900">
                Customer Note
              </h2>

              <p className="mt-3 whitespace-pre-line text-sm leading-6 text-gray-600">
                {order.customer_note}
              </p>

            </section>

          )}

        </div>

        {/* Right */}

        <div className="space-y-6">

          {/* Customer */}

          <section className="rounded-xl border border-gray-200 bg-white p-5">

            <div className="flex items-center gap-3">

              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100">
                <UserRound
                  size={19}
                />
              </div>

              <div>

                <h2 className="font-semibold text-gray-900">
                  Customer
                </h2>

                <p className="text-xs text-gray-400">
                  Customer information
                </p>

              </div>

            </div>

            <div className="mt-4">

              <p className="font-medium text-gray-900">
                {order.user?.name ||
                  "-"}
              </p>

              <p className="mt-1 text-sm text-gray-500">
                {order.user?.email ||
                  "-"}
              </p>

            </div>

          </section>

          {/* Payment */}

          <section className="rounded-xl border border-gray-200 bg-white p-5">

            <h2 className="font-semibold text-gray-900">
              Payment
            </h2>

            <div className="mt-4 space-y-3 text-sm">

              <div className="flex justify-between">

                <span className="text-gray-500">
                  Method
                </span>

                <span className="font-medium uppercase text-gray-900">
                  {order.payment_method}
                </span>

              </div>

              <div className="flex items-center justify-between gap-3">

                <span className="text-gray-500">
                  Status
                </span>

                <select
                  value={order.payment_status}
                  disabled={updating}
                  onChange={(event) => void updatePaymentStatus(event.target.value)}
                  className="rounded-lg border border-gray-200 bg-white px-2.5 py-2 text-sm font-medium capitalize text-gray-900 disabled:opacity-50"
                >
                  <option value="pending">pending</option>
                  <option value="paid">paid</option>
                  <option value="failed">failed</option>
                  <option value="refunded">refunded</option>
                </select>

              </div>

            </div>

          </section>

          {/* Total */}

          <section className="rounded-xl border border-gray-200 bg-white p-5">

            <h2 className="font-semibold text-gray-900">
              Order Total
            </h2>

            <div className="mt-5 space-y-3 text-sm">

              <div className="flex justify-between">

                <span className="text-gray-500">
                  Subtotal
                </span>

                <span>
                  {formatPrice(
                    order.subtotal
                  )}
                </span>

              </div>

              {discount > 0 && (

                <div className="flex justify-between gap-4">

                  <span className="text-green-700">

                    Coupon
                    {order.coupon_code
                      ? ` (${order.coupon_code})`
                      : ""}

                  </span>

                  <span className="font-medium text-green-700">
                    -
                    {formatPrice(
                      discount
                    )}
                  </span>

                </div>

              )}

              <div className="flex justify-between">

                <span className="text-gray-500">
                  Shipping
                </span>

                <span
                  className={
                    Number(
                      order.shipping_amount
                    ) === 0
                      ? "text-green-700"
                      : ""
                  }
                >

                  {Number(
                    order.shipping_amount
                  ) === 0
                    ? "Free"
                    : formatPrice(
                        order.shipping_amount
                      )}

                </span>

              </div>

              <div className="border-t border-gray-200 pt-4">

                <div className="flex items-center justify-between">

                  <span className="font-semibold text-gray-900">
                    Total
                  </span>

                  <span className="text-xl font-semibold text-gray-900">
                    {formatPrice(
                      order.total_amount
                    )}
                  </span>

                </div>

              </div>

            </div>

          </section>

        </div>

      </div>

    </div>
  );
}