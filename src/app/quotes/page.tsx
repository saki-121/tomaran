'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import type { CSSProperties } from 'react'

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
      <div style={{ padding: '12px 16px 120px' }}>
        {/* ヘッダー */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#fff' }}>見積書一覧</h1>
          <Link
            href="/quotes/new"
            aria-label="見積書を作成"
            style={{
              padding: '10px 20px',
              background: '#FFD700',
              color: '#000',
              textDecoration: 'none',
              borderRadius: 6,
              fontSize: 14,
              fontWeight: 700,
              boxShadow: '0 2px 8px rgba(255,215,0,0.3)',
            }}
          >
            ＋ 見積書を作成
          </Link>
        </div>

        {/* LINEお問い合わせリンク */}
        <div style={s.lineSupport}>
          <span style={s.lineText}>🤔 ご不明な点はLINEから</span>
          <a 
            href="https://lin.ee/2WeE9qB" 
            target="_blank" 
            rel="noopener noreferrer"
            style={s.lineButton}
          >
            💬 LINEで問い合わせ
          </a>
        </div>

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
          <ul style={{ listStyle: 'none', padding: 0, margin: '12px 0 0', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {filtered.map(q => (
              <li key={q.id}>
                <Link href={`/quotes/${q.id}`} style={card.wrap}>
                  <div style={card.left}>
                    <p style={card.recipient}>
                      {q.recipient ? `${q.recipient}御中` : '宛先未設定'}
                    </p>
                    <p style={card.date}>{formatDate(q.issued_date)}</p>
                  </div>
                  <div style={card.right}>
                    <p style={card.amount}>¥{q.grand_total.toLocaleString('ja-JP')}</p>
                    <p style={card.hint}>詳細・編集 ＞</p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  )
}

const card: Record<string, CSSProperties> = {
  wrap: {
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
  },
  left: {
    minWidth: 0,
    flex: 1,
  },
  right: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: 4,
    flexShrink: 0,
  },
  recipient: {
    fontSize: 15,
    fontWeight: 600,
    color: '#fff',
    margin: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  date: {
    fontSize: 12,
    color: '#6b7280',
    margin: '3px 0 0',
  },
  amount: {
    fontSize: 15,
    fontWeight: 700,
    color: '#FFD700',
    margin: 0,
  },
  hint: {
    fontSize: 11,
    color: '#6b7280',
    margin: 0,
  },
}

const mainStyle: React.CSSProperties = {
  maxWidth: 448,
  margin: '0 auto',
  fontFamily: 'system-ui, -apple-system, sans-serif',
  minHeight: '100dvh',
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  fontSize: 15,
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 6,
  background: '#1a2035',
  color: '#fff',
  boxSizing: 'border-box',
}

const s: Record<string, React.CSSProperties> = {
  lineSupport: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '8px 12px',
    background: 'rgba(0, 200, 0, 0.1)',
    border: '1px solid rgba(0, 200, 0, 0.3)',
    borderRadius: 6,
    marginBottom: 12,
  },
  lineText: {
    fontSize: 13,
    color: '#9ca3af',
    fontWeight: 500,
  },
  lineButton: {
    padding: '6px 12px',
    fontSize: 12,
    fontWeight: 600,
    background: '#00C300',
    color: '#fff',
    textDecoration: 'none',
    borderRadius: 4,
    whiteSpace: 'nowrap',
  },
}
