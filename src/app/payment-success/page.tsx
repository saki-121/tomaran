import Link from 'next/link'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'

const BG   = '#0a0f1e'
const CARD = '#111827'
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
          // SECURITY DEFINER RPC: auth.uid() チェックで安全に is_paid を更新
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { error } = await (supabase as any).rpc('mark_user_as_paid', {
            target_user_id: user.id,
          })
          if (error) {
            console.error('[payment-success] mark_user_as_paid failed:', error)
          } else {
            console.error('[payment-success] is_paid updated for user:', user.id)
          }
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
      <p style={{ fontWeight: 900, fontSize: 22, color: Y, letterSpacing: 1, marginBottom: 40 }}>
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
            {i > 0 && <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 12 }}>→</span>}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{
                width: 24, height: 24, borderRadius: '50%',
                background: step.done || step.active ? Y : 'rgba(255,255,255,0.1)',
                color: step.done || step.active ? '#000' : '#6b7280',
                fontSize: 11, fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {step.done ? '✓' : step.n}
              </span>
              <span style={{ fontSize: 12, color: step.active ? '#fff' : step.done ? '#9ca3af' : '#6b7280', fontWeight: step.active ? 700 : 400 }}>
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
          最後に会社名を登録してください。<br />
          あとから変更できます。
        </p>
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
