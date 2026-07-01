import type { Metadata } from "next";
import { SettingsForm } from "@/components/settings/settings-form";
import { ensureProfile } from "@/server/queries/user";

export const metadata: Metadata = {
  title: "設定"
};

export default async function SettingsPage() {
  const { profile, settings } = await ensureProfile();

  return (
    <div>
      <SettingsForm profile={profile} settings={settings} />
    </div>
  );
}
