"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ScanLine, LayoutGrid, Package, ClipboardList, FileBarChart } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/", label: "Inicio", icon: LayoutGrid },
  { href: "/scanner", label: "Escanear", icon: ScanLine, primary: true },
  { href: "/assets", label: "Activos", icon: Package },
  { href: "/sessions", label: "Sesiones", icon: ClipboardList },
  { href: "/reports", label: "Reportes", icon: FileBarChart },
];

export function BottomNav() {
  const pathname = usePathname();
  if (pathname === "/scanner" || pathname === "/login") return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-800 bg-slate-950/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-lg">
      <div className="mx-auto flex max-w-lg items-end justify-around px-1 pt-1">
        {NAV.map(({ href, label, icon: Icon, primary }) => {
          const active = pathname === href || (href !== "/" && pathname.startsWith(href));
          if (primary) {
            return (
              <Link
                key={href}
                href={href}
                className="-mt-6 flex flex-col items-center gap-1"
              >
                <span
                  className={cn(
                    "flex h-16 w-16 items-center justify-center rounded-2xl shadow-lg shadow-emerald-500/30 transition-transform active:scale-95",
                    active ? "bg-emerald-400" : "bg-emerald-500"
                  )}
                >
                  <Icon className="h-8 w-8 text-slate-950" strokeWidth={2.5} />
                </span>
                <span className="text-[10px] font-bold uppercase text-emerald-400">{label}</span>
              </Link>
            );
          }
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex min-w-[56px] flex-col items-center gap-1 py-2 px-2 transition-colors",
                active ? "text-emerald-400" : "text-slate-500"
              )}
            >
              <Icon className="h-6 w-6" strokeWidth={active ? 2.5 : 2} />
              <span className="text-[10px] font-semibold uppercase">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
