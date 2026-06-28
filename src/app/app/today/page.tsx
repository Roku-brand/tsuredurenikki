import type { Metadata } from "next";
import { DiaryEditor } from "@/components/diary/diary-editor";
import { SectionHeader } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button";
import { formatJapaneseDate, toDateInputValue } from "@/lib/utils/date";
import { getAllTags, getEntryByDate, getRecentEntries } from "@/server/queries/diary";
import { requireUser } from "@/server/queries/user";

export const metadata: Metadata = {
  title: "今日の日記"
};

export default async function TodayPage({
  searchParams
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const params = await searchParams;
  const date = params.date && /^\d{4}-\d{2}-\d{2}$/.test(params.date) ? params.date : toDateInputValue();
  const user = await requireUser();
  const [entry, tags, recentEntries] = await Promise.all([
    getEntryByDate(user.id, date),
    getAllTags(user.id),
    getRecentEntries(user.id, 5)
  ]);

  return (
    <div className="grid gap-6">
      <SectionHeader
        title={date === toDateInputValue() ? "今日の日記" : formatJapaneseDate(date)}
        description="開いたらすぐ書ける、軽い日々の記録。入力後しばらくすると自動保存されます。"
        action={<ButtonLink href="/app/calendar" variant="secondary">カレンダー</ButtonLink>}
      />
      <DiaryEditor initialDate={date} entry={entry} tags={tags} />

      {recentEntries.length ? (
        <section className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4 shadow-soft">
          <h2 className="mb-3 font-semibold">最近の日記</h2>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
            {recentEntries.map((recent) => (
              <ButtonLink key={recent.id} href={`/app/today?date=${recent.date}`} variant="ghost" className="justify-start">
                {recent.date.slice(5)} {recent.title || "無題"}
              </ButtonLink>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
