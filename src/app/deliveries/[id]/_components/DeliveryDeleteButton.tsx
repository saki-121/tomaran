'use client'

import { useState } from 'react'
import type { CSSProperties } from 'react'

interface DeliveryDeleteButtonProps {
  deliveryId: string
}

export default function DeliveryDeleteButton({ deliveryId }: DeliveryDeleteButtonProps) {
  const [showConfirm, setShowConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      const response = await fetch(`/api/deliveries/${deliveryId}`, {
        method: 'DELETE',
      })
      
      if (response.ok) {
        // 削除成功したら一覧ページへ
        window.location.href = '/deliveries'
      } else {
        const error = await response.json()
        alert(error.error || '削除に失敗しました')
      }
    } catch (_error) {
      alert('削除に失敗しました')
    } finally {
      setIsDeleting(false)
      setShowConfirm(false)
    }
  }

  return (
    <div style={{ position: 'relative' }}>
      <button
        style={s.deleteButton}
        onClick={() => setShowConfirm(true)}
        disabled={isDeleting}
      >
        🗑️ この納品データを削除
      </button>

      {showConfirm && (
        <div style={s.confirmOverlay}>
          <div style={s.confirmDialog}>
            <p style={s.confirmText}>本当に削除しますか？</p>
            <p style={s.confirmSubText}>この操作は元に戻せません</p>
            <div style={s.confirmButtons}>
              <button
                style={s.cancelButton}
                onClick={() => setShowConfirm(false)}
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
    </div>
  )
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const s: Record<string, CSSProperties> = {
  deleteButton: {
    width: '100%',
    padding: '12px 16px',
    fontSize: 14,
    fontWeight: 600,
    background: 'rgba(239, 68, 68, 0.1)',
    color: '#ef4444',
    border: '1px solid rgba(239, 68, 68, 0.3)',
    borderRadius: 8,
    cursor: 'pointer',
    textAlign: 'center',
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
