export type Customer = {
  id: number;
  name: string;
  email?: string | null;
  phone?: string | null;
  phone_verified_at?: string | null;
  status?: string;
};

export type ProductImage = {
  id: number;
  image: string;
  url?: string | null;
  alt_text?: string | null;
  is_primary?: boolean | number;
  sort_order?: number;
};

export type SizeOption = {
  id: number;
  name: string;
  display_name?: string | null;
};

export type ColorOption = {
  id: number;
  name: string;
  display_name?: string | null;
  hex_code?: string | null;
};

export type DesignOption = {
  id: number;
  product_id: number;
  label?: string | null;
  sort_order?: number;
  status?: string;
  images: ProductImage[];
};

export type ProductVariant = {
  id: number;
  product_id?: number;
  size_id: number;
  color_id: number;
  sku: string;
  mrp: number | string;
  selling_price: number | string;
  status: string;
  size?: SizeOption | null;
  color?: ColorOption | null;
  inventory?: {
    quantity: number;
    reserved_quantity: number;
    available_quantity: number;
    low_stock_limit?: number;
  } | null;
  available_quantity?: number;
};

export type CartItem = {
  id: number;
  quantity: number;
  line_total: number;
  design_option?: DesignOption | null;
  variant: ProductVariant & {
    product?: {
      id: number;
      name: string;
      slug: string;
      primary_image?: ProductImage | null;
    };
  };
};

export type CartData = {
  id: number;
  items: CartItem[];
  item_count: number;
  subtotal: number;
};

export type WishlistItem = {
  id: number;
  wishlist_id: number;
  product_id: number;
  created_at?: string;
  product?: {
    id: number;
    name: string;
    slug: string;
    mrp: number | string;
    selling_price: number | string;
    short_description?: string | null;
    status?: string;
    primary_image?: ProductImage | null;
    category?: { id: number; name: string; slug: string } | null;
  } | null;
};

export type WishlistData = {
  id: number;
  items: WishlistItem[];
  item_count: number;
};
