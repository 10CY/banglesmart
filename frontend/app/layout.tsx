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
      <head>
        {/* Google Tag Manager */}
        <Script id="google-tag-manager" strategy="beforeInteractive">
          {`
            (function(w,d,s,l,i){
              w[l]=w[l]||[];
              w[l].push({
                'gtm.start': new Date().getTime(),
                event:'gtm.js'
              });

              var f=d.getElementsByTagName(s)[0],
                  j=d.createElement(s),
                  dl=l!='dataLayer'?'&l='+l:'';

              j.async=true;
              j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;
              f.parentNode.insertBefore(j,f);
            })(window,document,'script','dataLayer','GTM-WQLZGGHH');
          `}
        </Script>
        {/* End Google Tag Manager */}
      </head>

      <body>
        {/* Google Tag Manager noscript */}
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-WQLZGGHH"
            height="0"
            width="0"
            style={{
              display: "none",
              visibility: "hidden",
            }}
            title="Google Tag Manager"
          />
        </noscript>
        {/* End Google Tag Manager noscript */}

        <StoreChrome>{children}</StoreChrome>

        {/* Google Analytics 4 */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-7CQDD0CSQ6"
          strategy="afterInteractive"
        />

        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];

            function gtag() {
              window.dataLayer.push(arguments);
            }

            gtag('js', new Date());

            gtag('config', 'G-7CQDD0CSQ6');
          `}
        </Script>
      </body>
    </html>
  );
}
