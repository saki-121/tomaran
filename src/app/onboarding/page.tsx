'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const BG    = '#FDFCFB'
const CARD  = '#FFFFFF'
const CARD2 = '#FFFFFF'
const Y     = '#FFD700'

export default function OnboardingPage() {
  const router = useRouter()
  const [name, setName]       = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState<string | null>(null)

  const createCompany = async () => {
    if (!name.trim()) { setError('会社名は必須です'); return }
    setLoading(true)
    setError(null)
    const res = await fetch('/api/tenants', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ name: name.trim() }),
    })
    const d = await res.json()
    setLoading(false)
    if (!res.ok) { setError(d.error ?? 'エラーが発生しました'); return }
    router.push('/deliveries')
  }

  return (
    <div style={{
      minHeight: '100dvh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: BG,
      fontFamily: 'system-ui, -apple-system, sans-serif',
      padding: '16px',
    }}>
      {/* ロゴ */}
      <p style={{ fontWeight: 900, fontSize: 22, color: '#A16207', letterSpacing: 1, marginBottom: 32 }}>
        tomaran
      </p>

      {/* ステップ表示 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 32 }}>
        {[
          { n: '1', label: 'Google登録', done: true },
          { n: '2', label: '決済完了', done: true },
          { n: '3', label: '会社名登録', active: true },
        ].map((step, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {i > 0 && <span style={{ color: '#D0CAC3', fontSize: 12 }}>→</span>}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{
                width: 24, height: 24, borderRadius: '50%',
                background: step.done ? Y : step.active ? Y : '#F0EDE8',
                color: step.done || step.active ? '#000' : '#888888',
                fontSize: 11, fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {step.done ? '✓' : step.n}
              </span>
              <span style={{ fontSize: 12, color: step.active ? '#333333' : step.done ? '#777777' : '#888888', fontWeight: step.active ? 700 : 400 }}>
                {step.label}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* カード */}
      <div style={{
        width: '100%', maxWidth: 400,
        background: CARD,
        borderRadius: 12,
        padding: '36px 32px',
        border: '1px solid #E5E0DA',
        boxShadow: '4px 4px 0 #E5E0DA',
      }}>
        <h1 style={{ margin: '0 0 6px', fontSize: 20, fontWeight: 700, color: '#333333' }}>
          あなたの会社名を登録
        </h1>
        <p style={{ margin: '0 0 24px', fontSize: 13, color: '#777777', lineHeight: 1.7 }}>
          登録後すぐに全機能が使えます。<br />
          あとから変更可能です。
        </p>

        <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6, color: '#777777' }}>
          会社名 <span style={{ color: '#ef4444' }}>*</span>
        </label>
        <input
          type="text"
          placeholder="例：株式会社○○"
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') void createCompany() }}
          disabled={loading}
          style={{
            width: '100%', padding: '11px 14px',
            border: '1px solid #D0CAC3',
            borderRadius: 8, fontSize: 15,
            boxSizing: 'border-box', marginBottom: 12,
            background: CARD2, color: '#333333',
          }}
        />

        {error && <p style={{ color: '#ef4444', fontSize: 13, margin: '0 0 10px' }}>{error}</p>}

        <button
          onClick={() => void createCompany()}
          disabled={loading}
          style={{
            width: '100%', padding: '13px 0',
            background: loading ? 'rgba(255,215,0,0.5)' : Y,
            color: '#000', border: 'none', borderRadius: 8,
            fontSize: 15, fontWeight: 700,
            cursor: loading ? 'not-allowed' : 'pointer',
          }}
        >
          {loading ? '登録中…' : '登録して開始 →'}
        </button>
      </div>

      <p style={{ marginTop: 24, fontSize: 12, color: '#888888', textAlign: 'center', lineHeight: 1.7 }}>
        登録後、納品管理画面に移動します。
      </p>
    </div>
  )
}
