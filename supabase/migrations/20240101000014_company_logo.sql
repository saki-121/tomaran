-- =============================================================================
-- MIGRATION 014: Company Logo Support
-- Adds logo_url field to tenants table for company branding
-- =============================================================================

-- Add logo_url column to tenants table
ALTER TABLE public.tenants 
ADD COLUMN IF NOT EXISTS logo_url text;

-- Add comment to explain the purpose
COMMENT ON COLUMN public.tenants.logo_url IS 'Company logo URL for branding on quotes, invoices, and delivery notes';
