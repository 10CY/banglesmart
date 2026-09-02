export default function ShippingPage() {
  return (
    <main className="bg-[#faf6ee] px-5 py-20">
      <div className="mx-auto max-w-3xl rounded-3xl bg-white p-8 shadow-sm sm:p-14">
        <h1 className="text-4xl font-semibold">Shipping Information</h1>
        <p className="mt-6 text-sm leading-8 text-gray-600">
          Shipping charges and free-shipping thresholds are calculated at
          checkout from the current store configuration. After dispatch,
          tracking information appears in your order details when available.
        </p>
      </div>
    </main>
  );
}
