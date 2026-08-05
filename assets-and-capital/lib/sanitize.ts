import sanitizeHtml from "sanitize-html";

/**
 * The allowlist every piece of editor output passes through before it is stored.
 *
 * Sanitising on SAVE rather than on render is deliberate: it means the database
 * only ever holds safe markup, so a future template that forgets to sanitise
 * cannot resurrect an old payload. (Rendering still uses the stored value
 * directly — that is only safe because of this.)
 *
 * Authors are staff, so this is not primarily about hostile writers. It is about
 * a compromised admin session, and about paste: dragging content in from Word or
 * a web page carries a surprising amount of script, style and tracking markup.
 */
const CONFIG: sanitizeHtml.IOptions = {
  allowedTags: [
    "p", "br", "strong", "em", "u", "s",
    "h2", "h3", "h4",
    "ul", "ol", "li",
    "blockquote",
    "a",
    "figure", "figcaption", "img",
    "hr",
  ],
  allowedAttributes: {
    // target/rel must be listed even though transformTags adds them below —
    // attribute filtering runs AFTER the transform, so anything missing here is
    // stripped straight back off and external links silently lose noopener.
    a: ["href", "title", "target", "rel"],
    img: ["src", "alt", "width", "height"],
  },
  // http/https/mailto only. Blocks javascript:, data: and vbscript: hrefs,
  // which is the classic way a link becomes script execution.
  allowedSchemes: ["http", "https", "mailto"],
  transformTags: {
    // Editors emit these for bold/italic; normalise to the semantic tags.
    b: "strong",
    i: "em",
    a: (tagName, attribs) => ({
      tagName,
      attribs: {
        ...attribs,
        // External links open in a new tab and must not hand the opener over.
        ...(attribs.href?.startsWith("http")
          ? { target: "_blank", rel: "noopener noreferrer" }
          : {}),
      },
    }),
  },
  // Drop the CONTENTS of these too, rather than leaving the text of a <script>
  // block sitting in the middle of the article.
  nonTextTags: ["style", "script", "textarea", "option", "noscript"],
};

const IMG_TAG = /<img\b[^>]*>/gi;
const SRC_ATTR = /src\s*=\s*["']([^"']*)["']/i;

/**
 * Images must be ours.
 *
 * An external <img src> would leak every reader's IP to a third-party host and
 * break the self-hosting rule docs/IMAGERY.md sets out. Run before the
 * allowlist, since afterwards the tag looks legitimate.
 */
function stripForeignImages(html: string): string {
  return html.replace(IMG_TAG, (tag) => {
    const src = tag.match(SRC_ATTR)?.[1] ?? "";
    return src.startsWith("/api/media/") ? tag : "";
  });
}

export function sanitizeArticleHtml(dirty: string): string {
  return sanitizeHtml(stripForeignImages(dirty), CONFIG).trim();
}

/** Plain text, for excerpts and read-time estimates. */
export function htmlToText(html: string): string {
  return sanitizeHtml(html, { allowedTags: [], allowedAttributes: {} })
    .replace(/\s+/g, " ")
    .trim();
}

/** ~200 words per minute, floored at one. */
export function estimateReadTime(html: string): string {
  const words = htmlToText(html).split(" ").filter(Boolean).length;
  return `${Math.max(1, Math.round(words / 200))} min`;
}
