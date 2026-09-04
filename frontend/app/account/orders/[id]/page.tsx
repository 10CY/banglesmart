"use client";

import { useCallback, useEffect, useState } from "react";

import Link from "next/link";

import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  Download,
  MapPin,
  Package,
  RotateCcw,
  Truck,
  XCircle,
  CreditCard,
  ShoppingBag,
  Sparkles,
  ChevronRight,
  FileText,
  CircleAlert,
  RefreshCcw,
  ShieldCheck,
  ReceiptIndianRupee,
} from "lucide-react";

import { useParams, useRouter } from "next/navigation";

import { BACKEND_URL } from "@/lib/api";

import { customerApiFetch } from "@/lib/customerApi";

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

type OrderItem = {
  id: number;

  product_name: string;

  variant_sku: string | null;

  size_name: string | null;

  color_name: string | null;

  image: string | null;

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

  coupon_code: string | null;

  total_amount: string;

  shipping_address: AddressSnapshot | null;

  billing_address: AddressSnapshot | null;

  customer_note: string | null;

  created_at: string;

  items: OrderItem[];
};

/* -------------------------------------------------------------------------- */
/* Component                                                                  */
/* -------------------------------------------------------------------------- */

export default function CustomerOrderDetailPage() {
  const params = useParams();

  const router = useRouter();

  const id = String(params.id);

  const [order, setOrder] = useState<Order | null>(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const [invoiceLoading, setInvoiceLoading] = useState(false);

  const [returnOpen, setReturnOpen] = useState(false);

  const [returnReason, setReturnReason] = useState("damaged");

  const [returnNotes, setReturnNotes] = useState("");

  const [returnSubmitting, setReturnSubmitting] = useState(false);

  const [returnItems, setReturnItems] = useState<number[]>([]);

  /* ------------------------------------------------------------------------ */
  /* Load Order                                                               */
  /* ------------------------------------------------------------------------ */

  const loadOrder = useCallback(async () => {
    const token = localStorage.getItem("customer_token");

    if (!token) {
      router.replace("/login");

      return;
    }

    try {
      setLoading(true);

      setError("");

      const response = await customerApiFetch(`/customer/orders/${id}`);

      const data = await response.json();

      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem("customer_token");

        localStorage.removeItem("customer_user");

        router.replace("/login");

        return;
      }

      if (!response.ok) {
        setError(data.message || "Unable to load order.");

        return;
      }

      setOrder(data.data);
    } catch {
      setError("Unable to connect to server.");
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  useEffect(() => {
    loadOrder();
  }, [loadOrder]);

  /* ------------------------------------------------------------------------ */
  /* Reorder                                                                  */
  /* ------------------------------------------------------------------------ */

  async function reorderOrder() {
    if (!order || order.status !== "delivered") {
      return;
    }

    try {
      const response = await customerApiFetch(
        `/customer/orders/${order.id}/reorder`,
        {
          method: "POST",
        },
      );

      const data = await response.json();

      if (!response.ok) {
        alert(data?.message || "Unable to reorder this purchase.");

        return;
      }

      router.push("/cart");
    } catch {
      alert("Unable to reorder this purchase.");
    }
  }

  /* ------------------------------------------------------------------------ */
  /* Return Request                                                           */
  /* ------------------------------------------------------------------------ */

  async function submitReturnRequest() {
    if (!order || !returnItems.length || returnSubmitting) {
      return;
    }

    try {
      setReturnSubmitting(true);

      const response = await customerApiFetch("/customer/returns", {
        method: "POST",

        body: JSON.stringify({
          order_id: order.id,

          reason: returnReason,

          notes: returnNotes,

          items: returnItems.map((orderItemId) => ({
            order_item_id: orderItemId,

            quantity: 1,
          })),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data?.message || "Unable to submit return request.");

        return;
      }

      alert("Return request submitted successfully.");

      setReturnOpen(false);

      setReturnItems([]);

      router.push("/account/returns");
    } catch {
      alert("Unable to submit return request.");
    } finally {
      setReturnSubmitting(false);
    }
  }

  /* ------------------------------------------------------------------------ */
  /* Cancel Order                                                             */
  /* ------------------------------------------------------------------------ */

  async function cancelOrder() {
    if (!order) {
      return;
    }

    const confirmCancel = window.confirm(
      "Are you sure you want to cancel this order?",
    );

    if (!confirmCancel) {
      return;
    }

    try {
      const response = await customerApiFetch(
        `/customer/orders/${order.id}/cancel`,
        {
          method: "POST",
        },
      );

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "Unable to cancel order.");

        return;
      }

      alert("Order cancelled successfully.");

      loadOrder();
    } catch {
      alert("Something went wrong.");
    }
  }

  /* ------------------------------------------------------------------------ */
  /* Invoice                                                                  */
  /* ------------------------------------------------------------------------ */

  async function downloadInvoice() {
    if (invoiceLoading) {
      return;
    }

    try {
      setInvoiceLoading(true);

      setError("");

      const response = await customerApiFetch(`/customer/orders/${id}/invoice`);

      if (!response.ok) {
        const body = await response.text().catch(() => "");

        let message = "Unable to download invoice.";

        try {
          const json = JSON.parse(body);

          message = json?.message || message;
        } catch {
          if (body.trim()) {
            message = body.trim();
          }
        }

        throw new Error(message);
      }

      const contentType = response.headers.get("content-type") || "";

      if (!contentType.includes("application/pdf")) {
        throw new Error("Invoice service returned an invalid file.");
      }

      const blob = await response.blob();

      const url = URL.createObjectURL(blob);

      const link = document.createElement("a");

      link.href = url;

      link.download = `${order?.order_number || "order"}-invoice.pdf`;

      document.body.appendChild(link);

      link.click();

      link.remove();

      URL.revokeObjectURL(url);
    } catch (downloadError) {
      setError(
        downloadError instanceof Error
          ? downloadError.message
          : "Unable to download invoice.",
      );
    } finally {
      setInvoiceLoading(false);
    }
  }

  /* ------------------------------------------------------------------------ */
  /* Helpers                                                                  */
  /* ------------------------------------------------------------------------ */

  function formatPrice(value: string | number | null) {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(Number(value || 0));
  }

  function formatDate(value: string) {
    return new Intl.DateTimeFormat("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  }

  function statusClasses(status: string) {
    switch (status.toLowerCase()) {
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

  function statusIcon(status: string) {
    switch (status.toLowerCase()) {
      case "pending":
        return <Clock3 size={15} />;

      case "processing":
        return <Package size={15} />;

      case "shipped":
        return <Truck size={15} />;

      case "delivered":
        return <CheckCircle2 size={15} />;

      case "cancelled":
        return <XCircle size={15} />;

      default:
        return <Package size={15} />;
    }
  }

  function statusMessage(status: string) {
    switch (status.toLowerCase()) {
      case "pending":
        return "Your order has been placed and is waiting for confirmation.";

      case "processing":
        return "Our team is carefully preparing your order.";

      case "shipped":
        return "Great news! Your order is on its way.";

      case "delivered":
        return "Your order has been successfully delivered.";

      case "cancelled":
        return "This order has been cancelled.";

      default:
        return "Your order status has been updated.";
    }
  }

  function AddressBlock({ address }: { address: AddressSnapshot | null }) {
    if (!address) {
      return <p className="text-sm text-gray-400">Address unavailable.</p>;
    }

    return (
      <div className="text-sm leading-6 text-gray-600">
        <p className="font-semibold text-[#351019]">
          {address.full_name || "-"}
        </p>

        {address.phone && <p className="mt-1">{address.phone}</p>}

        <p className="mt-3">
          {address.address_line_1}

          {address.address_line_2 ? `, ${address.address_line_2}` : ""}

          {address.landmark ? `, ${address.landmark}` : ""}
        </p>

        <p>
          {address.city}

          {address.city && address.state ? ", " : ""}

          {address.state}

          {address.postal_code ? ` - ${address.postal_code}` : ""}
        </p>

        {address.country && <p>{address.country}</p>}
      </div>
    );
  }

  /* ------------------------------------------------------------------------ */
  /* Loading                                                                  */
  /* ------------------------------------------------------------------------ */

  if (loading) {
    return (
      <main className="min-h-screen bg-[#faf7f5] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <div className="mx-auto max-w-6xl">
          {/* Back */}

          <div className="h-5 w-28 animate-pulse rounded bg-[#eee4e0]" />

          {/* Header */}

          <div className="mt-6 rounded-3xl border border-[#eadfda] bg-white p-6 sm:p-8">
            <div className="flex flex-col justify-between gap-6 lg:flex-row">
              <div>
                <div className="h-4 w-24 animate-pulse rounded bg-[#f1e8e4]" />

                <div className="mt-4 h-9 w-56 animate-pulse rounded bg-[#eee4e0]" />

                <div className="mt-4 h-4 w-44 animate-pulse rounded bg-[#f1e8e4]" />
              </div>

              <div className="flex gap-3">
                {[1, 2, 3].map((item) => (
                  <div
                    key={item}
                    className="h-11 w-24 animate-pulse rounded-xl bg-[#eee4e0]"
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Status */}

          <div className="mt-6 rounded-3xl border border-[#eadfda] bg-white p-6">
            <div className="h-6 w-36 animate-pulse rounded bg-[#eee4e0]" />

            <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
              {[1, 2, 3, 4].map((item) => (
                <div
                  key={item}
                  className="h-28 animate-pulse rounded-2xl bg-[#faf7f5]"
                />
              ))}
            </div>
          </div>

          {/* Content */}

          <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
            <div className="h-96 animate-pulse rounded-3xl bg-white" />

            <div className="space-y-6">
              <div className="h-40 animate-pulse rounded-3xl bg-white" />

              <div className="h-60 animate-pulse rounded-3xl bg-white" />
            </div>
          </div>
        </div>
      </main>
    );
  }

  /* ------------------------------------------------------------------------ */
  /* Error                                                                    */
  /* ------------------------------------------------------------------------ */

  if (error || !order) {
    return (
      <main className="min-h-screen bg-[#faf7f5] px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <Link
            href="/account/orders"
            className="group inline-flex items-center gap-2 text-sm font-semibold text-gray-500 transition hover:text-[#8f0828]"
          >
            <ArrowLeft
              size={17}
              className="transition group-hover:-translate-x-1"
            />
            My Orders
          </Link>

          <div className="mt-8 rounded-3xl border border-red-200 bg-white p-8 text-center shadow-sm sm:p-12">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-red-500">
              <CircleAlert size={30} />
            </div>

            <h1 className="mt-6 text-2xl font-semibold text-[#351019]">
              Unable to load order
            </h1>

            <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-gray-500">
              {error || "Order not found or it may no longer be available."}
            </p>

            <Link
              href="/account/orders"
              className="mt-7 inline-flex items-center gap-2 rounded-xl bg-[#8f0828] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#70061f]"
            >
              <ArrowLeft size={16} />
              Back to Orders
            </Link>
          </div>
        </div>
      </main>
    );
  }

  /* ------------------------------------------------------------------------ */
  /* Values                                                                   */
  /* ------------------------------------------------------------------------ */

  const discount = Number(order.discount_amount || 0);

  const reached = (step: string) => {
    const sequence = ["pending", "processing", "shipped", "delivered"];

    const currentIndex = sequence.indexOf(order.status.toLowerCase());

    const stepIndex = sequence.indexOf(step);

    return currentIndex >= stepIndex && currentIndex !== -1;
  };

  const statusSteps = [
    {
      key: "pending",
      label: "Order Placed",
      description: "We received your order",
      icon: Clock3,
    },
    {
      key: "processing",
      label: "Processing",
      description: "Preparing your products",
      icon: Package,
    },
    {
      key: "shipped",
      label: "Shipped",
      description: "On the way to you",
      icon: Truck,
    },
    {
      key: "delivered",
      label: "Delivered",
      description: "Successfully delivered",
      icon: CheckCircle2,
    },
  ];

  /* ------------------------------------------------------------------------ */
  /* UI                                                                       */
  /* ------------------------------------------------------------------------ */

  return (
    <main className="min-h-screen bg-[#faf7f5] px-4 py-5 sm:px-6 sm:py-8 lg:px-8">
      <div className="mx-auto max-w-6xl">
        {/* ================================================================= */}
        {/* BACK                                                                */}
        {/* ================================================================= */}

        <Link
          href="/account/orders"
          className="group inline-flex items-center gap-2 text-sm font-semibold text-gray-500 transition hover:text-[#8f0828]"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#eadfda] bg-white transition group-hover:border-[#8f0828] group-hover:bg-[#fff4f1]">
            <ArrowLeft
              size={17}
              className="transition group-hover:-translate-x-1"
            />
          </span>
          My Orders
        </Link>

        {/* ================================================================= */}
        {/* HEADER                                                              */}
        {/* ================================================================= */}

        <section className="relative mt-6 overflow-hidden rounded-3xl border border-[#eadfda] bg-white shadow-sm">
          {/* Background decoration */}

          <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[#fff4f1]" />

          <div className="pointer-events-none absolute -bottom-24 right-24 h-48 w-48 rounded-full bg-[#fff8e8]" />

          <div className="relative p-5 sm:p-7 lg:p-8">
            <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
              {/* Order Information */}

              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2">
                    <Sparkles size={15} className="text-[#b68b3a]" />

                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#a07425]">
                      BanglesMart Order
                    </span>
                  </div>

                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold capitalize ${statusClasses(
                      order.status,
                    )}`}
                  >
                    {statusIcon(order.status)}

                    {order.status}
                  </span>
                </div>

                <p className="mt-5 text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">
                  Order Number
                </p>

                <h1 className="mt-2 break-all font-mono text-2xl font-bold tracking-tight text-[#351019] sm:text-3xl">
                  {order.order_number}
                </h1>

                <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-gray-500">
                  <span className="flex items-center gap-2">
                    <Clock3 size={16} className="text-[#8f0828]" />
                    Placed {formatDate(order.created_at)}
                  </span>

                  <span className="hidden h-1 w-1 rounded-full bg-gray-300 sm:block" />

                  <span className="flex items-center gap-2">
                    <ShoppingBag size={16} className="text-[#8f0828]" />
                    {order.items.length}{" "}
                    {order.items.length === 1 ? "Item" : "Items"}
                  </span>
                </div>
              </div>

              {/* Actions */}

              <div className="flex w-full flex-col gap-2 sm:flex-row sm:flex-wrap xl:w-auto xl:justify-end">
                {order.status === "delivered" && (
                  <button
                    type="button"
                    onClick={reorderOrder}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#eadfda] bg-white px-4 py-3 text-sm font-semibold text-[#351019] shadow-sm transition hover:-translate-y-0.5 hover:border-[#b68b3a] hover:bg-[#fffaf4]"
                  >
                    <RefreshCcw size={17} />
                    Buy Again
                  </button>
                )}

                {order.status === "delivered" && (
                  <button
                    type="button"
                    onClick={() => setReturnOpen((value) => !value)}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#eadfda] bg-white px-4 py-3 text-sm font-semibold text-[#351019] shadow-sm transition hover:-translate-y-0.5 hover:border-[#b68b3a] hover:bg-[#fffaf4]"
                  >
                    <RotateCcw size={17} />
                    Return
                  </button>
                )}

                <button
                  type="button"
                  onClick={downloadInvoice}
                  disabled={invoiceLoading}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#8f0828] px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-[#8f0828]/15 transition hover:-translate-y-0.5 hover:bg-[#70061f] disabled:cursor-wait disabled:opacity-60"
                >
                  <Download size={17} />

                  {invoiceLoading ? "Generating..." : "Invoice"}
                </button>

                {order.status === "pending" && (
                  <button
                    type="button"
                    onClick={cancelOrder}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-50"
                  >
                    <XCircle size={17} />
                    Cancel
                  </button>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* ================================================================= */}
        {/* RETURN REQUEST                                                      */}
        {/* ================================================================= */}

        {returnOpen && order.status === "delivered" && (
          <section className="mt-6 overflow-hidden rounded-3xl border border-[#eadfda] bg-white shadow-sm">
            <div className="border-b border-[#f0e7e2] bg-[#fffaf8] px-5 py-5 sm:px-7">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#fff4f1] text-[#8f0828]">
                      <RotateCcw size={17} />
                    </div>

                    <div>
                      <h2 className="font-semibold text-[#351019]">
                        Request a Return
                      </h2>

                      <p className="mt-1 text-sm text-gray-500">
                        Select the items you would like to return.
                      </p>
                    </div>
                  </div>
                </div>

                <Link
                  href="/account/returns"
                  className="text-sm font-semibold text-[#8f0828] hover:underline"
                >
                  View Requests
                </Link>
              </div>
            </div>

            <div className="p-5 sm:p-7">
              {/* Items */}

              <div className="space-y-3">
                {order.items.map((item) => {
                  const selected = returnItems.includes(item.id);

                  return (
                    <label
                      key={item.id}
                      className={`flex cursor-pointer items-center gap-4 rounded-2xl border p-4 transition ${
                        selected
                          ? "border-[#8f0828] bg-[#fff8f6]"
                          : "border-[#eadfda] bg-white hover:border-[#d7b7ad]"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={(event) =>
                          setReturnItems((current) =>
                            event.target.checked
                              ? [...current, item.id]
                              : current.filter((itemId) => itemId !== item.id),
                          )
                        }
                        className="h-4 w-4 accent-[#8f0828]"
                      />

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-[#351019]">
                          {item.product_name}
                        </p>

                        <p className="mt-1 text-xs text-gray-500">
                          {item.variant_sku || "Product"}
                        </p>
                      </div>

                      <ChevronRight
                        size={17}
                        className={
                          selected ? "text-[#8f0828]" : "text-gray-300"
                        }
                      />
                    </label>
                  );
                })}
              </div>

              {/* Form */}

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Return Reason
                  </label>

                  <select
                    value={returnReason}
                    onChange={(event) => setReturnReason(event.target.value)}
                    className="w-full rounded-xl border border-[#eadfda] bg-white px-4 py-3 text-sm text-[#351019] outline-none transition focus:border-[#8f0828] focus:ring-2 focus:ring-[#8f0828]/10"
                  >
                    <option value="damaged">Damaged</option>

                    <option value="wrong_item">Wrong item</option>

                    <option value="size_issue">Size issue</option>

                    <option value="quality_issue">Quality issue</option>

                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Additional Note
                  </label>

                  <input
                    value={returnNotes}
                    onChange={(event) => setReturnNotes(event.target.value)}
                    placeholder="Tell us more (optional)"
                    className="w-full rounded-xl border border-[#eadfda] px-4 py-3 text-sm text-[#351019] outline-none transition focus:border-[#8f0828] focus:ring-2 focus:ring-[#8f0828]/10"
                  />
                </div>
              </div>

              <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setReturnOpen(false)}
                  className="rounded-xl border border-[#eadfda] px-5 py-3 text-sm font-semibold text-gray-600 transition hover:bg-gray-50"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  disabled={!returnItems.length || returnSubmitting}
                  onClick={() => void submitReturnRequest()}
                  className="rounded-xl bg-[#8f0828] px-6 py-3 text-sm font-semibold text-white shadow-md shadow-[#8f0828]/15 transition hover:bg-[#70061f] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {returnSubmitting ? "Submitting..." : "Submit Return Request"}
                </button>
              </div>
            </div>
          </section>
        )}

        {/* ================================================================= */}
        {/* ORDER STATUS                                                        */}
        {/* ================================================================= */}

        {order.status === "cancelled" ? (
          <section className="mt-6 rounded-3xl border border-red-200 bg-red-50 p-5 sm:p-6">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-red-500 shadow-sm">
                <XCircle size={24} />
              </div>

              <div>
                <h2 className="font-semibold text-red-800">Order Cancelled</h2>

                <p className="mt-2 text-sm leading-6 text-red-700">
                  This order has been cancelled. If a payment was completed, any
                  applicable refund will be processed according to our refund
                  policy.
                </p>
              </div>
            </div>
          </section>
        ) : (
          <section className="mt-6 rounded-3xl border border-[#eadfda] bg-white p-5 shadow-sm sm:p-7">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Truck size={19} className="text-[#8f0828]" />

                  <h2 className="text-lg font-semibold text-[#351019]">
                    Track Your Order
                  </h2>
                </div>

                <p className="mt-2 text-sm text-gray-500">
                  {statusMessage(order.status)}
                </p>
              </div>

              <span
                className={`inline-flex w-fit items-center gap-2 rounded-full border px-4 py-2 text-xs font-bold capitalize ${statusClasses(
                  order.status,
                )}`}
              >
                {statusIcon(order.status)}

                {order.status}
              </span>
            </div>

            {/* Desktop Progress */}

            <div className="relative mt-8 hidden sm:block">
              <div className="absolute left-[12%] right-[12%] top-5 h-1 rounded-full bg-[#eee4e0]" />

              <div
                className="absolute left-[12%] top-5 h-1 rounded-full bg-[#8f0828] transition-all duration-500"
                style={{
                  width:
                    order.status === "pending"
                      ? "0%"
                      : order.status === "processing"
                        ? "25%"
                        : order.status === "shipped"
                          ? "51%"
                          : "76%",
                }}
              />

              <div className="relative grid grid-cols-4 gap-4">
                {statusSteps.map((step) => {
                  const active = reached(step.key);

                  const Icon = step.icon;

                  return (
                    <div key={step.key} className="text-center">
                      <div
                        className={`mx-auto flex h-11 w-11 items-center justify-center rounded-full border-4 transition ${
                          active
                            ? "border-[#f7e7d5] bg-[#8f0828] text-white"
                            : "border-[#f3ece8] bg-white text-gray-300"
                        }`}
                      >
                        <Icon size={18} />
                      </div>

                      <p
                        className={`mt-4 text-sm font-semibold ${
                          active ? "text-[#351019]" : "text-gray-400"
                        }`}
                      >
                        {step.label}
                      </p>

                      <p className="mt-1 text-xs text-gray-400">
                        {step.description}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Mobile Status */}

            <div className="mt-6 space-y-3 sm:hidden">
              {statusSteps.map((step) => {
                const active = reached(step.key);

                const Icon = step.icon;

                return (
                  <div
                    key={step.key}
                    className={`flex items-center gap-4 rounded-2xl border p-4 ${
                      active
                        ? "border-[#ead2c9] bg-[#fffaf8]"
                        : "border-gray-100 bg-gray-50"
                    }`}
                  >
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                        active
                          ? "bg-[#8f0828] text-white"
                          : "bg-white text-gray-300"
                      }`}
                    >
                      <Icon size={18} />
                    </div>

                    <div>
                      <p
                        className={`text-sm font-semibold ${
                          active ? "text-[#351019]" : "text-gray-400"
                        }`}
                      >
                        {step.label}
                      </p>

                      <p className="mt-1 text-xs text-gray-400">
                        {step.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* ================================================================= */}
        {/* MAIN CONTENT                                                        */}
        {/* ================================================================= */}

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          {/* ================================================================= */}
          {/* LEFT                                                               */}
          {/* ================================================================= */}

          <div className="space-y-6">
            {/* Products */}

            <section className="overflow-hidden rounded-3xl border border-[#eadfda] bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-[#f0e7e2] px-5 py-5 sm:px-7">
                <div>
                  <div className="flex items-center gap-2">
                    <ShoppingBag size={19} className="text-[#8f0828]" />

                    <h2 className="text-lg font-semibold text-[#351019]">
                      Products
                    </h2>
                  </div>

                  <p className="mt-1 text-sm text-gray-500">
                    {order.items.length}{" "}
                    {order.items.length === 1 ? "item" : "items"} in this order
                  </p>
                </div>
              </div>

              <div className="divide-y divide-[#f0e7e2]">
                {order.items.map((item) => (
                  <div
                    key={item.id}
                    className="group p-4 transition hover:bg-[#fffaf8] sm:p-5"
                  >
                    <div className="flex gap-4 sm:gap-5">
                      {/* Image */}

                      <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-[#eadfda] bg-[#faf7f5] sm:h-28 sm:w-28">
                        {item.image ? (
                          <img
                            src={`${BACKEND_URL}/storage/${item.image}`}
                            alt={item.product_name}
                            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                          />
                        ) : (
                          <Package size={30} className="text-gray-300" />
                        )}
                      </div>

                      {/* Product */}

                      <div className="min-w-0 flex-1">
                        <h3 className="line-clamp-2 text-sm font-semibold leading-6 text-[#351019] sm:text-base">
                          {item.product_name}
                        </h3>

                        {item.variant_sku && (
                          <p className="mt-1 font-mono text-[11px] text-gray-400">
                            SKU: {item.variant_sku}
                          </p>
                        )}

                        <div className="mt-3 flex flex-wrap gap-2">
                          {item.size_name && (
                            <span className="rounded-lg bg-[#f8f4f2] px-2.5 py-1 text-[11px] font-medium text-gray-600">
                              Size: {item.size_name}
                            </span>
                          )}

                          {item.color_name && (
                            <span className="rounded-lg bg-[#f8f4f2] px-2.5 py-1 text-[11px] font-medium text-gray-600">
                              Color: {item.color_name}
                            </span>
                          )}
                        </div>

                        {/* Price Desktop */}

                        <div className="mt-4 flex flex-col gap-2 border-t border-[#f3ece8] pt-3 sm:flex-row sm:items-center sm:justify-between">
                          <span className="text-sm text-gray-500">
                            {formatPrice(item.price)} ×{" "}
                            <span className="font-semibold text-[#351019]">
                              {item.quantity}
                            </span>
                          </span>

                          <span className="text-base font-bold text-[#351019]">
                            {formatPrice(item.line_total)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Addresses */}

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {/* Shipping */}

              <section className="rounded-3xl border border-[#eadfda] bg-white p-5 shadow-sm sm:p-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#fff4f1] text-[#8f0828]">
                    <Truck size={19} />
                  </div>

                  <div>
                    <h2 className="font-semibold text-[#351019]">
                      Shipping Address
                    </h2>

                    <p className="mt-1 text-xs text-gray-400">
                      Delivery location
                    </p>
                  </div>
                </div>

                <div className="mt-5 border-t border-[#f0e7e2] pt-5">
                  <AddressBlock address={order.shipping_address} />
                </div>
              </section>

              {/* Billing */}

              <section className="rounded-3xl border border-[#eadfda] bg-white p-5 shadow-sm sm:p-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#fff8e8] text-[#b68b3a]">
                    <MapPin size={19} />
                  </div>

                  <div>
                    <h2 className="font-semibold text-[#351019]">
                      Billing Address
                    </h2>

                    <p className="mt-1 text-xs text-gray-400">
                      Billing information
                    </p>
                  </div>
                </div>

                <div className="mt-5 border-t border-[#f0e7e2] pt-5">
                  <AddressBlock address={order.billing_address} />
                </div>
              </section>
            </div>
          </div>

          {/* ================================================================= */}
          {/* RIGHT                                                              */}
          {/* ================================================================= */}

          <div className="space-y-6">
            {/* Payment */}

            <section className="rounded-3xl border border-[#eadfda] bg-white p-5 shadow-sm sm:p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#fff4f1] text-[#8f0828]">
                  <CreditCard size={19} />
                </div>

                <div>
                  <h2 className="font-semibold text-[#351019]">Payment</h2>

                  <p className="mt-1 text-xs text-gray-400">Payment details</p>
                </div>
              </div>

              <div className="mt-5 space-y-4 border-t border-[#f0e7e2] pt-5">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm text-gray-500">Method</span>

                  <span className="rounded-lg bg-[#faf7f5] px-3 py-1.5 text-xs font-bold uppercase text-[#351019]">
                    {order.payment_method}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm text-gray-500">Status</span>

                  <span
                    className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold capitalize ${
                      order.payment_status.toLowerCase() === "paid"
                        ? "bg-green-50 text-green-700"
                        : order.payment_status.toLowerCase() === "failed"
                          ? "bg-red-50 text-red-700"
                          : "bg-yellow-50 text-yellow-700"
                    }`}
                  >
                    <span
                      className={`h-2 w-2 rounded-full ${
                        order.payment_status.toLowerCase() === "paid"
                          ? "bg-green-500"
                          : order.payment_status.toLowerCase() === "failed"
                            ? "bg-red-500"
                            : "bg-yellow-500"
                      }`}
                    />

                    {order.payment_status}
                  </span>
                </div>
              </div>
            </section>

            {/* Order Summary */}

            <section className="overflow-hidden rounded-3xl border border-[#eadfda] bg-white shadow-sm">
              <div className="bg-[#3b101b] px-5 py-5 sm:px-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-[#d9b55a]">
                    <ReceiptIndianRupee size={19} />
                  </div>

                  <div>
                    <h2 className="font-semibold text-white">Order Summary</h2>

                    <p className="mt-1 text-xs text-[#e5d3ce]">
                      Complete payment breakdown
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-5 sm:p-6">
                <div className="space-y-4 text-sm">
                  {/* Subtotal */}

                  <div className="flex justify-between gap-4">
                    <span className="text-gray-500">Subtotal</span>

                    <span className="font-medium text-[#351019]">
                      {formatPrice(order.subtotal)}
                    </span>
                  </div>

                  {/* Discount */}

                  {discount > 0 && (
                    <div className="flex justify-between gap-4">
                      <div>
                        <p className="text-green-700">Discount</p>

                        {order.coupon_code && (
                          <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-green-600">
                            {order.coupon_code}
                          </p>
                        )}
                      </div>

                      <span className="font-semibold text-green-700">
                        -{formatPrice(discount)}
                      </span>
                    </div>
                  )}

                  {/* Shipping */}

                  <div className="flex justify-between gap-4">
                    <span className="text-gray-500">Shipping</span>

                    <span
                      className={`font-medium ${
                        Number(order.shipping_amount) === 0
                          ? "text-green-700"
                          : "text-[#351019]"
                      }`}
                    >
                      {Number(order.shipping_amount) === 0
                        ? "FREE"
                        : formatPrice(order.shipping_amount)}
                    </span>
                  </div>

                  {/* Divider */}

                  <div className="border-t border-dashed border-[#eadfda]" />

                  {/* Total */}

                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-semibold text-[#351019]">
                        Total Amount
                      </p>

                      <p className="mt-1 text-xs text-gray-400">
                        Including all taxes
                      </p>
                    </div>

                    <span className="text-xl font-bold text-[#8f0828]">
                      {formatPrice(order.total_amount)}
                    </span>
                  </div>
                </div>
              </div>
            </section>

            {/* Security */}

            <section className="rounded-3xl border border-[#eadfda] bg-[#fffaf8] p-5">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-[#b68b3a] shadow-sm">
                  <ShieldCheck size={20} />
                </div>

                <div>
                  <p className="text-sm font-semibold text-[#351019]">
                    Secure Order
                  </p>

                  <p className="mt-1 text-xs leading-5 text-gray-500">
                    Your payment and personal information are securely
                    protected.
                  </p>
                </div>
              </div>
            </section>

            {/* Customer Note */}

            {order.customer_note && (
              <section className="rounded-3xl border border-[#eadfda] bg-white p-5 shadow-sm sm:p-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#fff8e8] text-[#b68b3a]">
                    <FileText size={19} />
                  </div>

                  <h2 className="font-semibold text-[#351019]">Order Note</h2>
                </div>

                <p className="mt-5 border-t border-[#f0e7e2] pt-5 text-sm leading-6 text-gray-600">
                  {order.customer_note}
                </p>
              </section>
            )}
          </div>
        </div>

        {/* ================================================================= */}
        {/* HELP SECTION                                                        */}
        {/* ================================================================= */}

        <section className="mt-8 rounded-3xl border border-[#eadfda] bg-white p-5 text-center shadow-sm sm:p-8">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#fff4f1] text-[#8f0828]">
            <ShoppingBag size={22} />
          </div>

          <h2 className="mt-4 font-semibold text-[#351019]">
            Need help with this order?
          </h2>

          <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-gray-500">
            You can view your complete order information here, download your
            invoice, request a return, or reorder your favourite products.
          </p>

          <Link
            href="/account/orders"
            className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[#8f0828] transition hover:text-[#70061f]"
          >
            View All Orders
            <ChevronRight size={17} />
          </Link>
        </section>
      </div>
    </main>
  );
}
