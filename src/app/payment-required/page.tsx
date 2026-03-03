import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import PaymentActions from './_components/PaymentActions'

export default async function PaymentRequiredPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // 解約済みか新規未払いかを判定
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
      alignItems: 'center',
      justifyContent: 'center',
      background: '#f9fafb',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      padding: '16px',
    }}>
      <div style={{
        width: '100%',
        maxWidth: 440,
        background: '#fff',
        borderRadius: 12,
        padding: '40px 32px',
        boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
      }}>
        <h1 style={{ margin: '0 0 10px', fontSize: 20, fontWeight: 700, color: '#111827' }}>
          {isCanceled ? 'サブスクリプションが解約されています' : 'サービスの利用にはお支払いが必要です'}
        </h1>
        <p style={{ margin: '0 0 28px', fontSize: 13, color: '#6b7280', lineHeight: 1.75 }}>
          {isCanceled
            ? 'このアカウントのサブスクリプションは解約済みです。再度ご利用の場合は再購入してください。'
            : '月額 ¥14,800（税込）のサブスクリプションを購入するとサービスをご利用いただけます。'}
        </p>
        <PaymentActions isCanceled={isCanceled} />
      </div>
    </div>
  )
}
