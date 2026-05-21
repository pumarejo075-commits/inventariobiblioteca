"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScanLine } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("admin@biblioscan.local");
  const [password, setPassword] = useState("admin123");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Error de autenticación");
      return;
    }

    const redirect = searchParams.get("redirect") ?? "/";
    router.push(redirect);
    router.refresh();
  };

  if (process.env.NEXT_PUBLIC_BIBLIOSCAN_DEV_MODE === "true") {
    return (
      <div className="flex min-h-dvh flex-col justify-center bg-slate-950 px-6">
        <div className="mx-auto w-full max-w-sm text-center">
          <h1 className="text-3xl font-black text-slate-100">BiblioScan</h1>
          <p className="mt-2 text-sm text-amber-400">Modo demo (sin PostgreSQL)</p>
          <Button size="xl" className="mt-8 w-full" onClick={() => router.push("/")}>
            Entrar al inventario
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col justify-center bg-slate-950 px-6">
      <div className="mx-auto w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500">
            <ScanLine className="h-9 w-9 text-slate-950" />
          </div>
          <h1 className="text-3xl font-black text-slate-100">BiblioScan</h1>
          <p className="text-center text-sm text-slate-400">
            Inventario institucional · PostgreSQL
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-bold uppercase text-slate-500">
              Correo
            </label>
            <Input
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-bold uppercase text-slate-500">
              Contraseña
            </label>
            <Input
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {error && (
            <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">{error}</p>
          )}
          <Button type="submit" size="xl" className="w-full" disabled={loading}>
            {loading ? "Entrando..." : "Iniciar sesión"}
          </Button>
        </form>
        <p className="mt-4 text-center text-xs text-slate-500">
          Demo: admin@biblioscan.local / admin123
        </p>
      </div>
    </div>
  );
}
