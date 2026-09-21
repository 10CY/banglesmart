"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { customerApiFetch } from "@/lib/customerApi";
import { API_ROUTES } from "@/lib/routes";
import type { Customer } from "@/types/ecommerce";

type CommerceContextValue = {
  customer: Customer | null;
  cartCount: number;
  wishlistCount: number;
  loadingCustomer: boolean;
  refreshCommerce: () => Promise<void>;
  setCartCount: (count: number) => void;
  setWishlistCount: (count: number) => void;
  requireLogin: (redirectTo?: string) => boolean;
  signOut: () => void;
};

const CommerceContext = createContext<CommerceContextValue | null>(null);

export function CommerceProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [cartCount, setCartCountState] = useState(0);
  const [wishlistCount, setWishlistCountState] = useState(0);
  const [loadingCustomer, setLoadingCustomer] = useState(true);

  const refreshCommerce = useCallback(async () => {
    const token = localStorage.getItem("customer_token");
    if (!token) {
      setCustomer(null);
      setCartCountState(0);
      setWishlistCountState(0);
      setLoadingCustomer(false);
      return;
    }

    try {
      const stored = localStorage.getItem("customer_user");
      if (stored) {
        try { setCustomer(JSON.parse(stored)); } catch { localStorage.removeItem("customer_user"); }
      }

      const [meResponse, cartResponse, wishlistResponse] = await Promise.all([
        customerApiFetch(API_ROUTES.customer.me),
        customerApiFetch(API_ROUTES.customer.cart),
        customerApiFetch(API_ROUTES.customer.wishlist),
      ]);

      if (meResponse.status === 401) {
        localStorage.removeItem("customer_token");
        localStorage.removeItem("customer_user");
        setCustomer(null);
        setCartCountState(0);
        setWishlistCountState(0);
        return;
      }

      if (meResponse.ok) {
        const json = await meResponse.json();
        const next = json?.data || json?.user || json;
        setCustomer(next);
        localStorage.setItem("customer_user", JSON.stringify(next));
      }
      if (cartResponse.ok) {
        const json = await cartResponse.json();
        setCartCountState(Number(json?.data?.item_count || 0));
      }
      if (wishlistResponse.ok) {
        const json = await wishlistResponse.json();
        setWishlistCountState(Number(json?.data?.item_count || 0));
      }
    } finally {
      setLoadingCustomer(false);
    }
  }, []);

  useEffect(() => {
    void refreshCommerce();
    const refresh = () => void refreshCommerce();
    window.addEventListener("banglesmart:customer-refresh", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("banglesmart:customer-refresh", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, [refreshCommerce]);

  const value = useMemo<CommerceContextValue>(() => ({
    customer,
    cartCount,
    wishlistCount,
    loadingCustomer,
    refreshCommerce,
    setCartCount: (count) => setCartCountState(Math.max(0, count)),
    setWishlistCount: (count) => setWishlistCountState(Math.max(0, count)),
    requireLogin: (redirectTo = "/login") => {
      if (localStorage.getItem("customer_token")) return true;
      router.push(redirectTo);
      return false;
    },
    signOut: () => {
      localStorage.removeItem("customer_token");
      localStorage.removeItem("customer_user");
      setCustomer(null);
      setCartCountState(0);
      setWishlistCountState(0);
      router.push("/login");
    },
  }), [customer, cartCount, wishlistCount, loadingCustomer, refreshCommerce, router]);

  return <CommerceContext.Provider value={value}>{children}</CommerceContext.Provider>;
}

export function useCommerce() {
  const context = useContext(CommerceContext);
  if (!context) throw new Error("useCommerce must be used inside CommerceProvider.");
  return context;
}
