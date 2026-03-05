-- =============================================================================
-- Enhanced Price Sync: Complete 0円 elimination with invoice linkage
-- =============================================================================
-- ・商品マスタの単価更新時、未確定（0円/null）の納品明細を自動更新
-- ・請求書明細のうち、未確定（0円）かつ納品データと紐付いているものも更新
-- ・編集可能な納品のみ対象（請求済みはスナップショット保護）
-- ・既確定の単価は上書きしない（履歴保護）
-- =============================================================================

-- 既存トリガーを削除して再作成
DROP TRIGGER IF EXISTS sync_price_on_product_update ON public.products;

-- 関数を強化バージョンに置き換え
CREATE OR REPLACE FUNCTION public.sync_product_price_to_items()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF OLD.unit_price IS NOT DISTINCT FROM NEW.unit_price THEN
    RETURN NEW;
  END IF;

  -- 1. 納品明細の更新（編集可能な納品の未確定データのみ）
  UPDATE public.delivery_items di
  SET    snapshot_unit_price = NEW.unit_price,
         snapshot_tax_rate   = NEW.tax_rate
  FROM   public.deliveries d
  WHERE  di.product_id = NEW.id
    AND  di.delivery_id = d.id
    AND  d.status = 'editable'
    AND  (di.snapshot_unit_price IS NULL OR di.snapshot_unit_price = 0);

  -- 2. 請求書明細の更新（下書き状態の請求書のみ）
  -- 請求書明細は納品明細から生成されるが、0円のままの場合があるため
  UPDATE public.invoice_items ii
  SET    unit_price = NEW.unit_price,
         tax_rate   = NEW.tax_rate,
         tax_amount = CEIL(ii.quantity * NEW.unit_price * NEW.tax_rate),
         amount     = ii.quantity * NEW.unit_price
  FROM   public.invoices i
  WHERE  ii.product_name = (SELECT name FROM public.products WHERE id = NEW.id)
    AND  ii.invoice_id = i.id
    AND  i.status = 'draft'
    AND  (ii.unit_price = 0 OR ii.unit_price IS NULL);

  -- 3. 請求書の合計額を再計算（下書き状態のみ）
  UPDATE public.invoices inv
  SET    total_amount = sub.total_amount,
         tax_amount    = sub.tax_amount,
         grand_total   = sub.grand_total
  FROM   (
    SELECT 
      invoice_id,
      SUM(amount) as total_amount,
      SUM(tax_amount) as tax_amount,
      SUM(amount + tax_amount) as grand_total
    FROM public.invoice_items
    WHERE invoice_id IN (
      SELECT id FROM public.invoices WHERE status = 'draft'
    )
    GROUP BY invoice_id
  ) sub
  WHERE  inv.id = sub.invoice_id
    AND  inv.status = 'draft';

  RETURN NEW;
END;
$$;

-- トリガーを再作成
CREATE TRIGGER sync_price_on_product_update
AFTER UPDATE OF unit_price ON public.products
FOR EACH ROW EXECUTE FUNCTION public.sync_product_price_to_items();

-- 商品新規作成時にもトリガーを発動
CREATE TRIGGER sync_price_on_product_insert
AFTER INSERT ON public.products
FOR EACH ROW EXECUTE FUNCTION public.sync_product_price_to_items();
