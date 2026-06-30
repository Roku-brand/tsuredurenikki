import { createClient } from "@/lib/supabase/server";
import { getMonthBounds, toDateInputValue } from "@/lib/utils/date";
import type { DiaryEntry, Tag } from "@/types/database";
import type { SearchFilters } from "@/types/forms";

const CALENDAR_ENTRY_COLUMNS = "id,user_id,date,title,fulfillment_level,created_at,updated_at";
const RECENT_ENTRY_COLUMNS = "id,user_id,date,title,created_at,updated_at";
const SEARCH_ENTRY_COLUMNS = "id,user_id,date,title,body,news_note,tomorrow_todo,memo,created_at,updated_at";

export async function getEntryByDate(userId: string, date: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("diary_entries")
    .select("*")
    .eq("user_id", userId)
    .eq("date", date)
    .is("deleted_at", null)
    .maybeSingle();

  return (data as DiaryEntry | null) ?? null;
}

export async function getTodayEntry(userId: string) {
  return getEntryByDate(userId, toDateInputValue());
}

export async function getEntriesForMonth(userId: string, month: string) {
  const supabase = await createClient();
  const { start, end } = getMonthBounds(month);
  const { data } = await supabase
    .from("diary_entries")
    .select(CALENDAR_ENTRY_COLUMNS)
    .eq("user_id", userId)
    .gte("date", start)
    .lte("date", end)
    .is("deleted_at", null)
    .order("date", { ascending: true });

  return (data ?? []) as DiaryEntry[];
}

export async function getRecentEntries(userId: string, limit = 12) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("diary_entries")
    .select(RECENT_ENTRY_COLUMNS)
    .eq("user_id", userId)
    .is("deleted_at", null)
    .order("date", { ascending: false })
    .limit(limit);

  return (data ?? []) as DiaryEntry[];
}

export async function getAllTags(userId: string) {
  const supabase = await createClient();
  const { data } = await supabase.from("tags").select("*").eq("user_id", userId).order("name");
  return (data ?? []) as Tag[];
}

export async function getSavedSearches(userId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("saved_searches")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(12);
  return data ?? [];
}

export async function searchDiaryEntries(userId: string, filters: SearchFilters) {
  const supabase = await createClient();
  let allowedEntryIds: string[] | null = null;

  if (filters.tags?.length) {
    const { data: tagRows } = await supabase
      .from("tags")
      .select("id")
      .eq("user_id", userId)
      .in("name", filters.tags);
    const tagIds = (tagRows ?? []).map((tag) => tag.id);
    if (!tagIds.length) return [];

    const { data: links } = await supabase
      .from("diary_entry_tags")
      .select("diary_entry_id")
      .in("tag_id", tagIds);
    allowedEntryIds = [...new Set((links ?? []).map((link) => link.diary_entry_id))];
    if (!allowedEntryIds.length) return [];
  }

  let query = supabase
    .from("diary_entries")
    .select(SEARCH_ENTRY_COLUMNS)
    .eq("user_id", userId)
    .is("deleted_at", null)
    .order("date", { ascending: false })
    .limit(50);

  if (filters.from) query = query.gte("date", filters.from);
  if (filters.to) query = query.lte("date", filters.to);
  if (filters.mood?.length) query = query.in("mood", filters.mood);
  if (filters.stressLevel?.length) query = query.in("stress_level", filters.stressLevel);
  if (typeof filters.sleepHoursMin === "number") query = query.gte("sleep_hours", filters.sleepHoursMin);
  if (typeof filters.sleepHoursMax === "number") query = query.lte("sleep_hours", filters.sleepHoursMax);

  const keyword = filters.keyword?.trim();
  if (keyword) {
    const escaped = keyword.replaceAll("%", "\\%").replaceAll("_", "\\_");
    query = query.or(
      [
        `title.ilike.%${escaped}%`,
        `body.ilike.%${escaped}%`,
        `memo.ilike.%${escaped}%`,
        `news_note.ilike.%${escaped}%`,
        `tomorrow_todo.ilike.%${escaped}%`
      ].join(",")
    );
  }

  if (filters.hasMealLog) {
    query = query.or("breakfast.not.is.null,lunch.not.is.null,dinner.not.is.null,meal_note.not.is.null");
  }

  if (allowedEntryIds) query = query.in("id", allowedEntryIds);

  const { data } = await query;
  return (data ?? []) as DiaryEntry[];
}
