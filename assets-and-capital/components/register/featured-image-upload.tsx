"use client";

import { useRef, useState } from "react";
import { UploadCloud, Loader2, Check, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * The featured-image step of the business intake.
 *
 * Uploads go through the same /api/business/hero endpoint the dashboard uses,
 * with the company name from the wizard attached — so a first upload during
 * registration creates the listing under the right name, and the image is
 * already live on their profile by the time they first open the dashboard.
 *
 * Requires a signed-in business account, because an anonymous upload would
 * have no listing to belong to. Signed-out (or wrong-role) visitors get told
 * exactly that instead of a dead control — the wizard itself stays usable
 * either way, since the image is optional and can be added later.
 */
export function FeaturedImageUpload({
  value,
  companyName,
  onUploaded,
}: {
  /** Previously uploaded hero URL, persisted with the wizard's autosave. */
  value: string | null;
  companyName: string;
  onUploaded: (src: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function upload(file: File) {
    if (!file.type.startsWith("image/")) {
      setError("Drop an image file.");
      return;
    }
    setBusy(true);
    setError(null);
    setNote(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      if (companyName) fd.append("title", companyName);
      const res = await fetch("/api/business/hero", { method: "POST", body: fd });
      const body = await res.json();
      if (res.status === 401) {
        throw new Error(
          "Sign in with your business account to attach the image now — or submit without it and add it later from your dashboard."
        );
      }
      if (!res.ok) throw new Error(body.error ?? "Upload failed.");
      onUploaded(body.hero.src);
      setNote(`Saved — converted to WebP, ${body.savedPercent}% smaller.`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-7">
      <label className="mb-1.5 block text-sm font-medium text-ink/80">
        Featured image <span className="font-normal text-ink/45">(optional)</span>
      </label>
      <p className="mb-3 text-xs leading-relaxed text-ink/55">
        Shown on your marketplace card. A photo of your operations works best — it is
        converted to WebP under 100KB automatically.
      </p>

      <div
        role="button"
        tabIndex={0}
        aria-label="Upload featured image — drop a file or click to browse"
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          const file = e.dataTransfer.files?.[0];
          if (file) upload(file);
        }}
        className={cn(
          "relative cursor-pointer overflow-hidden rounded-2xl border-2 border-dashed transition-colors",
          dragging ? "border-brand-500 bg-brand-50/40" : "border-ink/15 hover:border-ink/30"
        )}
      >
        {value ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={value} alt="Your featured image" className="aspect-[16/9] w-full object-cover" />
            <span className="absolute bottom-2 right-2 inline-flex items-center gap-1.5 rounded-full bg-ink/70 px-3 py-1.5 text-xs font-medium text-white backdrop-blur">
              <RefreshCw className="h-3 w-3" /> Replace
            </span>
          </>
        ) : (
          <div className="grid place-items-center gap-2 py-10 text-ink/50">
            {busy ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <UploadCloud className="h-6 w-6" />
            )}
            <span className="text-sm">
              {busy ? "Converting to WebP…" : dragging ? "Drop to upload" : "Drop an image, or click to browse"}
            </span>
          </div>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) upload(file);
          e.target.value = "";
        }}
      />

      {error && <p className="mt-2 text-xs leading-relaxed text-brand-700">{error}</p>}
      {note && (
        <p className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-emerald-700">
          <Check className="h-3 w-3" /> {note}
        </p>
      )}
    </div>
  );
}
