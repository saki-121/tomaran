'use client'

import { useEffect, useState } from 'react'

type Profile = {
  company_name: string | null
  address: string | null
  phone: string | null
  invoice_registration_number: string | null
}

const empty: Profile = { company_name: '', address: '', phone: '', invoice_registration_number: '' }

export default function OwnMasterPage() {
  const [profile, setProfile] = useState<Profile>(empty)
  const [loading, setLoading]  = useState(true)
  const [saving, setSaving]    = useState(false)
  const [msg, setMsg]          = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/masters/own')
      .then(r => r.json())
      .then(d => { if (d.profile) setProfile(d.profile) })
      .finally(() => setLoading(false))
  }, [])

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setMsg(null)
    const res = await fetch('/api/masters/own', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profile),
    })
    const d = await res.json()
    if (!res.ok) { setMsg(`エラー: ${d.error}`); setSaving(false); return }
    setMsg('保存しました')
    setSaving(false)
  }

  if (loading) return <p>読み込み中…</p>

  const field = (label: string, key: keyof Profile, placeholder = '') => (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: 'block', fontWeight: 600, marginBottom: 4, fontSize: 13 }}>
        {label}
      </label>
      <input
        value={profile[key] ?? ''}
        onChange={e => setProfile(p => ({ ...p, [key]: e.target.value }))}
        placeholder={placeholder}
        style={{ width: '100%', padding: '8px 10px', border: '1px solid #ccc', borderRadius: 4, fontSize: 14, boxSizing: 'border-box' }}
      />
    </div>
  )

  return (
    <div>
      <h2 style={{ marginBottom: 24 }}>自社設定</h2>
      <form onSubmit={save} style={{ maxWidth: 560 }}>
        {field('会社名', 'company_name', '例：株式会社〇〇')}
        {field('住所', 'address', '例：東京都〇〇区…')}
        {field('電話番号', 'phone', '例：03-0000-0000')}
        {field('適格請求書登録番号', 'invoice_registration_number', '例：T1234567890123')}
        <button
          type="submit"
          disabled={saving}
          style={{ padding: '10px 28px', background: '#1a1a2e', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 14 }}
        >
          {saving ? '保存中…' : '保存'}
        </button>
        {msg && <p style={{ marginTop: 12, color: msg.startsWith('エラー') ? 'red' : 'green', fontSize: 14 }}>{msg}</p>}
      </form>
    </div>
  )
}
