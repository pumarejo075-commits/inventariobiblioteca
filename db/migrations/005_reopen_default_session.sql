-- La sesión por defecto debe permanecer activa para escanear (evita "Session is closed")
UPDATE inventory_sessions
SET status = 'active',
    closed_at = NULL,
    updated_at = NOW()
WHERE id = 'a0000000-0000-4000-8000-000000000001';
