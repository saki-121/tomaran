-- profiles テーブルに stripe_subscription_id を追加
-- サブスクリプション ID を保存し、Billing Portal との紐付けに使用

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;

CREATE INDEX IF NOT EXISTS idx_profiles_stripe_subscription_id
  ON profiles (stripe_subscription_id)
  WHERE stripe_subscription_id IS NOT NULL;
