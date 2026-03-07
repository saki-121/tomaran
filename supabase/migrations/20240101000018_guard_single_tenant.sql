-- =============================================================================
-- MIGRATION 018: 1ユーザー1テナント制の強制
-- create_tenant_for_user RPC に既存テナントチェックを追加
-- =============================================================================

CREATE OR REPLACE FUNCTION public.create_tenant_for_user(tenant_name text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tenant_id  uuid;
  v_existing   uuid;
BEGIN
  -- 未認証は拒否
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- すでにテナントを持っているユーザーは作成不可
  SELECT tenant_id INTO v_existing
  FROM public.user_tenants
  WHERE user_id = auth.uid()
  LIMIT 1;

  IF v_existing IS NOT NULL THEN
    RAISE EXCEPTION 'already_has_tenant: このアカウントはすでに会社登録済みです';
  END IF;

  -- テナント作成
  INSERT INTO public.tenants (name)
  VALUES (tenant_name)
  RETURNING id INTO v_tenant_id;

  -- 呼び出しユーザーをオーナーとして紐付け
  INSERT INTO public.user_tenants (user_id, tenant_id, role)
  VALUES (auth.uid(), v_tenant_id, 'owner');

  RETURN v_tenant_id;
END;
$$;
