import { Suspense } from "react";
import { redirect } from "next/navigation";
import { LockForm } from "@/components/lock/lock-form";
import { SetupNotice } from "@/components/setup-notice";
import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export default async function LockPage() {
  if (!isSupabaseConfigured()) return <SetupNotice />;
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("lock_pin_hash")
    .eq("user_id", user.id)
    .maybeSingle();

  return (
    <main className="flex min-h-screen items-center justify-center px-5 py-10">
      <Suspense>
        <LockForm pinConfigured={Boolean(profile?.lock_pin_hash)} />
      </Suspense>
    </main>
  );
}
