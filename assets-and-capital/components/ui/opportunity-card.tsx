import Link from "next/link";
import { MapPin, Tag, Lock } from "lucide-react";
import type { Opportunity } from "@/lib/content";
import { slugify } from "@/lib/matching";
import { listingImage } from "@/lib/imagery";
import { Money } from "./money";
import { SaveButton } from "./save-button";

const GRADIENTS = [
  "from-navy-700 to-navy-900",
  "from-brand-600 to-brand-800",
  "from-ink to-navy-900",
  "from-navy-600 to-brand-800",
];

function initials(name: string) {
  return name.split(" ").slice(0, 2).map((w) => w[0]).join("");
}

function pickGradient(name: string) {
  const sum = name.split("").reduce((s, c) => s + c.charCodeAt(0), 0);
  return GRADIENTS[sum % GRADIENTS.length];
}

export function OpportunityCard({
  o,
  href,
  unlocked = false,
  hero = null,
}: {
  o: Opportunity;
  href?: string;
  /** Viewer has deal access to this listing (subscribed + expressed interest). */
  unlocked?: boolean;
  /** Business-uploaded hero from the database — wins over sector imagery. */
  hero?: { src: string; alt: string } | null;
}) {
  const slug = slugify(o.name);
  const to = href ?? `/marketplace/${slug}`;
  // A hero the business uploaded for itself (from the database) beats the
  // static sector stand-in — that is the whole point of letting them upload.
  const cover = hero ?? listingImage(o);
  return (
    <Link
      href={to}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-ink/[0.07] bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-brand-200 hover:shadow-[var(--shadow-card)]"
    >
      {/* image header */}
      <div className={`relative aspect-[16/9] overflow-hidden bg-gradient-to-br ${pickGradient(o.name)}`}>
        {cover ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={cover.src}
              alt={cover.alt}
              loading="lazy"
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
            />
            {/* Darkened so the tier, save and match chips stay legible over any
                part of the photograph. */}
            <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-ink/25 to-ink/40" aria-hidden />
          </>
        ) : (
          <div className="absolute inset-0 grid place-items-center">
            <span className="font-display text-4xl font-extrabold tracking-tight text-white/90">{initials(o.name)}</span>
          </div>
        )}
        <div className="grid-noise absolute inset-0 opacity-20" aria-hidden />
        <span className="absolute left-3 top-3 rounded-full bg-white/95 px-2.5 py-1 text-[0.62rem] kicker text-ink shadow-sm">
          {o.tier}
        </span>
        <SaveButton slug={slug} className="absolute right-3 top-3" />
        {unlocked ? (
          <span className="absolute bottom-3 left-3 rounded-full bg-brand-600 px-2.5 py-1 text-[0.65rem] font-semibold text-white tnum">
            {o.match}% match
          </span>
        ) : (
          <span
            className="absolute bottom-3 left-3 inline-flex items-center gap-1 rounded-full bg-ink/70 px-2.5 py-1 text-[0.62rem] font-semibold text-white backdrop-blur-sm"
            title="Express interest to reveal your match rate"
          >
            <Lock className="h-3 w-3" /> Match locked
          </span>
        )}
      </div>

      {/* body */}
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="font-display text-lg font-bold leading-tight text-brand-600">{o.name}</h3>
            <p className="mt-1 flex items-center gap-1 text-xs text-ink/60">
              <MapPin className="h-3 w-3" /> {o.country} · {o.region}
            </p>
          </div>
          <span className="flex-none rounded-lg bg-paper-2 px-3.5 py-1.5 text-xs font-semibold text-ink transition-colors group-hover:bg-brand-600 group-hover:text-white">
            Invest
          </span>
        </div>

        <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-ink/65">{o.blurb}</p>

        <div className="mt-auto flex items-center justify-between gap-3 pt-5">
          <span className="inline-flex items-center gap-1.5 rounded-lg border border-brand-200 px-2.5 py-1.5 text-xs font-semibold text-brand-700">
            <Tag className="h-3.5 w-3.5" /> {o.sector}
          </span>
          <span className="text-sm text-ink/65">
            Seeking: <span className="font-bold text-ink"><Money usd={o.ask} /></span>
          </span>
        </div>
      </div>

      {/* red accent bar */}
      <div className="h-1 bg-brand-500/25 transition-colors group-hover:bg-brand-600" aria-hidden />
    </Link>
  );
}
