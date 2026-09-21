export const API_ROUTES = {
  customer: {
    me: "/customer/me",
    cart: "/customer/cart",
    cartItems: "/customer/cart/items",
    wishlist: "/customer/wishlist",
    requestOtp: "/customer/auth/phone/request-otp",
    verifyOtp: "/customer/auth/phone/verify-otp",
    login: "/customer/login",
  },
  admin: {
    products: "/admin/products",
    carts: "/admin/carts",
    wishlists: "/admin/wishlists",
    customers: "/admin/customers",
  },
} as const;
