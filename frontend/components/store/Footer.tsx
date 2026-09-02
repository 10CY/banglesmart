"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ChevronDown,
  Gem,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  Sparkles,
  Truck,
} from "lucide-react";
import { useStoreCatalog } from "@/components/store/StoreCatalogProvider";
import {
  FaFacebookF,
  FaInstagram,
  FaYoutube,
} from "react-icons/fa";

type Category = {
  id: number;
  name: string;
  slug: string;
  parent_id?: number | null;
  sort_order?: number;
  status?: string;
  children?: Category[];
};

function uniqueCategories(categories: Category[]): Category[] {
  return Array.from(
    new Map(
      categories.map((category) => [
        Number(category.id),
        category,
      ])
    ).values()
  );
}

export default function Footer() {
  const { categories } = useStoreCatalog();

  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const [openCategories, setOpenCategories] = useState<
    Record<number, boolean>
  >({});

  const categoryTree = useMemo<Category[]>(() => {
    if (!Array.isArray(categories)) {
      return [];
    }

    const allCategories = categories as Category[];

    const activeCategories = uniqueCategories(
      allCategories.filter(
        (category) => category.status !== "inactive"
      )
    );

    const hasNestedChildren = activeCategories.some(
      (category) =>
        Array.isArray(category.children) &&
        category.children.length > 0
    );

    if (hasNestedChildren) {
      return activeCategories
        .filter(
          (category) =>
            category.parent_id === null ||
            category.parent_id === undefined ||
            Number(category.parent_id) === 0
        )
        .map((parent) => {
          const children = uniqueCategories(
            (parent.children || []).filter(
              (child) => child.status !== "inactive"
            )
          ).sort(
            (a, b) =>
              Number(a.sort_order ?? 0) -
                Number(b.sort_order ?? 0) ||
              a.name.localeCompare(b.name)
          );

          return {
            ...parent,
            children,
          };
        })
        .sort(
          (a, b) =>
            Number(a.sort_order ?? 0) -
              Number(b.sort_order ?? 0) ||
            a.name.localeCompare(b.name)
        );
    }

    const parents = uniqueCategories(
      activeCategories.filter(
        (category) =>
          category.parent_id === null ||
          category.parent_id === undefined ||
          Number(category.parent_id) === 0
      )
    ).sort(
      (a, b) =>
        Number(a.sort_order ?? 0) -
          Number(b.sort_order ?? 0) ||
        a.name.localeCompare(b.name)
    );

    return parents.map((parent) => {
      const children = uniqueCategories(
        activeCategories.filter(
          (child) =>
            child.parent_id !== null &&
            child.parent_id !== undefined &&
            Number(child.parent_id) === Number(parent.id)
        )
      ).sort(
        (a, b) =>
          Number(a.sort_order ?? 0) -
            Number(b.sort_order ?? 0) ||
          a.name.localeCompare(b.name)
      );

      return {
        ...parent,
        children,
      };
    });
  }, [categories]);

  function toggleCategory(id: number) {
    setOpenCategories((current) => ({
      ...current,
      [id]: !current[id],
    }));
  }

  function subscribe(event: React.FormEvent) {
    event.preventDefault();

    if (!email.trim()) {
      return;
    }

    setSubscribed(true);
    setEmail("");
  }

  return (
    <footer className="bg-[#171717] text-white">
      <section className="border-b border-white/10">
        <div className="mx-auto grid max-w-7xl gap-px px-5 md:grid-cols-3 md:px-6">
          <Feature
            icon={<Gem size={21} />}
            title="Curated Elegance"
            text="Premium styles for every occasion"
          />
          <Feature
            icon={<ShieldCheck size={21} />}
            title="Secure Shopping"
            text="A trusted and protected checkout"
          />
          <Feature
            icon={<Truck size={21} />}
            title="Reliable Delivery"
            text="Carefully packed across India"
          />
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-[1.25fr_2fr_1fr_1fr]">
          <div>
            <Link
              href="/"
              className="inline-flex rounded-xl bg-white px-3 py-1"
            >
              <Image
                src="/logo.png"
                alt="BanglesMart"
                width={170}
                height={70}
                className="h-14 w-auto object-contain"
              />
            </Link>

            <p className="mt-5 max-w-sm text-sm leading-7 text-gray-400">
              Timeless bangles, thoughtful details and premium
              designs made to celebrate your everyday and special
              moments.
            </p>

            <div className="mt-6 flex items-center gap-3">
              <Social
                href="#"
                label="Instagram"
                icon={<FaInstagram size={16} />}
              />
              <Social
                href="#"
                label="Facebook"
                icon={<FaFacebookF size={15} />}
              />
              <Social
                href="#"
                label="YouTube"
                icon={<FaYoutube size={16} />}
              />
            </div>
          </div>

          <div className="min-w-0">
            <h3 className="mb-6 text-sm font-semibold">
              Shop Bangles
            </h3>

            <div className="hidden grid-cols-2 gap-x-8 gap-y-7 sm:grid">
              {categoryTree.map((category) => (
                <div
                  key={category.id}
                  className="min-w-0"
                >
                  <Link
                    href={`/shop/${category.slug}`}
                    className="group inline-flex items-center gap-1 text-sm font-medium text-white transition hover:text-[#d5b55a]"
                  >
                    {category.name}
                    <span className="text-[#c9a227] opacity-0 transition group-hover:translate-x-1 group-hover:opacity-100">
                      →
                    </span>
                  </Link>

                  {category.children &&
                    category.children.length > 0 && (
                      <div className="mt-3 space-y-2">
                        {category.children.map((child) => (
                          <Link
                            key={child.id}
                            href={`/shop/${category.slug}/${child.slug}`}
                            className="block text-xs leading-5 text-gray-400 transition hover:translate-x-0.5 hover:text-[#d5b55a]"
                          >
                            {child.name}
                          </Link>
                        ))}
                      </div>
                    )}
                </div>
              ))}
            </div>

            <div className="space-y-2 sm:hidden">
              {categoryTree.map((category) => {
                const hasChildren =
                  Boolean(category.children?.length);

                const isOpen =
                  openCategories[category.id] ?? false;

                return (
                  <div
                    key={category.id}
                    className="border-b border-white/10 pb-2"
                  >
                    <div className="flex items-center justify-between">
                      <Link
                        href={`/shop/${category.slug}`}
                        className="py-2.5 text-sm font-medium text-white"
                      >
                        {category.name}
                      </Link>

                      {hasChildren && (
                        <button
                          type="button"
                          onClick={() =>
                            toggleCategory(category.id)
                          }
                          aria-label={`Show ${category.name} subcategories`}
                          className="flex h-9 w-9 items-center justify-center rounded-full text-gray-400 transition hover:bg-white/10 hover:text-white"
                        >
                          <ChevronDown
                            size={17}
                            className={`transition-transform duration-300 ${
                              isOpen ? "rotate-180" : ""
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
                          <div className="space-y-2 pb-3 pl-3">
                            {category.children?.map(
                              (child) => (
                                <Link
                                  key={child.id}
                                  href={`/shop/${category.slug}/${child.slug}`}
                                  className="block border-l border-white/10 pl-3 text-xs text-gray-400 transition hover:border-[#c9a227] hover:text-[#d5b55a]"
                                >
                                  {child.name}
                                </Link>
                              )
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <Link
              href="/shop"
              className="mt-7 inline-flex items-center gap-2 text-xs font-medium text-[#d5b55a] transition hover:text-white"
            >
              View All Products
              <span>→</span>
            </Link>
          </div>

          <FooterColumn title="Customer Care">
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

          <FooterColumn title="BanglesMart">
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

      <section className="border-y border-white/10 bg-white/[0.025]">
        <div className="mx-auto grid max-w-7xl gap-8 px-5 py-10 sm:px-6 lg:grid-cols-[1fr_auto] lg:items-center lg:px-8">
          <div>
            <div className="flex items-center gap-2 text-[#d5b55a]">
              <Sparkles size={16} />
              <span className="text-[10px] font-semibold uppercase tracking-[0.2em]">
                Private Edit
              </span>
            </div>

            <h3 className="mt-2 font-[family-name:var(--font-playfair)] text-2xl">
              New designs, offers & inspiration.
            </h3>

            <p className="mt-2 max-w-lg text-sm text-gray-400">
              Be the first to discover new collections from
              BanglesMart.
            </p>
          </div>

          <form
            onSubmit={subscribe}
            className="flex w-full max-w-md rounded-full border border-white/15 bg-white/5 p-1"
          >
            <input
              aria-label="Email address"
              type="email"
              required
              value={email}
              onChange={(event) =>
                setEmail(event.target.value)
              }
              placeholder="Your email address"
              className="min-w-0 flex-1 bg-transparent px-4 text-sm outline-none placeholder:text-gray-500"
            />

            <button
              type="submit"
              className="rounded-full bg-[#c9a227] px-5 py-2.5 text-xs font-semibold text-[#171717] transition hover:bg-[#dfc264]"
            >
              {subscribed ? "Subscribed" : "Subscribe"}
            </button>
          </form>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-7 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 text-xs text-gray-500 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © 2026 BanglesMart. All rights reserved.
          </p>

          <div className="flex flex-wrap gap-5">
            <span className="inline-flex items-center gap-1.5">
              <Mail size={13} />
              support@banglesmart.com
            </span>

            <span className="inline-flex items-center gap-1.5">
              <Phone size={13} />
              +91 00000 00000
            </span>

            <span className="inline-flex items-center gap-1.5">
              <MapPin size={13} />
              India
            </span>
          </div>
        </div>
      </section>
    </footer>
  );
}

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
    <div className="flex items-center gap-4 border-b border-white/10 py-7 md:border-b-0">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#c9a227]/15 text-[#c9a227]">
        {icon}
      </div>

      <div>
        <h3 className="text-sm font-semibold">
          {title}
        </h3>

        <p className="mt-1 text-xs text-gray-400">
          {text}
        </p>
      </div>
    </div>
  );
}

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
      aria-label={label}
      href={href}
      className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 text-gray-300 transition hover:border-[#c9a227] hover:text-[#c9a227]"
    >
      {icon}
    </Link>
  );
}

function FooterColumn({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h3 className="mb-5 text-sm font-semibold">
        {title}
      </h3>

      <div className="flex flex-col gap-3 text-sm text-gray-400">
        {children}
      </div>
    </div>
  );
}