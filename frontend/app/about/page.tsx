export default function AboutPage() {
  return (
    <InfoPage
      title="Our Story"
      eyebrow="ABOUT BANGLESMART"
      text="BanglesMart is built around one simple idea: jewellery should feel personal, elegant and effortless. We curate premium bangles for weddings, festivals and everyday moments, with a focus on beautiful design and dependable service."
    />
  );
}
function InfoPage({
  title,
  eyebrow,
  text,
}: {
  title: string;
  eyebrow: string;
  text: string;
}) {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f8f3eb] text-[#211b17]">
      {" "}
      {/* Decorative background elements */}{" "}
      <div className="pointer-events-none absolute -left-32 top-24 h-80 w-80 rounded-full border border-[#c9a227]/10" />{" "}
      <div className="pointer-events-none absolute -left-24 top-32 h-64 w-64 rounded-full border border-[#c9a227]/10" />{" "}
      <div className="pointer-events-none absolute -right-40 bottom-0 h-[520px] w-[520px] rounded-full border border-[#c9a227]/10" />{" "}
      {/* Main content */}{" "}
      <div className="relative mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-24 lg:px-10 lg:py-28">
        {" "}
        {/* Breadcrumb / label */}{" "}
        <div className="mb-12 flex items-center gap-3 sm:mb-16">
          {" "}
          <span className="h-px w-10 bg-[#c9a227]" />{" "}
          <span className="text-[10px] font-bold uppercase tracking-[0.32em] text-[#a58425]">
            {" "}
            BanglesMart{" "}
          </span>{" "}
          <span className="h-px w-10 bg-[#c9a227]" />{" "}
        </div>{" "}
        {/* Editorial layout */}{" "}
        <div className="grid items-center gap-14 lg:grid-cols-[0.85fr_1.15fr] lg:gap-24">
          {" "}
          {/* LEFT — Brand statement */}{" "}
          <div className="relative">
            {" "}
            <div className="absolute -left-4 top-2 hidden h-20 w-px bg-[#c9a227]/30 lg:block" />{" "}
            <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-[#b08c25]">
              {" "}
              {eyebrow}{" "}
            </p>{" "}
            <h1 className="mt-5 max-w-xl font-serif text-5xl font-normal leading-[1.02] tracking-[-0.035em] text-[#201914] sm:text-6xl lg:text-7xl">
              {" "}
              {title}{" "}
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
            <p className="mt-8 max-w-md text-sm leading-7 text-[#756a61] sm:text-base sm:leading-8">
              {" "}
              Jewellery is more than an accessory. It becomes part of the
              moments we remember, the celebrations we cherish and the stories
              we carry forward.{" "}
            </p>{" "}
          </div>{" "}
          {/* RIGHT — Premium story card */}{" "}
          <div className="relative">
            {" "}
            {/* Outer frame */}{" "}
            <div className="absolute -inset-3 rounded-[34px] border border-[#c9a227]/15" />{" "}
            <div className="relative overflow-hidden rounded-[30px] border border-[#e6dccd] bg-white shadow-[0_30px_90px_rgba(54,40,25,0.09)]">
              {" "}
              {/* Card top */}{" "}
              <div className="relative overflow-hidden bg-[#211a16] px-7 py-10 sm:px-12 sm:py-14">
                {" "}
                {/* Decorative circles */}{" "}
                <div className="absolute -right-16 -top-20 h-52 w-52 rounded-full border border-[#c9a227]/20" />{" "}
                <div className="absolute -right-7 -top-11 h-32 w-32 rounded-full border border-[#c9a227]/15" />{" "}
                <div className="relative">
                  {" "}
                  <p className="text-[9px] font-bold uppercase tracking-[0.35em] text-[#c9a227]">
                    {" "}
                    The BanglesMart philosophy{" "}
                  </p>{" "}
                  <h2 className="mt-5 max-w-lg font-serif text-3xl font-normal leading-tight text-[#fffaf3] sm:text-4xl">
                    {" "}
                    Made for moments <br /> that matter.{" "}
                  </h2>{" "}
                </div>{" "}
              </div>{" "}
              {/* Story */}{" "}
              <div className="px-7 py-9 sm:px-12 sm:py-12">
                {" "}
                <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#a88a39]">
                  {" "}
                  What we believe{" "}
                </p>{" "}
                <p className="mt-5 text-base leading-8 text-[#5f554d] sm:text-lg sm:leading-9">
                  {" "}
                  {text}{" "}
                </p>{" "}
                {/* Values */}{" "}
                <div className="mt-10 grid gap-5 border-t border-[#eee5da] pt-8 sm:grid-cols-3 sm:gap-6">
                  {" "}
                  <Value
                    number="01"
                    title="Personal"
                    text="Pieces chosen to feel uniquely yours."
                  />{" "}
                  <Value
                    number="02"
                    title="Elegant"
                    text="Timeless designs with a refined touch."
                  />{" "}
                  <Value
                    number="03"
                    title="Dependable"
                    text="A shopping experience you can trust."
                  />{" "}
                </div>{" "}
              </div>{" "}
            </div>{" "}
          </div>{" "}
        </div>{" "}
        {/* Bottom brand statement */}{" "}
        <div className="mt-20 border-t border-[#ded3c5] pt-8 sm:mt-28 sm:pt-10">
          {" "}
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            {" "}
            <p className="max-w-xl font-serif text-xl leading-8 text-[#3b312a] sm:text-2xl">
              {" "}
              Beautiful jewellery for your{" "}
              <span className="text-[#a58425]">
                {" "}
                most beautiful moments.{" "}
              </span>{" "}
            </p>{" "}
            <div className="flex items-center gap-3 text-[9px] font-bold uppercase tracking-[0.28em] text-[#9b8d80]">
              {" "}
              <span className="h-px w-8 bg-[#c9a227]" /> Since the
              beginning{" "}
            </div>{" "}
          </div>{" "}
        </div>{" "}
      </div>{" "}
    </main>
  );
}
/* ========================================================================== VALUE ITEM ========================================================================== */ function Value({
  number,
  title,
  text,
}: {
  number: string;
  title: string;
  text: string;
}) {
  return (
    <div>
      {" "}
      <p className="text-[9px] font-bold tracking-[0.18em] text-[#c9a227]">
        {" "}
        {number}{" "}
      </p>{" "}
      <h3 className="mt-2 font-serif text-xl text-[#28201b]"> {title} </h3>{" "}
      <p className="mt-2 text-xs leading-6 text-[#82766c]"> {text} </p>{" "}
    </div>
  );
}
