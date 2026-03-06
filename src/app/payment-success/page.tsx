import Link from 'next/link'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'

const BG   = '#FDFCFB'
const CARD = '#FFFFFF'
const Y    = '#FFD700'

export default async function PaymentSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>
}) {
  const { session_id } = await searchParams

  if (session_id) {
    try {
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
      const supabase = await createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        console.error('[payment-success] user not found in session')
      } else {
        const session = await stripe.checkout.sessions.retrieve(session_id)
        if (session.payment_status === 'paid') {
          const customerId     = typeof session.customer === 'string'
            ? session.customer
            : (session.customer as { id?: string } | null)?.id ?? null
          const subscriptionId = typeof session.subscription === 'string'
            ? session.subscription
            : (session.subscription as { id?: string } | null)?.id ?? null

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { error } = await (supabase as any).rpc('mark_user_as_paid', {
            target_user_id: user.id,
          })
          if (error) {
            console.error('[payment-success] mark_user_as_paid failed:', error)
          }

          // Webhook に頼らず、ここでも確実に保存する
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (supabase as any)
            .from('profiles')
            .update({
              ...(customerId     ? { stripe_customer_id:      customerId     } : {}),
              ...(subscriptionId ? { stripe_subscription_id: subscriptionId } : {}),
            })
            .eq('id', user.id)
        }
      }
    } catch (err) {
      console.error('[payment-success] error:', err)
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
      <p style={{ fontWeight: 900, fontSize: 22, color: '#A16207', letterSpacing: 1, marginBottom: 40 }}>
        tomaran
      </p>

      {/* ステップ表示 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 32 }}>
        {[
          { n: '1', label: 'Google登録', done: true },
          { n: '2', label: '決済完了', done: true },
          { n: '3', label: '会社名登録', active: true },
        ].map((step, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {i > 0 && <span style={{ color: '#D0CAC3', fontSize: 12 }}>→</span>}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{
                width: 24, height: 24, borderRadius: '50%',
                background: step.done || step.active ? Y : '#F0EDE8',
                color: step.done || step.active ? '#000' : '#888888',
                fontSize: 11, fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {step.done ? '✓' : step.n}
              </span>
              <span style={{ fontSize: 12, color: step.active ? '#333333' : step.done ? '#777777' : '#888888', fontWeight: step.active ? 700 : 400 }}>
                {step.label}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div style={{
        width: '100%', maxWidth: 440,
        background: CARD,
        borderRadius: 12,
        padding: '48px 32px',
        textAlign: 'center',
        border: '1px solid #E5E0DA',
        boxShadow: '4px 4px 0 #E5E0DA',
      }}>
        <div style={{
          width: 64, height: 64, borderRadius: '50%',
          background: '#16A34A', color: '#fff',
          fontSize: 32, fontWeight: 700,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 20px',
        }}>
          ✓
        </div>
        <h1 style={{ margin: '0 0 8px', fontSize: 22, fontWeight: 700, color: '#333333' }}>
          決済完了しました！
        </h1>
        <p style={{ margin: '0 0 32px', fontSize: 14, color: '#777777', lineHeight: 1.75 }}>
          最後に会社名を登録してください。<br />
          あとから変更できます。
        </p>

        {/* LINEお問い合わせ案内 */}
        <div style={{
          background: 'rgba(0, 200, 0, 0.07)',
          border: '1px solid rgba(0, 200, 0, 0.25)',
          borderRadius: 8,
          padding: '16px',
          margin: '0 0 32px',
        }}>
          <p style={{ margin: '0 0 12px', fontSize: 13, color: '#555555' }}>
            🤔 ご不明な点はLINEからお気軽にお問い合わせください
          </p>
          <a
            href="https://lin.ee/2WeE9qB"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-block',
              padding: '8px 16px',
              fontSize: 13,
              fontWeight: 600,
              background: '#00C300',
              color: '#fff',
              textDecoration: 'none',
              borderRadius: 6,
            }}
          >
            💬 LINEで問い合わせ
          </a>
        </div>
        <Link
          href="/onboarding"
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
          会社名を登録 →
        </Link>
      </div>
    </div>
  )
}
