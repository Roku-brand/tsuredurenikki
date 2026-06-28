"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Save, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/field";
import { setLockPinAction, updateLockSettingsAction } from "@/server/actions/lock";
import { createClient } from "@/lib/supabase/client";
import type { AppSettings, Profile } from "@/types/database";

export function SettingsForm({ profile, settings }: { profile: Profile; settings: AppSettings }) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [lockEnabled, setLockEnabled] = useState(profile.lock_enabled);
  const [timeout, setTimeoutValue] = useState(String(settings.lock_timeout_minutes));
  const [theme, setTheme] = useState(settings.theme ?? "system");
  const [pin, setPin] = useState("");
  const [isPending, startTransition] = useTransition();

  function saveSettings() {
    startTransition(async () => {
      const result = await updateLockSettingsAction({
        lockEnabled,
        lockTimeoutMinutes: Number(timeout),
        theme
      });
      setMessage(result.message ?? "");
      router.refresh();
    });
  }

  function savePin() {
    startTransition(async () => {
      const result = await setLockPinAction(pin);
      setMessage(result.message ?? "");
      if (result.ok) setPin("");
      router.refresh();
    });
  }

  function signOut() {
    startTransition(async () => {
      sessionStorage.removeItem("zezehibi:unlocked");
      const supabase = createClient();
      await supabase.auth.signOut();
      router.replace("/login");
      router.refresh();
    });
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <section className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4 shadow-soft">
        <h2 className="mb-4 font-semibold">アプリ内ロック</h2>
        <div className="grid gap-4">
          <label className="flex items-center gap-3 text-sm font-medium">
            <input
              type="checkbox"
              checked={lockEnabled}
              onChange={(event) => setLockEnabled(event.target.checked)}
              className="size-4"
            />
            ロックを有効にする
          </label>
          <Field label="再ロック時間（分）">
            <Input type="number" min={1} max={120} value={timeout} onChange={(event) => setTimeoutValue(event.target.value)} />
          </Field>
          <Field label="テーマ">
            <Select value={theme} onChange={(event) => setTheme(event.target.value)}>
              <option value="system">端末に合わせる</option>
              <option value="light">ライト</option>
              <option value="dark">ダーク</option>
            </Select>
          </Field>
          <Button type="button" onClick={saveSettings} disabled={isPending}>
            <Save size={16} />
            設定を保存
          </Button>
        </div>
      </section>

      <section className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4 shadow-soft">
        <h2 className="mb-4 font-semibold">PIN</h2>
        <div className="grid gap-4">
          <p className="text-sm leading-6 text-neutral-600 dark:text-neutral-300">
            PINはハッシュ化して保存されます。解除状態はこのブラウザセッションだけに保持します。
          </p>
          <Field label={profile.lock_pin_hash ? "PINを変更" : "PINを設定"}>
            <Input
              type="password"
              inputMode="numeric"
              pattern="[0-9]*"
              minLength={4}
              maxLength={6}
              value={pin}
              onChange={(event) => setPin(event.target.value)}
              placeholder="4桁または6桁"
            />
          </Field>
          <Button type="button" onClick={savePin} disabled={isPending || !pin}>
            <Shield size={16} />
            PINを保存
          </Button>
        </div>
      </section>

      <section className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4 shadow-soft lg:col-span-2">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-semibold">アカウント</h2>
            <p className="mt-1 text-sm text-neutral-500">この端末からログアウトします。</p>
          </div>
          <Button type="button" variant="secondary" onClick={signOut} disabled={isPending}>
            <LogOut size={16} />
            ログアウト
          </Button>
        </div>
      </section>

      {message ? <p className="lg:col-span-2 rounded-lg bg-mist px-3 py-2 text-sm text-neutral-700">{message}</p> : null}
    </div>
  );
}
