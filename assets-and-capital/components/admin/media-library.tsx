"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { UploadCloud, Search, Trash2, Check, X, Loader2, ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * The media library.
 *
 * One component serves two jobs: the full-page library under /admin/media, and
 * the modal picker the article editor and listing forms open. `mode` is the
 * only difference — picking is a no-op in "manage" mode, and deletion is hidden
 * while picking so a stray click cannot destroy an asset mid-compose.
 *
 * Uploads are queued and reported individually. A batch that fails as a unit
 * tells the user nothing about which file was the problem, and re-dropping ten
 * images to find the bad one is the kind of thing people stop using a tool over.
 */

export interface MediaAssetDTO {
  id: string;
  url: string;
  thumbUrl: string;
  originalName: string;
  alt: string;
  width: number;
  height: number;
  bytes: number;
  folder: string | null;
}

type Upload = {
  name: string;
  status: "working" | "done" | "error";
  message?: string;
  savedPercent?: number;
};

export function MediaLibrary({
  mode = "manage",
  folder,
  onPick,
  onClose,
}: {
  mode?: "manage" | "pick";
  folder?: string;
  onPick?: (asset: MediaAssetDTO) => void;
  onClose?: () => void;
}) {
  const [assets, setAssets] = useState<MediaAssetDTO[]>([]);
  const [folders, setFolders] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [activeFolder, setActiveFolder] = useState(folder ?? "");
  const [loading, setLoading] = useState(true);
  const [uploads, setUploads] = useState<Upload[]>([]);
  const [dragging, setDragging] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (activeFolder) params.set("folder", activeFolder);
    const res = await fetch(`/api/admin/media?${params}`);
    if (res.ok) {
      const body = await res.json();
      setAssets(body.assets);
      setFolders(body.folders);
    }
    setLoading(false);
  }, [query, activeFolder]);

  useEffect(() => {
    // Debounced so typing in the search box does not fire a request per key.
    const id = setTimeout(load, 220);
    return () => clearTimeout(id);
  }, [load]);

  async function uploadFiles(files: File[]) {
    if (!files.length) return;
    setUploads(files.map((f) => ({ name: f.name, status: "working" as const })));

    for (const [i, file] of files.entries()) {
      const fd = new FormData();
      fd.append("file", file);
      if (activeFolder || folder) fd.append("folder", activeFolder || folder || "");

      try {
        const res = await fetch("/api/admin/media", { method: "POST", body: fd });
        const body = await res.json();
        setUploads((u) =>
          u.map((item, idx) =>
            idx === i
              ? res.ok
                ? { ...item, status: "done", savedPercent: body.savedPercent }
                : { ...item, status: "error", message: body.error }
              : item
          )
        );
      } catch {
        setUploads((u) =>
          u.map((item, idx) =>
            idx === i ? { ...item, status: "error", message: "Upload failed." } : item
          )
        );
      }
    }

    await load();
    // Leave failures on screen; clear the successes after a beat.
    setTimeout(() => setUploads((u) => u.filter((x) => x.status === "error")), 2500);
  }

  async function destroy(id: string) {
    const res = await fetch(`/api/admin/media?id=${id}`, { method: "DELETE" });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      setUploads([{ name: "Delete", status: "error", message: body.error ?? "Could not delete." }]);
    }
    setConfirmDelete(null);
    await load();
  }

  return (
    <div className="flex h-full flex-col">
      {/* toolbar */}
      <div className="flex flex-wrap items-center gap-3 border-b border-ink/[0.08] pb-4">
        <div className="relative min-w-[12rem] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/35" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by file name or description"
            className="w-full rounded-full border border-ink/12 bg-white py-2 pl-9 pr-4 text-sm outline-none focus:border-brand-400"
          />
        </div>

        {folders.length > 0 && (
          <select
            value={activeFolder}
            onChange={(e) => setActiveFolder(e.target.value)}
            className="rounded-full border border-ink/12 bg-white px-4 py-2 text-sm outline-none focus:border-brand-400"
          >
            <option value="">All folders</option>
            {folders.map((f) => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>
        )}

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="inline-flex items-center gap-2 rounded-full bg-ink px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-navy-700"
        >
          <UploadCloud className="h-4 w-4" /> Upload
        </button>

        {mode === "pick" && (
          <button
            type="button"
            onClick={onClose}
            className="grid h-9 w-9 place-items-center rounded-full border border-ink/12 text-ink/60 hover:text-ink"
            aria-label="Close media library"
          >
            <X className="h-4 w-4" />
          </button>
        )}

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={(e) => {
            uploadFiles([...(e.target.files ?? [])]);
            e.target.value = "";
          }}
        />
      </div>

      {/* upload progress */}
      {uploads.length > 0 && (
        <ul className="mt-3 space-y-1.5">
          {uploads.map((u, i) => (
            <li
              key={`${u.name}-${i}`}
              className={cn(
                "flex items-center gap-2 rounded-lg px-3 py-2 text-xs",
                u.status === "error" ? "bg-red-50 text-red-700" : "bg-paper-2 text-ink/70"
              )}
            >
              {u.status === "working" && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {u.status === "done" && <Check className="h-3.5 w-3.5 text-emerald-600" />}
              {u.status === "error" && <X className="h-3.5 w-3.5" />}
              <span className="truncate font-medium">{u.name}</span>
              {u.status === "done" && u.savedPercent !== undefined && (
                <span className="text-ink/50">→ WebP, {u.savedPercent}% smaller</span>
              )}
              {u.message && <span>{u.message}</span>}
            </li>
          ))}
        </ul>
      )}

      {/* drop zone + grid */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          uploadFiles([...e.dataTransfer.files].filter((f) => f.type.startsWith("image/")));
        }}
        className={cn(
          "relative mt-4 flex-1 overflow-y-auto rounded-2xl border-2 border-dashed p-4 transition-colors",
          dragging ? "border-brand-500 bg-brand-50/50" : "border-transparent"
        )}
      >
        {dragging && (
          <div className="pointer-events-none absolute inset-0 z-10 grid place-items-center rounded-2xl bg-white/80">
            <p className="text-sm font-semibold text-brand-700">Drop to upload</p>
          </div>
        )}

        {loading ? (
          <p className="py-16 text-center text-sm text-ink/50">Loading…</p>
        ) : assets.length === 0 ? (
          <div className="py-16 text-center">
            <ImageIcon className="mx-auto h-8 w-8 text-ink/20" />
            <p className="mt-3 text-sm text-ink/60">
              {query || activeFolder ? "Nothing matches that." : "No images yet."}
            </p>
            <p className="mt-1 text-xs text-ink/40">
              Drop files anywhere here, or use Upload. Everything is converted to WebP under 100KB.
            </p>
          </div>
        ) : (
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {assets.map((a) => (
              <li key={a.id} className="group relative">
                <button
                  type="button"
                  onClick={() => mode === "pick" && onPick?.(a)}
                  className={cn(
                    "block w-full overflow-hidden rounded-xl border border-ink/[0.08] bg-paper-2 text-left transition",
                    mode === "pick" && "hover:border-brand-400 hover:shadow-md"
                  )}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={a.thumbUrl}
                    alt={a.alt || a.originalName}
                    loading="lazy"
                    className="aspect-square w-full object-cover"
                  />
                  <div className="p-2">
                    <p className="truncate text-[0.7rem] font-medium text-ink/80">{a.originalName}</p>
                    <p className="mt-0.5 text-[0.65rem] text-ink/45 tnum">
                      {a.width}×{a.height} · {(a.bytes / 1024).toFixed(0)}KB
                    </p>
                  </div>
                </button>

                {mode === "manage" && (
                  confirmDelete === a.id ? (
                    <div className="absolute inset-x-2 bottom-2 flex gap-1.5">
                      <button
                        onClick={() => destroy(a.id)}
                        className="flex-1 rounded-lg bg-red-600 py-1.5 text-[0.7rem] font-semibold text-white"
                      >
                        Delete
                      </button>
                      <button
                        onClick={() => setConfirmDelete(null)}
                        className="flex-1 rounded-lg bg-white py-1.5 text-[0.7rem] font-semibold text-ink ring-1 ring-ink/10"
                      >
                        Keep
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmDelete(a.id)}
                      aria-label={`Delete ${a.originalName}`}
                      className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full bg-white/90 text-ink/60 opacity-0 shadow-sm transition group-hover:opacity-100 hover:text-red-600"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

/** The library as a modal, for the editor and listing forms. */
export function MediaPickerModal({
  open,
  folder,
  onPick,
  onClose,
}: {
  open: boolean;
  folder?: string;
  onPick: (asset: MediaAssetDTO) => void;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-ink/50 p-4 backdrop-blur-sm">
      <div className="flex h-[80vh] w-full max-w-5xl flex-col rounded-2xl bg-white p-5 shadow-2xl">
        <h2 className="mb-3 text-lg font-semibold text-navy-700">Media library</h2>
        <div className="min-h-0 flex-1">
          <MediaLibrary
            mode="pick"
            folder={folder}
            onPick={(a) => {
              onPick(a);
              onClose();
            }}
            onClose={onClose}
          />
        </div>
      </div>
    </div>
  );
}
