import type { ReactNode } from "react";

/**
 * The shell every admin record page shares.
 *
 * These six surfaces were panels on the overview reached by an anchor. An
 * anchor is right for a summary and wrong for a working surface: nowhere to
 * filter, no address to send a colleague, no room to show a record properly,
 * and a page that grows without bound as the platform fills up.
 *
 * One shell rather than six layouts, because the difference between them is
 * the columns — and six hand-built tables drift into six different ideas about
 * what an empty state or a count looks like.
 */
export function RecordPage({
  kicker,
  title,
  description,
  count,
  children,
}: {
  kicker: string;
  title: string;
  description: string;
  count: number;
  children: ReactNode;
}) {
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <p className="kicker text-[0.7rem] text-brand-700">{kicker}</p>
        <h1 className="mt-1.5 font-display text-3xl font-medium text-navy-700">{title}</h1>
        <p className="mt-1 max-w-2xl text-sm leading-relaxed text-ink/65">
          {count} record{count === 1 ? "" : "s"}. {description}
        </p>
      </div>
      {children}
    </div>
  );
}

/** A table that keeps its shape when there is nothing in it. */
export function RecordTable({
  head,
  empty,
  rows,
}: {
  head: string[];
  empty: string;
  rows: ReactNode[];
}) {
  return (
    <div className="overflow-hidden rounded-3xl border border-ink/[0.07] bg-white">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[40rem] text-left text-sm">
          <thead className="border-b border-ink/[0.06] bg-paper-2/40 text-xs uppercase tracking-wide text-ink/55">
            <tr>
              {head.map((h) => (
                <th key={h} className="px-5 py-3 font-semibold">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-ink/[0.05]">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={head.length} className="px-5 py-12 text-center text-sm text-ink/55">
                  {empty}
                </td>
              </tr>
            ) : (
              rows
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
