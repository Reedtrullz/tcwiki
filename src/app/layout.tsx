import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });

export const metadata: Metadata = {
  title: "THORChain Wiki — Protocol Encyclopedia & Live Data",
  description: "Community-maintained encyclopedia of THORChain — decentralized cross-chain liquidity protocol. Architecture, economics, governance, ecosystem, and live network statistics. Native swaps for Bitcoin, Ethereum, USDT, USDC with no wrapping or intermediaries.",
  keywords: "THORChain, RUNE, cross-chain DEX, decentralized exchange, Bitcoin swap, native asset swap, DeFi, liquidity protocol, AMM, crypto, blockchain, censorship resistant, no KYC, USDT, USDC",
  openGraph: {
    title: "THORChain Wiki — Protocol Encyclopedia & Live Data",
    description: "Community-maintained encyclopedia of THORChain — decentralized cross-chain liquidity protocol. Architecture, economics, governance, ecosystem, and live network data from Midgard API.",
    type: "website",
    url: "https://wiki.thorchain.no",
  },
  twitter: {
    card: "summary_large_image",
    title: "THORChain Wiki — Protocol Encyclopedia & Live Data",
    description: "Decentralized cross-chain liquidity protocol. Native swaps for Bitcoin, Ethereum, USDT, USDC. No wrapping, no bridges, no intermediaries.",
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
              "description": "Community-maintained encyclopedia of THORChain — decentralized cross-chain liquidity protocol. Native swaps without wrapping, bridges, or intermediaries.",
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
