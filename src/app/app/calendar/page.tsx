import type { Metadata } from "next";
import { CalendarMonthView } from "@/components/calendar/calendar-month-view";
import { daysInCalendarMonth, monthKey } from "@/lib/utils/date";
import { getEntriesForMonth } from "@/server/queries/diary";
import { requireUser } from "@/server/queries/user";

export const metadata: Metadata = {
  title: "カレンダー"
};

export default async function CalendarPage({
  searchParams
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const params = await searchParams;
  const month = params.month && /^\d{4}-\d{2}$/.test(params.month) ? params.month : monthKey();
  const user = await requireUser();
  const entries = await getEntriesForMonth(user.id, month);
  const days = daysInCalendarMonth(month);

  return <CalendarMonthView month={month} entries={entries} days={days} />;
}
