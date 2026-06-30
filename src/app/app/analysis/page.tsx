import type { Metadata } from "next";
import { Panel, SectionHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Field, Select } from "@/components/ui/field";
import { getAnalysis, type AnalysisPeriod } from "@/server/queries/analysis";
import { requireUser } from "@/server/queries/user";

export const metadata: Metadata = {
  title: "分析"
};

const periods: Array<{ value: AnalysisPeriod; label: string }> = [
  { value: "7d", label: "7日" },
  { value: "30d", label: "30日" },
  { value: "month", label: "今月" },
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
      <SectionHeader title="分析" description="睡眠、体重、充実度を確認します。" />

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

      <section className="grid gap-4 lg:grid-cols-2">
        <Panel>
          <h2 className="mb-4 font-semibold">睡眠時間グラフ</h2>
          <Trend values={analysis.sleepTrend.map((item) => Number(item.value ?? 0))} max={12} unit="h" />
        </Panel>
        <Panel>
          <h2 className="mb-4 font-semibold">体重グラフ</h2>
          <Trend
            values={analysis.weightTrend.map((item) => Number(item.value ?? 0))}
            max={Math.max(1, ...analysis.weightTrend.map((item) => Number(item.value ?? 0)))}
            unit="kg"
          />
        </Panel>
      </section>

      <Panel>
        <h2 className="mb-4 font-semibold">充実度集計表</h2>
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
