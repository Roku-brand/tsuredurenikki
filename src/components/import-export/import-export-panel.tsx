"use client";

import { useMemo, useState, useTransition } from "react";
import { Download, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/field";
import { exportJsonAction, importJsonAction } from "@/server/actions/import-export";

export function ImportExportPanel() {
  const [message, setMessage] = useState("");
  const [payload, setPayload] = useState<unknown>(null);
  const [mode, setMode] = useState<"skip" | "overwrite">("skip");
  const [isPending, startTransition] = useTransition();

  const preview = useMemo(() => {
    if (!payload || typeof payload !== "object") return null;
    const object = payload as { diary_entries?: unknown[]; tags?: unknown[] };
    return {
      entries: Array.isArray(object.diary_entries) ? object.diary_entries.length : 0,
      tags: Array.isArray(object.tags) ? object.tags.length : 0
    };
  }, [payload]);

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

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <section className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4 shadow-soft">
        <h2 className="mb-3 font-semibold">JSONエクスポート</h2>
        <p className="mb-4 text-sm leading-6 text-neutral-600 dark:text-neutral-300">
          日記、タグ、保存検索、設定をJSONとして出力します。
        </p>
        <Button type="button" onClick={exportJson} disabled={isPending}>
          <Download size={16} />
          エクスポート
        </Button>
      </section>

      <section className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4 shadow-soft">
        <h2 className="mb-3 font-semibold">JSONインポート</h2>
        <p className="mb-4 text-sm leading-6 text-neutral-600 dark:text-neutral-300">
          既存JSONを読み込み、日付重複の扱いを選んで移行します。
        </p>
        <div className="grid gap-3">
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
          {preview ? (
            <p className="rounded-lg bg-mist px-3 py-2 text-sm text-neutral-700">
              日記 {preview.entries}件 / タグ {preview.tags}件
            </p>
          ) : null}
          <Button type="button" onClick={importJson} disabled={isPending || !payload}>
            <Upload size={16} />
            インポート
          </Button>
        </div>
      </section>

      {message ? <p className="lg:col-span-2 rounded-lg bg-mist px-3 py-2 text-sm text-neutral-700">{message}</p> : null}
    </div>
  );
}
