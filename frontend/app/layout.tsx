import type { Metadata } from "next";
import "./globals.css";
import Script from "next/script";
import StoreChrome from "@/components/store/StoreChrome";

export const metadata: Metadata = {
  title: {
    default: "Bangles Online in India | BanglesMart",
    template: "%s | BanglesMart",
  },

  description:
    "Shop stylish bangles online in India at BanglesMart. Explore bridal, wedding, designer, kundan and traditional bangles for every occasion.",

  keywords: [
    "bangles online",
    "bangles online India",
    "bangles online shopping",
    "buy bangles online",
    "bridal bangles",
    "designer bangles",
    "kundan bangles",
    "traditional bangles",
  ],

  alternates: {
    canonical: "https://banglesmart.com/",
  },
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