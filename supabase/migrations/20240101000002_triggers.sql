-- =============================================================================
-- MIGRATION 002: Triggers
-- All invariants that must be enforced at write time live here as triggers.
-- =============================================================================

-- =============================================================================
-- 1. SNAPSHOT: delivery_item prices
--    BEFORE INSERT on delivery_items — always overwrite snapshot fields from
--    the product master, regardless of what the client sends.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.snapshot_delivery_item_prices()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  v_product public.products%ROWTYPE;
BEGIN
  SELECT * INTO v_product
  FROM   public.products
  WHERE  id = NEW.product_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'snapshot_delivery_item_prices: product not found (id=%)',
      NEW.product_id;
  END IF;

  IF NOT v_product.active_flag THEN
    RAISE EXCEPTION 'snapshot_delivery_item_prices: product "%" is inactive and cannot be added to a delivery',
      v_product.name;
  END IF;

  -- Override with authoritative values from product master
  NEW.snapshot_unit_price := v_product.unit_price;
  NEW.snapshot_tax_rate   := v_product.tax_rate;

  RETURN NEW;
END;
$$;

CREATE TRIGGER delivery_items_snapshot_prices
BEFORE INSERT ON public.delivery_items
FOR EACH ROW
EXECUTE FUNCTION public.snapshot_delivery_item_prices();

-- =============================================================================
-- 2. IMMUTABILITY: invoices
--    Block UPDATE and DELETE once status = 'confirmed'.
--    This trigger is intentionally NOT SECURITY DEFINER — it fires even for
--    superusers accessing through the public API.
--    The confirm_invoice() function runs when OLD.status = 'draft', so it is
--    allowed through. After that, every mutation is rejected.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.enforce_invoice_immutability()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
BEGIN
  IF OLD.status = 'confirmed' THEN
    RAISE EXCEPTION
      'Immutability violation: confirmed invoice "%" (id=%) cannot be %ed. '
      'Confirmed invoices are permanently sealed.',
      COALESCE(OLD.invoice_number, '(draft)'), OLD.id, LOWER(TG_OP);
  END IF;

  -- Allow the operation
  RETURN CASE TG_OP WHEN 'DELETE' THEN OLD ELSE NEW END;
END;
$$;

CREATE TRIGGER invoices_prevent_update_when_confirmed
BEFORE UPDATE ON public.invoices
FOR EACH ROW
EXECUTE FUNCTION public.enforce_invoice_immutability();

CREATE TRIGGER invoices_prevent_delete_when_confirmed
BEFORE DELETE ON public.invoices
FOR EACH ROW
EXECUTE FUNCTION public.enforce_invoice_immutability();

-- =============================================================================
-- 3. IMMUTABILITY: invoice_items
--    Block INSERT, UPDATE, DELETE on items whose parent invoice is confirmed.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.enforce_invoice_items_immutability()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  v_invoice_id   uuid;
  v_invoice_status text;
BEGIN
  v_invoice_id := COALESCE(
    NULLIF(TG_OP, 'INSERT') -- on DELETE/UPDATE use OLD
    , NULL
  );

  -- Resolve the invoice_id depending on operation
  v_invoice_id := CASE TG_OP
    WHEN 'DELETE' THEN OLD.invoice_id
    ELSE NEW.invoice_id           -- INSERT and UPDATE
  END;

  SELECT status INTO v_invoice_status
  FROM   public.invoices
  WHERE  id = v_invoice_id;

  IF v_invoice_status = 'confirmed' THEN
    RAISE EXCEPTION
      'Immutability violation: cannot % items of confirmed invoice (id=%)',
      LOWER(TG_OP), v_invoice_id;
  END IF;

  RETURN CASE TG_OP WHEN 'DELETE' THEN OLD ELSE NEW END;
END;
$$;

CREATE TRIGGER invoice_items_prevent_change_when_confirmed
BEFORE INSERT OR UPDATE OR DELETE ON public.invoice_items
FOR EACH ROW
EXECUTE FUNCTION public.enforce_invoice_items_immutability();

-- =============================================================================
-- 4. TENANT_ID AUTO-SET
--    BEFORE INSERT on every business table — if tenant_id is NULL, fall back
--    to the session variable set by set_tenant_context() / app layer.
--    If neither is available, raise an error.
--    Note: application code should always supply tenant_id explicitly; this
--    trigger is a safety net and audit backstop.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.auto_set_tenant_id()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  v_setting text;
BEGIN
  -- Already set — nothing to do
  IF NEW.tenant_id IS NOT NULL THEN
    RETURN NEW;
  END IF;

  v_setting := current_setting('app.current_tenant_id', /* missing_ok */ true);

  IF v_setting IS NULL OR v_setting = '' THEN
    RAISE EXCEPTION
      'auto_set_tenant_id: tenant_id is required for %. '
      'Provide it explicitly or call set_tenant_context() first.',
      TG_TABLE_NAME;
  END IF;

  NEW.tenant_id := v_setting::uuid;
  RETURN NEW;
END;
$$;

-- Apply to every business table that carries tenant_id
DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'companies', 'sites', 'products', 'bank_accounts',
    'deliveries', 'delivery_items',
    'invoices', 'invoice_items'
  ]
  LOOP
    EXECUTE format(
      'CREATE TRIGGER %I_auto_set_tenant_id
       BEFORE INSERT ON public.%I
       FOR EACH ROW EXECUTE FUNCTION public.auto_set_tenant_id()',
      t, t
    );
  END LOOP;
END;
$$;

-- =============================================================================
-- 5. AUTO-UPDATE updated_at
-- =============================================================================

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER products_set_updated_at
BEFORE UPDATE ON public.products
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

-- =============================================================================
-- 6. MIRROR: auth.users → public.users
--    Automatically creates a public.users row when a new Supabase auth user
--    is registered, and removes it on deletion.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, display_name)
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data ->> 'display_name',
      NEW.raw_user_meta_data ->> 'full_name',
      split_part(NEW.email, '@', 1)  -- fallback: email username
    )
  )
  ON CONFLICT (id) DO NOTHING;  -- idempotent in case of replay
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_auth_user();

-- =============================================================================
-- 7. GUARD: prevent delivery_items modification on invoiced deliveries
-- =============================================================================

CREATE OR REPLACE FUNCTION public.guard_delivery_edit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  v_delivery_id uuid;
  v_status      text;
BEGIN
  v_delivery_id := CASE TG_OP WHEN 'DELETE' THEN OLD.delivery_id ELSE NEW.delivery_id END;

  SELECT status INTO v_status
  FROM   public.deliveries
  WHERE  id = v_delivery_id;

  IF v_status = 'invoiced' THEN
    RAISE EXCEPTION
      'guard_delivery_edit: delivery % is already invoiced and its items cannot be changed',
      v_delivery_id;
  END IF;

  RETURN CASE TG_OP WHEN 'DELETE' THEN OLD ELSE NEW END;
END;
$$;

CREATE TRIGGER delivery_items_guard_invoiced_status
BEFORE INSERT OR UPDATE OR DELETE ON public.delivery_items
FOR EACH ROW
EXECUTE FUNCTION public.guard_delivery_edit();
