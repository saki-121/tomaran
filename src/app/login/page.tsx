import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import GoogleLoginButton from './_components/GoogleLoginButton'

export default async function LoginPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    redirect('/dashboard')
  }

  return (
    <div
      style={{
        height: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'column',
        gap: 20,
      }}
    >
      <h1>ログイン</h1>
      <GoogleLoginButton />
    </div>
  )
}
