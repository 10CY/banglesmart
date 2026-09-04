export default function ContactPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f8f3eb] text-[#211b17]">
      {" "}
      {/* Decorative background elements */}{" "}
      <div className="pointer-events-none absolute -left-32 top-20 h-80 w-80 rounded-full border border-[#c9a227]/10" />{" "}
      <div className="pointer-events-none absolute -left-24 top-28 h-64 w-64 rounded-full border border-[#c9a227]/10" />{" "}
      <div className="pointer-events-none absolute -right-40 bottom-0 h-[520px] w-[520px] rounded-full border border-[#c9a227]/10" />{" "}
      <div className="relative mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-24 lg:px-10 lg:py-28">
        {" "}
        {/* Top brand line */}{" "}
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
        <div className="max-w-3xl">
          {" "}
          <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-[#b08c25]">
            {" "}
            CUSTOMER CARE{" "}
          </p>{" "}
          <h1 className="mt-5 font-serif text-5xl font-normal leading-[1.02] tracking-[-0.035em] text-[#201914] sm:text-6xl lg:text-7xl">
            {" "}
            Contact Us{" "}
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
            Have a question about an order, product or delivery? Our customer
            care team is here to help make your BanglesMart experience
            effortless.{" "}
          </p>{" "}
        </div>{" "}
        {/* Main contact layout */}{" "}
        <div className="mt-14 grid gap-7 lg:mt-20 lg:grid-cols-[1.15fr_0.85fr]">
          {" "}
          {/* Contact cards */}{" "}
          <div className="grid gap-5 sm:grid-cols-2">
            {" "}
            <ContactCard
              number="01"
              label="Email"
              title="Write to us"
              value="support@banglesmart.com"
              description="For orders, products, returns and general assistance."
            />{" "}
            <ContactCard
              number="02"
              label="Phone"
              title="Call our team"
              value="+91 00000 00000"
              description="Speak with our customer care team for quick assistance."
            />{" "}
          </div>{" "}
          {/* Premium message card */}{" "}
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
                We're here for you{" "}
              </p>{" "}
              <h2 className="mt-4 max-w-md font-serif text-3xl font-normal leading-tight text-[#fffaf3] sm:text-4xl">
                {" "}
                Every beautiful <br /> experience starts <br /> with care.{" "}
              </h2>{" "}
              <p className="mt-6 max-w-md text-sm leading-7 text-[#c8beb5]">
                {" "}
                Whether you need help choosing the perfect bangle or have a
                question about an existing order, we're happy to assist.{" "}
              </p>{" "}
              <div className="mt-9 flex items-center gap-3">
                {" "}
                <span className="h-px w-10 bg-[#c9a227]" />{" "}
                <span className="text-[9px] font-bold uppercase tracking-[0.25em] text-[#c9a227]">
                  {" "}
                  BanglesMart Customer Care{" "}
                </span>{" "}
              </div>{" "}
            </div>{" "}
          </div>{" "}
        </div>{" "}
        {/* Support note */}{" "}
        <div className="mt-14 border-t border-[#ded3c5] pt-8 sm:mt-20 sm:pt-10">
          {" "}
          <div className="grid gap-6 sm:grid-cols-3">
            {" "}
            <SupportPoint
              title="Orders"
              text="Need help with an existing purchase?"
            />{" "}
            <SupportPoint
              title="Products"
              text="Looking for the perfect design or size?"
            />{" "}
            <SupportPoint
              title="Support"
              text="We're here to make your experience easy."
            />{" "}
          </div>{" "}
        </div>{" "}
      </div>{" "}
    </main>
  );
}
/* ========================================================================== CONTACT CARD ========================================================================== */ function ContactCard({
  number,
  label,
  title,
  value,
  description,
}: {
  number: string;
  label: string;
  title: string;
  value: string;
  description: string;
}) {
  return (
    <div className="group relative overflow-hidden rounded-[30px] border border-[#e3d8ca] bg-white p-7 shadow-[0_18px_55px_rgba(54,40,25,0.055)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_25px_65px_rgba(54,40,25,0.09)] sm:p-8">
      {" "}
      {/* Number */}{" "}
      <div className="flex items-center justify-between">
        {" "}
        <span className="text-[9px] font-bold tracking-[0.2em] text-[#c9a227]">
          {" "}
          {number}{" "}
        </span>{" "}
        <span className="h-px w-10 bg-[#d8c6a0] transition-all duration-300 group-hover:w-16" />{" "}
      </div>{" "}
      <p className="mt-10 text-[9px] font-bold uppercase tracking-[0.28em] text-[#a18d72]">
        {" "}
        {label}{" "}
      </p>{" "}
      <h2 className="mt-3 font-serif text-2xl text-[#29211c]"> {title} </h2>{" "}
      <p className="mt-5 break-words text-base font-semibold text-[#8d1530]">
        {" "}
        {value}{" "}
      </p>{" "}
      <p className="mt-4 text-sm leading-7 text-[#80756c]"> {description} </p>{" "}
      <div className="mt-8 h-px w-full bg-[#eee5da]" />{" "}
      <p className="mt-4 text-[9px] font-semibold uppercase tracking-[0.18em] text-[#a59a91]">
        {" "}
        BanglesMart Customer Care{" "}
      </p>{" "}
    </div>
  );
}
/* ========================================================================== SUPPORT POINT ========================================================================== */ function SupportPoint({
  title,
  text,
}: {
  title: string;
  text: string;
}) {
  return (
    <div className="border-l border-[#c9a227]/50 pl-5">
      {" "}
      <p className="font-serif text-xl text-[#302720]"> {title} </p>{" "}
      <p className="mt-2 max-w-xs text-xs leading-6 text-[#81766d]">
        {" "}
        {text}{" "}
      </p>{" "}
    </div>
  );
}
