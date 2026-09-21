// frontend/components/product/product.types.ts

import type { StoreProductCardData } from "@/components/store/ProductCard";

export type ProductImage = {
  id: number;

  product_id?: number;

  design_option_id?: number;

  /*
  |--------------------------------------------------------------------------
  | Color-specific image
  |--------------------------------------------------------------------------
  |
  | null / undefined = General image
  | number           = Image belongs to that color
  |
  */
  color_id?: number | null;

  image: string;

  url?: string | null;

  alt_text: string | null;

  is_primary: boolean;

  sort_order?: number;
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

  available_quantity?: number;
};

export type Material = {
  id: number;

  name: string;
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

export type DesignOption = {
  id: number;

  product_id: number;

  label: string | null;

  status: string;

  sort_order: number;

  /*
  |--------------------------------------------------------------------------
  | Design Images
  |--------------------------------------------------------------------------
  |
  | Each image can now optionally belong to a color.
  |
  | Example:
  |
  | Square + Pink
  | Square + Black
  | Square + Deep Maroon
  |
  */
  images: ProductImage[];
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

  status:
    | "pending"
    | "approved"
    | "rejected"
    | string;

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

  material?: Material | null;

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

  material: Material | null;

  /*
  |--------------------------------------------------------------------------
  | Product Images
  |--------------------------------------------------------------------------
  |
  | These may be:
  |
  | General images
  | or
  | Color-specific images
  |
  */
  images: ProductImage[];

  /*
  |--------------------------------------------------------------------------
  | Variants
  |--------------------------------------------------------------------------
  |
  | Each variant represents:
  |
  | Size + Color
  |
  */
  variants: Variant[];

  /*
  |--------------------------------------------------------------------------
  | Optional Design Options
  |--------------------------------------------------------------------------
  */
  design_options?: DesignOption[];

  reviews?: Review[];

  review_count?: number;

  review_average?: number;

  recommended?: StoreProductCardData[];
};