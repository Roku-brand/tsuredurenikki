import type { Metadata } from "next";
import { DiaryEditor } from "@/components/diary/diary-editor";
import { SectionHeader } from "@/components/ui/card";
import { formatJapaneseDate, toDateInputValue } from "@/lib/utils/date";
import { getEntryByDate } from "@/server/queries/diary";
import { requireUser } from "@/server/queries/user";

export const metadata: Metadata = {
  title: "記帳"
};

export default async function TodayPage({
  searchParams
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const params = await searchParams;
  const date = params.date && /^\d{4}-\d{2}-\d{2}$/.test(params.date) ? params.date : toDateInputValue();
  const user = await requireUser();
  const entry = await getEntryByDate(user.id, date);

  return (
    <div className="grid gap-6">
      <SectionHeader
        title={date === toDateInputValue() ? "記帳" : formatJapaneseDate(date)}
        description="タイトル、本文、生活ログを一画面で記録します。入力後しばらくすると自動保存されます。"
      />
      <DiaryEditor initialDate={date} entry={entry} />
    </div>
  );
}
