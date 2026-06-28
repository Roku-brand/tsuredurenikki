"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { deleteTagAction } from "@/server/actions/diary";

export function DeleteTagButton({ tagId }: { tagId: string }) {
  const [isPending, startTransition] = useTransition();

  function remove() {
    if (!window.confirm("このタグを削除しますか？日記との関連も外れます。")) return;
    startTransition(async () => {
      await deleteTagAction(tagId);
    });
  }

  return (
    <Button type="button" variant="ghost" size="sm" onClick={remove} disabled={isPending} aria-label="タグを削除">
      <Trash2 size={15} />
    </Button>
  );
}
