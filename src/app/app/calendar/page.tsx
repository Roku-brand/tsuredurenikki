import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Circle } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { Panel, SectionHeader } from "@/components/ui/card";
import { addMonths, daysInCalendarMonth, formatJapaneseDate, monthKey } from "@/lib/utils/date";
import { getEntriesForMonth } from "@/server/queries/diary";
import { requireUser } from "@/server/queries/user";

export const metadata: Metadata = {
  title: "カレンダー"
};

const weekdays = ["日", "月", "火", "水", "木", "金", "土"];

export default async function CalendarPage({
  searchParams
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const params = await searchParams;
  const month = params.month && /^\d{4}-\d{2}$/.test(params.month) ? params.month : monthKey();
  const user = await requireUser();
  const entries = await getEntriesForMonth(user.id, month);
  const byDate = new Map(entries.map((entry) => [entry.date, entry]));
  const days = daysInCalendarMonth(month);

  return (
    <div className="grid gap-6">
      <SectionHeader
        title="カレンダー"
        description="日記の有無とその日の見出しを、月ごとに確認できます。"
        action={
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
        }
      />

      <Panel>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">{month.replace("-", "年")}月</h2>
          <p className="text-sm text-neutral-500">{entries.length}日分の記録</p>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-neutral-500">
          {weekdays.map((weekday) => (
            <div key={weekday} className="py-2">
              {weekday}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {days.map((day) => {
            const entry = byDate.get(day.date);
            return (
              <Link
                key={day.date}
                href={`/app/today?date=${day.date}`}
                className={`focus-ring min-h-24 rounded-lg border border-[var(--border)] p-2 text-left transition hover:border-lake hover:bg-mist/70 ${
                  day.inMonth ? "bg-[var(--surface)]" : "bg-neutral-50 text-neutral-400 dark:bg-white/5"
                }`}
                aria-label={`${formatJapaneseDate(day.date)}の日記を開く`}
              >
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm font-semibold">{Number(day.date.slice(8))}</span>
                  {entry ? <Circle className="fill-moss text-moss" size={10} /> : null}
                </div>
                {entry ? (
                  <>
                    <p className="line-clamp-2 text-xs font-medium leading-5">{entry.title || "無題"}</p>
                    {entry.mood ? <p className="mt-1 text-[11px] text-neutral-500">気分 {entry.mood}/5</p> : null}
                  </>
                ) : (
                  <p className="text-xs text-neutral-400">未記録</p>
                )}
              </Link>
            );
          })}
        </div>
      </Panel>
    </div>
  );
}
