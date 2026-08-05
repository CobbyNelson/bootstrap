import Link from "next/link";
import { ArrowRight, Home, Search } from "lucide-react";
import { Logo } from "@/components/layout/logo";

export default function NotFound() {
  return (
    <main className="grid min-h-dvh place-items-center px-6 py-16">
      <div className="w-full max-w-lg text-center">
        <div className="flex justify-center">
          <Logo />
        </div>
        <p className="mt-10 font-display text-[6rem] font-extrabold leading-none tracking-tight text-brand-600">404</p>
        <h1 className="mt-2 font-display text-2xl font-bold text-navy-700">This page took a different exit</h1>
        <p className="mx-auto mt-3 max-w-sm text-ink/60">
          The page you&apos;re looking for was moved, renamed, or never existed. Let&apos;s get you back to
          opportunity.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 rounded-[var(--radius-button)] bg-brand-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
          >
            <Home className="h-4 w-4" /> Back home
          </Link>
          <Link
            href="/marketplace"
            className="inline-flex items-center justify-center gap-2 rounded-[var(--radius-button)] border border-ink/12 bg-white px-5 py-3 text-sm font-semibold text-ink transition-colors hover:border-ink/25"
          >
            <Search className="h-4 w-4" /> Explore marketplace <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </main>
  );
}
