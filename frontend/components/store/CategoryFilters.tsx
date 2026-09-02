"use client";

import {
  ChevronDown,
  ChevronRight,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

/* =========================================================
   TYPES
========================================================= */

export type FilterCategory = {
  id: number;
  name: string;
  slug: string;
  parent_id?: number | null;
  image?: string | null;
  description?: string | null;
  status?: string;
  sort_order?: number;

  /*
   * API can return children.
   */
  children?: FilterCategory[];
};

type CategoryFiltersProps = {
  /*
   * Categories are optional so the component
   * remains safe while API data is loading.
   */
  categories?: FilterCategory[];

  /*
   * Current selected category.
   */
  category?: string;

  /*
   * Optional because /shop may use URL navigation
   * directly instead of local category state.
   */
  setCategory?: (value: string) => void;

  /*
   * Number of currently displayed products.
   */
  productCount?: number;

  /*
   * Search.
   */
  search: string;
  setSearch: (value: string) => void;

  /*
   * Price.
   */
  minPrice: string;
  maxPrice: string;

  setMinPrice: (value: string) => void;
  setMaxPrice: (value: string) => void;

  /*
   * Sorting.
   */
  sort: string;
  setSort: (value: string) => void;

  /*
   * Collection filters.
   */
  newArrival: boolean;
  bestSeller: boolean;
  featured: boolean;

  setNewArrival: (value: boolean) => void;
  setBestSeller: (value: boolean) => void;
  setFeatured: (value: boolean) => void;

  /*
   * Clear everything.
   */
  clearFilters: () => void;

  /*
   * Mobile version.
   */
  mobile?: boolean;
};

/* =========================================================
   NORMALIZE CATEGORIES
========================================================= */

/*
 * Supports both API formats:
 *
 * FORMAT 1:
 *
 * Parent
 *   children: [
 *     Child
 *   ]
 *
 *
 * FORMAT 2:
 *
 * Parent
 * Child -> parent_id = Parent.id
 *
 *
 * We always convert them to:
 *
 * Parent
 *   ├── Child
 *   ├── Child
 *   └── Child
 */

function normalizeCategories(
  input: FilterCategory[]
): FilterCategory[] {
  if (!Array.isArray(input)) {
    return [];
  }

  /*
   * Remove invalid entries.
   */
  const validCategories = input.filter(
    (category) =>
      category &&
      typeof category.id !== "undefined" &&
      typeof category.name === "string" &&
      typeof category.slug === "string"
  );

  /*
   * Check if API already returned nested data.
   */
  const alreadyNested = validCategories.some(
    (category) =>
      Array.isArray(category.children) &&
      category.children.length > 0
  );

  /*
   * API already nested.
   */
  if (alreadyNested) {
    return validCategories
      .filter(
        (category) =>
          category.parent_id === null ||
          category.parent_id === undefined
      )
      .map((parent) => ({
        ...parent,

        children: Array.isArray(parent.children)
          ? parent.children
          : [],
      }));
  }

  /*
   * API returned flat categories.
   */
  const parents = validCategories.filter(
    (category) =>
      category.parent_id === null ||
      category.parent_id === undefined
  );

  return parents.map((parent) => {
    const children = validCategories.filter(
      (child) =>
        child.parent_id !== null &&
        child.parent_id !== undefined &&
        Number(child.parent_id) === Number(parent.id)
    );

    return {
      ...parent,
      children,
    };
  });
}

/* =========================================================
   COMPONENT
========================================================= */

export default function CategoryFilters({
  categories = [],

  category,
  setCategory,

  productCount,

  search,
  setSearch,

  minPrice,
  maxPrice,

  setMinPrice,
  setMaxPrice,

  sort,
  setSort,

  newArrival,
  bestSeller,
  featured,

  setNewArrival,
  setBestSeller,
  setFeatured,

  clearFilters,

  mobile = false,
}: CategoryFiltersProps) {
  const router = useRouter();

  /*
   * Normalize categories only when the input changes.
   */
  const normalizedCategories = useMemo(
    () => normalizeCategories(categories),
    [categories]
  );

  /*
   * Track which parent categories are open.
   */
  const [openCategories, setOpenCategories] =
    useState<number[]>([]);

  /* =======================================================
     AUTOMATICALLY OPEN ACTIVE PARENT
  ======================================================= */

  useEffect(() => {
    if (!category) {
      return;
    }

    const activeParent =
      normalizedCategories.find(
        (parent) =>
          parent.slug === category ||
          parent.children?.some(
            (child) =>
              child.slug === category
          )
      );

    if (
      activeParent &&
      activeParent.children &&
      activeParent.children.length > 0
    ) {
      setOpenCategories((current) => {
        if (
          current.includes(activeParent.id)
        ) {
          return current;
        }

        return [
          ...current,
          activeParent.id,
        ];
      });
    }
  }, [
    category,
    normalizedCategories,
  ]);

  /* =======================================================
     TOGGLE PARENT
  ======================================================= */

  function toggleCategory(
    categoryId: number
  ) {
    setOpenCategories((current) => {
      if (
        current.includes(categoryId)
      ) {
        return current.filter(
          (id) =>
            id !== categoryId
        );
      }

      return [
        ...current,
        categoryId,
      ];
    });
  }

  /* =======================================================
     SELECT PARENT
  ======================================================= */

  function selectParent(
    parent: FilterCategory
  ) {
    /*
     * If the page provides setCategory,
     * update local/page state.
     */
    if (typeof setCategory === "function") {
      setCategory(parent.slug);
    } else {
      /*
       * /shop page can navigate directly.
       */
      router.push(
        `/shop/${parent.slug}`
      );
    }

    /*
     * Open parent when selected.
     */
    if (
      parent.children &&
      parent.children.length > 0
    ) {
      setOpenCategories((current) => {
        if (
          current.includes(parent.id)
        ) {
          return current;
        }

        return [
          ...current,
          parent.id,
        ];
      });
    }
  }

  /* =======================================================
     SELECT CHILD
  ======================================================= */

  function selectChild(
    child: FilterCategory,
    parent: FilterCategory
  ) {
    /*
     * If page provides setCategory,
     * update it.
     */
    if (typeof setCategory === "function") {
      setCategory(child.slug);
    } else {
      /*
       * Hierarchical clean URL:
       *
       * /shop/glass-bangles/bridal-glass-bangles
       */
      router.push(
        `/shop/${parent.slug}/${child.slug}`
      );
    }
  }

  /* =======================================================
     ALL CATEGORIES
  ======================================================= */

  function selectAllCategories() {
    if (typeof setCategory === "function") {
      setCategory("");
    } else {
      router.push("/shop");
    }
  }

  /* =======================================================
     CLEAR CATEGORY
  ======================================================= */

  function clearCategory() {
    if (typeof setCategory === "function") {
      setCategory("");
    } else {
      router.push("/shop");
    }
  }

  /* =======================================================
     CHECK ACTIVE PARENT
  ======================================================= */

  function isParentActive(
    parent: FilterCategory
  ) {
    if (category === parent.slug) {
      return true;
    }

    return Boolean(
      parent.children?.some(
        (child) =>
          child.slug === category
      )
    );
  }

  /* =======================================================
     CHECK ACTIVE CHILD
  ======================================================= */

  function isChildActive(
    child: FilterCategory
  ) {
    return category === child.slug;
  }

  /* =======================================================
     ACTIVE FILTERS
  ======================================================= */

  const hasActiveFilters =
    Boolean(
      category ||
      search ||
      minPrice ||
      maxPrice ||
      sort ||
      newArrival ||
      bestSeller ||
      featured
    );

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <aside
      className={
        mobile
          ? "w-full"
          : "w-full"
      }
    >
      <div className="space-y-7">

        {/* =================================================
            SEARCH
        ================================================= */}

        <div>
          <label className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.18em] text-[#777]">
            Search
          </label>

          <div className="relative">
            <Search
              size={15}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#999]"
            />

            <input
              type="text"
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
              placeholder="Search bangles..."
              className="h-11 w-full rounded-xl border border-[#e3dbd0] bg-white pl-10 pr-4 text-sm text-[#222] outline-none transition placeholder:text-[#aaa] focus:border-[#c9a227] focus:ring-2 focus:ring-[#c9a227]/10"
            />
          </div>
        </div>

        {/* =================================================
            CATEGORY
        ================================================= */}

        <div>
          <div className="mb-3 flex items-center justify-between">
            <label className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#777]">
              Category
            </label>

            {typeof productCount === "number" && (
              <span className="text-[10px] text-[#999]">
                {productCount}{" "}
                {productCount === 1
                  ? "product"
                  : "products"}
              </span>
            )}

            {category && (
              <button
                type="button"
                onClick={clearCategory}
                className="text-[10px] font-medium text-[#8f0828] hover:underline"
              >
                Clear
              </button>
            )}
          </div>

          <div className="space-y-1">

            {/* =================================================
                ALL CATEGORIES
            ================================================= */}

            <button
              type="button"
              onClick={
                selectAllCategories
              }
              className={`flex w-full items-center justify-between rounded-xl px-3.5 py-3 text-left transition ${
                !category
                  ? "bg-[#f7efe3] text-[#8f0828]"
                  : "text-[#444] hover:bg-[#faf7f2]"
              }`}
            >
              <span className="text-sm font-medium">
                All Categories
              </span>

              {!category && (
                <span className="h-1.5 w-1.5 rounded-full bg-[#c9a227]" />
              )}
            </button>

            {/* =================================================
                ALL PARENT CATEGORIES
            ================================================= */}

            {normalizedCategories.length === 0 ? (
              <div className="px-3.5 py-4 text-xs text-[#999]">
                No categories found.
              </div>
            ) : (
              normalizedCategories.map(
                (parent) => {
                  const hasChildren =
                    Array.isArray(
                      parent.children
                    ) &&
                    parent.children.length >
                      0;

                  const isOpen =
                    openCategories.includes(
                      parent.id
                    );

                  const active =
                    isParentActive(
                      parent
                    );

                  return (
                    <div
                      key={parent.id}
                      className="overflow-hidden"
                    >

                      {/* =====================================
                          PARENT ROW
                      ===================================== */}

                      <div
                        className={`flex items-center rounded-xl transition ${
                          active
                            ? "bg-[#faf4eb]"
                            : "hover:bg-[#faf7f2]"
                        }`}
                      >

                        {/* PARENT NAME */}

                        <button
                          type="button"
                          onClick={() =>
                            selectParent(
                              parent
                            )
                          }
                          className={`min-w-0 flex-1 px-3.5 py-3 text-left text-sm transition ${
                            active
                              ? "font-medium text-[#8f0828]"
                              : "text-[#4d4d4d]"
                          }`}
                        >
                          <span className="block truncate">
                            {parent.name}
                          </span>
                        </button>

                        {/* EXPAND / COLLAPSE */}

                        {hasChildren ? (
                          <button
                            type="button"
                            aria-label={
                              isOpen
                                ? `Collapse ${parent.name}`
                                : `Expand ${parent.name}`
                            }
                            onClick={() =>
                              toggleCategory(
                                parent.id
                              )
                            }
                            className={`mr-1.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition ${
                              active
                                ? "text-[#8f0828]"
                                : "text-[#888] hover:bg-white hover:text-[#8f0828]"
                            }`}
                          >
                            {isOpen ? (
                              <ChevronDown
                                size={16}
                              />
                            ) : (
                              <ChevronRight
                                size={16}
                              />
                            )}
                          </button>
                        ) : (
                          <span className="mr-4 text-sm text-[#999]">
                            →
                          </span>
                        )}

                      </div>

                      {/* =====================================
                          CHILDREN
                      ===================================== */}

                      {hasChildren &&
                        isOpen && (
                          <div className="ml-4 border-l border-[#e9e0d4] pl-3">

                            {parent.children!.map(
                              (child) => {
                                const childActive =
                                  isChildActive(
                                    child
                                  );

                                return (
                                  <button
                                    key={
                                      child.id
                                    }
                                    type="button"
                                    onClick={() =>
                                      selectChild(
                                        child,
                                        parent
                                      )
                                    }
                                    className={`group flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left transition ${
                                      childActive
                                        ? "bg-[#f8efe4] text-[#8f0828]"
                                        : "text-[#666] hover:bg-[#faf7f2] hover:text-[#8f0828]"
                                    }`}
                                  >
                                    <span
                                      className={`min-w-0 truncate text-[13px] ${
                                        childActive
                                          ? "font-medium"
                                          : ""
                                      }`}
                                    >
                                      {
                                        child.name
                                      }
                                    </span>

                                    {childActive && (
                                      <span className="ml-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#c9a227]" />
                                    )}

                                    {!childActive && (
                                      <ChevronRight
                                        size={14}
                                        className="ml-2 shrink-0 text-[#aaa] opacity-0 transition group-hover:opacity-100"
                                      />
                                    )}
                                  </button>
                                );
                              }
                            )}

                          </div>
                        )}

                    </div>
                  );
                }
              )
            )}

          </div>
        </div>

        {/* =================================================
            PRICE RANGE
        ================================================= */}

        <div>
          <label className="mb-3 block text-[10px] font-semibold uppercase tracking-[0.18em] text-[#777]">
            Price
          </label>

          <div className="grid grid-cols-2 gap-2">

            <input
              type="number"
              min="0"
              value={minPrice}
              onChange={(event) =>
                setMinPrice(
                  event.target.value
                )
              }
              placeholder="Min ₹"
              className="h-10 w-full rounded-lg border border-[#e3dbd0] bg-white px-3 text-xs text-[#222] outline-none transition focus:border-[#c9a227]"
            />

            <input
              type="number"
              min="0"
              value={maxPrice}
              onChange={(event) =>
                setMaxPrice(
                  event.target.value
                )
              }
              placeholder="Max ₹"
              className="h-10 w-full rounded-lg border border-[#e3dbd0] bg-white px-3 text-xs text-[#222] outline-none transition focus:border-[#c9a227]"
            />

          </div>
        </div>

        {/* =================================================
            SORT
        ================================================= */}

        <div>
          <label className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.18em] text-[#777]">
            Sort By
          </label>

          <div className="relative">

            <select
              value={sort}
              onChange={(event) =>
                setSort(
                  event.target.value
                )
              }
              className="h-11 w-full appearance-none rounded-xl border border-[#e3dbd0] bg-white px-3.5 pr-9 text-sm text-[#444] outline-none transition focus:border-[#c9a227]"
            >
              <option value="">
                Recommended
              </option>

              <option value="price_low">
                Price: Low to High
              </option>

              <option value="price_high">
                Price: High to Low
              </option>

              <option value="name">
                Name: A to Z
              </option>
            </select>

            <ChevronDown
              size={15}
              className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#888]"
            />

          </div>
        </div>

        {/* =================================================
            COLLECTION
        ================================================= */}

        <div>
          <label className="mb-3 block text-[10px] font-semibold uppercase tracking-[0.18em] text-[#777]">
            Collection
          </label>

          <div className="space-y-1">

            {/* NEW ARRIVALS */}

            <label className="flex cursor-pointer items-center justify-between rounded-xl px-3 py-2.5 transition hover:bg-[#faf7f2]">
              <span className="text-sm text-[#555]">
                New Arrivals
              </span>

              <input
                type="checkbox"
                checked={newArrival}
                onChange={(event) =>
                  setNewArrival(
                    event.target.checked
                  )
                }
                className="h-4 w-4 accent-[#8f0828]"
              />
            </label>

            {/* BEST SELLERS */}

            <label className="flex cursor-pointer items-center justify-between rounded-xl px-3 py-2.5 transition hover:bg-[#faf7f2]">
              <span className="text-sm text-[#555]">
                Best Sellers
              </span>

              <input
                type="checkbox"
                checked={bestSeller}
                onChange={(event) =>
                  setBestSeller(
                    event.target.checked
                  )
                }
                className="h-4 w-4 accent-[#8f0828]"
              />
            </label>

            {/* FEATURED */}

            <label className="flex cursor-pointer items-center justify-between rounded-xl px-3 py-2.5 transition hover:bg-[#faf7f2]">
              <span className="text-sm text-[#555]">
                Featured
              </span>

              <input
                type="checkbox"
                checked={featured}
                onChange={(event) =>
                  setFeatured(
                    event.target.checked
                  )
                }
                className="h-4 w-4 accent-[#8f0828]"
              />
            </label>

          </div>
        </div>

        {/* =================================================
            ACTIVE FILTER SUMMARY
        ================================================= */}

        {hasActiveFilters && (
          <div className="rounded-xl bg-[#faf5ed] px-3.5 py-3">
            <div className="flex items-center justify-between gap-3">

              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#999]">
                  Filters Applied
                </p>

                {typeof productCount === "number" && (
                  <p className="mt-1 text-xs text-[#666]">
                    {productCount}{" "}
                    {productCount === 1
                      ? "product"
                      : "products"}{" "}
                    found
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={clearFilters}
                className="text-xs font-semibold text-[#8f0828] hover:underline"
              >
                Clear
              </button>

            </div>
          </div>
        )}

        {/* =================================================
            CLEAR ALL
        ================================================= */}

        {hasActiveFilters && (
          <button
            type="button"
            onClick={clearFilters}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#ded5c9] bg-white py-3 text-xs font-semibold text-[#555] transition hover:border-[#8f0828] hover:text-[#8f0828]"
          >
            <X size={14} />
            Clear All Filters
          </button>
        )}

        {/* =================================================
            MOBILE INFO
        ================================================= */}

        {mobile && (
          <div className="flex items-center gap-2 rounded-xl bg-[#faf5ed] p-3 text-xs text-[#777]">
            <SlidersHorizontal
              size={15}
              className="shrink-0 text-[#c9a227]"
            />

            <span>
              Choose a category or
              refine your collection.
            </span>
          </div>
        )}

      </div>
    </aside>
  );
}