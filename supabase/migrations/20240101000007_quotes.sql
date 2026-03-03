CREATE TABLE public.quotes (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   uuid        NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  recipient   text        NOT NULL DEFAULT '',
  subtotal    integer     NOT NULL DEFAULT 0,
  tax_amount  integer     NOT NULL DEFAULT 0,
  grand_total integer     NOT NULL DEFAULT 0,
  items_json  jsonb       NOT NULL DEFAULT '[]',
  issued_date date        NOT NULL DEFAULT CURRENT_DATE,
  created_by  uuid        REFERENCES auth.users(id),
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant members can manage quotes"
  ON public.quotes FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.user_tenants ut
    WHERE ut.user_id = auth.uid() AND ut.tenant_id = quotes.tenant_id
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.user_tenants ut
    WHERE ut.user_id = auth.uid() AND ut.tenant_id = quotes.tenant_id
  ));
