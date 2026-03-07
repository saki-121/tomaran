'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function LoginForm() {
  const supabase = createClient()
  const router   = useRouter()

  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [error,    setError]    = useState<string | null>(null)
  const [loading,  setLoading]  = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <label style={labelStyle}>メールアドレス</label>
        <input
          type="email"
          required
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="you@example.com"
          style={inputStyle}
        />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <label style={labelStyle}>パスワード</label>
        <input
          type="password"
          required
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="••••••••"
          style={inputStyle}
        />
      </div>

      {error && (
        <p style={{ margin: 0, fontSize: 13, color: '#DC2626' }}>{error}</p>
      )}

      <button type="submit" disabled={loading} style={buttonStyle(loading)}>
        {loading ? 'ログイン中…' : 'メールでログイン'}
      </button>

      <p style={{ margin: 0, fontSize: 13, color: '#777', textAlign: 'center' }}>
        <a href="/forgot-password" style={{ color: '#A16207', fontWeight: 600 }}>パスワードをお忘れの方はこちら</a>
      </p>

      <p style={{ margin: 0, fontSize: 13, color: '#777', textAlign: 'center' }}>
        アカウントをお持ちでない方は{' '}
        <a href="/signup" style={{ color: '#A16207', fontWeight: 600 }}>新規登録</a>
      </p>
    </form>
  )
}

const labelStyle: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 600,
  color: '#555',
}

const inputStyle: React.CSSProperties = {
  padding: '10px 12px',
  border: '1px solid #D0CAC3',
  borderRadius: 6,
  fontSize: 14,
  outline: 'none',
  background: '#FDFCFB',
  width: '100%',
  boxSizing: 'border-box',
}

function buttonStyle(loading: boolean): React.CSSProperties {
  return {
    padding: '11px 0',
    background: loading ? '#C9A227' : '#A16207',
    color: '#fff',
    border: 'none',
    borderRadius: 6,
    fontSize: 15,
    fontWeight: 600,
    cursor: loading ? 'not-allowed' : 'pointer',
    opacity: loading ? 0.8 : 1,
  }
}
