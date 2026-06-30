import type { Metadata } from "next";
import Link from "next/link";
import { SearchIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { Panel, SectionHeader } from "@/components/ui/card";
import { makeSnippet } from "@/lib/utils/text";
import { searchDiaryEntries } from "@/server/queries/diary";
import { requireUser } from "@/server/queries/user";
import type { SearchFilters } from "@/types/forms";

export const metadata: Metadata = {
  title: "検索"
};

export default async function SearchPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const user = await requireUser();
  const filters = parseFilters(params);
  const results = await searchDiaryEntries(user.id, filters);

  return (
    <div className="grid gap-6">
      <SectionHeader title="検索" description="タイトル、本文、ニュース、TO DO、メモから探せます。" />

      <Panel>
        <form className="grid gap-4" action="/app/search">
          <div className="grid gap-3 md:grid-cols-[1fr_160px_160px_auto] md:items-end">
            <Field label="キーワード">
              <Input name="keyword" defaultValue={filters.keyword ?? ""} placeholder="探したい言葉" />
            </Field>
            <Field label="開始日">
              <Input type="date" name="from" defaultValue={filters.from ?? ""} />
            </Field>
            <Field label="終了日">
              <Input type="date" name="to" defaultValue={filters.to ?? ""} />
            </Field>
            <Button type="submit">
              <SearchIcon size={16} />
              検索
            </Button>
          </div>
        </form>
      </Panel>

      <section className="grid gap-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">検索結果</h2>
          <p className="text-sm text-neutral-500">{results.length}件</p>
        </div>
        {results.map((entry) => (
          <Link
            key={entry.id}
            href={`/app/today?date=${entry.date}`}
            className="focus-ring rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4 shadow-soft transition hover:border-lake"
          >
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium text-lake">{entry.date}</span>
              <h3 className="font-semibold">{entry.title || "無題"}</h3>
            </div>
            <p className="text-sm leading-6 text-neutral-600 dark:text-neutral-300">
              {makeSnippet(entry.body || entry.news_note || entry.tomorrow_todo || entry.memo, filters.keyword)}
            </p>
          </Link>
        ))}
        {!results.length ? (
          <Panel>
            <p className="text-sm text-neutral-500">条件に合う日記はまだありません。</p>
          </Panel>
        ) : null}
      </section>
    </div>
  );
}

function parseFilters(params: Record<string, string | string[] | undefined>): SearchFilters {
  return {
    keyword: single(params.keyword),
    from: single(params.from),
    to: single(params.to)
  };
}

function single(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}
