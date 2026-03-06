-- stripe_webhook_logs — Stripe Webhook 受信ログ
-- サービスロール専用（RLS 有効・ポリシーなし）

CREATE TABLE stripe_webhook_logs (
  id            uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id      text        NOT NULL,
  event_type    text        NOT NULL,
  payload       jsonb       NOT NULL,
  status        text        NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending', 'success', 'error', 'ignored')),
  error_message text,
  created_at    timestamptz DEFAULT now() NOT NULL
);

-- 同一 event_id の重複チェック用
CREATE INDEX idx_stripe_webhook_logs_event_id   ON stripe_webhook_logs (event_id);
-- 管理者が時系列で参照できるよう
CREATE INDEX idx_stripe_webhook_logs_created_at ON stripe_webhook_logs (created_at DESC);
CREATE INDEX idx_stripe_webhook_logs_status      ON stripe_webhook_logs (status);

-- サービスロール（admin client）のみアクセス可。アプリ側 anon/user は参照不可。
ALTER TABLE stripe_webhook_logs ENABLE ROW LEVEL SECURITY;
-- ポリシー追加なし → service_role のみ操作可能
