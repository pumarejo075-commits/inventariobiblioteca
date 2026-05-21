"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGrid, ScanLine, Calendar, BarChart3, Upload } from "lucide-react";
import { cn } from "@/lib/utils";

const links: {
  href: string;
  label: string;
  icon: typeof LayoutGrid;
  primary?: boolean;
}[] = [
  { href: "/", label: "Inicio", icon: LayoutGrid },
  { href: "/scanner", label: "Escanear", icon: ScanLine, primary: true },
  { href: "/assets", label: "Activos", icon: BarChart3 },
  { href: "/sessions", label: "Sesiones", icon: Calendar },
  { href: "/import", label: "Importar", icon: Upload },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-[var(--border)] bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-lg">
      <div className="mx-auto flex max-w-lg items-end justify-around px-2">
        {links.map(({ href, label, icon: Icon, primary }) => {
          const active = pathname === href || (href !== "/" && pathname.startsWith(href));
          if (primary) {
            return (
              <Link key={href} href={href} className="flex flex-col items-center gap-1 px-2 py-2">
                <div
                  className={cn(
                    "flex h-16 w-16 items-center justify-center rounded-2xl shadow-md transition-transform active:scale-95",
                    active ? "bg-[var(--success)]" : "bg-[var(--success)]"
                  )}
                >
                  <Icon className="h-8 w-8 text-white" strokeWidth={2.5} />
                </div>
                <span className="text-[10px] font-bold uppercase text-[var(--success)]">{label}</span>
              </Link>
            );
          }
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-col items-center gap-1 px-3 py-3 text-[10px] font-semibold uppercase",
                active ? "text-[var(--success)]" : "text-[var(--foreground-muted)]"
              )}
            >
              <Icon className="h-6 w-6" strokeWidth={active ? 2.5 : 2} />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
