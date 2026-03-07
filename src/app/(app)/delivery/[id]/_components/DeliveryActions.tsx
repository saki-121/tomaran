'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { CSSProperties } from 'react'

type Props = {
  deliveryId: string
  deliveryDate: string  // YYYY-MM-DD
  status: string
}

export default function DeliveryActions({ deliveryId, deliveryDate, status }: Props) {
  const router = useRouter()
  const [editingDate, setEditingDate] = useState(false)
  const [dateValue, setDateValue]     = useState(deliveryDate)
  const [saving, setSaving]           = useState(false)
  const [deleting, setDeleting]       = useState(false)
  const [err, setErr]                 = useState<string | null>(null)

  if (status !== 'editable') return null

  const saveDate = async () => {
    setSaving(true)
    setErr(null)
    const res = await fetch(`/api/deliveries/${deliveryId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ delivery_date: dateValue }),
    })
    setSaving(false)
    if (!res.ok) {
      const d = await res.json()
      setErr(d.error ?? 'エラーが発生しました')
      return
    }
    setEditingDate(false)
    router.refresh()
  }

  const handleDelete = async () => {
    if (!confirm('この納品を削除しますか？\n操作は取り消せません。')) return
    setDeleting(true)
    setErr(null)
    const res = await fetch(`/api/deliveries/${deliveryId}`, { method: 'DELETE' })
    if (!res.ok) {
      const d = await res.json()
      setErr(d.error ?? 'エラーが発生しました')
      setDeleting(false)
      return
    }
    router.push('/delivery')
  }

  return (
    <div style={s.wrap}>
      {err && <p style={s.err}>{err}</p>}

      {editingDate ? (
        <div style={s.editRow}>
          <input
            type="date"
            value={dateValue}
            onChange={e => setDateValue(e.target.value)}
            style={s.dateInput}
          />
          <button onClick={() => void saveDate()} disabled={saving} style={s.btnSave}>
            {saving ? '保存中…' : '保存'}
          </button>
          <button onClick={() => { setEditingDate(false); setDateValue(deliveryDate) }} disabled={saving} style={s.btnCancel}>
            取消
          </button>
        </div>
      ) : (
        <div style={s.actionRow}>
          <button onClick={() => setEditingDate(true)} style={s.btnEdit}>
            納品日を変更
          </button>
          <button onClick={() => void handleDelete()} disabled={deleting} style={s.btnDelete}>
            {deleting ? '削除中…' : 'この納品を削除'}
          </button>
        </div>
      )}
    </div>
  )
}

const s: Record<string, CSSProperties> = {
  wrap: {
    marginTop: 24,
    padding: '16px',
    background: '#fff',
    border: '1px solid #e5e7eb',
    borderRadius: 12,
  },
  err: { color: '#dc2626', fontSize: 13, margin: '0 0 10px' },
  actionRow: { display: 'flex', gap: 10, flexWrap: 'wrap' },
  editRow:   { display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' },
  dateInput: {
    padding: '8px 10px', fontSize: 15,
    border: '1px solid #d1d5db', borderRadius: 8,
    flex: 1, minWidth: 140,
  },
  btnEdit: {
    padding: '10px 16px', fontSize: 14, fontWeight: 600,
    background: '#fff', color: '#374151',
    border: '1px solid #d1d5db', borderRadius: 8, cursor: 'pointer',
    minHeight: 44,
  },
  btnSave: {
    padding: '10px 20px', fontSize: 14, fontWeight: 600,
    background: '#1a1a2e', color: '#fff',
    border: 'none', borderRadius: 8, cursor: 'pointer',
    minHeight: 44,
  },
  btnCancel: {
    padding: '10px 16px', fontSize: 14,
    background: '#f3f4f6', color: '#374151',
    border: 'none', borderRadius: 8, cursor: 'pointer',
    minHeight: 44,
  },
  btnDelete: {
    padding: '10px 16px', fontSize: 14, fontWeight: 600,
    background: '#fff', color: '#dc2626',
    border: '1px solid #fca5a5', borderRadius: 8, cursor: 'pointer',
    minHeight: 44,
  },
}
