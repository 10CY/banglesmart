import type { Metadata } from "next";
import "./globals.css";

import StoreChrome from "@/components/store/StoreChrome";

export const metadata: Metadata = {
  title: {
    default: "BanglesMart | Premium Bangles & Jewellery",
    template: "%s | BanglesMart",
  },
  description:
    "Premium bangles and jewellery for weddings, festivals and everyday elegance.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <StoreChrome>{children}</StoreChrome>
      </body>
    </html>
  );
}