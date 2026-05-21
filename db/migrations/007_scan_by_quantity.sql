-- Escaneo por cantidad: mismo código suma +1 hasta excedente; duplicado solo en grupos ya reconciliados

CREATE OR REPLACE FUNCTION process_scan(
  p_session_id UUID,
  p_barcode TEXT,
  p_scanned_by UUID DEFAULT NULL,
  p_device_id TEXT DEFAULT NULL,
  p_force_override BOOLEAN DEFAULT FALSE
)
RETURNS JSONB AS $$
DECLARE
  v_item inventory_items%ROWTYPE;
  v_session inventory_sessions%ROWTYPE;
  v_session_item inventory_session_items%ROWTYPE;
  v_existing_group_scan UUID;
  v_result scan_result;
  v_group_children RECORD;
  v_qty INTEGER := 1;
  v_key TEXT;
BEGIN
  v_key := normalize_barcode_key(p_barcode);

  SELECT * INTO v_session FROM inventory_sessions WHERE id = p_session_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('result', 'not_found', 'message', 'Inventario no configurado');
  END IF;

  SELECT * INTO v_item FROM inventory_items
  WHERE normalize_barcode_key(barcode) = v_key
     OR normalize_barcode_key(clave) = v_key
     OR barcode = trim(p_barcode)
     OR clave = trim(p_barcode)
  LIMIT 1;

  IF NOT FOUND THEN
    INSERT INTO inventory_scans (session_id, barcode, result, scanned_by, device_id)
    VALUES (p_session_id, v_key, 'not_found', p_scanned_by, p_device_id);
    RETURN jsonb_build_object(
      'result', 'not_found',
      'barcode', v_key,
      'message', 'Activo no registrado'
    );
  END IF;

  INSERT INTO inventory_session_items (session_id, item_id, expected_quantity, found_quantity)
  VALUES (p_session_id, v_item.id, v_item.expected_quantity, 0)
  ON CONFLICT (session_id, item_id) DO NOTHING;

  SELECT * INTO v_session_item FROM inventory_session_items
  WHERE session_id = p_session_id AND item_id = v_item.id;

  -- Grupos: un solo escaneo por sesión (evita duplicar cantidades de hijos)
  IF v_item.is_group AND NOT p_force_override THEN
    SELECT id INTO v_existing_group_scan FROM inventory_scans
    WHERE session_id = p_session_id
      AND item_id = v_item.id
      AND result = 'group_reconciled'
    LIMIT 1;

    IF FOUND THEN
      INSERT INTO inventory_scans (session_id, item_id, barcode, result, scanned_by, device_id)
      VALUES (p_session_id, v_item.id, v_item.barcode, 'duplicate', p_scanned_by, p_device_id);
      RETURN jsonb_build_object(
        'result', 'duplicate',
        'message', 'Paquete ya escaneado',
        'item', jsonb_build_object(
          'id', v_item.id,
          'barcode', v_item.barcode,
          'clave', v_item.clave,
          'description', v_item.description,
          'brand', v_item.brand,
          'model', v_item.model,
          'expected_quantity', v_session_item.expected_quantity,
          'found_quantity', v_session_item.found_quantity,
          'missing_quantity', GREATEST(v_session_item.expected_quantity - v_session_item.found_quantity, 0),
          'excess_quantity', GREATEST(v_session_item.found_quantity - v_session_item.expected_quantity, 0)
        )
      );
    END IF;
  END IF;

  IF v_item.is_group THEN
    v_result := 'group_reconciled';
    FOR v_group_children IN
      SELECT gi.child_item_id, gi.quantity, ci.*
      FROM inventory_groups g
      JOIN inventory_group_items gi ON gi.group_id = g.id
      JOIN inventory_items ci ON ci.id = gi.child_item_id
      WHERE g.parent_item_id = v_item.id
    LOOP
      INSERT INTO inventory_session_items (session_id, item_id, expected_quantity, found_quantity)
      VALUES (p_session_id, v_group_children.child_item_id, v_group_children.expected_quantity, 0)
      ON CONFLICT (session_id, item_id) DO NOTHING;

      UPDATE inventory_session_items
      SET found_quantity = found_quantity + v_group_children.quantity
      WHERE session_id = p_session_id AND item_id = v_group_children.child_item_id;

      UPDATE inventory_items
      SET found_quantity = found_quantity + v_group_children.quantity
      WHERE id = v_group_children.child_item_id;
    END LOOP;

    UPDATE inventory_session_items
    SET found_quantity = found_quantity + 1
    WHERE session_id = p_session_id AND item_id = v_item.id;

    UPDATE inventory_items SET found_quantity = found_quantity + 1 WHERE id = v_item.id;
  ELSE
    v_result := 'found';
    v_qty := 1;
    UPDATE inventory_session_items
    SET found_quantity = found_quantity + v_qty
    WHERE session_id = p_session_id AND item_id = v_item.id;

    UPDATE inventory_items
    SET found_quantity = found_quantity + v_qty
    WHERE id = v_item.id;
  END IF;

  INSERT INTO inventory_scans (
    session_id, item_id, barcode, result, quantity, scanned_by, device_id, is_override
  ) VALUES (
    p_session_id, v_item.id, v_item.barcode, v_result, v_qty, p_scanned_by, p_device_id, p_force_override
  );

  SELECT * INTO v_session_item FROM inventory_session_items
  WHERE session_id = p_session_id AND item_id = v_item.id;

  RETURN jsonb_build_object(
    'result', v_result::text,
    'item', jsonb_build_object(
      'id', v_item.id,
      'barcode', v_item.barcode,
      'clave', v_item.clave,
      'description', v_item.description,
      'brand', v_item.brand,
      'model', v_item.model,
      'expected_quantity', v_session_item.expected_quantity,
      'found_quantity', v_session_item.found_quantity,
      'missing_quantity', GREATEST(v_session_item.expected_quantity - v_session_item.found_quantity, 0),
      'excess_quantity', GREATEST(v_session_item.found_quantity - v_session_item.expected_quantity, 0)
    )
  );
END;
$$ LANGUAGE plpgsql;
