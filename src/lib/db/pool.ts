import { Pool } from "pg";

let pool: Pool | null = null;

export function getPool() {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error("DATABASE_URL is not set");
    }
    const needsSsl =
      process.env.DATABASE_SSL === "true" ||
      connectionString.includes("sslmode=require") ||
      connectionString.includes("railway.app") ||
      connectionString.includes("rlwy.net");

    pool = new Pool({
      connectionString,
      max: 10,
      ssl: needsSsl ? { rejectUnauthorized: false } : undefined,
    });
  }
  return pool;
}

export async function query(text: string, params?: unknown[]) {
  const result = await getPool().query(text, params);
  return result;
}
