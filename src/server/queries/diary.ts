import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { getMonthBounds, toDateInputValue } from "@/lib/utils/date";
import type { Database, DiaryEntry, EntryWithTags, Tag } from "@/types/database";
import type { SearchFilters } from "@/types/forms";

type Client = SupabaseClient<Database>;

async function attachTags(supabase: Client, entries: DiaryEntry[]): Promise<EntryWithTags[]> {
  if (entries.length === 0) return [];
  const ids = entries.map((entry) => entry.id);
  const { data } = await supabase
    .from("diary_entry_tags")
    .select("diary_entry_id, tags(id,user_id,name,color,created_at,updated_at)")
    .in("diary_entry_id", ids);

  const byEntry = new Map<string, Tag[]>();
  for (const row of (data ?? []) as Array<{ diary_entry_id: string; tags: Tag | Tag[] | null }>) {
    const tag = Array.isArray(row.tags) ? row.tags[0] : row.tags;
    if (!tag) continue;
    byEntry.set(row.diary_entry_id, [...(byEntry.get(row.diary_entry_id) ?? []), tag]);
  }

  return entries.map((entry) => ({ ...entry, tags: byEntry.get(entry.id) ?? [] }));
}

export async function getEntryByDate(userId: string, date: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("diary_entries")
    .select("*")
    .eq("user_id", userId)
    .eq("date", date)
    .is("deleted_at", null)
    .maybeSingle();

  const entries = await attachTags(supabase, data ? [data as DiaryEntry] : []);
  return entries[0] ?? null;
}

export async function getTodayEntry(userId: string) {
  return getEntryByDate(userId, toDateInputValue());
}

export async function getEntriesForMonth(userId: string, month: string) {
  const supabase = await createClient();
  const { start, end } = getMonthBounds(month);
  const { data } = await supabase
    .from("diary_entries")
    .select("*")
    .eq("user_id", userId)
    .gte("date", start)
    .lte("date", end)
    .is("deleted_at", null)
    .order("date", { ascending: true });

  return attachTags(supabase, (data ?? []) as DiaryEntry[]);
}

export async function getRecentEntries(userId: string, limit = 12) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("diary_entries")
    .select("*")
    .eq("user_id", userId)
    .is("deleted_at", null)
    .order("date", { ascending: false })
    .limit(limit);

  return attachTags(supabase, (data ?? []) as DiaryEntry[]);
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
  let query = supabase
    .from("diary_entries")
    .select("*")
    .eq("user_id", userId)
    .is("deleted_at", null)
    .order("date", { ascending: false })
    .limit(200);

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
        `meal_note.ilike.%${escaped}%`,
        `memo.ilike.%${escaped}%`,
        `good_things.ilike.%${escaped}%`,
        `reflections.ilike.%${escaped}%`
      ].join(",")
    );
  }

  if (filters.hasMealLog) {
    query = query.or("breakfast.not.is.null,lunch.not.is.null,dinner.not.is.null,meal_note.not.is.null");
  }

  const { data } = await query;
  let entries = await attachTags(supabase, (data ?? []) as DiaryEntry[]);

  if (filters.tags?.length) {
    const selected = new Set(filters.tags.map((tag) => tag.toLowerCase()));
    entries = entries.filter((entry) => entry.tags.some((tag) => selected.has(tag.name.toLowerCase())));
  }

  return entries;
}
