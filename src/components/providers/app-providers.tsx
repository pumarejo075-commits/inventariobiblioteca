"use client";

import { useEffect } from "react";
import { Toaster } from "sonner";
import { syncPendingScans } from "@/lib/offline/sync";
import { useSessionStore } from "@/hooks/use-session";
import { MOCK_SESSION } from "@/lib/dev/mock-data";
import {
  DEFAULT_INVENTORY_SESSION,
  resolveActiveInventorySession,
} from "@/lib/inventory-session";

export function AppProviders({ children }: { children: React.ReactNode }) {
  const setActiveSession = useSessionStore((s) => s.setActiveSession);

  useEffect(() => {
    if (process.env.NEXT_PUBLIC_BIBLIOSCAN_DEV_MODE === "true") {
      if (!useSessionStore.getState().activeSession) setActiveSession(MOCK_SESSION);
      return;
    }
    if (!useSessionStore.getState().activeSession) {
      setActiveSession(DEFAULT_INVENTORY_SESSION);
    }
    void resolveActiveInventorySession().then(setActiveSession);
  }, [setActiveSession]);

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
