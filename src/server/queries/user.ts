import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { AppSettings, Profile } from "@/types/database";

export async function getCurrentUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error
  } = await supabase.auth.getUser();

  if (error || !user) return null;
  return user;
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export async function ensureProfile() {
  const user = await requireUser();
  const supabase = await createClient();

  const { data: existingProfile } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  const profile =
    existingProfile ??
    (
      await supabase
        .from("profiles")
        .insert({ user_id: user.id, display_name: user.email?.split("@")[0] ?? "me" })
        .select("*")
        .single()
    ).data;

  const { data: existingSettings } = await supabase
    .from("app_settings")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  const settings =
    existingSettings ??
    (await supabase.from("app_settings").insert({ user_id: user.id }).select("*").single()).data;

  return {
    user,
    profile: profile as Profile,
    settings: settings as AppSettings
  };
}
