/**
 * Convierte fechas del Excel (serial numérico o texto) a ISO YYYY-MM-DD para PostgreSQL.
 */
export function parseExcelDateValue(value: unknown): string | null {
  if (value == null || value === "") return null;

  if (typeof value === "number" && Number.isFinite(value)) {
    return excelSerialToIso(value);
  }

  const raw = String(value).trim();
  if (!raw) return null;

  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) return raw.slice(0, 10);

  const dmy = raw.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (dmy) {
    const [, d, m, y] = dmy;
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }

  const n = Number(raw);
  if (Number.isFinite(n) && n > 1000) {
    return excelSerialToIso(n);
  }

  return null;
}

function excelSerialToIso(serial: number): string | null {
  if (serial < 1) return null;
  const ms = Math.round((serial - 25569) * 86400 * 1000);
  const date = new Date(ms);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString().slice(0, 10);
}
