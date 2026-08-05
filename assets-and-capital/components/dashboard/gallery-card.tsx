"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { UploadCloud, Loader2, X, Check, Star, Plus } from "lucide-react";
import type { GalleryImage } from "@/lib/business-listing";
import { cn } from "@/lib/utils";

/**
 * The business's image gallery, managed from the dashboard.
 *
 * Dropping an image ADDS it to the gallery (the first upload into an empty
 * gallery becomes featured automatically, server-side). Which image is
 * featured is chosen on the thumb strip — the star sets it, the × removes an
 * image, and removing the featured one promotes the newest remaining upload
 * rather than leaving the public card suddenly bare.
 *
 * Every mutation takes its new truth from the API response (which returns the
 * full ordered gallery) and then router.refresh()es so the server-rendered
 * marketplace surfaces catch up on their next render.
 */
export function GalleryCard({
  initialImages,
  fallback,
}: {
  initialImages: GalleryImage[];
  fallback: { src: string; alt: string } | null;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [images, setImages] = useState<GalleryImage[]>(initialImages);
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState<string | null>(null); // "add" | asset id
  const [error, setError] = useState<string | null>(null);
  const [savedNote, setSavedNote] = useState<string | null>(null);

  const featured = images.find((i) => i.featured) ?? images[0] ?? null;
  const shown = featured ?? fallback;

  function applyResponse(body: { images?: GalleryImage[] }) {
    if (body.images) setImages(body.images);
    router.refresh();
  }

  async function add(file: File) {
    if (!file.type.startsWith("image/")) {
      setError("Drop an image file.");
      return;
    }
    setBusy("add");
    setError(null);
    setSavedNote(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/business/gallery", { method: "POST", body: fd });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? "Upload failed.");
      applyResponse(body);
      setSavedNote(`Added — WebP, ${body.savedPercent}% smaller`);
      setTimeout(() => setSavedNote(null), 3200);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setBusy(null);
    }
  }

  async function feature(id: string) {
    setBusy(id);
    setError(null);
    try {
      const res = await fetch("/api/business/gallery", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ assetId: id }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? "Could not set that as featured.");
      applyResponse(body);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not set that as featured.");
    } finally {
      setBusy(null);
    }
  }

  async function removeImage(id: string) {
    setBusy(id);
    setError(null);
    try {
      const res = await fetch(`/api/business/gallery?id=${id}`, { method: "DELETE" });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? "Could not remove that.");
      applyResponse(body);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not remove that.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="rounded-3xl border border-ink/[0.07] bg-white p-5 shadow-[var(--shadow-soft)]">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-ink">Gallery</h2>
        {images.length === 0 && (
          <span className="rounded-full bg-paper-2 px-2 py-0.5 text-[0.62rem] font-semibold uppercase tracking-wide text-ink/50">
            Sector default
          </span>
        )}
      </div>

      {/* main image = the featured slide; the whole surface is the drop target */}
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          const file = e.dataTransfer.files?.[0];
          if (file) add(file);
        }}
        aria-label="Add an image to the gallery — drop a file or click to browse"
        className={cn(
          "group relative block w-full overflow-hidden rounded-2xl border-2 border-dashed transition-colors",
          dragging ? "border-brand-500" : "border-transparent"
        )}
      >
        {shown ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={shown.src} alt={shown.alt} className="aspect-[16/9] w-full object-cover" />
        ) : (
          <div className="grid aspect-[16/9] w-full place-items-center bg-paper-2 text-ink/40">
            <UploadCloud className="h-6 w-6" />
          </div>
        )}

        <span
          className={cn(
            "absolute inset-0 grid place-items-center bg-ink/55 text-sm font-semibold text-white transition-opacity",
            dragging || busy === "add" ? "opacity-100" : "opacity-0 group-hover:opacity-100"
          )}
        >
          {busy === "add" ? (
            <span className="inline-flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" /> Converting to WebP…
            </span>
          ) : dragging ? (
            "Drop to add"
          ) : (
            <span className="inline-flex items-center gap-2">
              <UploadCloud className="h-4 w-4" /> Drop an image, or click to add
            </span>
          )}
        </span>
      </button>

      {/* thumb strip: star = set featured, × = remove, plus tile = add */}
      {images.length > 0 && (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {images.map((img) => (
            <div
              key={img.id}
              className={cn(
                "group/thumb relative h-14 w-20 shrink-0 overflow-hidden rounded-lg border-2",
                img.featured ? "border-brand-600" : "border-ink/10"
              )}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.thumb} alt="" className="h-full w-full object-cover" />

              {busy === img.id ? (
                <span className="absolute inset-0 grid place-items-center bg-ink/50 text-white">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                </span>
              ) : (
                <span className="absolute inset-0 hidden items-center justify-center gap-1.5 bg-ink/55 group-hover/thumb:flex">
                  {!img.featured && (
                    <button
                      type="button"
                      title="Set as featured"
                      aria-label="Set as featured"
                      onClick={() => feature(img.id)}
                      className="grid h-6 w-6 place-items-center rounded-[var(--radius-button)] bg-white text-ink hover:bg-brand-50"
                    >
                      <Star className="h-3 w-3" />
                    </button>
                  )}
                  <button
                    type="button"
                    title="Remove from gallery"
                    aria-label="Remove from gallery"
                    onClick={() => removeImage(img.id)}
                    className="grid h-6 w-6 place-items-center rounded-[var(--radius-button)] bg-white text-ink hover:text-brand-700"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}

              {img.featured && (
                <span className="absolute bottom-0 inset-x-0 bg-brand-600 py-0.5 text-center text-[0.55rem] font-bold uppercase tracking-wide text-white">
                  Featured
                </span>
              )}
            </div>
          ))}

          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            aria-label="Add another image"
            className="grid h-14 w-20 shrink-0 place-items-center rounded-lg border-2 border-dashed border-ink/15 text-ink/40 transition-colors hover:border-brand-300 hover:text-ink/70"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) add(file);
          e.target.value = "";
        }}
      />

      {error && <p className="mt-2 text-xs text-brand-700">{error}</p>}
      {savedNote && (
        <p className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-emerald-700">
          <Check className="h-3 w-3" /> {savedNote}
        </p>
      )}
      <p className="mt-2 text-[0.7rem] leading-relaxed text-ink/45">
        The featured image leads your marketplace card; the rest show in a slider on your
        profile. Everything is converted to WebP under 100KB.
      </p>
    </div>
  );
}
