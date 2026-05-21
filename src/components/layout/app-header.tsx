"use client";

import Link from "next/link";
import { Settings } from "lucide-react";
import { INVENTORY_SESSION_NAME } from "@/lib/inventory/constants";

export function AppHeader({ title }: { title: string }) {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-800 bg-slate-950/90 px-4 py-3 backdrop-blur-lg pt-[max(0.75rem,env(safe-area-inset-top))]">
      <div className="mx-auto flex max-w-lg items-center justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-500">
            BiblioScan
          </p>
          <h1 className="text-xl font-black text-slate-100">{title}</h1>
          <p className="truncate text-xs text-slate-500">{INVENTORY_SESSION_NAME}</p>
        </div>
        <Link
          href="/settings"
          className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900 text-slate-400 active:bg-slate-800"
        >
          <Settings className="h-6 w-6" />
        </Link>
      </div>
    </header>
  );
}
