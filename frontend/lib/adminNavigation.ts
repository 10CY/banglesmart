import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  Bell,
  Boxes,
  ClipboardList,
  FileText,
  Heart,
  Home,
  Layers3,
  Mail,
  MessageSquare,
  Package,
  Palette,
  RotateCcw,
  Ruler,
  Settings,
  ShoppingBag,
  ShoppingCart,
  Tag,
  Truck,
  Users,
} from "lucide-react";

export type AdminNavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  keywords?: string[];
};

export type AdminNavGroup = {
  label: string;
  items: AdminNavItem[];
};

export const ADMIN_NAVIGATION: AdminNavGroup[] = [
  {
    label: "Overview",
    items: [
      { label: "Dashboard", href: "/admin", icon: Home, keywords: ["home", "summary"] },
      { label: "Analytics", href: "/admin/analytics", icon: BarChart3, keywords: ["sales", "reports"] },
    ],
  },
  {
    label: "Commerce",
    items: [
      { label: "Orders", href: "/admin/orders", icon: ShoppingBag },
      { label: "Invoices", href: "/admin/invoices", icon: FileText, keywords: ["billing", "pdf"] },
      { label: "Products", href: "/admin/products", icon: Package, keywords: ["catalogue", "catalog"] },
      { label: "Inventory", href: "/admin/inventory", icon: Boxes, keywords: ["stock"] },
    ],
  },
  {
    label: "Catalog",
    items: [
      { label: "Categories", href: "/admin/categories", icon: Layers3 },
      { label: "Materials", href: "/admin/materials", icon: Layers3 },
      { label: "Sizes", href: "/admin/sizes", icon: Ruler },
      { label: "Colors", href: "/admin/colors", icon: Palette },
    ],
  },
  {
    label: "Customers",
    items: [
      { label: "Customers", href: "/admin/customers", icon: Users },
      { label: "Customer Carts", href: "/admin/carts", icon: ShoppingCart, keywords: ["abandoned carts"] },
      { label: "Wishlists", href: "/admin/wishlists", icon: Heart },
      { label: "Reviews", href: "/admin/reviews", icon: MessageSquare },
    ],
  },
  {
    label: "Marketing",
    items: [
      { label: "Discounts", href: "/admin/discounts", icon: Tag, keywords: ["coupons", "offers"] },
      { label: "Newsletter", href: "/admin/newsletter", icon: Mail, keywords: ["subscribers"] },
      { label: "Notifications", href: "/admin/notifications", icon: Bell },
    ],
  },
  {
    label: "Operations",
    items: [
      { label: "Shipping", href: "/admin/shipping", icon: Truck },
      { label: "Returns", href: "/admin/returns", icon: RotateCcw },
      { label: "Audit Logs", href: "/admin/audit-logs", icon: ClipboardList },
      { label: "Settings", href: "/admin/settings", icon: Settings },
    ],
  },
];

export const ADMIN_NAV_ITEMS = ADMIN_NAVIGATION.flatMap((group) => group.items);
