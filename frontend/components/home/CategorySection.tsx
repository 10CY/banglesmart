"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Image as ImageIcon } from "lucide-react";
import { storeApiFetch } from "@/lib/storeApi";

type Category = {
  id: number;
  name: string;
  slug: string;
  image?: string | null;
  image_url?: string | null;
  children?: Category[];
};

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  "http://127.0.0.1:8000";

/* -------------------------------------------------------------------------- */
/* IMAGE URL                                                                  */
/* -------------------------------------------------------------------------- */

function getCategoryImage(
  category: Category,
): string {
  if (category.image_url) {
    return category.image_url;
  }

  if (!category.image) {
    return "";
  }

  const image = category.image.trim();

  if (!image) {
    return "";
  }

  if (
    image.startsWith("http://") ||
    image.startsWith("https://")
  ) {
    return image;
  }

  const cleanImage = image.replace(
    /^\/+/,
    "",
  );

  /*
   * Backend stores category images like:
   *
   * categories/example.png
   *
   * So final URL becomes:
   *
   * http://127.0.0.1:8000/storage/categories/example.png
   */

  return `${BACKEND_URL}/storage/${cleanImage}`;
}

/* -------------------------------------------------------------------------- */
/* COMPONENT                                                                  */
/* -------------------------------------------------------------------------- */

export default function CategorySection() {
  const [mounted, setMounted] =
    useState(false);

  const [categories, setCategories] =
    useState<Category[]>([]);

  const [loading, setLoading] =
    useState(true);

  /* ------------------------------------------------------------------------ */
  /* MOUNT                                                                    */
  /* ------------------------------------------------------------------------ */

  useEffect(() => {
    setMounted(true);
  }, []);

  /* ------------------------------------------------------------------------ */
  /* FETCH                                                                     */
  /* ------------------------------------------------------------------------ */

  useEffect(() => {
    if (!mounted) {
      return;
    }

    let cancelled = false;

    async function loadCategories() {
      try {
        setLoading(true);

        const response =
          await storeApiFetch(
            "/store/categories",
          );

        const json =
          await response.json();

        if (!response.ok) {
          throw new Error(
            json?.message ||
              "Failed to load categories.",
          );
        }

        if (
          !cancelled &&
          Array.isArray(json?.data)
        ) {
          /*
           * Store API returns the top-level
           * categories here.
           *
           * Do NOT use:
           *
           * !cat.children ||
           * cat.children.length >= 0
           *
           * because that condition is always true.
           */

          setCategories(
            json.data.slice(0, 4),
          );
        } else if (!cancelled) {
          setCategories([]);
        }
      } catch (error) {
        console.error(
          "Category loading error:",
          error,
        );

        if (!cancelled) {
          setCategories([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadCategories();

    return () => {
      cancelled = true;
    };
  }, [mounted]);

  /* ------------------------------------------------------------------------ */
  /* PRE-HYDRATION                                                            */
  /* ------------------------------------------------------------------------ */

  /*
   * Important:
   *
   * Server renders nothing here.
   * Client also renders nothing until mounted.
   *
   * This prevents server/client HTML mismatch.
   */

  if (!mounted) {
    return (
      <section className="mx-auto max-w-7xl px-6 py-16 lg:px-10">
        <div className="grid grid-cols-2 gap-5 md:grid-cols-4">
          {[1, 2, 3, 4].map(
            (item) => (
              <div
                key={item}
                className="h-72 animate-pulse rounded-2xl bg-[#f5f0e8]"
              />
            ),
          )}
        </div>
      </section>
    );
  }

  /* ------------------------------------------------------------------------ */
  /* LOADING                                                                  */
  /* ------------------------------------------------------------------------ */

  if (loading) {
    return (
      <section className="mx-auto max-w-7xl px-6 py-16 lg:px-10">
        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
          <div className="w-full">
            <div className="h-4 w-40 animate-pulse rounded bg-[#f0e9de]" />

            <div className="mt-4 h-10 w-64 animate-pulse rounded bg-[#f0e9de]" />

            <div className="mt-3 h-5 w-80 animate-pulse rounded bg-[#f0e9de]" />
          </div>
        </div>

        <div className="mt-10 grid grid-cols-2 gap-5 md:grid-cols-4">
          {[1, 2, 3, 4].map(
            (item) => (
              <div
                key={item}
                className="h-72 animate-pulse rounded-2xl bg-[#f5f0e8]"
              />
            ),
          )}
        </div>
      </section>
    );
  }

  /* ------------------------------------------------------------------------ */
  /* SECTION                                                                  */
  /* ------------------------------------------------------------------------ */

  return (
    <section className="mx-auto max-w-7xl px-6 py-16 lg:px-10">
      {/* HEADER */}

      <div className="flex flex-col items-center justify-between gap-4 text-center md:flex-row md:text-left">
        <div>
          <p className="text-sm uppercase tracking-[0.25em] text-[#C9A227]">
            Explore Collection
          </p>

          <h2 className="mt-3 text-3xl font-semibold text-gray-900 md:text-4xl">
            Shop By Categories
          </h2>

          <p className="mt-2 text-gray-500">
            Find jewellery designed for every
            beautiful moment.
          </p>
        </div>

        <Link
          href="/shop"
          className="flex items-center gap-2 text-sm font-medium text-[#C9A227]"
        >
          View All
          <ArrowRight size={16} />
        </Link>
      </div>

      {/* CATEGORY CARDS */}

      {categories.length > 0 ? (
        <div className="mt-10 grid grid-cols-2 gap-5 md:grid-cols-4">
          {categories.map(
            (category) => {
              const imageUrl =
                getCategoryImage(
                  category,
                );

              return (
                <Link
                  key={category.id}
                  href={`/shop/${category.slug}`}
                  className="group overflow-hidden rounded-2xl border border-[#eee5d8] bg-white transition duration-300 hover:-translate-y-1 hover:shadow-xl"
                >
                  {/* IMAGE */}

                  <div className="relative h-52 overflow-hidden md:h-64">
                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        alt={category.name}
                        className="h-full w-full object-cover transition duration-700 group-hover:scale-110"
                        loading="lazy"
                        onError={(
                          event,
                        ) => {
                          event.currentTarget.style.display =
                            "none";

                          const fallback =
                            event.currentTarget
                              .parentElement
                              ?.querySelector(
                                "[data-category-fallback]",
                              ) as
                              | HTMLElement
                              | null;

                          if (fallback) {
                            fallback.style.display =
                              "flex";
                          }
                        }}
                      />
                    ) : null}

                    {/* IMAGE FALLBACK */}

                    <div
                      data-category-fallback
                      className={`absolute inset-0 items-center justify-center bg-[#f5f0e8] ${
                        imageUrl
                          ? "hidden"
                          : "flex"
                      }`}
                    >
                      <div className="text-center">
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-white">
                          <ImageIcon
                            size={22}
                            className="text-[#C9A227]"
                          />
                        </div>

                        <p className="mt-2 text-xs text-gray-400">
                          {category.name}
                        </p>
                      </div>
                    </div>

                    {/* IMAGE OVERLAY */}

                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                  </div>

                  {/* CATEGORY TEXT */}

                  <div className="p-4">
                    <h3 className="text-base font-semibold text-gray-900">
                      {category.name}
                    </h3>

                    <p className="mt-1 text-sm text-gray-500">
                      Explore Collection
                    </p>
                  </div>
                </Link>
              );
            },
          )}
        </div>
      ) : (
        <div className="mt-10 rounded-2xl border border-dashed border-[#e5ddcf] bg-[#faf8f4] px-6 py-16 text-center">
          <p className="text-sm font-medium text-gray-700">
            No categories available.
          </p>

          <p className="mt-1 text-sm text-gray-400">
            Add categories from the admin panel.
          </p>
        </div>
      )}
    </section>
  );
}