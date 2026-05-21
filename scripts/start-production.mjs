#!/usr/bin/env node
/**
 * Arranque en Railway: migraciones + servidor Next.js standalone
 */
import { spawn } from "child_process";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

function run(cmd, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, {
      cwd: root,
      stdio: "inherit",
      env: process.env,
    });
    child.on("close", (code) => (code === 0 ? resolve() : reject(new Error(`${cmd} exit ${code}`))));
  });
}

console.log("[BiblioScan] Aplicando migraciones PostgreSQL...");
await run("node", ["scripts/db-migrate.mjs"]);

console.log("[BiblioScan] Cargando inventario UACH...");
await run("node", ["scripts/seed-inventory.mjs"]);

console.log("[BiblioScan] Iniciando servidor...");
await run("node", ["server.js"]);
