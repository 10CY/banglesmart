"use client";
import { Suspense } from "react";
import {
  useEffect,
  useState,
} from "react";

import Link from "next/link";

import {
  CheckCircle2,
  Download,
  PackageCheck,
} from "lucide-react";

import {
  useRouter,
  useSearchParams,
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
};

/* -------------------------------------------------------------------------- */
/* Inner Component                                                            */
/* -------------------------------------------------------------------------- */

function OrderSuccessContent() {
  const searchParams =
    useSearchParams();

  const router =
    useRouter();

  const id =
    searchParams.get(
      "id"
    );

  const orderNumber =
    searchParams.get(
      "order"
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
  ] = useState(
    Boolean(id)
  );

  /* ------------------------------------------------------------------------ */
  /* Load Order                                                               */
  /* ------------------------------------------------------------------------ */

  useEffect(() => {
    if (!id) {
      return;
    }

    const token =
      localStorage.getItem(
        "customer_token"
      );

    if (!token) {
      return;
    }

    async function loadOrder() {
      try {
        const response =
          await customerApiFetch(
            `/customer/orders/${id}`
          );

        const data =
          await response.json();

        if (response.ok) {
          setOrder(
            data.data
          );
        }
      } catch {
        // Order success page can still render from URL.
      } finally {
        setLoading(false);
      }
    }

    loadOrder();
  }, [id]);

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

  const discount =
    Number(
      order
        ?.discount_amount ||
        0
    );

  async function downloadInvoice() {
    if (!id) return;
    try {
      const response = await customerApiFetch(`/customer/orders/${id}/invoice`);
      if (!response.ok) throw new Error("Unable to download invoice.");
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${order?.order_number || orderNumber || "order"}-invoice.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch {
      // The order page remains available even if the browser download fails.
    }
  }

  /* ------------------------------------------------------------------------ */
  /* UI                                                                       */
  /* ------------------------------------------------------------------------ */

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-12">

      <div className="mx-auto max-w-2xl">

        <div className="rounded-2xl border border-gray-200 bg-white p-7 text-center sm:p-10">

          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-50">

            <CheckCircle2
              size={34}
              className="text-green-600"
            />

          </div>

          <h1 className="mt-5 text-3xl font-semibold text-gray-900">
            Order Placed!
          </h1>

          <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-gray-500">
            Thank you for shopping with BanglesMart. Your order has been received successfully.
          </p>

          {/* Number */}

          <div className="mt-7 rounded-xl bg-gray-50 p-5">

            <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
              Order Number
            </p>

            <p className="mt-2 text-xl font-semibold text-gray-900">
              {order
                ?.order_number ||
                orderNumber ||
                "-"}
            </p>

          </div>

          {/* Breakdown */}

          {loading ? (

            <p className="mt-6 text-sm text-gray-400">
              Loading order summary...
            </p>

          ) : order ? (

            <div className="mt-6 rounded-xl border border-gray-200 p-5 text-left">

              <h2 className="font-semibold text-gray-900">
                Payment Summary
              </h2>

              <div className="mt-4 space-y-3 text-sm">

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

            </div>

          ) : null}

          {/* COD */}

          <div className="mt-6 rounded-xl border border-blue-100 bg-blue-50 p-4 text-left">

            <div className="flex gap-3">

              <PackageCheck
                size={21}
                className="mt-0.5 shrink-0 text-blue-700"
              />

              <div>

                <p className="text-sm font-semibold text-blue-900">
                  Cash on Delivery
                </p>

                <p className="mt-1 text-sm leading-6 text-blue-700">
                  Pay the final order amount when your BanglesMart order is delivered.
                </p>

              </div>

            </div>

          </div>

          {/* Actions */}

          <div className="mt-7 grid grid-cols-1 gap-3 sm:grid-cols-2">

            {id ? (

              <Link
                href={`/account/orders/${id}`}
                className="rounded-lg bg-gray-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-black"
              >
                View Order
              </Link>

            ) : (

              <Link
                href="/account/orders"
                className="rounded-lg bg-gray-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-black"
              >
                My Orders
              </Link>

            )}

            <Link
              href="/shop"
              className="rounded-lg border border-gray-300 bg-white px-5 py-3 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
            >
              Continue Shopping
            </Link>

          </div>

        </div>

      </div>

    </main>
  );
}

/* -------------------------------------------------------------------------- */
/* Page                                                                       */
/* -------------------------------------------------------------------------- */

export default function OrderSuccessPage() {
  return (
    <Suspense fallback={null}>
      <OrderSuccessContent />
    </Suspense>
  );
}