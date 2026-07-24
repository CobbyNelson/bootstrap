import type { Metadata } from "next";
import { Inter, Fraunces, Space_Grotesk } from "next/font/google";
import { SITE } from "@/lib/content";
import { CommandPalette } from "@/components/search/command-palette";
import { CurrencyProvider } from "@/components/providers/currency-provider";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

// Editorial serif display — high-contrast, optical. Draws on the warm
// editorial reference (sample 3).
const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
});

// Grotesque accent face for kickers, marquees, numerals and tags — the
// agency energy from samples 1–2.
const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  display: "swap",
  weight: ["400", "500", "600", "700"],
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
    <html lang="en" className={`${inter.variable} ${fraunces.variable} ${spaceGrotesk.variable}`}>
      <body className="min-h-dvh antialiased">
        <CurrencyProvider>
          {children}
          <CommandPalette />
        </CurrencyProvider>
      </body>
    </html>
  );
}
