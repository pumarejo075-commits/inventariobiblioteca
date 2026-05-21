"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppHeader } from "@/components/layout/app-header";
import { Button } from "@/components/ui/button";
import { Card, CardTitle, CardDescription } from "@/components/ui/card";
import { getPendingScans } from "@/lib/offline/db";
import { syncPendingScans } from "@/lib/offline/sync";
import type { Profile } from "@/types/database";
import { LogOut, Wifi, WifiOff, RefreshCw } from "lucide-react";
import { toast } from "sonner";

export default function SettingsPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [pending, setPending] = useState(0);
  const [online, setOnline] = useState(true);

  useEffect(() => {
    setOnline(navigator.onLine);
    const onOnline = () => setOnline(true);
    const onOffline = () => setOnline(false);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : null))
      .then(setProfile);
    getPendingScans().then((s) => setPending(s.length));
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  const sync = async () => {
    const { synced, remaining } = await syncPendingScans();
    setPending(remaining);
    toast.success(`Sincronizados: ${synced}, pendientes: ${remaining}`);
  };

  return (
    <>
      <AppHeader title="Configuración" />
      <main className="mx-auto max-w-lg space-y-4 px-4 py-4 pb-32">
        <Card>
          <CardTitle>{profile?.full_name ?? profile?.email ?? "Usuario"}</CardTitle>
          <CardDescription>Rol: {profile?.role ?? "—"}</CardDescription>
        </Card>

        <Card className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {online ? (
              <Wifi className="h-6 w-6 text-emerald-400" />
            ) : (
              <WifiOff className="h-6 w-6 text-amber-400" />
            )}
            <div>
              <CardTitle className="text-base">
                {online ? "En línea" : "Sin conexión"}
              </CardTitle>
              <CardDescription>{pending} escaneos en cola offline</CardDescription>
            </div>
          </div>
          <Button variant="secondary" size="icon" onClick={sync}>
            <RefreshCw className="h-5 w-5" />
          </Button>
        </Card>

        <Card>
          <CardTitle className="text-base">PWA</CardTitle>
          <CardDescription>
            Instala BiblioScan desde el menú del navegador.
          </CardDescription>
        </Card>

        <Button variant="destructive" size="lg" className="w-full gap-2" onClick={logout}>
          <LogOut className="h-5 w-5" />
          Cerrar sesión
        </Button>
      </main>
    </>
  );
}
