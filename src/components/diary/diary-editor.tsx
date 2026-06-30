"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ImagePlus, Save, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { StatusPill } from "@/components/ui/status";
import { deleteDiaryEntryAction, upsertDiaryEntryAction } from "@/server/actions/diary";
import type { EntryWithTags } from "@/types/database";

type FormState = {
  date: string;
  title: string;
  body: string;
  breakfast: string;
  lunch: string;
  dinner: string;
  wake_time: string;
  bedtime: string;
  body_weight: string;
  fulfillment_level: string;
  news_note: string;
  tomorrow_todo: string;
  memo: string;
  photo_note: string;
};

const fulfillmentOptions = [
  ["", "未選択"],
  ["5", "A"],
  ["3", "B"],
  ["1", "C"]
];

function timeValue(value: string | null | undefined) {
  return value && /^\d{2}:\d{2}$/.test(value) ? value : "";
}

function calculateSleepHours(wakeTime: string, bedtime: string) {
  if (!wakeTime || !bedtime) return "";
  const [wakeHour, wakeMinute] = wakeTime.split(":").map(Number);
  const [bedHour, bedMinute] = bedtime.split(":").map(Number);
  if ([wakeHour, wakeMinute, bedHour, bedMinute].some((value) => Number.isNaN(value))) return "";

  const wakeTotal = wakeHour * 60 + wakeMinute;
  const bedTotal = bedHour * 60 + bedMinute;
  const minutes = wakeTotal > bedTotal ? wakeTotal - bedTotal : wakeTotal + 24 * 60 - bedTotal;
  return String(Math.round((minutes / 60) * 10) / 10);
}

export function DiaryEditor({
  initialDate,
  entry
}: {
  initialDate: string;
  entry: EntryWithTags | null;
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
    breakfast: entry?.breakfast ?? "",
    lunch: entry?.lunch ?? "",
    dinner: entry?.dinner ?? "",
    wake_time: entry?.wake_time?.slice(0, 5) ?? "",
    bedtime: timeValue(entry?.weather),
    body_weight: entry?.body_weight?.toString() ?? "",
    fulfillment_level: entry?.fulfillment_level?.toString() ?? "",
    news_note: entry?.news_note ?? "",
    tomorrow_todo: entry?.tomorrow_todo ?? "",
    memo: entry?.memo ?? "",
    photo_note: entry?.idea_note ?? ""
  }));

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
    setStatus("editing");
  }

  async function save(showSaved = true) {
    setStatus("saving");
    const payload = {
      date: form.date,
      title: form.title,
      body: form.body,
      breakfast: form.breakfast,
      lunch: form.lunch,
      dinner: form.dinner,
      wake_time: form.wake_time,
      sleep_hours: calculateSleepHours(form.wake_time, form.bedtime),
      weather: form.bedtime,
      body_weight: form.body_weight,
      fulfillment_level: form.fulfillment_level,
      news_note: form.news_note,
      tomorrow_todo: form.tomorrow_todo,
      memo: form.memo,
      idea_note: form.photo_note,
      mood: "",
      stress_level: "",
      anxiety_level: "",
      physical_condition: "",
      snack: "",
      meal_note: "",
      good_things: "",
      reflections: "",
      learnings: "",
      worries: "",
      tomorrow_policy: "",
      tags: ""
    };
    const result = await upsertDiaryEntryAction(payload);
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
    const ok = window.confirm("この日の記録を削除しますか？");
    if (!ok) return;
    startTransition(async () => {
      const result = await deleteDiaryEntryAction(entry.id);
      setMessage(result.message ?? "");
      if (result.ok) router.refresh();
    });
  }

  function loadPhoto(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setMessage("画像ファイルを選んでください。");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") update("photo_note", reader.result);
    };
    reader.readAsDataURL(file);
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
  const sleepHours = calculateSleepHours(form.wake_time, form.bedtime);

  return (
    <form action={() => startTransition(() => void save())} className="grid gap-4">
      <div className="flex flex-col gap-3 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4 shadow-soft sm:flex-row sm:items-end sm:justify-between">
        <div className="grid flex-1 gap-3 sm:grid-cols-[180px_1fr]">
          <Field label="日付">
            <Input type="date" value={form.date} onChange={(event) => update("date", event.target.value)} />
          </Field>
          <Field label="タイトル">
            <Input value={form.title} onChange={(event) => update("title", event.target.value)} placeholder="今日の題名" />
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
            className="min-h-56 text-base leading-8"
            placeholder="今日の出来事や感じたこと"
          />
        </Field>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4 shadow-soft">
          <h2 className="mb-3 font-semibold">ごはん</h2>
          <div className="grid gap-3">
            <Field label="朝">
              <Input value={form.breakfast} onChange={(event) => update("breakfast", event.target.value)} />
            </Field>
            <Field label="昼">
              <Input value={form.lunch} onChange={(event) => update("lunch", event.target.value)} />
            </Field>
            <Field label="夜">
              <Input value={form.dinner} onChange={(event) => update("dinner", event.target.value)} />
            </Field>
          </div>
        </div>

        <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4 shadow-soft">
          <h2 className="mb-3 font-semibold">からだ</h2>
          <div className="grid gap-3">
            <Field label="起床時間">
              <Input type="time" value={form.wake_time} onChange={(event) => update("wake_time", event.target.value)} />
            </Field>
            <Field label="就寝時間">
              <Input type="time" value={form.bedtime} onChange={(event) => update("bedtime", event.target.value)} />
            </Field>
            <Field label="体重">
              <Input type="number" step="0.1" min="0" value={form.body_weight} onChange={(event) => update("body_weight", event.target.value)} />
            </Field>
            <p className="rounded-lg bg-[var(--surface-muted)] px-3 py-2 text-sm text-neutral-600 dark:text-neutral-300">
              睡眠時間 {sleepHours ? `${sleepHours}時間` : "-"}
            </p>
          </div>
        </div>

        <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4 shadow-soft">
          <h2 className="mb-3 font-semibold">充実度</h2>
          <Field label="ABC">
            <Select value={form.fulfillment_level} onChange={(event) => update("fulfillment_level", event.target.value)}>
              {fulfillmentOptions.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </Field>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <MemoArea label="気になったニュース" value={form.news_note} onChange={(value) => update("news_note", value)} />
        <MemoArea label="明日のTO DO" value={form.tomorrow_todo} onChange={(value) => update("tomorrow_todo", value)} />
        <MemoArea label="メモ" value={form.memo} onChange={(value) => update("memo", value)} />
        <section className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4 shadow-soft">
          <div className="mb-2 flex items-center gap-2 font-semibold">
            <ImagePlus size={18} />
            写真添付
          </div>
          <Field label="画像">
            <Input type="file" accept="image/*" onChange={(event) => loadPhoto(event.target.files?.[0])} />
          </Field>
          {form.photo_note.startsWith("data:image/") ? (
            <img src={form.photo_note} alt="" className="mt-3 max-h-56 w-full rounded-lg object-cover" />
          ) : null}
          <Button type="button" variant="secondary" className="mt-3" onClick={() => update("photo_note", "")} disabled={!form.photo_note}>
            写真を削除
          </Button>
        </section>
      </section>
    </form>
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
