import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import SignupForm from './_components/SignupForm'

export default async function SignupPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) redirect('/dashboard')

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
          新規登録
        </h1>

        <SignupForm />
      </div>
    </div>
  )
}
