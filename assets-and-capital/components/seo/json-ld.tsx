/**
 * Structured data, emitted safely.
 *
 * JSON.stringify does NOT escape `<`, so a value containing `</script>` closes
 * the block and everything after it is parsed as markup. Article titles,
 * categories and author names are stored with length limits but no escaping,
 * which made a title an injection point — and the payload would run under the
 * site's own policy, since script-src still carries 'unsafe-inline'.
 *
 * Escaping < > & keeps it inert. U+2028/U+2029 are escaped because they are
 * legal inside a JSON string but terminate a line to a JavaScript parser. All
 * five are valid JSON escapes, so consumers read the data unchanged.
 *
 * Use this for every ld+json block. Do not hand-roll the script tag.
 */
export function jsonLdHtml(data: unknown): string {
  return JSON.stringify(data)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}

export function JsonLd({ data }: { data: unknown }) {
  return (
    <script
      type="application/ld+json"
      // Safe: jsonLdHtml escapes every character that can break out of a
      // script block. This is the one sanctioned use of the prop here.
      dangerouslySetInnerHTML={{ __html: jsonLdHtml(data) }}
    />
  );
}
