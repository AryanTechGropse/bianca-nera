import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Script from "next/script";
import StoreProvider from "./StoreProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Bianca Nera",
  description: "Luxury fashion products",
  verification: {
    google: "yVExS7cyDShW-z6VfgIDmstZMf8JA5srO4-0wexpo3k",
  },
  openGraph: {
    title: "Bianca Nera",
    description: "Luxury fashion products",
    url: "https://bianca-nera.com/",
    images: [
      {
        url: "https://bianca-nera.com/assets/img/product4.jpg",
      },
    ],
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <head>
        {/* CSS */}
        <link
          rel="stylesheet"
          href="/assets/vendor/bootstrap/css/bootstrap.min.css"
        />
        <link
          rel="stylesheet"
          href="/assets/vendor/bootstrap-icons/bootstrap-icons.css"
        />
        <link rel="stylesheet" href="/assets/vendor/remixicon/remixicon.css" />
        <link rel="stylesheet" href="/assets/css/style.css" />
      </head>

      <body>
        <StoreProvider>{children}</StoreProvider>

        {/* ✅ Microsoft Clarity */}
        <Script id="clarity" strategy="afterInteractive">
          {`
            (function(c,l,a,r,i,t,y){
              c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
              t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
              y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
            })(window, document, "clarity", "script", "vi8n0uxelk");
          `}
        </Script>

        {/* ✅ Google Analytics */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-B8NTJNN9RN"
          strategy="afterInteractive"
        />
        <Script id="gtag" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-B8NTJNN9RN');
          `}
        </Script>

        {/* ✅ Bootstrap JS */}
        <Script
          src="/assets/vendor/bootstrap/js/bootstrap.bundle.min.js"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
