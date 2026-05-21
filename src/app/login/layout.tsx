import { Suspense } from "react";

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<div className="min-h-dvh bg-[var(--surface)]" />}>{children}</Suspense>;
}
