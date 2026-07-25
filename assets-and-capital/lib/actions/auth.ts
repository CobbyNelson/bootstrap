"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { createSession, destroySession } from "@/lib/session";

export type AuthResult = { ok: boolean; error?: string; role?: string };

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
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

  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return { ok: false, error: "An account with this email already exists." };

    const passwordHash = await bcrypt.hash(input.password, 10);
    const role = input.role === "BUSINESS" ? "BUSINESS" : "INVESTOR";
    const user = await prisma.user.create({
      data: { email, name: input.name?.trim() || null, passwordHash, role },
    });
    await createSession({ id: user.id, email: user.email, name: user.name, role: user.role });
    return { ok: true, role: user.role };
  } catch (e) {
    console.error("registerUser failed", e);
    return { ok: false, error: "We couldn't create your account. Please try again." };
  }
}

export async function loginUser(input: { email: string; password: string }): Promise<AuthResult> {
  const email = normalizeEmail(input.email || "");
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.passwordHash) return { ok: false, error: "Incorrect email or password." };
    const valid = await bcrypt.compare(input.password || "", user.passwordHash);
    if (!valid) return { ok: false, error: "Incorrect email or password." };
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
