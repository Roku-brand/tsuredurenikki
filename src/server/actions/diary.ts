"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { countWords, csvTags } from "@/lib/utils/text";
import { diaryEntrySchema } from "@/lib/validation/diary";
import { requireUser } from "@/server/queries/user";
import type { ActionResult } from "@/types/forms";
import type { DiaryEntry, Tag } from "@/types/database";

export async function upsertDiaryEntryAction(input: unknown): Promise<ActionResult<{ id: string }>> {
  const user = await requireUser();
  const parsed = diaryEntrySchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "入力内容を確認してください。" };
  }

  const supabase = await createClient();
  const { tags, ...values } = parsed.data;
  const word_count = countWords(
    [
      values.title,
      values.body,
      values.good_things,
      values.reflections,
      values.learnings,
      values.worries,
      values.tomorrow_todo,
      values.memo
    ]
      .filter(Boolean)
      .join("")
  );

  const { data, error } = await supabase
    .from("diary_entries")
    .upsert(
      {
        ...values,
        user_id: user.id,
        word_count,
        deleted_at: null
      },
      { onConflict: "user_id,date" }
    )
    .select("*")
    .single();

  if (error || !data) {
    return { ok: false, message: "保存できませんでした。" };
  }

  await syncEntryTags(data as DiaryEntry, csvTags(tags));
  revalidateDiaryPaths();
  return { ok: true, message: "保存済み", data: { id: data.id } };
}

export async function deleteDiaryEntryAction(entryId: string): Promise<ActionResult> {
  const user = await requireUser();
  const supabase = await createClient();
  const { error } = await supabase
    .from("diary_entries")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", entryId)
    .eq("user_id", user.id);

  revalidateDiaryPaths();
  return error ? { ok: false, message: "削除できませんでした。" } : { ok: true, message: "削除しました。" };
}

export async function restoreDiaryEntryAction(entryId: string): Promise<ActionResult> {
  const user = await requireUser();
  const supabase = await createClient();
  const { error } = await supabase
    .from("diary_entries")
    .update({ deleted_at: null })
    .eq("id", entryId)
    .eq("user_id", user.id);

  revalidateDiaryPaths();
  return error ? { ok: false, message: "復元できませんでした。" } : { ok: true, message: "復元しました。" };
}

export async function saveSearchAction(input: { name: string; query?: string; filters?: unknown }): Promise<ActionResult> {
  const user = await requireUser();
  const name = input.name.trim();
  if (!name) return { ok: false, message: "保存名を入力してください。" };

  const supabase = await createClient();
  const { error } = await supabase.from("saved_searches").insert({
    user_id: user.id,
    name,
    query: input.query?.trim() || null,
    filters: (input.filters ?? {}) as never
  });

  revalidatePath("/app/search");
  return error ? { ok: false, message: "検索条件を保存できませんでした。" } : { ok: true, message: "検索条件を保存しました。" };
}

export async function deleteTagAction(tagId: string): Promise<ActionResult> {
  const user = await requireUser();
  const supabase = await createClient();
  const { error } = await supabase.from("tags").delete().eq("id", tagId).eq("user_id", user.id);
  revalidatePath("/app/tags");
  revalidatePath("/app/today");
  return error ? { ok: false, message: "タグを削除できませんでした。" } : { ok: true, message: "タグを削除しました。" };
}

async function syncEntryTags(entry: DiaryEntry, tagNames: string[]) {
  const supabase = await createClient();
  await supabase.from("diary_entry_tags").delete().eq("diary_entry_id", entry.id);
  if (tagNames.length === 0) return;

  const upserts = tagNames.map((name) => ({ user_id: entry.user_id, name }));
  const { data: tags } = await supabase
    .from("tags")
    .upsert(upserts, { onConflict: "user_id,name" })
    .select("*");

  const tagRows = ((tags ?? []) as Tag[]).map((tag) => ({
    diary_entry_id: entry.id,
    tag_id: tag.id
  }));

  if (tagRows.length) {
    await supabase.from("diary_entry_tags").insert(tagRows);
  }
}

function revalidateDiaryPaths() {
  revalidatePath("/app/today");
  revalidatePath("/app/calendar");
  revalidatePath("/app/search");
  revalidatePath("/app/analysis");
  revalidatePath("/app/tags");
}
