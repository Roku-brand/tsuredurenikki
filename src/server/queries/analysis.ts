import { createClient } from "@/lib/supabase/server";

export type AnalysisPeriod = "7d" | "30d" | "month" | "90d" | "year" | "all";

type AnalysisEntry = {
  id: string;
  date: string;
  sleep_hours: number | null;
  body_weight: number | null;
  fulfillment_level: number | null;
};

const ANALYSIS_ENTRY_COLUMNS = "id,date,sleep_hours,body_weight,fulfillment_level";

function getStartDate(period: AnalysisPeriod) {
  const today = new Date();
  const date = new Date(today);
  if (period === "7d") date.setDate(today.getDate() - 6);
  if (period === "30d") date.setDate(today.getDate() - 29);
  if (period === "90d") date.setDate(today.getDate() - 89);
  if (period === "month") return new Date(today.getFullYear(), today.getMonth(), 1);
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

  let query = supabase
    .from("diary_entries")
    .select(ANALYSIS_ENTRY_COLUMNS)
    .eq("user_id", userId)
    .is("deleted_at", null)
    .order("date", { ascending: true });

  if (start) query = query.gte("date", isoDate(start));

  const { data } = await query;
  const entries = (data ?? []) as AnalysisEntry[];
  const fulfillmentCounts = {
    A: entries.filter((entry) => entry.fulfillment_level === 5).length,
    B: entries.filter((entry) => entry.fulfillment_level === 3).length,
    C: entries.filter((entry) => entry.fulfillment_level === 1).length
  };

  return {
    entries,
    sleepTrend: entries.map((entry) => ({ date: entry.date, value: entry.sleep_hours })),
    weightTrend: entries.map((entry) => ({ date: entry.date, value: entry.body_weight })),
    fulfillmentCounts
  };
}
