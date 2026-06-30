"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Bed,
  CheckCircle2,
  ChevronRight,
  Clock3,
  FileText,
  Image as ImageIcon,
  Moon,
  Pencil,
  Plus,
  Save,
  Scale,
  Sun,
  Trash2,
  X
} from "lucide-react";
import { deleteDiaryEntryAction, upsertDiaryEntryAction } from "@/server/actions/diary";
import type { DiaryEntry } from "@/types/database";

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
  ["", "未入力"],
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

function sleepText(hours: string) {
  if (!hours) return "未入力";
  const totalMinutes = Math.round(Number(hours) * 60);
  const hour = Math.floor(totalMinutes / 60);
  const minute = totalMinutes % 60;
  return minute ? `${hour}h${String(minute).padStart(2, "0")}m` : `${hour}h`;
}

function dateLabel(value: string) {
  const date = new Date(`${value}T00:00:00`);
  const weekday = new Intl.DateTimeFormat("ja-JP", { weekday: "short" }).format(date);
  return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}（${weekday}）`;
}

function lineCount(value: string) {
  return value
    .split(/\r?\n/)
    .map((line) => line.replace(/^[-・•]\s*/, "").trim())
    .filter(Boolean).length;
}

function todoItems(value: string) {
  const items = value.split(/\r?\n/).map((line) => line.replace(/^[-・•]\s*/, "").trim());
  return items.length ? items : [""];
}

function formatWeightInput(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (trimmed.includes(".")) {
    const [integerPart, decimalPart = ""] = trimmed.replace(/[^\d.]/g, "").split(".");
    return decimalPart ? `${integerPart}.${decimalPart.slice(0, 1)}` : integerPart;
  }
  const digits = trimmed.replace(/\D/g, "");
  if (digits.length >= 3) return `${digits.slice(0, -1)}.${digits.slice(-1)}`;
  return digits;
}

function finalizeWeightInput(value: string) {
  const formatted = formatWeightInput(value);
  if (!formatted) return "";
  const number = Number(formatted);
  return Number.isFinite(number) ? number.toFixed(1) : "";
}

export function DiaryEditor({
  initialDate,
  entry
}: {
  initialDate: string;
  entry: DiaryEntry | null;
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

  const sleepHours = calculateSleepHours(form.wake_time, form.bedtime);
  const saveText = status === "saving" ? "保存中" : "保存";

  return (
    <form action={() => startTransition(() => void save())} className="grid w-full min-w-0 gap-4 overflow-x-hidden text-[#202124]">
      <header className="flex min-w-0 items-center justify-between gap-3">
        <div className="flex min-w-0 flex-col sm:flex-row sm:items-baseline sm:gap-4">
          <h1 className="text-[34px] font-semibold tracking-normal">記帳</h1>
          <time className="truncate text-[17px] font-medium text-[#30343b] sm:text-[19px]">{dateLabel(form.date)}</time>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={deleteEntry}
            disabled={isPending || !entry?.id}
            aria-label="削除"
            className="focus-ring grid h-14 w-12 place-items-center rounded-[12px] border border-[#ded2c8] bg-white text-[#4b4b4b] disabled:opacity-40"
          >
            <Trash2 size={21} />
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="focus-ring flex h-14 items-center gap-2 rounded-[12px] bg-[#2f638f] px-4 text-[18px] font-semibold text-white shadow-[0_10px_24px_rgba(47,99,143,0.24)] sm:px-5 sm:text-[19px]"
          >
            <Save size={22} />
            {saveText}
          </button>
        </div>
      </header>

      <input
        type="text"
        value={form.title}
        onChange={(event) => update("title", event.target.value)}
        placeholder="今日の題名"
        className="focus-ring h-[62px] rounded-[13px] border border-[#ded2c8] bg-white px-4 text-[22px] outline-none placeholder:text-[#8b8b8b]"
      />

      <section className="rounded-[13px] border border-[#ded2c8] bg-white p-4">
        <h2 className="mb-4 text-[22px] font-semibold">本文</h2>
        <textarea
          value={form.body}
          onChange={(event) => update("body", event.target.value)}
          placeholder="今日の出来事や感じたこと"
          className="focus-ring min-h-[220px] w-full resize-y rounded-[11px] border border-[#ded2c8] bg-white px-4 py-4 text-[19px] leading-8 outline-none placeholder:text-[#8b8b8b]"
        />
      </section>

      <section className="rounded-[13px] border border-[#ded2c8] bg-white p-4">
        <h2 className="mb-4 text-[22px] font-semibold">ごはん</h2>
        <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-3">
          <MealField icon={<Sun size={24} />} label="朝" value={form.breakfast} placeholder="未入力" onChange={(value) => update("breakfast", value)} />
          <MealField icon={<Sun size={24} />} label="昼" value={form.lunch} placeholder="未入力" onChange={(value) => update("lunch", value)} />
          <MealField icon={<Moon size={24} />} label="夜" value={form.dinner} placeholder="未入力" onChange={(value) => update("dinner", value)} />
        </div>
      </section>

      <section className="rounded-[13px] border border-[#ded2c8] bg-white p-4">
        <h2 className="mb-4 text-[22px] font-semibold">からだ</h2>
        <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2">
          <MetricField icon={<Clock3 size={23} />} label="起床" value={form.wake_time} type="time" onChange={(value) => update("wake_time", value)} />
          <MetricField icon={<Bed size={23} />} label="就寝" value={form.bedtime} type="time" onChange={(value) => update("bedtime", value)} />
          <ReadOnlyMetric icon={<Moon size={23} />} label="睡眠" value={sleepText(sleepHours)} subLabel="自動計算" />
          <WeightField
            icon={<Scale size={23} />}
            label="体重"
            value={form.body_weight}
            onChange={(value) => update("body_weight", value)}
          />
        </div>

        <h2 className="mb-3 mt-5 text-[22px] font-semibold">充実度</h2>
        <div className="grid h-[50px] min-w-0 grid-cols-4 rounded-[12px] bg-[#f1f1f1] p-1">
          {fulfillmentOptions.map(([value, label]) => {
            const active = form.fulfillment_level === value;
            return (
              <button
                key={value}
                type="button"
                onClick={() => update("fulfillment_level", value)}
                className={[
                  "focus-ring rounded-[10px] text-[16px] font-semibold transition sm:text-[21px]",
                  active ? "bg-[#2f638f] text-white shadow-[0_8px_16px_rgba(47,99,143,0.22)]" : "text-[#5c5c5c]"
                ].join(" ")}
              >
                {label}
              </button>
            );
          })}
        </div>
      </section>

      <section className="overflow-hidden rounded-[13px] border border-[#ded2c8] bg-white">
        <DetailRow
          icon={<FileText size={24} />}
          label="気になったニュース"
          status={form.news_note ? "あり" : "未入力"}
          value={form.news_note}
          onChange={(value) => update("news_note", value)}
        />
        <TodoRow
          icon={<CheckCircle2 size={24} />}
          label="明日のTO DO"
          status={form.tomorrow_todo ? `${lineCount(form.tomorrow_todo)}件` : "未入力"}
          value={form.tomorrow_todo}
          onChange={(value) => update("tomorrow_todo", value)}
        />
        <DetailRow
          icon={<Pencil size={24} />}
          label="メモ"
          status={form.memo ? "あり" : "未入力"}
          value={form.memo}
          onChange={(value) => update("memo", value)}
        />
        <PhotoRow value={form.photo_note} onChange={(value) => update("photo_note", value)} onFile={loadPhoto} />
      </section>

      {message ? (
        <p className="rounded-[12px] bg-[#eef4f2] px-4 py-3 text-sm text-neutral-700">{message}</p>
      ) : null}
    </form>
  );
}

function MealField({
  icon,
  label,
  value,
  placeholder,
  onChange
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="grid min-h-[78px] min-w-0 grid-cols-[30px_1fr] gap-x-2 rounded-[10px] border border-[#ded2c8] px-3 py-3">
      <span className="row-span-2 shrink-0 text-[#202124]">{icon}</span>
      <span className="text-[15px] font-semibold">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="min-w-0 bg-transparent text-[19px] font-semibold outline-none placeholder:font-medium placeholder:text-[#8b8b8b]"
      />
    </label>
  );
}

function MetricField({
  icon,
  label,
  value,
  type,
  suffix,
  onChange
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  type: "time" | "number";
  suffix?: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="grid min-h-[96px] min-w-0 grid-cols-[32px_1fr_auto] items-center rounded-[10px] border border-[#ded2c8] px-4 py-3">
      <span className="row-span-2 text-[#202124]">{icon}</span>
      <span className="text-[16px] font-semibold">{label}</span>
      <button
        type="button"
        onClick={(event) => {
          event.preventDefault();
          onChange("");
        }}
        className="focus-ring row-span-2 ml-2 rounded-full px-2 py-1 text-xs font-semibold text-[#777]"
      >
        未入力
      </button>
      <span className="flex items-baseline gap-1">
        <input
          type={type}
          step={type === "number" ? "0.1" : undefined}
          min={type === "number" ? "0" : undefined}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="未入力"
          aria-label={label}
          className="min-w-0 flex-1 bg-transparent text-[21px] font-semibold outline-none"
        />
        {suffix && value ? <span className="text-[21px] font-semibold">{suffix}</span> : null}
      </span>
    </div>
  );
}

function WeightField({
  icon,
  label,
  value,
  onChange
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="grid min-h-[96px] min-w-0 grid-cols-[32px_1fr] rounded-[10px] border border-[#ded2c8] px-4 py-3">
      <span className="row-span-2 pt-3 text-[#202124]">{icon}</span>
      <div className="flex min-w-0 items-center justify-between gap-2">
        <span className="text-[16px] font-semibold">{label}</span>
        <button
          type="button"
          onClick={() => onChange("")}
          className="focus-ring shrink-0 rounded-full px-2 py-1 text-xs font-semibold text-[#777]"
        >
          未入力
        </button>
      </div>
      <div className="flex min-w-0 items-baseline gap-1">
        <input
          type="text"
          inputMode="numeric"
          value={value}
          onChange={(event) => onChange(formatWeightInput(event.target.value))}
          onBlur={(event) => onChange(finalizeWeightInput(event.target.value))}
          placeholder="56.8"
          aria-label={label}
          className="min-w-0 flex-1 bg-transparent text-[21px] font-semibold outline-none placeholder:text-[#8b8b8b]"
        />
        <span className="shrink-0 text-[18px] font-semibold text-[#555]">kg</span>
      </div>
    </div>
  );
}

function ReadOnlyMetric({
  icon,
  label,
  value,
  subLabel
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  subLabel: string;
}) {
  return (
    <div className="grid min-h-[86px] grid-cols-[32px_1fr] items-center rounded-[10px] border border-[#ded2c8] px-4 py-3">
      <span className="row-span-3 text-[#202124]">{icon}</span>
      <span className="text-[16px] font-semibold">{label}</span>
      <span className="text-[21px] font-semibold">{value}</span>
      <span className="text-[14px] text-[#8b8b8b]">{subLabel}</span>
    </div>
  );
}

function DetailRow({
  icon,
  label,
  status,
  value,
  onChange
}: {
  icon: React.ReactNode;
  label: string;
  status: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <details className="group border-b border-[#ebe3dc] last:border-b-0">
      <summary className="flex min-h-[72px] cursor-pointer list-none items-center gap-4 px-5 [&::-webkit-details-marker]:hidden">
        <span className="shrink-0 text-[#202124]">{icon}</span>
        <span className="min-w-0 flex-1 truncate text-[19px] font-semibold">{label}</span>
        <span className="shrink-0 text-[18px] text-[#777]">{status}</span>
        <ChevronRight size={22} className="shrink-0 text-[#777] transition group-open:rotate-90" />
      </summary>
      <div className="px-5 pb-4">
        <textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="focus-ring min-h-[96px] w-full resize-none rounded-[10px] border border-[#ded2c8] px-3 py-2 text-base outline-none"
        />
      </div>
    </details>
  );
}

function TodoRow({
  icon,
  label,
  status,
  value,
  onChange
}: {
  icon: React.ReactNode;
  label: string;
  status: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const items = todoItems(value);

  function commit(nextItems: string[]) {
    onChange(nextItems.join("\n"));
  }

  return (
    <details className="group border-b border-[#ebe3dc] last:border-b-0">
      <summary className="flex min-h-[72px] cursor-pointer list-none items-center gap-4 px-5 [&::-webkit-details-marker]:hidden">
        <span className="shrink-0 text-[#202124]">{icon}</span>
        <span className="min-w-0 flex-1 truncate text-[19px] font-semibold">{label}</span>
        <span className="shrink-0 text-[18px] text-[#777]">{status}</span>
        <ChevronRight size={22} className="shrink-0 text-[#777] transition group-open:rotate-90" />
      </summary>
      <div className="grid gap-2 px-5 pb-4">
        {items.map((item, index) => (
          <div key={index} className="grid grid-cols-[18px_1fr_32px] items-center gap-2">
            <span className="text-xl leading-none text-[#2f638f]">•</span>
            <input
              value={item}
              onChange={(event) => {
                const nextItems = [...items];
                nextItems[index] = event.target.value;
                commit(nextItems);
              }}
              placeholder="やること"
              className="focus-ring h-11 min-w-0 rounded-[10px] border border-[#ded2c8] px-3 outline-none"
            />
            <button
              type="button"
              onClick={() => commit(items.filter((_, itemIndex) => itemIndex !== index))}
              className="focus-ring grid size-8 place-items-center rounded-full text-[#777]"
              aria-label="TO DOを削除"
            >
              <X size={17} />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => commit([...items, ""])}
          className="focus-ring mt-1 flex h-10 items-center justify-center gap-2 rounded-[10px] border border-[#ded2c8] text-sm font-semibold"
        >
          <Plus size={17} />
          追加
        </button>
      </div>
    </details>
  );
}

function PhotoRow({
  value,
  onChange,
  onFile
}: {
  value: string;
  onChange: (value: string) => void;
  onFile: (file: File | undefined) => void;
}) {
  return (
    <details className="group">
      <summary className="flex min-h-[72px] cursor-pointer list-none items-center gap-4 px-5 [&::-webkit-details-marker]:hidden">
        <ImageIcon size={24} className="shrink-0" />
        <span className="min-w-0 flex-1 truncate text-[19px] font-semibold">写真</span>
        <span className="shrink-0 text-[18px] text-[#777]">{value ? "1枚" : "未入力"}</span>
        <ChevronRight size={22} className="shrink-0 text-[#777] transition group-open:rotate-90" />
      </summary>
      <div className="grid gap-3 px-5 pb-4">
        <input
          type="file"
          accept="image/*"
          onChange={(event) => onFile(event.target.files?.[0])}
          className="focus-ring w-full rounded-[10px] border border-[#ded2c8] px-3 py-2 text-sm"
        />
        {value.startsWith("data:image/") ? <img src={value} alt="" className="max-h-56 w-full rounded-[10px] object-cover" /> : null}
        <button
          type="button"
          onClick={() => onChange("")}
          disabled={!value}
          className="focus-ring h-10 rounded-[10px] border border-[#ded2c8] text-sm font-semibold disabled:opacity-45"
        >
          写真を削除
        </button>
      </div>
    </details>
  );
}
