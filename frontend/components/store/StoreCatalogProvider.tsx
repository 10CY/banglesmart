"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { API_URL } from "@/lib/apiConfig";

export type StoreCategory = {
  id: number;
  parent_id: number | null;
  name: string;
  slug: string;
  image?: string | null;
  description?: string | null;
  status?: string;
  sort_order?: number;
};

type ApiCategory = {
  id: number;
  parent_id: number | null;
  name: string;
  slug: string;
  image?: string | null;
  description?: string | null;
  status?: string;
  sort_order?: number;
  children?: ApiCategory[];
};

type StoreCatalogContextValue = {
  categories: StoreCategory[];
  loading: boolean;
  refreshCategories: () => Promise<void>;
};

const fallbackCategories: StoreCategory[] = [
  {
    id: 1,
    parent_id: null,
    name: "Bridal Bangles",
    slug: "bridal-bangles",
  },
  {
    id: 2,
    parent_id: null,
    name: "Designer Bangles",
    slug: "designer-bangles",
  },
];

const StoreCatalogContext =
  createContext<StoreCatalogContextValue | null>(null);

/*
 * Convert Laravel's nested category response into
 * one flat array.
 *
 * Example:
 *
 * Bridal Bangles
 *   ├── Bridal Chooda
 *   └── Wedding Bangles
 *
 * becomes:
 *
 * [
 *   Bridal Bangles,
 *   Bridal Chooda,
 *   Wedding Bangles
 * ]
 */
function flattenCategories(
  categories: ApiCategory[]
): StoreCategory[] {
  const result: StoreCategory[] = [];

  function walk(items: ApiCategory[]) {
    for (const category of items) {
      result.push({
        id: Number(category.id),

        parent_id:
          category.parent_id === null ||
          category.parent_id === undefined
            ? null
            : Number(category.parent_id),

        name: category.name,
        slug: category.slug,

        image:
          category.image ?? null,

        description:
          category.description ?? null,

        status:
          category.status ?? "active",

        sort_order:
          Number(category.sort_order ?? 0),
      });

      if (
        Array.isArray(category.children) &&
        category.children.length > 0
      ) {
        walk(category.children);
      }
    }
  }

  walk(categories);

  return result;
}

export function StoreCatalogProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [categories, setCategories] =
    useState<StoreCategory[]>(
      fallbackCategories
    );

  const [loading, setLoading] =
    useState(true);

  const refreshCategories =
    useCallback(async () => {
      try {
        setLoading(true);

        const response = await fetch(
          `${API_URL}/store/categories`,
          {
            headers: {
              Accept: "application/json",
            },
            cache: "no-store",
          }
        );

        if (!response.ok) {
          throw new Error(
            `Categories API failed: ${response.status}`
          );
        }

        const json =
          await response.json();

        if (
          json?.success &&
          Array.isArray(json?.data)
        ) {
          /*
           * IMPORTANT:
           *
           * Laravel returns nested children.
           * Flatten them before giving them
           * to Header / Shop.
           */
          const flattened =
            flattenCategories(
              json.data
            );

          setCategories(flattened);

          sessionStorage.setItem(
            "banglesmart_categories",
            JSON.stringify(flattened)
          );

        }
      } catch (error) {
        console.error(
          "Failed to load categories:",
          error
        );
      } finally {
        setLoading(false);
      }
    }, []);

  useEffect(() => {
    /*
     * Remove old cache because your previous
     * cached structure may be incorrect.
     */
    sessionStorage.removeItem(
      "banglesmart_categories"
    );

    void refreshCategories();

    const refresh = () =>
      void refreshCategories();

    window.addEventListener(
      "banglesmart:catalog-refresh",
      refresh
    );

    return () => {
      window.removeEventListener(
        "banglesmart:catalog-refresh",
        refresh
      );
    };
  }, [refreshCategories]);

  const value = useMemo(
    () => ({
      categories,
      loading,
      refreshCategories,
    }),
    [
      categories,
      loading,
      refreshCategories,
    ]
  );

  return (
    <StoreCatalogContext.Provider
      value={value}
    >
      {children}
    </StoreCatalogContext.Provider>
  );
}

export function useStoreCatalog() {
  const context =
    useContext(
      StoreCatalogContext
    );

  if (!context) {
    throw new Error(
      "useStoreCatalog must be used inside StoreCatalogProvider"
    );
  }

  return context;
}