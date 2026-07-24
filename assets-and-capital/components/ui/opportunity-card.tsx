import Link from "next/link";
import { ArrowUpRight, MapPin } from "lucide-react";
import type { Opportunity } from "@/lib/content";
import { slugify } from "@/lib/matching";
import { Badge } from "./badge";
import { Money } from "./money";
import { cn } from "@/lib/utils";

const TIER_STYLE: Record<Opportunity["tier"], string> = {
  Standard: "neutral",
  Silver: "outline",
  Gold: "gold",
  Platinum: "brand",
};

function initials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("");
}

export function OpportunityCard({ o, href }: { o: Opportunity; href?: string }) {
  const matchColor = o.match >= 88 ? "text-emerald-600" : o.match >= 80 ? "text-brand-600" : "text-gold-600";
  const to = href ?? `/marketplace/${slugify(o.name)}`;
  return (
    <Link
      href={to}
      className="group flex h-full flex-col rounded-3xl border border-ink/[0.07] bg-white p-6 transition-all duration-300 hover:-translate-y-1 hover:border-ink/10 hover:shadow-[var(--shadow-card)]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-brand-600 to-brand-800 text-sm font-bold text-white">
            {initials(o.name)}
          </div>
          <div className="min-w-0">
            <p className="truncate font-semibold text-ink">{o.name}</p>
            <p className="flex items-center gap-1 text-xs text-ink/50">
              <MapPin className="h-3 w-3" /> {o.country} · {o.region}
            </p>
          </div>
        </div>
        <Badge variant={TIER_STYLE[o.tier] as "brand" | "gold" | "neutral" | "outline"} size="sm">
          {o.tier}
        </Badge>
      </div>

      <p className="mt-4 line-clamp-2 text-sm leading-relaxed text-ink/55">{o.blurb}</p>

      <div className="mt-5 flex flex-wrap gap-1.5">
        <Badge variant="neutral" size="sm">{o.sector}</Badge>
        <Badge variant="neutral" size="sm">{o.stage}</Badge>
        <Badge variant="neutral" size="sm">{o.instrument}</Badge>
      </div>

      <div className="mt-auto grid grid-cols-3 gap-2 pt-6">
        <div>
          <p className="text-[0.62rem] uppercase tracking-wide text-ink/40">Ask</p>
          <p className="font-semibold text-ink tnum"><Money usd={o.ask} /></p>
        </div>
        <div>
          <p className="text-[0.62rem] uppercase tracking-wide text-ink/40">Target</p>
          <p className="font-semibold text-ink tnum">{o.targetReturn}</p>
        </div>
        <div>
          <p className="text-[0.62rem] uppercase tracking-wide text-ink/40">Match</p>
          <p className={cn("font-semibold tnum", matchColor)}>{o.match}%</p>
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between border-t border-ink/[0.06] pt-4">
        <span className="text-xs font-medium text-ink/50">View opportunity</span>
        <ArrowUpRight className="h-4 w-4 text-ink/40 transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-brand-600" />
      </div>
    </Link>
  );
}
