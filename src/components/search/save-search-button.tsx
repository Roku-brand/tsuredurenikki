"use client";

import { useState, useTransition } from "react";
import { Bookmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import { saveSearchAction } from "@/server/actions/diary";
import type { SearchFilters } from "@/types/forms";

export function SaveSearchButton({ filters }: { filters: SearchFilters }) {
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  function save() {
    const name = window.prompt("保存する検索名");
    if (!name) return;
    startTransition(async () => {
      const result = await saveSearchAction({ name, query: filters.keyword, filters });
      setMessage(result.message ?? "");
    });
  }

  return (
    <div className="flex items-center gap-3">
      <Button type="button" variant="secondary" onClick={save} disabled={isPending}>
        <Bookmark size={16} />
        保存検索
      </Button>
      {message ? <span className="text-sm text-neutral-500">{message}</span> : null}
    </div>
  );
}
