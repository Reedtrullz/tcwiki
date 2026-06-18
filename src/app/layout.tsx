import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });

export const metadata: Metadata = {
  title: "THORChain Wiki - Protocol Encyclopedia & Source-Backed Data",
  description: "Community-maintained encyclopedia of THORChain with protocol architecture, economics, governance history, ecosystem context, and current-only live network status from Midgard and THORNode.",
  keywords: "THORChain, RUNE, TCY, cross-chain DEX, decentralized exchange, native asset swap, DeFi, liquidity protocol, AMM, Mimir, THORNode, Midgard",
  openGraph: {
    title: "THORChain Wiki - Protocol Encyclopedia & Source-Backed Data",
    description: "Community-maintained encyclopedia of THORChain with current-only live network status and sourced protocol content.",
    type: "website",
    url: "https://wiki.thorchain.no",
  },
  twitter: {
    card: "summary_large_image",
    title: "THORChain Wiki - Protocol Encyclopedia & Source-Backed Data",
    description: "Sourced protocol context for THORChain, RUNE, TCY, Midgard, THORNode, Mimir, and native cross-chain swaps.",
    site: "@thorchain_org",
  },
  robots: "index, follow",
  metadataBase: new URL("https://wiki.thorchain.no"),
  alternates: {
    canonical: "https://wiki.thorchain.no",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${mono.variable} dark`}>
      <head>
        <meta name="theme-color" content="#00D4AA" />
        <link rel="alternate" hrefLang="en" href="https://wiki.thorchain.no" />
        <link rel="alternate" hrefLang="x-default" href="https://wiki.thorchain.no" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              "name": "THORChain Wiki",
              "description": "Community-maintained encyclopedia of THORChain with source-backed protocol context and current-only live network status.",
              "url": "https://wiki.thorchain.no",
              "potentialAction": {
                "@type": "SearchAction",
                "target": "https://wiki.thorchain.no/search?q={search_term_string}",
                "query-input": "required name=search_term_string",
              },
            }),
          }}
        />
      </head>
      <body className="font-sans antialiased min-h-screen flex flex-col">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
