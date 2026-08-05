import type { Metadata } from "next";
import { AccountSettings } from "@/components/dashboard/settings";
import { PrivacyControls } from "@/components/dashboard/privacy-controls";

export const metadata: Metadata = { title: "Security & Settings" };

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <AccountSettings />
      {/* Data-subject rights sit beside account security rather than buried in a
          policy page: a right nobody can find is not much of a right. */}
      <PrivacyControls />
    </div>
  );
}
