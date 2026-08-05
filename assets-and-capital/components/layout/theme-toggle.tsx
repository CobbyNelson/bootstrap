"use client";

import { useCallback, useEffect, useState } from "react";
import { useMounted } from "@/lib/use-mounted";
import { Clock, Sun, Moon } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Theme control: Auto / Light / Dark.
 *
 * Auto follows the clock — dark from 19:00 to 06:59 local time — and is the
 * default. A button choice is stored in localStorage (`ac-theme`) and wins
 * until the user returns to Auto; "auto" itself is stored as an ABSENT key, so
 * a visitor who has never touched the control keeps following the clock.
 *
 * The class flip on <html> happens before first paint via the inline script in
 * app/layout.tsx; this component only has to keep the document in sync after
 * interaction, when the clock crosses a boundary while the page is open (the
 * minute interval), and when another tab changes the choice (storage event).
 * THEME_KEY / DARK_FROM / DARK_UNTIL must stay in lockstep with that script.
 */

const THEME_KEY = "ac-theme";
const DARK_FROM = 19; // 19:00 —
const DARK_UNTIL = 7; //       — 06:59

type Mode = "auto" | "light" | "dark";

function nightNow(): boolean {
  const h = new Date().getHours();
  return h >= DARK_FROM || h < DARK_UNTIL;
}

function isDark(mode: Mode): boolean {
  return mode === "dark" || (mode === "auto" && nightNow());
}

function applyTheme(mode: Mode) {
  document.documentElement.classList.toggle("dark", isDark(mode));
}

const OPTIONS: { mode: Mode; icon: typeof Sun; label: string }[] = [
  { mode: "auto", icon: Clock, label: "Auto — dark after 7pm" },
  { mode: "light", icon: Sun, label: "Light" },
  { mode: "dark", icon: Moon, label: "Dark" },
];

export function ThemeToggle({
  tone = "ink",
  className,
}: {
  /** "light" renders white-on-photo styling for the transparent navbar state. */
  tone?: "ink" | "light";
  className?: string;
}) {
  // The stored mode must be present from the FIRST client render. The obvious
  // read-it-in-an-effect version has a mount-tick race: the interval effect
  // fires once with the default "auto" before the setMode from the read lands,
  // re-applying clock-dark over a stored "light" — measured, not theoretical.
  // A lazy initializer closes the gap. Hydration stays clean because nothing
  // in the markup depends on `mode` until `mounted` is true.
  const [mode, setMode] = useState<Mode>(() => {
    if (typeof window === "undefined") return "auto";
    const stored = localStorage.getItem(THEME_KEY);
    return stored === "light" || stored === "dark" ? stored : "auto";
  });
  const mounted = useMounted();

  useEffect(() => {
    // Idempotent with the pre-paint script in app/layout.tsx; also covers the
    // no-script edge (extensions, hard refresh oddities). No setState here —
    // the effect only pushes state OUT to the document, which is what effects
    // are for.
    applyTheme(mode);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const choose = useCallback((next: Mode) => {
    setMode(next);
    // Absent key = auto, so a fresh visitor and a returned-to-auto visitor are
    // the same state rather than two subtly different ones.
    if (next === "auto") localStorage.removeItem(THEME_KEY);
    else localStorage.setItem(THEME_KEY, next);
    applyTheme(next);
  }, []);

  // In auto, re-evaluate each minute so an open page crosses 19:00 / 07:00
  // without needing a reload.
  useEffect(() => {
    if (mode !== "auto") return;
    applyTheme("auto");
    const id = setInterval(() => applyTheme("auto"), 60_000);
    return () => clearInterval(id);
  }, [mode]);

  // Another tab changed the preference — follow it.
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== THEME_KEY) return;
      const next: Mode =
        e.newValue === "light" || e.newValue === "dark" ? e.newValue : "auto";
      setMode(next);
      applyTheme(next);
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  return (
    <div
      role="group"
      aria-label="Colour theme"
      className={cn(
        "flex items-center gap-0.5 rounded-[var(--radius-button)] border p-0.5",
        tone === "light" ? "border-white/25 bg-white/10 backdrop-blur" : "border-ink/12 bg-paper-2/60",
        className
      )}
    >
      {OPTIONS.map((opt) => {
        const active = mounted && mode === opt.mode;
        return (
          <button
            key={opt.mode}
            type="button"
            title={opt.label}
            aria-label={opt.label}
            aria-pressed={active}
            onClick={() => choose(opt.mode)}
            className={cn(
              "grid h-7 w-7 place-items-center rounded-[var(--radius-button)] transition-colors",
              active
                ? tone === "light"
                  ? "bg-white text-ink"
                  : "bg-ink text-white"
                : tone === "light"
                  ? "text-white/70 hover:text-white"
                  : "text-ink/55 hover:text-ink"
            )}
          >
            <opt.icon className="h-3.5 w-3.5" />
          </button>
        );
      })}
    </div>
  );
}
