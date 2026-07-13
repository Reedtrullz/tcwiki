import type { Metadata } from "next";
import { connection } from "next/server";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import "./globals.css";

export const metadata: Metadata = {
  title: "THORChain Wiki - Protocol Encyclopedia & Source-Backed Data",
  description: "Community-maintained encyclopedia of THORChain with protocol architecture, economics, governance history, ecosystem context, and current-only live network status from Midgard and THORNode.",
  keywords: "THORChain, RUNE, TCY, cross-chain DEX, decentralized exchange, native asset swap, DeFi, liquidity protocol, AMM, Mimir, THORNode, Midgard",
  openGraph: {
    title: "THORChain Wiki - Protocol Encyclopedia & Source-Backed Data",
    description: "Community-maintained encyclopedia of THORChain with current-only live network status and sourced protocol content.",
    type: "website",
    url: "https://wiki.thorchain.no",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "THORChain Wiki source-backed protocol encyclopedia",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "THORChain Wiki - Protocol Encyclopedia & Source-Backed Data",
    description: "Sourced protocol context for THORChain, RUNE, TCY, Midgard, THORNode, Mimir, and native cross-chain swaps.",
    images: ["/twitter-image"],
  },
  robots: "index, follow",
  metadataBase: new URL("https://wiki.thorchain.no"),
  alternates: {
    canonical: "https://wiki.thorchain.no",
  },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  await connection();

  return (
    <html lang="en" className="dark">
      <head>
        <meta name="theme-color" content="#00D4AA" />
      </head>
      <body className="font-sans antialiased min-h-screen flex flex-col">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-md focus:border focus:border-accent/40 focus:bg-surface-elevated focus:px-3 focus:py-2 focus:text-sm focus:text-slate-100"
        >
          Skip to content
        </a>
        <Header />
        <main id="main" className="flex-1" tabIndex={-1}>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
