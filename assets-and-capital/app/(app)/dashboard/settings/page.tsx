import type { Metadata } from "next";
import { AccountSettings } from "@/components/dashboard/settings";

export const metadata: Metadata = { title: "Security & Settings" };

export default function SettingsPage() {
  return <AccountSettings />;
}
