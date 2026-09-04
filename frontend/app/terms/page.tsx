export default function TermsPage() {
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
            LEGAL & STORE POLICIES{" "}
          </p>{" "}
          <h1 className="mt-5 font-serif text-5xl font-normal leading-[1.02] tracking-[-0.035em] text-[#201914] sm:text-6xl lg:text-7xl">
            {" "}
            Terms & <br /> Conditions{" "}
          </h1>{" "}
          {/* Gold ornament */}{" "}
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
            By using BanglesMart, you agree to use our website responsibly and
            to follow the terms that apply to browsing, purchasing, payment,
            delivery and returns.{" "}
          </p>{" "}
        </div>{" "}
        {/* Quick overview */}{" "}
        <div className="mt-14 grid gap-5 sm:grid-cols-3 lg:mt-20">
          {" "}
          <TermsHighlight
            number="01"
            title="Use Responsibly"
            text="Please provide accurate information and use the website lawfully."
          />{" "}
          <TermsHighlight
            number="02"
            title="Shop Clearly"
            text="Product, pricing and availability information may be updated from time to time."
          />{" "}
          <TermsHighlight
            number="03"
            title="Order Policies"
            text="Checkout terms, payment, shipping and returns form part of your purchase."
          />{" "}
        </div>{" "}
        {/* Main terms */}{" "}
        <div className="mt-7 grid gap-7 lg:mt-10 lg:grid-cols-[1.15fr_0.85fr]">
          {" "}
          {/* Terms content */}{" "}
          <div className="rounded-[30px] border border-[#e3d8ca] bg-white p-7 shadow-[0_20px_65px_rgba(54,40,25,0.055)] sm:p-10">
            {" "}
            <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-[#a58425]">
              {" "}
              TERMS OF USE{" "}
            </p>{" "}
            <h2 className="mt-3 font-serif text-3xl text-[#29211c]">
              {" "}
              Using BanglesMart{" "}
            </h2>{" "}
            <div className="mt-8 space-y-8">
              {" "}
              <TermsSection
                number="01"
                title="Acceptance of Terms"
                text="By accessing or using the BanglesMart website, you acknowledge that you have read and agree to these Terms & Conditions and any policies referenced on the website."
              />{" "}
              <TermsSection
                number="02"
                title="Account Information"
                text="If you create an account, you are responsible for providing accurate and current information. Please keep your account credentials secure and notify us if you believe your account has been accessed without permission."
              />{" "}
              <TermsSection
                number="03"
                title="Product Information"
                text="We make reasonable efforts to display product descriptions, images, colours, sizes and prices accurately. Product availability, pricing and other details may change without prior notice."
              />{" "}
              <TermsSection
                number="04"
                title="Placing an Order"
                text="When you place an order, you are requesting to purchase the selected products at the applicable price and according to the available payment, shipping, cancellation and return terms."
              />{" "}
              <TermsSection
                number="05"
                title="Pricing & Payments"
                text="Prices displayed on the website are subject to change. Applicable shipping charges, discounts and other amounts are shown during checkout. Payment processing may be handled by the payment provider selected for the order."
              />{" "}
              <TermsSection
                number="06"
                title="Shipping & Delivery"
                text="Delivery timelines and shipping charges depend on the applicable store configuration, delivery location and courier availability. Please refer to the Shipping Information page for general delivery details."
              />{" "}
              <TermsSection
                number="07"
                title="Cancellation & Returns"
                text="Order cancellation and return eligibility are governed by the applicable store policies. Please review the Returns & Refunds information before requesting a cancellation, return or refund."
              />{" "}
              <TermsSection
                number="08"
                title="Prohibited Use"
                text="You agree not to misuse the website, interfere with its operation, attempt unauthorized access, provide fraudulent information or use the service for unlawful purposes."
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
                Our principle{" "}
              </p>{" "}
              <h2 className="mt-4 font-serif text-3xl leading-tight text-[#fffaf3] sm:text-4xl">
                {" "}
                Clear terms. <br /> Better shopping.{" "}
              </h2>{" "}
              <p className="mt-6 text-sm leading-7 text-[#c8beb5]">
                {" "}
                We believe the shopping experience should be straightforward.
                Our policies are designed to make expectations clear from the
                moment you browse to the moment your order arrives.{" "}
              </p>{" "}
              <div className="mt-10 space-y-5 border-t border-white/10 pt-7">
                {" "}
                <TermsPoint text="Transparent store policies" />{" "}
                <TermsPoint text="Clear checkout information" />{" "}
                <TermsPoint text="Customer-focused support" />{" "}
              </div>{" "}
            </div>{" "}
          </div>{" "}
        </div>{" "}
        {/* Purchase policies */}{" "}
        <section className="mt-7 rounded-[30px] border border-[#e3d8ca] bg-white p-7 shadow-[0_20px_65px_rgba(54,40,25,0.045)] sm:p-10 lg:mt-10">
          {" "}
          <div className="max-w-2xl">
            {" "}
            <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-[#a58425]">
              {" "}
              YOUR PURCHASE{" "}
            </p>{" "}
            <h2 className="mt-3 font-serif text-3xl text-[#29211c]">
              {" "}
              Policies that apply to your order{" "}
            </h2>{" "}
            <p className="mt-4 text-sm leading-7 text-[#7b7068]">
              {" "}
              The following areas are important when completing a purchase
              through BanglesMart.{" "}
            </p>{" "}
          </div>{" "}
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {" "}
            <PolicyCard
              title="Payment"
              text="Applicable payment options and charges are displayed during checkout."
            />{" "}
            <PolicyCard
              title="Shipping"
              text="Shipping charges and estimated delivery information are shown according to the current store configuration."
            />{" "}
            <PolicyCard
              title="Returns"
              text="Return eligibility and refunds are subject to the applicable Returns & Refunds policy."
            />{" "}
          </div>{" "}
        </section>{" "}
        {/* Intellectual property */}{" "}
        <section className="mt-7 grid gap-7 lg:grid-cols-2 lg:mt-10">
          {" "}
          <InfoCard
            eyebrow="WEBSITE CONTENT"
            title="Our content"
            text="Website content including product imagery, graphics, logos, text, layouts and other materials may belong to BanglesMart or its respective owners. Content should not be copied, reproduced or commercially reused without appropriate permission."
          />{" "}
          <InfoCard
            eyebrow="AVAILABILITY"
            title="Website availability"
            text="We aim to keep BanglesMart available and functioning smoothly, but temporary interruptions may occur because of maintenance, technical issues, service providers or circumstances outside our control."
          />{" "}
        </section>{" "}
        {/* Changes & contact */}{" "}
        <section className="mt-7 border-t border-[#ded3c5] pt-10 sm:mt-10 sm:pt-12">
          {" "}
          <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
            {" "}
            <div>
              {" "}
              <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-[#a58425]">
                {" "}
                UPDATES{" "}
              </p>{" "}
              <h2 className="mt-3 font-serif text-3xl text-[#302720]">
                {" "}
                Changes to these terms{" "}
              </h2>{" "}
            </div>{" "}
            <div className="space-y-5 text-sm leading-7 text-[#756a61]">
              {" "}
              <p>
                {" "}
                BanglesMart may update these Terms & Conditions from time to
                time to reflect changes to our website, services, policies or
                applicable requirements.{" "}
              </p>{" "}
              <p>
                {" "}
                The latest version will be published on this page. Continued use
                of the website after an update means you accept the updated
                terms.{" "}
              </p>{" "}
              <p>
                {" "}
                If you have questions about these terms or your order, please
                contact BanglesMart customer care.{" "}
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
              Simple terms,{" "}
              <span className="text-[#a58425]">
                {" "}
                a confident shopping experience.{" "}
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
/* ========================================================================== TERMS HIGHLIGHT ========================================================================== */ function TermsHighlight({
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
/* ========================================================================== TERMS SECTION ========================================================================== */ function TermsSection({
  number,
  title,
  text,
}: {
  number: string;
  title: string;
  text: string;
}) {
  return (
    <div className="flex gap-4 border-b border-[#eee5da] pb-7 last:border-0 last:pb-0">
      {" "}
      <span className="mt-1 text-[9px] font-bold tracking-[0.18em] text-[#c9a227]">
        {" "}
        {number}{" "}
      </span>{" "}
      <div>
        {" "}
        <h3 className="font-serif text-xl text-[#332a24]"> {title} </h3>{" "}
        <p className="mt-2 text-sm leading-7 text-[#7b7068]"> {text} </p>{" "}
      </div>{" "}
    </div>
  );
}
/* ========================================================================== DARK CARD POINT ========================================================================== */ function TermsPoint({
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
/* ========================================================================== POLICY CARD ========================================================================== */ function PolicyCard({
  title,
  text,
}: {
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-2xl bg-[#fcf9f5] p-6">
      {" "}
      <div className="flex items-center gap-3">
        {" "}
        <span className="h-2 w-2 rotate-45 bg-[#c9a227]" />{" "}
        <h3 className="font-serif text-xl text-[#302720]"> {title} </h3>{" "}
      </div>{" "}
      <p className="mt-3 text-sm leading-7 text-[#7b7068]"> {text} </p>{" "}
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
