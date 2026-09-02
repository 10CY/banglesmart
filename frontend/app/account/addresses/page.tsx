"use client";

import {
  FormEvent,
  useCallback,
  useEffect,
  useState,
} from "react";

import Link from "next/link";

import {
  ArrowLeft,
  Check,
  Edit3,
  MapPin,
  Plus,
  Star,
  Trash2,
  X,
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

  type:
    | "shipping"
    | "billing"
    | "both";

  is_default: boolean;

  created_at: string;
  updated_at: string;
};

/* -------------------------------------------------------------------------- */
/* Page                                                                       */
/* -------------------------------------------------------------------------- */

export default function AddressesPage() {
  const router =
    useRouter();

  const [
    addresses,
    setAddresses,
  ] = useState<Address[]>([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    pageError,
    setPageError,
  ] = useState("");

  /* ------------------------------------------------------------------------ */
  /* Form                                                                     */
  /* ------------------------------------------------------------------------ */

  const [
    showForm,
    setShowForm,
  ] = useState(false);

  const [
    editing,
    setEditing,
  ] = useState<Address | null>(
    null
  );

  const [
    fullName,
    setFullName,
  ] = useState("");

  const [
    phone,
    setPhone,
  ] = useState("");

  const [
    addressLine1,
    setAddressLine1,
  ] = useState("");

  const [
    addressLine2,
    setAddressLine2,
  ] = useState("");

  const [
    landmark,
    setLandmark,
  ] = useState("");

  const [
    city,
    setCity,
  ] = useState("");

  const [
    state,
    setState,
  ] = useState("");

  const [
    postalCode,
    setPostalCode,
  ] = useState("");

  const [
    country,
    setCountry,
  ] = useState("India");

  const [
    type,
    setType,
  ] = useState<
    "shipping" |
    "billing" |
    "both"
  >("shipping");

  const [
    isDefault,
    setIsDefault,
  ] = useState(false);

  const [
    saving,
    setSaving,
  ] = useState(false);

  const [
    formError,
    setFormError,
  ] = useState("");

  /* ------------------------------------------------------------------------ */
  /* Load Addresses                                                           */
  /* ------------------------------------------------------------------------ */

  const loadAddresses =
    useCallback(async () => {
      try {
        setLoading(true);
        setPageError("");

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

        const response =
          await customerApiFetch(
            "/customer/addresses"
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
          setPageError(
            data.message ||
              "Unable to load addresses."
          );

          return;
        }

        setAddresses(
          data.data || []
        );
      } catch {
        setPageError(
          "Unable to connect to server."
        );
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

    /*
    | First address will automatically
    | become default on backend.
    */

    if (addresses.length === 0) {
      setIsDefault(true);
    }

    setShowForm(true);
  }

  /* ------------------------------------------------------------------------ */
  /* Edit                                                                     */
  /* ------------------------------------------------------------------------ */

  function openEdit(
    address: Address
  ) {
    setEditing(address);

    setFullName(
      address.full_name
    );

    setPhone(
      address.phone
    );

    setAddressLine1(
      address.address_line_1
    );

    setAddressLine2(
      address.address_line_2 || ""
    );

    setLandmark(
      address.landmark || ""
    );

    setCity(
      address.city
    );

    setState(
      address.state
    );

    setPostalCode(
      address.postal_code
    );

    setCountry(
      address.country || "India"
    );

    setType(
      address.type
    );

    setIsDefault(
      address.is_default
    );

    setFormError("");

    setShowForm(true);
  }

  /* ------------------------------------------------------------------------ */
  /* Close                                                                    */
  /* ------------------------------------------------------------------------ */

  function closeForm() {
    setShowForm(false);
    resetForm();
  }

  /* ------------------------------------------------------------------------ */
  /* Save                                                                     */
  /* ------------------------------------------------------------------------ */

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setSaving(true);
    setFormError("");

    try {
      const endpoint =
        editing
          ? `/customer/addresses/${editing.id}`
          : "/customer/addresses";

      const response =
        await customerApiFetch(
          endpoint,
          {
            method:
              editing
                ? "PUT"
                : "POST",

            body: JSON.stringify({
              full_name:
                fullName,

              phone,

              address_line_1:
                addressLine1,

              address_line_2:
                addressLine2.trim()
                  ? addressLine2
                  : null,

              landmark:
                landmark.trim()
                  ? landmark
                  : null,

              city,

              state,

              postal_code:
                postalCode,

              country,

              type,

              is_default:
                isDefault,
            }),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        const validationErrors =
          data.errors as
            | Record<
                string,
                string[]
              >
            | undefined;

        const firstError =
          validationErrors
            ? Object.values(
                validationErrors
              )[0]?.[0]
            : undefined;

        setFormError(
          firstError ||
            data.message ||
            "Unable to save address."
        );

        return;
      }

      closeForm();

      await loadAddresses();
    } catch {
      setFormError(
        "Unable to connect to server."
      );
    } finally {
      setSaving(false);
    }
  }

  /* ------------------------------------------------------------------------ */
  /* Set Default                                                              */
  /* ------------------------------------------------------------------------ */

  async function setDefaultAddress(
    id: number
  ) {
    try {
      const response =
        await customerApiFetch(
          `/customer/addresses/${id}/default`,
          {
            method: "PUT",
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        window.alert(
          data.message ||
            "Unable to set default address."
        );

        return;
      }

      await loadAddresses();
    } catch {
      window.alert(
        "Unable to connect to server."
      );
    }
  }

  /* ------------------------------------------------------------------------ */
  /* Delete                                                                   */
  /* ------------------------------------------------------------------------ */

  async function deleteAddress(
    id: number
  ) {
    const confirmed =
      window.confirm(
        "Are you sure you want to delete this address?"
      );

    if (!confirmed) {
      return;
    }

    try {
      const response =
        await customerApiFetch(
          `/customer/addresses/${id}`,
          {
            method: "DELETE",
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        window.alert(
          data.message ||
            "Unable to delete address."
        );

        return;
      }

      await loadAddresses();
    } catch {
      window.alert(
        "Unable to connect to server."
      );
    }
  }

  /* ------------------------------------------------------------------------ */
  /* Loading                                                                  */
  /* ------------------------------------------------------------------------ */

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <p className="text-sm text-gray-500">
          Loading addresses...
        </p>
      </div>
    );
  }

  /* ------------------------------------------------------------------------ */
  /* UI                                                                       */
  /* ------------------------------------------------------------------------ */

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-10">

      <div className="mx-auto max-w-5xl">

        {/* Header */}

        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">

          <div className="flex items-center gap-4">

            <Link
              href="/account"
              className="rounded-lg border border-gray-200 bg-white p-2 text-gray-700 transition hover:bg-gray-100"
            >
              <ArrowLeft size={19} />
            </Link>

            <div>

              <h1 className="text-2xl font-semibold text-gray-900">
                My Addresses
              </h1>

              <p className="mt-1 text-sm text-gray-500">
                Manage shipping and
                billing addresses.
              </p>

            </div>

          </div>

          <button
            type="button"
            onClick={openAdd}
            className="flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-black"
          >
            <Plus size={18} />

            Add Address
          </button>

        </div>

        {pageError && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {pageError}
          </div>
        )}

        {/* Empty */}

        {addresses.length === 0 ? (

          <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center">

            <MapPin
              size={40}
              className="mx-auto text-gray-300"
            />

            <h2 className="mt-4 text-lg font-semibold text-gray-900">
              No addresses yet
            </h2>

            <p className="mt-2 text-sm text-gray-500">
              Add an address for
              shipping and checkout.
            </p>

            <button
              type="button"
              onClick={openAdd}
              className="mt-6 rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-medium text-white"
            >
              Add Address
            </button>

          </div>

        ) : (

          /* Address Cards */

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

            {addresses.map(
              (address) => (

                <div
                  key={address.id}
                  className={`relative rounded-xl border bg-white p-6 ${
                    address.is_default
                      ? "border-gray-900"
                      : "border-gray-200"
                  }`}
                >

                  {/* Header */}

                  <div className="flex items-start justify-between gap-4">

                    <div>

                      <div className="flex flex-wrap items-center gap-2">

                        <h2 className="font-semibold text-gray-900">
                          {
                            address.full_name
                          }
                        </h2>

                        <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium capitalize text-gray-600">
                          {
                            address.type
                          }
                        </span>

                        {address.is_default && (
                          <span className="flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700">
                            <Check
                              size={12}
                            />

                            Default
                          </span>
                        )}

                      </div>

                      <p className="mt-2 text-sm text-gray-600">
                        {
                          address.phone
                        }
                      </p>

                    </div>

                    <MapPin
                      size={21}
                      className="text-gray-400"
                    />

                  </div>

                  {/* Address */}

                  <div className="mt-5 text-sm leading-6 text-gray-600">

                    <p>
                      {
                        address.address_line_1
                      }
                    </p>

                    {address.address_line_2 && (
                      <p>
                        {
                          address.address_line_2
                        }
                      </p>
                    )}

                    {address.landmark && (
                      <p>
                        Landmark:{" "}
                        {
                          address.landmark
                        }
                      </p>
                    )}

                    <p>
                      {address.city},{" "}
                      {address.state}{" "}
                      -{" "}
                      {
                        address.postal_code
                      }
                    </p>

                    <p>
                      {
                        address.country
                      }
                    </p>

                  </div>

                  {/* Actions */}

                  <div className="mt-6 flex flex-wrap gap-2 border-t border-gray-100 pt-4">

                    <button
                      type="button"
                      onClick={() =>
                        openEdit(address)
                      }
                      className="flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-2 text-xs font-medium text-gray-700 transition hover:bg-gray-50"
                    >
                      <Edit3
                        size={14}
                      />

                      Edit
                    </button>

                    {!address.is_default && (

                      <button
                        type="button"
                        onClick={() =>
                          setDefaultAddress(
                            address.id
                          )
                        }
                        className="flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-2 text-xs font-medium text-gray-700 transition hover:bg-gray-50"
                      >
                        <Star
                          size={14}
                        />

                        Set Default
                      </button>

                    )}

                    <button
                      type="button"
                      onClick={() =>
                        deleteAddress(
                          address.id
                        )
                      }
                      className="flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-2 text-xs font-medium text-red-600 transition hover:bg-red-50"
                    >
                      <Trash2
                        size={14}
                      />

                      Delete
                    </button>

                  </div>

                </div>

              )
            )}

          </div>

        )}

      </div>

      {/* Address Drawer */}

      {showForm && (

        <div className="fixed inset-0 z-50 flex justify-end bg-black/30">

          <div className="h-full w-full max-w-lg overflow-y-auto bg-white shadow-2xl">

            {/* Drawer Header */}

            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white px-6 py-5">

              <div>

                <h2 className="text-lg font-semibold text-gray-900">

                  {editing
                    ? "Edit Address"
                    : "Add Address"}

                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Enter complete address
                  information.
                </p>

              </div>

              <button
                type="button"
                onClick={closeForm}
                className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100"
              >
                <X size={20} />
              </button>

            </div>

            {/* Form */}

            <form
              onSubmit={handleSubmit}
              className="space-y-5 p-6"
            >

              {formError && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {formError}
                </div>
              )}

              {/* Full Name */}

              <div>

                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Full Name *
                </label>

                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(event) =>
                    setFullName(
                      event.target.value
                    )
                  }
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-gray-700"
                />

              </div>

              {/* Phone */}

              <div>

                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Phone Number *
                </label>

                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(event) =>
                    setPhone(
                      event.target.value
                    )
                  }
                  placeholder="9876543210"
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-gray-700"
                />

              </div>

              {/* Line 1 */}

              <div>

                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Address Line 1 *
                </label>

                <input
                  type="text"
                  required
                  value={addressLine1}
                  onChange={(event) =>
                    setAddressLine1(
                      event.target.value
                    )
                  }
                  placeholder="House / Flat / Building"
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-gray-700"
                />

              </div>

              {/* Line 2 */}

              <div>

                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Address Line 2
                </label>

                <input
                  type="text"
                  value={addressLine2}
                  onChange={(event) =>
                    setAddressLine2(
                      event.target.value
                    )
                  }
                  placeholder="Street / Area"
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-gray-700"
                />

              </div>

              {/* Landmark */}

              <div>

                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Landmark
                </label>

                <input
                  type="text"
                  value={landmark}
                  onChange={(event) =>
                    setLandmark(
                      event.target.value
                    )
                  }
                  placeholder="Near..."
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none"
                />

              </div>

              {/* City State */}

              <div className="grid grid-cols-2 gap-4">

                <div>

                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    City *
                  </label>

                  <input
                    type="text"
                    required
                    value={city}
                    onChange={(event) =>
                      setCity(
                        event.target.value
                      )
                    }
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none"
                  />

                </div>

                <div>

                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    State *
                  </label>

                  <input
                    type="text"
                    required
                    value={state}
                    onChange={(event) =>
                      setState(
                        event.target.value
                      )
                    }
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none"
                  />

                </div>

              </div>

              {/* PIN / Country */}

              <div className="grid grid-cols-2 gap-4">

                <div>

                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    PIN Code *
                  </label>

                  <input
                    type="text"
                    required
                    value={postalCode}
                    onChange={(event) =>
                      setPostalCode(
                        event.target.value
                      )
                    }
                    placeholder="400001"
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none"
                  />

                </div>

                <div>

                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Country *
                  </label>

                  <input
                    type="text"
                    required
                    value={country}
                    onChange={(event) =>
                      setCountry(
                        event.target.value
                      )
                    }
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none"
                  />

                </div>

              </div>

              {/* Type */}

              <div>

                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Address Type *
                </label>

                <select
                  value={type}
                  onChange={(event) =>
                    setType(
                      event.target.value as
                        | "shipping"
                        | "billing"
                        | "both"
                    )
                  }
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm"
                >

                  <option value="shipping">
                    Shipping
                  </option>

                  <option value="billing">
                    Billing
                  </option>

                  <option value="both">
                    Shipping & Billing
                  </option>

                </select>

              </div>

              {/* Default */}

              <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-gray-200 p-4">

                <input
                  type="checkbox"
                  checked={isDefault}
                  onChange={(event) =>
                    setIsDefault(
                      event.target.checked
                    )
                  }
                  disabled={
                    editing?.is_default
                  }
                  className="h-4 w-4"
                />

                <div>

                  <p className="text-sm font-medium text-gray-900">
                    Set as default address
                  </p>

                  <p className="mt-1 text-xs text-gray-500">
                    Use this address
                    automatically during
                    checkout.
                  </p>

                </div>

              </label>

              {/* Actions */}

              <div className="flex justify-end gap-3 border-t border-gray-200 pt-5">

                <button
                  type="button"
                  onClick={closeForm}
                  className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-medium text-white disabled:opacity-50"
                >
                  {saving
                    ? "Saving..."
                    : editing
                    ? "Update Address"
                    : "Save Address"}
                </button>

              </div>

            </form>

          </div>

        </div>

      )}

    </main>
  );
}