"use client";

import { useEffect, useMemo, useState } from "react";
import { RotateCcw, Save, Check } from "lucide-react";
import { DEFAULT_WEIGHTS, WEIGHT_LABELS, scoreOpportunity, DEMO_MANDATE, type Weights } from "@/lib/matching";
import { MARKETPLACE } from "@/lib/marketplace-data";
import { cn } from "@/lib/utils";

const KEYS = Object.keys(DEFAULT_WEIGHTS);

export default function AdminMatchingPage() {
  const [weights, setWeights] = useState<Weights>({ ...DEFAULT_WEIGHTS });
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [loaded, setLoaded] = useState(false);

  /*
   * Start from the model that is actually in force, not from the defaults.
   *
   * The page opened on DEFAULT_WEIGHTS every time, so an operator who had
   * already tuned the platform saw the shipped values and no indication that
   * anything differed — the one screen whose job is to show the current model
   * was the one place it was never shown.
   */
  useEffect(() => {
    let live = true;
    fetch("/api/admin/matching-weights")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (live && d?.weights) setWeights(d.weights);
      })
      .catch(() => {})
      .finally(() => live && setLoaded(true));
    return () => {
      live = false;
    };
  }, []);

  const total = KEYS.reduce((s, k) => s + weights[k], 0);

  const sample = useMemo(() => {
    return MARKETPLACE.map((o) => ({ o, m: scoreOpportunity(DEMO_MANDATE, o, weights) }))
      .sort((a, b) => b.m.score - a.m.score)
      .slice(0, 7);
  }, [weights]);

  function set(k: string, v: number) {
    setWeights((w) => ({ ...w, [k]: v }));
    setSaved(false);
  }
  function reset() {
    setWeights({ ...DEFAULT_WEIGHTS });
    setSaved(false);
  }
  /*
   * Saves to the SERVER.
   *
   * This wrote to localStorage under "ac_matching_weights" — a key written and
   * never read back, not even by this page. So an operator could change how
   * every opportunity on the platform is scored, watch the preview reorder,
   * press Save, see "Saved", and change nothing for a single visitor. These
   * weights decide what investors are shown and in what order; they belong on
   * the server, and the marketplace pages are revalidated so the new model
   * applies on the next view rather than whenever the cache expired.
   */
  async function save() {
    setError("");
    try {
      const res = await fetch("/api/admin/matching-weights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ weights }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not save.");
        return;
      }
      setSaved(true);
    } catch {
      setError("Could not reach the server.");
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-ink/65">Matching engine</p>
          <h1 className="mt-1 font-display text-3xl font-semibold text-navy-700">Compatibility weighting</h1>
          <p className="mt-1.5 max-w-xl text-sm text-ink/65">
            Tune how much each criterion influences the AI match score. Changes re-rank the sample instantly; scores are
            normalised so weights don&apos;t need to sum to 100.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={reset} className="inline-flex items-center gap-2 rounded-[var(--radius-button)] border border-ink/12 px-4 py-2.5 text-sm font-medium text-ink/70 hover:border-ink/25">
            <RotateCcw className="h-4 w-4" /> Reset
          </button>
          <button onClick={save} disabled={!loaded} className="inline-flex items-center gap-2 rounded-[var(--radius-button)] bg-brand-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-700">
            {saved ? <><Check className="h-4 w-4" /> Saved</> : <><Save className="h-4 w-4" /> Save weights</>}
          </button>
          {error && <p className="mt-2 text-sm font-medium text-brand-700">{error}</p>}
          {saved && (
            <p className="mt-2 text-sm text-ink/60">
              Live now — the marketplace and the match API score against these.
            </p>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        {/* sliders */}
        <div className="rounded-3xl border border-ink/[0.07] bg-white p-6">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold text-navy-700">Criteria weights</h2>
            <span className="text-xs text-ink/60">Total <span className="font-semibold text-ink tnum">{total}</span></span>
          </div>
          <div className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
            {KEYS.map((k) => (
              <div key={k}>
                <div className="mb-1.5 flex items-center justify-between text-sm">
                  <span className="text-ink/75">{WEIGHT_LABELS[k]}</span>
                  <span className="font-medium text-brand-600 tnum">{weights[k]}</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={30}
                  value={weights[k]}
                  onChange={(e) => set(k, Number(e.target.value))}
                  className="w-full accent-brand-600"
                  aria-label={WEIGHT_LABELS[k]}
                />
              </div>
            ))}
          </div>
        </div>

        {/* live sample */}
        <div className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-3xl border border-ink/[0.07] bg-white p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-lg font-semibold text-navy-700">Live re-ranking</h2>
              <span className="text-xs text-ink/60">vs. demo mandate</span>
            </div>
            <div className="space-y-2.5">
              {sample.map(({ o, m }, i) => (
                <div key={o.name} className="flex items-center gap-3 rounded-2xl border border-ink/[0.06] p-3">
                  <span className="grid h-7 w-7 flex-none place-items-center rounded-lg bg-paper-2 text-xs font-semibold text-ink/65 tnum">{i + 1}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink">{o.name}</p>
                    <p className="truncate text-[0.7rem] text-ink/60">{o.sector} · {o.country}</p>
                  </div>
                  <div className="text-right">
                    <p className={cn("font-display text-lg font-semibold tnum", m.stars >= 5 ? "text-emerald-700" : m.stars >= 4 ? "text-brand-600" : "text-navy-600")}>{m.score}</p>
                    <p className="text-[0.6rem] text-ink/60">{"★".repeat(m.stars)}</p>
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-4 text-xs text-ink/60">
              In production these weights persist per-tenant and feed the live recommendation engine for every investor.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
