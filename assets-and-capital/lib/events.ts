import "server-only";
import { prisma } from "@/lib/prisma";
import { EVENTS as SAMPLE } from "@/lib/content";

/**
 * Events, from the database, falling back to the sample catalogue.
 *
 * The admin page for these promised registrations, live check-ins, ticket
 * revenue and a QR code. The Event model has six columns: title, type,
 * location, date. There is no registration, ticket or check-in table anywhere
 * in the schema — those panels were describing a ticketing product that does
 * not exist and was not being built.
 *
 * So this is the part that is real: an event has a name, a kind, a place and a
 * date, an admin can maintain the list, and the public /events page shows it.
 * That closes the loop the site is actually designed around.
 *
 * The fallback matters for the same reason the marketplace still ships a sample
 * catalogue: an empty events page on a pre-launch site reads as broken, and the
 * three sample events are real intentions rather than invented numbers. The
 * moment a row exists in the database, the samples stop being used entirely —
 * a half-and-half list would be impossible to reason about.
 */

export type PublicEvent = {
  id: string;
  title: string;
  type: string;
  location: string;
  /** ISO for real rows; the original display string for samples. */
  date: string;
  /** True when this came from the sample catalogue rather than the database. */
  sample: boolean;
};

export async function listPublicEvents(): Promise<PublicEvent[]> {
  const rows = await prisma.event
    .findMany({ orderBy: { date: "asc" } })
    .catch(() => [] as { id: string; title: string; type: string; location: string | null; date: Date }[]);

  if (rows.length > 0) {
    return rows.map((e) => ({
      id: e.id,
      title: e.title,
      type: e.type,
      location: e.location ?? "",
      date: e.date.toISOString(),
      sample: false,
    }));
  }

  return SAMPLE.map((e, i) => ({
    id: `sample-${i}`,
    title: e.title,
    type: e.type,
    location: e.location,
    date: e.date,
    sample: true,
  }));
}

/** Admin list — never falls back, because an admin needs to see what is stored. */
export async function listAdminEvents() {
  return prisma.event.findMany({ orderBy: { date: "asc" } }).catch(() => []);
}
