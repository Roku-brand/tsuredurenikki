import type { Metadata } from "next";
import Link from "next/link";
import { SearchIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/field";
import { Panel, SectionHeader } from "@/components/ui/card";
import { makeSnippet } from "@/lib/utils/text";
import { getAnalysis, type AnalysisPeriod } from "@/server/queries/analysis";
import { searchDiaryEntries } from "@/server/queries/diary";
import { requireUser } from "@/server/queries/user";
import type { SearchFilters } from "@/types/forms";

export const metadata: Metadata = {
  title: "データ"
};

const periods: Array<{ value: AnalysisPeriod; label: string }> = [
  { value: "7d", label: "7日" },
  { value: "30d", label: "30日" },
  { value: "month", label: "今月" },
  { value: "90d", label: "3か月" },
  { value: "year", label: "今年" },
  { value: "all", label: "全期間" }
];

export default async function DataPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const user = await requireUser();
  const filters = parseFilters(params);
  const period = periods.some((item) => item.value === single(params.period)) ? (single(params.period) as AnalysisPeriod) : "30d";
  const [results, analysis] = await Promise.all([searchDiaryEntries(user.id, filters), getAnalysis(user.id, period)]);

  return (
    <div className="grid gap-5">
      <SectionHeader title="データ" description="日記を探し、睡眠・体重・充実度の傾向を確認します。" />

      <Panel>
        <form className="grid gap-3" action="/app/data">
          <div className="grid gap-3 lg:grid-cols-[1fr_auto_auto] lg:items-end">
            <Field label="キーワード">
              <Input name="keyword" defaultValue={filters.keyword ?? ""} placeholder="探したい言葉" />
            </Field>
            <div>
              <p className="mb-1.5 text-sm font-medium text-neutral-700 dark:text-neutral-200">検索範囲</p>
              <div className="flex h-10 items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2">
                <input
                  type="date"
                  name="from"
                  defaultValue={filters.from ?? ""}
                  aria-label="開始日"
                  className="min-w-0 bg-transparent text-sm outline-none"
                />
                <span className="text-neutral-400">～</span>
                <input
                  type="date"
                  name="to"
                  defaultValue={filters.to ?? ""}
                  aria-label="終了日"
                  className="min-w-0 bg-transparent text-sm outline-none"
                />
              </div>
            </div>
            <Button type="submit">
              <SearchIcon size={16} />
              検索
            </Button>
          </div>
          <input type="hidden" name="period" value={period} />
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

      <section className="grid gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="font-semibold">分析</h2>
            <p className="mt-1 text-sm text-neutral-500">検索ウィンドウの下で傾向を確認できます。</p>
          </div>
          <form action="/app/data" className="flex items-end gap-2">
            <input type="hidden" name="keyword" value={filters.keyword ?? ""} />
            <input type="hidden" name="from" value={filters.from ?? ""} />
            <input type="hidden" name="to" value={filters.to ?? ""} />
            <Field label="期間">
              <Select name="period" defaultValue={period}>
                {periods.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </Select>
            </Field>
            <Button type="submit" variant="secondary">表示</Button>
          </form>
        </div>

        <section className="grid gap-4 lg:grid-cols-2">
          <Panel>
            <h3 className="mb-4 font-semibold">睡眠時間グラフ</h3>
            <Trend values={analysis.sleepTrend.map((item) => Number(item.value ?? 0))} max={12} unit="h" />
          </Panel>
          <Panel>
            <h3 className="mb-4 font-semibold">体重グラフ</h3>
            <Trend
              values={analysis.weightTrend.map((item) => Number(item.value ?? 0))}
              max={Math.max(1, ...analysis.weightTrend.map((item) => Number(item.value ?? 0)))}
              unit="kg"
            />
          </Panel>
        </section>

        <Panel>
          <h3 className="mb-4 font-semibold">充実度集計表</h3>
          <div className="overflow-hidden rounded-lg border border-[var(--border)]">
            <table className="w-full text-left text-sm">
              <thead className="bg-[var(--surface-muted)]">
                <tr>
                  <th className="px-4 py-3 font-semibold">充実度</th>
                  <th className="px-4 py-3 font-semibold">日数</th>
                </tr>
              </thead>
              <tbody>
                {(["A", "B", "C"] as const).map((label) => (
                  <tr key={label} className="border-t border-[var(--border)]">
                    <td className="px-4 py-3 font-semibold">{label}</td>
                    <td className="px-4 py-3">{analysis.fulfillmentCounts[label]}日</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      </section>
    </div>
  );
}

function Trend({ values, max, unit }: { values: number[]; max: number; unit: string }) {
  const available = values.filter((value) => value > 0);
  if (!available.length) return <p className="text-sm text-neutral-500">まだデータがありません。</p>;
  return (
    <div className="flex h-40 items-end gap-1">
      {values.slice(-40).map((value, index) => (
        <div
          key={`${value}-${index}`}
          className="min-w-1 flex-1 rounded-t bg-lake/80"
          style={{ height: value > 0 ? `${Math.max(4, Math.min(100, (value / Math.max(1, max)) * 100))}%` : "4px" }}
          title={value > 0 ? `${value}${unit}` : "-"}
        />
      ))}
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
