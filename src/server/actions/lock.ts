"use server";

import { revalidatePath } from "next/cache";
import { hashPin, isValidPin, verifyPin } from "@/lib/security/pin";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/server/queries/user";
import type { ActionResult } from "@/types/forms";

export async function verifyLockPinAction(pin: string): Promise<ActionResult> {
  const user = await requireUser();
  if (!isValidPin(pin)) return { ok: false, message: "PINは4桁または6桁で入力してください。" };
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("lock_pin_hash, lock_enabled")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!data?.lock_enabled) return { ok: true };
  if (!verifyPin(pin, data.lock_pin_hash)) return { ok: false, message: "PINが違います。" };
  return { ok: true };
}

export async function setLockPinAction(pin: string): Promise<ActionResult> {
  const user = await requireUser();
  if (!isValidPin(pin)) return { ok: false, message: "PINは4桁または6桁で入力してください。" };
  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .upsert({ user_id: user.id, lock_pin_hash: hashPin(pin), lock_enabled: true }, { onConflict: "user_id" });

  revalidatePath("/app/settings");
  return error ? { ok: false, message: "PINを設定できませんでした。" } : { ok: true, message: "PINを設定しました。" };
}

export async function updateLockSettingsAction(input: {
  lockEnabled: boolean;
  lockTimeoutMinutes: number;
  theme?: string;
}): Promise<ActionResult> {
  const user = await requireUser();
  const timeout = Math.min(120, Math.max(1, Number(input.lockTimeoutMinutes) || 10));
  const supabase = await createClient();
  const [{ error: profileError }, { error: settingsError }] = await Promise.all([
    supabase.from("profiles").upsert({ user_id: user.id, lock_enabled: input.lockEnabled }, { onConflict: "user_id" }),
    supabase
      .from("app_settings")
      .upsert(
        { user_id: user.id, lock_timeout_minutes: timeout, theme: input.theme ?? "system" },
        { onConflict: "user_id" }
      )
  ]);

  revalidatePath("/app/settings");
  return profileError || settingsError
    ? { ok: false, message: "設定を保存できませんでした。" }
    : { ok: true, message: "設定を保存しました。" };
}
