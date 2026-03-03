'use client'

import { useState } from 'react'
import type { CSSProperties } from 'react'

type FieldDeliveryItem = {
  id: string
  product_id: string
  quantity: number
  product: { id: string; name: string } | null
}

type Props = {
  deliveryId: string
  status: string
  items: FieldDeliveryItem[]
}

export default function ItemList({ deliveryId, status, items: initial }: Props) {
  const [items, setItems]       = useState<FieldDeliveryItem[]>(initial)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editQty, setEditQty]   = useState<string>('')
  const [saving, setSaving]     = useState(false)

  const isEditable = status === 'editable'

  const startEdit = (item: FieldDeliveryItem) => {
    setEditingId(item.id)
    setEditQty(String(item.quantity))
  }

  const cancelEdit = () => { setEditingId(null); setEditQty('') }

  const commitEdit = async (itemId: string) => {
    const qty = Number(editQty)
    if (isNaN(qty) || qty < 0) return
    setSaving(true)
    const res = await fetch(`/api/deliveries/${deliveryId}/items/${itemId}`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ quantity: qty }),
    })
    setSaving(false)
    if (!res.ok) return
    setItems(prev => prev.map(i => i.id === itemId ? { ...i, quantity: qty } : i))
    setEditingId(null)
  }

  const remove = async (itemId: string, name: string) => {
    if (!confirm(`「${name}」を削除しますか？`)) return
    const res = await fetch(`/api/deliveries/${deliveryId}/items/${itemId}`, { method: 'DELETE' })
    if (!res.ok) return
    setItems(prev => prev.filter(i => i.id !== itemId))
  }

  return (
    <div style={s.card}>
      {items.map((item, idx) => (
        <div key={item.id}>
          {idx > 0 && <div style={s.divider} />}
          <div style={s.itemRow}>
            <span style={s.itemName}>{item.product?.name ?? '—'}</span>

            {isEditable && editingId === item.id ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <input
                  type="number"
                  min="0"
                  value={editQty}
                  onChange={e => setEditQty(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') void commitEdit(item.id)
                    if (e.key === 'Escape') cancelEdit()
                  }}
                  onBlur={() => void commitEdit(item.id)}
                  disabled={saving}
                  autoFocus
                  style={{ width: 72, padding: '5px 8px', border: '1px solid #2563eb', borderRadius: 4, fontSize: 15, textAlign: 'right' }}
                />
                <button onClick={cancelEdit} style={s.btnCancel}>✕</button>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span
                  style={{ ...s.itemQty, ...(isEditable ? s.itemQtyEditable : {}) }}
                  onClick={() => { if (isEditable) startEdit(item) }}
                >
                  {item.quantity}
                </span>
                {isEditable && (
                  <>
                    <button onClick={() => startEdit(item)} style={s.btnEdit}>編集</button>
                    <button onClick={() => void remove(item.id, item.product?.name ?? '商品')} style={s.btnDel}>削除</button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      ))}
      {items.length === 0 && (
        <p style={{ padding: '16px 0', textAlign: 'center', color: '#9ca3af', fontSize: 14 }}>商品がありません</p>
      )}
    </div>
  )
}

const s: Record<string, CSSProperties> = {
  card: {
    background: '#fff', border: '1px solid #e5e7eb',
    borderRadius: 12, padding: '4px 16px', marginBottom: 16,
  },
  divider: { borderTop: '1px solid #f3f4f6' },
  itemRow: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '12px 0', minHeight: 44,
  },
  itemName:         { fontSize: 15, color: '#111827', flex: 1, marginRight: 12 },
  itemQty:          { fontSize: 15, fontWeight: 600, color: '#374151', flexShrink: 0 },
  itemQtyEditable:  { cursor: 'pointer', textDecoration: 'underline dotted', color: '#2563eb' },
  btnEdit:   { padding: '3px 9px', fontSize: 12, background: '#f3f4f6', color: '#374151', border: '1px solid #d1d5db', borderRadius: 4, cursor: 'pointer' },
  btnDel:    { padding: '3px 9px', fontSize: 12, background: '#fee2e2', color: '#b91c1c', border: '1px solid #fca5a5', borderRadius: 4, cursor: 'pointer' },
  btnCancel: { padding: '3px 8px', fontSize: 12, background: '#f3f4f6', color: '#6b7280', border: '1px solid #d1d5db', borderRadius: 4, cursor: 'pointer' },
}
