import type { Metadata } from "next";
import { ImportExportPanel } from "@/components/import-export/import-export-panel";
import { SectionHeader } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "インポート・エクスポート"
};

export default function ImportExportPage() {
  return (
    <div className="grid gap-6">
      <SectionHeader title="インポート・エクスポート" description="日記データをJSONでバックアップし、既存データを移行します。" />
      <ImportExportPanel />
    </div>
  );
}
