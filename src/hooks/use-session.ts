"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { InventorySession } from "@/types/database";

interface SessionStore {
  activeSession: InventorySession | null;
  setActiveSession: (session: InventorySession | null) => void;
}

export const useSessionStore = create<SessionStore>()(
  persist(
    (set) => ({
      activeSession: null,
      setActiveSession: (session) => set({ activeSession: session }),
    }),
    { name: "biblioscan-active-session" }
  )
);
