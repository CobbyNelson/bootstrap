/**
 * Whose IP the rate limiters key on.
 *
 *   npm run check:ip
 *
 * Every throttle on the site — login, site-unlock, contact, intake, mandate,
 * chat — keys on this one function. If it can be spoofed, none of them exist.
 *
 * The case that matters is the Cloudflare one. Each proxy APPENDS to
 * X-Forwarded-For, so behind Cloudflare a request carrying a forged header
 * arrives as `<forged>, <real>` and reading the first entry returns the
 * attacker's choice. These assertions are what stop somebody "simplifying"
 * this back to a one-line header read.
 */
import { clientIp } from "../lib/client-ip";

const H = (o: Record<string, string>) => new Headers(o);
let bad = 0;
const eq = (label: string, got: string, want: string) => {
  if (got !== want) { bad++; console.error(`  ${label}\n      got ${JSON.stringify(got)}, want ${JSON.stringify(want)}`); }
};

/* ---- not behind Cloudflare: Caddy replaces XFF, so it is trustworthy ---- */
delete process.env.TRUST_CLOUDFLARE;
eq("plain XFF", clientIp(H({ "x-forwarded-for": "203.0.113.9" })), "203.0.113.9");
eq("XFF with spaces", clientIp(H({ "x-forwarded-for": " 203.0.113.9 , 10.0.0.1" })), "203.0.113.9");
eq("x-real-ip fallback", clientIp(H({ "x-real-ip": "203.0.113.9" })), "203.0.113.9");
eq("nothing at all", clientIp(H({})), "unknown");
// CF header ignored while untrusted — the origin is still directly reachable.
eq("cf header ignored when untrusted", clientIp(H({ "cf-connecting-ip": "1.2.3.4", "x-forwarded-for": "203.0.113.9" })), "203.0.113.9");

/* ---- behind Cloudflare, origin locked ---- */
process.env.TRUST_CLOUDFLARE = "true";
eq("cf header preferred", clientIp(H({ "cf-connecting-ip": "203.0.113.9", "x-forwarded-for": "1.2.3.4, 203.0.113.9" })), "203.0.113.9");

// THE ONE THAT MATTERS. Attacker sends XFF: 1.2.3.4; Cloudflare appends the
// real address and sets CF-Connecting-IP. The forged entry must not win.
eq("forged XFF loses to the CF header", clientIp(H({ "x-forwarded-for": "1.2.3.4, 198.51.100.7", "cf-connecting-ip": "198.51.100.7" })), "198.51.100.7");

// Junk in the CF header falls through rather than becoming a rate-limit key.
eq("junk cf header falls back", clientIp(H({ "cf-connecting-ip": "<script>", "x-forwarded-for": "203.0.113.9" })), "203.0.113.9");
eq("overlong cf header falls back", clientIp(H({ "cf-connecting-ip": "9".repeat(60), "x-forwarded-for": "203.0.113.9" })), "203.0.113.9");
eq("empty cf header falls back", clientIp(H({ "cf-connecting-ip": "", "x-forwarded-for": "203.0.113.9" })), "203.0.113.9");

/* ---- nothing unidentified may escape a bucket ---- */
for (const junk of ["", " ", "not-an-ip", "1.2.3.4; DROP TABLE", "../../etc"]) {
  const got = clientIp(H({ "x-forwarded-for": junk }));
  if (got !== "unknown" && !/^[0-9a-fA-F:.]+$/.test(got)) {
    bad++; console.error(`  junk XFF became a key: ${JSON.stringify(junk)} -> ${JSON.stringify(got)}`);
  }
}
eq("IPv6 survives", clientIp(H({ "x-forwarded-for": "2001:db8::1" })), "2001:db8::1");

if (bad > 0) { console.error(`\nclient IP check FAILED — ${bad}`); process.exit(1); }
console.log("client IP check passed: Cloudflare spoof refused, CF header only trusted when the origin is locked, junk never becomes a rate-limit key");
