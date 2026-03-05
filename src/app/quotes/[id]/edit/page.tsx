'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import type { CSSProperties } from 'react'

type QuoteItem = {
  id: string
  quantity: number
  product?: { name: string; spec: string | null } | null
  textProduct?: { name: string } | null
}

type Quote = {
  id: string
  recipient: string
  site_name?: string
  subtotal: number
  tax_amount: number
  grand_total: number
  status: string
  quote_items: QuoteItem[]
}

export default function QuoteEditPage({ params }: { params: Promise<{ id: string }> }) {
  const [quote, setQuote] = useState<Quote | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const loadQuote = async () => {
      try {
        const response = await fetch(`/api/quotes/${await (await params).id}`)
        const data = await response.json()
        setQuote(data.quote)
      } catch (error) {
        console.error('Failed to load quote:', error)
      } finally {
        setLoading(false)
      }
    }

    void loadQuote()
  }, [params])

  const updateRecipient = async (recipient: string) => {
    if (!quote) return
    
    setSaving(true)
    try {
      const response = await fetch(`/api/quotes/${quote.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipient })
      })

      if (response.ok) {
        setQuote(prev => prev ? { ...prev, recipient } : null)
      }
    } catch (error) {
      console.error('Failed to update recipient:', error)
    } finally {
      setSaving(false)
    }
  }

  const updateSiteName = async (site_name: string) => {
    if (!quote) return
    
    setSaving(true)
    try {
      const response = await fetch(`/api/quotes/${quote.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ site_name })
      })

      if (response.ok) {
        setQuote(prev => prev ? { ...prev, site_name } : null)
      }
    } catch (error) {
      console.error('Failed to update site name:', error)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <main style={s.main}>
        <div style={s.loading}>読み込み中...</div>
      </main>
    )
  }

  if (!quote) {
    return (
      <main style={s.main}>
        <div style={s.error}>見積書が見つかりません</div>
      </main>
    )
  }

  const isEditable = quote.status === 'draft'

  return (
    <main style={s.main}>
      <div style={s.header}>
        <button onClick={() => router.back()} style={s.backButton}>
          ← 戻る
        </button>
        <h1 style={s.title}>見積書編集</h1>
      </div>

      <div style={s.card}>
        <div style={s.cardHeader}>
          <h2 style={s.cardTitle}>基本情報</h2>
          <div style={s.statusBadge}>
            {isEditable ? '編集可能' : '確定済み'}
          </div>
        </div>

        <div style={s.formGroup}>
          <label style={s.label}>宛先</label>
          <input
            type="text"
            value={quote.recipient || ''}
            onChange={e => updateRecipient(e.target.value)}
            disabled={!isEditable || saving}
            style={s.input}
          />
        </div>

        <div style={s.formGroup}>
          <label style={s.label}>現場名</label>
          <input
            type="text"
            value={quote.site_name || ''}
            onChange={e => updateSiteName(e.target.value)}
            disabled={!isEditable || saving}
            style={s.input}
          />
        </div>

        <div style={s.summary}>
          <div style={s.summaryRow}>
            <span style={s.summaryLabel}>税抜金額:</span>
            <span style={s.summaryValue}>¥{quote.subtotal.toLocaleString('ja-JP')}</span>
          </div>
          <div style={s.summaryRow}>
            <span style={s.summaryLabel}>消費税:</span>
            <span style={s.summaryValue}>¥{quote.tax_amount.toLocaleString('ja-JP')}</span>
          </div>
          <div style={s.summaryRow}>
            <span style={s.summaryLabel}>税込金額:</span>
            <span style={{ ...s.summaryValue, fontWeight: 700 }}>
              ¥{quote.grand_total.toLocaleString('ja-JP')}
            </span>
          </div>
        </div>

        <div style={{ marginTop: 24 }}>
          <a
            href={`/quotes/${quote.id}`}
            style={s.viewButton}
          >
            詳細に戻る
          </a>
        </div>
      </div>
    </main>
  )
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const s: Record<string, CSSProperties> = {
  main: {
    maxWidth: 600,
    margin: '0 auto',
    padding: '20px 16px',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    minHeight: '100dvh',
  },
  loading: {
    textAlign: 'center',
    padding: '40px 0',
    fontSize: 16,
    color: '#9ca3af',
  },
  error: {
    textAlign: 'center',
    padding: '40px 0',
    fontSize: 16,
    color: '#ef4444',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    marginBottom: 24,
  },
  backButton: {
    background: 'none',
    border: 'none',
    color: '#9ca3af',
    fontSize: 14,
    fontWeight: 500,
    cursor: 'pointer',
    padding: '8px 0',
  },
  title: {
    margin: 0,
    fontSize: 24,
    fontWeight: 700,
    color: '#fff',
  },
  card: {
    background: '#111827',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 12,
    padding: 24,
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  cardTitle: {
    margin: 0,
    fontSize: 18,
    fontWeight: 600,
    color: '#fff',
  },
  statusBadge: {
    fontSize: 12,
    fontWeight: 600,
    color: isEditable => isEditable ? '#34d399' : '#9ca3af',
    background: isEditable => isEditable ? 'rgba(52,211,153,0.1)' : 'rgba(255,255,255,0.05)',
    padding: '3px 10px',
    borderRadius: 20,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    display: 'block',
    fontSize: 14,
    fontWeight: 600,
    color: '#9ca3af',
    marginBottom: 8,
  },
  input: {
    width: '100%',
    padding: '10px 12px',
    fontSize: 14,
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 6,
    background: '#1a2035',
    color: '#fff',
    boxSizing: 'border-box',
  },
  summary: {
    background: '#1a2035',
    borderRadius: 8,
    padding: 16,
    marginTop: 20,
  },
  summaryRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#9ca3af',
  },
  summaryValue: {
    fontSize: 14,
    color: '#fff',
    fontWeight: 500,
  },
  viewButton: {
    display: 'inline-block',
    padding: '10px 20px',
    fontSize: 14,
    fontWeight: 600,
    background: '#FFD700',
    color: '#000',
    textDecoration: 'none',
    borderRadius: 6,
    textAlign: 'center',
  },
}
