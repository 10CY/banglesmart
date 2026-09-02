"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Edit3,
  Mail,
  MapPin,
  Package,
  Phone,
  Save,
  ShoppingBag,
  UserRound,
  X,
  XCircle,
} from "lucide-react";
import { useParams } from "next/navigation";
import { apiFetch } from "@/lib/api";

type Address = {
  id: number;
  full_name: string;
  phone: string;
  address_line_1: string;
  address_line_2: string | null;
  landmark: string | null;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  type: string;
  is_default: number | boolean;
};

type CustomerOrder = {
  id: number;
  order_number: string;
  status: string;
  payment_method: string;
  payment_status: string;
  subtotal: string | number;
  shipping_amount: string | number;
  discount_amount: string | number;
  total_amount: string | number;
  created_at: string;
  items_count: number;
};

type CustomerSummary = {
  orders_count: number;
  total_spent: number;
  pending_orders: number;
  processing_orders: number;
  shipped_orders: number;
  delivered_orders: number;
  cancelled_orders: number;
  addresses_count: number;
};

type Customer = {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  addresses: Address[];
  orders: CustomerOrder[];
  summary: CustomerSummary;
};

function formatPrice(value: string | number) {
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

function statusClass(status: string) {
  switch (status) {
    case "delivered":
      return "bg-green-50 text-green-700";
    case "cancelled":
      return "bg-red-50 text-red-700";
    case "shipped":
      return "bg-blue-50 text-blue-700";
    case "processing":
      return "bg-amber-50 text-amber-700";
    default:
      return "bg-gray-100 text-gray-700";
  }
}

export default function CustomerDetailsPage() {
  const params = useParams();
  const customerId = String(params.id);

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [status, setStatus] = useState("active");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  async function loadCustomer() {
    try {
      setLoading(true);
      setError("");

      const response = await apiFetch(
        `/admin/customers/${customerId}`,
      );
      const json = await response.json();

      if (!response.ok) {
        throw new Error(json?.message || "Unable to load customer.");
      }

      const item = json?.data as Customer;
      if (!item) throw new Error("Customer data not found.");

      setCustomer(item);
      setName(item.name || "");
      setEmail(item.email || "");
      setPhone(item.phone || "");
      setStatus(item.status || "active");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to connect to server.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadCustomer();
  }, [customerId]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setFormError("");

    try {
      const response = await apiFetch(
        `/admin/customers/${customerId}`,
        {
          method: "PUT",
          body: JSON.stringify({
            name: name.trim(),
            email: email.trim(),
            phone: phone.trim() || null,
          }),
        },
      );

      const json = await response.json();

      if (!response.ok) {
        throw new Error(json?.message || "Unable to update customer.");
      }

      const statusResponse = await apiFetch(
        `/admin/customers/${customerId}/status`,
        {
          method: "PUT",
          body: JSON.stringify({ status }),
        },
      );

      const statusJson = await statusResponse.json();

      if (!statusResponse.ok) {
        throw new Error(
          statusJson?.message ||
            "Unable to update customer status.",
        );
      }

      setEditing(false);
      await loadCustomer();
    } catch (err) {
      setFormError(
        err instanceof Error
          ? err.message
          : "Unable to update customer.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function updateStatus(newStatus: "active" | "inactive") {
    if (!customer) return;

    const confirmed = window.confirm(
      newStatus === "inactive"
        ? "Deactivate this customer account?"
        : "Activate this customer account?",
    );

    if (!confirmed) return;

    try {
      const response = await apiFetch(
        `/admin/customers/${customerId}/status`,
        {
          method: "PUT",
          body: JSON.stringify({ status: newStatus }),
        },
      );

      const json = await response.json();

      if (!response.ok) {
        throw new Error(
          json?.message || "Unable to update customer status.",
        );
      }

      await loadCustomer();
    } catch (err) {
      window.alert(
        err instanceof Error
          ? err.message
          : "Unable to connect to server.",
      );
    }
  }

  function cancelEdit() {
    if (!customer) return;
    setName(customer.name || "");
    setEmail(customer.email || "");
    setPhone(customer.phone || "");
    setStatus(customer.status || "active");
    setFormError("");
    setEditing(false);
  }

  if (loading) {
    return (
      <div className="flex min-h-[450px] items-center justify-center text-sm text-gray-500">
        Loading customer...
      </div>
    );
  }

  if (!customer) {
    return (
      <div>
        <Link
          href="/admin/customers"
          className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-gray-700"
        >
          <ArrowLeft size={17} />
          Back to customers
        </Link>
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
          {error || "Customer not found."}
        </div>
      </div>
    );
  }

  const summary = customer.summary || {
    orders_count: 0,
    total_spent: 0,
    pending_orders: 0,
    processing_orders: 0,
    shipped_orders: 0,
    delivered_orders: 0,
    cancelled_orders: 0,
    addresses_count: 0,
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/customers"
            className="rounded-lg border border-gray-200 bg-white p-2 text-gray-700 hover:bg-gray-50"
          >
            <ArrowLeft size={19} />
          </Link>

          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              Customer Details
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Complete account, address and order history.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setEditing(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-black"
        >
          <Edit3 size={17} />
          Edit Customer
        </button>
      </div>

      {/* PROFILE HEADER */}
      <section className="rounded-2xl border border-gray-200 bg-white p-6">
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 text-xl font-semibold text-gray-700">
              {customer.name?.charAt(0)?.toUpperCase() || "C"}
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {customer.name}
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Customer #{customer.id}
              </p>
            </div>
          </div>

          <span
            className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium ${
              customer.status === "active"
                ? "bg-green-50 text-green-700"
                : "bg-red-50 text-red-700"
            }`}
          >
            {customer.status === "active" ? (
              <CheckCircle2 size={16} />
            ) : (
              <XCircle size={16} />
            )}
            {customer.status === "active" ? "Active" : "Inactive"}
          </span>
        </div>
      </section>

      {/* STATS */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ["Orders", summary.orders_count, Package],
          ["Total Spent", formatPrice(summary.total_spent), ShoppingBag],
          ["Addresses", summary.addresses_count, MapPin],
          ["Delivered", summary.delivered_orders, CheckCircle2],
        ].map(([label, value, Icon]) => {
          const StatIcon = Icon as typeof Package;
          return (
            <div
              key={String(label)}
              className="rounded-2xl border border-gray-200 bg-white p-5"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">{label}</p>
                <StatIcon size={18} className="text-gray-400" />
              </div>
              <p className="mt-3 text-2xl font-semibold text-gray-900">
                {value}
              </p>
            </div>
          );
        })}
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        {/* LEFT */}
        <div className="space-y-6">
          {/* CUSTOMER INFORMATION */}
          <section className="rounded-2xl border border-gray-200 bg-white">
            <div className="border-b border-gray-200 px-6 py-5">
              <h2 className="font-semibold text-gray-900">
                Customer Information
              </h2>
            </div>

            {editing ? (
              <form onSubmit={handleSubmit} className="space-y-5 p-6">
                {formError && (
                  <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {formError}
                  </div>
                )}

                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-gray-700">
                    Name
                  </span>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-gray-600"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-gray-700">
                    Email
                  </span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-gray-600"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-gray-700">
                    Phone
                  </span>
                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-gray-600"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-gray-700">
                    Account Status
                  </span>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm outline-none"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </label>

                <div className="flex justify-end gap-3 border-t border-gray-100 pt-5">
                  <button
                    type="button"
                    onClick={cancelEdit}
                    className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700"
                  >
                    <X size={17} />
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-medium text-white disabled:opacity-50"
                  >
                    <Save size={17} />
                    {saving ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </form>
            ) : (
              <div className="divide-y divide-gray-100">
                {[
                  [UserRound, "Name", customer.name],
                  [Mail, "Email", customer.email],
                  [Phone, "Phone", customer.phone || "Not added"],
                  [CalendarDays, "Joined", formatDate(customer.created_at)],
                ].map(([Icon, label, value]) => {
                  const InfoIcon = Icon as typeof UserRound;
                  return (
                    <div
                      key={String(label)}
                      className="flex items-center gap-4 px-6 py-5"
                    >
                      <div className="rounded-lg bg-gray-100 p-2.5 text-gray-600">
                        <InfoIcon size={19} />
                      </div>
                      <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                          {label}
                        </p>
                        <p className="mt-1 text-sm font-medium text-gray-900">
                          {value}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* ADDRESSES */}
          <section className="rounded-2xl border border-gray-200 bg-white p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-gray-900">Addresses</h2>
                <p className="mt-1 text-sm text-gray-500">
                  Saved shipping and billing addresses.
                </p>
              </div>
              <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
                {customer.addresses.length}
              </span>
            </div>

            {customer.addresses.length === 0 ? (
              <div className="mt-5 rounded-xl border border-dashed border-gray-200 bg-gray-50 p-8 text-center text-sm text-gray-500">
                This customer has no saved addresses.
              </div>
            ) : (
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                {customer.addresses.map((address) => (
                  <div
                    key={address.id}
                    className="rounded-xl border border-gray-200 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium text-gray-900">
                          {address.full_name}
                        </p>
                        <p className="mt-1 text-xs text-gray-500">
                          {address.type}
                          {Boolean(address.is_default) && " • Default"}
                        </p>
                      </div>
                      <MapPin size={17} className="text-gray-400" />
                    </div>
                    <p className="mt-4 text-sm leading-6 text-gray-600">
                      {address.address_line_1}
                      {address.address_line_2 && `, ${address.address_line_2}`}
                      {address.landmark && `, ${address.landmark}`}
                      <br />
                      {address.city}, {address.state} - {address.postal_code}
                      <br />
                      {address.country}
                    </p>
                    <p className="mt-3 text-xs text-gray-500">
                      {address.phone}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* ORDERS */}
          <section className="rounded-2xl border border-gray-200 bg-white p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-gray-900">Recent Orders</h2>
                <p className="mt-1 text-sm text-gray-500">
                  Latest orders placed by this customer.
                </p>
              </div>
              <Link
                href="/admin/orders"
                className="text-sm font-medium text-gray-700 hover:text-black"
              >
                View all →
              </Link>
            </div>

            {customer.orders.length === 0 ? (
              <div className="mt-5 rounded-xl border border-dashed border-gray-200 bg-gray-50 p-8 text-center text-sm text-gray-500">
                No orders yet.
              </div>
            ) : (
              <div className="mt-5 overflow-x-auto">
                <table className="w-full min-w-[680px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 text-xs uppercase tracking-wide text-gray-400">
                      <th className="pb-3 pr-4">Order</th>
                      <th className="pb-3 pr-4">Date</th>
                      <th className="pb-3 pr-4">Items</th>
                      <th className="pb-3 pr-4">Payment</th>
                      <th className="pb-3 pr-4">Status</th>
                      <th className="pb-3 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customer.orders.map((order) => (
                      <tr
                        key={order.id}
                        className="border-b border-gray-50 last:border-0"
                      >
                        <td className="py-4 pr-4">
                          <Link
                            href={`/admin/orders/${order.id}`}
                            className="font-medium text-gray-900 hover:underline"
                          >
                            #{order.order_number}
                          </Link>
                        </td>
                        <td className="py-4 pr-4 text-gray-500">
                          {formatDate(order.created_at)}
                        </td>
                        <td className="py-4 pr-4 text-gray-500">
                          {order.items_count}
                        </td>
                        <td className="py-4 pr-4 text-gray-500">
                          {String(order.payment_method).toUpperCase()}
                        </td>
                        <td className="py-4 pr-4">
                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusClass(order.status)}`}
                          >
                            {order.status}
                          </span>
                        </td>
                        <td className="py-4 text-right font-medium text-gray-900">
                          {formatPrice(order.total_amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>

        {/* RIGHT */}
        <aside className="space-y-6">
          <section className="rounded-2xl border border-gray-200 bg-white p-5">
            <h2 className="font-semibold text-gray-900">Account Status</h2>
            <p className="mt-3 text-sm leading-6 text-gray-500">
              {customer.status === "active"
                ? "This customer can log in and place orders."
                : "This customer cannot log in until the account is activated."}
            </p>

            <div className="mt-5 grid gap-2">
              {customer.status === "active" ? (
                <button
                  type="button"
                  onClick={() => void updateStatus("inactive")}
                  className="rounded-lg border border-red-200 px-4 py-2.5 text-sm font-medium text-red-700 hover:bg-red-50"
                >
                  Deactivate Customer
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => void updateStatus("active")}
                  className="rounded-lg border border-green-200 px-4 py-2.5 text-sm font-medium text-green-700 hover:bg-green-50"
                >
                  Activate Customer
                </button>
              )}
            </div>
          </section>

          <section className="rounded-2xl border border-gray-200 bg-white p-5">
            <h2 className="font-semibold text-gray-900">Order Breakdown</h2>
            <div className="mt-5 space-y-3">
              {[
                ["Pending", summary.pending_orders],
                ["Processing", summary.processing_orders],
                ["Shipped", summary.shipped_orders],
                ["Delivered", summary.delivered_orders],
                ["Cancelled", summary.cancelled_orders],
              ].map(([label, value]) => (
                <div
                  key={String(label)}
                  className="flex items-center justify-between"
                >
                  <span className="text-sm text-gray-500">{label}</span>
                  <span className="font-medium text-gray-900">{value}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-gray-200 bg-white p-5">
            <h2 className="font-semibold text-gray-900">Customer ID</h2>
            <p className="mt-2 text-2xl font-semibold text-gray-900">
              #{customer.id}
            </p>
            <p className="mt-2 text-xs text-gray-500">
              Joined {formatDate(customer.created_at)}
            </p>
          </section>
        </aside>
      </div>
    </div>
  );
}
