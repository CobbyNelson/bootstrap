import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Figtree, Inter } from "next/font/google";
import { SITE } from "@/lib/content";
import { CommandPalette } from "@/components/search/command-palette";
import { CurrencyProvider } from "@/components/providers/currency-provider";
import { CookieConsent } from "@/components/layout/cookie-consent";
// ChatBox is mounted in the (site) layout, not here — it has no place on the
// pre-launch gate, which this layout also wraps.
import { StaffPresence } from "@/components/chat/staff-presence";
import "./globals.css";

// Headings and labels.
const figtree = Figtree({
  subsets: ["latin"],
  variable: "--font-figtree",
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

// Body & UI.
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
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

export const viewport: Viewport = {
  themeColor: "#df2d25",
  colorScheme: "light",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    // suppressHydrationWarning: the theme script below adds `dark` to <html>
    // before React hydrates, so the server and client class attributes are
    // allowed to differ — that mismatch is the entire point of the script.
    <html lang="en" className={`${figtree.variable} ${inter.variable}`} suppressHydrationWarning>
      <body className="min-h-dvh antialiased">
        {/* Theme before first paint: a stored choice wins, otherwise the clock
            (dark 19:00–06:59). beforeInteractive puts this in <head>, so no
            light frame flashes ahead of a dark page. Keep the storage key and
            hour boundaries in lockstep with components/layout/theme-toggle.tsx. */}
        <Script id="theme-init" strategy="beforeInteractive">
          {"(function(){try{var m=localStorage.getItem('ac-theme');var h=new Date().getHours();var d=m==='dark'||(m!=='light'&&(h>=19||h<7));document.documentElement.classList.toggle('dark',d);}catch(e){}})();"}
        </Script>
        {/* Revealed sections start at opacity:0 and are switched on by an
            IntersectionObserver. With JavaScript unavailable that observer
            never runs and the content would stay invisible, so show it. Scoped
            to <noscript>, so it costs nothing when JS is working.

            This targets .reveal, not an inline style: framer-motion used to
            bake opacity:0 into the server HTML as an attribute, and the rule
            that matched it silently stopped applying the moment the animation
            moved into CSS. */}
        <noscript>
          <style>{`.reveal,.rise-in,.rise-in-delayed{opacity:1!important;transform:none!important;animation:none!important}`}</style>
        </noscript>
        <CurrencyProvider>
          {children}
          <CommandPalette />
          <CookieConsent />
          {/* Global on purpose: a staff member reading the marketplace is
              still reachable, so presence must not be scoped to the admin
              area. Non-staff get one refusal and it stops. */}
          <StaffPresence />
        </CurrencyProvider>
      </body>
    </html>
  );
}
