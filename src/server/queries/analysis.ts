import { createClient } from "@/lib/supabase/server";
import type { Tag } from "@/types/database";

export type AnalysisPeriod = "7d" | "30d" | "month" | "last-month" | "90d" | "year" | "all";

type AnalysisEntry = {
  id: string;
  date: string;
  word_count: number | null;
  breakfast: string | null;
  lunch: string | null;
  dinner: string | null;
  meal_note: string | null;
  mood: number | null;
  sleep_hours: number | null;
  good_things: string | null;
};

const ANALYSIS_ENTRY_COLUMNS =
  "id,date,word_count,breakfast,lunch,dinner,meal_note,mood,sleep_hours,good_things";

function getStartDate(period: AnalysisPeriod) {
  const today = new Date();
  const date = new Date(today);
  if (period === "7d") date.setDate(today.getDate() - 6);
  if (period === "30d") date.setDate(today.getDate() - 29);
  if (period === "90d") date.setDate(today.getDate() - 89);
  if (period === "month") return new Date(today.getFullYear(), today.getMonth(), 1);
  if (period === "last-month") return new Date(today.getFullYear(), today.getMonth() - 1, 1);
  if (period === "year") return new Date(today.getFullYear(), 0, 1);
  if (period === "all") return null;
  return date;
}

function isoDate(date: Date) {
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 10);
}

export async function getAnalysis(userId: string, period: AnalysisPeriod) {
  const supabase = await createClient();
  const start = getStartDate(period);
  const lastMonthEnd =
    period === "last-month" ? new Date(new Date().getFullYear(), new Date().getMonth(), 0) : null;

  let query = supabase
    .from("diary_entries")
    .select(ANALYSIS_ENTRY_COLUMNS)
    .eq("user_id", userId)
    .is("deleted_at", null)
    .order("date", { ascending: true });

  if (start) query = query.gte("date", isoDate(start));
  if (lastMonthEnd) query = query.lte("date", isoDate(lastMonthEnd));

  const { data: entriesData } = await query;
  const entries = (entriesData ?? []) as AnalysisEntry[];
  const entryIds = entries.map((entry) => entry.id);

  const { data: tagRows } = entryIds.length
    ? await supabase
        .from("diary_entry_tags")
        .select("diary_entry_id, tags(id,user_id,name,color,created_at,updated_at)")
        .in("diary_entry_id", entryIds)
    : { data: [] };

  const tagCounts = new Map<string, { tag: Tag; count: number }>();
  for (const row of (tagRows ?? []) as Array<{ tags: Tag | Tag[] | null }>) {
    const tag = Array.isArray(row.tags) ? row.tags[0] : row.tags;
    if (!tag) continue;
    const current = tagCounts.get(tag.id);
    tagCounts.set(tag.id, { tag, count: (current?.count ?? 0) + 1 });
  }

  const totalWords = entries.reduce((sum, entry) => sum + (entry.word_count ?? 0), 0);
  const mealEntries = entries.filter((entry) => entry.breakfast || entry.lunch || entry.dinner || entry.meal_note).length;
  const moodValues = entries.filter((entry) => typeof entry.mood === "number").map((entry) => entry.mood as number);
  const sleepValues = entries
    .filter((entry) => typeof entry.sleep_hours === "number")
    .map((entry) => Number(entry.sleep_hours));

  const streak = calculateStreak(entries.map((entry) => entry.date));

  return {
    entries,
    summary: {
      totalDays: entries.length,
      streakDays: streak,
      averageWords: entries.length ? Math.round(totalWords / entries.length) : 0,
      averageMood: moodValues.length ? average(moodValues) : null,
      averageSleep: sleepValues.length ? average(sleepValues) : null,
      mealRate: entries.length ? Math.round((mealEntries / entries.length) * 100) : 0,
      goodThingCount: entries.filter((entry) => Boolean(entry.good_things)).length
    },
    tagRanking: Array.from(tagCounts.values()).sort((a, b) => b.count - a.count).slice(0, 10),
    moodTrend: entries.map((entry) => ({ date: entry.date, value: entry.mood })),
    sleepTrend: entries.map((entry) => ({ date: entry.date, value: entry.sleep_hours })),
    wordsTrend: entries.map((entry) => ({ date: entry.date, value: entry.word_count }))
  };
}

function average(values: number[]) {
  return Math.round((values.reduce((sum, value) => sum + value, 0) / values.length) * 10) / 10;
}

function calculateStreak(dates: string[]) {
  const set = new Set(dates);
  let cursor = new Date();
  let streak = 0;
  while (set.has(isoDate(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}
