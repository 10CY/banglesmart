"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import Link from "next/link";

import {
  ArrowLeft,
  Check,
  MapPin,
  Package,
  Tag,
  Truck,
} from "lucide-react";

import {
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

type ProductImage = {
  id: number;
  image: string;
};

type Product = {
  id: number;
  name: string;
  slug: string;

  primary_image:
    | ProductImage
    | null;
};

type Size = {
  id: number;
  name: string;

  display_name:
    | string
    | null;
};

type Color = {
  id: number;
  name: string;

  display_name:
    | string
    | null;
};

type Variant = {
  id: number;
  sku: string;

  mrp: string;
  selling_price: string;

  product:
    | Product
    | null;

  size:
    | Size
    | null;

  color:
    | Color
    | null;
};

type CartItem = {
  id: number;

  quantity: number;

  line_total:
    | string
    | number;

  variant:
    | Variant
    | null;
};

type CartData = {
  id: number;

  items: CartItem[];

  item_count: number;

  subtotal:
    | string
    | number;
};

type Address = {
  id: number;

  full_name: string;
  phone: string;

  address_line_1: string;

  address_line_2:
    | string
    | null;

  landmark:
    | string
    | null;

  city: string;
  state: string;
  postal_code: string;
  country: string;

  type: string;

  is_default: boolean;
};

type AppliedCoupon = {
  id: number;

  code: string;

  type: string;

  value: string;

  minimum_order_amount?:
    | string
    | null;

  maximum_discount_amount?:
    | string
    | null;
};

type ShippingQuote = {
  subtotal: string;

  shipping_amount: string;

  flat_shipping_amount: string;

  free_shipping_minimum:
    | string
    | null;

  shipping_enabled: boolean;

  free_shipping: boolean;
};

/* -------------------------------------------------------------------------- */
/* Page                                                                       */
/* -------------------------------------------------------------------------- */

export default function CheckoutPage() {
  const router =
    useRouter();

  /* ------------------------------------------------------------------------ */
  /* Cart                                                                     */
  /* ------------------------------------------------------------------------ */

  const [
    cart,
    setCart,
  ] = useState<CartData | null>(
    null
  );

  /* ------------------------------------------------------------------------ */
  /* Addresses                                                                */
  /* ------------------------------------------------------------------------ */

  const [
    addresses,
    setAddresses,
  ] = useState<Address[]>([]);

  const [
    shippingAddressId,
    setShippingAddressId,
  ] = useState<number | null>(
    null
  );

  const [
    sameBilling,
    setSameBilling,
  ] = useState(true);

  const [
    billingAddressId,
    setBillingAddressId,
  ] = useState<number | null>(
    null
  );

  /* ------------------------------------------------------------------------ */
  /* Shipping                                                                 */
  /* ------------------------------------------------------------------------ */

  const [
    shippingQuote,
    setShippingQuote,
  ] = useState<ShippingQuote | null>(
    null
  );

  /* ------------------------------------------------------------------------ */
  /* Coupon                                                                   */
  /* ------------------------------------------------------------------------ */

  const [
    couponInput,
    setCouponInput,
  ] = useState("");

  const [
    appliedCoupon,
    setAppliedCoupon,
  ] = useState<AppliedCoupon | null>(
    null
  );

  const [
    discountAmount,
    setDiscountAmount,
  ] = useState(0);

  const [
    couponLoading,
    setCouponLoading,
  ] = useState(false);

  const [
    couponMessage,
    setCouponMessage,
  ] = useState("");

  const [
    couponError,
    setCouponError,
  ] = useState("");

  /* ------------------------------------------------------------------------ */
  /* Note                                                                     */
  /* ------------------------------------------------------------------------ */

  const [
    customerNote,
    setCustomerNote,
  ] = useState("");

  /* ------------------------------------------------------------------------ */
  /* General                                                                  */
  /* ------------------------------------------------------------------------ */

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    placingOrder,
    setPlacingOrder,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  /* ------------------------------------------------------------------------ */
  /* Load Checkout                                                            */
  /* ------------------------------------------------------------------------ */

  const loadCheckout =
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

        const [
          cartResponse,
          addressResponse,
        ] = await Promise.all([
          customerApiFetch(
            "/customer/cart"
          ),

          customerApiFetch(
            "/customer/addresses"
          ),
        ]);

        const cartJson =
          await cartResponse.json();

        const addressJson =
          await addressResponse.json();

        /* ------------------------------------------------------------------ */
        /* Auth                                                               */
        /* ------------------------------------------------------------------ */

        if (
          cartResponse.status === 401 ||
          addressResponse.status === 401
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

        /* ------------------------------------------------------------------ */
        /* Cart                                                               */
        /* ------------------------------------------------------------------ */

        if (!cartResponse.ok) {
          setError(
            cartJson.message ||
              "Unable to load cart."
          );

          return;
        }

        setCart(
          cartJson.data
        );

        /* ------------------------------------------------------------------ */
        /* Addresses                                                          */
        /* ------------------------------------------------------------------ */

        if (!addressResponse.ok) {
          setError(
            addressJson.message ||
              "Unable to load addresses."
          );

          return;
        }

        const addressList: Address[] =
          Array.isArray(addressJson.data)
            ? addressJson.data
            : addressJson.data?.data || [];

        setAddresses(
          addressList
        );

        /* ------------------------------------------------------------------ */
        /* Shipping Quote                                                     */
        /* ------------------------------------------------------------------ */

        const cartSubtotal = Number(
          cartJson.data?.subtotal || 0
        );

        const shippingResponse =
          await customerApiFetch(
            `/customer/shipping/quote?amount=${encodeURIComponent(
              String(cartSubtotal)
            )}`
          );

        const shippingJson =
          await shippingResponse.json();

        if (
          shippingResponse.status === 401 ||
          shippingResponse.status === 403
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

        if (!shippingResponse.ok) {
          setError(
            shippingJson.message ||
              "Unable to calculate shipping."
          );

          return;
        }

        setShippingQuote(
          shippingJson.data
        );

        /* ------------------------------------------------------------------ */
        /* Default Shipping Address                                           */
        /* ------------------------------------------------------------------ */

        const shipping =
          addressList.find(
            (address) =>
              address.is_default &&
              (
                address.type === "shipping" ||
                address.type === "both"
              )
          ) ||
          addressList.find(
            (address) =>
              address.type === "shipping" ||
              address.type === "both"
          );

        if (shipping) {
          setShippingAddressId(
            shipping.id
          );
        }

        /* ------------------------------------------------------------------ */
        /* Default Billing Address                                            */
        /* ------------------------------------------------------------------ */

        const billing =
          addressList.find(
            (address) =>
              address.is_default &&
              (
                address.type === "billing" ||
                address.type === "both"
              )
          ) ||
          addressList.find(
            (address) =>
              address.type === "billing" ||
              address.type === "both"
          );

        if (billing) {
          setBillingAddressId(
            billing.id
          );
        }
      } catch {
        setError(
          "Unable to connect to server."
        );
      } finally {
        setLoading(false);
      }
    }, [router]);

  useEffect(() => {
    loadCheckout();
  }, [loadCheckout]);

  /* ------------------------------------------------------------------------ */
  /* Address Lists                                                            */
  /* ------------------------------------------------------------------------ */

  const shippingAddresses =
    useMemo(
      () =>
        addresses.filter(
          (address) =>
            address.type ===
              "shipping" ||
            address.type ===
              "both"
        ),
      [addresses]
    );

  const billingAddresses =
    useMemo(
      () =>
        addresses.filter(
          (address) =>
            address.type ===
              "billing" ||
            address.type ===
              "both"
        ),
      [addresses]
    );

  /* ------------------------------------------------------------------------ */
  /* Totals                                                                   */
  /* ------------------------------------------------------------------------ */

  const subtotal =
    Number(
      cart?.subtotal || 0
    );

  const shippingAmount =
    Number(
      shippingQuote
        ?.shipping_amount ||
        0
    );

  const totalAmount =
    Math.max(
      0,

      subtotal +
        shippingAmount -
        discountAmount
    );

  /* ------------------------------------------------------------------------ */
  /* Free Shipping Progress                                                   */
  /* ------------------------------------------------------------------------ */

  const freeShippingMinimum =
    shippingQuote
      ?.free_shipping_minimum
      ? Number(
          shippingQuote
            .free_shipping_minimum
        )
      : null;

  const amountForFreeShipping =
    freeShippingMinimum !==
      null
      ? Math.max(
          0,
          freeShippingMinimum -
            subtotal
        )
      : 0;

  /* ------------------------------------------------------------------------ */
  /* Price                                                                    */
  /* ------------------------------------------------------------------------ */

  function formatPrice(
    value:
      | string
      | number
  ) {
    return new Intl.NumberFormat(
      "en-IN",
      {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
      }
    ).format(
      Number(value)
    );
  }

  /* ------------------------------------------------------------------------ */
  /* Apply Coupon                                                             */
  /* ------------------------------------------------------------------------ */

  async function applyCoupon() {
    const code =
      couponInput
        .trim()
        .toUpperCase();

    if (!code) {
      setCouponError(
        "Enter a coupon code."
      );

      setAppliedCoupon(null);
      setDiscountAmount(0);

      return;
    }

    try {
      setCouponLoading(true);

      setCouponError("");
      setCouponMessage("");

      const response =
        await customerApiFetch(
          "/customer/coupons/validate",
          {
            method: "POST",

            body:
              JSON.stringify({
                code,
                order_amount: subtotal,
              }),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        setAppliedCoupon(null);
        setDiscountAmount(0);

        setCouponError(
          data?.message ||
            data?.errors
              ?.code?.[0] ||
            data?.errors
              ?.coupon_code?.[0] ||
            "Unable to apply coupon."
        );

        return;
      }

      /*
       * The backend response is normally:
       *
       * {
       *   success: true,
       *   message: "...",
       *   data: {
       *     coupon: {...},
       *     discount_amount: 200
       *   }
       * }
       *
       * Keep support for an additionally wrapped response too.
       */

      const coupon =
        data?.data?.coupon ??
        data?.data?.data?.coupon ??
        null;

      const returnedDiscount =
        Number(
          data?.data?.discount_amount ??
            data?.data?.data?.discount_amount ??
            0
        );

      if (!coupon) {
        setAppliedCoupon(null);
        setDiscountAmount(0);

        setCouponError(
          "Invalid coupon response from server."
        );

        return;
      }

      /*
       * Primary value comes from the backend.
       *
       * If the response does not contain the discount amount,
       * calculate it from the already validated coupon details.
       * This prevents a valid fixed coupon such as ₹200 from
       * appearing as -₹0 in the checkout UI.
       */

      let finalDiscount =
        Number.isFinite(
          returnedDiscount
        )
          ? returnedDiscount
          : 0;

      if (
        finalDiscount <= 0 &&
        Number.isFinite(
          Number(coupon.value)
        )
      ) {
        const couponValue =
          Number(coupon.value);

        const couponType =
          String(
            coupon.type || ""
          ).toLowerCase();

        if (
          couponType ===
          "percentage"
        ) {
          finalDiscount =
            (subtotal *
              couponValue) /
            100;
        } else {
          finalDiscount =
            couponValue;
        }

        if (
          coupon.maximum_discount_amount !=
            null &&
          Number.isFinite(
            Number(
              coupon.maximum_discount_amount
            )
          )
        ) {
          finalDiscount =
            Math.min(
              finalDiscount,
              Number(
                coupon.maximum_discount_amount
              )
            );
        }

        finalDiscount =
          Math.max(
            0,
            Math.min(
              finalDiscount,
              subtotal
            )
          );
      }

      finalDiscount =
        Number(
          finalDiscount.toFixed(2)
        );

      setAppliedCoupon(
        coupon
      );

      setDiscountAmount(
        finalDiscount
      );

      setCouponInput(
        String(
          coupon.code ||
            code
        ).toUpperCase()
      );

      setCouponMessage(
        data?.message ||
          "Coupon applied successfully."
      );

    } catch (error) {
      console.error(
        "Apply coupon error:",
        error
      );

      setAppliedCoupon(null);
      setDiscountAmount(0);

      setCouponError(
        error instanceof Error
          ? error.message
          : "Unable to connect to server."
      );
    } finally {
      setCouponLoading(
        false
      );
    }
  }

  /* ------------------------------------------------------------------------ */
  /* Remove Coupon                                                            */
  /* ------------------------------------------------------------------------ */

  function removeCoupon() {
    setAppliedCoupon(
      null
    );

    setDiscountAmount(
      0
    );

    setCouponInput("");

    setCouponMessage("");

    setCouponError("");
  }

  /* ------------------------------------------------------------------------ */
  /* Place Order                                                              */
  /* ------------------------------------------------------------------------ */

  async function placeOrder() {
    if (!cart) {
      return;
    }

    if (
      cart.items.length ===
      0
    ) {
      setError(
        "Your cart is empty."
      );

      return;
    }

    if (
      !shippingAddressId
    ) {
      setError(
        "Please select a shipping address."
      );

      return;
    }

    if (
      !sameBilling &&
      !billingAddressId
    ) {
      setError(
        "Please select a billing address."
      );

      return;
    }

    try {
      setPlacingOrder(
        true
      );

      setError("");
      setCouponError("");

      const response =
        await customerApiFetch(
          "/customer/orders",
          {
            method: "POST",

            body:
              JSON.stringify({
                shipping_address_id:
                  shippingAddressId,

                billing_address_id:
                  sameBilling
                    ? null
                    : billingAddressId,

                payment_method:
                  "cod",

                customer_note:
                  customerNote.trim()
                    ? customerNote.trim()
                    : null,

                coupon_code:
                  appliedCoupon
                    ?.code ||
                  null,
              }),
          }
        );

      const data =
        await response.json();

      /* -------------------------------------------------------------------- */
      /* Coupon Error                                                         */
      /* -------------------------------------------------------------------- */

      if (
        data.errors
          ?.coupon_code?.[0]
      ) {
        setCouponError(
          data.errors
            .coupon_code[0]
        );

        setAppliedCoupon(
          null
        );

        setDiscountAmount(
          0
        );

        return;
      }

      /* -------------------------------------------------------------------- */
      /* Cart Error                                                           */
      /* -------------------------------------------------------------------- */

      if (
        data.errors
          ?.cart?.[0]
      ) {
        setError(
          data.errors
            .cart[0]
        );

        return;
      }

      if (!response.ok) {
        setError(
          data.message ||
            "Unable to place order."
        );

        return;
      }

      const order =
        data.data;

      router.push(
        `/order-success?order=${encodeURIComponent(
          order.order_number
        )}&id=${order.id}`
      );
    } catch {
      setError(
        "Unable to connect to server."
      );
    } finally {
      setPlacingOrder(
        false
      );
    }
  }

  /* ------------------------------------------------------------------------ */
  /* Loading                                                                  */
  /* ------------------------------------------------------------------------ */

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50">

        <p className="text-sm text-gray-500">
          Loading checkout...
        </p>

      </main>
    );
  }

  /* ------------------------------------------------------------------------ */
  /* Empty Cart                                                               */
  /* ------------------------------------------------------------------------ */

  if (
    !cart ||
    cart.items.length ===
      0
  ) {
    return (
      <main className="min-h-screen bg-gray-50 px-4 py-12">

        <div className="mx-auto max-w-xl rounded-xl border border-gray-200 bg-white p-8 text-center">

          <Package
            size={44}
            className="mx-auto text-gray-300"
          />

          <h1 className="mt-5 text-2xl font-semibold text-gray-900">
            Your cart is empty
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            Add products before going to checkout.
          </p>

          <Link
            href="/shop"
            className="mt-6 inline-flex rounded-lg bg-gray-900 px-6 py-3 text-sm font-medium text-white"
          >
            Continue Shopping
          </Link>

        </div>

      </main>
    );
  }

  /* ------------------------------------------------------------------------ */
  /* UI                                                                       */
  /* ------------------------------------------------------------------------ */

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8">

      <div className="mx-auto max-w-7xl">

        {/* Header */}

        <div className="mb-7">

          <Link
            href="/cart"
            className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 transition hover:text-gray-900"
          >
            <ArrowLeft
              size={17}
            />

            Back to Cart
          </Link>

          <h1 className="mt-4 text-3xl font-semibold text-gray-900">
            Checkout
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Review your delivery and payment details.
          </p>

        </div>

        {error && (

          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>

        )}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_420px]">

          {/* ================================================================ */}
          {/* Left                                                             */}
          {/* ================================================================ */}

          <div className="space-y-6">

            {/* Shipping Address */}

            <section className="rounded-xl border border-gray-200 bg-white p-6">

              <div className="flex items-center gap-3">

                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 text-gray-600">

                  <MapPin
                    size={20}
                  />

                </div>

                <div>

                  <h2 className="font-semibold text-gray-900">
                    Shipping Address
                  </h2>

                  <p className="mt-1 text-sm text-gray-500">
                    Choose where your order should be delivered.
                  </p>

                </div>

              </div>

              {shippingAddresses.length ===
              0 ? (

                <div className="mt-5 rounded-lg border border-orange-200 bg-orange-50 p-4">

                  <p className="text-sm text-orange-700">
                    You do not have a shipping address yet.
                  </p>

                  <Link
                    href="/account/addresses"
                    className="mt-3 inline-flex text-sm font-semibold text-orange-800 underline"
                  >
                    Add Address
                  </Link>

                </div>

              ) : (

                <div className="mt-5 grid gap-3">

                  {shippingAddresses.map(
                    (address) => {

                      const selected =
                        shippingAddressId ===
                        address.id;

                      return (

                        <button
                          key={
                            address.id
                          }
                          type="button"
                          onClick={() =>
                            setShippingAddressId(
                              address.id
                            )
                          }
                          className={`relative w-full rounded-xl border p-4 text-left transition ${
                            selected
                              ? "border-gray-900 bg-gray-50"
                              : "border-gray-200 bg-white hover:border-gray-400"
                          }`}
                        >

                          {selected && (

                            <div className="absolute right-4 top-4 flex h-6 w-6 items-center justify-center rounded-full bg-gray-900 text-white">

                              <Check
                                size={14}
                              />

                            </div>

                          )}

                          <p className="pr-10 font-semibold text-gray-900">
                            {
                              address.full_name
                            }
                          </p>

                          <p className="mt-1 text-sm text-gray-600">
                            {
                              address.phone
                            }
                          </p>

                          <p className="mt-3 text-sm leading-6 text-gray-500">

                            {
                              address.address_line_1
                            }

                            {address.address_line_2
                              ? `, ${address.address_line_2}`
                              : ""}

                            {address.landmark
                              ? `, ${address.landmark}`
                              : ""}

                            <br />

                            {address.city},{" "}
                            {address.state} -{" "}
                            {address.postal_code}

                            <br />

                            {
                              address.country
                            }

                          </p>

                        </button>

                      );
                    }
                  )}

                </div>

              )}

            </section>

            {/* Billing */}

            <section className="rounded-xl border border-gray-200 bg-white p-6">

              <h2 className="font-semibold text-gray-900">
                Billing Address
              </h2>

              <label className="mt-4 flex cursor-pointer items-center gap-3">

                <input
                  type="checkbox"
                  checked={
                    sameBilling
                  }
                  onChange={(
                    event
                  ) =>
                    setSameBilling(
                      event.target
                        .checked
                    )
                  }
                  className="h-4 w-4 rounded"
                />

                <span className="text-sm text-gray-700">
                  Same as shipping address
                </span>

              </label>

              {!sameBilling && (

                <div className="mt-5 grid gap-3">

                  {billingAddresses.map(
                    (address) => {

                      const selected =
                        billingAddressId ===
                        address.id;

                      return (

                        <button
                          key={
                            address.id
                          }
                          type="button"
                          onClick={() =>
                            setBillingAddressId(
                              address.id
                            )
                          }
                          className={`relative w-full rounded-xl border p-4 text-left ${
                            selected
                              ? "border-gray-900 bg-gray-50"
                              : "border-gray-200"
                          }`}
                        >

                          {selected && (

                            <div className="absolute right-4 top-4 flex h-6 w-6 items-center justify-center rounded-full bg-gray-900 text-white">

                              <Check
                                size={14}
                              />

                            </div>

                          )}

                          <p className="font-semibold text-gray-900">
                            {
                              address.full_name
                            }
                          </p>

                          <p className="mt-2 text-sm text-gray-500">

                            {
                              address.address_line_1
                            }
                            ,{" "}
                            {
                              address.city
                            }
                            ,{" "}
                            {
                              address.state
                            }{" "}
                            -{" "}
                            {
                              address.postal_code
                            }

                          </p>

                        </button>

                      );
                    }
                  )}

                </div>

              )}

            </section>

            {/* Payment */}

            <section className="rounded-xl border border-gray-200 bg-white p-6">

              <h2 className="font-semibold text-gray-900">
                Payment Method
              </h2>

              <div className="mt-4 rounded-xl border border-gray-900 bg-gray-50 p-4">

                <div className="flex items-center gap-3">

                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white">

                    <Truck
                      size={20}
                    />

                  </div>

                  <div>

                    <p className="font-medium text-gray-900">
                      Cash on Delivery
                    </p>

                    <p className="mt-1 text-xs text-gray-500">
                      Pay when your order is delivered.
                    </p>

                  </div>

                </div>

              </div>

            </section>

            {/* Note */}

            <section className="rounded-xl border border-gray-200 bg-white p-6">

              <h2 className="font-semibold text-gray-900">
                Order Note
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Optional instructions for your order.
              </p>

              <textarea
                value={
                  customerNote
                }
                onChange={(
                  event
                ) =>
                  setCustomerNote(
                    event.target.value
                  )
                }
                rows={4}
                maxLength={1000}
                placeholder="Add an optional note..."
                className="mt-4 w-full resize-none rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:border-gray-600"
              />

            </section>

          </div>

          {/* ================================================================ */}
          {/* Right                                                            */}
          {/* ================================================================ */}

          <aside>

            <div className="sticky top-6 rounded-xl border border-gray-200 bg-white p-6">

              <h2 className="text-lg font-semibold text-gray-900">
                Order Summary
              </h2>

              {/* Products */}

              <div className="mt-5 space-y-4 border-b border-gray-200 pb-5">

                {cart.items.map(
                  (item) => {

                    const product =
                      item.variant
                        ?.product;

                    const image =
                      product
                        ?.primary_image
                        ?.image;

                    return (

                      <div
                        key={
                          item.id
                        }
                        className="flex gap-3"
                      >

                        <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-gray-200 bg-gray-50">

                          {image ? (

                            <img
                              src={`${BACKEND_URL}/storage/${image}`}
                              alt={
                                product?.name ||
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

                          <p className="line-clamp-2 text-sm font-medium text-gray-900">
                            {
                              product?.name ||
                              "Product"
                            }
                          </p>

                          <p className="mt-1 text-xs text-gray-500">

                            {item.variant?.size
                              ? (
                                  item.variant
                                    .size
                                    .display_name ||
                                  item.variant
                                    .size
                                    .name
                                )
                              : "-"}

                            {" / "}

                            {item.variant?.color
                              ? (
                                  item.variant
                                    .color
                                    .display_name ||
                                  item.variant
                                    .color
                                    .name
                                )
                              : "-"}

                          </p>

                          <div className="mt-2 flex items-center justify-between">

                            <span className="text-xs text-gray-500">
                              Qty{" "}
                              {
                                item.quantity
                              }
                            </span>

                            <span className="text-sm font-semibold text-gray-900">
                              {formatPrice(
                                item.line_total
                              )}
                            </span>

                          </div>

                        </div>

                      </div>

                    );
                  }
                )}

              </div>

              {/* Coupon */}

              <div className="border-b border-gray-200 py-5">

                <div className="flex items-center gap-2">

                  <Tag
                    size={17}
                    className="text-gray-500"
                  />

                  <h3 className="text-sm font-semibold text-gray-900">
                    Have a coupon?
                  </h3>

                </div>

                {!appliedCoupon ? (

                  <div className="mt-3">

                    <div className="flex gap-2">

                      <input
                        type="text"
                        value={
                          couponInput
                        }
                        onChange={(
                          event
                        ) => {
                          setCouponInput(
                            event.target.value
                              .toUpperCase()
                          );

                          setCouponError(
                            ""
                          );
                        }}
                        placeholder="Enter coupon code"
                        className="min-w-0 flex-1 rounded-lg border border-gray-300 px-3 py-2.5 text-sm font-medium uppercase outline-none focus:border-gray-600"
                      />

                      <button
                        type="button"
                        disabled={
                          couponLoading
                        }
                        onClick={
                          applyCoupon
                        }
                        className="rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50"
                      >
                        {couponLoading
                          ? "Applying..."
                          : "Apply"}
                      </button>

                    </div>

                    {couponError && (

                      <p className="mt-2 text-xs font-medium text-red-600">
                        {
                          couponError
                        }
                      </p>

                    )}

                  </div>

                ) : (

                  <div className="mt-3 rounded-lg border border-green-200 bg-green-50 p-3">

                    <div className="flex items-center justify-between gap-3">

                      <div>

                        <p className="font-mono text-sm font-semibold text-green-800">
                          {
                            appliedCoupon.code
                          }
                        </p>

                        <p className="mt-1 text-xs text-green-700">
                          {
                            couponMessage
                          }
                        </p>

                      </div>

                      <button
                        type="button"
                        onClick={
                          removeCoupon
                        }
                        className="text-xs font-semibold text-red-600"
                      >
                        Remove
                      </button>

                    </div>

                  </div>

                )}

              </div>

              {/* Shipping Message */}

              {shippingQuote
                ?.shipping_enabled &&
                freeShippingMinimum !==
                  null && (

                <div className="border-b border-gray-200 py-4">

                  {shippingQuote.free_shipping ? (

                    <div className="flex items-center gap-2 text-sm font-medium text-green-700">

                      <Check
                        size={17}
                      />

                      You qualify for free shipping.

                    </div>

                  ) : (

                    <p className="text-sm text-gray-600">

                      Add{" "}

                      <span className="font-semibold text-gray-900">
                        {formatPrice(
                          amountForFreeShipping
                        )}
                      </span>

                      {" "}more for free shipping.

                    </p>

                  )}

                </div>

              )}

              {/* Totals */}

              <div className="space-y-3 py-5">

                <div className="flex justify-between text-sm">

                  <span className="text-gray-500">
                    Subtotal
                  </span>

                  <span className="font-medium">
                    {formatPrice(
                      subtotal
                    )}
                  </span>

                </div>

                <div className="flex justify-between text-sm">

                  <span className="text-gray-500">
                    Shipping
                  </span>

                  {shippingAmount ===
                    0 ? (

                      <span className="font-medium text-green-700">
                        Free
                      </span>

                    ) : (

                      <span className="font-medium text-gray-900">
                        {formatPrice(
                          shippingAmount
                        )}
                      </span>

                    )}

                  </div>

                  {appliedCoupon && (
    <div className="flex justify-between text-sm">
      <span className="text-green-700">
        Coupon ({appliedCoupon.code})
      </span>

      <span className="font-semibold text-green-700">
        -
        {formatPrice(discountAmount)}
      </span>
    </div>
  )}

                <div className="border-t border-gray-200 pt-4">

                  <div className="flex items-center justify-between">

                    <span className="font-semibold text-gray-900">
                      Total
                    </span>

                    <span className="text-2xl font-semibold text-gray-900">
                      {formatPrice(
                        totalAmount
                      )}
                    </span>

                  </div>

                </div>

              </div>

              {/* Order Button */}

              <button
                type="button"
                disabled={
                  placingOrder ||
                  !shippingAddressId
                }
                onClick={
                  placeOrder
                }
                className="w-full rounded-lg bg-gray-900 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-40"
              >

                {placingOrder
                  ? "Placing Order..."
                  : `Place COD Order • ${formatPrice(
                      totalAmount
                    )}`}

              </button>

              <p className="mt-3 text-center text-xs leading-5 text-gray-400">
                Final shipping, coupon and order totals are recalculated securely by the server.
              </p>

            </div>

          </aside>

        </div>

      </div>

    </main>
  );
}