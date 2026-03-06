'use client'

import { useState } from 'react'
import type { CSSProperties } from 'react'

type Item = {
  id: string
  quantity: number
  product: { name: string; spec?: string | null } | null
}

type Props = {
  deliveryId: string
  initialItems: Item[]
  isEditable: boolean
}

export default function DeliveryItemList({ deliveryId, initialItems, isEditable }: Props) {
  const [items, setItems] = useState<Item[]>(initialItems)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editQty, setEditQty] = useState<number>(1)
  const [busy, setBusy] = useState<string | null>(null) // itemId being processed

  function productLabel(item: Item): string {
    if (!item.product) return '（削除された商品）'
    return item.product.spec
      ? `${item.product.name}（${item.product.spec}）`
      : item.product.name
  }

  function startEdit(item: Item) {
    setEditingId(item.id)
    setEditQty(item.quantity)
  }

  async function saveEdit(itemId: string) {
    if (editQty < 1) return
    setBusy(itemId)
    try {
      const res = await fetch(`/api/deliveries/${deliveryId}/items/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity: editQty }),
      })
      if (res.ok) {
        setItems(prev => prev.map(i => i.id === itemId ? { ...i, quantity: editQty } : i))
        setEditingId(null)
      }
    } finally {
      setBusy(null)
    }
  }

  async function deleteItem(itemId: string) {
    if (!confirm('この商品を削除しますか？')) return
    setBusy(itemId)
    try {
      const res = await fetch(`/api/deliveries/${deliveryId}/items/${itemId}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        setItems(prev => prev.filter(i => i.id !== itemId))
      }
    } finally {
      setBusy(null)
    }
  }

  if (items.length === 0) {
    return (
      <div style={s.card}>
        <p style={{ textAlign: 'center', color: '#888888', padding: '16px 0', margin: 0, fontSize: 14 }}>
          商品がありません
        </p>
      </div>
    )
  }

  return (
    <div style={s.card}>
      {items.map((item, idx) => (
        <div key={item.id}>
          {idx > 0 && <div style={s.divider} />}

          {isEditable && editingId === item.id ? (
            /* ── 編集モード ── */
            <div style={s.editRow}>
              <span style={s.itemName}>{productLabel(item)}</span>
              <div style={s.editControls}>
                <input
                  type="number"
                  min={1}
                  value={editQty}
                  onChange={e => setEditQty(Number(e.target.value))}
                  style={s.qtyInput}
                  autoFocus
                />
                <button
                  onClick={() => void saveEdit(item.id)}
                  disabled={busy === item.id}
                  style={{ ...s.btn, ...s.btnSave }}
                >
                  {busy === item.id ? '…' : '保存'}
                </button>
                <button
                  onClick={() => setEditingId(null)}
                  style={{ ...s.btn, ...s.btnCancel }}
                >
                  取消
                </button>
              </div>
            </div>
          ) : (
            /* ── 表示モード ── */
            <div style={s.itemRow}>
              <span style={s.itemName}>{productLabel(item)}</span>
              <div style={s.rightGroup}>
                <span style={s.itemQty}>{item.quantity}</span>
                {isEditable && (
                  <>
                    <button
                      onClick={() => startEdit(item)}
                      disabled={busy === item.id}
                      style={{ ...s.btn, ...s.btnEdit }}
                      aria-label="数量を編集"
                    >
                      編集
                    </button>
                    <button
                      onClick={() => void deleteItem(item.id)}
                      disabled={busy === item.id}
                      style={{ ...s.btn, ...s.btnDel }}
                      aria-label="削除"
                    >
                      削除
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

const s: Record<string, CSSProperties> = {
  card: {
    background: '#FFFFFF',
    border: '1px solid #E5E0DA',
    borderRadius: 12,
    padding: '4px 16px',
    marginBottom: 16,
    boxShadow: '2px 2px 0 #E5E0DA',
  },
  divider: {
    borderTop: '1px solid #F0EDE8',
  },
  itemRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 0',
    minHeight: 44,
    gap: 8,
  },
  editRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 0',
    minHeight: 44,
    gap: 8,
    flexWrap: 'wrap',
  },
  itemName: {
    fontSize: 14,
    color: '#555555',
    flex: 1,
    marginRight: 8,
  },
  rightGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    flexShrink: 0,
  },
  itemQty: {
    fontSize: 15,
    fontWeight: 600,
    color: '#777777',
    minWidth: 24,
    textAlign: 'right',
  },
  editControls: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    flexShrink: 0,
  },
  qtyInput: {
    width: 64,
    padding: '6px 8px',
    fontSize: 15,
    fontWeight: 600,
    background: '#FFFFFF',
    border: '1px solid #A16207',
    borderRadius: 6,
    color: '#333333',
    textAlign: 'center',
  },
  btn: {
    border: 'none',
    borderRadius: 6,
    fontSize: 12,
    fontWeight: 600,
    padding: '6px 10px',
    cursor: 'pointer',
    minHeight: 32,
  },
  btnEdit: {
    background: '#FEF9C3',
    color: '#A16207',
  },
  btnDel: {
    background: '#FEF2F2',
    color: '#ef4444',
  },
  btnSave: {
    background: '#DCFCE7',
    color: '#16A34A',
  },
  btnCancel: {
    background: '#F0EDE8',
    color: '#777777',
  },
}
