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

  return (
    <li>
      <Link
        href={`/deliveries/${delivery.id}`}
        style={{
          ...s.card,
          transform:  pressed ? 'scale(0.97)' : 'scale(1)',
          boxShadow:  pressed
            ? 'inset 0 1px 2px rgba(0,0,0,0.06)'
            : '0 1px 3px rgba(0,0,0,0.05)',
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
          <p style={s.itemCount}>{delivery.delivery_items.length}点</p>
          <p style={s.date}>{formatDate(delivery.delivery_date)}</p>
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
    background: '#ffffff',
    border: '1px solid #e5e7eb',
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
    color: '#111827',
    margin: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  companyName: {
    fontSize: 13,
    color: '#6b7280',
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
    color: '#374151',
    margin: 0,
  },
  date: {
    fontSize: 12,
    color: '#9ca3af',
    margin: '2px 0 0',
  },
  tapHint: {
    fontSize: 11,
    color: '#6b7280',
    opacity: 0.6,
    margin: '4px 0 0',
    textAlign: 'right',
  },
}
