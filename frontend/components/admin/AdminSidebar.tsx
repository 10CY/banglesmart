"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  Home,
  ShoppingBag,
  Package,
  Layers3,
  Boxes,
  Users,
  Tag,
  BarChart3,
  Palette,
  Settings,
  Ruler,
  Truck,
  MessageSquare,
  RotateCcw,
  Mail,
  ClipboardList,
  Bell,
  FileText,
} from "lucide-react";

const menuItems = [
  {
    label: "Home",
    href: "/admin",
    icon: Home,
  },

  {
    label: "Orders",
    href: "/admin/orders",
    icon: ShoppingBag,
  },

  {
    label: "Products",
    href: "/admin/products",
    icon: Package,
  },

  {
    label: "Categories",
    href: "/admin/categories",
    icon: Layers3,
  },

  {
    label: "Materials",
    href: "/admin/materials",
    icon: Layers3,
  },

  {
    label: "Sizes",
    href: "/admin/sizes",
    icon: Ruler,
  },

  {
    label: "Colors",
    href: "/admin/colors",
    icon: Palette,
  },

  {
    label: "Inventory",
    href: "/admin/inventory",
    icon: Boxes,
  },

  {
    label: "Customers",
    href: "/admin/customers",
    icon: Users,
  },

  {
    label: "Discounts",
    href: "/admin/discounts",
    icon: Tag,
  },

  {
    label: "Shipping",
    href: "/admin/shipping",
    icon: Truck,
  },

  {
    label: "Reviews",
    href: "/admin/reviews",
    icon: MessageSquare,
  },

  {
    label: "Returns",
    href: "/admin/returns",
    icon: RotateCcw,
  },

  {
    label: "Notifications",
    href: "/admin/notifications",
    icon: Bell,
  },

  {
    label: "Invoices",
    href: "/admin/invoices",
    icon: FileText,
  },

  {
    label: "Newsletter",
    href: "/admin/newsletter",
    icon: Mail,
  },

  {
    label: "Audit Logs",
    href: "/admin/audit-logs",
    icon: ClipboardList,
  },

  {
    label: "Analytics",
    href: "/admin/analytics",
    icon: BarChart3,
  },

  {
    label: "Settings",
    href: "/admin/settings",
    icon: Settings,
  },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 z-30 h-screen w-64 border-r border-gray-200 bg-white">

      {/* ------------------------------------------------------------------ */}
      {/* BRAND                                                              */}
      {/* ------------------------------------------------------------------ */}

      <div className="flex h-16 items-center border-b border-gray-200 px-5">

        <div>
          <h1 className="text-xl font-bold text-gray-900">
            BanglesMart
          </h1>

          <p className="text-xs text-gray-500">
            Admin
          </p>
        </div>

      </div>


      {/* ------------------------------------------------------------------ */}
      {/* NAVIGATION                                                         */}
      {/* ------------------------------------------------------------------ */}

      <nav className="h-[calc(100vh-4rem)] overflow-y-auto p-3">

        <div className="space-y-1">

          {menuItems.map((item) => {

            const Icon = item.icon;

            const active =
              pathname === item.href ||
              (
                item.href !== "/admin" &&
                pathname.startsWith(
                  `${item.href}/`
                )
              );

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  flex
                  items-center
                  gap-3
                  rounded-lg
                  px-3
                  py-2.5
                  text-sm
                  font-medium
                  transition
                  ${
                    active
                      ? "bg-gray-900 text-white"
                      : "text-gray-700 hover:bg-gray-100"
                  }
                `}
              >

                <Icon
                  size={18}
                  strokeWidth={1.8}
                />

                <span>
                  {item.label}
                </span>

              </Link>
            );

          })}

        </div>

      </nav>

    </aside>
  );
}