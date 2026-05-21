import { BottomNav } from "@/components/layout/bottom-nav";

export const dynamic = "force-dynamic";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-[var(--surface)] pb-24">
      {children}
      <BottomNav />
    </div>
  );
}
