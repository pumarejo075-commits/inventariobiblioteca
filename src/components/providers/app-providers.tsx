"use client";

import { useEffect } from "react";
import { Toaster } from "sonner";
import { syncPendingScans } from "@/lib/offline/sync";

export function AppProviders({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
    const sync = () => syncPendingScans();
    window.addEventListener("online", sync);
    if (navigator.onLine) sync();
    return () => window.removeEventListener("online", sync);
  }, []);

  return (
    <>
      {children}
      <Toaster
        position="top-center"
        theme="dark"
        toastOptions={{
          classNames: {
            toast: "bg-slate-900 border-slate-700 text-slate-100",
          },
        }}
      />
    </>
  );
}
