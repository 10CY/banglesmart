"use client";

import {
  useEffect,
  useState,
} from "react";

import Link from "next/link";

import {
  ArrowLeft,
  Save,
  UserRound,
  Mail,
  Phone,
} from "lucide-react";

import {
  useParams,
  useRouter,
} from "next/navigation";

import { apiFetch } from "@/lib/api";


/*
|--------------------------------------------------------------------------
| Types
|--------------------------------------------------------------------------
*/

type Customer = {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  status: string;
  created_at: string;
};


/*
|--------------------------------------------------------------------------
| Page
|--------------------------------------------------------------------------
*/

export default function EditCustomerPage() {
  const params = useParams();

  const router = useRouter();

  const customerId = String(params.id);


  /*
  |--------------------------------------------------------------------------
  | State
  |--------------------------------------------------------------------------
  */

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const [name, setName] =
    useState("");

  const [email, setEmail] =
    useState("");

  const [phone, setPhone] =
    useState("");

  const [status, setStatus] =
    useState("active");


  /*
  |--------------------------------------------------------------------------
  | Load Customer
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    if (!customerId) {
      return;
    }

    void loadCustomer();
  }, [customerId]);


  async function loadCustomer() {
    try {
      setLoading(true);
      setError("");

      const response =
        await apiFetch(
          `/admin/customers/${customerId}`,
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message ||
            "Customer not found.",
        );
      }

      const customer =
        data?.data as Customer;

      if (!customer) {
        throw new Error(
          "Customer data not found.",
        );
      }

      setName(
        customer.name || "",
      );

      setEmail(
        customer.email || "",
      );

      setPhone(
        customer.phone || "",
      );

      setStatus(
        customer.status || "active",
      );
    } catch (error) {
      console.error(
        "Load customer error:",
        error,
      );

      setError(
        error instanceof Error
          ? error.message
          : "Unable to load customer.",
      );
    } finally {
      setLoading(false);
    }
  }


  /*
  |--------------------------------------------------------------------------
  | Save Customer
  |--------------------------------------------------------------------------
  */

  async function saveCustomer() {
    try {
      setSaving(true);
      setError("");
      setSuccess("");


      /*
      |--------------------------------------------------------------------------
      | Validation
      |--------------------------------------------------------------------------
      */

      if (!name.trim()) {
        setError(
          "Full name is required.",
        );

        return;
      }

      if (!email.trim()) {
        setError(
          "Email address is required.",
        );

        return;
      }


      /*
      |--------------------------------------------------------------------------
      | Update customer information
      |--------------------------------------------------------------------------
      */

      const customerResponse =
        await apiFetch(
          `/admin/customers/${customerId}`,
          {
            method: "PUT",

            body: JSON.stringify({
              name: name.trim(),
              email: email.trim(),
              phone:
                phone.trim() || null,
            }),
          },
        );

      const customerData =
        await customerResponse.json();

      if (!customerResponse.ok) {
        throw new Error(
          customerData?.message ||
            "Unable to update customer.",
        );
      }


      /*
      |--------------------------------------------------------------------------
      | Update status separately
      |--------------------------------------------------------------------------
      */

      const statusResponse =
        await apiFetch(
          `/admin/customers/${customerId}/status`,
          {
            method: "PUT",

            body: JSON.stringify({
              status,
            }),
          },
        );

      const statusData =
        await statusResponse.json();

      if (!statusResponse.ok) {
        throw new Error(
          statusData?.message ||
            "Unable to update customer status.",
        );
      }


      /*
      |--------------------------------------------------------------------------
      | Success
      |--------------------------------------------------------------------------
      */

      setSuccess(
        "Customer updated successfully.",
      );


      /*
      |--------------------------------------------------------------------------
      | Go back to customer details
      |--------------------------------------------------------------------------
      */

      setTimeout(() => {
        router.push(
          `/admin/customers/${customerId}`,
        );

        router.refresh();
      }, 500);
    } catch (error) {
      console.error(
        "Save customer error:",
        error,
      );

      setError(
        error instanceof Error
          ? error.message
          : "Unable to update customer.",
      );
    } finally {
      setSaving(false);
    }
  }


  /*
  |--------------------------------------------------------------------------
  | Loading
  |--------------------------------------------------------------------------
  */

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center text-sm text-gray-500">
        Loading customer...
      </div>
    );
  }


  /*
  |--------------------------------------------------------------------------
  | UI
  |--------------------------------------------------------------------------
  */

  return (
    <main className="min-h-screen bg-gray-50 p-6">

      <div className="mx-auto max-w-3xl">

        {/* Back */}

        <Link
          href={`/admin/customers/${customerId}`}
          className="mb-6 inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft size={17} />

          Back to Customer
        </Link>


        {/* Card */}

        <section className="rounded-xl border border-gray-200 bg-white">

          {/* Header */}

          <div className="border-b border-gray-200 px-6 py-5">

            <h1 className="text-xl font-semibold text-gray-900">
              Edit Customer
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              Update customer account information.
            </p>

          </div>


          {/* Form */}

          <div className="p-6">

            {/* Error */}

            {error && (
              <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}


            {/* Success */}

            {success && (
              <div className="mb-5 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                {success}
              </div>
            )}


            <div className="space-y-5">

              {/* Name */}

              <div>

                <label
                  htmlFor="customer-name"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  Full Name
                </label>

                <div className="relative">

                  <UserRound
                    size={18}
                    className="absolute left-3 top-3.5 text-gray-400"
                  />

                  <input
                    id="customer-name"
                    type="text"
                    value={name}
                    onChange={(event) =>
                      setName(
                        event.target.value,
                      )
                    }
                    placeholder="Enter customer name"
                    className="w-full rounded-lg border border-gray-300 py-3 pl-10 pr-4 text-sm text-gray-900 outline-none focus:border-gray-700"
                  />

                </div>

              </div>


              {/* Email */}

              <div>

                <label
                  htmlFor="customer-email"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  Email Address
                </label>

                <div className="relative">

                  <Mail
                    size={18}
                    className="absolute left-3 top-3.5 text-gray-400"
                  />

                  <input
                    id="customer-email"
                    type="email"
                    value={email}
                    onChange={(event) =>
                      setEmail(
                        event.target.value,
                      )
                    }
                    placeholder="Enter email address"
                    className="w-full rounded-lg border border-gray-300 py-3 pl-10 pr-4 text-sm text-gray-900 outline-none focus:border-gray-700"
                  />

                </div>

              </div>


              {/* Phone */}

              <div>

                <label
                  htmlFor="customer-phone"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  Phone Number
                </label>

                <div className="relative">

                  <Phone
                    size={18}
                    className="absolute left-3 top-3.5 text-gray-400"
                  />

                  <input
                    id="customer-phone"
                    type="tel"
                    value={phone}
                    onChange={(event) =>
                      setPhone(
                        event.target.value,
                      )
                    }
                    placeholder="Enter phone number"
                    className="w-full rounded-lg border border-gray-300 py-3 pl-10 pr-4 text-sm text-gray-900 outline-none focus:border-gray-700"
                  />

                </div>

              </div>


              {/* Status */}

              <div>

                <label
                  htmlFor="customer-status"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  Account Status
                </label>

                <select
                  id="customer-status"
                  value={status}
                  onChange={(event) =>
                    setStatus(
                      event.target.value,
                    )
                  }
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-gray-700"
                >

                  <option value="active">
                    Active
                  </option>

                  <option value="inactive">
                    Inactive
                  </option>

                </select>

              </div>


              {/* Buttons */}

              <div className="flex justify-end gap-3 border-t border-gray-200 pt-5">

                <Link
                  href={`/admin/customers/${customerId}`}
                  className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </Link>


                <button
                  type="button"
                  onClick={saveCustomer}
                  disabled={saving}
                  className="flex items-center gap-2 rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-black disabled:cursor-not-allowed disabled:opacity-50"
                >

                  {saving ? (
                    "Saving..."
                  ) : (
                    <>
                      <Save size={17} />
                      Save Changes
                    </>
                  )}

                </button>

              </div>

            </div>

          </div>

        </section>

      </div>

    </main>
  );
}