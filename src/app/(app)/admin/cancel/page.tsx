'use client'

import { useState } from 'react'

const REASONS = [
  { id: 'closed',      label: '廃業' },
  { id: 'staff',       label: '担当者が変わった' },
  { id: 'hard',        label: '使いづらい' },
  { id: 'migrated',    label: '他のツールに移行' },
  { id: 'low_usage',   label: '利用頻度が少ない' },
]

export default function CancelPage() {
  const [open, setOpen]       = useState(false)
  const [selected, setSelected] = useState<string[]>([])
  const [other, setOther]     = useState('')
  const [loading, setLoading] = useState(false)
  const [err, setErr]         = useState<string | null>(null)

  const toggle = (id: string) =>
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])

  const proceed = async () => {
    setLoading(true)
    setErr(null)
    const res = await fetch('/api/stripe/portal', { method: 'POST' })
    const d   = await res.json()
    if (!res.ok || !d.url) {
      setErr(d.error ?? 'エラーが発生しました。お問い合わせください。')
      setLoading(false)
      return
    }
    window.location.href = d.url
  }

  return (
    <div style={{ maxWidth: 520, fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <h2 style={{ marginBottom: 8, color: '#333333' }}>解約</h2>
      <p style={{ fontSize: 14, color: '#777777', marginBottom: 28, lineHeight: 1.7 }}>
        解約をご希望の場合は、以下のボタンから手続きを進めてください。
        手続きは Stripe のサブスクリプション管理ページで行います。
      </p>

      <button
        onClick={() => setOpen(true)}
        style={{
          padding: '10px 24px',
          background: '#FEF2F2',
          color: '#DC2626',
          border: '1px solid #FECACA',
          borderRadius: 6,
          fontSize: 14,
          fontWeight: 600,
          cursor: 'pointer',
        }}
      >
        解約する
      </button>

      {/* ── モーダル ──────────────────────────────────────────────────── */}
      {open && (
        <div style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 200, padding: 16,
        }}>
          <div style={{
            background: '#FFFFFF', borderRadius: 12,
            border: '1px solid #E5E0DA',
            padding: '32px 28px', width: '100%', maxWidth: 480,
            boxShadow: '4px 4px 0 #E5E0DA',
          }}>
            <h3 style={{ margin: '0 0 6px', fontSize: 17, fontWeight: 700, color: '#333333' }}>
              解約アンケート（任意）
            </h3>
            <p style={{ margin: '0 0 18px', fontSize: 12, color: '#777777' }}>
              よろしければ理由を教えてください。複数選択可。
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
              {REASONS.map(r => (
                <label key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, cursor: 'pointer', color: '#555555' }}>
                  <input
                    type="checkbox"
                    checked={selected.includes(r.id)}
                    onChange={() => toggle(r.id)}
                    style={{ width: 16, height: 16, cursor: 'pointer' }}
                  />
                  {r.label}
                </label>
              ))}
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 14, cursor: 'pointer', color: '#555555' }}>
                <input
                  type="checkbox"
                  checked={selected.includes('other')}
                  onChange={() => toggle('other')}
                  style={{ width: 16, height: 16, marginTop: 3, cursor: 'pointer' }}
                />
                その他
              </label>
              {selected.includes('other') && (
                <textarea
                  value={other}
                  onChange={e => setOther(e.target.value)}
                  placeholder="自由記述"
                  rows={2}
                  style={{
                    width: '100%', padding: '8px 10px',
                    border: '1px solid #D0CAC3', borderRadius: 6,
                    fontSize: 13, resize: 'vertical', boxSizing: 'border-box',
                    background: '#FFFFFF', color: '#333333',
                  }}
                />
              )}
            </div>

            <div style={{
              background: '#FEF2F2', border: '1px solid #FECACA',
              borderRadius: 6, padding: '12px 14px',
              marginBottom: 20, fontSize: 12, color: '#DC2626', lineHeight: 1.75,
            }}>
              <p style={{ margin: '0 0 4px', fontWeight: 600 }}>解約前にご確認ください</p>
              <p style={{ margin: 0 }}>
                解約すると、このサービスに登録された全てのデータは解約日から30日後に削除されます。
              </p>
              <p style={{ margin: '4px 0 0' }}>
                解約されたアカウントではログインできません。
              </p>
            </div>

            {err && <p style={{ color: '#ef4444', fontSize: 13, marginBottom: 12 }}>{err}</p>}

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button
                onClick={() => { setOpen(false); setErr(null) }}
                disabled={loading}
                style={{ padding: '9px 20px', background: '#F0EDE8', color: '#777777', border: '1px solid #D0CAC3', borderRadius: 6, fontSize: 14, cursor: 'pointer' }}
              >
                キャンセル
              </button>
              <button
                onClick={() => void proceed()}
                disabled={loading}
                style={{
                  padding: '9px 20px',
                  background: loading ? 'rgba(239,68,68,0.5)' : '#ef4444',
                  color: '#fff', border: 'none', borderRadius: 6,
                  fontSize: 14, fontWeight: 600,
                  cursor: loading ? 'not-allowed' : 'pointer',
                }}
              >
                {loading ? '処理中…' : '解約手続きへ'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
