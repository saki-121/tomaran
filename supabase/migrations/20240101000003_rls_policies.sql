-- =============================================================================
-- MIGRATION 003: Row Level Security
--
-- PRINCIPLE: Every table is locked down. Access is granted ONLY when the
-- calling auth.uid() has a record in user_tenants for the row's tenant_id.
--
-- Pattern used throughout:
--   EXISTS (
--     SELECT 1 FROM public.user_tenants ut
--     WHERE  ut.user_id   = auth.uid()
--       AND  ut.tenant_id = <table>.tenant_id   ← always qualified
--   )
--
-- Application-side filtering is NOT trusted and NOT required.
-- RLS makes every query tenant-safe automatically.
-- =============================================================================

-- Enable RLS on every table
ALTER TABLE public.tenants                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users                    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_tenants             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sites                    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bank_accounts            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deliveries               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_items           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_number_sequences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_items            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.holidays                 ENABLE ROW LEVEL SECURITY;

-- Force RLS even for table owners (prevents accidental bypass via service role
-- when the anon/authenticated key is used — service role always bypasses anyway)
ALTER TABLE public.tenants                  FORCE ROW LEVEL SECURITY;
ALTER TABLE public.companies                FORCE ROW LEVEL SECURITY;
ALTER TABLE public.sites                    FORCE ROW LEVEL SECURITY;
ALTER TABLE public.products                 FORCE ROW LEVEL SECURITY;
ALTER TABLE public.bank_accounts            FORCE ROW LEVEL SECURITY;
ALTER TABLE public.deliveries               FORCE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_items           FORCE ROW LEVEL SECURITY;
ALTER TABLE public.invoices                 FORCE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_items            FORCE ROW LEVEL SECURITY;

-- =============================================================================
-- HOLIDAYS (read-only for all authenticated users, managed via service role)
-- =============================================================================

CREATE POLICY holidays_select
  ON public.holidays FOR SELECT
  USING (auth.role() = 'authenticated');

-- =============================================================================
-- TENANTS
-- A user may only see tenants they are a member of.
-- Tenant creation is handled out-of-band (onboarding flow via service role).
-- =============================================================================

CREATE POLICY tenants_select
  ON public.tenants FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_tenants ut
      WHERE  ut.tenant_id = tenants.id
        AND  ut.user_id   = auth.uid()
    )
  );

-- No direct INSERT / UPDATE / DELETE for regular users — use service role.

-- =============================================================================
-- USERS
-- A user can read their own profile.
-- They can also see co-members within any shared tenant (e.g., for display names).
-- A user can only write their own profile row.
-- =============================================================================

CREATE POLICY users_select
  ON public.users FOR SELECT
  USING (
    users.id = auth.uid()
    OR EXISTS (
      -- co-member check: both users share at least one tenant
      SELECT 1
      FROM   public.user_tenants ut_me
      JOIN   public.user_tenants ut_other
             ON ut_other.tenant_id = ut_me.tenant_id
      WHERE  ut_me.user_id   = auth.uid()
        AND  ut_other.user_id = users.id
    )
  );

CREATE POLICY users_insert
  ON public.users FOR INSERT
  WITH CHECK (users.id = auth.uid());

CREATE POLICY users_update
  ON public.users FOR UPDATE
  USING     (users.id = auth.uid())
  WITH CHECK(users.id = auth.uid());

-- =============================================================================
-- USER_TENANTS
-- A user can see their own membership rows.
-- Adding members requires owner/admin role in that tenant.
-- =============================================================================

CREATE POLICY user_tenants_select
  ON public.user_tenants FOR SELECT
  USING (user_tenants.user_id = auth.uid());

CREATE POLICY user_tenants_insert
  ON public.user_tenants FOR INSERT
  WITH CHECK (
    -- Self-join (initial tenant setup handled via service role / onboarding)
    user_tenants.user_id = auth.uid()
    OR
    -- Only owners/admins can invite others
    EXISTS (
      SELECT 1 FROM public.user_tenants ut
      WHERE  ut.tenant_id = user_tenants.tenant_id
        AND  ut.user_id   = auth.uid()
        AND  ut.role IN ('owner', 'admin')
    )
  );

CREATE POLICY user_tenants_delete
  ON public.user_tenants FOR DELETE
  USING (
    -- Users may remove themselves
    user_tenants.user_id = auth.uid()
    OR
    -- Owners/admins may remove others
    EXISTS (
      SELECT 1 FROM public.user_tenants ut
      WHERE  ut.tenant_id = user_tenants.tenant_id
        AND  ut.user_id   = auth.uid()
        AND  ut.role IN ('owner', 'admin')
    )
  );

-- =============================================================================
-- MACRO: tenant membership check
-- We inline this in every policy rather than using a function to avoid
-- the function-call overhead on every row scan.
-- Template:
--   EXISTS (
--     SELECT 1 FROM public.user_tenants ut
--     WHERE  ut.user_id   = auth.uid()
--       AND  ut.tenant_id = <table>.tenant_id
--   )
-- =============================================================================

-- =============================================================================
-- COMPANIES
-- =============================================================================

CREATE POLICY companies_select
  ON public.companies FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.user_tenants ut
    WHERE ut.user_id = auth.uid() AND ut.tenant_id = companies.tenant_id
  ));

CREATE POLICY companies_insert
  ON public.companies FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.user_tenants ut
    WHERE ut.user_id = auth.uid() AND ut.tenant_id = companies.tenant_id
  ));

CREATE POLICY companies_update
  ON public.companies FOR UPDATE
  USING     (EXISTS (
    SELECT 1 FROM public.user_tenants ut
    WHERE ut.user_id = auth.uid() AND ut.tenant_id = companies.tenant_id
  ))
  WITH CHECK(EXISTS (
    SELECT 1 FROM public.user_tenants ut
    WHERE ut.user_id = auth.uid() AND ut.tenant_id = companies.tenant_id
  ));

CREATE POLICY companies_delete
  ON public.companies FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.user_tenants ut
    WHERE ut.user_id = auth.uid() AND ut.tenant_id = companies.tenant_id
  ));

-- =============================================================================
-- SITES
-- =============================================================================

CREATE POLICY sites_select
  ON public.sites FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.user_tenants ut
    WHERE ut.user_id = auth.uid() AND ut.tenant_id = sites.tenant_id
  ));

CREATE POLICY sites_insert
  ON public.sites FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.user_tenants ut
    WHERE ut.user_id = auth.uid() AND ut.tenant_id = sites.tenant_id
  ));

CREATE POLICY sites_update
  ON public.sites FOR UPDATE
  USING     (EXISTS (
    SELECT 1 FROM public.user_tenants ut
    WHERE ut.user_id = auth.uid() AND ut.tenant_id = sites.tenant_id
  ))
  WITH CHECK(EXISTS (
    SELECT 1 FROM public.user_tenants ut
    WHERE ut.user_id = auth.uid() AND ut.tenant_id = sites.tenant_id
  ));

CREATE POLICY sites_delete
  ON public.sites FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.user_tenants ut
    WHERE ut.user_id = auth.uid() AND ut.tenant_id = sites.tenant_id
  ));

-- =============================================================================
-- PRODUCTS
-- =============================================================================

CREATE POLICY products_select
  ON public.products FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.user_tenants ut
    WHERE ut.user_id = auth.uid() AND ut.tenant_id = products.tenant_id
  ));

CREATE POLICY products_insert
  ON public.products FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.user_tenants ut
    WHERE ut.user_id = auth.uid() AND ut.tenant_id = products.tenant_id
  ));

CREATE POLICY products_update
  ON public.products FOR UPDATE
  USING     (EXISTS (
    SELECT 1 FROM public.user_tenants ut
    WHERE ut.user_id = auth.uid() AND ut.tenant_id = products.tenant_id
  ))
  WITH CHECK(EXISTS (
    SELECT 1 FROM public.user_tenants ut
    WHERE ut.user_id = auth.uid() AND ut.tenant_id = products.tenant_id
  ));

CREATE POLICY products_delete
  ON public.products FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.user_tenants ut
    WHERE ut.user_id = auth.uid() AND ut.tenant_id = products.tenant_id
  ));

-- =============================================================================
-- BANK_ACCOUNTS
-- =============================================================================

CREATE POLICY bank_accounts_select
  ON public.bank_accounts FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.user_tenants ut
    WHERE ut.user_id = auth.uid() AND ut.tenant_id = bank_accounts.tenant_id
  ));

CREATE POLICY bank_accounts_insert
  ON public.bank_accounts FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.user_tenants ut
    WHERE ut.user_id = auth.uid() AND ut.tenant_id = bank_accounts.tenant_id
  ));

CREATE POLICY bank_accounts_update
  ON public.bank_accounts FOR UPDATE
  USING     (EXISTS (
    SELECT 1 FROM public.user_tenants ut
    WHERE ut.user_id = auth.uid() AND ut.tenant_id = bank_accounts.tenant_id
  ))
  WITH CHECK(EXISTS (
    SELECT 1 FROM public.user_tenants ut
    WHERE ut.user_id = auth.uid() AND ut.tenant_id = bank_accounts.tenant_id
  ));

CREATE POLICY bank_accounts_delete
  ON public.bank_accounts FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.user_tenants ut
    WHERE ut.user_id = auth.uid() AND ut.tenant_id = bank_accounts.tenant_id
  ));
