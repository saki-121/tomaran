import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import GoogleLoginButton from './_components/GoogleLoginButton'
// import LoginForm from './_components/LoginForm'  // メールログイン: 非表示中（コードは保持）

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
      background: '#FDFCFB',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      padding: '16px',
    }}>
      <div style={{
        width: '100%',
        maxWidth: 400,
        background: '#FFFFFF',
        borderRadius: 14,
        padding: '40px 32px',
        border: '1px solid #E5E0DA',
        boxShadow: '4px 4px 0 #E5E0DA',
      }}>
        <p style={{ margin: '0 0 4px', fontSize: 14, color: '#A16207', letterSpacing: '0.12em', fontWeight: 700 }}>tomaran</p>
        <h1 style={{ margin: '0 0 28px', fontSize: 22, fontWeight: 700, color: '#333333' }}>
          ログイン / 新規登録
        </h1>

        <GoogleLoginButton />

        <div style={{
          marginTop: 20,
          padding: '14px 16px',
          background: '#F5F0EB',
          borderRadius: 8,
          border: '1px solid #E5E0DA',
          fontSize: 13,
          color: '#777777',
          lineHeight: 1.75,
        }}>
          <p style={{ margin: '0 0 6px' }}>
            このサービスは会社ごとのアカウント制です。登録には会社用のGoogleアカウントをご利用ください。1会社につき1アカウントのみ作成できます。
          </p>
          <p style={{ margin: 0 }}>
            ※ すでに登録済みの会社は再登録不要です。
          </p>
        </div>

        {/* メールログイン（非表示中 / コードは LoginForm.tsx に保持）
        <LoginForm />
        */}
      </div>
    </div>
  )
}
