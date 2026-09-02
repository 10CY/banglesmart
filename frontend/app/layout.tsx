import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import StoreChrome from "@/components/store/StoreChrome";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"], display: "swap" });
const playfair = Playfair_Display({ variable: "--font-playfair", subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  title: { default: "BanglesMart | Premium Bangles & Jewellery", template: "%s | BanglesMart" },
  description: "Premium bangles and jewellery for weddings, festivals and everyday elegance.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${playfair.variable} antialiased`}>
        <StoreChrome>{children}</StoreChrome>
      </body>
    </html>
  );
}
