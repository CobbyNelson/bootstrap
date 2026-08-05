"use client";

import { Bookmark } from "lucide-react";
import { useSaved } from "@/lib/use-collection";
import { cn } from "@/lib/utils";

/**
 * Bookmark toggle for an opportunity (by slug). "overlay" is for card image
 * corners; "solid" is a labelled button for detail pages.
 */
export function SaveButton({
  slug,
  variant = "overlay",
  className,
}: {
  slug: string;
  variant?: "overlay" | "solid" | "detail";
  className?: string;
}) {
  const { has, toggle } = useSaved();
  const saved = has(slug);

  function onClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    toggle(slug);
  }

  if (variant === "detail") {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-pressed={saved}
        className={cn(
          "inline-flex items-center justify-center gap-1.5 rounded-[var(--radius-button)] border py-2.5 text-sm font-medium transition-colors",
          saved ? "border-brand-200 bg-brand-50 text-brand-700" : "border-ink/12 text-ink/70 hover:border-ink/25",
          className
        )}
      >
        <Bookmark className={cn("h-4 w-4", saved && "fill-current")} />
        {saved ? "Saved" : "Save"}
      </button>
    );
  }

  if (variant === "solid") {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-pressed={saved}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-[var(--radius-button)] border px-5 py-3 text-sm font-semibold transition-colors",
          saved ? "border-brand-200 bg-brand-50 text-brand-700" : "border-ink/12 bg-white text-ink hover:border-ink/25",
          className
        )}
      >
        <Bookmark className={cn("h-4 w-4", saved && "fill-current")} />
        {saved ? "Saved" : "Save"}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={saved ? "Remove from saved" : "Save opportunity"}
      aria-pressed={saved}
      className={cn(
        "grid h-8 w-8 place-items-center rounded-[var(--radius-button)] bg-white/95 text-ink/70 shadow-sm backdrop-blur transition-colors hover:text-brand-600",
        saved && "text-brand-600",
        className
      )}
    >
      <Bookmark className={cn("h-4 w-4", saved && "fill-current")} />
    </button>
  );
}
