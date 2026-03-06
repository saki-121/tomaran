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
// DeliveryCard
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
    background: '#FFFFFF',
    border: '1px solid #E5E0DA',
    borderRadius: 12,
    textDecoration: 'none',
    WebkitTapHighlightColor: 'transparent',
    cursor: 'pointer',
    userSelect: 'none',
    boxShadow: '2px 2px 0 #E5E0DA',
  },
  cardLeft: {
    minWidth: 0,
    flex: 1,
  },
  siteName: {
    fontSize: 15,
    fontWeight: 600,
    color: '#333333',
    margin: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  companyName: {
    fontSize: 13,
    color: '#777777',
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
  date: {
    fontSize: 13,
    color: '#777777',
    margin: 0,
  },
  tapHint: {
    fontSize: 11,
    color: '#888888',
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
  },
  confirmOverlay: {
    position: 'fixed',
    top: 0, left: 0, right: 0, bottom: 0,
    background: 'rgba(0, 0, 0, 0.4)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  confirmDialog: {
    background: '#FFFFFF',
    border: '1px solid #E5E0DA',
    borderRadius: 12,
    padding: 24,
    maxWidth: 320,
    width: '90%',
    boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
  },
  confirmText: {
    fontSize: 16,
    fontWeight: 600,
    color: '#333333',
    margin: '0 0 8px',
    textAlign: 'center',
  },
  confirmSubText: {
    fontSize: 13,
    color: '#777777',
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
    background: '#F0EDE8',
    color: '#555555',
    border: '1px solid #E5E0DA',
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
    border: 'none',
    borderRadius: 8,
    cursor: 'pointer',
  },
}
