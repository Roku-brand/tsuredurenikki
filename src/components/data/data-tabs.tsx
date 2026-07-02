"use client";

import { useState } from "react";

type DataTab = "search" | "analysis";

export function DataTabs({
  initialTab,
  search,
  analysis
}: {
  initialTab: DataTab;
  search: React.ReactNode;
  analysis: React.ReactNode;
}) {
  const [tab, setTab] = useState<DataTab>(initialTab);

  return (
    <div className="grid gap-5">
      <div className="flex rounded-lg bg-[var(--surface-muted)] p-1">
        <TabButton active={tab === "search"} onClick={() => setTab("search")}>
          検索
        </TabButton>
        <TabButton active={tab === "analysis"} onClick={() => setTab("analysis")}>
          分析
        </TabButton>
      </div>
      <div hidden={tab !== "search"}>{search}</div>
      <div hidden={tab !== "analysis"}>{analysis}</div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "focus-ring flex-1 rounded-md px-4 py-2 text-center text-sm font-semibold transition",
        active ? "bg-[var(--surface)] text-lake shadow-sm" : "text-neutral-500"
      ].join(" ")}
      aria-pressed={active}
    >
      {children}
    </button>
  );
}
