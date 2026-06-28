import type { Metadata } from "next";
import { DeleteTagButton } from "@/components/tags/delete-tag-button";
import { Panel, SectionHeader } from "@/components/ui/card";
import { StatusPill } from "@/components/ui/status";
import { createClient } from "@/lib/supabase/server";
import { getAllTags } from "@/server/queries/diary";
import { requireUser } from "@/server/queries/user";

export const metadata: Metadata = {
  title: "タグ"
};

export default async function TagsPage() {
  const user = await requireUser();
  const supabase = await createClient();
  const tags = await getAllTags(user.id);
  const { data: links } = await supabase
    .from("diary_entry_tags")
    .select("tag_id, diary_entries!inner(user_id)")
    .eq("diary_entries.user_id", user.id);

  const counts = new Map<string, number>();
  for (const link of (links ?? []) as Array<{ tag_id: string }>) {
    counts.set(link.tag_id, (counts.get(link.tag_id) ?? 0) + 1);
  }

  return (
    <div className="grid gap-6">
      <SectionHeader title="タグ" description="日記の検索や分析に使うタグを管理します。タグは日記保存時に自動作成されます。" />
      <Panel>
        {tags.length ? (
          <div className="grid gap-2">
            {tags.map((tag) => (
              <div key={tag.id} className="flex min-h-12 items-center justify-between rounded-lg border border-[var(--border)] px-3">
                <div className="flex items-center gap-3">
                  <StatusPill>{tag.name}</StatusPill>
                  <span className="text-sm text-neutral-500">{counts.get(tag.id) ?? 0}件</span>
                </div>
                <DeleteTagButton tagId={tag.id} />
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-neutral-500">タグはまだありません。日記のタグ欄に入力して保存すると作成されます。</p>
        )}
      </Panel>
    </div>
  );
}
