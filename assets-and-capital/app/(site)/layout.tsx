import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { ChatBox } from "@/components/chat/chat-box";
import { PageBeacon } from "@/components/analytics/page-beacon";

/**
 * Kwaku sits here rather than in the root layout so he does not appear on the
 * pre-launch gate, which has no navigation and nothing for him to answer about.
 */
export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-[var(--radius-button)] focus:bg-ink focus:px-4 focus:py-2 focus:text-white"
      >
        Skip to content
      </a>
      <Navbar />
      <main id="main">{children}</main>
      <Footer />
      <ChatBox />
      {/* Public pages only: the gate and the admin area are not audience. */}
      <PageBeacon />
    </>
  );
}
