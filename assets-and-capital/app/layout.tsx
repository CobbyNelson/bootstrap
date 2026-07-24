import type { Metadata } from "next";
import { Figtree, Manrope } from "next/font/google";
import { SITE } from "@/lib/content";
import { CommandPalette } from "@/components/search/command-palette";
import { CurrencyProvider } from "@/components/providers/currency-provider";
import "./globals.css";

// Titles — friendly geometric sans.
const figtree = Figtree({
  subsets: ["latin"],
  variable: "--font-figtree",
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

// Content — clean modern sans.
const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  metadataBase: new URL(`https://${SITE.domain}`),
  title: {
    default: `${SITE.name} — ${SITE.tagline}`,
    template: `%s · ${SITE.name}`,
  },
  description: SITE.description,
  keywords: [
    "investment marketplace",
    "capital raising",
    "private equity",
    "venture capital",
    "deal making",
    "investor matching",
    "Africa investment",
  ],
  authors: [{ name: SITE.legalName }],
  openGraph: {
    type: "website",
    siteName: SITE.name,
    title: `${SITE.name} — ${SITE.tagline}`,
    description: SITE.description,
    url: `https://${SITE.domain}`,
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE.name} — ${SITE.tagline}`,
    description: SITE.description,
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${figtree.variable} ${manrope.variable}`}>
      <body className="min-h-dvh antialiased">
        <CurrencyProvider>
          {children}
          <CommandPalette />
        </CurrencyProvider>
      </body>
    </html>
  );
}
