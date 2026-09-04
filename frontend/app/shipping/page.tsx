export default function ShippingPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f8f3eb] text-[#211b17]">
      {" "}
      {/* Decorative background */}{" "}
      <div className="pointer-events-none absolute -left-32 top-20 h-80 w-80 rounded-full border border-[#c9a227]/10" />{" "}
      <div className="pointer-events-none absolute -left-24 top-28 h-64 w-64 rounded-full border border-[#c9a227]/10" />{" "}
      <div className="pointer-events-none absolute -right-40 bottom-0 h-[520px] w-[520px] rounded-full border border-[#c9a227]/10" />{" "}
      <div className="relative mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-24 lg:px-10 lg:py-28">
        {" "}
        {/* Brand line */}{" "}
        <div className="mb-12 flex items-center gap-3 sm:mb-16">
          {" "}
          <span className="h-px w-10 bg-[#c9a227]" />{" "}
          <span className="text-[10px] font-bold uppercase tracking-[0.32em] text-[#a58425]">
            {" "}
            BanglesMart{" "}
          </span>{" "}
          <span className="h-px w-10 bg-[#c9a227]" />{" "}
        </div>{" "}
        {/* Header */}{" "}
        <div className="max-w-4xl">
          {" "}
          <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-[#b08c25]">
            {" "}
            DELIVERY & SHIPPING{" "}
          </p>{" "}
          <h1 className="mt-5 font-serif text-5xl font-normal leading-[1.02] tracking-[-0.035em] text-[#201914] sm:text-6xl lg:text-7xl">
            {" "}
            Shipping <br /> Information{" "}
          </h1>{" "}
          <div className="mt-8 flex items-center gap-3">
            {" "}
            <span className="h-px w-14 bg-[#c9a227]" />{" "}
            <span className="relative flex h-3 w-3 items-center justify-center">
              {" "}
              <span className="absolute h-2 w-2 rotate-45 border border-[#c9a227]" />{" "}
            </span>{" "}
            <span className="h-px w-14 bg-[#c9a227]" />{" "}
          </div>{" "}
          <p className="mt-8 max-w-2xl text-sm leading-7 text-[#756a61] sm:text-base sm:leading-8">
            {" "}
            We want every BanglesMart order to reach you safely, beautifully
            packed and right on time. Here’s everything you need to know about
            our shipping and delivery process.{" "}
          </p>{" "}
        </div>{" "}
        {/* Shipping highlight */}{" "}
        <div className="mt-14 grid gap-5 sm:grid-cols-3 lg:mt-20">
          {" "}
          <ShippingHighlight
            number="01"
            title="Fast Dispatch"
            text="Most orders are carefully packed and dispatched within 1–2 business days."
          />{" "}
          <ShippingHighlight
            number="02"
            title="Secure Delivery"
            text="Your jewellery is packed securely to help protect it throughout its journey."
          />{" "}
          <ShippingHighlight
            number="03"
            title="Track Your Order"
            text="Once your order is dispatched, tracking details become available in your order details."
          />{" "}
        </div>{" "}
        {/* Main content */}{" "}
        <div className="mt-7 grid gap-7 lg:mt-10 lg:grid-cols-[1.15fr_0.85fr]">
          {" "}
          {/* Shipping details */}{" "}
          <div className="rounded-[30px] border border-[#e3d8ca] bg-white p-7 shadow-[0_20px_65px_rgba(54,40,25,0.055)] sm:p-10">
            {" "}
            <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-[#a58425]">
              {" "}
              Delivery details{" "}
            </p>{" "}
            <h2 className="mt-3 font-serif text-3xl text-[#29211c]">
              {" "}
              What to expect{" "}
            </h2>{" "}
            <div className="mt-8 space-y-8">
              {" "}
              <ShippingRow
                title="Order Processing"
                text="Once your order is confirmed, our team prepares your jewellery for dispatch. Orders are generally processed within 1–2 business days."
              />{" "}
              <ShippingRow
                title="Estimated Delivery"
                text="Standard delivery generally takes approximately 3–7 business days after dispatch, depending on your location and courier availability."
              />{" "}
              <ShippingRow
                title="Shipping Charges"
                text="Applicable shipping charges are calculated at checkout based on the current store configuration, order value and delivery location."
              />{" "}
              <ShippingRow
                title="Free Shipping"
                text="Eligible orders may qualify for free shipping when the applicable minimum order value is reached. The current threshold is automatically reflected at checkout."
              />{" "}
              <ShippingRow
                title="Tracking"
                text="After dispatch, tracking information is added to your order details when available. You can use the tracking information to follow your package’s journey."
              />{" "}
            </div>{" "}
          </div>{" "}
          {/* Premium side card */}{" "}
          <div className="relative overflow-hidden rounded-[30px] bg-[#211a16] p-8 shadow-[0_30px_80px_rgba(54,40,25,0.12)] sm:p-10">
            {" "}
            {/* Decorative rings */}{" "}
            <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full border border-[#c9a227]/20" />{" "}
            <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full border border-[#c9a227]/15" />{" "}
            <div className="relative">
              {" "}
              <div className="flex h-11 w-11 items-center justify-center rounded-full border border-[#c9a227]/40 text-[#c9a227]">
                {" "}
                <span className="text-lg">✦</span>{" "}
              </div>{" "}
              <p className="mt-8 text-[9px] font-bold uppercase tracking-[0.32em] text-[#c9a227]">
                {" "}
                Our promise{" "}
              </p>{" "}
              <h2 className="mt-4 font-serif text-3xl leading-tight text-[#fffaf3] sm:text-4xl">
                {" "}
                From our hands <br /> to yours.{" "}
              </h2>{" "}
              <p className="mt-6 text-sm leading-7 text-[#c8beb5]">
                {" "}
                Every piece deserves to arrive looking as beautiful as it did
                when you chose it. We take care in packing every order so your
                jewellery reaches you safely.{" "}
              </p>{" "}
              <div className="mt-10 space-y-5 border-t border-white/10 pt-7">
                {" "}
                <PromiseItem text="Carefully packed orders" />{" "}
                <PromiseItem text="Secure courier handling" />{" "}
                <PromiseItem text="Order tracking after dispatch" />{" "}
              </div>{" "}
            </div>{" "}
          </div>{" "}
        </div>{" "}
        {/* Delivery timeline */}{" "}
        <section className="mt-7 rounded-[30px] border border-[#e3d8ca] bg-white p-7 shadow-[0_20px_65px_rgba(54,40,25,0.045)] sm:p-10 lg:mt-10">
          {" "}
          <div className="max-w-2xl">
            {" "}
            <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-[#a58425]">
              {" "}
              THE JOURNEY{" "}
            </p>{" "}
            <h2 className="mt-3 font-serif text-3xl text-[#29211c]">
              {" "}
              From checkout to doorstep{" "}
            </h2>{" "}
          </div>{" "}
          <div className="mt-10 grid gap-8 md:grid-cols-4">
            {" "}
            <TimelineStep
              number="01"
              title="Order Placed"
              text="Your order is confirmed and sent to our team."
            />{" "}
            <TimelineStep
              number="02"
              title="Packed"
              text="Your jewellery is carefully checked and packed."
            />{" "}
            <TimelineStep
              number="03"
              title="Dispatched"
              text="Your parcel leaves our facility with the courier."
            />{" "}
            <TimelineStep
              number="04"
              title="Delivered"
              text="Your order arrives safely at your doorstep."
            />{" "}
          </div>{" "}
        </section>{" "}
        {/* Important notes */}{" "}
        <section className="mt-7 border-t border-[#ded3c5] pt-10 sm:mt-10">
          {" "}
          <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
            {" "}
            <div>
              {" "}
              <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-[#a58425]">
                {" "}
                PLEASE NOTE{" "}
              </p>{" "}
              <h2 className="mt-3 font-serif text-3xl text-[#302720]">
                {" "}
                A few things to keep in mind{" "}
              </h2>{" "}
            </div>{" "}
            <div className="space-y-5 text-sm leading-7 text-[#756a61]">
              {" "}
              <p>
                {" "}
                Delivery timelines are estimates and may vary depending on your
                location, courier service, weather conditions, holidays or other
                circumstances outside our control.{" "}
              </p>{" "}
              <p>
                {" "}
                Please make sure your delivery address and contact number are
                accurate before placing your order. Incorrect or incomplete
                details may cause delivery delays.{" "}
              </p>{" "}
              <p>
                {" "}
                If tracking information is not immediately visible after placing
                your order, please allow some time for the courier information
                to be updated after dispatch.{" "}
              </p>{" "}
            </div>{" "}
          </div>{" "}
        </section>{" "}
        {/* Bottom statement */}{" "}
        <div className="mt-16 border-t border-[#ded3c5] pt-8 sm:mt-20 sm:pt-10">
          {" "}
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            {" "}
            <p className="max-w-xl font-serif text-xl leading-8 text-[#3b312a] sm:text-2xl">
              {" "}
              Beautiful pieces,{" "}
              <span className="text-[#a58425]">
                {" "}
                carefully delivered.{" "}
              </span>{" "}
            </p>{" "}
            <div className="flex items-center gap-3 text-[9px] font-bold uppercase tracking-[0.28em] text-[#9b8d80]">
              {" "}
              <span className="h-px w-8 bg-[#c9a227]" /> BanglesMart{" "}
            </div>{" "}
          </div>{" "}
        </div>{" "}
      </div>{" "}
    </main>
  );
}
/* ========================================================================== SHIPPING HIGHLIGHT ========================================================================== */ function ShippingHighlight({
  number,
  title,
  text,
}: {
  number: string;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-[26px] border border-[#e3d8ca] bg-white p-6 shadow-[0_15px_45px_rgba(54,40,25,0.04)] sm:p-7">
      {" "}
      <div className="flex items-center justify-between">
        {" "}
        <span className="text-[9px] font-bold tracking-[0.2em] text-[#c9a227]">
          {" "}
          {number}{" "}
        </span>{" "}
        <span className="h-px w-10 bg-[#d8c6a0]" />{" "}
      </div>{" "}
      <h3 className="mt-8 font-serif text-2xl text-[#29211c]"> {title} </h3>{" "}
      <p className="mt-3 text-sm leading-7 text-[#80756c]"> {text} </p>{" "}
    </div>
  );
}
/* ========================================================================== SHIPPING ROW ========================================================================== */ function ShippingRow({
  title,
  text,
}: {
  title: string;
  text: string;
}) {
  return (
    <div className="flex gap-4 border-b border-[#eee5da] pb-7 last:border-0 last:pb-0">
      {" "}
      <div className="mt-1.5 h-2 w-2 shrink-0 rotate-45 bg-[#c9a227]" />{" "}
      <div>
        {" "}
        <h3 className="font-serif text-xl text-[#332a24]"> {title} </h3>{" "}
        <p className="mt-2 text-sm leading-7 text-[#7b7068]"> {text} </p>{" "}
      </div>{" "}
    </div>
  );
}
/* ========================================================================== PROMISE ITEM ========================================================================== */ function PromiseItem({
  text,
}: {
  text: string;
}) {
  return (
    <div className="flex items-center gap-3">
      {" "}
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-[#c9a227]/40 text-[#c9a227]">
        {" "}
        <span className="text-[10px]">✓</span>{" "}
      </span>{" "}
      <span className="text-xs font-medium text-[#d1c7bf]"> {text} </span>{" "}
    </div>
  );
}
/* ========================================================================== TIMELINE STEP ========================================================================== */ function TimelineStep({
  number,
  title,
  text,
}: {
  number: string;
  title: string;
  text: string;
}) {
  return (
    <div className="relative">
      {" "}
      <div className="flex items-center gap-3">
        {" "}
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#f7efe4] text-[9px] font-bold tracking-[0.12em] text-[#a58425]">
          {" "}
          {number}{" "}
        </span>{" "}
        <span className="hidden h-px flex-1 bg-[#e5dbcf] md:block" />{" "}
      </div>{" "}
      <h3 className="mt-5 font-serif text-xl text-[#302720]"> {title} </h3>{" "}
      <p className="mt-2 text-xs leading-6 text-[#82766d]"> {text} </p>{" "}
    </div>
  );
}
