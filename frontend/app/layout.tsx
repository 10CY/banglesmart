import type { Metadata } from "next";
import "./globals.css";
import Script from "next/script";
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
        <Script
            src="https://www.googletagmanager.com/gtag/js?id=G-7CQDD0CSQ6"
            strategy="afterInteractive"
          />

          <Script id="google-analytics" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){window.dataLayer.push(arguments);}
              gtag('js', new Date());

              gtag('config', 'G-7CQDD0CSQ6');
            `}
          </Script>
      </body>
    </html>
  );
}