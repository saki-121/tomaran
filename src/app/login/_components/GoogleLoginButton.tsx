'use client'

import { createClient } from '@/lib/supabase/client'

export default function GoogleLoginButton() {
  const supabase = createClient()

  async function googleLogin() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
  }

  return (
    <button
      onClick={googleLogin}
      style={{ padding: '12px 24px', fontSize: 16, cursor: 'pointer' }}
    >
      Googleでログイン
    </button>
  )
}
