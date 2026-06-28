import type { Metadata } from "next";
import Link from "next/link";
import { SearchIcon, SlidersHorizontal } from "lucide-react";
import { SaveSearchButton } from "@/components/search/save-search-button";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/field";
import { Panel, SectionHeader } from "@/components/ui/card";
import { StatusPill } from "@/components/ui/status";
import { makeSnippet } from "@/lib/utils/text";
import { getAllTags, getSavedSearches, searchDiaryEntries } from "@/server/queries/diary";
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
  const [results, tags, saved] = await Promise.all([
    searchDiaryEntries(user.id, filters),
    getAllTags(user.id),
    getSavedSearches(user.id)
  ]);

  return (
    <div className="grid gap-6">
      <SectionHeader title="検索" description="タイトル、本文、食事メモ、振り返りを横断して探せます。" />

      <Panel>
        <form className="grid gap-4" action="/app/search">
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="flex-1">
              <Field label="キーワード">
                <Input name="keyword" defaultValue={filters.keyword ?? ""} placeholder="思い出したい言葉を入力" />
              </Field>
            </div>
            <div className="flex items-end gap-2">
              <Button type="submit">
                <SearchIcon size={16} />
                検索
              </Button>
              <SaveSearchButton filters={filters} />
            </div>
          </div>

          <details className="rounded-lg border border-[var(--border)] p-3">
            <summary className="flex cursor-pointer items-center gap-2 text-sm font-medium">
              <SlidersHorizontal size={16} />
              詳細条件
            </summary>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Field label="開始日">
                <Input type="date" name="from" defaultValue={filters.from ?? ""} />
              </Field>
              <Field label="終了日">
                <Input type="date" name="to" defaultValue={filters.to ?? ""} />
              </Field>
              <Field label="気分">
                <Select name="mood" defaultValue={filters.mood?.[0]?.toString() ?? ""}>
                  <option value="">指定なし</option>
                  {[1, 2, 3, 4, 5].map((value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="食事記録">
                <Select name="hasMealLog" defaultValue={filters.hasMealLog ? "true" : ""}>
                  <option value="">指定なし</option>
                  <option value="true">あり</option>
                </Select>
              </Field>
              <Field label="タグ">
                <Select name="tag" defaultValue={filters.tags?.[0] ?? ""}>
                  <option value="">指定なし</option>
                  {tags.map((tag) => (
                    <option key={tag.id} value={tag.name}>
                      {tag.name}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="睡眠 最小">
                <Input type="number" step="0.5" name="sleepHoursMin" defaultValue={filters.sleepHoursMin ?? ""} />
              </Field>
              <Field label="睡眠 最大">
                <Input type="number" step="0.5" name="sleepHoursMax" defaultValue={filters.sleepHoursMax ?? ""} />
              </Field>
            </div>
          </details>
        </form>
      </Panel>

      {saved.length ? (
        <Panel>
          <h2 className="mb-3 font-semibold">保存した検索</h2>
          <div className="flex flex-wrap gap-2">
            {saved.map((item) => (
              <StatusPill key={item.id}>{item.name}</StatusPill>
            ))}
          </div>
        </Panel>
      ) : null}

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
              {entry.mood ? <StatusPill>気分 {entry.mood}/5</StatusPill> : null}
            </div>
            <p className="text-sm leading-6 text-neutral-600 dark:text-neutral-300">
              {makeSnippet(entry.body || entry.meal_note || entry.memo, filters.keyword)}
            </p>
            {entry.tags.length ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {entry.tags.map((tag) => (
                  <StatusPill key={tag.id}>{tag.name}</StatusPill>
                ))}
              </div>
            ) : null}
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
  const keyword = single(params.keyword);
  const tag = single(params.tag);
  const mood = toNumber(single(params.mood));
  const sleepHoursMin = toNumber(single(params.sleepHoursMin));
  const sleepHoursMax = toNumber(single(params.sleepHoursMax));
  return {
    keyword,
    from: single(params.from),
    to: single(params.to),
    tags: tag ? [tag] : undefined,
    mood: typeof mood === "number" ? [mood] : undefined,
    sleepHoursMin,
    sleepHoursMax,
    hasMealLog: single(params.hasMealLog) === "true"
  };
}

function single(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function toNumber(value: string | undefined) {
  if (!value) return undefined;
  const number = Number(value);
  return Number.isFinite(number) ? number : undefined;
}
