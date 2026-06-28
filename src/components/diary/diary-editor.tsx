"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Save, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { StatusPill } from "@/components/ui/status";
import { deleteDiaryEntryAction, upsertDiaryEntryAction } from "@/server/actions/diary";
import type { EntryWithTags, Tag } from "@/types/database";

type FormState = {
  date: string;
  title: string;
  body: string;
  mood: string;
  stress_level: string;
  anxiety_level: string;
  fulfillment_level: string;
  physical_condition: string;
  wake_time: string;
  sleep_hours: string;
  weather: string;
  breakfast: string;
  lunch: string;
  dinner: string;
  snack: string;
  meal_note: string;
  good_things: string;
  reflections: string;
  learnings: string;
  worries: string;
  tomorrow_todo: string;
  tomorrow_policy: string;
  memo: string;
  idea_note: string;
  news_note: string;
  body_weight: string;
  tags: string;
};

const scoreOptions = [
  ["", "未選択"],
  ["1", "1 低い"],
  ["2", "2"],
  ["3", "3 ふつう"],
  ["4", "4"],
  ["5", "5 高い"]
];

export function DiaryEditor({
  initialDate,
  entry,
  tags
}: {
  initialDate: string;
  entry: EntryWithTags | null;
  tags: Tag[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState<"idle" | "editing" | "saving" | "saved" | "error">("idle");
  const [message, setMessage] = useState("");
  const didMount = useRef(false);
  const [form, setForm] = useState<FormState>(() => ({
    date: entry?.date ?? initialDate,
    title: entry?.title ?? "",
    body: entry?.body ?? "",
    mood: entry?.mood?.toString() ?? "",
    stress_level: entry?.stress_level?.toString() ?? "",
    anxiety_level: entry?.anxiety_level?.toString() ?? "",
    fulfillment_level: entry?.fulfillment_level?.toString() ?? "",
    physical_condition: entry?.physical_condition?.toString() ?? "",
    wake_time: entry?.wake_time?.slice(0, 5) ?? "",
    sleep_hours: entry?.sleep_hours?.toString() ?? "",
    weather: entry?.weather ?? "",
    breakfast: entry?.breakfast ?? "",
    lunch: entry?.lunch ?? "",
    dinner: entry?.dinner ?? "",
    snack: entry?.snack ?? "",
    meal_note: entry?.meal_note ?? "",
    good_things: entry?.good_things ?? "",
    reflections: entry?.reflections ?? "",
    learnings: entry?.learnings ?? "",
    worries: entry?.worries ?? "",
    tomorrow_todo: entry?.tomorrow_todo ?? "",
    tomorrow_policy: entry?.tomorrow_policy ?? "",
    memo: entry?.memo ?? "",
    idea_note: entry?.idea_note ?? "",
    news_note: entry?.news_note ?? "",
    body_weight: entry?.body_weight?.toString() ?? "",
    tags: entry?.tags.map((tag) => tag.name).join(", ") ?? ""
  }));

  const tagSuggestions = useMemo(() => tags.map((tag) => tag.name).join(", "), [tags]);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
    setStatus("editing");
  }

  async function save(showSaved = true) {
    setStatus("saving");
    const result = await upsertDiaryEntryAction(form);
    if (!result.ok) {
      setStatus("error");
      setMessage(result.message ?? "保存できませんでした。");
      return;
    }
    setStatus(showSaved ? "saved" : "idle");
    setMessage(result.message ?? "保存済み");
    router.refresh();
  }

  function deleteEntry() {
    if (!entry?.id) return;
    const ok = window.confirm("この日記を削除しますか？復元用にソフトデリートされます。");
    if (!ok) return;
    startTransition(async () => {
      const result = await deleteDiaryEntryAction(entry.id);
      setMessage(result.message ?? "");
      if (result.ok) router.refresh();
    });
  }

  useEffect(() => {
    if (!didMount.current) {
      didMount.current = true;
      return;
    }
    const timer = setTimeout(() => {
      if (status === "editing") void save(false);
    }, 1400);
    return () => clearTimeout(timer);
  }, [form, status]);

  const statusTone = status === "saved" ? "good" : status === "saving" ? "warn" : status === "error" ? "bad" : "neutral";
  const statusText =
    status === "saved" ? "保存済み" : status === "saving" ? "保存中..." : status === "error" ? "保存失敗" : "編集中";

  return (
    <form
      action={() => startTransition(() => void save())}
      className="grid gap-4"
    >
      <div className="flex flex-col gap-3 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4 shadow-soft sm:flex-row sm:items-end sm:justify-between">
        <div className="grid flex-1 gap-3 sm:grid-cols-[180px_1fr]">
          <Field label="日付">
            <Input type="date" value={form.date} onChange={(event) => update("date", event.target.value)} />
          </Field>
          <Field label="タイトル">
            <Input value={form.title} onChange={(event) => update("title", event.target.value)} placeholder="今日の見出し" />
          </Field>
        </div>
        <div className="flex items-center gap-2">
          <StatusPill tone={statusTone}>{statusText}</StatusPill>
          {entry?.id ? (
            <Button type="button" variant="ghost" size="sm" onClick={deleteEntry} disabled={isPending} aria-label="削除">
              <Trash2 size={16} />
            </Button>
          ) : null}
          <Button type="submit" disabled={isPending}>
            <Save size={16} />
            保存
          </Button>
        </div>
      </div>

      {message ? <p className="rounded-lg bg-mist px-3 py-2 text-sm text-neutral-700 dark:text-neutral-200">{message}</p> : null}

      <section className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4 shadow-soft">
        <Field label="本文">
          <Textarea
            value={form.body}
            onChange={(event) => update("body", event.target.value)}
            className="min-h-64 text-base leading-8"
            placeholder="思ったこと、出来事、感情をそのまま書く"
          />
        </Field>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4 shadow-soft">
          <h2 className="mb-3 font-semibold">生活ログ</h2>
          <div className="grid gap-3">
            <Field label="起床時間">
              <Input type="time" value={form.wake_time} onChange={(event) => update("wake_time", event.target.value)} />
            </Field>
            <Field label="睡眠時間">
              <Input type="number" step="0.1" min="0" value={form.sleep_hours} onChange={(event) => update("sleep_hours", event.target.value)} />
            </Field>
            <Field label="体重">
              <Input type="number" step="0.1" min="0" value={form.body_weight} onChange={(event) => update("body_weight", event.target.value)} />
            </Field>
            <Field label="天気">
              <Input value={form.weather} onChange={(event) => update("weather", event.target.value)} />
            </Field>
          </div>
        </div>

        <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4 shadow-soft">
          <h2 className="mb-3 font-semibold">スコア</h2>
          <div className="grid gap-3">
            <ScoreSelect label="気分" value={form.mood} onChange={(value) => update("mood", value)} />
            <ScoreSelect label="ストレス" value={form.stress_level} onChange={(value) => update("stress_level", value)} />
            <ScoreSelect label="不安" value={form.anxiety_level} onChange={(value) => update("anxiety_level", value)} />
            <ScoreSelect label="充実度" value={form.fulfillment_level} onChange={(value) => update("fulfillment_level", value)} />
            <ScoreSelect label="体調" value={form.physical_condition} onChange={(value) => update("physical_condition", value)} />
          </div>
        </div>

        <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4 shadow-soft">
          <h2 className="mb-3 font-semibold">タグ</h2>
          <Field label="タグ（カンマ区切り）">
            <Input value={form.tags} onChange={(event) => update("tags", event.target.value)} placeholder="例: 学び, 研究, 体調" />
          </Field>
          {tagSuggestions ? <p className="mt-3 text-xs leading-5 text-neutral-500">既存: {tagSuggestions}</p> : null}
        </div>
      </section>

      <section className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4 shadow-soft">
        <h2 className="mb-3 font-semibold">食事</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="朝">
            <Input value={form.breakfast} onChange={(event) => update("breakfast", event.target.value)} />
          </Field>
          <Field label="昼">
            <Input value={form.lunch} onChange={(event) => update("lunch", event.target.value)} />
          </Field>
          <Field label="夜">
            <Input value={form.dinner} onChange={(event) => update("dinner", event.target.value)} />
          </Field>
          <Field label="間食">
            <Input value={form.snack} onChange={(event) => update("snack", event.target.value)} />
          </Field>
        </div>
        <div className="mt-3">
          <Field label="食事メモ">
            <Input value={form.meal_note} onChange={(event) => update("meal_note", event.target.value)} placeholder="一行で軽く残す" />
          </Field>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <MemoArea label="よかったこと" value={form.good_things} onChange={(value) => update("good_things", value)} />
        <MemoArea label="振り返り" value={form.reflections} onChange={(value) => update("reflections", value)} />
        <MemoArea label="学び" value={form.learnings} onChange={(value) => update("learnings", value)} />
        <MemoArea label="悩み" value={form.worries} onChange={(value) => update("worries", value)} />
        <MemoArea label="明日やること" value={form.tomorrow_todo} onChange={(value) => update("tomorrow_todo", value)} />
        <MemoArea label="明日の方針" value={form.tomorrow_policy} onChange={(value) => update("tomorrow_policy", value)} />
        <MemoArea label="気になったニュース" value={form.news_note} onChange={(value) => update("news_note", value)} />
        <MemoArea label="アイデア・トーク種" value={form.idea_note} onChange={(value) => update("idea_note", value)} />
      </section>

      <section className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4 shadow-soft">
        <Field label="メモ">
          <Textarea value={form.memo} onChange={(event) => update("memo", event.target.value)} />
        </Field>
      </section>
    </form>
  );
}

function ScoreSelect({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <Field label={label}>
      <Select value={value} onChange={(event) => onChange(event.target.value)}>
        {scoreOptions.map(([optionValue, labelText]) => (
          <option key={optionValue} value={optionValue}>
            {labelText}
          </option>
        ))}
      </Select>
    </Field>
  );
}

function MemoArea({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <section className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4 shadow-soft">
      <Field label={label}>
        <Textarea value={value} onChange={(event) => onChange(event.target.value)} className="min-h-24" />
      </Field>
    </section>
  );
}
