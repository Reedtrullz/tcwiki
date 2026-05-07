import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "THORChain Wiki - Comprehensive THORChain Knowledge Base",
  description: "Complete encyclopedia of THORChain protocol including documentation, statistics, ecosystem, governance and historical data. Real-time data from Midgard API.",
  keywords: "THORChain, RUNE, cross-chain, DeFi, liquidity, AMM, crypto, blockchain",
  openGraph: {
    title: "THORChain Wiki - Comprehensive THORChain Knowledge Base",
    description: "Complete encyclopedia of THORChain protocol including documentation, statistics, ecosystem and governance.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} antialiased`}>
        <Header />
        <main className="min-h-screen">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
