-- =============================================================================
-- MIGRATION 000: Core Schema
-- Multi-tenant SaaS backend — database is the source of truth for all invariants
-- =============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================================
-- HOLIDAYS TABLE (placeholder for closing-date business-day logic)
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.holidays (
  date date PRIMARY KEY,
  name text NOT NULL
);

-- =============================================================================
-- CORE IDENTITY TABLES
-- =============================================================================

-- Tenants (organisations that subscribe to the SaaS)
CREATE TABLE public.tenants (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text        NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Public user profiles (mirrors auth.users — kept in sync via trigger)
CREATE TABLE public.users (
  id           uuid        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text        NOT NULL,
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- Membership: a user may belong to multiple tenants with a role
CREATE TABLE public.user_tenants (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid        NOT NULL REFERENCES public.users(id)   ON DELETE CASCADE,
  tenant_id  uuid        NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  role       text        NOT NULL DEFAULT 'member'
                         CHECK (role IN ('owner', 'admin', 'member')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, tenant_id)
);

CREATE INDEX idx_user_tenants_user_id   ON public.user_tenants (user_id);
CREATE INDEX idx_user_tenants_tenant_id ON public.user_tenants (tenant_id);

-- =============================================================================
-- BUSINESS TABLES
-- =============================================================================

-- Companies (clients/customers being invoiced)
CREATE TABLE public.companies (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      uuid        NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name           text        NOT NULL,
  closing_day    int         NOT NULL CHECK (closing_day BETWEEN 1 AND 31),
  payment_type   text        NOT NULL CHECK (payment_type IN ('after_30_days', 'next_month_end')),
  invoice_number text,
  active_flag    boolean     NOT NULL DEFAULT true,
  created_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_companies_tenant_id ON public.companies (tenant_id);

-- Sites (work locations belonging to a company)
CREATE TABLE public.sites (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   uuid        NOT NULL REFERENCES public.tenants(id)   ON DELETE CASCADE,
  company_id  uuid        NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name        text        NOT NULL,
  active_flag boolean     NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_sites_tenant_id  ON public.sites (tenant_id);
CREATE INDEX idx_sites_company_id ON public.sites (company_id);

-- Products (items that can appear on a delivery / invoice)
CREATE TABLE public.products (
  id          uuid           PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   uuid           NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name        text           NOT NULL,
  spec        text,
  unit_price  numeric(12, 2) NOT NULL CHECK (unit_price >= 0),
  tax_rate    numeric(4, 3)  NOT NULL CHECK (tax_rate IN (0.1, 0.08)),
  active_flag boolean        NOT NULL DEFAULT true,
  created_at  timestamptz    NOT NULL DEFAULT now(),
  updated_at  timestamptz    NOT NULL DEFAULT now()
);

CREATE INDEX idx_products_tenant_id ON public.products (tenant_id);

-- Bank accounts (displayed on confirmed invoices)
CREATE TABLE public.bank_accounts (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      uuid        NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  bank_name      text        NOT NULL,
  branch_name    text        NOT NULL,
  account_type   text        NOT NULL CHECK (account_type IN ('普通', '当座', '貯蓄')),
  account_number text        NOT NULL,
  account_holder text        NOT NULL,
  is_default     boolean     NOT NULL DEFAULT false,
  created_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_bank_accounts_tenant_id ON public.bank_accounts (tenant_id);

-- Enforce only one default bank account per tenant
CREATE UNIQUE INDEX idx_bank_accounts_one_default
  ON public.bank_accounts (tenant_id)
  WHERE is_default = true;

-- =============================================================================
-- DELIVERY TABLES
-- =============================================================================

-- Deliveries (日報 / work-day records)
CREATE TABLE public.deliveries (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     uuid        NOT NULL REFERENCES public.tenants(id)   ON DELETE CASCADE,
  delivery_date date        NOT NULL,
  company_id    uuid        NOT NULL REFERENCES public.companies(id),
  site_id       uuid        NOT NULL REFERENCES public.sites(id),
  status        text        NOT NULL DEFAULT 'editable'
                            CHECK (status IN ('editable', 'invoiced')),
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_deliveries_tenant_id     ON public.deliveries (tenant_id);
CREATE INDEX idx_deliveries_company_id    ON public.deliveries (company_id);
CREATE INDEX idx_deliveries_delivery_date ON public.deliveries (delivery_date);
CREATE INDEX idx_deliveries_status        ON public.deliveries (status);

-- Delivery line items — prices MUST be snapshotted at insert time (via trigger)
CREATE TABLE public.delivery_items (
  id                   uuid           PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id            uuid           NOT NULL REFERENCES public.tenants(id)    ON DELETE CASCADE,
  delivery_id          uuid           NOT NULL REFERENCES public.deliveries(id) ON DELETE CASCADE,
  product_id           uuid           NOT NULL REFERENCES public.products(id),
  quantity             numeric(10, 2) NOT NULL CHECK (quantity > 0),
  snapshot_unit_price  numeric(12, 2) NOT NULL,  -- set by trigger, never from client
  snapshot_tax_rate    numeric(4, 3)  NOT NULL    -- set by trigger, never from client
                       CHECK (snapshot_tax_rate IN (0.1, 0.08)),
  created_at           timestamptz    NOT NULL DEFAULT now()
);

CREATE INDEX idx_delivery_items_tenant_id   ON public.delivery_items (tenant_id);
CREATE INDEX idx_delivery_items_delivery_id ON public.delivery_items (delivery_id);

-- =============================================================================
-- INVOICE TABLES
-- =============================================================================

-- Atomic invoice number sequences — ONLY accessible via SECURITY DEFINER function
CREATE TABLE public.invoice_number_sequences (
  tenant_id uuid     NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  year      smallint NOT NULL,
  last_seq  int      NOT NULL DEFAULT 0,
  PRIMARY KEY (tenant_id, year)
);

-- Invoices
CREATE TABLE public.invoices (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        uuid        NOT NULL REFERENCES public.tenants(id)   ON DELETE CASCADE,
  invoice_number   text        UNIQUE,                                    -- NULL until confirmed
  company_id       uuid        NOT NULL REFERENCES public.companies(id),
  closing_date     date        NOT NULL,
  payment_due_date date        NOT NULL,
  status           text        NOT NULL DEFAULT 'draft'
                               CHECK (status IN ('draft', 'confirmed', 'cancelled')),
  snapshot_json    jsonb,                                                  -- NULL until confirmed
  confirmed_at     timestamptz,
  created_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_invoices_tenant_id    ON public.invoices (tenant_id);
CREATE INDEX idx_invoices_company_id   ON public.invoices (company_id);
CREATE INDEX idx_invoices_status       ON public.invoices (status);
CREATE INDEX idx_invoices_closing_date ON public.invoices (closing_date);

-- Invoice line items (denormalised for immutability — values copied from delivery)
CREATE TABLE public.invoice_items (
  id            uuid           PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     uuid           NOT NULL REFERENCES public.tenants(id)   ON DELETE CASCADE,
  invoice_id    uuid           NOT NULL REFERENCES public.invoices(id)  ON DELETE CASCADE,
  delivery_id   uuid           NOT NULL REFERENCES public.deliveries(id),
  site_name     text           NOT NULL,
  delivery_date date           NOT NULL,
  product_name  text           NOT NULL,
  quantity      numeric(10, 2) NOT NULL CHECK (quantity > 0),
  unit_price    numeric(12, 2) NOT NULL,
  tax_rate      numeric(4, 3)  NOT NULL CHECK (tax_rate IN (0.1, 0.08)),
  tax_amount    numeric(12, 2) NOT NULL,  -- CEIL(quantity * unit_price * tax_rate)
  amount        numeric(12, 2) NOT NULL,  -- quantity * unit_price
  created_at    timestamptz    NOT NULL DEFAULT now()
);

CREATE INDEX idx_invoice_items_tenant_id  ON public.invoice_items (tenant_id);
CREATE INDEX idx_invoice_items_invoice_id ON public.invoice_items (invoice_id);
