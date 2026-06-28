import { Panel } from "@/components/ui/card";

export function SetupNotice() {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl items-center px-5 py-10">
      <Panel>
        <p className="text-sm font-medium text-lake">Supabase設定が必要です</p>
        <h1 className="mt-2 text-2xl font-semibold">是々日々を起動する準備をしてください</h1>
        <p className="mt-3 leading-7 text-neutral-600 dark:text-neutral-300">
          `.env.local` に `NEXT_PUBLIC_SUPABASE_URL` と `NEXT_PUBLIC_SUPABASE_ANON_KEY` を設定し、
          Supabase SQL Editorで `supabase/schema.sql` を実行すると使い始められます。
        </p>
      </Panel>
    </main>
  );
}
