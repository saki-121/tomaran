'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

type QuoteRow = {
  id: string
  recipient: string
  subtotal: number
  tax_amount: number
  grand_total: number
  issued_date: string
  created_at: string
}

export default function QuotesPage() {
  const [quotes, setQuotes]   = useState<QuoteRow[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch]   = useState('')

  useEffect(() => {
    setLoading(true)
    void fetch('/api/quotes')
      .then(r => r.json())
      .then((d: { quotes?: QuoteRow[] }) => setQuotes(d.quotes ?? []))
      .finally(() => setLoading(false))
  }, [])

  const filtered = search.trim()
    ? quotes.filter(q => q.recipient.includes(search.trim()))
    : quotes

  function formatDate(isoDate: string): string {
    return new Date(isoDate).toLocaleDateString('ja-JP', {
      year: 'numeric', month: '2-digit', day: '2-digit',
    })
  }

  return (
    <main style={mainStyle}>
      {/* ヘッダー */}
      <div style={headerStyle}>
        <Link href="/deliveries" style={{ color: '#2563eb', textDecoration: 'none', fontSize: 15 }}>
          ← 戻る
        </Link>
        <span style={{ fontWeight: 700, fontSize: 16, flex: 1, textAlign: 'center' }}>見積書一覧</span>
        <span style={{ width: 48 }} />
      </div>

      <div style={{ padding: '12px 16px 120px' }}>
        {/* 検索 */}
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="🔍 宛先で絞り込み..."
          style={inputStyle}
        />

        {/* 一覧 */}
        {loading ? (
          <p style={{ textAlign: 'center', color: '#9ca3af', padding: '32px 0' }}>読み込み中…</p>
        ) : filtered.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#9ca3af', padding: '32px 0' }}>
            {search ? '該当する見積書がありません' : 'まだ見積書はありません'}
          </p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0, margin: '12px 0 0', display: 'flex', flexDirection: 'column', gap: 1 }}>
            {filtered.map(q => (
              <li
                key={q.id}
                style={{
                  background: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: 8,
                  padding: '14px 16px',
                  marginBottom: 6,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
                  <span style={{ fontSize: 13, color: '#6b7280' }}>{formatDate(q.issued_date)}</span>
                  <span style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>
                    {q.recipient ? `${q.recipient}御中` : '宛先未設定'}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 16 }}>
                  <span style={{ fontSize: 13, color: '#6b7280' }}>
                    税抜: ¥{q.subtotal.toLocaleString('ja-JP')}
                  </span>
                  <span style={{ fontSize: 13, color: '#374151', fontWeight: 600 }}>
                    税込: ¥{q.grand_total.toLocaleString('ja-JP')}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* 新規作成ボタン */}
      <div style={{
        position: 'fixed',
        bottom: 24,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 20,
      }}>
        <Link
          href="/quotes/new"
          style={{
            display: 'inline-block',
            padding: '14px 28px',
            fontSize: 16,
            fontWeight: 700,
            background: '#2563eb',
            color: '#fff',
            borderRadius: 32,
            textDecoration: 'none',
            boxShadow: '0 4px 16px rgba(37,99,235,0.35)',
            whiteSpace: 'nowrap',
          }}
        >
          ＋ 新規作成 →
        </Link>
      </div>
    </main>
  )
}

const mainStyle: React.CSSProperties = {
  maxWidth: 448,
  margin: '0 auto',
  fontFamily: 'system-ui, -apple-system, sans-serif',
  backgroundColor: '#f9fafb',
  minHeight: '100dvh',
}

const headerStyle: React.CSSProperties = {
  position: 'sticky',
  top: 0,
  background: '#fff',
  borderBottom: '1px solid #e5e7eb',
  padding: '12px 16px',
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  zIndex: 10,
  marginBottom: 0,
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  fontSize: 15,
  border: '1px solid #d1d5db',
  borderRadius: 6,
  background: '#fff',
  boxSizing: 'border-box',
}
