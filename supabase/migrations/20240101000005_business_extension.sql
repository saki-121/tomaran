-- =============================================================================
-- MIGRATION 005: Business Extension
-- =============================================================================
-- Changes:
--   1. companies    — address/phone columns; closing_day allows 99 (月末)
--   2. products     — status enum ('active'|'provisional'), unit_price nullable
--   3. delivery_items — snapshot_unit_price nullable (provisional products)
--   4. deliveries   — created_by, role columns
--   5. invoices     — period_from/period_to/totals columns + unique index
--   6. own_company_profiles — issuer info displayed on invoices
--   7. calculate_closing_date updated to support closing_day = 99
--   8. snapshot_delivery_item_prices updated for provisional products
--   9. generate_invoices_for_date() — daily batch function
-- =============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. companies
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS address text,
  ADD COLUMN IF NOT EXISTS phone   text;

-- Allow closing_day = 99 (= 月末, month-end)
ALTER TABLE public.companies
  DROP CONSTRAINT companies_closing_day_check;

ALTER TABLE public.companies
  ADD CONSTRAINT companies_closing_day_check
  CHECK (closing_day BETWEEN 1 AND 31 OR closing_day = 99);

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. products — status enum + nullable unit_price
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.products
  ALTER COLUMN unit_price DROP NOT NULL;

ALTER TABLE public.products
  DROP CONSTRAINT products_unit_price_check;

ALTER TABLE public.products
  ADD CONSTRAINT products_unit_price_check
  CHECK (unit_price IS NULL OR unit_price >= 0);

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active'
  CHECK (status IN ('active', 'provisional'));

-- Back-fill: existing inactive products → provisional
UPDATE public.products SET status = 'provisional' WHERE active_flag = false;

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. delivery_items — allow null snapshot_unit_price (provisional products)
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.delivery_items
  ALTER COLUMN snapshot_unit_price DROP NOT NULL;

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. deliveries — created_by, role
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.deliveries
  ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES public.users(id),
  ADD COLUMN IF NOT EXISTS role       text CHECK (role IN ('field', 'office', 'admin'));

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. invoices — period columns, totals, unique index
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.invoices
  ADD COLUMN IF NOT EXISTS period_from  date,
  ADD COLUMN IF NOT EXISTS period_to    date,
  ADD COLUMN IF NOT EXISTS total_amount numeric(12,2),
  ADD COLUMN IF NOT EXISTS tax_amount   numeric(12,2),
  ADD COLUMN IF NOT EXISTS grand_total  numeric(12,2);

-- One draft per company per period (prevents duplicate generation)
CREATE UNIQUE INDEX IF NOT EXISTS idx_invoices_company_period
  ON public.invoices (company_id, period_from, period_to)
  WHERE period_from IS NOT NULL AND period_to IS NOT NULL;

-- ─────────────────────────────────────────────────────────────────────────────
-- 6. own_company_profiles — issuer info for invoices
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.own_company_profiles (
  id                          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id                   uuid        NOT NULL UNIQUE
                                          REFERENCES public.tenants(id) ON DELETE CASCADE,
  company_name                text,
  address                     text,
  phone                       text,
  invoice_registration_number text,
  created_at                  timestamptz NOT NULL DEFAULT now(),
  updated_at                  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_own_company_profiles_tenant
  ON public.own_company_profiles (tenant_id);

ALTER TABLE public.own_company_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.own_company_profiles FORCE ROW LEVEL SECURITY;

-- Members can view
CREATE POLICY ocp_select ON public.own_company_profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_tenants ut
      WHERE ut.user_id = auth.uid() AND ut.tenant_id = own_company_profiles.tenant_id
    )
  );

-- Only owners/admins can write
CREATE POLICY ocp_write ON public.own_company_profiles
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_tenants ut
      WHERE ut.user_id   = auth.uid()
        AND ut.tenant_id = own_company_profiles.tenant_id
        AND ut.role IN ('owner', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_tenants ut
      WHERE ut.user_id   = auth.uid()
        AND ut.tenant_id = own_company_profiles.tenant_id
        AND ut.role IN ('owner', 'admin')
    )
  );

CREATE TRIGGER ocp_set_updated_at
  BEFORE UPDATE ON public.own_company_profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER ocp_auto_set_tenant_id
  BEFORE INSERT ON public.own_company_profiles
  FOR EACH ROW EXECUTE FUNCTION public.auto_set_tenant_id();

CREATE TRIGGER ocp_prevent_tenant_change
  BEFORE UPDATE ON public.own_company_profiles
  FOR EACH ROW EXECUTE FUNCTION public.prevent_tenant_id_change();

-- ─────────────────────────────────────────────────────────────────────────────
-- 7. calculate_closing_date — support closing_day = 99 (月末)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.calculate_closing_date(
  p_closing_day int,
  p_base_date   date
)
RETURNS date
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
AS $$
DECLARE
  v_year          int;
  v_month         int;
  v_last_day      int;
  v_effective_day int;
  v_closing_date  date;
BEGIN
  -- 99 = 月末 (month-end); all other values must be 1–31
  IF p_closing_day <> 99 AND p_closing_day NOT BETWEEN 1 AND 31 THEN
    RAISE EXCEPTION 'calculate_closing_date: closing_day must be 1–31 or 99 (月末), got %',
      p_closing_day;
  END IF;

  v_year  := EXTRACT(YEAR  FROM p_base_date)::int;
  v_month := EXTRACT(MONTH FROM p_base_date)::int;

  -- Last calendar day of the month
  v_last_day := EXTRACT(
    DAY FROM (DATE_TRUNC('month', p_base_date) + INTERVAL '1 month' - INTERVAL '1 day')
  )::int;

  -- 99 → treat as 31 for clamping → always yields last day of month
  v_effective_day := LEAST(
    CASE WHEN p_closing_day = 99 THEN 31 ELSE p_closing_day END,
    v_last_day
  );

  v_closing_date := MAKE_DATE(v_year, v_month, v_effective_day);

  RETURN public.prev_business_day(v_closing_date);
END;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 8. snapshot_delivery_item_prices — allow provisional products (null price)
-- ─────────────────────────────────────────────────────────────────────────────

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

  -- Active products with a price → snapshot the price
  -- Provisional products (or null unit_price) → null snapshot; excluded from billing
  NEW.snapshot_unit_price := CASE
    WHEN v_product.status = 'active' AND v_product.unit_price IS NOT NULL
      THEN v_product.unit_price
    ELSE NULL
  END;
  NEW.snapshot_tax_rate := v_product.tax_rate;

  RETURN NEW;
END;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 9. generate_invoices_for_date() — daily batch invoice generation
--
-- For every active company whose closing date equals p_date:
--   • Calculates period_from / period_to
--   • Skips if invoice already exists (idempotent)
--   • Skips if no billable delivery items
--   • Creates draft invoice + invoice_items
--
-- Returns one row per company processed (created | skipped | no_items).
-- SECURITY DEFINER: runs as owner to access all tenants without RLS.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.generate_invoices_for_date(
  p_date date DEFAULT CURRENT_DATE
)
RETURNS TABLE(
  r_tenant_id  uuid,
  r_company_id uuid,
  r_invoice_id uuid,
  r_result     text   -- 'created' | 'skipped' | 'no_items'
)
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_company        RECORD;
  v_closing_date   date;
  v_period_from    date;
  v_period_to      date;
  v_prev_month_day date;
  v_payment_due    date;
  v_invoice_id     uuid;
  v_existing_id    uuid;
  v_subtotal       numeric(12,2);
  v_tax            numeric(12,2);
  v_item_count     int;
BEGIN
  FOR v_company IN
    SELECT c.id, c.tenant_id, c.closing_day, c.payment_type
    FROM   public.companies c
    WHERE  c.active_flag = true
  LOOP
    -- Is today this company's closing date?
    v_closing_date := calculate_closing_date(v_company.closing_day, p_date);
    CONTINUE WHEN v_closing_date <> p_date;

    -- period_to = closing date
    v_period_to := p_date;

    -- period_from = day after the previous month's closing date
    v_prev_month_day := date_trunc('month', p_date) - INTERVAL '1 day';
    v_period_from    := calculate_closing_date(v_company.closing_day, v_prev_month_day)
                        + INTERVAL '1 day';

    v_payment_due := calculate_payment_due_date(v_closing_date, v_company.payment_type);

    -- Idempotency: skip if already exists
    SELECT id INTO v_existing_id
    FROM   public.invoices i
    WHERE  i.company_id  = v_company.id
      AND  i.period_from = v_period_from
      AND  i.period_to   = v_period_to
    LIMIT 1;

    IF v_existing_id IS NOT NULL THEN
      r_tenant_id  := v_company.tenant_id;
      r_company_id := v_company.id;
      r_invoice_id := v_existing_id;
      r_result     := 'skipped';
      RETURN NEXT;
      CONTINUE;
    END IF;

    -- Count billable items (provisional products excluded via null snapshot)
    SELECT COUNT(*) INTO v_item_count
    FROM   public.delivery_items di
    JOIN   public.deliveries     d  ON d.id = di.delivery_id
    WHERE  d.company_id    = v_company.id
      AND  d.tenant_id     = v_company.tenant_id
      AND  d.status        = 'editable'
      AND  d.delivery_date BETWEEN v_period_from AND v_period_to
      AND  di.snapshot_unit_price IS NOT NULL;

    IF v_item_count = 0 THEN
      r_tenant_id  := v_company.tenant_id;
      r_company_id := v_company.id;
      r_invoice_id := NULL;
      r_result     := 'no_items';
      RETURN NEXT;
      CONTINUE;
    END IF;

    -- Calculate totals (tax rate per item, ceiling rounding)
    SELECT
      COALESCE(SUM(di.snapshot_unit_price * di.quantity), 0),
      COALESCE(SUM(CEIL(di.snapshot_unit_price * di.quantity * di.snapshot_tax_rate)), 0)
    INTO v_subtotal, v_tax
    FROM   public.delivery_items di
    JOIN   public.deliveries     d  ON d.id = di.delivery_id
    WHERE  d.company_id    = v_company.id
      AND  d.tenant_id     = v_company.tenant_id
      AND  d.status        = 'editable'
      AND  d.delivery_date BETWEEN v_period_from AND v_period_to
      AND  di.snapshot_unit_price IS NOT NULL;

    -- Create draft invoice
    INSERT INTO public.invoices (
      tenant_id,    company_id,
      closing_date, payment_due_date,
      period_from,  period_to,
      status,
      total_amount, tax_amount, grand_total
    ) VALUES (
      v_company.tenant_id, v_company.id,
      v_closing_date,      v_payment_due,
      v_period_from,       v_period_to,
      'draft',
      v_subtotal, v_tax, v_subtotal + v_tax
    )
    RETURNING id INTO v_invoice_id;

    -- Create invoice_items (one row per delivery_item, active products only)
    INSERT INTO public.invoice_items (
      tenant_id,    invoice_id,
      delivery_id,  site_name, delivery_date,
      product_name, quantity,
      unit_price,   tax_rate,  tax_amount, amount
    )
    SELECT
      v_company.tenant_id,
      v_invoice_id,
      d.id,
      s.name,
      d.delivery_date,
      p.name || COALESCE(' ' || NULLIF(TRIM(p.spec), ''), ''),
      di.quantity,
      di.snapshot_unit_price,
      di.snapshot_tax_rate,
      CEIL(di.snapshot_unit_price * di.quantity * di.snapshot_tax_rate),
      di.snapshot_unit_price * di.quantity
    FROM   public.delivery_items di
    JOIN   public.deliveries d ON d.id = di.delivery_id
    JOIN   public.sites      s ON s.id = d.site_id
    JOIN   public.products   p ON p.id = di.product_id
    WHERE  d.company_id    = v_company.id
      AND  d.tenant_id     = v_company.tenant_id
      AND  d.status        = 'editable'
      AND  d.delivery_date BETWEEN v_period_from AND v_period_to
      AND  di.snapshot_unit_price IS NOT NULL
    ORDER  BY d.delivery_date, s.name, p.name;

    r_tenant_id  := v_company.tenant_id;
    r_company_id := v_company.id;
    r_invoice_id := v_invoice_id;
    r_result     := 'created';
    RETURN NEXT;
  END LOOP;
END;
$$;
