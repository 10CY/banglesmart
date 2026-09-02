import { notFound } from "next/navigation";

import { API_URL } from "@/lib/api";

import CategoryPageClient from "@/components/store/CategoryPageClient";
import type { FilterCategory } from "@/components/store/CategoryFilters";

type Category = {
  id: number;
  name: string;
  slug: string;
  parent_id: number | null;
  description?: string | null;
  image?: string | null;
  children?: Category[];
};

type PageProps = {
  params: Promise<{
    category: string[];
  }>;

  searchParams: Promise<{
    search?: string;
    min_price?: string;
    max_price?: string;
    sort?: string;
    featured?: string;
    best_seller?: string;
    new_arrival?: string;
    page?: string;
  }>;
};

async function getCategories(): Promise<Category[]> {
  try {
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
      return [];
    }

    const json = await response.json();

    if (!Array.isArray(json?.data)) {
      return [];
    }

    return json.data.map((item: any) => ({
      id: Number(item.id),
      name: item.name,
      slug: item.slug,

      parent_id:
        item.parent_id === null ||
        item.parent_id === undefined
          ? null
          : Number(item.parent_id),

      description: item.description ?? null,

      image: item.image ?? null,

      children: Array.isArray(item.children)
        ? item.children.map((child: any) => ({
            id: Number(child.id),
            name: child.name,
            slug: child.slug,

            parent_id:
              child.parent_id === null ||
              child.parent_id === undefined
                ? null
                : Number(child.parent_id),

            description:
              child.description ?? null,

            image:
              child.image ?? null,

            children: [],
          }))
        : [],
    }));
  } catch (error) {
    console.error(
      "Categories request failed:",
      error
    );

    return [];
  }
}

export default async function CategoryPage({
  params,
  searchParams,
}: PageProps) {
  const {
    category: segments,
  } = await params;

  const filters =
    await searchParams;

  if (
    !segments ||
    segments.length === 0 ||
    segments.length > 2
  ) {
    notFound();
  }

  const categories =
    await getCategories();

  if (!categories.length) {
    notFound();
  }

  const parent =
    categories.find(
      (item) =>
        item.slug === segments[0] &&
        item.parent_id === null
    );

  if (!parent) {
    notFound();
  }

  let selectedCategory: Category =
    parent;

  let child: Category | null =
    null;

  if (segments.length === 2) {
    child =
      parent.children?.find(
        (item) =>
          item.slug === segments[1]
      ) || null;

    if (!child) {
      notFound();
    }

    selectedCategory = child;
  }

  const filterCategories: FilterCategory[] =
    categories.map((item) => ({
      id: item.id,
      name: item.name,
      slug: item.slug,
      parent_id: item.parent_id,

      children:
        item.children?.map(
          (childItem) => ({
            id: childItem.id,
            name: childItem.name,
            slug: childItem.slug,

            parent_id:
              childItem.parent_id,

            children: [],
          })
        ) || [],
    }));

  return (
    <CategoryPageClient
      categories={filterCategories}
      parent={parent}
      selectedCategory={selectedCategory}
      child={child}
      initialFilters={{
        search:
          filters.search || "",

        minPrice:
          filters.min_price || "",

        maxPrice:
          filters.max_price || "",

        sort:
          filters.sort || "",

        newArrival:
          filters.new_arrival === "1",

        bestSeller:
          filters.best_seller === "1",

        featured:
          filters.featured === "1",

        page: Math.max(
          1,
          Number(
            filters.page || "1"
          )
        ),
      }}
    />
  );
}