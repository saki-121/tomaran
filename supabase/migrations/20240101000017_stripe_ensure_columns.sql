-- =============================================================================
-- MIGRATION 017: Stripe サブスク連携カラムの確実な存在保証
-- 冪等(IF NOT EXISTS)。過去 migration 適用済み環境でも安全に実行可能。
-- =============================================================================

-- ── 1. カラム追加（存在しない場合のみ） ──────────────────────────────────────
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS stripe_customer_id     TEXT,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT,
  ADD COLUMN IF NOT EXISTS subscription_status    TEXT NOT NULL DEFAULT 'inactive';

-- ── 2. インデックス（webhook の .eq('stripe_customer_id', ...) 高速化） ──────
CREATE INDEX IF NOT EXISTS idx_profiles_stripe_customer_id
  ON public.profiles (stripe_customer_id)
  WHERE stripe_customer_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_profiles_stripe_subscription_id
  ON public.profiles (stripe_subscription_id)
  WHERE stripe_subscription_id IS NOT NULL;

-- ── 3. mark_user_as_paid RPC を更新 ─────────────────────────────────────────
-- 以前は is_paid しか更新していなかった → subscription_status も同時に active にする
CREATE OR REPLACE FUNCTION public.mark_user_as_paid(target_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- 呼び出し元が自分自身かチェック（SECURITY DEFINER の権限昇格を制限）
  IF auth.uid() IS DISTINCT FROM target_user_id THEN
    RAISE EXCEPTION 'Unauthorized: cannot update another user''s profile';
  END IF;

  UPDATE public.profiles
  SET
    is_paid             = true,
    subscription_status = 'active'
  WHERE id = target_user_id;
END;
$$;

-- ── 4. 既存の支払済みユーザーを backfill ─────────────────────────────────────
-- is_paid = true なのに subscription_status が 'inactive' のままのユーザーを修正
UPDATE public.profiles
SET subscription_status = 'active'
WHERE is_paid = true
  AND subscription_status = 'inactive';
