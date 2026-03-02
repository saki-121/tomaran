-- =============================================================================
-- MIGRATION 004: Security Patch
--
-- Context: migration 003 was truncated by a linter after the bank_accounts_update
-- policy, leaving the following objects absent from the live schema:
--   • bank_accounts_update  — WITH CHECK clause incomplete
--   • bank_accounts_delete  — absent
--   • deliveries            — all 4 policies absent
--   • delivery_items        — all 4 policies absent
--   • invoice_number_sequences — deny-all policy absent
--   • invoices              — all 4 policies absent
--   • invoice_items         — all 4 policies absent
--
-- Additional hardening applied in the same migration:
--   • FORCE RLS on 4 tables that had ENABLE but not FORCE
--   • user_tenants_insert — privilege escalation via self-insert removed
--   • user_tenants_update — explicit policy added (previously implicit deny)
--   • tenant_id immutability enforced via trigger on all business tables
--   • Cross-tenant FK consistency enforced via triggers
--
-- Rules:
--   • No tables are dropped or recreated.
--   • Existing objects are modified with ALTER, not replaced.
--   • New policies use idempotent DO $$ blocks (safe if 003 already ran fully).
-- =============================================================================

-- =============================================================================
-- SECTION 1: FORCE ROW LEVEL SECURITY on tables that had ENABLE but not FORCE
--
-- FORCE RLS makes the policy apply even to the table owner role.
-- Without it, a connection using the owning role (postgres in Supabase)
-- bypasses RLS entirely — a silent security hole in admin/service paths.
-- =============================================================================

ALTER TABLE public.users                    FORCE ROW LEVEL SECURITY;
ALTER TABLE public.user_tenants             FORCE ROW LEVEL SECURITY;
ALTER TABLE public.holidays                 FORCE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_number_sequences FORCE ROW LEVEL SECURITY;

-- =============================================================================
-- SECTION 2: Repair bank_accounts_update
--
-- The WITH CHECK clause was truncated to bare "SELECT " by the linter.
-- ALTER POLICY replaces USING and WITH CHECK in-place without dropping the policy.
-- =============================================================================

ALTER POLICY bank_accounts_update
  ON public.bank_accounts
  USING (
    EXISTS (
      SELECT 1 FROM public.user_tenants ut
      WHERE  ut.user_id   = auth.uid()
        AND  ut.tenant_id = bank_accounts.tenant_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_tenants ut
      WHERE  ut.user_id   = auth.uid()
        AND  ut.tenant_id = bank_accounts.tenant_id
    )
  );

-- =============================================================================
-- SECTION 3: Restore all policies absent from the truncated file
--
-- Each block is wrapped in DO $$ … EXCEPTION WHEN duplicate_object … $$ so that
-- this migration is safe to run regardless of whether 003 had already applied
-- these policies (e.g. the migration ran before the file was truncated).
-- =============================================================================

-- ── bank_accounts_delete ─────────────────────────────────────────────────────

DO $$ BEGIN
  CREATE POLICY bank_accounts_delete
    ON public.bank_accounts FOR DELETE
    USING (
      EXISTS (
        SELECT 1 FROM public.user_tenants ut
        WHERE  ut.user_id   = auth.uid()
          AND  ut.tenant_id = bank_accounts.tenant_id
      )
    );
EXCEPTION WHEN duplicate_object THEN
  RAISE NOTICE 'policy "bank_accounts_delete" already exists — skipping';
END $$;

-- ── deliveries ───────────────────────────────────────────────────────────────

DO $$ BEGIN
  CREATE POLICY deliveries_select
    ON public.deliveries FOR SELECT
    USING (
      EXISTS (
        SELECT 1 FROM public.user_tenants ut
        WHERE  ut.user_id   = auth.uid()
          AND  ut.tenant_id = deliveries.tenant_id
      )
    );
EXCEPTION WHEN duplicate_object THEN
  RAISE NOTICE 'policy "deliveries_select" already exists — skipping';
END $$;

DO $$ BEGIN
  CREATE POLICY deliveries_insert
    ON public.deliveries FOR INSERT
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM public.user_tenants ut
        WHERE  ut.user_id   = auth.uid()
          AND  ut.tenant_id = deliveries.tenant_id
      )
    );
EXCEPTION WHEN duplicate_object THEN
  RAISE NOTICE 'policy "deliveries_insert" already exists — skipping';
END $$;

DO $$ BEGIN
  CREATE POLICY deliveries_update
    ON public.deliveries FOR UPDATE
    USING (
      EXISTS (
        SELECT 1 FROM public.user_tenants ut
        WHERE  ut.user_id   = auth.uid()
          AND  ut.tenant_id = deliveries.tenant_id
      )
    )
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM public.user_tenants ut
        WHERE  ut.user_id   = auth.uid()
          AND  ut.tenant_id = deliveries.tenant_id
      )
    );
EXCEPTION WHEN duplicate_object THEN
  RAISE NOTICE 'policy "deliveries_update" already exists — skipping';
END $$;

DO $$ BEGIN
  CREATE POLICY deliveries_delete
    ON public.deliveries FOR DELETE
    USING (
      EXISTS (
        SELECT 1 FROM public.user_tenants ut
        WHERE  ut.user_id   = auth.uid()
          AND  ut.tenant_id = deliveries.tenant_id
      )
    );
EXCEPTION WHEN duplicate_object THEN
  RAISE NOTICE 'policy "deliveries_delete" already exists — skipping';
END $$;

-- ── delivery_items ───────────────────────────────────────────────────────────

DO $$ BEGIN
  CREATE POLICY delivery_items_select
    ON public.delivery_items FOR SELECT
    USING (
      EXISTS (
        SELECT 1 FROM public.user_tenants ut
        WHERE  ut.user_id   = auth.uid()
          AND  ut.tenant_id = delivery_items.tenant_id
      )
    );
EXCEPTION WHEN duplicate_object THEN
  RAISE NOTICE 'policy "delivery_items_select" already exists — skipping';
END $$;

DO $$ BEGIN
  CREATE POLICY delivery_items_insert
    ON public.delivery_items FOR INSERT
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM public.user_tenants ut
        WHERE  ut.user_id   = auth.uid()
          AND  ut.tenant_id = delivery_items.tenant_id
      )
    );
EXCEPTION WHEN duplicate_object THEN
  RAISE NOTICE 'policy "delivery_items_insert" already exists — skipping';
END $$;

DO $$ BEGIN
  CREATE POLICY delivery_items_update
    ON public.delivery_items FOR UPDATE
    USING (
      EXISTS (
        SELECT 1 FROM public.user_tenants ut
        WHERE  ut.user_id   = auth.uid()
          AND  ut.tenant_id = delivery_items.tenant_id
      )
    )
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM public.user_tenants ut
        WHERE  ut.user_id   = auth.uid()
          AND  ut.tenant_id = delivery_items.tenant_id
      )
    );
EXCEPTION WHEN duplicate_object THEN
  RAISE NOTICE 'policy "delivery_items_update" already exists — skipping';
END $$;

DO $$ BEGIN
  CREATE POLICY delivery_items_delete
    ON public.delivery_items FOR DELETE
    USING (
      EXISTS (
        SELECT 1 FROM public.user_tenants ut
        WHERE  ut.user_id   = auth.uid()
          AND  ut.tenant_id = delivery_items.tenant_id
      )
    );
EXCEPTION WHEN duplicate_object THEN
  RAISE NOTICE 'policy "delivery_items_delete" already exists — skipping';
END $$;

-- ── invoice_number_sequences — deny all direct access ────────────────────────

DO $$ BEGIN
  CREATE POLICY sequences_deny_all
    ON public.invoice_number_sequences
    FOR ALL
    USING     (false)
    WITH CHECK(false);
EXCEPTION WHEN duplicate_object THEN
  RAISE NOTICE 'policy "sequences_deny_all" already exists — skipping';
END $$;

-- ── invoices ─────────────────────────────────────────────────────────────────

DO $$ BEGIN
  CREATE POLICY invoices_select
    ON public.invoices FOR SELECT
    USING (
      EXISTS (
        SELECT 1 FROM public.user_tenants ut
        WHERE  ut.user_id   = auth.uid()
          AND  ut.tenant_id = invoices.tenant_id
      )
    );
EXCEPTION WHEN duplicate_object THEN
  RAISE NOTICE 'policy "invoices_select" already exists — skipping';
END $$;

DO $$ BEGIN
  CREATE POLICY invoices_insert
    ON public.invoices FOR INSERT
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM public.user_tenants ut
        WHERE  ut.user_id   = auth.uid()
          AND  ut.tenant_id = invoices.tenant_id
      )
    );
EXCEPTION WHEN duplicate_object THEN
  RAISE NOTICE 'policy "invoices_insert" already exists — skipping';
END $$;

DO $$ BEGIN
  CREATE POLICY invoices_update
    ON public.invoices FOR UPDATE
    USING (
      EXISTS (
        SELECT 1 FROM public.user_tenants ut
        WHERE  ut.user_id   = auth.uid()
          AND  ut.tenant_id = invoices.tenant_id
      )
    )
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM public.user_tenants ut
        WHERE  ut.user_id   = auth.uid()
          AND  ut.tenant_id = invoices.tenant_id
      )
    );
EXCEPTION WHEN duplicate_object THEN
  RAISE NOTICE 'policy "invoices_update" already exists — skipping';
END $$;

DO $$ BEGIN
  CREATE POLICY invoices_delete
    ON public.invoices FOR DELETE
    USING (
      EXISTS (
        SELECT 1 FROM public.user_tenants ut
        WHERE  ut.user_id   = auth.uid()
          AND  ut.tenant_id = invoices.tenant_id
      )
    );
EXCEPTION WHEN duplicate_object THEN
  RAISE NOTICE 'policy "invoices_delete" already exists — skipping';
END $$;

-- ── invoice_items ─────────────────────────────────────────────────────────────

DO $$ BEGIN
  CREATE POLICY invoice_items_select
    ON public.invoice_items FOR SELECT
    USING (
      EXISTS (
        SELECT 1 FROM public.user_tenants ut
        WHERE  ut.user_id   = auth.uid()
          AND  ut.tenant_id = invoice_items.tenant_id
      )
    );
EXCEPTION WHEN duplicate_object THEN
  RAISE NOTICE 'policy "invoice_items_select" already exists — skipping';
END $$;

DO $$ BEGIN
  CREATE POLICY invoice_items_insert
    ON public.invoice_items FOR INSERT
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM public.user_tenants ut
        WHERE  ut.user_id   = auth.uid()
          AND  ut.tenant_id = invoice_items.tenant_id
      )
    );
EXCEPTION WHEN duplicate_object THEN
  RAISE NOTICE 'policy "invoice_items_insert" already exists — skipping';
END $$;

DO $$ BEGIN
  CREATE POLICY invoice_items_update
    ON public.invoice_items FOR UPDATE
    USING (
      EXISTS (
        SELECT 1 FROM public.user_tenants ut
        WHERE  ut.user_id   = auth.uid()
          AND  ut.tenant_id = invoice_items.tenant_id
      )
    )
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM public.user_tenants ut
        WHERE  ut.user_id   = auth.uid()
          AND  ut.tenant_id = invoice_items.tenant_id
      )
    );
EXCEPTION WHEN duplicate_object THEN
  RAISE NOTICE 'policy "invoice_items_update" already exists — skipping';
END $$;

DO $$ BEGIN
  CREATE POLICY invoice_items_delete
    ON public.invoice_items FOR DELETE
    USING (
      EXISTS (
        SELECT 1 FROM public.user_tenants ut
        WHERE  ut.user_id   = auth.uid()
          AND  ut.tenant_id = invoice_items.tenant_id
      )
    );
EXCEPTION WHEN duplicate_object THEN
  RAISE NOTICE 'policy "invoice_items_delete" already exists — skipping';
END $$;

-- =============================================================================
-- SECTION 4: Fix user_tenants_insert privilege escalation
--
-- BUG: The original policy contained:
--   user_id = auth.uid() OR <owner/admin check>
--
-- The first branch allowed ANY authenticated user to INSERT a row for themselves
-- into ANY tenant with ANY role — including 'owner'. This is a direct privilege
-- escalation path.
--
-- FIX: Remove the self-insert branch entirely. Tenant membership must be
-- established exclusively by tenant owners/admins or the service role (onboarding).
-- Self-registration into a tenant is not a valid user-facing operation.
-- =============================================================================

ALTER POLICY user_tenants_insert
  ON public.user_tenants
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_tenants ut
      WHERE  ut.tenant_id = user_tenants.tenant_id
        AND  ut.user_id   = auth.uid()
        AND  ut.role IN ('owner', 'admin')
    )
  );

-- =============================================================================
-- SECTION 5: Add user_tenants_update policy
--
-- Previously absent — without a policy UPDATE was denied by default (safe but
-- implicit). This makes the rule explicit and scoped:
--   • Only owners may change another member's role.
--   • Owners may not modify their own row (prevents accidental self-demotion
--     that could orphan the tenant with no owner).
-- =============================================================================

DO $$ BEGIN
  CREATE POLICY user_tenants_update
    ON public.user_tenants FOR UPDATE
    USING (
      -- Caller must be an owner of this tenant
      EXISTS (
        SELECT 1 FROM public.user_tenants ut
        WHERE  ut.tenant_id = user_tenants.tenant_id
          AND  ut.user_id   = auth.uid()
          AND  ut.role      = 'owner'
      )
      -- Owners cannot edit their own membership row
      AND user_id <> auth.uid()
    )
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM public.user_tenants ut
        WHERE  ut.tenant_id = user_tenants.tenant_id
          AND  ut.user_id   = auth.uid()
          AND  ut.role      = 'owner'
      )
    );
EXCEPTION WHEN duplicate_object THEN
  RAISE NOTICE 'policy "user_tenants_update" already exists — skipping';
END $$;

-- =============================================================================
-- SECTION 6: Prevent tenant_id mutation on UPDATE
--
-- Once a row is created in any business table its tenant_id must never change.
-- A mutation would silently move the row into another tenant's dataset.
-- RLS WITH CHECK on UPDATE allows the new tenant_id only if the caller is a
-- member of it — which means a user who belongs to two tenants could legally
-- reassign rows between them. This trigger closes that gap at the DB level.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.prevent_tenant_id_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
BEGIN
  IF NEW.tenant_id IS DISTINCT FROM OLD.tenant_id THEN
    RAISE EXCEPTION
      'tenant_id is immutable: cannot change tenant_id on % (row id=%)',
      TG_TABLE_NAME, OLD.id;
  END IF;
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
    -- Skip if the trigger already exists (idempotent)
    IF NOT EXISTS (
      SELECT 1 FROM pg_trigger
      JOIN   pg_class ON pg_class.oid = pg_trigger.tgrelid
      WHERE  pg_class.relname  = t
        AND  pg_class.relnamespace = 'public'::regnamespace
        AND  pg_trigger.tgname = t || '_prevent_tenant_id_change'
    ) THEN
      EXECUTE format(
        'CREATE TRIGGER %I
         BEFORE UPDATE ON public.%I
         FOR EACH ROW EXECUTE FUNCTION public.prevent_tenant_id_change()',
        t || '_prevent_tenant_id_change', t
      );
    END IF;
  END LOOP;
END;
$$;

-- =============================================================================
-- SECTION 7: Cross-tenant FK consistency guards
--
-- The schema FKs only enforce referential integrity (the referenced row exists).
-- They do NOT enforce that the referenced row belongs to the same tenant.
-- Without these triggers a user who knows a foreign UUID could reference another
-- tenant's data — a classic IDOR (Insecure Direct Object Reference) vulnerability.
--
-- Guards added:
--   7a. sites     → companies    (same tenant)
--   7b. deliveries→ companies    (same tenant)
--   7c. deliveries→ sites        (same tenant, same company)
--   7d. invoices  → companies    (same tenant)
--   7e. delivery_items → deliveries (same tenant)
--   7f. invoice_items  → invoices   (same tenant)
--   7g. invoice_items  → deliveries (same tenant)
-- =============================================================================

-- ── 7a + 7b + 7c: sites and deliveries ───────────────────────────────────────

CREATE OR REPLACE FUNCTION public.guard_site_tenant_fk()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
BEGIN
  -- site.company_id must belong to the same tenant as the site
  IF NOT EXISTS (
    SELECT 1 FROM public.companies
    WHERE  id        = NEW.company_id
      AND  tenant_id = NEW.tenant_id
  ) THEN
    RAISE EXCEPTION
      'guard_site_tenant_fk: company % does not belong to tenant %',
      NEW.company_id, NEW.tenant_id;
  END IF;

  RETURN NEW;
END;
$$;

DO $$ BEGIN
  CREATE TRIGGER sites_guard_tenant_fk
    BEFORE INSERT OR UPDATE ON public.sites
    FOR EACH ROW EXECUTE FUNCTION public.guard_site_tenant_fk();
EXCEPTION WHEN duplicate_object THEN
  RAISE NOTICE 'trigger "sites_guard_tenant_fk" already exists — skipping';
END $$;

-- ──────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.guard_delivery_tenant_fk()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
BEGIN
  -- company must belong to the same tenant as the delivery
  IF NOT EXISTS (
    SELECT 1 FROM public.companies
    WHERE  id        = NEW.company_id
      AND  tenant_id = NEW.tenant_id
  ) THEN
    RAISE EXCEPTION
      'guard_delivery_tenant_fk: company % does not belong to tenant %',
      NEW.company_id, NEW.tenant_id;
  END IF;

  -- site must belong to the same tenant and the same company
  IF NOT EXISTS (
    SELECT 1 FROM public.sites
    WHERE  id         = NEW.site_id
      AND  tenant_id  = NEW.tenant_id
      AND  company_id = NEW.company_id
  ) THEN
    RAISE EXCEPTION
      'guard_delivery_tenant_fk: site % does not belong to company % in tenant %',
      NEW.site_id, NEW.company_id, NEW.tenant_id;
  END IF;

  RETURN NEW;
END;
$$;

DO $$ BEGIN
  CREATE TRIGGER deliveries_guard_tenant_fk
    BEFORE INSERT OR UPDATE ON public.deliveries
    FOR EACH ROW EXECUTE FUNCTION public.guard_delivery_tenant_fk();
EXCEPTION WHEN duplicate_object THEN
  RAISE NOTICE 'trigger "deliveries_guard_tenant_fk" already exists — skipping';
END $$;

-- ── 7d: invoices → companies ─────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.guard_invoice_tenant_fk()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.companies
    WHERE  id        = NEW.company_id
      AND  tenant_id = NEW.tenant_id
  ) THEN
    RAISE EXCEPTION
      'guard_invoice_tenant_fk: company % does not belong to tenant %',
      NEW.company_id, NEW.tenant_id;
  END IF;

  RETURN NEW;
END;
$$;

DO $$ BEGIN
  CREATE TRIGGER invoices_guard_tenant_fk
    BEFORE INSERT OR UPDATE ON public.invoices
    FOR EACH ROW EXECUTE FUNCTION public.guard_invoice_tenant_fk();
EXCEPTION WHEN duplicate_object THEN
  RAISE NOTICE 'trigger "invoices_guard_tenant_fk" already exists — skipping';
END $$;

-- ── 7e: delivery_items → deliveries ──────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.guard_delivery_item_tenant_fk()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.deliveries
    WHERE  id        = NEW.delivery_id
      AND  tenant_id = NEW.tenant_id
  ) THEN
    RAISE EXCEPTION
      'guard_delivery_item_tenant_fk: delivery % does not belong to tenant %',
      NEW.delivery_id, NEW.tenant_id;
  END IF;

  RETURN NEW;
END;
$$;

DO $$ BEGIN
  CREATE TRIGGER delivery_items_guard_tenant_fk
    BEFORE INSERT OR UPDATE ON public.delivery_items
    FOR EACH ROW EXECUTE FUNCTION public.guard_delivery_item_tenant_fk();
EXCEPTION WHEN duplicate_object THEN
  RAISE NOTICE 'trigger "delivery_items_guard_tenant_fk" already exists — skipping';
END $$;

-- ── 7f + 7g: invoice_items → invoices and deliveries ─────────────────────────

CREATE OR REPLACE FUNCTION public.guard_invoice_item_tenant_fk()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
BEGIN
  -- parent invoice must belong to the same tenant
  IF NOT EXISTS (
    SELECT 1 FROM public.invoices
    WHERE  id        = NEW.invoice_id
      AND  tenant_id = NEW.tenant_id
  ) THEN
    RAISE EXCEPTION
      'guard_invoice_item_tenant_fk: invoice % does not belong to tenant %',
      NEW.invoice_id, NEW.tenant_id;
  END IF;

  -- referenced delivery must also belong to the same tenant
  IF NOT EXISTS (
    SELECT 1 FROM public.deliveries
    WHERE  id        = NEW.delivery_id
      AND  tenant_id = NEW.tenant_id
  ) THEN
    RAISE EXCEPTION
      'guard_invoice_item_tenant_fk: delivery % does not belong to tenant %',
      NEW.delivery_id, NEW.tenant_id;
  END IF;

  RETURN NEW;
END;
$$;

DO $$ BEGIN
  CREATE TRIGGER invoice_items_guard_tenant_fk
    BEFORE INSERT OR UPDATE ON public.invoice_items
    FOR EACH ROW EXECUTE FUNCTION public.guard_invoice_item_tenant_fk();
EXCEPTION WHEN duplicate_object THEN
  RAISE NOTICE 'trigger "invoice_items_guard_tenant_fk" already exists — skipping';
END $$;

-- =============================================================================
-- MIGRATION 004: SAFETY PATCH
-- Production hardening fixes
--
-- This migration DOES NOT modify schema structure.
-- It only strengthens guarantees and fixes edge cases.
-- Safe to run on existing DB.
-- =============================================================================

-- =============================================================================
-- 1. REQUIRE tenant_id CONSISTENCY (cross-tenant protection)
--
-- Prevent referencing rows from another tenant accidentally.
-- DB becomes self-defending even if app has a bug.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.enforce_same_tenant()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  v_tenant uuid;
BEGIN

  -- deliveries.company_id
  IF TG_TABLE_NAME = 'deliveries' THEN
    SELECT tenant_id INTO v_tenant
    FROM public.companies
    WHERE id = NEW.company_id;

    IF v_tenant <> NEW.tenant_id THEN
      RAISE EXCEPTION
        'Cross-tenant reference blocked (deliveries.company_id)';
    END IF;
  END IF;

  -- sites.company_id
  IF TG_TABLE_NAME = 'sites' THEN
    SELECT tenant_id INTO v_tenant
    FROM public.companies
    WHERE id = NEW.company_id;

    IF v_tenant <> NEW.tenant_id THEN
      RAISE EXCEPTION
        'Cross-tenant reference blocked (sites.company_id)';
    END IF;
  END IF;

  -- delivery_items.delivery_id
  IF TG_TABLE_NAME = 'delivery_items' THEN
    SELECT tenant_id INTO v_tenant
    FROM public.deliveries
    WHERE id = NEW.delivery_id;

    IF v_tenant <> NEW.tenant_id THEN
      RAISE EXCEPTION
        'Cross-tenant reference blocked (delivery_items.delivery_id)';
    END IF;
  END IF;

  -- invoice_items.invoice_id
  IF TG_TABLE_NAME = 'invoice_items' THEN
    SELECT tenant_id INTO v_tenant
    FROM public.invoices
    WHERE id = NEW.invoice_id;

    IF v_tenant <> NEW.tenant_id THEN
      RAISE EXCEPTION
        'Cross-tenant reference blocked (invoice_items.invoice_id)';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'sites',
    'deliveries',
    'delivery_items',
    'invoice_items'
  ]
  LOOP
    EXECUTE format(
      'CREATE TRIGGER %I_same_tenant_guard
       BEFORE INSERT OR UPDATE ON public.%I
       FOR EACH ROW
       EXECUTE FUNCTION public.enforce_same_tenant()',
      t, t
    );
  END LOOP;
END;
$$;

-- =============================================================================
-- 2. HARDEN invoice_number uniqueness
--
-- Prevent duplicate numbers even across cancelled rows edge cases.
-- =============================================================================

CREATE UNIQUE INDEX IF NOT EXISTS idx_invoice_number_unique_confirmed
ON public.invoices (invoice_number)
WHERE invoice_number IS NOT NULL;

-- =============================================================================
-- 3. GUARANTEE tax_amount correctness
--
-- DB recalculates tax automatically.
-- Client values are ignored.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.calculate_invoice_item_amounts()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.amount :=
    ROUND(NEW.quantity * NEW.unit_price, 2);

  NEW.tax_amount :=
    CEIL(NEW.amount * NEW.tax_rate);

  RETURN NEW;
END;
$$;

CREATE TRIGGER invoice_items_calculate_amounts
BEFORE INSERT OR UPDATE ON public.invoice_items
FOR EACH ROW
EXECUTE FUNCTION public.calculate_invoice_item_amounts();

-- =============================================================================
-- 4. PREVENT tenant_id mutation (CRITICAL SaaS RULE)
--
-- tenant_id must NEVER change after insert.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.prevent_tenant_change()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.tenant_id <> OLD.tenant_id THEN
    RAISE EXCEPTION
      'tenant_id is immutable once created';
  END IF;

  RETURN NEW;
END;
$$;

DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'companies',
    'sites',
    'products',
    'bank_accounts',
    'deliveries',
    'delivery_items',
    'invoices',
    'invoice_items'
  ]
  LOOP
    EXECUTE format(
      'CREATE TRIGGER %I_prevent_tenant_change
       BEFORE UPDATE ON public.%I
       FOR EACH ROW
       EXECUTE FUNCTION public.prevent_tenant_change()',
      t, t
    );
  END LOOP;
END;
$$;

-- =============================================================================
-- DONE
-- Database is now hardened for production multi-tenant SaaS usage.
-- =============================================================================
