import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import GoogleLoginButton from './_components/GoogleLoginButton'

export default async function LoginPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) redirect('/deliveries')

  return (
    <div style={{
      minHeight: '100dvh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#0a0f1e',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      padding: '16px',
    }}>
      <div style={{
        width: '100%',
        maxWidth: 400,
        background: '#111827',
        borderRadius: 12,
        padding: '40px 32px',
        border: '1px solid rgba(255,215,0,0.15)',
      }}>
        <p style={{ margin: '0 0 4px', fontSize: 12, color: '#FFD700', letterSpacing: '0.12em', fontWeight: 700 }}>tomaran</p>
        <h1 style={{ margin: '0 0 28px', fontSize: 22, fontWeight: 700, color: '#fff' }}>
          ログイン / 新規登録
        </h1>

        <GoogleLoginButton />

        <div style={{
          marginTop: 20,
          padding: '14px 16px',
          background: '#1a2035',
          borderRadius: 8,
          border: '1px solid rgba(255,255,255,0.06)',
          fontSize: 12,
          color: '#6b7280',
          lineHeight: 1.75,
        }}>
          <p style={{ margin: '0 0 6px' }}>
            このサービスは会社ごとのアカウント制です。登録には会社用のGoogleアカウントをご利用ください。1会社につき1アカウントのみ作成できます。
          </p>
          <p style={{ margin: 0 }}>
            ※ すでに登録済みの会社は再登録不要です。
          </p>
        </div>
      </div>
    </div>
  )
}
