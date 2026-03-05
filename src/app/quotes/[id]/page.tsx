import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createRepositories } from '@/repositories'
import type { CSSProperties } from 'react'
import QuoteItemList from './_components/QuoteItemList'

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

function formatDateJP(iso: string): string {
  const date = new Date(iso)
  return date.toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
}

// ---------------------------------------------------------------------------
// Row
// ---------------------------------------------------------------------------

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={s.row}>
      <span style={s.rowLabel}>{label}</span>
      <span style={s.rowValue}>{value}</span>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function QuoteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const repos = createRepositories(supabase)

  const quote = await repos.quotes.findById(id)
  if (!quote) notFound()

  const isEditable = quote.status === 'draft'

  return (
    <main style={s.main}>
      <div style={s.header}>
        <Link href="/quotes" style={s.backLink}>
          ← 見積書一覧
        </Link>
        <h1 style={s.title}>見積書詳細</h1>
      </div>

      <div style={s.card}>
        <div style={s.cardHeader}>
          <h2 style={s.cardTitle}>見積情報</h2>
          <div style={s.statusBadge}>
            {isEditable ? '編集可能' : '確定済み'}
          </div>
        </div>

        <Row label="見積日" value={formatDateJP(quote.issued_date)} />
        <Row label="宛先" value={quote.recipient || '未設定'} />
        {quote.site_name && <Row label="現場名" value={quote.site_name} />}
        <Row label="税抜金額" value={`¥${quote.subtotal.toLocaleString('ja-JP')}`} />
        <Row label="消費税" value={`¥${quote.tax_amount.toLocaleString('ja-JP')}`} />
        <Row label="税込金額" value={`¥${quote.grand_total.toLocaleString('ja-JP')}`} />

        {/* ── 編集ボタン ─────────────────────────────── */}
        {isEditable && (
          <div style={{ marginBottom: 16 }}>
            <Link
              href={`/quotes/${id}/edit`}
              style={s.editButton}
            >
              ✏️ 見積内容を編集
            </Link>
          </div>
        )}

        {/* ── PDFダウンロード ─────────────────────────────── */}
        <div style={{ marginBottom: 16 }}>
          <Link
            href={`/quotes/${id}/print`}
            target="_blank"
            rel="noopener noreferrer"
            style={s.printButton}
          >
            📄 見積書PDFダウンロード
          </Link>
        </div>

        {/* ── 商品一覧 ─────────────────────────────── */}
        <h2 style={s.sectionTitle}>
          商品{isEditable && <span style={{ fontSize: 11, fontWeight: 400, color: '#6b7280', marginLeft: 6 }}>編集・削除できます</span>}
        </h2>

        <QuoteItemList
          quoteId={id}
          initialItems={quote.quote_items.map(item => ({
            id: item.id,
            quantity: item.quantity,
            product: item.product ? { name: item.product.name, spec: item.product.spec ?? null } : null,
            textProduct: item.text_product ? { name: item.text_product.name } : null,
          }))}
          isEditable={isEditable}
        />

      </div>
    </main>
  )
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const s: Record<string, CSSProperties> = {
  main: {
    maxWidth: 800,
    margin: '0 auto',
    padding: '20px 16px',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    minHeight: '100dvh',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    marginBottom: 24,
  },
  backLink: {
    color: '#9ca3af',
    textDecoration: 'none',
    fontSize: 14,
    fontWeight: 500,
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
    color: '#34d399',
    background: 'rgba(52,211,153,0.1)',
    padding: '3px 10px',
    borderRadius: 20,
  },
  row: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 0',
    borderBottom: '1px solid rgba(255,255,255,0.08)',
  },
  rowLabel: {
    fontSize: 14,
    color: '#9ca3af',
    fontWeight: 500,
  },
  rowValue: {
    fontSize: 14,
    color: '#fff',
    fontWeight: 600,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 600,
    color: '#fff',
    margin: '24px 0 12px 4px',
  },
  editButton: {
    display: 'inline-block',
    padding: '10px 16px',
    fontSize: 14,
    fontWeight: 600,
    background: '#FFD700',
    color: '#000',
    border: 'none',
    borderRadius: 8,
    textDecoration: 'none',
  },
  printButton: {
    display: 'inline-block',
    padding: '10px 16px',
    fontSize: 14,
    fontWeight: 600,
    background: 'rgba(255,215,0,0.15)',
    color: '#FFD700',
    border: '1px solid rgba(255,215,0,0.4)',
    borderRadius: 8,
    textDecoration: 'none',
  },
}
