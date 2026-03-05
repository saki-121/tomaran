'use client'

import { useState, useEffect } from 'react'
import type { CSSProperties } from 'react'

type QuoteItem = {
  id: string
  quantity: number
  product?: { name: string; spec: string | null } | null
  textProduct?: { name: string } | null
}

type Props = {
  quoteId: string
  initialItems: QuoteItem[]
  isEditable: boolean
}

export default function QuoteItemList({ quoteId, initialItems, isEditable }: Props) {
  const [items, setItems] = useState<QuoteItem[]>(initialItems)

  const updateQuantity = async (itemId: string, quantity: number) => {
    if (quantity < 1) return

    setItems(prev => prev.map(item => 
      item.id === itemId ? { ...item, quantity } : item
    ))

    try {
      const response = await fetch(`/api/quotes/${quoteId}/items/${itemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity })
      })

      if (!response.ok) {
        // Revert on error
        setItems(prev => prev.map(item => 
          item.id === itemId ? { ...item, quantity: items.find(i => i.id === itemId)?.quantity || 1 } : item
        ))
      }
    } catch (error) {
      console.error('Failed to update quantity:', error)
      // Revert on error
      setItems(prev => prev.map(item => 
        item.id === itemId ? { ...item, quantity: items.find(i => i.id === itemId)?.quantity || 1 } : item
      ))
    }
  }

  const removeItem = async (itemId: string, itemName: string) => {
    if (!confirm(`「${itemName}」を削除しますか？`)) return

    setItems(prev => prev.filter(item => item.id !== itemId))

    try {
      const response = await fetch(`/api/quotes/${quoteId}/items/${itemId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        // Revert on error
        setItems(initialItems)
      }
    } catch (error) {
      console.error('Failed to remove item:', error)
      // Revert on error
      setItems(initialItems)
    }
  }

  const getItemLabel = (item: QuoteItem): string => {
    if (item.textProduct) {
      return item.textProduct.name
    }
    if (item.product) {
      return item.product.spec ? `${item.product.name} (${item.product.spec})` : item.product.name
    }
    return '不明な商品'
  }

  return (
    <div style={s.container}>
      {items.map(item => (
        <div key={item.id} style={s.item}>
          <div style={s.itemInfo}>
            <span style={s.itemName}>{getItemLabel(item)}</span>
          </div>
          
          <div style={s.itemControls}>
            {isEditable && (
              <label style={s.quantityLabel}>
                数量:
                <input
                  type="number"
                  min="1"
                  value={item.quantity}
                  onChange={e => updateQuantity(item.id, Number(e.target.value))}
                  style={s.quantityInput}
                />
              </label>
            )}
            
            <span style={s.itemTotal}>
              ¥{(item.quantity * 1000).toLocaleString('ja-JP')} {/* 仮の単価 */}
            </span>
            
            {isEditable && (
              <button
                onClick={() => removeItem(item.id, getItemLabel(item))}
                style={s.deleteButton}
                aria-label="削除"
              >
                ×
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const s: Record<string, CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  item: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 16px',
    background: '#1a2035',
    borderRadius: 8,
    border: '1px solid rgba(255,255,255,0.08)',
  },
  itemInfo: {
    flex: 1,
    minWidth: 0,
  },
  itemName: {
    fontSize: 14,
    color: '#d1d5db',
    fontWeight: 500,
  },
  itemControls: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    flexShrink: 0,
  },
  quantityLabel: {
    fontSize: 12,
    color: '#9ca3af',
    whiteSpace: 'nowrap',
    display: 'flex',
    alignItems: 'center',
    gap: 4,
  },
  quantityInput: {
    width: 60,
    padding: '4px 6px',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 4,
    fontSize: 13,
    textAlign: 'right',
    background: '#0a0f1e',
    color: '#fff',
  },
  itemTotal: {
    fontSize: 14,
    color: '#d1d5db',
    fontWeight: 600,
    minWidth: 80,
    textAlign: 'right',
  },
  deleteButton: {
    width: 28,
    height: 28,
    background: 'none',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 4,
    cursor: 'pointer',
    color: '#9ca3af',
    fontSize: 14,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
}
