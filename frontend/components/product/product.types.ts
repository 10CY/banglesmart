// frontend/components/product/product.types.ts

import type { StoreProductCardData } from "@/components/store/ProductCard";

/*
|--------------------------------------------------------------------------
| Product Image
|--------------------------------------------------------------------------
*/

export type ProductImage = {
  id: number;
  image: string;
  alt_text: string | null;
  is_primary: boolean;
};

/*
|--------------------------------------------------------------------------
| Size
|--------------------------------------------------------------------------
*/

export type Size = {
  id: number;
  name: string;
  display_name: string | null;
};

/*
|--------------------------------------------------------------------------
| Color
|--------------------------------------------------------------------------
*/

export type Color = {
  id: number;
  name: string;
  display_name: string | null;
  hex_code: string | null;
};

/*
|--------------------------------------------------------------------------
| Inventory
|--------------------------------------------------------------------------
*/

export type Inventory = {
  quantity: number;
  reserved_quantity: number;
};

/*
|--------------------------------------------------------------------------
| Material
|--------------------------------------------------------------------------
*/

export type Material = {
  id: number;
  name: string;
};

/*
|--------------------------------------------------------------------------
| Variant
|--------------------------------------------------------------------------
*/

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

/*
|--------------------------------------------------------------------------
| Review User
|--------------------------------------------------------------------------
*/

export type ReviewUser = {
  id: number;
  name: string;
  email?: string;
};

/*
|--------------------------------------------------------------------------
| Review
|--------------------------------------------------------------------------
*/

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

/*
|--------------------------------------------------------------------------
| Recommended Product
|--------------------------------------------------------------------------
*/

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

/*
|--------------------------------------------------------------------------
| Product
|--------------------------------------------------------------------------
*/

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

  /*
  |--------------------------------------------------------------------------
  | Category
  |--------------------------------------------------------------------------
  */

  category: {
    id: number;
    name: string;
    slug: string;
  } | null;

  /*
  |--------------------------------------------------------------------------
  | Material
  |--------------------------------------------------------------------------
  */

  material: Material | null;

  /*
  |--------------------------------------------------------------------------
  | Images
  |--------------------------------------------------------------------------
  */

  images: ProductImage[];

  /*
  |--------------------------------------------------------------------------
  | Variants
  |--------------------------------------------------------------------------
  */

  variants: Variant[];

  /*
  |--------------------------------------------------------------------------
  | Reviews
  |--------------------------------------------------------------------------
  */

  reviews?: Review[];

  review_count?: number;

  review_average?: number;

  /*
  |--------------------------------------------------------------------------
  | Recommended Products
  |--------------------------------------------------------------------------
  */

  recommended?: StoreProductCardData[];
};