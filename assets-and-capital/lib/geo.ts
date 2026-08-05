import "server-only";
import fs from "node:fs";
import path from "node:path";
import { Reader } from "mmdb-lib";
import type { CityResponse, CountryResponse } from "mmdb-lib/lib/reader/response";

/**
 * Country (and city, if a database for it is installed) from an IP address.
 *
 * Resolved locally against a database on disk — never by calling a lookup
 * service. Sending every visitor's IP to a third party to find out what country
 * they are in would hand that third party the exact profile this whole module
 * exists to avoid building, and would make them a processor we would have to
 * disclose.
 *
 * Two databases, both DB-IP Lite (CC-BY-4.0, no licence key):
 *
 *   dbip-country.mmdb  ~4MB   installed by deploy/geo-update.sh
 *   dbip-city.mmdb     ~120MB optional — drop it in the same directory and
 *                             city and region start populating on next boot
 *
 * They live beside .env in the shared directory rather than in the repo: the
 * data is republished monthly, and a binary that changes every month is exactly
 * what git history should not accumulate.
 *
 * Attribution requirement: the CC-BY licence needs a visible credit. It is in
 * the privacy policy alongside the explanation of what is collected.
 */

export type GeoResult = {
  country: string | null;
  region: string | null;
  city: string | null;
};

const EMPTY: GeoResult = { country: null, region: null, city: null };

const DB_DIR = process.env.GEO_DB_DIR || "/srv/ac/shared/geo";

/**
 * Readers are built once and kept. Each opens a multi-megabyte buffer; doing
 * that per request would dominate the cost of the request itself.
 *
 * `undefined` means "not tried yet", `null` means "tried and unavailable" —
 * without that distinction a missing file is re-read on every single view.
 */
let cityReader: Reader<CityResponse> | null | undefined;
let countryReader: Reader<CountryResponse> | null | undefined;

function load<T extends CountryResponse>(file: string): Reader<T> | null {
  try {
    const full = path.join(DB_DIR, file);
    if (!fs.existsSync(full)) return null;
    return new Reader<T>(fs.readFileSync(full));
  } catch {
    // A corrupt or truncated download must not take the site down; analytics
    // degrades to "country unknown" and everything else carries on.
    return null;
  }
}

export function geoAvailable(): { country: boolean; city: boolean } {
  if (countryReader === undefined) countryReader = load<CountryResponse>("dbip-country.mmdb");
  if (cityReader === undefined) cityReader = load<CityResponse>("dbip-city.mmdb");
  return { country: Boolean(countryReader), city: Boolean(cityReader) };
}

/** Private and loopback ranges — a lookup on these is always a miss. */
function isPrivate(ip: string): boolean {
  return (
    ip === "unknown" ||
    ip.startsWith("10.") ||
    ip.startsWith("192.168.") ||
    ip.startsWith("127.") ||
    ip === "::1" ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(ip)
  );
}

export function lookupGeo(ip: string): GeoResult {
  if (!ip || isPrivate(ip)) return EMPTY;

  if (cityReader === undefined) cityReader = load<CityResponse>("dbip-city.mmdb");
  if (countryReader === undefined) countryReader = load<CountryResponse>("dbip-country.mmdb");

  try {
    // City first when present: it carries country too, so one lookup does both.
    if (cityReader) {
      const r = cityReader.get(ip);
      if (r) {
        return {
          country: r.country?.iso_code ?? null,
          region: r.subdivisions?.[0]?.names?.en ?? null,
          city: r.city?.names?.en ?? null,
        };
      }
    }
    if (countryReader) {
      const r = countryReader.get(ip);
      if (r) return { country: r.country?.iso_code ?? null, region: null, city: null };
    }
  } catch {
    // Malformed address, or an IPv6 form the reader does not accept.
  }
  return EMPTY;
}

/** The client address, from the proxy header Caddy sets. */
export function clientIp(headers: Headers): string {
  return (
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headers.get("x-real-ip") ||
    "unknown"
  );
}
