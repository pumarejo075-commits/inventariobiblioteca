"use client";

import { useEffect, useState } from "react";
import { AppHeader } from "@/components/layout/app-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useSessionStore } from "@/hooks/use-session";
import type { InventorySession } from "@/types/database";
import { toast } from "sonner";
import { Plus, Check } from "lucide-react";

export default function SessionsPage() {
  const [sessions, setSessions] = useState<InventorySession[]>([]);
  const [name, setName] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const { activeSession, setActiveSession } = useSessionStore();

  const load = async () => {
    const res = await fetch("/api/sessions");
    setSessions(await res.json());
  };

  useEffect(() => {
    load();
  }, []);

  const createSession = async () => {
    if (!name.trim()) return;
    const res = await fetch("/api/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim() }),
    });
    const session = await res.json();
    if (res.ok) {
      toast.success("Sesión creada");
      setActiveSession(session);
      setName("");
      setShowCreate(false);
      load();
    } else {
      toast.error(session.error ?? "Error");
    }
  };

  const closeSession = async (id: string) => {
    await fetch(`/api/sessions/${id}/close`, { method: "POST" });
    toast.success("Sesión cerrada");
    if (activeSession?.id === id) setActiveSession(null);
    load();
  };

  return (
    <>
      <AppHeader title="Sesiones" />
      <main className="mx-auto max-w-lg space-y-4 px-4 py-4">
        <Button size="lg" className="w-full gap-2" onClick={() => setShowCreate(!showCreate)}>
          <Plus className="h-5 w-5" />
          Nueva sesión
        </Button>

        {showCreate && (
          <Card className="space-y-3">
            <Input
              placeholder="Ej. Auditoría Octubre 2025"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <Button className="w-full" onClick={createSession}>
              Crear e iniciar
            </Button>
          </Card>
        )}

        {sessions.map((s) => (
          <Card key={s.id} className="space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <CardTitle>{s.name}</CardTitle>
                <CardDescription>
                  {s.status === "active" ? "Activa" : s.status === "closed" ? "Cerrada" : "Borrador"}
                </CardDescription>
              </div>
              <Badge
                variant={
                  s.status === "active" ? "default" : s.status === "closed" ? "muted" : "warning"
                }
              >
                {s.status}
              </Badge>
            </div>
            <div className="flex gap-2">
              {s.status === "active" && (
                <>
                  <Button
                    className="flex-1"
                    variant={activeSession?.id === s.id ? "secondary" : "default"}
                    onClick={() => {
                      setActiveSession(s);
                      toast.success("Sesión activa seleccionada");
                    }}
                  >
                    {activeSession?.id === s.id ? (
                      <>
                        <Check className="h-4 w-4" /> Activa
                      </>
                    ) : (
                      "Usar sesión"
                    )}
                  </Button>
                  <Button variant="outline" onClick={() => closeSession(s.id)}>
                    Cerrar
                  </Button>
                </>
              )}
            </div>
          </Card>
        ))}
      </main>
    </>
  );
}
