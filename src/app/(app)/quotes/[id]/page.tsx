import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import type { CSSProperties } from 'react'

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

function formatDateJP(iso: string): string {
  return new Date(iso).toLocaleDateString('ja-JP', {
    year: 'numeric', month: '2-digit', day: '2-digit',
  })
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={s.row}>
      <span style={s.rowLabel}>{label}</span>
      <span style={s.rowValue}>{value}</span>
    </div>
  )
}

type ItemJson = {
  name?: string
  spec?: string
  quantity?: number
  unit_price?: number
  amount?: number
  product?: { name?: string; spec?: string | null } | null
  textProduct?: { name?: string } | null
}

function itemLabel(item: ItemJson): string {
  if (item.textProduct?.name) return item.textProduct.name
  if (item.product?.name) {
    return item.product.spec
      ? `${item.product.name}（${item.product.spec}）`
      : item.product.name
  }
  if (item.name) return item.spec ? `${item.name}（${item.spec}）` : item.name
  return '（不明な商品）'
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function QuoteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: userTenant } = await supabase
    .from('user_tenants')
    .select('tenant_id')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tenantId = (userTenant as any)?.tenant_id as string | undefined
  if (!tenantId) redirect('/onboarding')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: quote } = await (supabase as any)
    .from('quotes')
    .select('id, recipient, subtotal, tax_amount, grand_total, issued_date, items_json')
    .eq('id', id)
    .eq('tenant_id', tenantId)
    .maybeSingle()

  if (!quote) notFound()

  const items: ItemJson[] = Array.isArray(quote.items_json) ? quote.items_json : []

  return (
    <main style={s.main}>
      <div style={s.header}>
        <Link href="/quotes" style={s.backLink}>← 見積書一覧</Link>
        <h1 style={s.title}>見積書詳細</h1>
      </div>

      <div style={s.card}>
        <h2 style={{ margin: '0 0 16px', fontSize: 18, fontWeight: 600, color: '#333333' }}>見積情報</h2>

        <Row label="見積日" value={formatDateJP(quote.issued_date as string)} />
        <Row label="宛先" value={(quote.recipient as string) || '未設定'} />
        <Row label="税抜金額" value={`¥${(quote.subtotal as number).toLocaleString('ja-JP')}`} />
        <Row label="消費税" value={`¥${(quote.tax_amount as number).toLocaleString('ja-JP')}`} />
        <Row label="税込金額" value={`¥${(quote.grand_total as number).toLocaleString('ja-JP')}`} />

        <div style={{ marginTop: 20, marginBottom: 24 }}>
          <Link
            href={`/quotes/${id}/print`}
            target="_blank"
            rel="noopener noreferrer"
            style={s.printButton}
          >
            📄 見積書PDFダウンロード
          </Link>
        </div>

        <h2 style={s.sectionTitle}>商品一覧</h2>
        {items.length === 0 ? (
          <p style={{ color: '#888888', fontSize: 14 }}>商品なし</p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {items.map((item, i) => (
              <li key={i} style={s.itemRow}>
                <span style={s.itemName}>{itemLabel(item)}</span>
                <span style={s.itemQty}>× {item.quantity ?? 1}</span>
              </li>
            ))}
          </ul>
        )}
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
    padding: '20px 16px 80px',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    minHeight: '100dvh',
    backgroundColor: '#FDFCFB',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    marginBottom: 24,
  },
  backLink: {
    color: '#A16207',
    textDecoration: 'none',
    fontSize: 14,
    fontWeight: 500,
  },
  title: {
    margin: 0,
    fontSize: 24,
    fontWeight: 700,
    color: '#333333',
  },
  card: {
    background: '#FFFFFF',
    border: '1px solid #E5E0DA',
    borderRadius: 12,
    padding: 24,
    boxShadow: '2px 2px 0 #E5E0DA',
  },
  row: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 0',
    borderBottom: '1px solid #F0EDE8',
  },
  rowLabel: {
    fontSize: 14,
    color: '#777777',
    fontWeight: 500,
  },
  rowValue: {
    fontSize: 14,
    color: '#333333',
    fontWeight: 600,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 600,
    color: '#333333',
    margin: '0 0 12px',
  },
  printButton: {
    display: 'inline-block',
    padding: '10px 16px',
    fontSize: 14,
    fontWeight: 600,
    background: '#F5F0EB',
    color: '#A16207',
    border: '1px solid #D0CAC3',
    borderRadius: 8,
    textDecoration: 'none',
  },
  itemRow: {
    padding: '10px 14px',
    background: '#F5F0EB',
    borderRadius: 8,
    border: '1px solid #E5E0DA',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemName: {
    fontSize: 14,
    color: '#555555',
  },
  itemQty: {
    fontSize: 14,
    color: '#777777',
    flexShrink: 0,
    marginLeft: 12,
  },
}
