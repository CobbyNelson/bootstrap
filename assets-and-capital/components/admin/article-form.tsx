"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, Trash2, ExternalLink, ImagePlus, X } from "lucide-react";
import { RichEditor } from "./rich-editor";
import { MediaPickerModal, type MediaAssetDTO } from "./media-library";

const TYPES = [
  "Market Intelligence", "Country Report", "Investment Guide",
  "White Paper", "Case Study", "Interview", "ESG",
] as const;

export interface ArticleDraft {
  id?: string;
  slug?: string;
  title: string;
  category: string;
  type: string;
  excerpt: string;
  bodyHtml: string;
  author: string;
  authorRole: string;
  featured: boolean;
  status: "DRAFT" | "PUBLISHED";
  coverId: string | null;
  coverUrl: string | null;
}

/**
 * The article editor.
 *
 * Save and publish are separate actions on purpose. "Save" keeps whatever
 * status the article already has, so editing a live post never risks
 * unpublishing it by accident, and drafting never publishes early.
 */
export function ArticleForm({ initial }: { initial: ArticleDraft }) {
  const router = useRouter();
  const [draft, setDraft] = useState<ArticleDraft>(initial);
  const [busy, setBusy] = useState<null | "save" | "publish" | "delete">(null);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);

  const set = <K extends keyof ArticleDraft>(k: K, v: ArticleDraft[K]) => {
    setDraft((d) => ({ ...d, [k]: v }));
    setSaved(false);
  };

  async function persist(status?: "DRAFT" | "PUBLISHED") {
    setBusy(status === "PUBLISHED" ? "publish" : "save");
    setError(null);

    const payload = { ...draft, status: status ?? draft.status };
    const isNew = !draft.id;

    try {
      const res = await fetch("/api/admin/articles", {
        method: isNew ? "POST" : "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? "Could not save.");

      setSaved(true);
      setDraft((d) => ({ ...d, id: body.article.id, slug: body.article.slug, status: body.article.status }));
      if (isNew) router.replace(`/admin/insights/${body.article.id}`);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save.");
    } finally {
      setBusy(null);
    }
  }

  async function destroy() {
    if (!draft.id) return;
    setBusy("delete");
    await fetch(`/api/admin/articles?id=${draft.id}`, { method: "DELETE" });
    router.push("/admin/insights");
    router.refresh();
  }

  return (
    <div className="pb-16">
      {/* action bar */}
      <div className="sticky top-0 z-20 -mx-4 mb-6 flex flex-wrap items-center gap-3 border-b border-ink/[0.08] bg-paper/95 px-4 py-3 backdrop-blur">
        <Link href="/admin/insights" className="inline-flex items-center gap-1.5 text-sm text-ink/60 hover:text-ink">
          <ArrowLeft className="h-4 w-4" /> Insights
        </Link>

        <span className="ml-auto flex items-center gap-2 text-xs">
          <span
            className={
              draft.status === "PUBLISHED"
                ? "rounded-[var(--radius-button)] bg-emerald-50 px-2.5 py-1 font-semibold text-emerald-700"
                : "rounded-[var(--radius-button)] bg-amber-50 px-2.5 py-1 font-semibold text-amber-700"
            }
          >
            {draft.status === "PUBLISHED" ? "Published" : "Draft"}
          </span>
          {saved && <span className="text-ink/45">Saved</span>}
        </span>

        {draft.slug && draft.status === "PUBLISHED" && (
          <Link
            href={`/insights/${draft.slug}`}
            target="_blank"
            className="inline-flex items-center gap-1.5 rounded-[var(--radius-button)] border border-ink/12 px-3 py-1.5 text-sm text-ink/70 hover:text-ink"
          >
            View <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        )}

        <button
          onClick={() => persist()}
          disabled={busy !== null}
          className="rounded-[var(--radius-button)] border border-ink/15 px-4 py-2 text-sm font-semibold text-ink hover:bg-white disabled:opacity-50"
        >
          {busy === "save" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
        </button>

        <button
          onClick={() => persist(draft.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED")}
          disabled={busy !== null || !draft.title.trim()}
          className="rounded-[var(--radius-button)] bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
        >
          {busy === "publish"
            ? <Loader2 className="h-4 w-4 animate-spin" />
            : draft.status === "PUBLISHED" ? "Unpublish" : "Publish"}
        </button>
      </div>

      {error && (
        <p className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      )}

      <div className="grid gap-8 lg:grid-cols-[1fr_20rem]">
        {/* main column */}
        <div className="space-y-5">
          <input
            value={draft.title}
            onChange={(e) => set("title", e.target.value)}
            placeholder="Article title"
            className="w-full rounded-xl border border-ink/12 bg-white px-4 py-3 font-display text-2xl font-semibold text-navy-700 outline-none placeholder:text-ink/25 focus:border-brand-400"
          />

          <textarea
            value={draft.excerpt}
            onChange={(e) => set("excerpt", e.target.value)}
            placeholder="Excerpt — the summary shown on cards and in search results."
            rows={2}
            className="w-full resize-y rounded-xl border border-ink/12 bg-white px-4 py-3 text-sm text-ink/80 outline-none placeholder:text-ink/30 focus:border-brand-400"
          />

          <RichEditor value={draft.bodyHtml} onChange={(html) => set("bodyHtml", html)} />
        </div>

        {/* sidebar */}
        <aside className="space-y-5">
          <Panel title="Cover image">
            {draft.coverUrl ? (
              <div className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={draft.coverUrl} alt="" className="aspect-[16/10] w-full rounded-lg object-cover" />
                <button
                  onClick={() => { set("coverId", null); set("coverUrl", null); }}
                  className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-[var(--radius-button)] bg-white/90 text-ink/60 hover:text-red-600"
                  aria-label="Remove cover image"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setPickerOpen(true)}
                className="flex w-full flex-col items-center gap-2 rounded-lg border-2 border-dashed border-ink/15 py-8 text-sm text-ink/50 hover:border-brand-300 hover:text-ink/70"
              >
                <ImagePlus className="h-5 w-5" />
                Choose from library
              </button>
            )}
            <p className="mt-2 text-[0.7rem] leading-relaxed text-ink/45">
              Optional. With no cover set, the card falls back to the image mapped to this
              article&apos;s type.
            </p>
          </Panel>

          <Panel title="Type">
            <select
              value={draft.type}
              onChange={(e) => set("type", e.target.value)}
              className="w-full rounded-lg border border-ink/12 bg-white px-3 py-2 text-sm outline-none focus:border-brand-400"
            >
              {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
            <p className="mt-2 text-[0.7rem] text-ink/45">Drives the fallback cover image.</p>
          </Panel>

          <Panel title="Details">
            <Field label="Category label" value={draft.category} onChange={(v) => set("category", v)} placeholder="Private Equity" />
            <Field label="Author" value={draft.author} onChange={(v) => set("author", v)} />
            <Field label="Author role" value={draft.authorRole} onChange={(v) => set("authorRole", v)} placeholder="Head of Research" />
            {draft.slug && <Field label="URL slug" value={draft.slug} onChange={(v) => set("slug", v)} />}

            <label className="mt-3 flex items-start gap-2.5 text-sm">
              <input
                type="checkbox"
                checked={draft.featured}
                onChange={(e) => set("featured", e.target.checked)}
                className="mt-0.5"
              />
              <span>
                Featured
                <span className="block text-[0.7rem] text-ink/45">
                  Takes the large slot at the top of /insights. Setting this clears it from
                  whichever article holds it now.
                </span>
              </span>
            </label>
          </Panel>

          {draft.id && (
            <button
              onClick={destroy}
              disabled={busy !== null}
              className="inline-flex items-center gap-2 text-sm text-red-600 hover:text-red-700 disabled:opacity-50"
            >
              <Trash2 className="h-4 w-4" /> Delete article
            </button>
          )}
        </aside>
      </div>

      <MediaPickerModal
        open={pickerOpen}
        folder="insights"
        onPick={(a: MediaAssetDTO) => { set("coverId", a.id); set("coverUrl", a.url); }}
        onClose={() => setPickerOpen(false)}
      />
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-ink/[0.08] bg-white p-4">
      <h3 className="mb-3 text-[0.7rem] font-semibold uppercase tracking-wider text-ink/45">{title}</h3>
      {children}
    </div>
  );
}

function Field({
  label, value, onChange, placeholder,
}: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <label className="mb-3 block">
      <span className="mb-1 block text-[0.7rem] font-medium text-ink/55">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-ink/12 bg-white px-3 py-2 text-sm outline-none placeholder:text-ink/30 focus:border-brand-400"
      />
    </label>
  );
}
