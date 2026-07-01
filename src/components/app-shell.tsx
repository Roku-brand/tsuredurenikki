"use client";

import { useCallback, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  CalendarDays,
  Database,
  Home,
  LockKeyhole,
  NotebookPen,
  Settings
} from "lucide-react";
import { clsx } from "clsx";
import { Button } from "@/components/ui/button";
import type { AppSettings, Profile } from "@/types/database";

const navItems = [
  { href: "/app/calendar", label: "カレンダー", icon: CalendarDays },
  { href: "/app/today", label: "記帳", icon: NotebookPen },
  { href: "/app/home", label: "ホーム", icon: Home },
  { href: "/app/data", label: "データ", icon: Database },
  { href: "/app/settings", label: "設定", icon: Settings }
];

const primaryNavHrefs = navItems.map((item) => item.href);

export function AppShell({
  children,
  profile,
  settings
}: {
  children: React.ReactNode;
  profile: Profile;
  settings: AppSettings;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const lockActive = profile.lock_enabled && Boolean(profile.lock_pin_hash);
  const calendarActive = pathname.startsWith("/app/calendar");

  const prefetchPrimaryTabs = useCallback(() => {
    for (const href of primaryNavHrefs) {
      if (!pathname.startsWith(href)) router.prefetch(href);
    }
  }, [pathname, router]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const run = () => prefetchPrimaryTabs();
    const idleCallback = window.requestIdleCallback ?? ((callback) => window.setTimeout(callback, 250));
    const cancelIdleCallback = window.cancelIdleCallback ?? window.clearTimeout;
    const handle = idleCallback(run);
    return () => cancelIdleCallback(handle);
  }, [prefetchPrimaryTabs]);

  useEffect(() => {
    if (!lockActive) return;
    const unlocked = sessionStorage.getItem("zezehibi:unlocked") === "true";
    if (!unlocked && pathname !== "/lock") {
      router.replace(`/lock?next=${encodeURIComponent(pathname)}`);
    }
  }, [lockActive, pathname, router]);

  useEffect(() => {
    if (!lockActive) return;
    let timer: ReturnType<typeof setTimeout>;
    const refresh = () => {
      clearTimeout(timer);
      timer = setTimeout(
        () => {
          sessionStorage.removeItem("zezehibi:unlocked");
          router.replace(`/lock?next=${encodeURIComponent(pathname)}`);
        },
        Math.max(1, settings.lock_timeout_minutes) * 60_000
      );
    };

    const activityEvents = ["click", "keydown", "pointerdown", "touchstart", "visibilitychange"];
    activityEvents.forEach((eventName) => window.addEventListener(eventName, refresh, { passive: true }));
    refresh();
    return () => {
      clearTimeout(timer);
      activityEvents.forEach((eventName) => window.removeEventListener(eventName, refresh));
    };
  }, [lockActive, pathname, router, settings.lock_timeout_minutes]);

  function lockNow() {
    sessionStorage.removeItem("zezehibi:unlocked");
    router.push(`/lock?next=${encodeURIComponent(pathname)}`);
  }

  return (
    <div className={clsx(calendarActive ? "h-dvh overflow-hidden pb-0" : "min-h-screen pb-20 md:pb-0")}>
      <aside className="fixed left-0 top-0 z-20 hidden h-screen w-64 border-r border-[var(--border)] bg-[var(--surface)] px-4 py-5 md:block">
        <Link href="/app/today" className="mb-6 flex items-center gap-3">
          <div className="grid size-11 place-items-center rounded-lg bg-mist text-lg font-semibold text-lake">是</div>
          <div>
            <p className="font-semibold">是々日々</p>
            <p className="text-xs text-neutral-500">quiet life log</p>
          </div>
        </Link>
        <nav className="space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.href}
              item={item}
              active={pathname.startsWith(item.href)}
              onIntent={() => router.prefetch(item.href)}
            />
          ))}
        </nav>
        <div className="absolute bottom-5 left-4 right-4">
          <Button variant="secondary" className="w-full" onClick={lockNow}>
            <LockKeyhole size={16} />
            ロック
          </Button>
        </div>
      </aside>

      <main
        className={clsx(
          "mx-auto max-w-6xl px-4 py-5 md:ml-64 md:px-8 md:py-8",
          pathname.startsWith("/app/today") && "px-3 py-3 md:px-8 md:py-8",
          calendarActive && "h-[calc(100dvh-5.25rem)] overflow-hidden px-3 py-3 md:h-dvh md:max-w-none md:px-6 md:py-6"
        )}
      >
        {children}
      </main>

      <nav className="safe-bottom fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-[var(--border)] bg-[var(--surface)] px-2 pt-2 md:hidden">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch
              className={clsx(
                "focus-ring flex min-h-14 flex-col items-center justify-center gap-1 rounded-lg text-[11px] font-medium",
                active ? "bg-mist text-lake" : "text-neutral-500"
              )}
              aria-label={item.label}
              onFocus={() => router.prefetch(item.href)}
              onPointerEnter={() => router.prefetch(item.href)}
            >
              <Icon size={19} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

function NavLink({
  item,
  active,
  onIntent
}: {
  item: (typeof navItems)[number];
  active: boolean;
  onIntent: () => void;
}) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      prefetch
      className={clsx(
        "focus-ring flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium transition",
        active ? "bg-mist text-lake" : "text-neutral-600 hover:bg-black/5 dark:text-neutral-300 dark:hover:bg-white/10"
      )}
      onFocus={onIntent}
      onPointerEnter={onIntent}
    >
      <Icon size={18} />
      {item.label}
    </Link>
  );
}
