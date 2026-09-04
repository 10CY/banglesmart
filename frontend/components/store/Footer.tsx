"use client";

import { useMemo, useState } from "react";

import Image from "next/image";
import Link from "next/link";

import {
  ChevronDown,
  ChevronRight,
  Gem,
  Heart,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  Sparkles,
  Truck,
  ArrowUpRight,
  CheckCircle2,
} from "lucide-react";

import { FaFacebookF, FaInstagram, FaYoutube } from "react-icons/fa";

import { useStoreCatalog } from "@/components/store/StoreCatalogProvider";

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

type Category = {
  id: number;
  name: string;
  slug: string;
  parent_id?: number | null;
  sort_order?: number;
  status?: string;
  children?: Category[];
};

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function uniqueCategories(categories: Category[]): Category[] {
  return Array.from(
    new Map(
      categories.map((category) => [
        Number(category.id),
        category,
      ]),
    ).values(),
  );
}

/* -------------------------------------------------------------------------- */
/* Footer                                                                     */
/* -------------------------------------------------------------------------- */

export default function Footer() {
  const { categories } =
    useStoreCatalog();

  const [
    email,
    setEmail,
  ] = useState("");

  const [
    subscribed,
    setSubscribed,
  ] = useState(false);

  const [
    openCategories,
    setOpenCategories,
  ] = useState<
    Record<number, boolean>
  >({});

  /* ------------------------------------------------------------------------ */
  /* Category Tree                                                            */
  /* ------------------------------------------------------------------------ */

  const categoryTree =
    useMemo<Category[]>(() => {
      if (
        !Array.isArray(
          categories,
        )
      ) {
        return [];
      }

      const allCategories =
        categories as Category[];

      const activeCategories =
        uniqueCategories(
          allCategories.filter(
            (category) =>
              category.status !==
              "inactive",
          ),
        );

      const hasNestedChildren =
        activeCategories.some(
          (category) =>
            Array.isArray(
              category.children,
            ) &&
            category.children.length >
              0,
        );

      /* -------------------------------------------------------------------- */
      /* API already provides children                                        */
      /* -------------------------------------------------------------------- */

      if (hasNestedChildren) {
        return activeCategories
          .filter(
            (category) =>
              category.parent_id ===
                null ||
              category.parent_id ===
                undefined ||
              Number(
                category.parent_id,
              ) === 0,
          )
          .map(
            (parent) => {
              const children =
                uniqueCategories(
                  (
                    parent.children ||
                    []
                  ).filter(
                    (child) =>
                      child.status !==
                      "inactive",
                  ),
                ).sort(
                  (a, b) =>
                    Number(
                      a.sort_order ??
                        0,
                    ) -
                      Number(
                        b.sort_order ??
                          0,
                      ) ||
                    a.name.localeCompare(
                      b.name,
                    ),
                );

              return {
                ...parent,
                children,
              };
            },
          )
          .sort(
            (a, b) =>
              Number(
                a.sort_order ?? 0,
              ) -
                Number(
                  b.sort_order ?? 0,
                ) ||
              a.name.localeCompare(
                b.name,
              ),
          );
      }

      /* -------------------------------------------------------------------- */
      /* Build children manually                                              */
      /* -------------------------------------------------------------------- */

      const parents =
        uniqueCategories(
          activeCategories.filter(
            (category) =>
              category.parent_id ===
                null ||
              category.parent_id ===
                undefined ||
              Number(
                category.parent_id,
              ) === 0,
          ),
        ).sort(
          (a, b) =>
            Number(
              a.sort_order ?? 0,
            ) -
              Number(
                b.sort_order ?? 0,
              ) ||
            a.name.localeCompare(
              b.name,
            ),
        );

      return parents.map(
        (parent) => {
          const children =
            uniqueCategories(
              activeCategories.filter(
                (child) =>
                  child.parent_id !==
                    null &&
                  child.parent_id !==
                    undefined &&
                  Number(
                    child.parent_id,
                  ) ===
                    Number(
                      parent.id,
                    ),
              ),
            ).sort(
              (a, b) =>
                Number(
                  a.sort_order ?? 0,
                ) -
                  Number(
                    b.sort_order ??
                      0,
                  ) ||
                a.name.localeCompare(
                  b.name,
                ),
            );

          return {
            ...parent,
            children,
          };
        },
      );
    }, [
      categories,
    ]);

  /* ------------------------------------------------------------------------ */
  /* Toggle Category                                                         */
  /* ------------------------------------------------------------------------ */

  function toggleCategory(
    id: number,
  ) {
    setOpenCategories(
      (current) => ({
        ...current,
        [id]:
          !current[id],
      }),
    );
  }

  /* ------------------------------------------------------------------------ */
  /* Render                                                                   */
  /* ------------------------------------------------------------------------ */

  return (
    <footer className="relative overflow-hidden bg-[#111111] text-white">

      {/* Decorative Background */}

      <div className="pointer-events-none absolute inset-0 overflow-hidden">

        <div className="absolute -left-32 top-20 h-72 w-72 rounded-full bg-[#8f0828]/10 blur-3xl" />

        <div className="absolute -right-32 bottom-20 h-80 w-80 rounded-full bg-[#c9a227]/5 blur-3xl" />

      </div>

      <div className="relative">

        {/* ================================================================ */}
        {/* Trust Features                                                    */}
        {/* ================================================================ */}

        <section className="border-b border-white/10 bg-white/[0.025]">

          <div className="mx-auto grid max-w-7xl divide-y divide-white/10 px-5 md:grid-cols-3 md:divide-x md:divide-y-0 md:px-6 lg:px-8">

            <Feature
              icon={
                <Gem size={21} />
              }
              title="Premium Craftsmanship"
              text="Elegant designs for every occasion"
            />

            <Feature
              icon={
                <ShieldCheck
                  size={21}
                />
              }
              title="Secure Shopping"
              text="Safe and trusted checkout"
            />

            <Feature
              icon={
                <Truck
                  size={21}
                />
              }
              title="Reliable Delivery"
              text="Carefully delivered across India"
            />

          </div>

        </section>

        {/* ================================================================ */}
        {/* Main Footer                                                       */}
        {/* ================================================================ */}

        <section className="mx-auto max-w-7xl px-5 py-14 sm:px-6 sm:py-16 lg:px-8">

          <div className="grid gap-12 lg:grid-cols-[1.2fr_2fr_0.9fr_0.9fr]">

            {/* ============================================================ */}
            {/* Brand                                                          */}
            {/* ============================================================ */}

            <div>

              <Link
                href="/"
                className="inline-flex rounded-2xl bg-white p-2 shadow-lg shadow-black/20 transition hover:scale-[1.02]"
              >

                <Image
                  src="/logo.png"
                  alt="BanglesMart"
                  width={170}
                  height={70}
                  className="h-14 w-auto object-contain"
                />

              </Link>

              <p className="mt-6 max-w-sm text-sm leading-7 text-gray-400">

                Discover timeless bangles,
                elegant designs and beautiful
                accessories made to celebrate
                your everyday and special
                moments.

              </p>

              {/* Social */}

              <div className="mt-7">

                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-500">
                  Follow Our Journey
                </p>

                <div className="mt-4 flex items-center gap-3">

                  <Social
                    href="#"
                    label="Instagram"
                    icon={
                      <FaInstagram
                        size={16}
                      />
                    }
                  />

                  <Social
                    href="#"
                    label="Facebook"
                    icon={
                      <FaFacebookF
                        size={15}
                      />
                    }
                  />

                  <Social
                    href="#"
                    label="YouTube"
                    icon={
                      <FaYoutube
                        size={16}
                      />
                    }
                  />

                </div>

              </div>

            </div>

            {/* ============================================================ */}
            {/* Categories                                                     */}
            {/* ============================================================ */}

            <div className="min-w-0">

              <div className="flex items-center justify-between">

                <div>

                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#c9a227]">
                    Collections
                  </p>

                  <h3 className="mt-2 text-lg font-bold text-white">
                    Shop Bangles
                  </h3>

                </div>

                <Link
                  href="/shop"
                  className="hidden items-center gap-1 text-xs font-semibold text-[#d5b55a] transition hover:text-white sm:inline-flex"
                >

                  View All

                  <ArrowUpRight
                    size={14}
                  />

                </Link>

              </div>

              {/* Desktop Categories */}

              <div className="mt-7 hidden grid-cols-2 gap-x-10 gap-y-8 sm:grid">

                {categoryTree.map(
                  (
                    category,
                  ) => (

                    <div
                      key={
                        category.id
                      }
                      className="min-w-0"
                    >

                      <Link
                        href={`/shop/${category.slug}`}
                        className="group inline-flex items-center gap-1 text-sm font-semibold text-white transition hover:text-[#d5b55a]"
                      >

                        {category.name}

                        <ChevronRight
                          size={14}
                          className="opacity-0 transition-all duration-200 group-hover:translate-x-1 group-hover:opacity-100"
                        />

                      </Link>

                      {category.children &&
                        category.children
                          .length >
                          0 && (

                          <div className="mt-3 space-y-2.5">

                            {category.children.map(
                              (
                                child,
                              ) => (

                                <Link
                                  key={
                                    child.id
                                  }
                                  href={`/shop/${category.slug}/${child.slug}`}
                                  className="block text-xs text-gray-500 transition hover:translate-x-1 hover:text-[#d5b55a]"
                                >

                                  {child.name}

                                </Link>

                              ),
                            )}

                          </div>

                        )}

                    </div>

                  ),
                )}

              </div>

              {/* Mobile Categories */}

              <div className="mt-6 space-y-1 sm:hidden">

                {categoryTree.map(
                  (
                    category,
                  ) => {

                    const hasChildren =
                      Boolean(
                        category
                          .children
                          ?.length,
                      );

                    const isOpen =
                      openCategories[
                        category.id
                      ] ??
                      false;

                    return (

                      <div
                        key={
                          category.id
                        }
                        className="border-b border-white/10"
                      >

                        <div className="flex items-center justify-between">

                          <Link
                            href={`/shop/${category.slug}`}
                            className="py-3 text-sm font-medium text-white"
                          >

                            {
                              category.name
                            }

                          </Link>

                          {hasChildren && (

                            <button
                              type="button"
                              onClick={() =>
                                toggleCategory(
                                  category.id,
                                )
                              }
                              className="flex h-9 w-9 items-center justify-center rounded-full text-gray-400 transition hover:bg-white/10 hover:text-white"
                              aria-label={`Toggle ${category.name}`}
                            >

                              <ChevronDown
                                size={17}
                                className={`transition-transform duration-300 ${
                                  isOpen
                                    ? "rotate-180"
                                    : ""
                                }`}
                              />

                            </button>

                          )}

                        </div>

                        {hasChildren && (

                          <div
                            className={`grid transition-all duration-300 ${
                              isOpen
                                ? "grid-rows-[1fr] opacity-100"
                                : "grid-rows-[0fr] opacity-0"
                            }`}
                          >

                            <div className="overflow-hidden">

                              <div className="space-y-3 pb-4 pl-3">

                                {category.children?.map(
                                  (
                                    child,
                                  ) => (

                                    <Link
                                      key={
                                        child.id
                                      }
                                      href={`/shop/${category.slug}/${child.slug}`}
                                      className="block border-l border-white/10 pl-3 text-xs text-gray-400 transition hover:border-[#c9a227] hover:text-[#d5b55a]"
                                    >

                                      {
                                        child.name
                                      }

                                    </Link>

                                  ),
                                )}

                              </div>

                            </div>

                          </div>

                        )}

                      </div>

                    );
                  },
                )}

              </div>

              <Link
                href="/shop"
                className="mt-7 inline-flex items-center gap-2 rounded-full border border-[#c9a227]/30 px-4 py-2 text-xs font-semibold text-[#d5b55a] transition hover:border-[#c9a227] hover:bg-[#c9a227]/10 sm:hidden"
              >

                View All Products

                <ChevronRight
                  size={14}
                />

              </Link>

            </div>

            {/* ============================================================ */}
            {/* Customer Care                                                  */}
            {/* ============================================================ */}

            <FooterColumn
              eyebrow="Support"
              title="Customer Care"
            >

              <Link href="/account/orders">
                My Orders
              </Link>

              <Link href="/account/addresses">
                My Addresses
              </Link>

              <Link href="/account/wishlist">
                Wishlist
              </Link>

              <Link href="/shipping">
                Shipping
              </Link>

              <Link href="/returns">
                Returns & Refunds
              </Link>

              <Link href="/faq">
                FAQs
              </Link>

            </FooterColumn>

            {/* ============================================================ */}
            {/* Company                                                        */}
            {/* ============================================================ */}

            <FooterColumn
              eyebrow="Company"
              title="BanglesMart"
            >

              <Link href="/about">
                About Us
              </Link>

              <Link href="/contact">
                Contact Us
              </Link>

              <Link href="/privacy">
                Privacy Policy
              </Link>

              <Link href="/terms">
                Terms & Conditions
              </Link>

              <Link href="/offers">
                Offers
              </Link>

            </FooterColumn>

          </div>

        </section>

        {/* ================================================================ */}
        {/* Contact Strip                                                      */}
        {/* ================================================================ */}

        <section className="border-b border-white/10">

          <div className="mx-auto grid max-w-7xl gap-4 px-5 py-6 sm:grid-cols-3 sm:px-6 lg:px-8">

            <ContactItem
              icon={
                <Mail
                  size={17}
                />
              }
              label="Email Support"
              value="support@banglesmart.com"
            />

            <ContactItem
              icon={
                <Phone
                  size={17}
                />
              }
              label="Customer Support"
              value="+91 9506475774"
            />

            <ContactItem
              icon={
                <MapPin
                  size={17}
                />
              }
              label="Our Location"
              value="India"
            />

          </div>

        </section>

        {/* ================================================================ */}
        {/* Bottom                                                             */}
        {/* ================================================================ */}

        <section className="mx-auto max-w-7xl px-5 py-7 sm:px-6 lg:px-8">

          <div className="flex flex-col gap-5 text-xs text-gray-500 sm:flex-row sm:items-center sm:justify-between">

            <p>
              © {new Date().getFullYear()}{" "}
              BanglesMart.
              All rights reserved.
            </p>

            <div className="flex flex-wrap items-center gap-2">

              <span className="inline-flex items-center gap-1.5">

                Made with

                <Heart
                  size={13}
                  className="fill-[#8f0828] text-[#8f0828]"
                />

                in India

              </span>

              <span className="hidden text-white/20 sm:inline">
                •
              </span>

              <span>
                Premium jewellery,
                beautifully delivered.
              </span>

            </div>

          </div>

        </section>

      </div>

    </footer>
  );
}

/* ========================================================================== */
/* Feature                                                                    */
/* ========================================================================== */

function Feature({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="flex items-center gap-4 py-7 md:px-7 lg:px-8">

      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#c9a227]/10 text-[#d5b55a]">

        {icon}

      </div>

      <div>

        <h3 className="text-sm font-bold text-white">
          {title}
        </h3>

        <p className="mt-1 text-xs text-gray-500">
          {text}
        </p>

      </div>

    </div>
  );
}

/* ========================================================================== */
/* Social                                                                     */
/* ========================================================================== */

function Social({
  href,
  label,
  icon,
}: {
  href: string;
  label: string;
  icon: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-label={label}
      className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-gray-400 transition duration-300 hover:-translate-y-1 hover:border-[#c9a227]/50 hover:bg-[#c9a227]/10 hover:text-[#d5b55a]"
    >

      {icon}

    </Link>
  );
}

/* ========================================================================== */
/* Footer Column                                                              */
/* ========================================================================== */

function FooterColumn({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>

      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#c9a227]">
        {eyebrow}
      </p>

      <h3 className="mt-2 text-base font-bold text-white">
        {title}
      </h3>

      <div className="mt-6 flex flex-col gap-3.5 text-sm">

        {children}

      </div>

    </div>
  );
}

/* ========================================================================== */
/* Contact Item                                                               */
/* ========================================================================== */

function ContactItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">

      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#8f0828]/20 text-[#d5b55a]">

        {icon}

      </div>

      <div className="min-w-0">

        <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">
          {label}
        </p>

        <p className="mt-1 truncate text-xs font-medium text-gray-300">
          {value}
        </p>

      </div>

    </div>
  );
}