-- Usuario demo: admin@biblioscan.local / admin123
-- Hash generado con bcrypt cost 10
INSERT INTO users (id, email, password_hash, full_name, role)
VALUES (
  'f0000000-0000-4000-8000-000000000001',
  'admin@biblioscan.local',
  '$2b$10$4NwTJdhxwz7/mGUlGMuB8..ALWN1oZHnG8ltpR/vMl4FW2dluex.W',
  'Administrador',
  'admin'
) ON CONFLICT (email) DO NOTHING;

INSERT INTO users (email, password_hash, full_name, role)
VALUES (
  'operador@biblioscan.local',
  '$2b$10$4NwTJdhxwz7/mGUlGMuB8..ALWN1oZHnG8ltpR/vMl4FW2dluex.W',
  'Operador Demo',
  'operator'
) ON CONFLICT (email) DO NOTHING;

INSERT INTO inventory_sessions (id, name, description, status, started_at, created_by)
VALUES (
  'a0000000-0000-4000-8000-000000000001',
  'Auditoría Octubre 2025',
  'Inventario físico biblioteca central',
  'active',
  NOW(),
  'f0000000-0000-4000-8000-000000000001'
) ON CONFLICT DO NOTHING;

-- Inventario completo (113 activos): scripts/seed-inventory.mjs al arrancar
