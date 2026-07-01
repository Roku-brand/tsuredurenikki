"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  Box,
  ChevronDown,
  CircleUserRound,
  Database,
  Download,
  HardDrive,
  Keyboard,
  LogOut,
  Palette,
  Save,
  Shield,
  ShieldCheck,
  SlidersHorizontal,
  Upload,
  Volume2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/field";
import { setLockPinAction, updateLockSettingsAction } from "@/server/actions/lock";
import { exportJsonAction, importJsonAction } from "@/server/actions/import-export";
import type { AppSettings, Profile } from "@/types/database";

const categories = [
  { label: "一般", icon: SlidersHorizontal },
  { label: "通知", icon: Bell },
  { label: "パーソナライズ", icon: Palette },
  { label: "アプリ", icon: Box },
  { label: "音声", icon: Volume2 },
  { label: "データ管理", icon: Database },
  { label: "ストレージ", icon: HardDrive },
  { label: "セーフティ", icon: ShieldCheck },
  { label: "セキュリティとログイン", icon: Shield },
  { label: "アカウント", icon: CircleUserRound },
  { label: "キーボード", icon: Keyboard }
];

export function SettingsForm({ profile, settings }: { profile: Profile; settings: AppSettings }) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [lockEnabled, setLockEnabled] = useState(profile.lock_enabled);
  const [timeout, setTimeoutValue] = useState(String(settings.lock_timeout_minutes));
  const [pin, setPin] = useState("");
  const [payload, setPayload] = useState<unknown>(null);
  const [mode, setMode] = useState<"skip" | "overwrite">("skip");
  const [notificationPermission, setNotificationPermission] = useState("unsupported");
  const [isPending, startTransition] = useTransition();

  const preview = useMemo(() => {
    if (!payload || typeof payload !== "object") return null;
    const object = payload as { diary_entries?: unknown[] };
    return Array.isArray(object.diary_entries) ? object.diary_entries.length : 0;
  }, [payload]);

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
    <div className="overflow-hidden rounded-[22px] border border-[var(--border)] bg-[var(--surface)] shadow-soft">
      <div className="grid min-h-[620px] md:grid-cols-[230px_1fr]">
        <aside className="border-b border-[var(--border)] bg-neutral-50/70 p-2 md:border-b-0 md:border-r dark:bg-white/5">
          <nav className="grid gap-1 md:sticky md:top-4">
            {categories.map((item, index) => {
              const Icon = item.icon;
              const active = index === 0;
              return (
                <button
                  key={item.label}
                  type="button"
                  className={[
                    "flex h-11 items-center gap-3 rounded-xl px-3 text-left text-sm font-medium transition",
                    active ? "bg-white shadow-sm dark:bg-white/10" : "hover:bg-white/70 dark:hover:bg-white/10"
                  ].join(" ")}
                >
                  <Icon size={19} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </aside>

        <main className="px-5 py-4 md:px-6">
          <h1 className="mb-4 text-xl font-semibold">一般</h1>

          <section className="divide-y divide-[var(--border)]">
            <SettingsRow label="外観" value="システム" />
            <SettingsRow label="コントラスト" value="システム" />
            <SettingsRow label="アクセントカラー" value="デフォルト" dot />
            <SettingsRow label="言語" value="自動検出" />
            <ToggleRow
              label="通知"
              description={`ブラウザ通知の許可状態: ${notificationPermission}`}
              checked={notificationPermission === "granted"}
              onClick={requestNotifications}
              disabled={isPending || notificationPermission === "granted"}
            />
            <ToggleRow
              label="アプリ内ロック"
              description="PINでこの端末の表示を保護します。"
              checked={lockEnabled}
              onClick={() => setLockEnabled((current) => !current)}
            />
          </section>

          <section className="mt-6 grid gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border border-[var(--border)] p-4">
              <h2 className="mb-3 font-semibold">セキュリティとログイン</h2>
              <div className="grid gap-3">
                <label className="grid gap-1 text-sm">
                  <span className="font-medium">再ロック時間（分）</span>
                  <Input type="number" min={1} max={120} value={timeout} onChange={(event) => setTimeoutValue(event.target.value)} />
                </label>
                <Button type="button" onClick={saveLockSettings} disabled={isPending}>
                  <Save size={16} />
                  ロック設定を保存
                </Button>
                <label className="grid gap-1 text-sm">
                  <span className="font-medium">{profile.lock_pin_hash ? "PINを変更" : "PINを設定"}</span>
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
                </label>
                <Button type="button" variant="secondary" onClick={savePin} disabled={isPending || !pin}>
                  <Shield size={16} />
                  PINを保存
                </Button>
              </div>
            </div>

            <div className="rounded-2xl border border-[var(--border)] p-4">
              <h2 className="mb-3 font-semibold">データ管理</h2>
              <div className="grid gap-3">
                <Button type="button" onClick={exportJson} disabled={isPending}>
                  <Download size={16} />
                  エクスポート
                </Button>
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
                {preview !== null ? <p className="rounded-lg bg-mist px-3 py-2 text-sm text-neutral-700">日記 {preview}件</p> : null}
                <Button type="button" variant="secondary" onClick={importJson} disabled={isPending || !payload}>
                  <Upload size={16} />
                  インポート
                </Button>
              </div>
            </div>
          </section>

          <section className="mt-4 rounded-2xl border border-[var(--border)] p-4">
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

          {message ? <p className="mt-4 rounded-lg bg-mist px-3 py-2 text-sm text-neutral-700">{message}</p> : null}
        </main>
      </div>
    </div>
  );
}

function SettingsRow({ label, value, dot = false }: { label: string; value: string; dot?: boolean }) {
  return (
    <div className="flex min-h-16 items-center justify-between gap-4">
      <span className="font-medium">{label}</span>
      <span className="flex items-center gap-2 text-sm font-medium">
        {dot ? <span className="size-3 rounded-full bg-neutral-300" /> : null}
        {value}
        <ChevronDown size={16} />
      </span>
    </div>
  );
}

function ToggleRow({
  label,
  description,
  checked,
  disabled,
  onClick
}: {
  label: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <div className="flex min-h-20 items-center justify-between gap-4">
      <div>
        <p className="font-medium">{label}</p>
        <p className="mt-1 text-sm leading-5 text-neutral-500">{description}</p>
      </div>
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className={[
          "relative h-7 w-12 shrink-0 rounded-full transition disabled:opacity-60",
          checked ? "bg-[#3b82f6]" : "bg-neutral-300"
        ].join(" ")}
        aria-pressed={checked}
      >
        <span
          className={[
            "absolute top-1 size-5 rounded-full bg-white shadow transition",
            checked ? "left-6" : "left-1"
          ].join(" ")}
        />
      </button>
    </div>
  );
}
