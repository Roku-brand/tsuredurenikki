import { clsx } from "clsx";

export function StatusPill({ children, tone = "neutral" }: { children: React.ReactNode; tone?: "neutral" | "good" | "warn" | "bad" }) {
  return (
    <span
      className={clsx(
        "inline-flex min-h-7 items-center rounded-full px-3 text-xs font-medium",
        tone === "neutral" && "bg-neutral-100 text-neutral-700 dark:bg-white/10 dark:text-neutral-200",
        tone === "good" && "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-100",
        tone === "warn" && "bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-100",
        tone === "bad" && "bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-100"
      )}
    >
      {children}
    </span>
  );
}
