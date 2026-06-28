import { clsx } from "clsx";

export function Panel({
  children,
  className,
  as: Component = "section"
}: {
  children: React.ReactNode;
  className?: string;
  as?: "section" | "div" | "article";
}) {
  return (
    <Component
      className={clsx("rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4 shadow-soft sm:p-5", className)}
    >
      {children}
    </Component>
  );
}

export function SectionHeader({
  title,
  description,
  action
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h1 className="text-xl font-semibold text-[var(--foreground)] sm:text-2xl">{title}</h1>
        {description ? <p className="mt-1 text-sm leading-6 text-neutral-600 dark:text-neutral-300">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}
