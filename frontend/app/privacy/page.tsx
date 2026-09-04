export default function PrivacyPage() {
  return (
    <Policy
      title="Privacy Policy"
      eyebrow="BANGLESMART · YOUR PRIVACY"
      intro="Your trust matters to us. This policy explains how BanglesMart collects, uses and protects information when you browse our website, create an account or place an order."
    />
  );
}
function Policy({
  title,
  eyebrow,
  intro,
}: {
  title: string;
  eyebrow: string;
  intro: string;
}) {
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
            {eyebrow}{" "}
          </p>{" "}
          <h1 className="mt-5 font-serif text-5xl font-normal leading-[1.02] tracking-[-0.035em] text-[#201914] sm:text-6xl lg:text-7xl">
            {" "}
            {title}{" "}
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
            {intro}{" "}
          </p>{" "}
        </div>{" "}
        {/* Privacy highlights */}{" "}
        <div className="mt-14 grid gap-5 sm:grid-cols-3 lg:mt-20">
          {" "}
          <PrivacyHighlight
            number="01"
            title="Your Information"
            text="We only use customer information for legitimate store and order-related purposes."
          />{" "}
          <PrivacyHighlight
            number="02"
            title="Secure Payments"
            text="Payment credentials are handled by the selected payment provider."
          />{" "}
          <PrivacyHighlight
            number="03"
            title="Your Control"
            text="You can contact us regarding your account information or privacy questions."
          />{" "}
        </div>{" "}
        {/* Main policy */}{" "}
        <div className="mt-7 grid gap-7 lg:mt-10 lg:grid-cols-[1.15fr_0.85fr]">
          {" "}
          {/* Policy content */}{" "}
          <div className="rounded-[30px] border border-[#e3d8ca] bg-white p-7 shadow-[0_20px_65px_rgba(54,40,25,0.055)] sm:p-10">
            {" "}
            <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-[#a58425]">
              {" "}
              PRIVACY DETAILS{" "}
            </p>{" "}
            <h2 className="mt-3 font-serif text-3xl text-[#29211c]">
              {" "}
              How we handle your information{" "}
            </h2>{" "}
            <div className="mt-8 space-y-8">
              {" "}
              <PolicySection
                number="01"
                title="Information We Collect"
                text="When you create an account, place an order or contact customer care, we may collect information such as your name, phone number, email address, delivery address and order details."
              />{" "}
              <PolicySection
                number="02"
                title="How We Use Information"
                text="Customer information may be used to process and deliver orders, manage accounts, provide customer support, improve the shopping experience and send important updates relating to your orders."
              />{" "}
              <PolicySection
                number="03"
                title="Payment Information"
                text="Payment credentials are handled by the selected payment provider. BanglesMart does not store payment credentials as plain text on the storefront."
              />{" "}
              <PolicySection
                number="04"
                title="Order Communications"
                text="We may contact you through the details associated with your account to provide important information about an order, including confirmation, dispatch, delivery or other service-related updates."
              />{" "}
              <PolicySection
                number="05"
                title="Account Information"
                text="If you create an account, information associated with your account may be used to provide account features such as order history, saved addresses and other customer services."
              />{" "}
              <PolicySection
                number="06"
                title="Store Experience"
                text="We may use relevant information and technical data to understand how customers interact with the website, maintain website functionality and improve the overall shopping experience."
              />{" "}
            </div>{" "}
          </div>{" "}
          {/* Dark privacy card */}{" "}
          <div className="relative overflow-hidden rounded-[30px] bg-[#211a16] p-8 shadow-[0_30px_80px_rgba(54,40,25,0.12)] sm:p-10">
            {" "}
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
                Our commitment{" "}
              </p>{" "}
              <h2 className="mt-4 font-serif text-3xl leading-tight text-[#fffaf3] sm:text-4xl">
                {" "}
                Your trust <br /> comes first.{" "}
              </h2>{" "}
              <p className="mt-6 text-sm leading-7 text-[#c8beb5]">
                {" "}
                We believe privacy should be simple and transparent. Your
                information helps us provide the services you expect from
                BanglesMart while keeping your shopping experience smooth and
                secure.{" "}
              </p>{" "}
              <div className="mt-10 space-y-5 border-t border-white/10 pt-7">
                {" "}
                <PrivacyPoint text="Responsible use of customer information" />{" "}
                <PrivacyPoint text="Secure handling of account data" />{" "}
                <PrivacyPoint text="Trusted payment processing" />{" "}
              </div>{" "}
            </div>{" "}
          </div>{" "}
        </div>{" "}
        {/* Cookies & security */}{" "}
        <div className="mt-7 grid gap-7 lg:grid-cols-2 lg:mt-10">
          {" "}
          <InfoCard
            eyebrow="COOKIES"
            title="Website cookies"
            text="BanglesMart may use cookies and similar technologies to support essential website functionality, remember preferences, understand website usage and improve the shopping experience."
          />{" "}
          <InfoCard
            eyebrow="SECURITY"
            title="Keeping information protected"
            text="We take reasonable measures to protect customer information and limit access to information to appropriate systems, service providers and personnel where required to operate the store."
          />{" "}
        </div>{" "}
        {/* Third-party services */}{" "}
        <section className="mt-7 rounded-[30px] border border-[#e3d8ca] bg-white p-7 shadow-[0_20px_65px_rgba(54,40,25,0.045)] sm:p-10 lg:mt-10">
          {" "}
          <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-[#a58425]">
            {" "}
            THIRD-PARTY SERVICES{" "}
          </p>{" "}
          <h2 className="mt-3 font-serif text-3xl text-[#29211c]">
            {" "}
            Services that help us operate{" "}
          </h2>{" "}
          <p className="mt-5 max-w-4xl text-sm leading-7 text-[#756a61]">
            {" "}
            BanglesMart may work with trusted third-party service providers for
            functions such as payment processing, shipping, analytics, website
            infrastructure and customer communication. These providers may
            process information necessary to perform their services.{" "}
          </p>{" "}
        </section>{" "}
        {/* User rights */}{" "}
        <section className="mt-7 border-t border-[#ded3c5] pt-10 sm:mt-10 sm:pt-12">
          {" "}
          <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
            {" "}
            <div>
              {" "}
              <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-[#a58425]">
                {" "}
                YOUR OPTIONS{" "}
              </p>{" "}
              <h2 className="mt-3 font-serif text-3xl text-[#302720]">
                {" "}
                Questions about your data?{" "}
              </h2>{" "}
            </div>{" "}
            <div className="space-y-5 text-sm leading-7 text-[#756a61]">
              {" "}
              <p>
                {" "}
                If you have questions about the information associated with your
                account or how your information is used, please contact
                BanglesMart customer care.{" "}
              </p>{" "}
              <p>
                {" "}
                When contacting us about privacy, please provide sufficient
                information for us to understand your request without
                unnecessarily sharing sensitive information.{" "}
              </p>{" "}
              <p>
                {" "}
                This policy may be updated from time to time as our services,
                website features or applicable requirements change. The latest
                version will be published on this page.{" "}
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
              Privacy you can understand,{" "}
              <span className="text-[#a58425]"> trust you can feel. </span>{" "}
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
/* ========================================================================== PRIVACY HIGHLIGHT ========================================================================== */ function PrivacyHighlight({
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
/* ========================================================================== POLICY SECTION ========================================================================== */ function PolicySection({
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
/* ========================================================================== PRIVACY POINT ========================================================================== */ function PrivacyPoint({
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
