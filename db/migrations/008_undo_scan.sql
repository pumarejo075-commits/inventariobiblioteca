-- Deshacer un escaneo: elimina el registro y revierte found_quantity si aplicaba

CREATE OR REPLACE FUNCTION undo_scan(p_scan_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_scan inventory_scans%ROWTYPE;
  v_group_children RECORD;
  v_qty INTEGER;
BEGIN
  SELECT * INTO v_scan FROM inventory_scans WHERE id = p_scan_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Escaneo no encontrado');
  END IF;

  v_qty := COALESCE(v_scan.quantity, 1);

  IF v_scan.result = 'found' AND v_scan.item_id IS NOT NULL THEN
    UPDATE inventory_session_items
    SET found_quantity = GREATEST(0, found_quantity - v_qty),
        updated_at = NOW()
    WHERE session_id = v_scan.session_id AND item_id = v_scan.item_id;

    UPDATE inventory_items
    SET found_quantity = GREATEST(0, found_quantity - v_qty),
        updated_at = NOW()
    WHERE id = v_scan.item_id;

  ELSIF v_scan.result = 'group_reconciled' AND v_scan.item_id IS NOT NULL THEN
    FOR v_group_children IN
      SELECT gi.child_item_id, gi.quantity
      FROM inventory_groups g
      JOIN inventory_group_items gi ON gi.group_id = g.id
      WHERE g.parent_item_id = v_scan.item_id
    LOOP
      UPDATE inventory_session_items
      SET found_quantity = GREATEST(0, found_quantity - v_group_children.quantity),
          updated_at = NOW()
      WHERE session_id = v_scan.session_id AND item_id = v_group_children.child_item_id;

      UPDATE inventory_items
      SET found_quantity = GREATEST(0, found_quantity - v_group_children.quantity),
          updated_at = NOW()
      WHERE id = v_group_children.child_item_id;
    END LOOP;

    UPDATE inventory_session_items
    SET found_quantity = GREATEST(0, found_quantity - 1),
        updated_at = NOW()
    WHERE session_id = v_scan.session_id AND item_id = v_scan.item_id;

    UPDATE inventory_items
    SET found_quantity = GREATEST(0, found_quantity - 1),
        updated_at = NOW()
    WHERE id = v_scan.item_id;
  END IF;

  DELETE FROM inventory_scans WHERE id = p_scan_id;

  RETURN jsonb_build_object('ok', true);
END;
$$ LANGUAGE plpgsql;
