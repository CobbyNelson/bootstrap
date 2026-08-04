import type { Metadata, Viewport } from "next";
import { Figtree, Fraunces, Source_Sans_3 } from "next/font/google";
import { SITE } from "@/lib/content";
import { CommandPalette } from "@/components/search/command-palette";
import { CurrencyProvider } from "@/components/providers/currency-provider";
import { CookieConsent } from "@/components/layout/cookie-consent";
import "./globals.css";

/*
 * Type system from the brand sheet — three roles.
 * Coconat and Air are commercial licences, so the closest open equivalents are
 * used: Fraunces for the display serif, Figtree for the uppercase label face.
 * Source Sans is the original and is used as-is.
 */

// Headings — display serif (Coconat role).
const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
  axes: ["SOFT", "WONK"],
});

// Body copy — Source Sans (as specified).
const sourceSans = Source_Sans_3({
  subsets: ["latin"],
  variable: "--font-source-sans",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

// Labels, eyebrows and buttons — uppercase, letterspaced (Air role).
const figtree = Figtree({
  subsets: ["latin"],
  variable: "--font-figtree",
  display: "swap",
  weight: ["500", "600", "700"],
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

export const viewport: Viewport = {
  themeColor: "#df2d25",
  colorScheme: "light",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${fraunces.variable} ${sourceSans.variable} ${figtree.variable}`}>
      <body className="min-h-dvh antialiased">
        <CurrencyProvider>
          {children}
          <CommandPalette />
          <CookieConsent />
        </CurrencyProvider>
      </body>
    </html>
  );
}
