'use client'

import Link from 'next/link'
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
  return (
    <li style={{ position: 'relative' }}>
      <Link
        href={`/deliveries/${delivery.id}`}
        style={s.card}
      >
        <div style={s.cardLeft}>
          <p style={s.companyName}>{delivery.company?.name ?? '—'}</p>
          <p style={s.siteName}>{delivery.site?.name    ?? '—'}</p>
        </div>
        <div style={s.cardRight}>
          <p style={s.date}>{delivery.delivery_date ? formatDate(delivery.delivery_date) : '—'}</p>
          {/* ④ タップ可能である視覚ヒント */}
          <p style={s.tapHint}>詳細確認 ＞</p>
        </div>
      </Link>
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
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: 4,
    flexShrink: 0,
    minWidth: 80,
  },
  itemCountCardRight: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: 4,
    flexShrink: 0,
    minWidth: 80,
  },
  date: {
    fontSize: 13,
    color: '#9ca3af',
    margin: 0,
  },
  tapHint: {
    fontSize: 11,
    color: '#6b7280',
    margin: 0,
  },
  deleteButton: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: '50%',
    background: 'rgba(239, 68, 68, 0.9)',
    color: '#fff',
    border: 'none',
    fontSize: 14,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    transition: 'transform 0.2s ease',
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
