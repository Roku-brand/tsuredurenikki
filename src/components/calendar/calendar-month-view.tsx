"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
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

function monthTitle(month: string) {
  const [year, monthIndex] = month.split("-");
  return `${year}年 ${Number(monthIndex)}月`;
}

function weekdayTone(index: number) {
  if (index % 7 === 0) return "text-[#ff4b4b]";
  if (index % 7 === 6) return "text-[#3867ff]";
  return "text-[#24393c]";
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
  const [isPending, startTransition] = useTransition();
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const [turning, setTurning] = useState<"next" | "prev" | null>(null);
  const targetRef = useRef<string | null>(null);
  const today = toDateInputValue();
  const byDate = new Map(entries.map((entry) => [entry.date, entry]));

  useEffect(() => {
    setTurning(null);
    targetRef.current = null;
  }, [month]);

  function turnMonth(direction: "next" | "prev") {
    if (turning || isPending) return;
    const target = addMonths(month, direction === "next" ? 1 : -1);
    targetRef.current = target;
    setTurning(direction);
    startTransition(() => {
      router.push(`/app/calendar?month=${target}`);
    });
    router.prefetch(`/app/calendar?month=${addMonths(target, direction === "next" ? 1 : -1)}`);
    window.setTimeout(() => {
      if (targetRef.current === target) setTurning(null);
    }, 260);
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
      className="flex h-full min-h-0 touch-pan-x flex-col gap-2 overflow-hidden text-[#002b2f]"
      onTouchStart={(event) => {
        touchStartX.current = event.touches[0].clientX;
        touchStartY.current = event.touches[0].clientY;
      }}
      onTouchEnd={onTouchEnd}
    >
      <header className="relative grid h-14 shrink-0 place-items-center rounded-full bg-white/95 shadow-[0_10px_28px_rgba(16,24,40,0.10)]">
        <Link
          href={`/app/calendar?month=${addMonths(month, -1)}`}
          aria-label="前月"
          className="focus-ring absolute left-3 grid size-9 place-items-center rounded-full bg-white text-[#1d6c66] shadow-[0_2px_10px_rgba(16,24,40,0.12)]"
        >
            <ChevronLeft size={16} />
        </Link>
        <h1 className="text-[21px] font-semibold">{monthTitle(month)}</h1>
        <Link
          href={`/app/calendar?month=${addMonths(month, 1)}`}
          aria-label="翌月"
          className="focus-ring absolute right-3 grid size-9 place-items-center rounded-full bg-white text-[#1d6c66] shadow-[0_2px_10px_rgba(16,24,40,0.12)]"
        >
            <ChevronRight size={16} />
        </Link>
      </header>

      <div className="grid shrink-0 grid-cols-7 px-px text-center text-sm">
        {weekdays.map((weekday, index) => (
          <div key={weekday} className={["py-1.5", weekdayTone(index)].join(" ")}>
            {weekday}
          </div>
        ))}
      </div>

      <section
        className={[
          "calendar-page grid min-h-0 flex-1 overflow-hidden rounded-[18px] border border-[#d7e1e8] bg-[#d7e1e8]",
          turning === "next" ? "calendar-page-next" : "",
          turning === "prev" ? "calendar-page-prev" : ""
        ].join(" ")}
      >
        <div className="grid min-h-0 grid-cols-7 grid-rows-6 gap-px overflow-hidden">
          {days.map((day, index) => {
            const entry = byDate.get(day.date);
            const fulfillment = fulfillmentLabel(entry?.fulfillment_level ?? null);
            const isToday = day.date === today;
            return (
              <Link
                key={day.date}
                href={`/app/today?date=${day.date}`}
                className={[
                  "focus-ring relative flex min-h-0 flex-col bg-[#fbfdfb] px-1 py-1.5 transition hover:bg-[#eef7f2] sm:p-2",
                  !day.inMonth ? "text-[#b9c6c7]" : weekdayTone(index),
                  isToday ? "z-10 ring-2 ring-inset ring-[#2f8c7a]" : ""
                ].join(" ")}
                aria-label={`${formatJapaneseDate(day.date)}の記録を開く`}
              >
                <span
                  className={[
                    "absolute right-1 top-0.5 text-[11px] font-medium leading-none sm:right-1.5 sm:top-1 sm:text-sm",
                    isToday ? "text-[#002b2f]" : ""
                  ].join(" ")}
                >
                  {Number(day.date.slice(8))}
                </span>
                {entry ? (
                  <p className="calendar-entry-title mx-auto mb-auto mt-[18px] max-w-[4.4em] text-center text-[11px] font-medium leading-[1.18] text-[#00383c] sm:mt-6 sm:max-w-[7.5em] sm:text-sm sm:leading-[1.25]">
                    {(entry.title || "無題").slice(0, 12)}
                  </p>
                ) : null}
                {fulfillment ? (
                  <span className="absolute bottom-1 right-1 rounded-[4px] bg-[#52cfa5]/80 px-1 text-[9px] font-semibold leading-3 text-[#00383c] sm:bottom-1.5 sm:right-1.5 sm:text-[10px]">
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
