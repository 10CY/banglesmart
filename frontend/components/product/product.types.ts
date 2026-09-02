// frontend/components/product/product.types.ts
import type { StoreProductCardData } from "@/components/store/ProductCard";
export type ProductImage = {
  id: number;
  image: string;
  alt_text: string | null;
  is_primary: boolean;
};

export type Size = {
  id: number;
  name: string;
  display_name: string | null;
};

export type Color = {
  id: number;
  name: string;
  display_name: string | null;
  hex_code: string | null;
};

export type Inventory = {
  quantity: number;
  reserved_quantity: number;
};

export type Variant = {
  id: number;

  size_id: number;
  color_id: number;

  sku: string;

  mrp: string | number;
  selling_price: string | number;

  status: string;

  size: Size | null;
  color: Color | null;

  inventory: Inventory | null;
};

export type ReviewUser = {
  id: number;
  name: string;
  email?: string;
};

export type Review = {
  id: number;

  rating: number;

  title: string | null;

  comment: string | null;

  status: "pending" | "approved" | "rejected" | string;

  created_at: string;

  updated_at?: string;

  user?: ReviewUser;
};

export type RecommendedProduct = {
  id: number;

  name: string;

  slug: string;

  short_description?: string | null;

  description?: string | null;

  mrp?: string | number;

  selling_price?: string | number;

  image?: string | null;

  images?: ProductImage[];

  category?: {
    id: number;
    name: string;
    slug: string;
  } | null;

  featured?: boolean;
  best_seller?: boolean;
  new_arrival?: boolean;
};

export type Product = {
  id: number;

  name: string;

  slug: string;

  short_description: string | null;

  description: string | null;

  mrp: string | number;

  selling_price: string | number;

  set_quantity: number;

  featured: boolean;

  best_seller: boolean;

  new_arrival: boolean;

  category: {
    id: number;

    name: string;

    slug: string;
  } | null;

  images: ProductImage[];

  variants: Variant[];

  reviews?: Review[];

  review_count?: number;

  review_average?: number;
  recommended?: StoreProductCardData[];
};