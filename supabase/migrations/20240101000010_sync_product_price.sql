-- When a product's unit_price is updated, propagate the new price to
-- delivery_items that belong to editable deliveries only.
-- Invoiced deliveries are intentionally preserved as historical snapshots.

CREATE OR REPLACE FUNCTION public.sync_product_price_to_items()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF OLD.unit_price IS NOT DISTINCT FROM NEW.unit_price THEN
    RETURN NEW;
  END IF;

  UPDATE public.delivery_items di
  SET    snapshot_unit_price = NEW.unit_price
  FROM   public.deliveries d
  WHERE  di.product_id = NEW.id
    AND  di.delivery_id = d.id
    AND  d.status = 'editable';

  RETURN NEW;
END;
$$;

CREATE TRIGGER sync_price_on_product_update
AFTER UPDATE OF unit_price ON public.products
FOR EACH ROW EXECUTE FUNCTION public.sync_product_price_to_items();
