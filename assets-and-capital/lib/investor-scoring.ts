/* ============================================================
   AI Investor Scoring — grades investors on profile quality,
   activity and verification, and awards a trust badge.
   ============================================================ */

export type InvestorProfile = {
  name: string;
  profileCompletion: number; // %
  mandateClarity: number; // %
  dealsCompleted: number;
  responseRatePct: number;
  verificationLevel: "None" | "Basic" | "Full";
  activeMonths: number;
  documentsVerified: boolean;
};

export type Badge = "Trusted Investor" | "Verified Investor" | "Premium Investor" | "Top Investor";

export type InvestorScore = {
  score: number; // 0-100
  badge: Badge;
  factors: { label: string; value: string; weightPct: number; f: number }[];
};

export const DEMO_INVESTOR: InvestorProfile = {
  name: "Aurora Family Office",
  profileCompletion: 82,
  mandateClarity: 88,
  dealsCompleted: 14,
  responseRatePct: 91,
  verificationLevel: "Full",
  activeMonths: 26,
  documentsVerified: true,
};

const VERIF = { None: 0.2, Basic: 0.6, Full: 1 } as const;

export function scoreInvestor(p: InvestorProfile): InvestorScore {
  const factors = [
    { key: "profile", label: "Profile completeness", weightPct: 15, f: p.profileCompletion / 100, value: `${p.profileCompletion}%` },
    { key: "mandate", label: "Mandate clarity", weightPct: 15, f: p.mandateClarity / 100, value: `${p.mandateClarity}%` },
    { key: "deals", label: "Deals completed", weightPct: 22, f: Math.min(1, p.dealsCompleted / 15), value: `${p.dealsCompleted}` },
    { key: "response", label: "Response rate", weightPct: 15, f: p.responseRatePct / 100, value: `${p.responseRatePct}%` },
    { key: "verification", label: "Verification level", weightPct: 20, f: VERIF[p.verificationLevel], value: p.verificationLevel },
    { key: "tenure", label: "Platform tenure", weightPct: 8, f: Math.min(1, p.activeMonths / 24), value: `${p.activeMonths} mo` },
    { key: "docs", label: "Documents verified", weightPct: 5, f: p.documentsVerified ? 1 : 0, value: p.documentsVerified ? "Yes" : "No" },
  ];
  const totalW = factors.reduce((s, f) => s + f.weightPct, 0);
  const score = Math.round(factors.reduce((s, f) => s + f.weightPct * f.f, 0) / totalW * 100);

  let badge: Badge = "Trusted Investor";
  if (score >= 90 && p.verificationLevel === "Full") badge = "Top Investor";
  else if (score >= 78) badge = "Premium Investor";
  else if (p.verificationLevel !== "None") badge = "Verified Investor";

  return { score, badge, factors: factors.map(({ label, value, weightPct, f }) => ({ label, value, weightPct, f })) };
}
