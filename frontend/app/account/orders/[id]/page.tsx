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
  RotateCcw,
  Truck,
  XCircle,
} from "lucide-react";

import {
  useParams,
  useRouter,
} from "next/navigation";

import {
  BACKEND_URL,
} from "@/lib/api";

import {
  customerApiFetch,
} from "@/lib/customerApi";

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

  items: OrderItem[];
};

/* -------------------------------------------------------------------------- */
/* Page                                                                       */
/* -------------------------------------------------------------------------- */

export default function CustomerOrderDetailPage() {
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
    error,
    setError,
  ] = useState("");

  const [
    invoiceLoading,
    setInvoiceLoading,
  ] = useState(false);

  const [returnOpen, setReturnOpen] = useState(false);
  const [returnReason, setReturnReason] = useState("damaged");
  const [returnNotes, setReturnNotes] = useState("");
  const [returnSubmitting, setReturnSubmitting] = useState(false);
  const [returnItems, setReturnItems] = useState<number[]>([]);

  /* ------------------------------------------------------------------------ */
  /* Load                                                                     */
  /* ------------------------------------------------------------------------ */

  const loadOrder =
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
            `/customer/orders/${id}`
          );

        const data =
          await response.json();

        if (
          response.status ===
          401
        ) {
          router.replace(
            "/login"
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
  async function reorderOrder() {
    if (!order || order.status !== "delivered") return;
    try {
      const response = await customerApiFetch(
        `/customer/orders/${order.id}/reorder`,
        { method: "POST" },
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

  async function submitReturnRequest() {
    if (!order || !returnItems.length || returnSubmitting) return;
    try {
      setReturnSubmitting(true);
      const response = await customerApiFetch("/customer/returns", {
        method: "POST",
        body: JSON.stringify({
          order_id: order.id,
          reason: returnReason,
          notes: returnNotes,
          items: returnItems.map((orderItemId) => ({ order_item_id: orderItemId, quantity: 1 })),
        }),
      });
      const data = await response.json();
      if (!response.ok) { alert(data?.message || "Unable to submit return request."); return; }
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

  async function cancelOrder() {

    const confirmCancel =
      window.confirm(
        "Are you sure you want to cancel this order?"
      );


    if (!confirmCancel) {
      return;
    }


    try {

      const response =
        await customerApiFetch(
          `/customer/orders/${order?.id}/cancel`,
          {
            method: "POST",
          }
        );


      const data =
        await response.json();


      if (!response.ok) {

        alert(
          data.message ||
          "Unable to cancel order."
        );

        return;

      }


      alert(
        "Order cancelled successfully."
      );


      loadOrder();


    } catch {

      alert(
        "Something went wrong."
      );

    }

  }
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
      <main className="flex min-h-screen items-center justify-center bg-gray-50">
        <p className="text-sm text-gray-500">
          Loading order...
        </p>
      </main>
    );
  }

  if (
    error ||
    !order
  ) {
    return (
      <main className="min-h-screen bg-gray-50 px-4 py-10">

        <div className="mx-auto max-w-5xl">

          <Link
            href="/account/orders"
            className="inline-flex items-center gap-2 text-sm font-medium text-gray-600"
          >
            <ArrowLeft
              size={17}
            />

            My Orders
          </Link>

          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error ||
              "Order not found."}
          </div>

        </div>

      </main>
    );
  }

  async function downloadInvoice() {
    if (invoiceLoading) return;
    try {
      setInvoiceLoading(true);
      setError("");
      const response = await customerApiFetch(
        `/customer/orders/${id}/invoice`
      );

      if (!response.ok) {
        const body = await response.text().catch(() => "");
        let message = "Unable to download invoice.";
        try {
          const json = JSON.parse(body);
          message = json?.message || message;
        } catch {
          if (body.trim()) message = body.trim();
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
          : "Unable to download invoice."
      );
    } finally {
      setInvoiceLoading(false);
    }
  }

  const discount =
    Number(
      order.discount_amount ||
        0
    );

  const reached = (
    step: string
  ) => {
    const sequence = [
      "pending",
      "processing",
      "shipped",
      "delivered",
    ];

    return (
      sequence.indexOf(
        order.status
      ) >=
      sequence.indexOf(
        step
      )
    );
  };

  /* ------------------------------------------------------------------------ */
  /* UI                                                                       */
  /* ------------------------------------------------------------------------ */

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-10">

      <div className="mx-auto max-w-6xl">

        <Link
          href="/account/orders"
          className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 transition hover:text-gray-900"
        >
          <ArrowLeft
            size={17}
          />

          My Orders
        </Link>

        {/* Header */}

        <section className="mt-5 rounded-xl border border-gray-200 bg-white p-6">

          <div className="flex flex-wrap items-start justify-between gap-4">

            <div>

              <p className="text-sm text-gray-500">
                Order
              </p>

              <h1 className="mt-1 text-2xl font-semibold text-gray-900">
                {order.order_number}
              </h1>

              <p className="mt-2 text-sm text-gray-500">
                Placed{" "}
                {formatDate(
                  order.created_at
                )}
              </p>

            </div>

            <div className="flex flex-wrap items-end justify-end gap-2">

  {order.status === "delivered" && (
    <button
      type="button"
      onClick={reorderOrder}
      className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-800 transition hover:border-[#c9a227] hover:bg-[#fcfaf6]"
    >
      <Package size={16} />
      Buy Again
    </button>
  )}

  {order.status === "delivered" && (
    <button
      type="button"
      onClick={() => setReturnOpen((value) => !value)}
      className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-800 transition hover:border-[#c9a227] hover:bg-[#fcfaf6]"
    >
      <RotateCcw size={16} />
      Return
    </button>
  )}

  <button
    type="button"
    onClick={downloadInvoice}
    disabled={invoiceLoading}
    className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-800 transition hover:border-[#c9a227] hover:bg-[#fcfaf6] disabled:cursor-wait disabled:opacity-60"
  >
    <Download size={16} />
    {invoiceLoading ? "Generating..." : "Invoice"}
  </button>

  <span
    className={`rounded-full px-3 py-1.5 text-sm font-medium capitalize ${statusClasses(
      order.status
    )}`}
  >
    {order.status}
  </span>


  {
    order.status === "pending" && (

      <button
        onClick={cancelOrder}
        className="
          inline-flex
          items-center
          gap-2
          rounded-lg
          border
          border-red-300
          px-4
          py-2
          text-sm
          font-medium
          text-red-600
          transition
          hover:bg-red-50
        "
      >

        <XCircle size={16}/>

        Cancel Order

      </button>

    )
  }

</div>

          </div>

        </section>

        {returnOpen && order.status === "delivered" && (
          <section className="mt-6 rounded-xl border border-[#e8e0d4] bg-white p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="font-semibold text-gray-900">Request a return</h2>
                <p className="mt-1 text-sm text-gray-500">Select the item(s) and tell us what went wrong.</p>
              </div>
              <Link href="/account/returns" className="text-sm font-semibold text-[#8f0828]">View requests</Link>
            </div>
            <div className="mt-5 space-y-2">
              {order.items.map((item) => (
                <label key={item.id} className="flex items-center gap-3 rounded-lg border border-gray-200 p-3">
                  <input type="checkbox" checked={returnItems.includes(item.id)} onChange={(e) => setReturnItems((current) => e.target.checked ? [...current, item.id] : current.filter((id) => id !== item.id))} />
                  <span className="text-sm text-gray-800">{item.product_name} · {item.variant_sku || "Product"}</span>
                </label>
              ))}
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <select value={returnReason} onChange={(e) => setReturnReason(e.target.value)} className="rounded-lg border border-gray-200 px-3 py-3 text-sm">
                <option value="damaged">Damaged</option>
                <option value="wrong_item">Wrong item</option>
                <option value="size_issue">Size issue</option>
                <option value="quality_issue">Quality issue</option>
                <option value="other">Other</option>
              </select>
              <input value={returnNotes} onChange={(e) => setReturnNotes(e.target.value)} placeholder="Additional note (optional)" className="rounded-lg border border-gray-200 px-3 py-3 text-sm" />
            </div>
            <button type="button" disabled={!returnItems.length || returnSubmitting} onClick={() => void submitReturnRequest()} className="mt-4 rounded-lg bg-gray-900 px-5 py-3 text-sm font-semibold text-white disabled:opacity-50">{returnSubmitting ? "Submitting..." : "Submit return request"}</button>
          </section>
        )}

        {/* Status */}

        {order.status ===
        "cancelled" ? (

          <section className="mt-6 rounded-xl border border-red-200 bg-red-50 p-5">

            <div className="flex items-start gap-3">

              <XCircle
                size={22}
                className="mt-0.5 text-red-600"
              />

              <div>

                <h2 className="font-semibold text-red-800">
                  Order Cancelled
                </h2>

                <p className="mt-1 text-sm text-red-700">
                  This order has been cancelled.
                </p>

              </div>

            </div>

          </section>

        ) : (

          <section className="mt-6 rounded-xl border border-gray-200 bg-white p-6">

            <h2 className="font-semibold text-gray-900">
              Order Status
            </h2>

            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-4">

              {[
                {
                  key: "pending",
                  label: "Order Placed",
                  icon: Clock3,
                },
                {
                  key: "processing",
                  label: "Processing",
                  icon: Package,
                },
                {
                  key: "shipped",
                  label: "Shipped",
                  icon: Truck,
                },
                {
                  key: "delivered",
                  label: "Delivered",
                  icon: CheckCircle2,
                },
              ].map(
                (step) => {

                  const active =
                    reached(
                      step.key
                    );

                  const Icon =
                    step.icon;

                  return (

                    <div
                      key={
                        step.key
                      }
                      className={`rounded-xl border p-4 ${
                        active
                          ? "border-green-200 bg-green-50"
                          : "border-gray-200 bg-gray-50"
                      }`}
                    >

                      <Icon
                        size={20}
                        className={
                          active
                            ? "text-green-700"
                            : "text-gray-400"
                        }
                      />

                      <p
                        className={`mt-3 text-sm font-medium ${
                          active
                            ? "text-green-800"
                            : "text-gray-400"
                        }`}
                      >
                        {step.label}
                      </p>

                    </div>

                  );
                }
              )}

            </div>

          </section>

        )}

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">

          {/* Left */}

          <div className="space-y-6">

            {/* Products */}

            <section className="overflow-hidden rounded-xl border border-gray-200 bg-white">

              <div className="border-b border-gray-200 px-5 py-4">

                <h2 className="font-semibold text-gray-900">
                  Products
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
                        {
                          item.product_name
                        }
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

                      <div className="mt-3 flex items-center justify-between gap-3">

                        <span className="text-sm text-gray-500">
                          {formatPrice(
                            item.price
                          )}{" "}
                          ×{" "}
                          {
                            item.quantity
                          }
                        </span>

                        <span className="font-semibold text-gray-900">
                          {formatPrice(
                            item.line_total
                          )}
                        </span>

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
                  <MapPin size={18} />

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
                  <MapPin size={18} />

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

          </div>

          {/* Right */}

          <div className="space-y-6">

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

                <div className="flex justify-between">

                  <span className="text-gray-500">
                    Status
                  </span>

                  <span
                    className={`font-medium capitalize ${
                      order.payment_status ===
                      "paid"
                        ? "text-green-700"
                        : "text-yellow-700"
                    }`}
                  >
                    {order.payment_status}
                  </span>

                </div>

              </div>

            </section>

            {/* Totals */}

            <section className="rounded-xl border border-gray-200 bg-white p-5">

              <h2 className="font-semibold text-gray-900">
                Order Summary
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

                    <span className="font-semibold text-green-700">
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

            {/* Note */}

            {order.customer_note && (

              <section className="rounded-xl border border-gray-200 bg-white p-5">

                <h2 className="font-semibold text-gray-900">
                  Order Note
                </h2>

                <p className="mt-3 whitespace-pre-line text-sm leading-6 text-gray-600">
                  {order.customer_note}
                </p>

              </section>

            )}

          </div>

        </div>

      </div>

    </main>
  );
}