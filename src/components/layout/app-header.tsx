"use client";

import Link from "next/link";
import { Settings } from "lucide-react";
import { useSessionStore } from "@/hooks/use-session";

export function AppHeader({ title }: { title: string }) {
  const { activeSession } = useSessionStore();

  return (
    <header className="sticky top-0 z-30 border-b border-[var(--border)] bg-[var(--surface)]/95 px-4 py-3 backdrop-blur-lg pt-[max(0.75rem,env(safe-area-inset-top))]">
      <div className="mx-auto flex max-w-lg items-center justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--accent-warm)]">
            BiblioScan
          </p>
          <h1 className="text-xl font-black text-[var(--foreground)]">{title}</h1>
          {activeSession && (
            <p className="truncate text-xs text-[var(--foreground-muted)]">{activeSession.name}</p>
          )}
        </div>
        <Link
          href="/settings"
          className="flex h-12 w-12 items-center justify-center rounded-xl border border-[var(--border)] bg-white text-[var(--foreground-muted)] active:bg-[var(--surface-elevated)]"
        >
          <Settings className="h-6 w-6" />
        </Link>
      </div>
    </header>
  );
}
