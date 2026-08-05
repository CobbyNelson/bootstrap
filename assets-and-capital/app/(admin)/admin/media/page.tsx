import type { Metadata } from "next";
import { MediaLibrary } from "@/components/admin/media-library";

export const metadata: Metadata = { title: "Media library" };

export default function MediaPage() {
  return (
    <div className="flex h-[calc(100vh-9rem)] flex-col">
      <div className="mb-5">
        <h1 className="font-display text-2xl font-semibold text-navy-700">Media library</h1>
        <p className="mt-1 text-sm text-ink/60">
          Every image used across the site. Uploads are converted to WebP and kept under 100KB —
          the original is not retained, so upload the best version you have.
        </p>
      </div>
      <div className="min-h-0 flex-1">
        <MediaLibrary mode="manage" />
      </div>
    </div>
  );
}
