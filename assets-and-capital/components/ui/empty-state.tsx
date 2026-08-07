import Link from "next/link";
import { ArrowRight, type LucideIcon } from "lucide-react";

/*
 * Presentational: every string arrives as a prop, already translated.
 *
 * The action label is exempt below — adding useTl here would make this a
 * client component for one word, and its only caller today is the dashboard,
 * which is staff-facing and English by design. The moment a localised page
 * uses it, the caller translates, exactly as it does for title and
 * description.
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  /** Already translated by the caller — see the note above. */
  action?: { label: string; href: string };
}) {
  return (
    <div className="grid place-items-center rounded-3xl border border-dashed border-ink/15 bg-white/50 px-6 py-16 text-center">
      <span className="grid h-14 w-14 place-items-center rounded-2xl bg-brand-50 text-brand-600 ring-1 ring-brand-100">
        <Icon className="h-6 w-6" />
      </span>
      <h3 className="mt-5 font-display text-lg font-bold text-navy-700">{title}</h3>
      <p className="mt-1.5 max-w-sm text-sm text-ink/65">{description}</p>
      {action && (
        <Link
          href={action.href}
          className="mt-6 inline-flex items-center gap-2 rounded-[var(--radius-button)] bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
        >
          {/* i18n-exempt: translated by the caller, like title and description. */}
          {action.label} <ArrowRight className="h-4 w-4" />
        </Link>
      )}
    </div>
  );
}
