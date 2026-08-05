import sharp from "sharp";

/**
 * Image intake: everything becomes WebP, under a hard byte ceiling, as sharp as
 * that ceiling allows.
 *
 * The order matters and is the whole trick:
 *
 *   1. Downscale first. Pixels are what cost bytes — a 4000px phone photo at
 *      low quality looks far worse than the same image at 1600px and high
 *      quality, for the same file size.
 *   2. Sharpen AFTER downscaling. Any resample softens edges; a light unsharp
 *      mask puts the perceived crispness back. Doing it before the resize would
 *      just be thrown away.
 *   3. Search quality, don't guess it. Encode, measure, adjust. A fixed quality
 *      either blows the budget on a photo or wastes it on a flat graphic.
 *   4. Only if the smallest sane quality still misses the ceiling, step the
 *      width down and start again. Losing resolution is the last resort, not
 *      the first.
 */

/** Hard ceiling per stored image. */
export const MAX_BYTES = 100 * 1024;

/** Width ladder, widest first. 1600 covers every slot in the UI at 2× on a
 *  card and 1× on a full-bleed hero. */
const WIDTH_LADDER = [1600, 1400, 1200, 1000, 800];

/** Quality search bounds. Below ~45 WebP starts showing blocking on photos. */
const Q_MIN = 45;
const Q_MAX = 92;

/** WebP effort, used for BOTH the search and the stored file — see encodeAtWidth. */
const ENCODE_EFFORT = 5;

export interface ProcessedImage {
  data: Buffer;
  width: number;
  height: number;
  bytes: number;
  quality: number;
  /** True when the ceiling forced a narrower image than the ladder's top. */
  downscaled: boolean;
}

export class ImageTooComplex extends Error {
  constructor() {
    super("could not bring this image under the size ceiling without destroying it");
    this.name = "ImageTooComplex";
  }
}

/**
 * Encode at a given width, binary-searching quality for the largest value that
 * still fits the ceiling. Returns null when even Q_MIN overshoots.
 */
async function encodeAtWidth(
  input: Buffer,
  width: number
): Promise<ProcessedImage | null> {
  /**
   * Decode, resize and sharpen ONCE into raw pixels.
   *
   * The obvious shape here is a sharp pipeline with .clone() per probe, but
   * clone re-runs the whole pipeline — so a six-step search decodes and
   * resamples a multi-megabyte source six times. Measured, that was ~2.9s an
   * image and the encode was not the expensive part. Rendering to raw once and
   * re-encoding those pixels makes every probe a pure WebP encode.
   */
  const { data: raw, info } = await sharp(input, { failOn: "none" })
    .rotate() // honour EXIF orientation before metadata is discarded
    .resize({
      width,
      // Never upscale a small source — it adds bytes and invents no detail.
      withoutEnlargement: true,
      fit: "inside",
    })
    // Light unsharp mask, applied after the resample that softened the edges.
    // sigma 0.6 is small enough not to halo faces or logo edges.
    .sharpen({ sigma: 0.6, m1: 0.4, m2: 0.9 })
    .raw()
    .toBuffer({ resolveWithObject: true });

  const encode = (q: number) =>
    sharp(raw, { raw: { width: info.width, height: info.height, channels: info.channels } })
      .webp({ quality: q, effort: ENCODE_EFFORT, smartSubsample: true })
      .toBuffer();

  let lo = Q_MIN;
  let hi = Q_MAX;
  let best: { buf: Buffer; q: number } | null = null;

  // Search at the SAME effort used for the final file. Probing cheaper and
  // encoding dearer looks like a saving but silently leaves budget unspent:
  // the winning quality then compresses smaller than its probe, so a higher
  // quality would also have fit. Measured that mistake costing ~20KB of the
  // 100KB allowance.
  while (lo <= hi) {
    const q = Math.floor((lo + hi) / 2);
    const buf = await encode(q);
    if (buf.length <= MAX_BYTES) {
      best = { buf, q };
      lo = q + 1;
    } else {
      hi = q - 1;
    }
  }

  if (!best) return null;

  return {
    data: best.buf,
    width: info.width,
    height: info.height,
    bytes: best.buf.length,
    quality: best.q,
    downscaled: false,
  };
}

/**
 * Convert an uploaded image to a stored WebP under MAX_BYTES.
 *
 * Throws ImageTooComplex only when even 800px at quality 45 cannot fit, which
 * in practice means the input was not really a photograph (a huge noisy scan,
 * say). Better to refuse than to store something unrecognisable.
 */
export async function processImage(input: Buffer): Promise<ProcessedImage> {
  for (const width of WIDTH_LADDER) {
    const out = await encodeAtWidth(input, width);
    if (out) return { ...out, downscaled: width !== WIDTH_LADDER[0] };
  }
  throw new ImageTooComplex();
}

/** Small square derivative for grids and avatars. Always comfortably under. */
export async function processThumb(input: Buffer, size = 400): Promise<Buffer> {
  return sharp(input, { failOn: "none" })
    .rotate()
    .resize({ width: size, height: size, fit: "cover", position: "attention" })
    .sharpen({ sigma: 0.5 })
    .webp({ quality: 72, effort: 5 })
    .toBuffer();
}

/** What the browser is allowed to hand us. */
export const ACCEPTED_MIME = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
  "image/heic",
  "image/heif",
  "image/gif",
];

/** Upload ceiling before processing — generous, since we re-encode anyway. */
export const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;

/**
 * Confirm the bytes really are an image sharp can read, rather than trusting
 * the client's Content-Type. A mislabelled file otherwise reaches the encoder
 * and fails there with a far less useful error.
 */
export async function probe(input: Buffer) {
  try {
    const meta = await sharp(input, { failOn: "none" }).metadata();
    if (!meta.width || !meta.height) return null;
    return { width: meta.width, height: meta.height, format: meta.format ?? "unknown" };
  } catch {
    return null;
  }
}
