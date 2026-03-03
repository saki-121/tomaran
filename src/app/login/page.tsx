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
      background: '#f9fafb',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      padding: '16px',
    }}>
      <div style={{
        width: '100%',
        maxWidth: 400,
        background: '#fff',
        borderRadius: 12,
        padding: '40px 32px',
        boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
      }}>
        <p style={{ margin: '0 0 4px', fontSize: 12, color: '#9ca3af', letterSpacing: '0.05em' }}>建設クラウド</p>
        <h1 style={{ margin: '0 0 28px', fontSize: 22, fontWeight: 700, color: '#111827' }}>
          ログイン / 新規登録
        </h1>

        <GoogleLoginButton />

        <div style={{
          marginTop: 20,
          padding: '14px 16px',
          background: '#f3f4f6',
          borderRadius: 8,
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
