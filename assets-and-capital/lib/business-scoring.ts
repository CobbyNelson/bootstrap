import type { Opportunity } from "./content";
import { derive } from "./matching";

/* ============================================================
   AI Business Scoring — every listed business receives five
   quality scores with explanations and improvement tips.
   Deterministic, explainable; a real deployment would feed
   verified financials and documents into the same shape.
   ============================================================ */

export type Metric = {
  key: string;
  label: string;
  value: number; // 0-100
  summary: string;
  recommendations: string[];
  higherIsBetter: boolean;
};

const SECTOR_ATTRACTIVENESS: Record<string, number> = {
  FinTech: 92, "Renewable Energy": 90, "Digital Health": 88, Healthcare: 85, Infrastructure: 82,
  Agriculture: 78, "Transport & Logistics": 76, "Food & Beverage": 74, "Real Estate": 72,
  "Natural Resources": 70, Education: 74, Hospitality: 66,
};
const TIER_DOC_COMPLETENESS: Record<string, number> = { Standard: 62, Silver: 78, Gold: 90, Platinum: 97 };

function clamp(n: number) {
  return Math.max(0, Math.min(100, Math.round(n)));
}
function returnStrength(o: Opportunity): number {
  const v = parseFloat(o.targetReturn.replace(/[^0-9.]/g, "")) || 0;
  if (/moic|×|x/i.test(o.targetReturn)) return clamp((v / 4) * 100);
  return clamp((v / 25) * 100); // IRR
}

export function scoreBusiness(o: Opportunity): Metric[] {
  const d = derive(o);
  const docs = TIER_DOC_COMPLETENESS[o.tier] ?? 70;
  const sector = SECTOR_ATTRACTIVENESS[o.sector] ?? 70;
  const ret = returnStrength(o);
  const stageEarly = ["Green field", "Series A"].includes(o.stage);

  const health = clamp(0.4 * (d.ebitdaMargin + 30) * 1.4 + 0.3 * Math.min(100, d.revenueM * 6) + 0.3 * Math.min(100, d.employees / 6));
  const readiness = clamp(0.55 * docs + 0.25 * (d.revenueM >= 3 ? 90 : 60) + 0.2 * (o.tier === "Standard" ? 60 : 90));
  const appeal = clamp(0.45 * sector + 0.35 * ret + 0.2 * (o.tier === "Platinum" ? 100 : o.tier === "Gold" ? 88 : 72));
  const riskScore = clamp(d.riskLevel === "High" ? 74 : d.riskLevel === "Medium" ? 48 : 26); // higher = riskier
  const growth = clamp((stageEarly ? 88 : 62) * 0.6 + ret * 0.4);

  return [
    {
      key: "health", label: "Business Health", value: health, higherIsBetter: true,
      summary: `EBITDA margin ~${d.ebitdaMargin}% on ~$${d.revenueM}M revenue with ${d.employees} staff.`,
      recommendations: health < 70 ? ["Improve unit economics and margin visibility", "Add 3 years of audited financials"] : ["Maintain margin discipline as you scale"],
    },
    {
      key: "readiness", label: "Investment Readiness", value: readiness, higherIsBetter: true,
      summary: `${docs}% of the standard diligence document set is complete.`,
      recommendations: readiness < 80 ? ["Complete the data room (financials, cap table, forecasts)", "Add a professional financial model"] : ["Data room is investor-ready"],
    },
    {
      key: "appeal", label: "Investor Appeal", value: appeal, higherIsBetter: true,
      summary: `${o.sector} is a high-demand sector with a ${o.targetReturn} target return.`,
      recommendations: appeal < 75 ? ["Sharpen the growth narrative and comparables", "Highlight differentiated market position"] : ["Strong pull — prioritise premium placement"],
    },
    {
      key: "risk", label: "Risk Rating", value: riskScore, higherIsBetter: false,
      summary: `${d.riskLevel} risk profile for a ${o.stage.toLowerCase()} business.`,
      recommendations: riskScore > 55 ? ["De-risk with contracted revenue / offtake evidence", "Add scenario and sensitivity analysis"] : ["Risk is well contained for the stage"],
    },
    {
      key: "growth", label: "Growth Potential", value: growth, higherIsBetter: true,
      summary: `${stageEarly ? "Early-stage" : "Established"} business with ${o.targetReturn} upside.`,
      recommendations: growth < 75 ? ["Quantify the expansion roadmap and TAM", "Show a repeatable go-to-market motion"] : ["Compelling growth trajectory"],
    },
  ];
}

export function overallReadiness(metrics: Metric[]): number {
  const pos = metrics.filter((m) => m.higherIsBetter);
  return Math.round(pos.reduce((s, m) => s + m.value, 0) / pos.length);
}
