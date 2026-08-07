"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export type QueueItem = {
  kind: "kyc" | "listing";
  id: string;
  name: string;
  detail: string;
  createdAt: string;
};

/**
 * The approvals queue, with buttons that decide something.
 *
 * These were rendered with no handler at all: an admin clicked Approve, nothing
 * visible happened, and there was no way to distinguish that from a slow
 * request — so the reasonable conclusion was that the approval went through.
 *
 * `kind` travels with each row because the two are decided against different
 * tables. Approving a listing as if it were a KYC record is the mistake a
 * single opaque id invites, and it is the one operation where being wrong means
 * verifying the wrong person.
 */
export function ApprovalsQueue({ items }: { items: QueueItem[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function decide(item: QueueItem, decision: "approve" | "reject") {
    setBusy(item.kind + item.id);
    setError("");
    try {
      const res = await fetch("/api/admin/approvals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: item.kind, id: item.id, decision }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not record that decision.");
        return;
      }
      router.refresh();
    } catch {
      setError("Could not reach the server.");
    } finally {
      setBusy(null);
    }
  }

  if (items.length === 0) {
    return (
      <div className="rounded-3xl border border-ink/[0.07] bg-white px-6 py-14 text-center">
        <p className="text-sm text-ink/55">
          Nothing awaiting a decision. Investor verifications and listings submitted for review
          appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {error && (
        <p className="rounded-2xl bg-brand-50 px-4 py-3 text-sm font-medium text-brand-700">{error}</p>
      )}
      {items.map((item) => {
        const pending = busy === item.kind + item.id;
        return (
          <div
            key={item.kind + item.id}
            className="flex flex-wrap items-center gap-4 rounded-3xl border border-ink/[0.07] bg-white p-5"
          >
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-medium text-ink">{item.name}</p>
                <Badge variant={item.kind === "kyc" ? "neutral" : "gold"} size="sm">
                  {item.kind === "kyc" ? "Investor verification" : "Listing review"}
                </Badge>
              </div>
              <p className="mt-1 text-sm text-ink/60">{item.detail}</p>
              <p className="mt-0.5 text-xs text-ink/45">
                Waiting since {new Date(item.createdAt).toLocaleDateString("en-GB")}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => decide(item, "approve")}
                disabled={pending}
                className="inline-flex items-center gap-1.5 rounded-[var(--radius-button)] bg-ink px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-ink-2 disabled:opacity-40"
              >
                <Check className="h-4 w-4" />
                {item.kind === "kyc" ? "Verify" : "Publish"}
              </button>
              <button
                type="button"
                onClick={() => decide(item, "reject")}
                disabled={pending}
                className="inline-flex items-center gap-1.5 rounded-[var(--radius-button)] border border-ink/12 px-4 py-2 text-sm font-medium text-ink/70 transition-colors hover:border-ink/25 disabled:opacity-40"
              >
                <X className="h-4 w-4" /> Reject
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
