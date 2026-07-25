import Link from "next/link";
import { ArrowRight, type LucideIcon } from "lucide-react";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
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
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
        >
          {action.label} <ArrowRight className="h-4 w-4" />
        </Link>
      )}
    </div>
  );
}
