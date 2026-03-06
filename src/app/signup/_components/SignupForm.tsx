'use client'

import { createClient } from '@/lib/supabase/client'
import { useState } from 'react'

export default function SignupForm() {
  const supabase = createClient()

  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [confirm,  setConfirm]  = useState('')
  const [error,    setError]    = useState<string | null>(null)
  const [done,     setDone]     = useState(false)
  const [loading,  setLoading]  = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (password !== confirm) {
      setError('パスワードが一致しません')
      return
    }
    if (password.length < 8) {
      setError('パスワードは8文字以上で入力してください')
      return
    }

    setLoading(true)

    const { error } = await supabase.auth.signUp({ email, password })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    setDone(true)
  }

  if (done) {
    return (
      <div style={{
        padding: '20px 16px',
        background: '#F0FDF4',
        border: '1px solid #BBF7D0',
        borderRadius: 8,
        fontSize: 14,
        color: '#166534',
        lineHeight: 1.7,
      }}>
        <p style={{ margin: '0 0 6px', fontWeight: 700 }}>確認メールを送信しました</p>
        <p style={{ margin: 0 }}>
          <strong>{email}</strong> に届いたメール内のリンクをクリックして登録を完了してください。
        </p>
      </div>
    )
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
        <label style={labelStyle}>パスワード（8文字以上）</label>
        <input
          type="password"
          required
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="••••••••"
          style={inputStyle}
        />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <label style={labelStyle}>パスワード（確認）</label>
        <input
          type="password"
          required
          value={confirm}
          onChange={e => setConfirm(e.target.value)}
          placeholder="••••••••"
          style={inputStyle}
        />
      </div>

      {error && (
        <p style={{ margin: 0, fontSize: 13, color: '#DC2626' }}>{error}</p>
      )}

      <button type="submit" disabled={loading} style={buttonStyle(loading)}>
        {loading ? '登録中…' : 'アカウントを作成'}
      </button>

      <p style={{ margin: 0, fontSize: 13, color: '#777', textAlign: 'center' }}>
        すでにアカウントをお持ちの方は{' '}
        <a href="/login" style={{ color: '#A16207', fontWeight: 600 }}>ログイン</a>
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
