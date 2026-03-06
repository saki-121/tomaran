import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import PaymentActions from './_components/PaymentActions'

const BG   = '#FDFCFB'
const CARD = '#FFFFFF'

export default async function PaymentRequiredPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profile } = await (supabase as any)
    .from('profiles')
    .select('subscription_status')
    .eq('id', user.id)
    .maybeSingle()

  const isCanceled = profile?.subscription_status === 'canceled'

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
      {/* ロゴ */}
      <p style={{ fontWeight: 900, fontSize: 22, color: '#A16207', letterSpacing: 1, marginBottom: 32 }}>
        tomaran
      </p>

      <div style={{
        width: '100%',
        maxWidth: 440,
        background: CARD,
        borderRadius: 12,
        padding: '40px 32px',
        border: '1px solid #E5E0DA',
        boxShadow: '4px 4px 0 #E5E0DA',
      }}>
        <h1 style={{ margin: '0 0 10px', fontSize: 20, fontWeight: 700, color: '#333333' }}>
          {isCanceled ? 'サブスクリプションが解約されています' : 'サービスの利用を開始する'}
        </h1>
        <p style={{ margin: '0 0 28px', fontSize: 13, color: '#777777', lineHeight: 1.75 }}>
          {isCanceled
            ? 'このアカウントのサブスクリプションは解約済みです。再度ご利用の場合は再購入してください。'
            : '以下のプランでサービスをご利用いただけます。'}
        </p>

        {/* プランカード */}
        <div style={{
          background: '#F5F0EB',
          border: '1px solid #E5E0DA',
          borderRadius: 10,
          padding: '20px 20px',
          marginBottom: 24,
        }}>
          <p style={{ margin: '0 0 4px', fontSize: 12, fontWeight: 700, color: '#A16207', letterSpacing: '0.1em' }}>
            STANDARD PLAN
          </p>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 16 }}>
            <span style={{ fontSize: 36, fontWeight: 900, color: '#333333' }}>¥14,800</span>
            <span style={{ fontSize: 14, color: '#777777' }}>/ 月（税込）</span>
          </div>

          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              '納品管理・請求書発行 無制限',
              '取引先・商品マスタ登録',
              'Excelインポート対応',
              '見積書PDF出力',
              'LINEサポート付き',
            ].map(f => (
              <li key={f} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: '#555555' }}>
                <span style={{ color: '#A16207', fontWeight: 700, flexShrink: 0 }}>✓</span>
                {f}
              </li>
            ))}
          </ul>
        </div>

        {/* 課金サイクル説明 */}
        <div style={{
          background: '#FFFBEB',
          border: '1px solid #FDE68A',
          borderRadius: 8,
          padding: '12px 16px',
          marginBottom: 24,
          fontSize: 12,
          color: '#777777',
          lineHeight: 1.8,
        }}>
          <p style={{ margin: 0 }}>
            🗓️ <strong style={{ color: '#555555' }}>決済タイミング</strong><br />
            決済日に初回請求が発生します。以降は<strong style={{ color: '#555555' }}>決済日の翌月同日</strong>に自動更新されます。<br />
            <span style={{ fontSize: 11, color: '#888888' }}>例：3月5日に決済 → 次回は4月5日に自動更新</span>
          </p>
        </div>

        <PaymentActions isCanceled={isCanceled} />

        <p style={{ marginTop: 16, fontSize: 11, color: '#888888', textAlign: 'center', lineHeight: 1.7 }}>
          解約は管理画面からいつでも可能。<br />
          決済はStripeにより安全に処理されます。
        </p>
      </div>
    </div>
  )
}
