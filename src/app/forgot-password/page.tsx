'use client'

import { createClient } from '@/lib/supabase/client'
import { useState } from 'react'

export default function ForgotPasswordPage() {
  const supabase = createClient()

  const [email,   setEmail]   = useState('')
  const [loading, setLoading] = useState(false)
  const [done,    setDone]    = useState(false)
  const [error,   setError]   = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const redirectTo = `${process.env.NEXT_PUBLIC_SITE_URL ?? window.location.origin}/auth/callback?next=/reset-password`

    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    setDone(true)
  }

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
        <h1 style={{ margin: '0 0 8px', fontSize: 22, fontWeight: 700, color: '#333333' }}>
          パスワードをリセット
        </h1>
        <p style={{ margin: '0 0 28px', fontSize: 14, color: '#777777', lineHeight: 1.7 }}>
          登録したメールアドレスを入力してください。<br />
          リセット用のリンクをお送りします。
        </p>

        {done ? (
          <div style={{
            padding: '20px 16px',
            background: '#F0FDF4',
            border: '1px solid #BBF7D0',
            borderRadius: 8,
            fontSize: 14,
            color: '#166534',
            lineHeight: 1.7,
          }}>
            <p style={{ margin: '0 0 6px', fontWeight: 700 }}>メールを送信しました</p>
            <p style={{ margin: 0 }}>
              <strong>{email}</strong> に届いたメール内のリンクからパスワードを変更してください。
            </p>
          </div>
        ) : (
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

            {error && (
              <p style={{ margin: 0, fontSize: 13, color: '#DC2626' }}>{error}</p>
            )}

            <button type="submit" disabled={loading} style={buttonStyle(loading)}>
              {loading ? '送信中…' : 'リセットメールを送る'}
            </button>

            <p style={{ margin: 0, fontSize: 13, color: '#777', textAlign: 'center' }}>
              <a href="/login" style={{ color: '#A16207', fontWeight: 600 }}>ログインに戻る</a>
            </p>
          </form>
        )}
      </div>
    </div>
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
