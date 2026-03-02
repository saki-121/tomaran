-- =============================================================================
-- MIGRATION 001: Database Functions
-- All business logic that must be guaranteed at DB level lives here.
-- =============================================================================

-- =============================================================================
-- HOLIDAY / BUSINESS-DAY HELPERS
-- =============================================================================

-- Placeholder — replace RETURN FALSE with a holidays-table lookup.
CREATE OR REPLACE FUNCTION public.is_holiday(p_date date)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
AS $$
BEGIN
  -- TODO: Populate public.holidays and change to:
  -- RETURN EXISTS (SELECT 1 FROM public.holidays WHERE date = p_date);
  RETURN FALSE;
END;
$$;

-- Walk backwards until we land on a weekday that is not a holiday.
CREATE OR REPLACE FUNCTION public.prev_business_day(p_date date)
RETURNS date
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
AS $$
DECLARE
  v_date date := p_date;
BEGIN
  WHILE EXTRACT(DOW FROM v_date) IN (0, 6) -- 0=Sun, 6=Sat
     OR public.is_holiday(v_date)
  LOOP
    v_date := v_date - INTERVAL '1 day';
  END LOOP;
  RETURN v_date;
END;
$$;

-- =============================================================================
-- CLOSING DATE CALCULATION
-- calculate_closing_date(closing_day, base_date) → date
--
-- Rules:
--   • closing_day is clamped to the last day of base_date's month.
--   • If the resulting date falls on a weekend or holiday, roll back to the
--     nearest preceding business day.
-- =============================================================================

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
  v_year         int;
  v_month        int;
  v_last_day     int;
  v_effective_day int;
  v_closing_date  date;
BEGIN
  IF p_closing_day NOT BETWEEN 1 AND 31 THEN
    RAISE EXCEPTION 'closing_day must be between 1 and 31, got %', p_closing_day;
  END IF;

  v_year  := EXTRACT(YEAR  FROM p_base_date)::int;
  v_month := EXTRACT(MONTH FROM p_base_date)::int;

  -- Last calendar day of the month
  v_last_day := EXTRACT(
    DAY FROM (DATE_TRUNC('month', p_base_date) + INTERVAL '1 month' - INTERVAL '1 day')
  )::int;

  -- Clamp: e.g. closing_day=31 in February → 28/29
  v_effective_day := LEAST(p_closing_day, v_last_day);

  v_closing_date := MAKE_DATE(v_year, v_month, v_effective_day);

  -- Adjust for weekends / holidays
  RETURN public.prev_business_day(v_closing_date);
END;
$$;

-- =============================================================================
-- PAYMENT DUE DATE CALCULATION
-- =============================================================================

CREATE OR REPLACE FUNCTION public.calculate_payment_due_date(
  p_closing_date date,
  p_payment_type text
)
RETURNS date
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
AS $$
BEGIN
  CASE p_payment_type
    WHEN 'after_30_days' THEN
      RETURN p_closing_date + INTERVAL '30 days';

    WHEN 'next_month_end' THEN
      -- First day of the month after next, minus one day = last day of next month
      RETURN (
        DATE_TRUNC('month', p_closing_date) + INTERVAL '2 months' - INTERVAL '1 day'
      )::date;

    ELSE
      RAISE EXCEPTION 'Unknown payment_type: "%". Expected after_30_days or next_month_end.',
        p_payment_type;
  END CASE;
END;
$$;

-- =============================================================================
-- INVOICE NUMBER GENERATION
-- Format: YYYY-NNNN  (e.g. 2024-0001)
-- Strategy: UPDATE … RETURNING on a dedicated sequences table with an implicit
--           row-level lock — completely race-condition safe, no advisory locks needed.
-- SECURITY DEFINER: bypasses RLS on invoice_number_sequences (users never touch it).
-- =============================================================================

CREATE OR REPLACE FUNCTION public.generate_invoice_number(
  p_tenant_id uuid,
  p_year      int  DEFAULT EXTRACT(YEAR FROM NOW())::int
)
RETURNS text
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_seq int;
BEGIN
  -- Ensure the row exists (idempotent)
  INSERT INTO public.invoice_number_sequences (tenant_id, year, last_seq)
  VALUES (p_tenant_id, p_year::smallint, 0)
  ON CONFLICT (tenant_id, year) DO NOTHING;

  -- Atomically increment — the UPDATE acquires a row-level lock,
  -- so concurrent calls for the same tenant+year serialize here.
  UPDATE public.invoice_number_sequences
  SET    last_seq = last_seq + 1
  WHERE  tenant_id = p_tenant_id
    AND  year      = p_year::smallint
  RETURNING last_seq INTO v_seq;

  -- YYYY-NNNN (4-digit zero-padded)
  RETURN p_year::text || '-' || LPAD(v_seq::text, 4, '0');
END;
$$;

-- =============================================================================
-- CONFIRM INVOICE TRANSACTION
-- confirm_invoice(invoice_id) → jsonb (the snapshot)
--
-- Steps (all in one implicit transaction):
--   1. Validate caller owns the invoice (manual RLS — fn is SECURITY DEFINER)
--   2. Lock invoice row (SELECT FOR UPDATE)
--   3. Guard: must be in 'draft' status
--   4. Guard: must have at least one item
--   5. Generate invoice_number (sequential, race-safe)
--   6. Build snapshot_json (items + tax + company + bank account info)
--   7. UPDATE invoices (status→confirmed, fill number + snapshot + confirmed_at)
--   8. UPDATE deliveries → status = 'invoiced'
--
-- IMMUTABILITY: after step 7 the trigger enforce_invoice_immutability will block
--               any further UPDATE or DELETE on this invoice row.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.confirm_invoice(p_invoice_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invoice      public.invoices%ROWTYPE;
  v_company      public.companies%ROWTYPE;
  v_bank         public.bank_accounts%ROWTYPE;
  v_inv_number   text;
  v_items_json   jsonb;
  v_tax_groups   jsonb;
  v_totals       jsonb;
  v_snapshot     jsonb;
BEGIN
  -- ── 1. Validate the caller has membership for this invoice's tenant ─────────
  IF NOT EXISTS (
    SELECT 1
    FROM   public.invoices   i
    JOIN   public.user_tenants ut ON ut.tenant_id = i.tenant_id
    WHERE  i.id          = p_invoice_id
      AND  ut.user_id    = auth.uid()
  ) THEN
    RAISE EXCEPTION 'confirm_invoice: access denied or invoice not found (id=%)',
      p_invoice_id;
  END IF;

  -- ── 2. Lock invoice row to prevent concurrent confirmations ────────────────
  SELECT * INTO v_invoice
  FROM   public.invoices
  WHERE  id = p_invoice_id
  FOR UPDATE;

  -- ── 3. Guard: must be draft ────────────────────────────────────────────────
  IF v_invoice.status <> 'draft' THEN
    RAISE EXCEPTION
      'confirm_invoice: invoice % has status "%" — only draft invoices can be confirmed',
      p_invoice_id, v_invoice.status;
  END IF;

  -- ── 4. Guard: must have items ──────────────────────────────────────────────
  IF NOT EXISTS (
    SELECT 1 FROM public.invoice_items WHERE invoice_id = p_invoice_id
  ) THEN
    RAISE EXCEPTION
      'confirm_invoice: invoice % has no line items — cannot confirm an empty invoice',
      p_invoice_id;
  END IF;

  -- ── 5. Load supporting data ────────────────────────────────────────────────
  SELECT * INTO v_company
  FROM   public.companies
  WHERE  id = v_invoice.company_id;

  -- Prefer the default bank account; fall back to any account
  SELECT * INTO v_bank
  FROM   public.bank_accounts
  WHERE  tenant_id  = v_invoice.tenant_id
    AND  is_default = true
  LIMIT  1;

  IF NOT FOUND THEN
    SELECT * INTO v_bank
    FROM   public.bank_accounts
    WHERE  tenant_id = v_invoice.tenant_id
    LIMIT  1;
  END IF;

  -- ── 6. Generate sequential invoice number ──────────────────────────────────
  v_inv_number := public.generate_invoice_number(
    v_invoice.tenant_id,
    EXTRACT(YEAR FROM v_invoice.closing_date)::int
  );

  -- ── 7. Build items JSON (ordered for consistent PDF rendering) ─────────────
  SELECT jsonb_agg(
    jsonb_build_object(
      'id',            ii.id,
      'delivery_id',   ii.delivery_id,
      'site_name',     ii.site_name,
      'delivery_date', ii.delivery_date,
      'product_name',  ii.product_name,
      'quantity',      ii.quantity,
      'unit_price',    ii.unit_price,
      'tax_rate',      ii.tax_rate,
      'tax_amount',    ii.tax_amount,
      'amount',        ii.amount
    )
    ORDER BY ii.delivery_date, ii.site_name, ii.product_name
  )
  INTO v_items_json
  FROM public.invoice_items ii
  WHERE ii.invoice_id = p_invoice_id;

  -- ── 8. Tax breakdown grouped by rate ──────────────────────────────────────
  SELECT jsonb_agg(
    jsonb_build_object(
      'tax_rate',       tax_rate,
      'taxable_amount', taxable_amount,
      'tax_amount',     tax_amount
    )
    ORDER BY tax_rate DESC
  )
  INTO v_tax_groups
  FROM (
    SELECT
      tax_rate,
      SUM(amount)     AS taxable_amount,
      SUM(tax_amount) AS tax_amount
    FROM   public.invoice_items
    WHERE  invoice_id = p_invoice_id
    GROUP  BY tax_rate
  ) t;

  -- ── 9. Grand totals ────────────────────────────────────────────────────────
  SELECT jsonb_build_object(
    'subtotal',    SUM(amount),
    'tax_total',   SUM(tax_amount),
    'grand_total', SUM(amount) + SUM(tax_amount)
  )
  INTO v_totals
  FROM public.invoice_items
  WHERE invoice_id = p_invoice_id;

  -- ── 10. Assemble complete snapshot ─────────────────────────────────────────
  v_snapshot := jsonb_build_object(
    'invoice_number',   v_inv_number,
    'confirmed_at',     NOW(),
    'closing_date',     v_invoice.closing_date,
    'payment_due_date', v_invoice.payment_due_date,
    -- Mandated audit statement (mixed tax rates, per-line ceiling)
    'tax_note',         '消費税は明細ごとに切り上げて計算しています',
    'company', jsonb_build_object(
      'id',             v_company.id,
      'name',           v_company.name,
      'invoice_number', v_company.invoice_number,
      'closing_day',    v_company.closing_day,
      'payment_type',   v_company.payment_type
    ),
    'bank_account', CASE
      WHEN v_bank.id IS NOT NULL THEN jsonb_build_object(
        'bank_name',      v_bank.bank_name,
        'branch_name',    v_bank.branch_name,
        'account_type',   v_bank.account_type,
        'account_number', v_bank.account_number,
        'account_holder', v_bank.account_holder
      )
      ELSE NULL
    END,
    'items',      COALESCE(v_items_json, '[]'::jsonb),
    'tax_groups', COALESCE(v_tax_groups, '[]'::jsonb),
    'totals',     v_totals
  );

  -- ── 11. Confirm the invoice ────────────────────────────────────────────────
  -- NOTE: The immutability trigger fires BEFORE UPDATE and checks OLD.status.
  -- At this point OLD.status = 'draft', so the trigger allows this update.
  -- Once status = 'confirmed', all subsequent UPDATEs are blocked by the trigger.
  UPDATE public.invoices
  SET
    invoice_number = v_inv_number,
    status         = 'confirmed',
    confirmed_at   = NOW(),
    snapshot_json  = v_snapshot
  WHERE id = p_invoice_id;

  -- ── 12. Mark all linked deliveries as invoiced ─────────────────────────────
  UPDATE public.deliveries
  SET    status = 'invoiced'
  WHERE  id IN (
    SELECT DISTINCT delivery_id
    FROM   public.invoice_items
    WHERE  invoice_id = p_invoice_id
  );

  RETURN v_snapshot;
END;
$$;

-- =============================================================================
-- SESSION CONTEXT HELPER
-- Allows application code to set the current tenant for a DB session.
-- Useful in SECURITY DEFINER contexts or stored-procedure chains.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.set_tenant_context(p_tenant_id uuid)
RETURNS void
LANGUAGE sql
VOLATILE
SECURITY INVOKER
AS $$
  SELECT set_config('app.current_tenant_id', p_tenant_id::text, true);
$$;
