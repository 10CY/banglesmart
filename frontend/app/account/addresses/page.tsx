"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";

import Link from "next/link";

import {
  AlertCircle,
  ArrowLeft,
  Check,
  CheckCircle2,
  Edit3,
  Home,
  Loader2,
  MapPin,
  Plus,
  Star,
  Trash2,
  X,
} from "lucide-react";

import { useRouter } from "next/navigation";

import { customerApiFetch } from "@/lib/customerApi";

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

type Address = {
  id: number;
  user_id: number;

  full_name: string;
  phone: string;

  address_line_1: string;
  address_line_2: string | null;
  landmark: string | null;

  city: string;
  state: string;
  postal_code: string;
  country: string;

  type: "shipping" | "billing" | "both";

  is_default: boolean | number;

  created_at: string;
  updated_at: string;
};

type Toast = {
  type: "success" | "error";
  message: string;
} | null;

/* -------------------------------------------------------------------------- */
/* Page                                                                       */
/* -------------------------------------------------------------------------- */

export default function AddressesPage() {
  const router = useRouter();

  const [addresses, setAddresses] = useState<Address[]>([]);

  const [loading, setLoading] = useState(true);

  const [pageError, setPageError] = useState("");

  const [toast, setToast] = useState<Toast>(null);

  /* ------------------------------------------------------------------------ */
  /* Drawer                                                                   */
  /* ------------------------------------------------------------------------ */

  const [showForm, setShowForm] = useState(false);

  const [editing, setEditing] = useState<Address | null>(null);

  /* ------------------------------------------------------------------------ */
  /* Delete Modal                                                             */
  /* ------------------------------------------------------------------------ */

  const [deleteTarget, setDeleteTarget] = useState<Address | null>(null);

  const [deleting, setDeleting] = useState(false);

  /* ------------------------------------------------------------------------ */
  /* Form                                                                     */
  /* ------------------------------------------------------------------------ */

  const [fullName, setFullName] = useState("");

  const [phone, setPhone] = useState("");

  const [addressLine1, setAddressLine1] = useState("");

  const [addressLine2, setAddressLine2] = useState("");

  const [landmark, setLandmark] = useState("");

  const [city, setCity] = useState("");

  const [state, setState] = useState("");

  const [postalCode, setPostalCode] = useState("");

  const [country, setCountry] = useState("India");

  const [type, setType] = useState<"shipping" | "billing" | "both">("shipping");

  const [isDefault, setIsDefault] = useState(false);

  const [saving, setSaving] = useState(false);

  const [formError, setFormError] = useState("");

  /* ------------------------------------------------------------------------ */
  /* Toast                                                                    */
  /* ------------------------------------------------------------------------ */

  function showToast(type: "success" | "error", message: string) {
    setToast({
      type,
      message,
    });

    window.setTimeout(() => {
      setToast(null);
    }, 3500);
  }

  /* ------------------------------------------------------------------------ */
  /* Load Addresses                                                           */
  /* ------------------------------------------------------------------------ */

  const loadAddresses = useCallback(async () => {
    try {
      setLoading(true);

      setPageError("");

      const token = localStorage.getItem("customer_token");

      if (!token) {
        router.replace("/login");

        return;
      }

      const response = await customerApiFetch("/customer/addresses");

      const data = await response.json();

      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem("customer_token");

        localStorage.removeItem("customer_user");

        router.replace("/login");

        return;
      }

      if (!response.ok) {
        setPageError(data.message || "Unable to load addresses.");

        return;
      }

      setAddresses(data.data || []);
    } catch {
      setPageError("Unable to connect to server.");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    loadAddresses();
  }, [loadAddresses]);

  /* ------------------------------------------------------------------------ */
  /* Reset Form                                                               */
  /* ------------------------------------------------------------------------ */

  function resetForm() {
    setFullName("");

    setPhone("");

    setAddressLine1("");

    setAddressLine2("");

    setLandmark("");

    setCity("");

    setState("");

    setPostalCode("");

    setCountry("India");

    setType("shipping");

    setIsDefault(false);

    setEditing(null);

    setFormError("");
  }

  /* ------------------------------------------------------------------------ */
  /* Add Address                                                              */
  /* ------------------------------------------------------------------------ */

  function openAdd() {
    resetForm();

    if (addresses.length === 0) {
      setIsDefault(true);
    }

    setShowForm(true);
  }

  /* ------------------------------------------------------------------------ */
  /* Edit Address                                                             */
  /* ------------------------------------------------------------------------ */

  function openEdit(address: Address) {
    setEditing(address);

    setFullName(address.full_name || "");

    setPhone(address.phone || "");

    setAddressLine1(address.address_line_1 || "");

    setAddressLine2(address.address_line_2 || "");

    setLandmark(address.landmark || "");

    setCity(address.city || "");

    setState(address.state || "");

    setPostalCode(address.postal_code || "");

    setCountry(address.country || "India");

    setType(address.type || "shipping");

    setIsDefault(Boolean(address.is_default));

    setFormError("");

    setShowForm(true);
  }

  /* ------------------------------------------------------------------------ */
  /* Close Form                                                               */
  /* ------------------------------------------------------------------------ */

  function closeForm() {
    if (saving) {
      return;
    }

    setShowForm(false);

    resetForm();
  }

  /* ------------------------------------------------------------------------ */
  /* Save Address                                                             */
  /* ------------------------------------------------------------------------ */

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setSaving(true);

    setFormError("");

    try {
      const endpoint = editing
        ? `/customer/addresses/${editing.id}`
        : "/customer/addresses";

      const response = await customerApiFetch(endpoint, {
        method: editing ? "PUT" : "POST",

        body: JSON.stringify({
          full_name: fullName.trim(),

          phone: phone.trim(),

          address_line_1: addressLine1.trim(),

          address_line_2: addressLine2.trim() ? addressLine2.trim() : null,

          landmark: landmark.trim() ? landmark.trim() : null,

          city: city.trim(),

          state: state.trim(),

          postal_code: postalCode.trim(),

          country: country.trim(),

          type,

          is_default: isDefault,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        const validationErrors = data.errors as
          | Record<string, string[]>
          | undefined;

        const firstError = validationErrors
          ? Object.values(validationErrors)[0]?.[0]
          : undefined;

        setFormError(firstError || data.message || "Unable to save address.");

        return;
      }

      const successMessage = editing
        ? "Address updated successfully."
        : "New address added successfully.";

      setShowForm(false);

      resetForm();

      await loadAddresses();

      showToast("success", successMessage);
    } catch {
      setFormError("Unable to connect to server.");
    } finally {
      setSaving(false);
    }
  }

  /* ------------------------------------------------------------------------ */
  /* Set Default                                                              */
  /* ------------------------------------------------------------------------ */

  async function setDefaultAddress(id: number) {
    try {
      const response = await customerApiFetch(
        `/customer/addresses/${id}/default`,
        {
          method: "PUT",
        },
      );

      const data = await response.json();

      if (!response.ok) {
        showToast("error", data.message || "Unable to set default address.");

        return;
      }

      await loadAddresses();

      showToast("success", "Default address updated.");
    } catch {
      showToast("error", "Unable to connect to server.");
    }
  }

  /* ------------------------------------------------------------------------ */
  /* Delete Address                                                           */
  /* ------------------------------------------------------------------------ */

  function openDelete(address: Address) {
    setDeleteTarget(address);
  }

  function closeDelete() {
    if (deleting) {
      return;
    }

    setDeleteTarget(null);
  }

  async function confirmDelete() {
    if (!deleteTarget) {
      return;
    }

    setDeleting(true);

    try {
      const response = await customerApiFetch(
        `/customer/addresses/${deleteTarget.id}`,
        {
          method: "DELETE",
        },
      );

      const data = await response.json();

      if (!response.ok) {
        showToast("error", data.message || "Unable to delete address.");

        return;
      }

      setDeleteTarget(null);

      await loadAddresses();

      showToast("success", "Address deleted successfully.");
    } catch {
      showToast("error", "Unable to connect to server.");
    } finally {
      setDeleting(false);
    }
  }

  /* ------------------------------------------------------------------------ */
  /* Loading                                                                  */
  /* ------------------------------------------------------------------------ */

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#faf9f9] px-4">
        <div className="flex flex-col items-center">
          <div className="relative">
            <div className="h-16 w-16 animate-pulse rounded-full bg-[#8f0828]/10" />

            <MapPin
              size={28}
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-[#8f0828]"
            />
          </div>

          <p className="mt-5 text-sm font-medium text-gray-600">
            Loading your addresses...
          </p>
        </div>
      </main>
    );
  }

  /* ------------------------------------------------------------------------ */
  /* UI                                                                       */
  /* ------------------------------------------------------------------------ */

  return (
    <main className="min-h-screen bg-[#faf9f9] px-4 py-6 sm:px-6 sm:py-10">
      {/* Toast */}

      {toast && (
        <div className="fixed right-4 top-4 z-[100] w-[calc(100%-2rem)] max-w-sm animate-in slide-in-from-top-4 duration-300 sm:right-6">
          <div
            className={`flex items-start gap-3 rounded-2xl border p-4 shadow-2xl ${
              toast.type === "success"
                ? "border-green-100 bg-white"
                : "border-red-100 bg-white"
            }`}
          >
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                toast.type === "success"
                  ? "bg-green-50 text-green-600"
                  : "bg-red-50 text-red-600"
              }`}
            >
              {toast.type === "success" ? (
                <CheckCircle2 size={20} />
              ) : (
                <AlertCircle size={20} />
              )}
            </div>

            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-900">
                {toast.type === "success" ? "Success" : "Something went wrong"}
              </p>

              <p className="mt-1 text-sm text-gray-500">{toast.message}</p>
            </div>

            <button
              type="button"
              onClick={() => setToast(null)}
              className="text-gray-400 transition hover:text-gray-700"
            >
              <X size={18} />
            </button>
          </div>
        </div>
      )}

      <div className="mx-auto max-w-6xl">
        {/* ---------------------------------------------------------------- */}
        {/* Header                                                           */}
        {/* ---------------------------------------------------------------- */}

        <div className="overflow-hidden rounded-3xl border border-[#eadfe2] bg-white shadow-sm">
          <div className="relative overflow-hidden bg-gradient-to-r from-[#8f0828] to-[#5d061a] px-5 py-7 sm:px-8 sm:py-9">
            <div className="absolute -right-10 -top-16 h-48 w-48 rounded-full bg-white/5" />

            <div className="absolute -bottom-24 right-24 h-48 w-48 rounded-full bg-white/5" />

            <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <Link
                  href="/account"
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/20 bg-white/10 text-white backdrop-blur transition hover:bg-white/20"
                  aria-label="Back to account"
                >
                  <ArrowLeft size={20} />
                </Link>

                <div>
                  <div className="flex items-center gap-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/15 text-white">
                      <MapPin size={19} />
                    </div>

                    <span className="text-xs font-semibold uppercase tracking-[0.2em] text-white/70">
                      BanglesMart
                    </span>
                  </div>

                  <h1 className="mt-3 text-2xl font-bold tracking-tight text-white sm:text-3xl">
                    My Addresses
                  </h1>

                  <p className="mt-1 text-sm text-white/70">
                    Manage your delivery and billing addresses.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={openAdd}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-[#8f0828] shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl"
              >
                <Plus size={18} />
                Add New Address
              </button>
            </div>
          </div>

          {/* Stats */}

          <div className="grid grid-cols-2 divide-x divide-gray-100 border-b border-gray-100">
            <div className="px-5 py-4 sm:px-8">
              <p className="text-xs font-medium uppercase tracking-wider text-gray-400">
                Saved Addresses
              </p>

              <p className="mt-1 text-xl font-bold text-gray-900">
                {addresses.length}
              </p>
            </div>

            <div className="px-5 py-4 sm:px-8">
              <p className="text-xs font-medium uppercase tracking-wider text-gray-400">
                Default Address
              </p>

              <p className="mt-1 truncate text-sm font-semibold text-gray-900">
                {addresses.find((address) => Boolean(address.is_default))
                  ?.full_name || "Not selected"}
              </p>
            </div>
          </div>
        </div>

        {/* Error */}

        {pageError && (
          <div className="mt-6 flex items-start gap-3 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">
            <AlertCircle size={20} className="mt-0.5 shrink-0" />

            <div>
              <p className="font-semibold">Unable to load addresses</p>

              <p className="mt-1">{pageError}</p>
            </div>
          </div>
        )}

        {/* ---------------------------------------------------------------- */}
        {/* Empty State                                                      */}
        {/* ---------------------------------------------------------------- */}

        {addresses.length === 0 ? (
          <div className="mt-8 rounded-3xl border border-dashed border-gray-300 bg-white px-6 py-16 text-center shadow-sm">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-[#8f0828]/5">
              <MapPin size={34} className="text-[#8f0828]" />
            </div>

            <h2 className="mt-6 text-xl font-bold text-gray-900">
              No addresses saved yet
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-500">
              Add your delivery address now to make your checkout experience
              faster and smoother.
            </p>

            <button
              type="button"
              onClick={openAdd}
              className="mt-7 inline-flex items-center gap-2 rounded-xl bg-[#8f0828] px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-[#8f0828]/20 transition hover:bg-[#760620]"
            >
              <Plus size={18} />
              Add Your First Address
            </button>
          </div>
        ) : (
          /* -------------------------------------------------------------- */
          /* Address Cards                                                  */
          /* -------------------------------------------------------------- */

          <div className="mt-8 grid grid-cols-1 gap-5 lg:grid-cols-2">
            {addresses.map((address) => {
              const isDefaultAddress = Boolean(address.is_default);

              return (
                <div
                  key={address.id}
                  className={`group relative overflow-hidden rounded-3xl border bg-white transition duration-300 hover:-translate-y-1 hover:shadow-xl ${
                    isDefaultAddress
                      ? "border-[#8f0828]/30 shadow-md shadow-[#8f0828]/5"
                      : "border-gray-200 shadow-sm"
                  }`}
                >
                  {/* Top accent */}

                  <div
                    className={`h-1.5 w-full ${
                      isDefaultAddress ? "bg-[#8f0828]" : "bg-gray-100"
                    }`}
                  />

                  <div className="p-5 sm:p-6">
                    {/* Header */}

                    <div className="flex items-start justify-between gap-4">
                      <div className="flex min-w-0 gap-3">
                        <div
                          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${
                            isDefaultAddress
                              ? "bg-[#8f0828]/10 text-[#8f0828]"
                              : "bg-gray-100 text-gray-500"
                          }`}
                        >
                          <Home size={20} />
                        </div>

                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h2 className="truncate text-base font-bold text-gray-900">
                              {address.full_name}
                            </h2>

                            {isDefaultAddress && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-[#8f0828] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
                                <Check size={11} />
                                Default
                              </span>
                            )}
                          </div>

                          <div className="mt-2 flex flex-wrap items-center gap-2">
                            <span className="rounded-full bg-gray-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                              {address.type === "both"
                                ? "Shipping & Billing"
                                : address.type}
                            </span>
                          </div>
                        </div>
                      </div>

                      <MapPin
                        size={20}
                        className={
                          isDefaultAddress ? "text-[#8f0828]" : "text-gray-300"
                        }
                      />
                    </div>

                    {/* Phone */}

                    <div className="mt-5 flex items-center gap-2 border-b border-gray-100 pb-4">
                      <div className="h-2 w-2 rounded-full bg-green-500" />

                      <p className="text-sm font-medium text-gray-700">
                        +91 {address.phone}
                      </p>
                    </div>

                    {/* Address */}

                    <div className="mt-5 min-h-[125px]">
                      <p className="text-sm leading-7 text-gray-600">
                        {address.address_line_1}

                        {address.address_line_2 && (
                          <>
                            <br />

                            {address.address_line_2}
                          </>
                        )}

                        {address.landmark && (
                          <>
                            <br />

                            <span className="text-gray-400">Landmark: </span>

                            {address.landmark}
                          </>
                        )}

                        <br />

                        <span className="font-medium text-gray-700">
                          {address.city}, {address.state}
                          {" - "}
                          {address.postal_code}
                        </span>

                        <br />

                        {address.country}
                      </p>
                    </div>

                    {/* Actions */}

                    <div className="mt-6 flex flex-wrap gap-2 border-t border-gray-100 pt-5">
                      <button
                        type="button"
                        onClick={() => openEdit(address)}
                        className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-gray-700 transition hover:border-gray-300 hover:bg-gray-50"
                      >
                        <Edit3 size={15} />
                        Edit
                      </button>

                      {!isDefaultAddress && (
                        <button
                          type="button"
                          onClick={() => setDefaultAddress(address.id)}
                          className="inline-flex items-center gap-2 rounded-xl border border-[#8f0828]/15 bg-[#8f0828]/5 px-3.5 py-2.5 text-xs font-semibold text-[#8f0828] transition hover:bg-[#8f0828] hover:text-white"
                        >
                          <Star size={15} />
                          Set Default
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => openDelete(address)}
                        className="ml-auto inline-flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-red-600 transition hover:bg-red-50"
                      >
                        <Trash2 size={15} />
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* -------------------------------------------------------------------- */}
      {/* Address Drawer                                                       */}
      {/* -------------------------------------------------------------------- */}

      {showForm && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-sm">
          <button
            type="button"
            aria-label="Close"
            onClick={closeForm}
            className="absolute inset-0 h-full w-full cursor-default"
          />

          <div className="relative flex h-full w-full max-w-xl flex-col bg-white shadow-2xl">
            {/* Header */}

            <div className="relative overflow-hidden bg-gradient-to-r from-[#8f0828] to-[#5d061a] px-5 py-6 text-white sm:px-7">
              <div className="absolute -right-8 -top-10 h-32 w-32 rounded-full bg-white/5" />

              <div className="relative flex items-start justify-between gap-4">
                <div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15">
                    {editing ? <Edit3 size={19} /> : <Plus size={20} />}
                  </div>

                  <h2 className="mt-4 text-xl font-bold">
                    {editing ? "Edit Address" : "Add New Address"}
                  </h2>

                  <p className="mt-1 text-sm text-white/70">
                    {editing
                      ? "Update your saved address details."
                      : "Enter your delivery address details."}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closeForm}
                  className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-white transition hover:bg-white/20"
                  aria-label="Close"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Form */}

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
              <div className="space-y-5 p-5 sm:p-7">
                {formError && (
                  <div className="flex items-start gap-3 rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">
                    <AlertCircle size={18} className="mt-0.5 shrink-0" />

                    <p>{formError}</p>
                  </div>
                )}

                {/* Personal Details */}

                <div>
                  <div className="mb-4">
                    <p className="text-sm font-bold text-gray-900">
                      Contact Details
                    </p>

                    <p className="mt-1 text-xs text-gray-500">
                      Who will receive this order?
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Full Name *
                      </label>

                      <input
                        type="text"
                        required
                        value={fullName}
                        onChange={(event) => setFullName(event.target.value)}
                        placeholder="Enter full name"
                        className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-[#8f0828] focus:bg-white focus:ring-4 focus:ring-[#8f0828]/5"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Phone Number *
                      </label>

                      <div className="flex overflow-hidden rounded-xl border border-gray-200 bg-gray-50 transition focus-within:border-[#8f0828] focus-within:bg-white focus-within:ring-4 focus-within:ring-[#8f0828]/5">
                        <span className="flex items-center border-r border-gray-200 px-3 text-sm font-medium text-gray-500">
                          +91
                        </span>

                        <input
                          type="tel"
                          required
                          value={phone}
                          onChange={(event) =>
                            setPhone(
                              event.target.value
                                .replace(/\D/g, "")
                                .slice(0, 10),
                            )
                          }
                          placeholder="9876543210"
                          className="min-w-0 flex-1 bg-transparent px-3 py-3 text-sm text-gray-900 outline-none"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Address Details */}

                <div className="border-t border-gray-100 pt-5">
                  <div className="mb-4">
                    <p className="text-sm font-bold text-gray-900">
                      Address Details
                    </p>

                    <p className="mt-1 text-xs text-gray-500">
                      Enter your complete delivery location.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Address Line 1 *
                      </label>

                      <input
                        type="text"
                        required
                        value={addressLine1}
                        onChange={(event) =>
                          setAddressLine1(event.target.value)
                        }
                        placeholder="House, Flat, Building, Company"
                        className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none transition focus:border-[#8f0828] focus:bg-white focus:ring-4 focus:ring-[#8f0828]/5"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Address Line 2
                      </label>

                      <input
                        type="text"
                        value={addressLine2}
                        onChange={(event) =>
                          setAddressLine2(event.target.value)
                        }
                        placeholder="Street, Area, Locality"
                        className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none transition focus:border-[#8f0828] focus:bg-white focus:ring-4 focus:ring-[#8f0828]/5"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Landmark
                      </label>

                      <input
                        type="text"
                        value={landmark}
                        onChange={(event) => setLandmark(event.target.value)}
                        placeholder="Near a famous place or building"
                        className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none transition focus:border-[#8f0828] focus:bg-white focus:ring-4 focus:ring-[#8f0828]/5"
                      />
                    </div>
                  </div>
                </div>

                {/* Location */}

                <div className="border-t border-gray-100 pt-5">
                  <p className="mb-4 text-sm font-bold text-gray-900">
                    Location
                  </p>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                        City *
                      </label>

                      <input
                        type="text"
                        required
                        value={city}
                        onChange={(event) => setCity(event.target.value)}
                        placeholder="Mumbai"
                        className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none transition focus:border-[#8f0828] focus:bg-white focus:ring-4 focus:ring-[#8f0828]/5"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                        State *
                      </label>

                      <input
                        type="text"
                        required
                        value={state}
                        onChange={(event) => setState(event.target.value)}
                        placeholder="Maharashtra"
                        className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none transition focus:border-[#8f0828] focus:bg-white focus:ring-4 focus:ring-[#8f0828]/5"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                        PIN Code *
                      </label>

                      <input
                        type="text"
                        required
                        value={postalCode}
                        onChange={(event) =>
                          setPostalCode(
                            event.target.value.replace(/\D/g, "").slice(0, 6),
                          )
                        }
                        placeholder="400001"
                        className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none transition focus:border-[#8f0828] focus:bg-white focus:ring-4 focus:ring-[#8f0828]/5"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Country *
                      </label>

                      <input
                        type="text"
                        required
                        value={country}
                        onChange={(event) => setCountry(event.target.value)}
                        className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none transition focus:border-[#8f0828] focus:bg-white focus:ring-4 focus:ring-[#8f0828]/5"
                      />
                    </div>
                  </div>
                </div>

                {/* Address Type */}

                <div className="border-t border-gray-100 pt-5">
                  <label className="mb-3 block text-sm font-bold text-gray-900">
                    Address Type
                  </label>

                  <div className="grid grid-cols-3 gap-2">
                    {[
                      {
                        value: "shipping",
                        label: "Shipping",
                      },
                      {
                        value: "billing",
                        label: "Billing",
                      },
                      {
                        value: "both",
                        label: "Both",
                      },
                    ].map((item) => (
                      <button
                        key={item.value}
                        type="button"
                        onClick={() =>
                          setType(item.value as "shipping" | "billing" | "both")
                        }
                        className={`rounded-xl border px-3 py-3 text-xs font-semibold transition ${
                          type === item.value
                            ? "border-[#8f0828] bg-[#8f0828] text-white shadow-md shadow-[#8f0828]/15"
                            : "border-gray-200 bg-white text-gray-600 hover:border-[#8f0828]/30"
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Default */}

                <label
                  className={`flex cursor-pointer items-start gap-4 rounded-2xl border p-4 transition ${
                    isDefault
                      ? "border-[#8f0828]/30 bg-[#8f0828]/5"
                      : "border-gray-200 bg-gray-50 hover:bg-white"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isDefault}
                    onChange={(event) => setIsDefault(event.target.checked)}
                    disabled={Boolean(editing?.is_default)}
                    className="mt-1 h-4 w-4 accent-[#8f0828]"
                  />

                  <div className="flex-1">
                    <p className="text-sm font-bold text-gray-900">
                      Set as default address
                    </p>

                    <p className="mt-1 text-xs leading-5 text-gray-500">
                      This address will be automatically selected during
                      checkout.
                    </p>
                  </div>

                  {isDefault && (
                    <Star
                      size={18}
                      className="shrink-0 fill-[#8f0828] text-[#8f0828]"
                    />
                  )}
                </label>
              </div>

              {/* Footer */}

              <div className="sticky bottom-0 border-t border-gray-200 bg-white/95 p-5 backdrop-blur sm:px-7">
                <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={closeForm}
                    disabled={saving}
                    className="rounded-xl border border-gray-200 bg-white px-5 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#8f0828] px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-[#8f0828]/20 transition hover:bg-[#760620] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {saving && <Loader2 size={17} className="animate-spin" />}

                    {saving
                      ? "Saving..."
                      : editing
                        ? "Update Address"
                        : "Save Address"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------------- */}
      {/* Delete Confirmation Modal                                            */}
      {/* -------------------------------------------------------------------- */}

      {deleteTarget && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
          <button
            type="button"
            onClick={closeDelete}
            className="absolute inset-0 h-full w-full cursor-default"
            aria-label="Close"
          />

          <div className="relative w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl">
            {/* Top */}

            <div className="px-6 pt-7 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-red-600">
                <Trash2 size={27} />
              </div>

              <h2 className="mt-5 text-xl font-bold text-gray-900">
                Delete Address?
              </h2>

              <p className="mt-2 text-sm leading-6 text-gray-500">
                Are you sure you want to delete this saved address?
              </p>
            </div>

            {/* Address Preview */}

            <div className="mx-6 mt-5 rounded-2xl border border-gray-100 bg-gray-50 p-4">
              <p className="font-semibold text-gray-900">
                {deleteTarget.full_name}
              </p>

              <p className="mt-1 text-sm text-gray-500">
                {deleteTarget.address_line_1}
              </p>

              <p className="mt-1 text-sm text-gray-500">
                {deleteTarget.city}

                {", "}

                {deleteTarget.state}

                {" - "}

                {deleteTarget.postal_code}
              </p>
            </div>

            <div className="mt-6 flex flex-col-reverse gap-3 border-t border-gray-100 p-6 sm:flex-row">
              <button
                type="button"
                onClick={closeDelete}
                disabled={deleting}
                className="flex-1 rounded-xl border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
              >
                Keep Address
              </button>

              <button
                type="button"
                onClick={confirmDelete}
                disabled={deleting}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-60"
              >
                {deleting && <Loader2 size={17} className="animate-spin" />}

                {deleting ? "Deleting..." : "Yes, Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
