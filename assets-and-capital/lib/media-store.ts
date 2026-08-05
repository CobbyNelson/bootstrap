import { mkdir, writeFile, readFile, unlink } from "node:fs/promises";
import { join, resolve, basename } from "node:path";
import { randomBytes } from "node:crypto";

/**
 * Where uploaded bytes live.
 *
 * Deliberately NOT `public/`. Next copies `public` into the build output, so
 * anything written there at runtime is wiped by the next deploy — uploads would
 * silently vanish. This directory sits outside the build and is served by
 * app/api/media/[key]/route.ts instead.
 *
 * On the VPS it wants to be a persistent path (or a mounted volume) set through
 * MEDIA_DIR; the default keeps local development self-contained.
 */
// turbopackIgnore: the path is decided at RUNTIME by MEDIA_DIR — without the
// hint, Next's file tracer sees a dynamic resolve and drags the entire project
// (docs, e2e, uploads…) into the standalone build, quadrupling the artifact.
const ROOT = resolve(/*turbopackIgnore: true*/ process.env.MEDIA_DIR ?? "./storage/media");

async function ensureRoot() {
  await mkdir(ROOT, { recursive: true });
}

/** `2026/08/9f3a…-name.webp` — dated folders keep any one directory small. */
export function makeStorageKey(originalName: string, suffix = ""): string {
  const now = new Date();
  const stem = basename(originalName)
    .replace(/\.[^.]+$/, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48) || "image";
  const rand = randomBytes(6).toString("hex");
  return `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, "0")}/${rand}-${stem}${suffix}.webp`;
}

/**
 * Resolve a key to a path inside ROOT, refusing anything that escapes it.
 *
 * The key reaches this from a URL, so `../../etc/passwd` is a request that will
 * be made. Resolving and then checking the prefix is the check that actually
 * holds — string-matching for ".." misses encodings.
 */
function safePath(key: string): string | null {
  const full = resolve(ROOT, key);
  if (full !== ROOT && !full.startsWith(ROOT + "/")) return null;
  return full;
}

export async function put(key: string, data: Buffer): Promise<void> {
  await ensureRoot();
  const full = safePath(key);
  if (!full) throw new Error("refusing to write outside the media root");
  await mkdir(join(full, ".."), { recursive: true });
  await writeFile(full, data);
}

export async function get(key: string): Promise<Buffer | null> {
  const full = safePath(key);
  if (!full) return null;
  try {
    return await readFile(full);
  } catch {
    return null;
  }
}

export async function remove(key: string): Promise<void> {
  const full = safePath(key);
  if (!full) return;
  await unlink(full).catch(() => {
    /* already gone is the desired end state */
  });
}

/** Public URL for a stored key. */
export function mediaUrl(key: string): string {
  return `/api/media/${key}`;
}
