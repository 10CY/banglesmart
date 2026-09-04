export default function ReturnsPage() {
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
            CUSTOMER CARE{" "}
          </p>{" "}
          <h1 className="mt-5 font-serif text-5xl font-normal leading-[1.02] tracking-[-0.035em] text-[#201914] sm:text-6xl lg:text-7xl">
            {" "}
            Returns <br /> & Refunds{" "}
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
            We want you to love every piece you receive. If something isn’t
            quite right, here’s a simple guide to our returns and refund
            process.{" "}
          </p>{" "}
        </div>{" "}
        {/* Quick highlights */}{" "}
        <div className="mt-14 grid gap-5 sm:grid-cols-3 lg:mt-20">
          {" "}
          <ReturnHighlight
            number="01"
            title="Easy Requests"
            text="Contact our customer care team with your order details to start a return request."
          />{" "}
          <ReturnHighlight
            number="02"
            title="Quality Check"
            text="Returned products are inspected before a return or refund is approved."
          />{" "}
          <ReturnHighlight
            number="03"
            title="Secure Refunds"
            text="Approved refunds are processed through the original payment method where supported."
          />{" "}
        </div>{" "}
        {/* Main content */}{" "}
        <div className="mt-7 grid gap-7 lg:mt-10 lg:grid-cols-[1.15fr_0.85fr]">
          {" "}
          {/* Return policy */}{" "}
          <div className="rounded-[30px] border border-[#e3d8ca] bg-white p-7 shadow-[0_20px_65px_rgba(54,40,25,0.055)] sm:p-10">
            {" "}
            <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-[#a58425]">
              {" "}
              RETURN POLICY{" "}
            </p>{" "}
            <h2 className="mt-3 font-serif text-3xl text-[#29211c]">
              {" "}
              Before you return{" "}
            </h2>{" "}
            <div className="mt-8 space-y-8">
              {" "}
              <PolicyRow
                title="Eligibility"
                text="Items must generally be unused, unworn and in their original condition with the original packaging and tags intact."
              />{" "}
              <PolicyRow
                title="Return Window"
                text="Return requests can typically be raised within 7 days of delivery. The applicable return window may vary by product or order."
              />{" "}
              <PolicyRow
                title="Product Condition"
                text="Products showing signs of wear, damage, alteration or misuse may not qualify for a return or refund."
              />{" "}
              <PolicyRow
                title="Original Packaging"
                text="Please retain the original packaging and accessories until you are completely satisfied with your purchase."
              />{" "}
              <PolicyRow
                title="Non-Returnable Items"
                text="Certain products may be marked as final sale or non-returnable. Product-specific return conditions will take priority."
              />{" "}
            </div>{" "}
          </div>{" "}
          {/* Dark premium card */}{" "}
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
                Our approach{" "}
              </p>{" "}
              <h2 className="mt-4 font-serif text-3xl leading-tight text-[#fffaf3] sm:text-4xl">
                {" "}
                Your satisfaction <br /> matters.{" "}
              </h2>{" "}
              <p className="mt-6 text-sm leading-7 text-[#c8beb5]">
                {" "}
                Every return is reviewed carefully so we can make the process as
                clear and straightforward as possible.{" "}
              </p>{" "}
              <div className="mt-10 space-y-5 border-t border-white/10 pt-7">
                {" "}
                <PromiseItem text="Simple return assistance" />{" "}
                <PromiseItem text="Careful product inspection" />{" "}
                <PromiseItem text="Transparent refund process" />{" "}
              </div>{" "}
            </div>{" "}
          </div>{" "}
        </div>{" "}
        {/* Return process */}{" "}
        <section className="mt-7 rounded-[30px] border border-[#e3d8ca] bg-white p-7 shadow-[0_20px_65px_rgba(54,40,25,0.045)] sm:p-10 lg:mt-10">
          {" "}
          <div className="max-w-2xl">
            {" "}
            <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-[#a58425]">
              {" "}
              THE PROCESS{" "}
            </p>{" "}
            <h2 className="mt-3 font-serif text-3xl text-[#29211c]">
              {" "}
              How returns work{" "}
            </h2>{" "}
            <p className="mt-4 text-sm leading-7 text-[#7b7068]">
              {" "}
              We’ve kept the process simple. Follow these steps if you need
              assistance with a delivered order.{" "}
            </p>{" "}
          </div>{" "}
          <div className="mt-10 grid gap-8 md:grid-cols-4">
            {" "}
            <ProcessStep
              number="01"
              title="Contact Us"
              text="Reach out to customer care with your order number."
            />{" "}
            <ProcessStep
              number="02"
              title="Request Review"
              text="Our team reviews the return request and eligibility."
            />{" "}
            <ProcessStep
              number="03"
              title="Product Pickup"
              text="If approved, pickup or return instructions are shared."
            />{" "}
            <ProcessStep
              number="04"
              title="Refund"
              text="Once approved, your eligible refund is processed."
            />{" "}
          </div>{" "}
        </section>{" "}
        {/* Refund information */}{" "}
        <section className="mt-7 grid gap-7 lg:grid-cols-2 lg:mt-10">
          {" "}
          <InfoCard
            eyebrow="REFUNDS"
            title="When will I receive my refund?"
            text="Once your returned item has been received and successfully inspected, an approved refund is generally initiated within 3–5 business days. The time taken for the amount to appear in your account may depend on your bank or payment provider."
          />{" "}
          <InfoCard
            eyebrow="EXCHANGES"
            title="Need a different piece?"
            text="If your order is eligible for exchange, contact our customer care team with your order number. Availability of the requested product, size or colour may determine whether an exchange can be processed."
          />{" "}
        </section>{" "}
        {/* Important notes */}{" "}
        <section className="mt-14 border-t border-[#ded3c5] pt-10 sm:mt-20 sm:pt-12">
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
                A few important details{" "}
              </h2>{" "}
            </div>{" "}
            <div className="space-y-5 text-sm leading-7 text-[#756a61]">
              {" "}
              <p>
                {" "}
                Return eligibility is subject to the condition of the product
                and the policy applicable to your order.{" "}
              </p>{" "}
              <p>
                {" "}
                Please keep your order number available when contacting customer
                care. It helps us locate your purchase and assist you
                faster.{" "}
              </p>{" "}
              <p>
                {" "}
                Refund timelines are estimates and can vary depending on the
                payment method, bank or payment provider.{" "}
              </p>{" "}
              <p>
                {" "}
                This page contains general return information. Product-specific
                terms shown during checkout or on the product page may
                apply.{" "}
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
              Shop with confidence,{" "}
              <span className="text-[#a58425]"> wear it with joy. </span>{" "}
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
/* ========================================================================== RETURN HIGHLIGHT ========================================================================== */ function ReturnHighlight({
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
/* ========================================================================== POLICY ROW ========================================================================== */ function PolicyRow({
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
/* ========================================================================== PROCESS STEP ========================================================================== */ function ProcessStep({
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
/* ========================================================================== INFO CARD ========================================================================== */ function InfoCard({
  eyebrow,
  title,
  text,
}: {
  eyebrow: string;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-[30px] border border-[#e3d8ca] bg-white p-7 shadow-[0_20px_65px_rgba(54,40,25,0.045)] sm:p-9">
      {" "}
      <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-[#a58425]">
        {" "}
        {eyebrow}{" "}
      </p>{" "}
      <h2 className="mt-3 font-serif text-2xl text-[#29211c] sm:text-3xl">
        {" "}
        {title}{" "}
      </h2>{" "}
      <p className="mt-5 text-sm leading-7 text-[#7b7068]"> {text} </p>{" "}
    </div>
  );
}
