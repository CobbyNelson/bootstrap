import type { Metadata } from "next";
import { getLocale } from "@/lib/i18n/server";
import { DEFAULT_LOCALE, localePath } from "@/lib/i18n/config";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { LEGAL_DOCS } from "@/lib/legal-docs";

export function generateStaticParams() {
  return Object.keys(LEGAL_DOCS).map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const d = LEGAL_DOCS[slug];
  return { title: d ? d.title : "Legal" };
}

export default async function LegalPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const locale = await getLocale();
  const doc = LEGAL_DOCS[slug];
  if (!doc) notFound();

  return (
    <>
      <PageHeader title={doc.title} subtitle={`Last updated ${doc.updated}.`} />
      <section className="py-16 md:py-20">
        <div className="container-x max-w-3xl">
          {/* Language-of-record notice.
              Standard practice on multilingual financial sites, and the reason
              it matters here: these documents state obligations, and a
              translation of an obligation is an interpretation of it. Naming
              one authoritative version means a dispute turns on the text that
              was actually drafted and reviewed, not on a rendering of it.
              Shown only on translated pages — on the English one there is
              nothing to disambiguate. */}
          {locale !== DEFAULT_LOCALE && (
            <p className="mb-8 rounded-[var(--radius-button)] border border-ink/10 bg-paper-2/60 px-4 py-3 text-sm leading-relaxed text-ink/70">
              This page is provided for convenience. The{" "}
              <Link
                href={localePath(`/legal/${slug}`, DEFAULT_LOCALE)}
                hrefLang="en"
                className="underline underline-offset-2 hover:text-ink"
              >
                English version
              </Link>{" "}
              is the authoritative text and prevails in the event of any discrepancy.
            </p>
          )}

          {doc.intro && <p className="text-lg leading-relaxed text-ink/70">{doc.intro}</p>}

          <div className="mt-10 space-y-10">
            {doc.sections.map((s) => (
              <div key={s.h}>
                <h2 className="font-display text-xl font-semibold text-navy-700">{s.h}</h2>
                <p className="mt-3 leading-relaxed text-ink/60">{s.p}</p>

                {s.list && (
                  <ul className="mt-4 space-y-2.5">
                    {s.list.map((item) => (
                      <li key={item} className="flex gap-3 leading-relaxed text-ink/60">
                        <span
                          aria-hidden
                          className="mt-2 h-1.5 w-1.5 flex-none rounded-full bg-brand-500"
                        />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                )}

                {s.table && (
                  // Tables must scroll inside their own box; on a phone this one
                  // is wider than the viewport and would otherwise push the page.
                  <div className="mt-5 overflow-x-auto rounded-xl border border-ink/10">
                    <table className="w-full min-w-[36rem] text-left text-sm">
                      <thead className="bg-ink/[0.03] text-xs uppercase tracking-wide text-ink/60">
                        <tr>
                          {s.table.head.map((h) => (
                            <th key={h} className="px-4 py-3 font-semibold">
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-ink/8">
                        {s.table.rows.map((row) => (
                          <tr key={row[0]}>
                            {row.map((cell, i) => (
                              <td
                                key={i}
                                className={
                                  i === 0
                                    ? "px-4 py-3 font-mono text-xs text-ink/80"
                                    : "px-4 py-3 text-ink/60"
                                }
                              >
                                {cell}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
