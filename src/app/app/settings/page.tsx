import type { Metadata } from "next";
import { SettingsForm } from "@/components/settings/settings-form";
import { SectionHeader } from "@/components/ui/card";
import { ensureProfile } from "@/server/queries/user";

export const metadata: Metadata = {
  title: "設定"
};

export default async function SettingsPage() {
  const { profile, settings } = await ensureProfile();

  return (
    <div className="grid gap-6">
      <SectionHeader title="設定" description="ロック、PIN、テーマ、ログアウトを管理します。" />
      <SettingsForm profile={profile} settings={settings} />
    </div>
  );
}
