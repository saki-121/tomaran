'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function ResetPasswordPage() {
  const supabase = createClient()
  const router   = useRouter()

  const [password, setPassword] = useState('')
  const [confirm,  setConfirm]  = useState('')
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState<string | null>(null)

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

    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
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
          新しいパスワードを設定
        </h1>
        <p style={{ margin: '0 0 28px', fontSize: 14, color: '#777777' }}>
          8文字以上で入力してください。
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={labelStyle}>新しいパスワード</label>
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
            {loading ? '更新中…' : 'パスワードを変更する'}
          </button>
        </form>
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
