"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/server/queries/user";
import type { ActionResult } from "@/types/forms";
import type { AppSettings, DiaryEntry, DiaryEntryTag, SavedSearch, Tag } from "@/types/database";

export type ExportPayload = {
  version: 1;
  exportedAt: string;
  diary_entries: DiaryEntry[];
  tags: Tag[];
  diary_entry_tags: DiaryEntryTag[];
  saved_searches: SavedSearch[];
  app_settings: AppSettings | null;
};

export async function exportJsonAction(): Promise<ActionResult<ExportPayload>> {
  const user = await requireUser();
  const supabase = await createClient();
  const [entries, tags, savedSearches, settings] = await Promise.all([
    supabase.from("diary_entries").select("*").eq("user_id", user.id).order("date", { ascending: true }),
    supabase.from("tags").select("*").eq("user_id", user.id).order("name"),
    supabase.from("saved_searches").select("*").eq("user_id", user.id).order("created_at", { ascending: true }),
    supabase.from("app_settings").select("*").eq("user_id", user.id).maybeSingle()
  ]);

  const entryIds = ((entries.data ?? []) as DiaryEntry[]).map((entry) => entry.id);
  const links = entryIds.length
    ? await supabase.from("diary_entry_tags").select("*").in("diary_entry_id", entryIds)
    : { data: [] };

  return {
    ok: true,
    data: {
      version: 1,
      exportedAt: new Date().toISOString(),
      diary_entries: (entries.data ?? []) as DiaryEntry[],
      tags: (tags.data ?? []) as Tag[],
      diary_entry_tags: (links.data ?? []) as DiaryEntryTag[],
      saved_searches: (savedSearches.data ?? []) as SavedSearch[],
      app_settings: (settings.data ?? null) as AppSettings | null
    }
  };
}

export async function importJsonAction(payload: unknown, mode: "overwrite" | "skip" = "skip"): Promise<ActionResult> {
  const user = await requireUser();
  const typed = payload as Partial<ExportPayload>;
  if (!Array.isArray(typed.diary_entries)) {
    return { ok: false, message: "JSONの形式が正しくありません。" };
  }

  const supabase = await createClient();
  const entries = typed.diary_entries.map((entry) => ({
    ...entry,
    id: undefined,
    user_id: user.id,
    deleted_at: null
  }));

  if (mode === "skip") {
    for (const entry of entries) {
      await supabase.from("diary_entries").insert(entry).select("id").single();
    }
  } else {
    await supabase.from("diary_entries").upsert(entries, { onConflict: "user_id,date" });
  }

  revalidatePath("/app/today");
  revalidatePath("/app/calendar");
  revalidatePath("/app/search");
  revalidatePath("/app/analysis");
  return { ok: true, message: `${entries.length}件をインポートしました。` };
}
