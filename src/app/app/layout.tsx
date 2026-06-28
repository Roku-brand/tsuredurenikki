import { AppShell } from "@/components/app-shell";
import { RegisterServiceWorker } from "@/components/register-service-worker";
import { SetupNotice } from "@/components/setup-notice";
import { isSupabaseConfigured } from "@/lib/env";
import { ensureProfile } from "@/server/queries/user";

export default async function ApplicationLayout({ children }: { children: React.ReactNode }) {
  if (!isSupabaseConfigured()) return <SetupNotice />;
  const { profile, settings } = await ensureProfile();

  return (
    <AppShell profile={profile} settings={settings}>
      <RegisterServiceWorker />
      {children}
    </AppShell>
  );
}
