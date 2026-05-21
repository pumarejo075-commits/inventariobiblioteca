#!/usr/bin/env node
import { readFileSync, readdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import pg from "pg";

const __dirname = dirname(fileURLToPath(import.meta.url));

try {
  const envPath = join(__dirname, "../.env.local");
  const env = readFileSync(envPath, "utf8");
  for (const line of env.split("\n")) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (m && !process.env[m[1].trim()]) {
      process.env[m[1].trim()] = m[2].trim();
    }
  }
} catch {
  /* no .env.local */
}

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL required");
  process.exit(1);
}

function sslConfig(connectionString) {
  if (process.env.DATABASE_SSL === "true") return { rejectUnauthorized: false };
  if (
    connectionString.includes("sslmode=require") ||
    connectionString.includes("railway.app") ||
    connectionString.includes("rlwy.net")
  ) {
    return { rejectUnauthorized: false };
  }
  return undefined;
}

const client = new pg.Client({
  connectionString: url,
  ssl: sslConfig(url),
});
await client.connect();

await client.query(`
  CREATE TABLE IF NOT EXISTS schema_migrations (
    id SERIAL PRIMARY KEY,
    filename TEXT UNIQUE NOT NULL,
    applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );
`);

const dir = join(__dirname, "../db/migrations");
const files = readdirSync(dir).filter((f) => f.endsWith(".sql")).sort();

for (const file of files) {
  const { rows } = await client.query(
    "SELECT 1 FROM schema_migrations WHERE filename = $1",
    [file]
  );
  if (rows.length > 0) {
    console.log(`⊘ ${file} (ya aplicada)`);
    continue;
  }

  const sql = readFileSync(join(dir, file), "utf8");
  console.log(`→ ${file}`);
  try {
    await client.query("BEGIN");
    await client.query(sql);
    await client.query("INSERT INTO schema_migrations (filename) VALUES ($1)", [
      file,
    ]);
    await client.query("COMMIT");
    console.log("  ✓");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(`  ✗ ${err.message}`);
    throw err;
  }
}

await client.end();
console.log("Migraciones completadas.");
