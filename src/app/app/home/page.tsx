import type { Metadata } from "next";
import { Home } from "lucide-react";

export const metadata: Metadata = {
  title: "ホーム"
};

export default function HomePage() {
  return (
    <div className="grid min-h-[60dvh] place-items-center">
      <section className="grid max-w-md justify-items-center gap-3 text-center text-neutral-500">
        <div className="grid size-14 place-items-center rounded-2xl bg-mist text-lake">
          <Home size={28} />
        </div>
        <h1 className="text-xl font-semibold text-[var(--foreground)]">ホーム</h1>
        <p className="text-sm leading-6">人生計画や個人整理のための場所として準備中です。</p>
      </section>
    </div>
  );
}
