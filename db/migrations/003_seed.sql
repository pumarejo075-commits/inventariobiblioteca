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

INSERT INTO inventory_items (
  barcode, clave, description, brand, model, serial, expected_quantity, found_quantity,
  responsible_person, location, resguardo
) VALUES
  ('22730531370000010001', '227 3053 137 000001 0001', 'MESA PARA COMPUTADORA', 'S/M', '1.60X.60X.75MTS', 'S/N', 34, 0, 'TARIN MADRID HIATLAY', 'BIBLIOTECA DES DE LA SALUD', '189'),
  ('DELL-LAPTOP-001', 'DELL-LAPTOP-001', 'COMPUTADORA DELL', 'DELL', 'Latitude 5420', 'SN-DELL-001', 20, 0, 'Juan Pérez', 'Sala de cómputo', '100'),
  ('SILLA-MADERA-001', 'SILLA-MADERA-001', 'SILLA MADERA', 'Institucional', 'Estándar', 'S/N', 20, 0, 'María López', 'Piso 2', '101')
ON CONFLICT (barcode) DO NOTHING;

INSERT INTO inventory_session_items (session_id, item_id, expected_quantity, found_quantity)
SELECT
  'a0000000-0000-4000-8000-000000000001',
  i.id,
  i.expected_quantity,
  0
FROM inventory_items i
ON CONFLICT (session_id, item_id) DO NOTHING;
