import Link from 'next/link'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const BG   = '#0a0f1e'
const CARD = '#111827'
const Y    = '#FFD700'

export default async function PaymentSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>
}) {
  const { session_id } = await searchParams

  // session_id がある場合、Stripe で確認して is_paid を即時更新
  // （Webhook が遅延した場合のフォールバック）
  if (session_id) {
    try {
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
      const supabase = await createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        const session = await stripe.checkout.sessions.retrieve(session_id)
        if (session.payment_status === 'paid') {
          const admin = createAdminClient()
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (admin as any)
            .from('profiles')
            .update({
              is_paid: true,
              subscription_status: 'active',
              stripe_customer_id: session.customer,
            })
            .eq('id', user.id)
        }
      }
    } catch {
      // Stripe エラーは無視（Webhook がバックグラウンドで処理する）
    }
  }

  return (
    <div style={{
      minHeight: '100dvh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: BG,
      fontFamily: 'system-ui, -apple-system, sans-serif',
      padding: '16px',
    }}>
      <p style={{ fontWeight: 900, fontSize: 22, color: Y, letterSpacing: 1, marginBottom: 40 }}>
        tomaran
      </p>

      <div style={{
        width: '100%', maxWidth: 440,
        background: CARD,
        borderRadius: 12,
        padding: '48px 32px',
        textAlign: 'center',
        border: '1px solid rgba(255,215,0,0.15)',
      }}>
        <div style={{
          width: 64, height: 64, borderRadius: '50%',
          background: '#34d399', color: '#000',
          fontSize: 32, fontWeight: 700,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 20px',
        }}>
          ✓
        </div>
        <h1 style={{ margin: '0 0 8px', fontSize: 22, fontWeight: 700, color: '#fff' }}>
          決済完了しました！
        </h1>
        <p style={{ margin: '0 0 32px', fontSize: 14, color: '#9ca3af', lineHeight: 1.75 }}>
          ありがとうございます。<br />
          全機能をご利用いただけます。
        </p>
        <Link
          href="/deliveries"
          style={{
            display: 'block',
            width: '100%',
            padding: '14px 0',
            background: Y,
            color: '#000',
            borderRadius: 8,
            fontSize: 15,
            fontWeight: 700,
            textDecoration: 'none',
          }}
        >
          納品一覧へ →
        </Link>
      </div>
    </div>
  )
}
