"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Bell, ChevronRight, Download, LockKeyhole, LogOut, Save, Shield, Upload, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/field";
import { exportJsonAction, importJsonAction } from "@/server/actions/import-export";
import { setLockPinAction, updateLockSettingsAction } from "@/server/actions/lock";
import type { AppSettings, Profile } from "@/types/database";

export function SettingsForm({ profile, settings }: { profile: Profile; settings: AppSettings }) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [lockEnabled, setLockEnabled] = useState(profile.lock_enabled);
  const [timeout, setTimeoutValue] = useState(String(settings.lock_timeout_minutes));
  const [pin, setPin] = useState("");
  const [payload, setPayload] = useState<unknown>(null);
  const [mode, setMode] = useState<"skip" | "overwrite">("skip");
  const [notificationPermission, setNotificationPermission] = useState("unsupported");
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [isPending, startTransition] = useTransition();

  const preview = useMemo(() => {
    if (!payload || typeof payload !== "object") return null;
    const object = payload as { diary_entries?: unknown[] };
    return Array.isArray(object.diary_entries) ? object.diary_entries.length : 0;
  }, [payload]);

  useEffect(() => {
    if ("Notification" in window) setNotificationPermission(Notification.permission);
    setNotificationsEnabled(localStorage.getItem("zezehibi:notifications-enabled") === "true");
  }, []);

  function exportJson() {
    startTransition(async () => {
      const result = await exportJsonAction();
      if (!result.ok || !result.data) {
        setMessage(result.message ?? "エクスポートできませんでした。");
        return;
      }
      const blob = new Blob([JSON.stringify(result.data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `zezehibi-${new Date().toISOString().slice(0, 10)}.json`;
      anchor.click();
      URL.revokeObjectURL(url);
      setMessage("JSONをエクスポートしました。");
    });
  }

  async function loadFile(file: File | undefined) {
    if (!file) return;
    try {
      const text = await file.text();
      setPayload(JSON.parse(text));
      setMessage("インポート前プレビューを表示しました。");
    } catch {
      setMessage("JSONを読み込めませんでした。");
    }
  }

  function importJson() {
    if (!payload) {
      setMessage("先にJSONファイルを選んでください。");
      return;
    }
    startTransition(async () => {
      const result = await importJsonAction(payload, mode);
      setMessage(result.message ?? "");
    });
  }

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

  function toggleNotifications() {
    if (notificationsEnabled) {
      localStorage.setItem("zezehibi:notifications-enabled", "false");
      setNotificationsEnabled(false);
      setMessage("通知をOFFにしました。");
      return;
    }
    if (!("Notification" in window)) {
      setMessage("このブラウザは通知に対応していません。");
      return;
    }
    startTransition(async () => {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
      const enabled = permission === "granted";
      localStorage.setItem("zezehibi:notifications-enabled", String(enabled));
      setNotificationsEnabled(enabled);
      setMessage(enabled ? "通知をONにしました。" : "通知は許可されていません。");
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
    <div className="mx-auto grid max-w-4xl gap-5">
      <h1 className="text-2xl font-semibold">設定</h1>

      <section className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-soft">
        <SettingRow icon={<Download size={21} />} title="エクスポート" detail="日記データと設定をJSONで保存">
          <Button type="button" onClick={exportJson} disabled={isPending}>
            <Download size={16} />
            エクスポート
          </Button>
        </SettingRow>
        <SettingRow icon={<Upload size={21} />} title="インポート" detail={preview !== null ? `日記 ${preview}件を読み込み待ち` : "JSONバックアップから復元"}>
          <div className="grid gap-2">
            <input
              type="file"
              accept="application/json,.json"
              onChange={(event) => void loadFile(event.target.files?.[0])}
              className="focus-ring w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm"
            />
            <Select value={mode} onChange={(event) => setMode(event.target.value as "skip" | "overwrite")}>
              <option value="skip">重複日はスキップ</option>
              <option value="overwrite">重複日は上書き</option>
            </Select>
            <Button type="button" variant="secondary" onClick={importJson} disabled={isPending || !payload}>
              <Upload size={16} />
              インポート
            </Button>
          </div>
        </SettingRow>
        <SettingRow icon={<UserRound size={21} />} title="アカウント管理" detail={profile.display_name || "ユーザー"}>
          <div className="grid gap-3">
            <div className="rounded-lg bg-[var(--surface-muted)] px-3 py-2 text-sm">
              <p className="text-neutral-500">ユーザー名</p>
              <p className="font-semibold">{profile.display_name || "未設定"}</p>
            </div>
            <Button type="button" variant="secondary" onClick={signOut} disabled={isPending}>
              <LogOut size={16} />
              ログアウト
            </Button>
          </div>
        </SettingRow>
        <SettingRow icon={<Bell size={21} />} title="通知設定" detail={notificationsEnabled ? "ON" : "OFF"}>
          <button
            type="button"
            onClick={toggleNotifications}
            disabled={isPending}
            className={[
              "relative h-7 w-12 rounded-full transition disabled:opacity-60",
              notificationsEnabled ? "bg-[#3b82f6]" : "bg-neutral-300"
            ].join(" ")}
            aria-pressed={notificationsEnabled}
          >
            <span
              className={[
                "absolute top-1 size-5 rounded-full bg-white shadow transition",
                notificationsEnabled ? "left-6" : "left-1"
              ].join(" ")}
            />
          </button>
          <p className="mt-2 text-xs text-neutral-500">ブラウザ許可状態: {notificationPermission}</p>
        </SettingRow>
        <SettingRow icon={<LockKeyhole size={21} />} title="プライバシー" detail="ロックとPIN">
          <div className="grid gap-3">
            <label className="flex items-center justify-between gap-3 text-sm font-medium">
              <span>アプリ内ロック</span>
              <input type="checkbox" checked={lockEnabled} onChange={(event) => setLockEnabled(event.target.checked)} className="size-4" />
            </label>
            <Input type="number" min={1} max={120} value={timeout} onChange={(event) => setTimeoutValue(event.target.value)} aria-label="再ロック時間" />
            <Button type="button" onClick={saveLockSettings} disabled={isPending}>
              <Save size={16} />
              ロック設定を保存
            </Button>
            <Input
              type="password"
              inputMode="numeric"
              pattern="[0-9]*"
              minLength={4}
              maxLength={6}
              value={pin}
              onChange={(event) => setPin(event.target.value)}
              placeholder={profile.lock_pin_hash ? "PINを変更" : "PINを設定"}
            />
            <Button type="button" variant="secondary" onClick={savePin} disabled={isPending || !pin}>
              <Shield size={16} />
              PINを保存
            </Button>
          </div>
        </SettingRow>
      </section>

      {message ? <p className="rounded-lg bg-mist px-3 py-2 text-sm text-neutral-700">{message}</p> : null}
    </div>
  );
}

function SettingRow({
  icon,
  title,
  detail,
  children
}: {
  icon: React.ReactNode;
  title: string;
  detail: string;
  children: React.ReactNode;
}) {
  return (
    <details className="group border-b border-[var(--border)] last:border-b-0">
      <summary className="flex min-h-16 cursor-pointer list-none items-center gap-4 px-4 py-3 [&::-webkit-details-marker]:hidden">
        <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-[var(--surface-muted)] text-lake">{icon}</span>
        <span className="min-w-0 flex-1">
          <span className="block font-semibold">{title}</span>
          <span className="mt-0.5 block truncate text-sm text-neutral-500">{detail}</span>
        </span>
        <ChevronRight size={20} className="shrink-0 text-neutral-400 transition group-open:rotate-90" />
      </summary>
      <div className="px-4 pb-4 pl-[68px]">
        <div className="max-w-md">{children}</div>
      </div>
    </details>
  );
}
