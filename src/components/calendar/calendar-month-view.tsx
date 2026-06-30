"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { addMonths, formatJapaneseDate, toDateInputValue } from "@/lib/utils/date";
import type { DiaryEntry } from "@/types/database";

type CalendarDay = {
  date: string;
  inMonth: boolean;
};

const weekdays = ["日", "月", "火", "水", "木", "金", "土"];

function fulfillmentLabel(value: number | null) {
  if (value === 5) return "A";
  if (value === 3) return "B";
  if (value === 1) return "C";
  return "";
}

export function CalendarMonthView({
  month,
  entries,
  days
}: {
  month: string;
  entries: DiaryEntry[];
  days: CalendarDay[];
}) {
  const router = useRouter();
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const [turning, setTurning] = useState<"next" | "prev" | null>(null);
  const today = toDateInputValue();
  const byDate = new Map(entries.map((entry) => [entry.date, entry]));

  function turnMonth(direction: "next" | "prev") {
    if (turning) return;
    const target = addMonths(month, direction === "next" ? 1 : -1);
    setTurning(direction);
    window.setTimeout(() => {
      router.push(`/app/calendar?month=${target}`);
      router.prefetch(`/app/calendar?month=${addMonths(target, direction === "next" ? 1 : -1)}`);
    }, 150);
  }

  function onTouchEnd(event: React.TouchEvent<HTMLDivElement>) {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const touch = event.changedTouches[0];
    const deltaX = touch.clientX - touchStartX.current;
    const deltaY = touch.clientY - touchStartY.current;
    touchStartX.current = null;
    touchStartY.current = null;
    if (Math.abs(deltaX) < 55 || Math.abs(deltaX) < Math.abs(deltaY) * 1.25) return;
    turnMonth(deltaX < 0 ? "next" : "prev");
  }

  return (
    <div
      className="flex h-full min-h-0 touch-pan-x flex-col gap-3 overflow-hidden"
      onTouchStart={(event) => {
        touchStartX.current = event.touches[0].clientX;
        touchStartY.current = event.touches[0].clientY;
      }}
      onTouchEnd={onTouchEnd}
    >
      <header className="flex shrink-0 items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold sm:text-2xl">{month.replace("-", "年")}月</h1>
          <p className="text-sm text-neutral-500">{entries.length}日分の記録</p>
        </div>
        <div className="flex gap-2">
          <ButtonLink href={`/app/calendar?month=${addMonths(month, -1)}`} variant="secondary" aria-label="前月">
            <ChevronLeft size={16} />
          </ButtonLink>
          <ButtonLink href="/app/calendar" variant="secondary">
            今月
          </ButtonLink>
          <ButtonLink href={`/app/calendar?month=${addMonths(month, 1)}`} variant="secondary" aria-label="翌月">
            <ChevronRight size={16} />
          </ButtonLink>
        </div>
      </header>

      <section
        className={[
          "calendar-page grid min-h-0 flex-1 grid-rows-[auto_1fr] overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--surface)] shadow-soft",
          turning === "next" ? "calendar-page-next" : "",
          turning === "prev" ? "calendar-page-prev" : ""
        ].join(" ")}
      >
        <div className="grid grid-cols-7 border-b border-[var(--border)] text-center text-xs font-medium text-neutral-500">
          {weekdays.map((weekday) => (
            <div key={weekday} className="py-2">
              {weekday}
            </div>
          ))}
        </div>
        <div className="grid min-h-0 grid-cols-7 grid-rows-6 gap-px overflow-hidden bg-[var(--border)]">
          {days.map((day) => {
            const entry = byDate.get(day.date);
            const fulfillment = fulfillmentLabel(entry?.fulfillment_level ?? null);
            const isToday = day.date === today;
            return (
              <Link
                key={day.date}
                href={`/app/today?date=${day.date}`}
                className={[
                  "focus-ring relative flex min-h-0 flex-col bg-[var(--surface)] p-2 transition hover:bg-mist/70",
                  !day.inMonth ? "text-neutral-400 opacity-60" : "",
                  isToday ? "ring-2 ring-inset ring-lake" : ""
                ].join(" ")}
                aria-label={`${formatJapaneseDate(day.date)}の記録を開く`}
              >
                <span
                  className={[
                    "grid size-7 place-items-center rounded-full text-sm font-semibold",
                    isToday ? "bg-lake text-white" : ""
                  ].join(" ")}
                >
                  {Number(day.date.slice(8))}
                </span>
                {entry ? <p className="mt-1 line-clamp-2 text-xs font-medium leading-5">{entry.title || "無題"}</p> : null}
                {fulfillment ? (
                  <span className="absolute bottom-2 right-2 grid size-7 place-items-center rounded-full bg-moss text-xs font-semibold text-white">
                    {fulfillment}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
