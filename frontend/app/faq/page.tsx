"use client";
import { useState } from "react";
import { ChevronDown } from "lucide-react";
const faqs = [
  [
    "How can I track my order?",
    "Open My Orders from your account to view the latest order status and shipping details.",
  ],
  [
    "Can I cancel my order?",
    "Orders can be cancelled while they are still pending.",
  ],
  [
    "How do I download my invoice?",
    "Open the order details page and select Invoice to download your PDF invoice.",
  ],
  [
    "How does shipping work?",
    "Shipping charges are calculated at checkout based on your store shipping settings.",
  ],
];
export default function FaqPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const toggleFaq = (index: number) => {
    setOpenIndex((current) => (current === index ? null : index));
  };
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f8f3eb] text-[#211b17]">
      {" "}
      {/* Decorative background */}{" "}
      <div className="pointer-events-none absolute -left-32 top-20 h-80 w-80 rounded-full border border-[#c9a227]/10" />{" "}
      <div className="pointer-events-none absolute -left-24 top-28 h-64 w-64 rounded-full border border-[#c9a227]/10" />{" "}
      <div className="pointer-events-none absolute -right-40 bottom-0 h-[520px] w-[520px] rounded-full border border-[#c9a227]/10" />{" "}
      <div className="relative mx-auto max-w-5xl px-5 py-16 sm:px-8 sm:py-24 lg:px-10 lg:py-28">
        {" "}
        {/* Brand line */}{" "}
        <div className="mb-12 flex items-center justify-center gap-3 sm:mb-16">
          {" "}
          <span className="h-px w-10 bg-[#c9a227]" />{" "}
          <span className="text-[10px] font-bold uppercase tracking-[0.32em] text-[#a58425]">
            {" "}
            BanglesMart{" "}
          </span>{" "}
          <span className="h-px w-10 bg-[#c9a227]" />{" "}
        </div>{" "}
        {/* Header */}{" "}
        <div className="mx-auto max-w-3xl text-center">
          {" "}
          <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-[#b08c25]">
            {" "}
            HELP CENTRE{" "}
          </p>{" "}
          <h1 className="mt-5 font-serif text-5xl font-normal leading-[1.05] tracking-[-0.035em] text-[#201914] sm:text-6xl lg:text-7xl">
            {" "}
            Frequently Asked <br /> Questions{" "}
          </h1>{" "}
          {/* Gold ornament */}{" "}
          <div className="mt-8 flex items-center justify-center gap-3">
            {" "}
            <span className="h-px w-14 bg-[#c9a227]" />{" "}
            <span className="relative flex h-3 w-3 items-center justify-center">
              {" "}
              <span className="absolute h-2 w-2 rotate-45 border border-[#c9a227]" />{" "}
            </span>{" "}
            <span className="h-px w-14 bg-[#c9a227]" />{" "}
          </div>{" "}
          <p className="mx-auto mt-8 max-w-xl text-sm leading-7 text-[#756a61] sm:text-base sm:leading-8">
            {" "}
            Everything you need to know about your BanglesMart shopping
            experience, from orders and invoices to shipping and
            cancellations.{" "}
          </p>{" "}
        </div>{" "}
        {/* FAQ */}{" "}
        <div className="mx-auto mt-14 max-w-3xl sm:mt-20">
          {" "}
          <div className="overflow-hidden rounded-[30px] border border-[#e3d8ca] bg-white p-2 shadow-[0_25px_75px_rgba(54,40,25,0.07)] sm:p-3">
            {" "}
            {faqs.map(([question, answer], index) => {
              const isOpen = openIndex === index;
              return (
                <div
                  key={question}
                  className={`overflow-hidden rounded-[22px] transition-colors duration-300 ${isOpen ? "bg-[#fcf8f3]" : "bg-white"}`}
                >
                  {" "}
                  <button
                    type="button"
                    onClick={() => toggleFaq(index)}
                    aria-expanded={isOpen}
                    className="flex w-full items-center gap-5 px-5 py-6 text-left sm:px-7 sm:py-7"
                  >
                    {" "}
                    {/* Number */}{" "}
                    <span
                      className={`hidden shrink-0 text-[9px] font-bold tracking-[0.18em] transition-colors duration-300 sm:block ${isOpen ? "text-[#c9a227]" : "text-[#b4aaa1]"}`}
                    >
                      {" "}
                      {String(index + 1).padStart(2, "0")}{" "}
                    </span>{" "}
                    {/* Question */}{" "}
                    <span
                      className={`flex-1 font-serif text-lg leading-7 transition-colors duration-300 sm:text-xl ${isOpen ? "text-[#8d1530]" : "text-[#29221d]"}`}
                    >
                      {" "}
                      {question}{" "}
                    </span>{" "}
                    {/* Icon */}{" "}
                    <span
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border transition-all duration-300 ${isOpen ? "rotate-180 border-[#8d1530] bg-[#8d1530] text-white" : "border-[#ddd3c8] bg-white text-[#746961]"}`}
                    >
                      {" "}
                      <ChevronDown size={16} />{" "}
                    </span>{" "}
                  </button>{" "}
                  {/* Smooth answer */}{" "}
                  <div
                    className={`grid transition-[grid-template-rows,opacity] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}
                  >
                    {" "}
                    <div className="overflow-hidden">
                      {" "}
                      <div className="px-5 pb-7 sm:px-7 sm:pb-8">
                        {" "}
                        <div className="ml-0 border-l border-[#c9a227]/50 pl-5 sm:ml-[34px]">
                          {" "}
                          <p className="max-w-2xl text-sm leading-7 text-[#756a61] sm:text-[15px] sm:leading-8">
                            {" "}
                            {answer}{" "}
                          </p>{" "}
                        </div>{" "}
                      </div>{" "}
                    </div>{" "}
                  </div>{" "}
                  {/* Divider */}{" "}
                  {index < faqs.length - 1 && (
                    <div className="mx-5 h-px bg-[#eee6dc] sm:mx-7" />
                  )}{" "}
                </div>
              );
            })}{" "}
          </div>{" "}
        </div>{" "}
        {/* Still need help */}{" "}
        <section className="mx-auto mt-14 max-w-3xl sm:mt-20">
          {" "}
          <div className="relative overflow-hidden rounded-[30px] bg-[#211a16] px-7 py-10 text-center shadow-[0_25px_70px_rgba(54,40,25,0.12)] sm:px-12 sm:py-12">
            {" "}
            {/* Decorative rings */}{" "}
            <div className="pointer-events-none absolute -right-20 -top-24 h-56 w-56 rounded-full border border-[#c9a227]/20" />{" "}
            <div className="pointer-events-none absolute -left-20 -bottom-24 h-56 w-56 rounded-full border border-[#c9a227]/10" />{" "}
            <div className="relative">
              {" "}
              <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full border border-[#c9a227]/40 text-[#c9a227]">
                {" "}
                <span className="text-lg">✦</span>{" "}
              </div>{" "}
              <p className="mt-7 text-[9px] font-bold uppercase tracking-[0.32em] text-[#c9a227]">
                {" "}
                Need more help?{" "}
              </p>{" "}
              <h2 className="mt-3 font-serif text-3xl text-[#fffaf3] sm:text-4xl">
                {" "}
                We’re here for you.{" "}
              </h2>{" "}
              <p className="mx-auto mt-4 max-w-md text-sm leading-7 text-[#c8beb5]">
                {" "}
                Can’t find what you’re looking for? Our customer care team will
                be happy to help you with your order or any other
                questions.{" "}
              </p>{" "}
              <a
                href="/contact"
                className="mt-7 inline-flex items-center rounded-full bg-[#c9a227] px-7 py-3.5 text-[10px] font-bold uppercase tracking-[0.14em] text-[#211a16] transition duration-300 hover:bg-[#dfc15b]"
              >
                {" "}
                Contact Customer Care{" "}
              </a>{" "}
            </div>{" "}
          </div>{" "}
        </section>{" "}
        {/* Bottom statement */}{" "}
        <div className="mt-16 border-t border-[#ded3c5] pt-8 sm:mt-20 sm:pt-10">
          {" "}
          <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:justify-between sm:text-left">
            {" "}
            <p className="font-serif text-xl text-[#3b312a] sm:text-2xl">
              {" "}
              Simple answers.{" "}
              <span className="text-[#a58425]"> Better shopping. </span>{" "}
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
