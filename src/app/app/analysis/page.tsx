import type { Metadata } from "next";
import { Panel, SectionHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Field, Select } from "@/components/ui/field";
import { StatusPill } from "@/components/ui/status";
import { getAnalysis, type AnalysisPeriod } from "@/server/queries/analysis";
import { requireUser } from "@/server/queries/user";

export const metadata: Metadata = {
  title: "分析"
};

const periods: Array<{ value: AnalysisPeriod; label: string }> = [
  { value: "7d", label: "7日" },
  { value: "30d", label: "30日" },
  { value: "month", label: "今月" },
  { value: "last-month", label: "先月" },
  { value: "90d", label: "3か月" },
  { value: "year", label: "今年" },
  { value: "all", label: "全期間" }
];

export default async function AnalysisPage({
  searchParams
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  const params = await searchParams;
  const period = periods.some((item) => item.value === params.period) ? (params.period as AnalysisPeriod) : "30d";
  const user = await requireUser();
  const analysis = await getAnalysis(user.id, period);

  return (
    <div className="grid gap-6">
      <SectionHeader title="分析" description="日々の記録から、生活・感情・書く量の傾向を見ます。" />

      <Panel>
        <form action="/app/analysis" className="flex max-w-sm items-end gap-2">
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
      </Panel>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard label="記録日数" value={`${analysis.summary.totalDays}日`} />
        <SummaryCard label="連続記録" value={`${analysis.summary.streakDays}日`} />
        <SummaryCard label="平均文字数" value={`${analysis.summary.averageWords}字`} />
        <SummaryCard label="食事記録率" value={`${analysis.summary.mealRate}%`} />
        <SummaryCard label="平均気分" value={analysis.summary.averageMood ? `${analysis.summary.averageMood}/5` : "-"} />
        <SummaryCard label="平均睡眠" value={analysis.summary.averageSleep ? `${analysis.summary.averageSleep}h` : "-"} />
        <SummaryCard label="よかったこと" value={`${analysis.summary.goodThingCount}件`} />
        <SummaryCard label="タグ種類" value={`${analysis.tagRanking.length}件`} />
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Panel>
          <h2 className="mb-4 font-semibold">気分推移</h2>
          <Trend values={analysis.moodTrend.map((item) => Number(item.value ?? 0))} max={5} />
        </Panel>
        <Panel>
          <h2 className="mb-4 font-semibold">睡眠時間</h2>
          <Trend values={analysis.sleepTrend.map((item) => Number(item.value ?? 0))} max={12} />
        </Panel>
        <Panel>
          <h2 className="mb-4 font-semibold">文字数</h2>
          <Trend
            values={analysis.wordsTrend.map((item) => Number(item.value ?? 0))}
            max={Math.max(120, ...analysis.wordsTrend.map((item) => Number(item.value ?? 0)))}
          />
        </Panel>
        <Panel>
          <h2 className="mb-4 font-semibold">タグランキング</h2>
          {analysis.tagRanking.length ? (
            <div className="grid gap-3">
              {analysis.tagRanking.map((item) => (
                <div key={item.tag.id}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <StatusPill>{item.tag.name}</StatusPill>
                    <span className="text-neutral-500">{item.count}件</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-neutral-100 dark:bg-white/10">
                    <div className="h-full rounded-full bg-moss" style={{ width: `${Math.min(100, item.count * 18)}%` }} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-neutral-500">タグ付きの日記はまだありません。</p>
          )}
        </Panel>
      </section>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <Panel>
      <p className="text-sm text-neutral-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
    </Panel>
  );
}

function Trend({ values, max }: { values: number[]; max: number }) {
  if (!values.length) return <p className="text-sm text-neutral-500">まだデータがありません。</p>;
  return (
    <div className="flex h-32 items-end gap-1">
      {values.slice(-40).map((value, index) => (
        <div
          key={`${value}-${index}`}
          className="min-w-1 flex-1 rounded-t bg-lake/80"
          style={{ height: `${Math.max(4, Math.min(100, (value / Math.max(1, max)) * 100))}%` }}
          title={String(value)}
        />
      ))}
    </div>
  );
}
