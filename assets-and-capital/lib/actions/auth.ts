"use server";

import bcrypt from "bcryptjs";

/**
 * bcrypt work factor.
 *
 * Was 10, which is the floor rather than the recommendation — each step doubles
 * the cost of a guess, so 12 makes an offline attack on a stolen hash four
 * times more expensive for about 250ms of our own time at sign-in, once.
 *
 * Raising this does NOT touch the hashes already stored: bcrypt records its
 * cost inside the hash, so an old one keeps verifying at 10 forever. They are
 * upgraded in `loginUser`, which is the only moment the plaintext exists to
 * re-hash from.
 */
const BCRYPT_COST = 12;
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { createSession, destroySession } from "@/lib/session";
import { rateLimit, sweep } from "@/lib/rate-limit";
import { sendEmail, emails } from "@/lib/email";

export type AuthResult = { ok: boolean; error?: string; role?: string };

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

const TOO_MANY = "Too many attempts. Please wait a moment and try again.";

/** Throttle by client IP + email so one address can't be brute-forced. */
async function throttle(scope: string, email: string, limit: number, windowMs: number) {
  sweep();
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const byIp = rateLimit(`${scope}:ip:${ip}`, limit * 3, windowMs);
  const byEmail = rateLimit(`${scope}:em:${email}`, limit, windowMs);
  return byIp.ok && byEmail.ok;
}

export async function registerUser(input: {
  name: string;
  email: string;
  password: string;
  role: "INVESTOR" | "BUSINESS";
}): Promise<AuthResult> {
  const email = normalizeEmail(input.email || "");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { ok: false, error: "Enter a valid email address." };
  if (!input.password || input.password.length < 8)
    return { ok: false, error: "Password must be at least 8 characters." };

  if (!(await throttle("register", email, 5, 60_000))) return { ok: false, error: TOO_MANY };

  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return { ok: false, error: "An account with this email already exists." };

    const passwordHash = await bcrypt.hash(input.password, BCRYPT_COST);
    const role = input.role === "BUSINESS" ? "BUSINESS" : "INVESTOR";
    const user = await prisma.user.create({
      data: { email, name: input.name?.trim() || null, passwordHash, role },
    });
    await createSession({ id: user.id, email: user.email, name: user.name, role: user.role });
    const welcome = emails.welcome(user.name);
    void sendEmail({ to: user.email, ...welcome });
    return { ok: true, role: user.role };
  } catch (e) {
    console.error("registerUser failed", e);
    return { ok: false, error: "We couldn't create your account. Please try again." };
  }
}

export async function loginUser(input: { email: string; password: string }): Promise<AuthResult> {
  const email = normalizeEmail(input.email || "");
  if (!(await throttle("login", email, 8, 60_000))) return { ok: false, error: TOO_MANY };
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.passwordHash) return { ok: false, error: "Incorrect email or password." };
    const valid = await bcrypt.compare(input.password || "", user.passwordHash);
    if (!valid) return { ok: false, error: "Incorrect email or password." };

    // Re-hash at the current cost if this one was stored at a weaker one.
    //
    // Here because it is the one moment the plaintext password exists on the
    // server; there is no batch job that could do this. The whole thing is
    // best-effort — a failed write must never turn a correct password into a
    // failed sign-in, so the account is let in either way.
    const stored = Number(user.passwordHash.split("$")[2]);
    if (Number.isFinite(stored) && stored < BCRYPT_COST) {
      try {
        const upgraded = await bcrypt.hash(input.password, BCRYPT_COST);
        await prisma.user.update({ where: { id: user.id }, data: { passwordHash: upgraded } });
      } catch (e) {
        console.error("password re-hash failed", e);
      }
    }

    await createSession({ id: user.id, email: user.email, name: user.name, role: user.role });
    return { ok: true, role: user.role };
  } catch (e) {
    console.error("loginUser failed", e);
    return { ok: false, error: "We couldn't sign you in. Please try again." };
  }
}

export async function logoutUser(): Promise<void> {
  await destroySession();
  redirect("/");
}
