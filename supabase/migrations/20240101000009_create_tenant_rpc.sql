-- ============================================================
-- MIGRATION 009: create_tenant_for_user RPC
-- tenants テーブルは INSERT ポリシーなしのため、
-- SECURITY DEFINER 関数経由で安全に作成する
-- ============================================================

CREATE OR REPLACE FUNCTION public.create_tenant_for_user(tenant_name text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tenant_id uuid;
BEGIN
  -- 未認証は拒否
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- ① テナント作成（RLS をバイパス）
  INSERT INTO public.tenants (name)
  VALUES (tenant_name)
  RETURNING id INTO v_tenant_id;

  -- ② 呼び出しユーザーをオーナーとして紐付け
  INSERT INTO public.user_tenants (user_id, tenant_id, role)
  VALUES (auth.uid(), v_tenant_id, 'owner');

  RETURN v_tenant_id;
END;
$$;
