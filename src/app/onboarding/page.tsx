'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

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
    <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f5f5', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ background: '#fff', border: '1px solid #ddd', borderRadius: 10, padding: '36px 32px', width: '100%', maxWidth: 400, boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
        <h1 style={{ margin: '0 0 6px', fontSize: 22, fontWeight: 700, color: '#1a1a2e' }}>会社を作成</h1>
        <p style={{ margin: '0 0 24px', fontSize: 13, color: '#666' }}>ご利用を始めるには会社名を登録してください。</p>

        <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4, color: '#333' }}>
          会社名 <span style={{ color: 'red' }}>*</span>
        </label>
        <input
          type="text"
          placeholder="例：株式会社○○"
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') void createCompany() }}
          disabled={loading}
          style={{ width: '100%', padding: '9px 12px', border: '1px solid #ccc', borderRadius: 5, fontSize: 15, boxSizing: 'border-box', marginBottom: 12 }}
        />

        {error && <p style={{ color: 'red', fontSize: 13, margin: '0 0 10px' }}>{error}</p>}

        <button
          onClick={() => void createCompany()}
          disabled={loading}
          style={{ width: '100%', padding: '11px 0', background: '#1a1a2e', color: '#fff', border: 'none', borderRadius: 5, fontSize: 15, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}
        >
          {loading ? '作成中…' : '作成して開始'}
        </button>
      </div>
    </div>
  )
}
