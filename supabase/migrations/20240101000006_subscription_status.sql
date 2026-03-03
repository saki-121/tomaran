-- profiles テーブルにサブスク追跡フィールドを追加
-- profiles はマイグレーション外で作成済みのため ALTER TABLE で追加

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS subscription_status TEXT NOT NULL DEFAULT 'inactive',
  ADD COLUMN IF NOT EXISTS stripe_customer_id  TEXT;

-- 既存の支払済みユーザーを active に backfill
UPDATE profiles
SET subscription_status = 'active'
WHERE is_paid = true AND subscription_status = 'inactive';
