"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Check,
  LockKeyhole,
  MapPin,
  Package,
  Plus,
  ShieldCheck,
  Tag,
  Truck,
  X,
} from "lucide-react";
import { BACKEND_URL } from "@/lib/api";
import { customerApiFetch } from "@/lib/customerApi";
/* ========================================================================== TYPES ========================================================================== */ type ProductImage =
  { id: number; image: string };
type Product = {
  id: number;
  name: string;
  slug: string;
  primary_image: ProductImage | null;
};
type Size = { id: number; name: string; display_name: string | null };
type Color = { id: number; name: string; display_name: string | null };
type Variant = {
  id: number;
  sku: string;
  mrp: string;
  selling_price: string;
  product: Product | null;
  size: Size | null;
  color: Color | null;
};
type CartItem = {
  id: number;
  quantity: number;
  line_total: string | number;
  variant: Variant | null;
};
type CartData = {
  id: number;
  items: CartItem[];
  item_count: number;
  subtotal: string | number;
};
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
  is_default: boolean;
};
type AppliedCoupon = {
  id: number;
  code: string;
  type: string;
  value: string;
  minimum_order_amount?: string | null;
  maximum_discount_amount?: string | null;
};
type ShippingQuote = {
  subtotal: string;
  shipping_amount: string;
  flat_shipping_amount: string;
  free_shipping_minimum: string | null;
  shipping_enabled: boolean;
  free_shipping: boolean;
};
type AddressForm = {
  full_name: string;
  phone: string;
  address_line_1: string;
  address_line_2: string;
  landmark: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
};
const EMPTY_ADDRESS: AddressForm = {
  full_name: "",
  phone: "",
  address_line_1: "",
  address_line_2: "",
  landmark: "",
  city: "",
  state: "",
  postal_code: "",
  country: "India",
};
/* ========================================================================== PAGE ========================================================================== */ export default function CheckoutPage() {
  const router = useRouter();
  const [cart, setCart] = useState<CartData | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [shippingAddressId, setShippingAddressId] = useState<number | null>(
    null,
  );
  const [sameBilling, setSameBilling] = useState(true);
  const [billingAddressId, setBillingAddressId] = useState<number | null>(null);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [savingAddress, setSavingAddress] = useState(false);
  const [addressFormError, setAddressFormError] = useState("");
  const [newAddress, setNewAddress] = useState<AddressForm>(EMPTY_ADDRESS);
  const [shippingQuote, setShippingQuote] = useState<ShippingQuote | null>(
    null,
  );
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(
    null,
  );
  const [discountAmount, setDiscountAmount] = useState(0);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponMessage, setCouponMessage] = useState("");
  const [couponError, setCouponError] = useState("");
  const [customerNote, setCustomerNote] = useState("");
  const [loading, setLoading] = useState(true);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [error, setError] = useState("");
  /* ========================================================================== HELPERS ========================================================================== */ const formatPrice =
    useCallback((value: string | number) => {
      return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
      }).format(Number(value) || 0);
    }, []);
  const handleUnauthorized = useCallback(() => {
    localStorage.removeItem("customer_token");
    localStorage.removeItem("customer_user");
    router.replace("/login");
  }, [router]);
  /* ========================================================================== LOAD CHECKOUT ========================================================================== */ const loadCheckout =
    useCallback(async () => {
      const token = localStorage.getItem("customer_token");
      if (!token) {
        handleUnauthorized();
        return;
      }
      try {
        setLoading(true);
        setError("");
        const [cartResponse, addressResponse] = await Promise.all([
          customerApiFetch("/customer/cart"),
          customerApiFetch("/customer/addresses"),
        ]);
        const cartJson = await cartResponse.json();
        const addressJson = await addressResponse.json();
        if (cartResponse.status === 401 || addressResponse.status === 401) {
          handleUnauthorized();
          return;
        }
        if (!cartResponse.ok) {
          setError(cartJson?.message || "Unable to load your cart.");
          return;
        }
        if (!addressResponse.ok) {
          setError(
            addressJson?.message || "Unable to load your saved addresses.",
          );
          return;
        }
        const nextCart: CartData = cartJson.data;
        setCart(nextCart);
        const addressList: Address[] = Array.isArray(addressJson.data)
          ? addressJson.data
          : Array.isArray(addressJson.data?.data)
            ? addressJson.data.data
            : [];
        setAddresses(addressList);
        const subtotal = Number(nextCart?.subtotal || 0);
        const shippingResponse = await customerApiFetch(
          `/customer/shipping/quote?amount=${encodeURIComponent(String(subtotal))}`,
        );
        const shippingJson = await shippingResponse.json();
        if (
          shippingResponse.status === 401 ||
          shippingResponse.status === 403
        ) {
          handleUnauthorized();
          return;
        }
        if (!shippingResponse.ok) {
          setError(shippingJson?.message || "Unable to calculate shipping.");
          return;
        }
        setShippingQuote(shippingJson.data);
        const shipping =
          addressList.find(
            (address) =>
              address.is_default &&
              (address.type === "shipping" || address.type === "both"),
          ) ||
          addressList.find(
            (address) => address.type === "shipping" || address.type === "both",
          );
        const billing =
          addressList.find(
            (address) =>
              address.is_default &&
              (address.type === "billing" || address.type === "both"),
          ) ||
          addressList.find(
            (address) => address.type === "billing" || address.type === "both",
          );
        setShippingAddressId(shipping?.id ?? null);
        setBillingAddressId(billing?.id ?? null);
      } catch (err) {
        console.error("Checkout load error:", err);
        setError("Unable to connect to the server. Please try again.");
      } finally {
        setLoading(false);
      }
    }, [handleUnauthorized]);
  useEffect(() => {
    void loadCheckout();
  }, [loadCheckout]);
  /* ========================================================================== DERIVED DATA ========================================================================== */ const shippingAddresses =
    useMemo(
      () =>
        addresses.filter(
          (address) => address.type === "shipping" || address.type === "both",
        ),
      [addresses],
    );
  const billingAddresses = useMemo(
    () =>
      addresses.filter(
        (address) => address.type === "billing" || address.type === "both",
      ),
    [addresses],
  );
  const subtotal = Number(cart?.subtotal || 0);
  const shippingAmount = Number(shippingQuote?.shipping_amount || 0);
  const totalAmount = Math.max(0, subtotal + shippingAmount - discountAmount);
  const freeShippingMinimum = shippingQuote?.free_shipping_minimum
    ? Number(shippingQuote.free_shipping_minimum)
    : null;
  const amountForFreeShipping =
    freeShippingMinimum !== null
      ? Math.max(0, freeShippingMinimum - subtotal)
      : 0;
  const shippingProgress =
    freeShippingMinimum && freeShippingMinimum > 0
      ? Math.min(100, (subtotal / freeShippingMinimum) * 100)
      : 100;
  /* ========================================================================== COUPON ========================================================================== */ async function applyCoupon() {
    const code = couponInput.trim().toUpperCase();
    if (!code) {
      setCouponError("Enter a coupon code.");
      setAppliedCoupon(null);
      setDiscountAmount(0);
      return;
    }
    try {
      setCouponLoading(true);
      setCouponError("");
      setCouponMessage("");
      const response = await customerApiFetch("/customer/coupons/validate", {
        method: "POST",
        body: JSON.stringify({ code, order_amount: subtotal }),
      });
      const data = await response.json();
      if (response.status === 401) {
        handleUnauthorized();
        return;
      }
      if (!response.ok) {
        setAppliedCoupon(null);
        setDiscountAmount(0);
        setCouponError(
          data?.message ||
            data?.errors?.code?.[0] ||
            data?.errors?.coupon_code?.[0] ||
            "Unable to apply this coupon.",
        );
        return;
      }
      const coupon = data?.data?.coupon ?? data?.data?.data?.coupon ?? null;
      const returnedDiscount = Number(
        data?.data?.discount_amount ?? data?.data?.data?.discount_amount ?? 0,
      );
      if (!coupon) {
        setAppliedCoupon(null);
        setDiscountAmount(0);
        setCouponError("Invalid coupon response from server.");
        return;
      }
      let finalDiscount = Number.isFinite(returnedDiscount)
        ? returnedDiscount
        : 0;
      if (finalDiscount <= 0 && Number.isFinite(Number(coupon.value))) {
        const couponValue = Number(coupon.value);
        const couponType = String(coupon.type || "").toLowerCase();
        if (couponType === "percentage") {
          finalDiscount = (subtotal * couponValue) / 100;
        } else {
          finalDiscount = couponValue;
        }
        if (
          coupon.maximum_discount_amount != null &&
          Number.isFinite(Number(coupon.maximum_discount_amount))
        ) {
          finalDiscount = Math.min(
            finalDiscount,
            Number(coupon.maximum_discount_amount),
          );
        }
      }
      finalDiscount = Number(
        Math.max(0, Math.min(finalDiscount, subtotal)).toFixed(2),
      );
      setAppliedCoupon(coupon);
      setDiscountAmount(finalDiscount);
      setCouponInput(String(coupon.code || code).toUpperCase());
      setCouponMessage(data?.message || "Coupon applied successfully.");
    } catch (err) {
      console.error("Apply coupon error:", err);
      setAppliedCoupon(null);
      setDiscountAmount(0);
      setCouponError(
        err instanceof Error ? err.message : "Unable to connect to server.",
      );
    } finally {
      setCouponLoading(false);
    }
  }
  function removeCoupon() {
    setAppliedCoupon(null);
    setDiscountAmount(0);
    setCouponInput("");
    setCouponMessage("");
    setCouponError("");
  }
  /* ========================================================================== ADDRESS ========================================================================== */ async function saveNewAddress(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    try {
      setSavingAddress(true);
      setAddressFormError("");
      const response = await customerApiFetch("/customer/addresses", {
        method: "POST",
        body: JSON.stringify({
          ...newAddress,
          type: "both",
          is_default: addresses.length === 0,
        }),
      });
      const data = await response.json();
      if (response.status === 401) {
        handleUnauthorized();
        return;
      }
      if (!response.ok) {
        throw new Error(data?.message || "Unable to save this address.");
      }
      const createdAddress: Address = data.data;
      setAddresses((current) => [createdAddress, ...current]);
      setShippingAddressId(createdAddress.id);
      if (sameBilling) {
        setBillingAddressId(createdAddress.id);
      }
      setNewAddress(EMPTY_ADDRESS);
      setShowAddressModal(false);
    } catch (err) {
      setAddressFormError(
        err instanceof Error ? err.message : "Unable to save this address.",
      );
    } finally {
      setSavingAddress(false);
    }
  }
  /* ========================================================================== PLACE ORDER ========================================================================== */ async function placeOrder() {
    if (!cart || cart.items.length === 0) {
      setError("Your cart is empty.");
      return;
    }
    if (!shippingAddressId) {
      setError("Please select a shipping address.");
      return;
    }
    if (!sameBilling && !billingAddressId) {
      setError("Please select a billing address.");
      return;
    }
    try {
      setPlacingOrder(true);
      setError("");
      setCouponError("");
      const response = await customerApiFetch("/customer/orders", {
        method: "POST",
        body: JSON.stringify({
          shipping_address_id: shippingAddressId,
          billing_address_id: sameBilling ? null : billingAddressId,
          payment_method: "cod",
          customer_note: customerNote.trim() ? customerNote.trim() : null,
          coupon_code: appliedCoupon?.code || null,
        }),
      });
      const data = await response.json();
      if (response.status === 401) {
        handleUnauthorized();
        return;
      }
      if (data?.errors?.coupon_code?.[0]) {
        setCouponError(data.errors.coupon_code[0]);
        setAppliedCoupon(null);
        setDiscountAmount(0);
        return;
      }
      if (data?.errors?.cart?.[0]) {
        setError(data.errors.cart[0]);
        return;
      }
      if (!response.ok) {
        setError(data?.message || "Unable to place your order.");
        return;
      }
      const order = data.data;
      router.push(
        `/order-success?order=${encodeURIComponent(order.order_number)}&id=${order.id}`,
      );
    } catch (err) {
      console.error("Place order error:", err);
      setError("Unable to connect to server. Please try again.");
    } finally {
      setPlacingOrder(false);
    }
  }
  /* ========================================================================== LOADING ========================================================================== */ if (
    loading
  ) {
    return <CheckoutSkeleton />;
  }
  /* ========================================================================== EMPTY CART ========================================================================== */ if (
    !cart ||
    cart.items.length === 0
  ) {
    return (
      <main className="min-h-screen bg-[#f7f3ee] px-4 py-20">
        {" "}
        <div className="mx-auto max-w-lg rounded-[32px] border border-[#e7ddd2] bg-white p-10 text-center shadow-[0_25px_80px_rgba(43,31,22,0.08)]">
          {" "}
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#f8eee9] text-[#8d1530]">
            {" "}
            <Package size={30} strokeWidth={1.5} />{" "}
          </div>{" "}
          <p className="mt-7 text-[10px] font-semibold uppercase tracking-[0.32em] text-[#9c8e82]">
            {" "}
            BanglesMart{" "}
          </p>{" "}
          <h1 className="mt-3 font-serif text-4xl text-[#211a16]">
            {" "}
            Your cart is empty{" "}
          </h1>{" "}
          <p className="mx-auto mt-4 max-w-sm text-sm leading-7 text-[#786e66]">
            {" "}
            Your next favourite piece is waiting. Explore our collection and add
            something beautiful to your cart.{" "}
          </p>{" "}
          <Link
            href="/shop"
            className="mt-8 inline-flex items-center justify-center rounded-full bg-[#8d1530] px-9 py-3.5 text-sm font-semibold text-white transition hover:bg-[#721027]"
          >
            {" "}
            Continue Shopping{" "}
          </Link>{" "}
        </div>{" "}
      </main>
    );
  }
  /* ========================================================================== MAIN ========================================================================== */ return (
    <>
      {" "}
      <main className="min-h-screen bg-[#f7f3ee] text-[#211a16]">
        {" "}
        {/* TOP BAR */}{" "}
        <div className="border-b border-[#e8dfd5] bg-white">
          {" "}
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
            {" "}
            <Link
              href="/cart"
              className="group inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#6d6259] transition hover:text-[#8d1530]"
            >
              {" "}
              <ArrowLeft
                size={16}
                className="transition-transform group-hover:-translate-x-1"
              />{" "}
              Back to Cart{" "}
            </Link>{" "}
            <div className="hidden items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-[#988b7e] sm:flex">
              {" "}
              <LockKeyhole size={13} /> Secure Checkout{" "}
            </div>{" "}
            <div className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#988b7e]">
              {" "}
              Checkout{" "}
            </div>{" "}
          </div>{" "}
        </div>{" "}
        {/* HERO */}{" "}
        <div className="mx-auto max-w-7xl px-4 pb-8 pt-10 sm:px-6 lg:px-8 lg:pb-10 lg:pt-14">
          {" "}
          <div className="max-w-3xl">
            {" "}
            <p className="text-[10px] font-bold uppercase tracking-[0.34em] text-[#8d1530]">
              {" "}
              Almost yours{" "}
            </p>{" "}
            <h1 className="mt-3 font-serif text-4xl leading-tight tracking-[-0.025em] text-[#211a16] sm:text-5xl lg:text-6xl">
              {" "}
              Complete your purchase{" "}
            </h1>{" "}
            <p className="mt-4 max-w-2xl text-sm leading-7 text-[#756b62] sm:text-base">
              {" "}
              Review your order and delivery details before placing your
              order.{" "}
            </p>{" "}
          </div>{" "}
          <div className="mt-8 flex max-w-xl items-center gap-3">
            {" "}
            <div className="flex items-center gap-2">
              {" "}
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#8d1530] text-white">
                {" "}
                <Check size={14} />{" "}
              </span>{" "}
              <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#8d1530]">
                {" "}
                Cart{" "}
              </span>{" "}
            </div>{" "}
            <div className="h-px flex-1 bg-[#cfc3b7]" />{" "}
            <div className="flex items-center gap-2">
              {" "}
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#8d1530] text-white">
                {" "}
                2{" "}
              </span>{" "}
              <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#8d1530]">
                {" "}
                Checkout{" "}
              </span>{" "}
            </div>{" "}
          </div>{" "}
        </div>{" "}
        {/* ERROR */}{" "}
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {" "}
          {error && (
            <div className="mb-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-4 text-sm text-red-700">
              {" "}
              <X size={18} className="mt-0.5 shrink-0" />{" "}
              <span>{error}</span>{" "}
            </div>
          )}{" "}
        </div>{" "}
        {/* CONTENT */}{" "}
        <div className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8 lg:pb-24">
          {" "}
          <div className="grid grid-cols-1 gap-7 xl:grid-cols-[minmax(0,1fr)_430px]">
            {" "}
            {/* ============================================================== MOBILE ORDER SUMMARY Appears FIRST on mobile ============================================================== */}{" "}
            <div className="order-1 xl:hidden">
              {" "}
              <OrderSummary
                cart={cart}
                shippingQuote={shippingQuote}
                subtotal={subtotal}
                shippingAmount={shippingAmount}
                discountAmount={discountAmount}
                totalAmount={totalAmount}
                freeShippingMinimum={freeShippingMinimum}
                amountForFreeShipping={amountForFreeShipping}
                shippingProgress={shippingProgress}
                couponInput={couponInput}
                setCouponInput={setCouponInput}
                appliedCoupon={appliedCoupon}
                couponLoading={couponLoading}
                couponError={couponError}
                couponMessage={couponMessage}
                applyCoupon={applyCoupon}
                removeCoupon={removeCoupon}
                formatPrice={formatPrice}
                placingOrder={placingOrder}
                shippingAddressId={shippingAddressId}
                sameBilling={sameBilling}
                billingAddressId={billingAddressId}
                placeOrder={placeOrder}
              />{" "}
            </div>{" "}
            {/* ============================================================== FORM CONTENT SECOND ON MOBILE / LEFT ON DESKTOP ============================================================== */}{" "}
            <div className="order-2 space-y-5 xl:order-1">
              {" "}
              {/* DELIVERY ADDRESS */}{" "}
              <CheckoutSection
                number="01"
                icon={<MapPin size={18} />}
                title="Delivery address"
                subtitle="Choose where you'd like your order delivered."
              >
                {" "}
                {shippingAddresses.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-[#d6cabd] bg-[#fcfaf7] p-6">
                    {" "}
                    <p className="text-sm font-semibold text-[#39312b]">
                      {" "}
                      No delivery address saved{" "}
                    </p>{" "}
                    <p className="mt-1 text-sm leading-6 text-[#7c7168]">
                      {" "}
                      Add an address below to continue.{" "}
                    </p>{" "}
                  </div>
                ) : (
                  <div className="grid gap-3">
                    {" "}
                    {shippingAddresses.map((address) => (
                      <AddressCard
                        key={address.id}
                        address={address}
                        selected={shippingAddressId === address.id}
                        onClick={() => setShippingAddressId(address.id)}
                      />
                    ))}{" "}
                  </div>
                )}{" "}
                <button
                  type="button"
                  onClick={() => {
                    setAddressFormError("");
                    setShowAddressModal(true);
                  }}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-[#cfc1b2] bg-[#fcfaf7] px-4 py-4 text-xs font-bold uppercase tracking-[0.12em] text-[#574d45] transition hover:border-[#8d1530] hover:bg-[#fffaf7] hover:text-[#8d1530]"
                >
                  {" "}
                  <Plus size={16} /> Add New Address{" "}
                </button>{" "}
              </CheckoutSection>{" "}
              {/* BILLING ADDRESS */}{" "}
              <CheckoutSection
                number="02"
                icon={<MapPin size={18} />}
                title="Billing address"
                subtitle="Choose the address you'd like on your invoice."
              >
                {" "}
                <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-[#e5ddd4] bg-[#fcfaf7] px-4 py-4">
                  {" "}
                  <input
                    type="checkbox"
                    checked={sameBilling}
                    onChange={(event) => setSameBilling(event.target.checked)}
                    className="h-4 w-4 accent-[#8d1530]"
                  />{" "}
                  <span className="text-sm font-medium text-[#3f3731]">
                    {" "}
                    Same as shipping address{" "}
                  </span>{" "}
                </label>{" "}
                {!sameBilling && (
                  <div className="mt-4 grid gap-3">
                    {" "}
                    {billingAddresses.length === 0 ? (
                      <div className="rounded-2xl bg-[#fff7ef] p-4 text-sm text-[#8a5f35]">
                        {" "}
                        Please add a billing address to continue.{" "}
                      </div>
                    ) : (
                      billingAddresses.map((address) => (
                        <AddressCard
                          key={address.id}
                          address={address}
                          selected={billingAddressId === address.id}
                          onClick={() => setBillingAddressId(address.id)}
                        />
                      ))
                    )}{" "}
                  </div>
                )}{" "}
              </CheckoutSection>{" "}
              {/* PAYMENT */}{" "}
              <CheckoutSection
                number="03"
                icon={<Truck size={18} />}
                title="Payment method"
                subtitle="Simple, secure and convenient."
              >
                {" "}
                <div className="rounded-2xl border border-[#8d1530] bg-[#fffaf7] p-5">
                  {" "}
                  <div className="flex items-start gap-4">
                    {" "}
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#8d1530] text-white">
                      {" "}
                      <Truck size={18} />{" "}
                    </div>{" "}
                    <div>
                      {" "}
                      <p className="text-sm font-semibold text-[#241d18]">
                        {" "}
                        Cash on Delivery{" "}
                      </p>{" "}
                      <p className="mt-1 text-xs leading-6 text-[#7b7067]">
                        {" "}
                        Pay when your order reaches your doorstep.{" "}
                      </p>{" "}
                    </div>{" "}
                    <div className="ml-auto flex h-6 w-6 items-center justify-center rounded-full bg-[#8d1530] text-white">
                      {" "}
                      <Check size={13} />{" "}
                    </div>{" "}
                  </div>{" "}
                </div>{" "}
              </CheckoutSection>{" "}
              {/* ORDER NOTE */}{" "}
              <CheckoutSection
                number="04"
                icon={<Package size={18} />}
                title="Order note"
                subtitle="Optional instructions for your order."
              >
                {" "}
                <textarea
                  value={customerNote}
                  onChange={(event) => setCustomerNote(event.target.value)}
                  rows={4}
                  maxLength={1000}
                  placeholder="Example: Please call before delivery..."
                  className="w-full resize-none rounded-2xl border border-[#ddd3c8] bg-[#fcfaf7] px-4 py-4 text-sm leading-6 text-[#302822] outline-none transition placeholder:text-[#aaa098] focus:border-[#8d1530] focus:bg-white"
                />{" "}
                <p className="mt-2 text-right text-[10px] text-[#a19890]">
                  {" "}
                  {customerNote.length}/1000{" "}
                </p>{" "}
              </CheckoutSection>{" "}
              {/* MOBILE FINAL CTA */}{" "}
              <div className="xl:hidden">
                {" "}
                <button
                  type="button"
                  disabled={
                    placingOrder ||
                    !shippingAddressId ||
                    (!sameBilling && !billingAddressId)
                  }
                  onClick={() => void placeOrder()}
                  className="flex h-14 w-full items-center justify-center gap-2 rounded-full bg-[#8d1530] px-6 text-xs font-bold uppercase tracking-[0.12em] text-white shadow-[0_15px_35px_rgba(141,21,48,.22)] transition hover:bg-[#721027] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {" "}
                  {placingOrder ? (
                    <>
                      {" "}
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />{" "}
                      Placing Order{" "}
                    </>
                  ) : (
                    <>
                      {" "}
                      Place COD Order <span className="opacity-50">
                        {" "}
                        ·{" "}
                      </span>{" "}
                      {formatPrice(totalAmount)}{" "}
                    </>
                  )}{" "}
                </button>{" "}
                <div className="mt-4 flex items-center justify-center gap-2 text-[10px] text-[#91867d]">
                  {" "}
                  <LockKeyhole size={13} /> Secure checkout · Cash on
                  Delivery{" "}
                </div>{" "}
              </div>{" "}
            </div>{" "}
            {/* ============================================================== DESKTOP ORDER SUMMARY Hidden on mobile ============================================================== */}{" "}
            <aside className="order-3 hidden xl:order-2 xl:block">
              {" "}
              <div className="sticky top-5">
                {" "}
                <OrderSummary
                  cart={cart}
                  shippingQuote={shippingQuote}
                  subtotal={subtotal}
                  shippingAmount={shippingAmount}
                  discountAmount={discountAmount}
                  totalAmount={totalAmount}
                  freeShippingMinimum={freeShippingMinimum}
                  amountForFreeShipping={amountForFreeShipping}
                  shippingProgress={shippingProgress}
                  couponInput={couponInput}
                  setCouponInput={setCouponInput}
                  appliedCoupon={appliedCoupon}
                  couponLoading={couponLoading}
                  couponError={couponError}
                  couponMessage={couponMessage}
                  applyCoupon={applyCoupon}
                  removeCoupon={removeCoupon}
                  formatPrice={formatPrice}
                  placingOrder={placingOrder}
                  shippingAddressId={shippingAddressId}
                  sameBilling={sameBilling}
                  billingAddressId={billingAddressId}
                  placeOrder={placeOrder}
                />{" "}
              </div>{" "}
            </aside>{" "}
          </div>{" "}
        </div>{" "}
      </main>{" "}
      {/* ADDRESS MODAL */}{" "}
      {showAddressModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          {" "}
          <div className="max-h-[92vh] w-full max-w-2xl overflow-hidden rounded-[30px] bg-white shadow-[0_30px_100px_rgba(0,0,0,.2)]">
            {" "}
            <div className="flex items-center justify-between border-b border-[#eee6dd] px-6 py-5 sm:px-7">
              {" "}
              <div>
                {" "}
                <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-[#9b8d80]">
                  {" "}
                  Delivery details{" "}
                </p>{" "}
                <h2 className="mt-1 font-serif text-2xl text-[#211a16]">
                  {" "}
                  Add New Address{" "}
                </h2>{" "}
              </div>{" "}
              <button
                type="button"
                onClick={() => setShowAddressModal(false)}
                disabled={savingAddress}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f7f3ee] text-[#655b53] transition hover:bg-[#eee7df]"
              >
                {" "}
                <X size={18} />{" "}
              </button>{" "}
            </div>{" "}
            <form
              onSubmit={saveNewAddress}
              className="max-h-[calc(92vh-90px)] overflow-y-auto px-6 py-6 sm:px-7"
            >
              {" "}
              {addressFormError && (
                <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {" "}
                  {addressFormError}{" "}
                </div>
              )}{" "}
              <div className="grid gap-4 sm:grid-cols-2">
                {" "}
                <FormField
                  label="Full Name"
                  required
                  value={newAddress.full_name}
                  onChange={(value) =>
                    setNewAddress((current) => ({
                      ...current,
                      full_name: value,
                    }))
                  }
                />{" "}
                <FormField
                  label="Phone Number"
                  required
                  value={newAddress.phone}
                  onChange={(value) =>
                    setNewAddress((current) => ({ ...current, phone: value }))
                  }
                />{" "}
              </div>{" "}
              <div className="mt-4">
                {" "}
                <FormField
                  label="Address Line 1"
                  required
                  placeholder="House number, street, area"
                  value={newAddress.address_line_1}
                  onChange={(value) =>
                    setNewAddress((current) => ({
                      ...current,
                      address_line_1: value,
                    }))
                  }
                />{" "}
              </div>{" "}
              <div className="mt-4">
                {" "}
                <FormField
                  label="Address Line 2"
                  placeholder="Apartment, floor, building"
                  value={newAddress.address_line_2}
                  onChange={(value) =>
                    setNewAddress((current) => ({
                      ...current,
                      address_line_2: value,
                    }))
                  }
                />{" "}
              </div>{" "}
              <div className="mt-4">
                {" "}
                <FormField
                  label="Landmark"
                  placeholder="Nearby landmark"
                  value={newAddress.landmark}
                  onChange={(value) =>
                    setNewAddress((current) => ({
                      ...current,
                      landmark: value,
                    }))
                  }
                />{" "}
              </div>{" "}
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {" "}
                <FormField
                  label="City"
                  required
                  value={newAddress.city}
                  onChange={(value) =>
                    setNewAddress((current) => ({ ...current, city: value }))
                  }
                />{" "}
                <FormField
                  label="State"
                  required
                  value={newAddress.state}
                  onChange={(value) =>
                    setNewAddress((current) => ({ ...current, state: value }))
                  }
                />{" "}
              </div>{" "}
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {" "}
                <FormField
                  label="Postal Code"
                  required
                  value={newAddress.postal_code}
                  onChange={(value) =>
                    setNewAddress((current) => ({
                      ...current,
                      postal_code: value,
                    }))
                  }
                />{" "}
                <FormField
                  label="Country"
                  value={newAddress.country}
                  onChange={(value) =>
                    setNewAddress((current) => ({ ...current, country: value }))
                  }
                />{" "}
              </div>{" "}
              <div className="mt-7 flex flex-col-reverse gap-3 border-t border-[#eee6dd] pt-5 sm:flex-row sm:justify-end">
                {" "}
                <button
                  type="button"
                  disabled={savingAddress}
                  onClick={() => setShowAddressModal(false)}
                  className="rounded-full border border-[#d9d0c6] px-7 py-3 text-xs font-bold uppercase tracking-[0.1em] text-[#554d46] transition hover:bg-[#f8f5f1]"
                >
                  {" "}
                  Cancel{" "}
                </button>{" "}
                <button
                  type="submit"
                  disabled={savingAddress}
                  className="rounded-full bg-[#8d1530] px-8 py-3 text-xs font-bold uppercase tracking-[0.1em] text-white transition hover:bg-[#721027] disabled:opacity-50"
                >
                  {" "}
                  {savingAddress ? "Saving..." : "Save Address"}{" "}
                </button>{" "}
              </div>{" "}
            </form>{" "}
          </div>{" "}
        </div>
      )}{" "}
    </>
  );
}
/* ========================================================================== ORDER SUMMARY ========================================================================== */ function OrderSummary({
  cart,
  shippingQuote,
  subtotal,
  shippingAmount,
  discountAmount,
  totalAmount,
  freeShippingMinimum,
  amountForFreeShipping,
  shippingProgress,
  couponInput,
  setCouponInput,
  appliedCoupon,
  couponLoading,
  couponError,
  couponMessage,
  applyCoupon,
  removeCoupon,
  formatPrice,
  placingOrder,
  shippingAddressId,
  sameBilling,
  billingAddressId,
  placeOrder,
}: {
  cart: CartData;
  shippingQuote: ShippingQuote | null;
  subtotal: number;
  shippingAmount: number;
  discountAmount: number;
  totalAmount: number;
  freeShippingMinimum: number | null;
  amountForFreeShipping: number;
  shippingProgress: number;
  couponInput: string;
  setCouponInput: (value: string) => void;
  appliedCoupon: AppliedCoupon | null;
  couponLoading: boolean;
  couponError: string;
  couponMessage: string;
  applyCoupon: () => Promise<void>;
  removeCoupon: () => void;
  formatPrice: (value: string | number) => string;
  placingOrder: boolean;
  shippingAddressId: number | null;
  sameBilling: boolean;
  billingAddressId: number | null;
  placeOrder: () => Promise<void>;
}) {
  return (
    <div className="overflow-hidden rounded-[30px] border border-[#e3d9ce] bg-white shadow-[0_25px_80px_rgba(43,31,22,0.10)]">
      {" "}
      {/* HEADER */}{" "}
      <div className="border-b border-[#eee6dd] bg-[#fbf8f4] px-5 py-5 sm:px-6">
        {" "}
        <div className="flex items-start justify-between gap-4">
          {" "}
          <div>
            {" "}
            <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-[#9b8d80]">
              {" "}
              Your selection{" "}
            </p>{" "}
            <h2 className="mt-1 font-serif text-2xl text-[#211a16]">
              {" "}
              Order Summary{" "}
            </h2>{" "}
          </div>{" "}
          <span className="rounded-full bg-white px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.08em] text-[#756a61] shadow-sm">
            {" "}
            {cart.item_count} {cart.item_count === 1 ? "Item" : "Items"}{" "}
          </span>{" "}
        </div>{" "}
      </div>{" "}
      {/* PRODUCTS */}{" "}
      <div className="max-h-[390px] space-y-5 overflow-y-auto px-5 py-5 sm:px-6 sm:py-6">
        {" "}
        {cart.items.map((item) => {
          const product = item.variant?.product;
          const image = product?.primary_image?.image;
          const size = item.variant?.size
            ? item.variant.size.display_name || item.variant.size.name
            : null;
          const color = item.variant?.color
            ? item.variant.color.display_name || item.variant.color.name
            : null;
          return (
            <div key={item.id} className="flex gap-4">
              {" "}
              <div className="relative h-24 w-[76px] shrink-0 overflow-hidden rounded-2xl border border-[#e6ddd4] bg-[#f8f5f1]">
                {" "}
                {image ? (
                  <img
                    src={`${BACKEND_URL}/storage/${image}`}
                    alt={product?.name || "Product"}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-[#c8beb5]">
                    {" "}
                    <Package size={22} />{" "}
                  </div>
                )}{" "}
                <span className="absolute right-1.5 top-1.5 rounded-full bg-white/95 px-2 py-1 text-[9px] font-bold text-[#302923] shadow-sm">
                  {" "}
                  ×{item.quantity}{" "}
                </span>{" "}
              </div>{" "}
              <div className="min-w-0 flex-1">
                {" "}
                <p className="line-clamp-2 text-sm font-semibold leading-5 text-[#2c251f]">
                  {" "}
                  {product?.name || "Product"}{" "}
                </p>{" "}
                {(size || color) && (
                  <p className="mt-1.5 text-[10px] uppercase tracking-[0.08em] text-[#8b7e74]">
                    {" "}
                    {size || "Standard"} {color ? ` · ${color}` : ""}{" "}
                  </p>
                )}{" "}
                <p className="mt-3 text-sm font-semibold text-[#8d1530]">
                  {" "}
                  {formatPrice(item.line_total)}{" "}
                </p>{" "}
              </div>{" "}
            </div>
          );
        })}{" "}
      </div>{" "}
      {/* COUPON */}{" "}
      <div className="border-y border-[#eee6dd] px-5 py-5 sm:px-6">
        {" "}
        <div className="flex items-center gap-2">
          {" "}
          <Tag size={15} className="text-[#8d1530]" />{" "}
          <p className="text-xs font-bold uppercase tracking-[0.1em]">
            {" "}
            Have a coupon?{" "}
          </p>{" "}
        </div>{" "}
        {!appliedCoupon ? (
          <div className="mt-3">
            {" "}
            <div className="flex gap-2">
              {" "}
              <input
                value={couponInput}
                onChange={(event) =>
                  setCouponInput(event.target.value.toUpperCase())
                }
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    void applyCoupon();
                  }
                }}
                placeholder="COUPON CODE"
                className="min-w-0 flex-1 rounded-xl border border-[#ddd3c8] bg-[#fcfaf7] px-3 py-3 text-[11px] font-semibold tracking-[0.1em] outline-none transition placeholder:text-[#aaa098] focus:border-[#8d1530] focus:bg-white"
              />{" "}
              <button
                type="button"
                disabled={couponLoading}
                onClick={() => void applyCoupon()}
                className="rounded-xl bg-[#211a16] px-4 text-[11px] font-bold uppercase tracking-[0.08em] text-white transition hover:bg-[#8d1530] disabled:opacity-50"
              >
                {" "}
                {couponLoading ? "..." : "Apply"}{" "}
              </button>{" "}
            </div>{" "}
            {couponError && (
              <p className="mt-2 text-xs font-medium text-red-600">
                {" "}
                {couponError}{" "}
              </p>
            )}{" "}
          </div>
        ) : (
          <div className="mt-3 flex items-center justify-between gap-3 rounded-xl border border-green-200 bg-green-50 px-3 py-3">
            {" "}
            <div>
              {" "}
              <p className="font-mono text-xs font-bold text-green-800">
                {" "}
                {appliedCoupon.code}{" "}
              </p>{" "}
              <p className="mt-1 text-[10px] text-green-700">
                {" "}
                {couponMessage}{" "}
              </p>{" "}
            </div>{" "}
            <button
              type="button"
              onClick={removeCoupon}
              className="text-[10px] font-bold uppercase tracking-[0.08em] text-red-600 hover:underline"
            >
              {" "}
              Remove{" "}
            </button>{" "}
          </div>
        )}{" "}
      </div>{" "}
      {/* FREE SHIPPING */}{" "}
      {shippingQuote?.shipping_enabled && freeShippingMinimum !== null && (
        <div className="px-5 pt-5 sm:px-6">
          {" "}
          {shippingQuote.free_shipping ? (
            <div className="rounded-xl bg-green-50 px-4 py-3 text-xs font-semibold text-green-700">
              {" "}
              ✓ You qualify for free shipping.{" "}
            </div>
          ) : (
            <>
              {" "}
              <div className="flex items-center justify-between gap-3 text-[10px]">
                {" "}
                <span className="font-medium uppercase tracking-[0.08em] text-[#80756c]">
                  {" "}
                  Free shipping{" "}
                </span>{" "}
                <span className="font-bold text-[#8d1530]">
                  {" "}
                  {formatPrice(amountForFreeShipping)} left{" "}
                </span>{" "}
              </div>{" "}
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#eee7df]">
                {" "}
                <div
                  className="h-full rounded-full bg-[#8d1530] transition-all duration-500"
                  style={{ width: `${shippingProgress}%` }}
                />{" "}
              </div>{" "}
            </>
          )}{" "}
        </div>
      )}{" "}
      {/* TOTALS */}{" "}
      <div className="px-5 py-6 sm:px-6">
        {" "}
        <div className="space-y-3 text-sm">
          {" "}
          <SummaryRow label="Subtotal" value={formatPrice(subtotal)} />{" "}
          <SummaryRow
            label="Shipping"
            value={shippingAmount === 0 ? "Free" : formatPrice(shippingAmount)}
            valueClass={shippingAmount === 0 ? "text-green-700" : ""}
          />{" "}
          {appliedCoupon && (
            <SummaryRow
              label={`Discount (${appliedCoupon.code})`}
              value={`-${formatPrice(discountAmount)}`}
              valueClass="text-green-700"
            />
          )}{" "}
        </div>{" "}
        <div className="my-5 border-t border-dashed border-[#dcd2c7]" />{" "}
        <div className="flex items-end justify-between gap-4">
          {" "}
          <div>
            {" "}
            <p className="text-sm font-semibold text-[#332b25]"> Total </p>{" "}
            <p className="mt-1 text-[10px] text-[#958980]">
              {" "}
              Final amount payable{" "}
            </p>{" "}
          </div>{" "}
          <p className="font-serif text-3xl text-[#8d1530]">
            {" "}
            {formatPrice(totalAmount)}{" "}
          </p>{" "}
        </div>{" "}
        {discountAmount > 0 && (
          <div className="mt-4 rounded-xl bg-[#f9f0e6] px-3 py-2.5 text-center text-[10px] font-semibold text-[#765c3d]">
            {" "}
            You saved {formatPrice(discountAmount)} on this order{" "}
          </div>
        )}{" "}
        {/* DESKTOP CTA */}{" "}
        <button
          type="button"
          disabled={
            placingOrder ||
            !shippingAddressId ||
            (!sameBilling && !billingAddressId)
          }
          onClick={() => void placeOrder()}
          className="mt-6 hidden h-14 w-full items-center justify-center gap-2 rounded-full bg-[#8d1530] px-6 text-xs font-bold uppercase tracking-[0.12em] text-white shadow-[0_15px_35px_rgba(141,21,48,.22)] transition hover:bg-[#721027] disabled:cursor-not-allowed disabled:opacity-40 xl:flex"
        >
          {" "}
          {placingOrder ? (
            <>
              {" "}
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />{" "}
              Placing Order{" "}
            </>
          ) : (
            <>
              {" "}
              Place COD Order <span className="opacity-50">·</span>{" "}
              {formatPrice(totalAmount)}{" "}
            </>
          )}{" "}
        </button>{" "}
        {/* TRUST */}{" "}
        <div className="mt-6 grid grid-cols-3 divide-x divide-[#eee6dd] border-t border-[#eee6dd] pt-5">
          {" "}
          <TrustItem icon={<LockKeyhole size={15} />} title="Secure" />{" "}
          <TrustItem icon={<ShieldCheck size={15} />} title="Trusted" />{" "}
          <TrustItem icon={<Truck size={15} />} title="Delivery" />{" "}
        </div>{" "}
      </div>{" "}
    </div>
  );
}
/* ========================================================================== REUSABLE COMPONENTS ========================================================================== */ function CheckoutSection({
  number,
  icon,
  title,
  subtitle,
  children,
}: {
  number: string;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[26px] border border-[#e4dbd1] bg-white p-5 shadow-[0_8px_35px_rgba(43,31,22,.035)] sm:p-6">
      {" "}
      <div className="flex items-start gap-4">
        {" "}
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#f8eee9] text-[#8d1530]">
          {" "}
          {icon}{" "}
        </div>{" "}
        <div>
          {" "}
          <div className="flex items-center gap-2">
            {" "}
            <span className="text-[9px] font-bold tracking-[0.18em] text-[#aaa097]">
              {" "}
              {number}{" "}
            </span>{" "}
            <h2 className="text-sm font-bold text-[#29221d] sm:text-base">
              {" "}
              {title}{" "}
            </h2>{" "}
          </div>{" "}
          <p className="mt-1 text-xs leading-5 text-[#837970]">
            {" "}
            {subtitle}{" "}
          </p>{" "}
        </div>{" "}
      </div>{" "}
      <div className="mt-5"> {children} </div>{" "}
    </section>
  );
}
function AddressCard({
  address,
  selected,
  onClick,
}: {
  address: Address;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative w-full rounded-2xl border p-4 text-left transition ${selected ? "border-[#8d1530] bg-[#fffaf7] shadow-[0_8px_25px_rgba(141,21,48,.07)]" : "border-[#e4dbd1] bg-white hover:border-[#bcae9f]"}`}
    >
      {" "}
      <div className="flex items-start gap-3 pr-8">
        {" "}
        <div
          className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${selected ? "bg-[#8d1530] text-white" : "bg-[#f7f2ec] text-[#82776f]"}`}
        >
          {" "}
          <MapPin size={14} />{" "}
        </div>{" "}
        <div className="min-w-0">
          {" "}
          <div className="flex flex-wrap items-center gap-2">
            {" "}
            <p className="text-sm font-bold text-[#2d2620]">
              {" "}
              {address.full_name}{" "}
            </p>{" "}
            {address.is_default && (
              <span className="rounded-full bg-[#f2e9df] px-2 py-0.5 text-[8px] font-bold uppercase tracking-[0.12em] text-[#796653]">
                {" "}
                Default{" "}
              </span>
            )}{" "}
          </div>{" "}
          <p className="mt-1 text-xs font-medium text-[#756b63]">
            {" "}
            {address.phone}{" "}
          </p>{" "}
          <p className="mt-2 text-xs leading-5 text-[#847970]">
            {" "}
            {address.address_line_1}{" "}
            {address.address_line_2 ? `, ${address.address_line_2}` : ""}{" "}
            {address.landmark ? `, ${address.landmark}` : ""} <br />{" "}
            {address.city}, {address.state} — {address.postal_code} <br />{" "}
            {address.country}{" "}
          </p>{" "}
        </div>{" "}
      </div>{" "}
      <span
        className={`absolute right-4 top-4 flex h-6 w-6 items-center justify-center rounded-full border ${selected ? "border-[#8d1530] bg-[#8d1530] text-white" : "border-[#d8cec1] bg-white text-transparent"}`}
      >
        {" "}
        <Check size={12} />{" "}
      </span>{" "}
    </button>
  );
}
function SummaryRow({
  label,
  value,
  valueClass = "",
}: {
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      {" "}
      <span className="text-[#756b63]"> {label} </span>{" "}
      <span className={`font-semibold text-[#29231f] ${valueClass}`}>
        {" "}
        {value}{" "}
      </span>{" "}
    </div>
  );
}
function TrustItem({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex flex-col items-center gap-1.5 text-[#988d83]">
      {" "}
      {icon}{" "}
      <span className="text-[8px] font-bold uppercase tracking-[0.14em]">
        {" "}
        {title}{" "}
      </span>{" "}
    </div>
  );
}
function FormField({
  label,
  required,
  placeholder,
  value,
  onChange,
}: {
  label: string;
  required?: boolean;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      {" "}
      <span className="mb-2 block text-[11px] font-bold uppercase tracking-[0.08em] text-[#50473f]">
        {" "}
        {label} {required ? " *" : ""}{" "}
      </span>{" "}
      <input
        required={required}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-xl border border-[#ddd3c8] bg-[#fcfaf7] px-4 py-3 text-sm text-[#28221e] outline-none transition placeholder:text-[#aaa098] focus:border-[#8d1530] focus:bg-white"
      />{" "}
    </label>
  );
}
function CheckoutSkeleton() {
  return (
    <main className="min-h-screen bg-[#f7f3ee] px-4 py-10 sm:px-6">
      {" "}
      <div className="mx-auto max-w-7xl animate-pulse">
        {" "}
        <div className="h-4 w-28 rounded-full bg-[#e6ddd3]" />{" "}
        <div className="mt-10 h-12 w-72 rounded bg-[#e6ddd3]" />{" "}
        <div className="mt-4 h-4 w-96 max-w-full rounded bg-[#e6ddd3]" />{" "}
        <div className="mt-10 grid gap-7 xl:grid-cols-[1fr_430px]">
          {" "}
          <div className="space-y-5">
            {" "}
            {[1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className="h-44 rounded-[26px] border border-[#e4dbd1] bg-white"
              />
            ))}{" "}
          </div>{" "}
          <div className="h-[700px] rounded-[30px] border border-[#e4dbd1] bg-white" />{" "}
        </div>{" "}
      </div>{" "}
    </main>
  );
}
