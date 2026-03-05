'use client'

import Link from 'next/link'
import { useState } from 'react'
import type { CSSProperties } from 'react'

// ---------------------------------------------------------------------------
// Type
// ---------------------------------------------------------------------------

export type DeliveryCardRow = {
  id:             string
  delivery_date:  string
  status:         string
  company:        { id: string; name: string } | null
  site:           { id: string; name: string } | null
  delivery_items: { id: string }[]
}

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

function formatDate(iso: string): string {
  const [, m, d] = iso.split('-')
  return `${parseInt(m)}月${parseInt(d)}日`
}

// ---------------------------------------------------------------------------
// DeliveryCard — タップ即時フィードバック（① 修正）
// ---------------------------------------------------------------------------

export default function DeliveryCard({ delivery }: { delivery: DeliveryCardRow }) {
  const [pressed, setPressed] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const isEditable = delivery.status === 'editable'

  const handleDelete = async () => {
    if (!isEditable) return
    
    setIsDeleting(true)
    try {
      const response = await fetch(`/api/deliveries/${delivery.id}`, {
        method: 'DELETE',
      })
      
      if (response.ok) {
        // 削除成功したらページをリロード
        window.location.reload()
      } else {
        const error = await response.json()
        alert(error.error || '削除に失敗しました')
      }
    } catch (_error) {
      alert('削除に失敗しました')
    } finally {
      setIsDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  return (
    <li style={{ position: 'relative' }}>
      <Link
        href={`/deliveries/${delivery.id}`}
        style={{
          ...s.card,
          transform:  pressed ? 'scale(0.97)' : 'scale(1)',
          boxShadow:  pressed
            ? 'inset 0 1px 2px rgba(0,0,0,0.3)'
            : '0 1px 3px rgba(0,0,0,0.3)',
        }}
        onPointerDown={()  => setPressed(true)}
        onPointerUp={()    => setPressed(false)}
        onPointerLeave={() => setPressed(false)}
        onPointerCancel={()=> setPressed(false)}
      >
        <div style={s.cardLeft}>
          <p style={s.siteName}>{delivery.site?.name    ?? '—'}</p>
          <p style={s.companyName}>{delivery.company?.name ?? '—'}</p>
        </div>
        <div style={s.cardRight}>
          <p style={s.date}>{delivery.delivery_date ? formatDate(delivery.delivery_date) : '—'}</p>
          {/* ④ タップ可能である視覚ヒント */}
          <p style={s.tapHint}>詳細確認 ＞</p>
        </div>
      </Link>
      
      {/* 削除ボタン */}
      {isEditable && (
        <button
          style={s.deleteButton}
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            setShowDeleteConfirm(true)
          }}
          disabled={isDeleting}
          title="削除"
        >
          🗑️
        </button>
      )}
      
      {/* 削除確認ダイアログ */}
      {showDeleteConfirm && (
        <div style={s.confirmOverlay}>
          <div style={s.confirmDialog}>
            <p style={s.confirmText}>本当に削除しますか？</p>
            <p style={s.confirmSubText}>この操作は元に戻せません</p>
            <div style={s.confirmButtons}>
              <button
                style={s.cancelButton}
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
              >
                キャンセル
              </button>
              <button
                style={s.deleteConfirmButton}
                onClick={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting ? '削除中...' : '削除'}
              </button>
            </div>
          </div>
        </div>
      )}
    </li>
  )
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const s: Record<string, CSSProperties> = {
  card: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    padding: '14px 16px',
    minHeight: 64,
    background: '#111827',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 12,
    textDecoration: 'none',
    WebkitTapHighlightColor: 'transparent',
    cursor: 'pointer',
    userSelect: 'none',
    transition: 'transform 100ms ease, box-shadow 100ms ease',
  },
  cardLeft: {
    minWidth: 0,
    flex: 1,
  },
  siteName: {
    fontSize: 15,
    fontWeight: 600,
    color: '#fff',
    margin: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  companyName: {
    fontSize: 13,
    color: '#9ca3af',
    margin: '3px 0 0',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  cardRight: {
    textAlign: 'right',
    flexShrink: 0,
  },
  itemCount: {
    fontSize: 14,
    fontWeight: 500,
    color: '#d1d5db',
    margin: 0,
  },
  date: {
    fontSize: 12,
    color: '#6b7280',
    margin: '2px 0 0',
  },
  tapHint: {
    fontSize: 11,
    color: '#FFD700',
    opacity: 0.7,
    margin: '4px 0 0',
    textAlign: 'right',
  },
  deleteButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: '50%',
    background: 'rgba(239, 68, 68, 0.1)',
    border: '1px solid rgba(239, 68, 68, 0.3)',
    color: '#ef4444',
    fontSize: 14,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s ease',
    zIndex: 10,
  },
  confirmOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  confirmDialog: {
    background: '#1f2937',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 24,
    maxWidth: 320,
    width: '90%',
  },
  confirmText: {
    fontSize: 16,
    fontWeight: 600,
    color: '#fff',
    margin: '0 0 8px',
    textAlign: 'center',
  },
  confirmSubText: {
    fontSize: 13,
    color: '#9ca3af',
    margin: '0 0 20px',
    textAlign: 'center',
  },
  confirmButtons: {
    display: 'flex',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    padding: '10px 16px',
    fontSize: 14,
    fontWeight: 600,
    background: 'rgba(255, 255, 255, 0.1)',
    color: '#9ca3af',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    borderRadius: 8,
    cursor: 'pointer',
  },
  deleteConfirmButton: {
    flex: 1,
    padding: '10px 16px',
    fontSize: 14,
    fontWeight: 600,
    background: '#ef4444',
    color: '#fff',
    border: '1px solid #ef4444',
    borderRadius: 8,
    cursor: 'pointer',
  },
}
