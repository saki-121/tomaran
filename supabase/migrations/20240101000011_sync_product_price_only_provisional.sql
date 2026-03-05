-- =============================================================================
-- 単価確定時の連動: 未確定（0円/null）の納品スナップショットのみ更新
-- =============================================================================
-- ・商品マスタの unit_price 更新時、その商品を含む納品明細のうち
--   snapshot_unit_price が NULL または 0 の行（未確定データ）のみ、
--   マスタの最新単価・税率で一括更新する。
-- ・編集可（status = 'editable'）の納品に限る。請求済み（invoiced）は触らない。
-- ・既に単価確定済み（0円以外）のスナップショットは書き換えない。
-- ・請求書（invoices / invoice_items）は delivery_items を参照するだけで、
--   確定時にスナップショットをコピーしているため、本トリガーでは一切触れない。
-- =============================================================================

CREATE OR REPLACE FUNCTION public.sync_product_price_to_items()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF OLD.unit_price IS NOT DISTINCT FROM NEW.unit_price THEN
    RETURN NEW;
  END IF;

  -- 対象: 当該商品の納品明細のうち
  -- ・編集可の納品に属するもの
  -- ・スナップショットが未確定（NULL または 0）のもののみ
  -- 請求済み納品・確定済みスナップショットは一切更新しない
  UPDATE public.delivery_items di
  SET    snapshot_unit_price = NEW.unit_price,
         snapshot_tax_rate   = NEW.tax_rate
  FROM   public.deliveries d
  WHERE  di.product_id = NEW.id
    AND  di.delivery_id = d.id
    AND  d.status = 'editable'
    AND  (di.snapshot_unit_price IS NULL OR di.snapshot_unit_price = 0);

  RETURN NEW;
END;
$$;

-- トリガーは 20240101000010 で既に作成済みのため、関数の置き換えのみでよい
-- CREATE TRIGGER sync_price_on_product_update ...
