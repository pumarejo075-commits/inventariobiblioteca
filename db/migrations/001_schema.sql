-- BiblioScan — PostgreSQL schema (sin Supabase)

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TYPE app_role AS ENUM ('admin', 'operator', 'viewer');
CREATE TYPE scan_result AS ENUM ('found', 'duplicate', 'not_found', 'group_reconciled');
CREATE TYPE session_status AS ENUM ('draft', 'active', 'closed');
CREATE TYPE asset_status AS ENUM ('active', 'inactive', 'disposed', 'maintenance');

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  full_name TEXT,
  role app_role NOT NULL DEFAULT 'operator',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE inventory_locations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  code TEXT,
  parent_id UUID REFERENCES inventory_locations(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE inventory_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  code TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE inventory_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  status session_status NOT NULL DEFAULT 'draft',
  location_filter TEXT,
  started_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE inventory_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  barcode TEXT NOT NULL,
  clave TEXT NOT NULL,
  resguardo TEXT,
  description TEXT NOT NULL,
  brand TEXT,
  model TEXT,
  serial TEXT,
  status asset_status NOT NULL DEFAULT 'active',
  invoice_number TEXT,
  invoice_date DATE,
  depreciated_cost NUMERIC(14, 2),
  responsible_person TEXT,
  location TEXT,
  expected_quantity INTEGER NOT NULL DEFAULT 1 CHECK (expected_quantity >= 0),
  found_quantity INTEGER NOT NULL DEFAULT 0 CHECK (found_quantity >= 0),
  is_group BOOLEAN NOT NULL DEFAULT FALSE,
  category_id UUID REFERENCES inventory_categories(id),
  location_id UUID REFERENCES inventory_locations(id),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (barcode),
  UNIQUE (clave)
);

CREATE INDEX idx_inventory_items_barcode ON inventory_items(barcode);
CREATE INDEX idx_inventory_items_clave ON inventory_items(clave);
CREATE INDEX idx_inventory_items_description ON inventory_items USING gin(to_tsvector('spanish', description));
CREATE INDEX idx_inventory_items_location ON inventory_items(location);
CREATE INDEX idx_inventory_items_responsible ON inventory_items(responsible_person);

CREATE TABLE inventory_groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  parent_item_id UUID NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
  name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (parent_item_id)
);

CREATE TABLE inventory_group_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID NOT NULL REFERENCES inventory_groups(id) ON DELETE CASCADE,
  child_item_id UUID NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (group_id, child_item_id)
);

CREATE TABLE inventory_session_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES inventory_sessions(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
  expected_quantity INTEGER NOT NULL DEFAULT 0,
  found_quantity INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (session_id, item_id)
);

CREATE TABLE inventory_scans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES inventory_sessions(id) ON DELETE CASCADE,
  item_id UUID REFERENCES inventory_items(id) ON DELETE SET NULL,
  barcode TEXT NOT NULL,
  result scan_result NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  scanned_by UUID REFERENCES users(id),
  device_id TEXT,
  is_override BOOLEAN NOT NULL DEFAULT FALSE,
  notes TEXT,
  scanned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  synced_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_inventory_scans_session ON inventory_scans(session_id);
CREATE INDEX idx_inventory_scans_barcode ON inventory_scans(barcode);

CREATE TABLE inventory_imports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  filename TEXT NOT NULL,
  row_count INTEGER NOT NULL DEFAULT 0,
  imported_count INTEGER NOT NULL DEFAULT 0,
  skipped_count INTEGER NOT NULL DEFAULT 0,
  error_count INTEGER NOT NULL DEFAULT 0,
  column_mapping JSONB NOT NULL DEFAULT '{}'::jsonb,
  errors JSONB DEFAULT '[]'::jsonb,
  imported_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE inventory_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  user_id UUID REFERENCES users(id),
  payload JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE OR REPLACE VIEW inventory_reconciliation AS
SELECT
  i.id,
  i.barcode,
  i.clave,
  i.description,
  i.brand,
  i.model,
  i.location,
  i.responsible_person,
  i.expected_quantity,
  i.found_quantity,
  GREATEST(i.expected_quantity - i.found_quantity, 0) AS missing_quantity,
  GREATEST(i.found_quantity - i.expected_quantity, 0) AS excess_quantity,
  CASE
    WHEN i.expected_quantity = 0 THEN 0
    ELSE ROUND((i.found_quantity::numeric / i.expected_quantity::numeric) * 100, 2)
  END AS reconciliation_percent,
  i.is_group,
  i.status,
  i.updated_at
FROM inventory_items i;

CREATE OR REPLACE VIEW session_reconciliation AS
SELECT
  si.session_id,
  i.id AS item_id,
  i.barcode,
  i.clave,
  i.description,
  i.brand,
  i.model,
  i.location,
  si.expected_quantity,
  si.found_quantity,
  GREATEST(si.expected_quantity - si.found_quantity, 0) AS missing_quantity,
  GREATEST(si.found_quantity - si.expected_quantity, 0) AS excess_quantity,
  CASE
    WHEN si.expected_quantity = 0 THEN 0
    ELSE ROUND((si.found_quantity::numeric / NULLIF(si.expected_quantity, 0)::numeric) * 100, 2)
  END AS reconciliation_percent
FROM inventory_session_items si
JOIN inventory_items i ON i.id = si.item_id;

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER inventory_items_updated_at BEFORE UPDATE ON inventory_items
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER inventory_sessions_updated_at BEFORE UPDATE ON inventory_sessions
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER inventory_session_items_updated_at BEFORE UPDATE ON inventory_session_items
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
