"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronDown, LogOut, Settings, User } from "lucide-react";
import { logoutUser } from "@/lib/actions/auth";

/**
 * The profile chip, with somewhere to go.
 *
 * It was a `<div>` showing "Platform Admin / Super admin" to whoever was signed
 * in — the wrong name, and nothing to click. On an admin surface the profile is
 * where sign-out lives, so its absence meant the only way out was to find the
 * public site's own menu.
 */
export function ProfileMenu({
  me,
  profileHref = "/dashboard/settings",
  settingsHref = "/admin/translations",
  settingsLabel = "Site settings",
}: {
  me: { name: string; role: string; initials: string } | null;
  /** Where "Your profile" goes. */
  profileHref?: string;
  /** Where the second item goes — the admin's is the translations desk, the
      portal's is its own settings page. */
  settingsHref?: string;
  settingsLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    const onDown = (e: MouseEvent) => {
      if (!wrap.current?.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("mousedown", onDown);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("mousedown", onDown);
    };
  }, [open]);

  return (
    <div ref={wrap} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="flex items-center gap-2.5 rounded-[var(--radius-button)] border border-ink/10 bg-white py-1 pl-1 pr-2.5 transition-colors hover:border-ink/25"
      >
        <span className="grid h-8 w-8 place-items-center rounded-[var(--radius-button)] bg-brand-600 text-xs font-semibold text-white ring-1 ring-navy-500/50">
          {me?.initials ?? "—"}
        </span>
        <span className="hidden leading-tight sm:block">
          <span className="block text-xs font-medium text-ink">{me?.name ?? "Loading…"}</span>
          <span className="block text-[0.65rem] text-ink/65">{me?.role ?? ""}</span>
        </span>
        <ChevronDown className="h-3.5 w-3.5 text-ink/45" />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute end-0 top-full z-50 mt-1 min-w-[12rem] overflow-hidden rounded-[var(--radius-button)] border border-ink/10 bg-white py-1 shadow-[var(--shadow-card)]"
        >
          <div className="border-b border-ink/[0.06] px-3 py-2 sm:hidden">
            <p className="text-sm font-medium text-ink">{me?.name ?? ""}</p>
            <p className="text-xs text-ink/60">{me?.role ?? ""}</p>
          </div>
          <Link
            href={profileHref}
            role="menuitem"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 px-3 py-2 text-sm text-ink/75 transition-colors hover:bg-brand-50 hover:text-ink"
          >
            <User className="h-4 w-4" /> Your profile
          </Link>
          {/* Skipped when it would repeat the item above it — in the portal
              both resolve to the same settings page, and two rows going to one
              destination is a menu pretending to offer a choice. */}
          {settingsHref !== profileHref && (
          <Link
            href={settingsHref}
            role="menuitem"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 px-3 py-2 text-sm text-ink/75 transition-colors hover:bg-brand-50 hover:text-ink"
          >
            <Settings className="h-4 w-4" /> {settingsLabel}
          </Link>
          )}
          {/* A server action, so the session cookie is cleared server-side
              rather than the client merely forgetting it exists. */}
          <form action={logoutUser} className="border-t border-ink/[0.06]">
            <button
              type="submit"
              role="menuitem"
              className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-ink/75 transition-colors hover:bg-brand-50 hover:text-ink"
            >
              <LogOut className="h-4 w-4" /> Sign out
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
