"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Bell, LogOut, Save, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { setLockPinAction, updateLockSettingsAction } from "@/server/actions/lock";
import type { AppSettings, Profile } from "@/types/database";

export function SettingsForm({ profile, settings }: { profile: Profile; settings: AppSettings }) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [lockEnabled, setLockEnabled] = useState(profile.lock_enabled);
  const [timeout, setTimeoutValue] = useState(String(settings.lock_timeout_minutes));
  const [pin, setPin] = useState("");
  const [notificationPermission, setNotificationPermission] = useState("unsupported");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if ("Notification" in window) setNotificationPermission(Notification.permission);
  }, []);

  function saveLockSettings() {
    startTransition(async () => {
      const result = await updateLockSettingsAction({
        lockEnabled,
        lockTimeoutMinutes: Number(timeout),
        theme: settings.theme ?? "system"
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

  function requestNotifications() {
    if (!("Notification" in window)) {
      setMessage("このブラウザは通知に対応していません。");
      return;
    }
    startTransition(async () => {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
      setMessage(permission === "granted" ? "通知を許可しました。" : "通知は許可されていません。");
    });
  }

  function signOut() {
    startTransition(async () => {
      sessionStorage.removeItem("zezehibi:unlocked");
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      await supabase.auth.signOut();
      router.replace("/login");
      router.refresh();
    });
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <section className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4 shadow-soft">
        <h2 className="mb-4 font-semibold">アカウント管理</h2>
        <div className="grid gap-4">
          <label className="flex items-center gap-3 text-sm font-medium">
            <input
              type="checkbox"
              checked={lockEnabled}
              onChange={(event) => setLockEnabled(event.target.checked)}
              className="size-4"
            />
            アプリ内ロックを有効にする
          </label>
          <Field label="再ロック時間（分）">
            <Input type="number" min={1} max={120} value={timeout} onChange={(event) => setTimeoutValue(event.target.value)} />
          </Field>
          <Button type="button" onClick={saveLockSettings} disabled={isPending}>
            <Save size={16} />
            ロック設定を保存
          </Button>
          <div className="h-px bg-[var(--border)]" />
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
          <Button type="button" variant="secondary" onClick={savePin} disabled={isPending || !pin}>
            <Shield size={16} />
            PINを保存
          </Button>
          <Button type="button" variant="secondary" onClick={signOut} disabled={isPending}>
            <LogOut size={16} />
            ログアウト
          </Button>
        </div>
      </section>

      <section className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4 shadow-soft">
        <h2 className="mb-4 font-semibold">通知設定</h2>
        <div className="grid gap-4">
          <p className="text-sm leading-6 text-neutral-600 dark:text-neutral-300">
            ブラウザ通知の許可状態: {notificationPermission}
          </p>
          <Button type="button" onClick={requestNotifications} disabled={isPending || notificationPermission === "granted"}>
            <Bell size={16} />
            通知を許可
          </Button>
        </div>
      </section>

      {message ? <p className="rounded-lg bg-mist px-3 py-2 text-sm text-neutral-700 lg:col-span-2">{message}</p> : null}
    </div>
  );
}
