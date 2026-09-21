"use client";

import { usePathname } from "next/navigation";
import Header from "@/components/store/Header";
import Footer from "@/components/store/Footer";
import { StoreCatalogProvider } from "@/components/store/StoreCatalogProvider";
import { FeedbackProvider } from "@/components/ui/FeedbackProvider";
import { CommerceProvider } from "@/features/commerce/CommerceProvider";

export default function StoreChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname === "/admin" || pathname.startsWith("/admin/");

  if (isAdmin) {
    return <>{children}</>;
  }

  return (
    <FeedbackProvider>
      <CommerceProvider>
        <StoreCatalogProvider>
          <Header />
          <main className="min-h-screen">{children}</main>
          <Footer />
        </StoreCatalogProvider>
      </CommerceProvider>
    </FeedbackProvider>
  );
}
