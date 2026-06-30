export default function AppLoading() {
  return (
    <div className="grid gap-6" aria-label="Loading">
      <div className="space-y-3">
        <div className="h-8 w-48 animate-pulse rounded bg-neutral-200 dark:bg-white/10" />
        <div className="h-4 w-full max-w-xl animate-pulse rounded bg-neutral-100 dark:bg-white/10" />
      </div>
      <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4 shadow-soft">
        <div className="grid gap-3">
          <div className="h-10 animate-pulse rounded bg-neutral-100 dark:bg-white/10" />
          <div className="h-24 animate-pulse rounded bg-neutral-100 dark:bg-white/10" />
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="h-12 animate-pulse rounded bg-neutral-100 dark:bg-white/10" />
            <div className="h-12 animate-pulse rounded bg-neutral-100 dark:bg-white/10" />
            <div className="h-12 animate-pulse rounded bg-neutral-100 dark:bg-white/10" />
          </div>
        </div>
      </div>
    </div>
  );
}
