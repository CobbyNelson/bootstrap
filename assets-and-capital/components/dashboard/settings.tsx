"use client";

import { useState } from "react";
import {
  Shield, Smartphone, Key, Monitor, LogOut, CheckCircle2, AlertTriangle,
  Users, Bell, Globe, Fingerprint, Laptop, Tablet, MapPin,
} from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = ["Security", "Sessions", "Team & roles", "Preferences"] as const;
type Tab = (typeof TABS)[number];

const SESSIONS = [
  { device: "MacBook Pro · Chrome", where: "London, UK", ip: "51.140.x.x", when: "Active now", current: true, icon: Laptop },
  { device: "iPhone 15 · Safari", where: "London, UK", ip: "102.89.x.x", when: "2 hours ago", current: false, icon: Smartphone },
  { device: "iPad Air · A&C App", where: "Manchester, UK", ip: "82.15.x.x", when: "Yesterday", current: false, icon: Tablet },
];

const LOGINS = [
  { event: "Successful sign-in", where: "London, UK", when: "Today · 08:02 GMT", ok: true },
  { event: "Successful sign-in", where: "London, UK", when: "Yesterday · 17:44 GMT", ok: true },
  { event: "Password changed", where: "London, UK", when: "3 days ago", ok: true },
  { event: "Blocked sign-in attempt", where: "Unknown · TOR exit", when: "5 days ago", ok: false },
];

const TEAM = [
  { name: "Aurora Family Office", email: "principal@auroracap.com", role: "Owner", access: "Full access", you: true },
  { name: "R. Osei", email: "r.osei@auroracap.com", role: "Deal lead", access: "Deals, data rooms, messaging" },
  { name: "Compliance Desk", email: "compliance@auroracap.com", role: "Compliance", access: "Verification, audit, read-only deals" },
  { name: "J. Adeyemi", email: "j.adeyemi@auroracap.com", role: "Analyst", access: "Read-only marketplace & matches" },
];

const ROLE_STYLE: Record<string, string> = {
  Owner: "bg-brand-50 text-brand-700 ring-brand-100",
  "Deal lead": "bg-violet-50 text-violet-700 ring-violet-100",
  Compliance: "bg-amber-50 text-amber-700 ring-amber-100",
  Analyst: "bg-sky-50 text-sky-700 ring-sky-100",
};

function Toggle({ on, onClick }: { on: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className={cn("relative h-6 w-11 flex-none rounded-[var(--radius-button)] transition-colors", on ? "bg-brand-600" : "bg-ink/15")} role="switch" aria-checked={on}>
      <span className={cn("absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all", on ? "left-[1.375rem]" : "left-0.5")} />
    </button>
  );
}

export function AccountSettings() {
  const [tab, setTab] = useState<Tab>("Security");
  const [twoFA, setTwoFA] = useState(true);
  const [passkey, setPasskey] = useState(true);
  const [prefs, setPrefs] = useState({ dealAlerts: true, weeklyDigest: true, productNews: false, loginAlerts: true });

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-700">Account</p>
        <h1 className="mt-1 font-display text-2xl font-semibold text-navy-700">Security &amp; settings</h1>
        <p className="mt-1 text-sm text-ink/65">Protect your account and manage who can access your workspace.</p>
      </div>

      <div className="flex flex-wrap gap-1 rounded-[var(--radius-button)] border border-ink/[0.07] bg-white p-1">
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)} className={cn("rounded-[var(--radius-button)] px-4 py-2 text-sm font-medium transition-colors", tab === t ? "bg-ink text-white" : "text-ink/65 hover:text-ink")}>{t}</button>
        ))}
      </div>

      {tab === "Security" && (
        <div className="space-y-4">
          <div className="rounded-3xl border border-ink/[0.07] bg-white p-6">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-emerald-700" />
              <h2 className="font-display text-base font-semibold text-navy-700">Security status</h2>
              <span className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 ring-1 ring-emerald-100"><CheckCircle2 className="h-3.5 w-3.5" /> Strong</span>
            </div>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-ink/[0.06]">
              <div className="h-full rounded-full bg-emerald-500" style={{ width: "90%" }} />
            </div>
            <p className="mt-2 text-xs text-ink/65">9 of 10 recommendations complete. Add a backup security key to reach 100%.</p>
          </div>

          {[
            { icon: Smartphone, title: "Two-factor authentication", desc: "Require a one-time code from your authenticator app at sign-in.", on: twoFA, set: () => setTwoFA((v) => !v) },
            { icon: Fingerprint, title: "Passkey / biometric login", desc: "Sign in with Face ID, Touch ID or a hardware security key.", on: passkey, set: () => setPasskey((v) => !v) },
          ].map((row) => (
            <div key={row.title} className="flex items-center gap-4 rounded-2xl border border-ink/[0.07] bg-white p-5">
              <span className="grid h-10 w-10 flex-none place-items-center rounded-xl bg-brand-50 text-brand-600 ring-1 ring-brand-100"><row.icon className="h-5 w-5" /></span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-ink">{row.title}</p>
                <p className="text-xs text-ink/65">{row.desc}</p>
              </div>
              <Toggle on={row.on} onClick={row.set} />
            </div>
          ))}

          <div className="flex items-center gap-4 rounded-2xl border border-ink/[0.07] bg-white p-5">
            <span className="grid h-10 w-10 flex-none place-items-center rounded-xl bg-ink/[0.05] text-ink/60"><Key className="h-5 w-5" /></span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-ink">Password</p>
              <p className="text-xs text-ink/65">Last changed 3 days ago · 24 characters</p>
            </div>
            <button className="rounded-[var(--radius-button)] border border-ink/12 px-4 py-2 text-sm font-medium text-ink/70 hover:bg-paper-2">Change</button>
          </div>

          <div className="rounded-2xl border border-ink/[0.07] bg-white p-6">
            <h2 className="font-display text-base font-semibold text-navy-700">Recent security activity</h2>
            <div className="mt-4 space-y-3">
              {LOGINS.map((l, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className={cn("grid h-8 w-8 flex-none place-items-center rounded-[var(--radius-button)]", l.ok ? "bg-emerald-50 text-emerald-700" : "bg-brand-50 text-brand-600")}>
                    {l.ok ? <CheckCircle2 className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-ink">{l.event}</p>
                    <p className="flex items-center gap-1 text-xs text-ink/65"><MapPin className="h-3 w-3" /> {l.where}</p>
                  </div>
                  <span className="text-xs text-ink/60">{l.when}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === "Sessions" && (
        <div className="rounded-3xl border border-ink/[0.07] bg-white p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-base font-semibold text-navy-700">Active sessions</h2>
            <button className="inline-flex items-center gap-1.5 rounded-[var(--radius-button)] border border-brand-200 px-3.5 py-2 text-sm font-medium text-brand-700 hover:bg-brand-50"><LogOut className="h-4 w-4" /> Sign out all others</button>
          </div>
          <div className="mt-4 divide-y divide-ink/[0.05]">
            {SESSIONS.map((s, i) => (
              <div key={i} className="flex items-center gap-4 py-4">
                <span className="grid h-10 w-10 flex-none place-items-center rounded-xl bg-ink/[0.05] text-ink/60"><s.icon className="h-5 w-5" /></span>
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-2 text-sm font-medium text-ink">
                    {s.device}
                    {s.current && <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[0.65rem] font-medium text-emerald-700">This device</span>}
                  </p>
                  <p className="text-xs text-ink/65">{s.where} · {s.ip}</p>
                </div>
                <span className={cn("text-xs", s.current ? "font-medium text-emerald-700" : "text-ink/60")}>{s.when}</span>
                {!s.current && <button className="rounded-[var(--radius-button)] border border-ink/12 px-3 py-1.5 text-xs font-medium text-ink/60 hover:bg-paper-2">Revoke</button>}
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "Team & roles" && (
        <div className="rounded-3xl border border-ink/[0.07] bg-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-brand-600" />
              <h2 className="font-display text-base font-semibold text-navy-700">Team &amp; role-based access</h2>
            </div>
            <button className="rounded-[var(--radius-button)] bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700">Invite member</button>
          </div>
          <div className="mt-4 divide-y divide-ink/[0.05]">
            {TEAM.map((m) => (
              <div key={m.email} className="flex items-center gap-4 py-4">
                <span className="grid h-10 w-10 flex-none place-items-center rounded-[var(--radius-button)] bg-gradient-to-br from-ink to-ink-2 text-xs font-semibold text-white">
                  {m.name.split(" ").slice(0, 2).map((w) => w[0]).join("")}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-ink">{m.name} {m.you && <span className="text-ink/60">(you)</span>}</p>
                  <p className="truncate text-xs text-ink/65">{m.email} · {m.access}</p>
                </div>
                <span className={cn("rounded-full px-2.5 py-1 text-xs font-medium ring-1", ROLE_STYLE[m.role])}>{m.role}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "Preferences" && (
        <div className="space-y-4">
          <div className="rounded-3xl border border-ink/[0.07] bg-white p-6">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-brand-600" />
              <h2 className="font-display text-base font-semibold text-navy-700">Notifications</h2>
            </div>
            <div className="mt-4 space-y-4">
              {[
                { key: "dealAlerts" as const, label: "New mandate-matched deals", desc: "Alert me when a deal scores 80+ against my mandate." },
                { key: "weeklyDigest" as const, label: "Weekly pipeline digest", desc: "A Monday summary of pipeline movement and tasks." },
                { key: "loginAlerts" as const, label: "New sign-in alerts", desc: "Email me when my account is accessed from a new device." },
                { key: "productNews" as const, label: "Product news", desc: "Occasional updates on new platform features." },
              ].map((row) => (
                <div key={row.key} className="flex items-center gap-4">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-ink">{row.label}</p>
                    <p className="text-xs text-ink/65">{row.desc}</p>
                  </div>
                  <Toggle on={prefs[row.key]} onClick={() => setPrefs((p) => ({ ...p, [row.key]: !p[row.key] }))} />
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-ink/[0.07] bg-white p-6">
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-brand-600" />
              <h2 className="font-display text-base font-semibold text-navy-700">Region &amp; currency</h2>
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              {[
                { label: "Language", value: "English (UK)" },
                { label: "Currency", value: "USD ($)" },
                { label: "Time zone", value: "GMT · London" },
              ].map((f) => (
                <label key={f.label} className="block">
                  <span className="text-xs font-medium text-ink/65">{f.label}</span>
                  <div className="mt-1.5 flex items-center justify-between rounded-xl border border-ink/10 bg-paper-2/40 px-3.5 py-2.5 text-sm text-ink">
                    {f.value}
                    <Monitor className="h-4 w-4 text-ink/30" />
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
