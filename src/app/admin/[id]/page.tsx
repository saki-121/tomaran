import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import type { CSSProperties } from 'react'

// ---------------------------------------------------------------------------
// Types — 価格列を含む
// ---------------------------------------------------------------------------

type AdminItem = {
  id: string
  quantity: number
  snapshot_unit_price: number
  snapshot_tax_rate: number
  product: { id: string; name: string; spec: string | null } | null
}

type AdminDeliveryDetail = {
  id: string
  tenant_id: string
  delivery_date: string
  status: 'editable' | 'invoiced'
  company: { id: string; name: string } | null
  site: { id: string; name: string } | null
  delivery_items: AdminItem[]
}

// ---------------------------------------------------------------------------
// Data fetch — snapshot_unit_price / snapshot_tax_rate を含む
// ---------------------------------------------------------------------------

async function fetchAdminDelivery(id: string): Promise<AdminDeliveryDetail | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('deliveries')
    .select(`
      id,
      tenant_id,
      delivery_date,
      status,
      company:companies(id, name),
      site:sites(id, name),
      delivery_items(
        id,
        quantity,
        snapshot_unit_price,
        snapshot_tax_rate,
        product:products(id, name, spec)
      )
    `)
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    console.error('[/admin/[id]] fetch error:', error.message)
    return null
  }
  return data as unknown as AdminDeliveryDetail
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDateJP(iso: string): string {
  const datePart = iso.slice(0, 10)
  const d   = new Date(`${datePart}T12:00:00+09:00`)
  const m   = d.getMonth() + 1
  const dd  = d.getDate()
  const day = ['日', '月', '火', '水', '木', '金', '土'][d.getDay()]
  return `${m}月${dd}日（${day}）`
}

function formatJPY(n: number): string {
  return n.toLocaleString('ja-JP') + '円'
}

function calcLine(item: AdminItem) {
  const subtotal   = item.quantity * item.snapshot_unit_price
  const tax        = Math.ceil(subtotal * item.snapshot_tax_rate)
  const total      = subtotal + tax
  const taxRatePct = Math.round(item.snapshot_tax_rate * 100)
  return { subtotal, tax, total, taxRatePct }
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function AdminDeliveryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
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

  const delivery = await fetchAdminDelivery(id)
  if (!delivery) notFound()
  if (delivery.tenant_id !== tenantId) notFound()

  const isEditable = delivery.status === 'editable'
  const items = delivery.delivery_items ?? []

  // 合計計算
  let grandSubtotal = 0
  let grandTax      = 0
  for (const item of items) {
    const { subtotal, tax } = calcLine(item)
    grandSubtotal += subtotal
    grandTax      += tax
  }
  const grandTotal = grandSubtotal + grandTax

  return (
    <main style={s.main}>

      {/* ── ヘッダー ─────────────────────────────── */}
      <div style={s.header}>
        <Link href="/admin" style={s.backLink}>← 戻る</Link>
        <h1 style={s.heading}>管理：納品詳細</h1>
      </div>

      {/* ── 基本情報 ─────────────────────────────── */}
      <div style={s.card}>
        <Row label="納品日" value={formatDateJP(delivery.delivery_date)} />
        <Row label="取引先" value={delivery.company?.name ?? '—'} />
        <Row label="現場"   value={delivery.site?.name    ?? '—'} />
        <div style={s.rowStatus}>
          <span style={s.statusLabel}>ステータス</span>
          <span style={isEditable ? s.badgeEditable : s.badgeInvoiced}>
            {isEditable ? '編集可' : '請求済'}
          </span>
        </div>
      </div>

      {/* ── 商品明細（単価・税・小計を表示） ──────── */}
      <h2 style={s.sectionTitle}>明細</h2>
      <div style={s.card}>
        {items.map((item, idx) => {
          const { subtotal, tax, total, taxRatePct } = calcLine(item)
          return (
            <div key={item.id}>
              {idx > 0 && <div style={s.divider} />}
              <div style={s.itemBlock}>
                <div style={s.itemNameRow}>
                  <span style={s.itemName}>
                    {item.product?.name ?? '—'}
                    {item.product?.spec ? <span style={s.spec}> {item.product.spec}</span> : null}
                  </span>
                  <span style={s.taxBadge}>税{taxRatePct}%</span>
                </div>
                <div style={s.priceRow}>
                  <span style={s.priceLabel}>
                    {formatJPY(item.snapshot_unit_price)} × {item.quantity}
                  </span>
                  <span style={s.lineTotal}>{formatJPY(total)}</span>
                </div>
                <div style={s.taxRow}>
                  <span style={s.taxLabel}>
                    小計 {formatJPY(subtotal)} + 税 {formatJPY(tax)}
                  </span>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* ── 合計 ─────────────────────────────────── */}
      <div style={s.totalsCard}>
        <TotalRow label="小計（税抜）" value={formatJPY(grandSubtotal)} />
        <TotalRow label="消費税"       value={formatJPY(grandTax)} />
        <div style={s.grandTotalRow}>
          <span style={s.grandTotalLabel}>合計（税込）</span>
          <span style={s.grandTotalValue}>{formatJPY(grandTotal)}</span>
        </div>
      </div>

    </main>
  )
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={s.row}>
      <span style={s.rowLabel}>{label}</span>
      <span style={s.rowValue}>{value}</span>
    </div>
  )
}

function TotalRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={s.totalRow}>
      <span style={s.totalLabel}>{label}</span>
      <span style={s.totalValue}>{value}</span>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const s: Record<string, CSSProperties> = {
  main: {
    maxWidth: 720,
    margin: '0 auto',
    padding: '24px 24px 60px',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    backgroundColor: '#f9fafb',
    minHeight: '100dvh',
  },
  header: { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 },
  backLink: {
    fontSize: 14, color: '#2563eb', textDecoration: 'none',
    padding: '8px 0', minHeight: 44, display: 'flex', alignItems: 'center',
  },
  heading: { fontSize: 18, fontWeight: 700, color: '#111827', margin: 0 },
  card: {
    background: '#fff', border: '1px solid #e5e7eb',
    borderRadius: 12, padding: '4px 16px', marginBottom: 16,
  },
  row: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '12px 0', borderBottom: '1px solid #f3f4f6',
  },
  rowLabel: { fontSize: 13, color: '#6b7280', flexShrink: 0 },
  rowValue: { fontSize: 15, fontWeight: 600, color: '#111827', textAlign: 'right', marginLeft: 16 },
  rowStatus: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0',
  },
  statusLabel: { fontSize: 13, color: '#6b7280' },
  badgeEditable: {
    fontSize: 12, fontWeight: 600, color: '#16a34a', background: '#dcfce7',
    padding: '3px 10px', borderRadius: 20,
  },
  badgeInvoiced: {
    fontSize: 12, fontWeight: 600, color: '#6b7280', background: '#f3f4f6',
    padding: '3px 10px', borderRadius: 20,
  },
  sectionTitle: {
    fontSize: 13, fontWeight: 600, color: '#6b7280', margin: '0 0 8px 4px', letterSpacing: '0.05em',
  },
  divider: { borderTop: '1px solid #f3f4f6' },
  itemBlock: { padding: '12px 0', display: 'flex', flexDirection: 'column', gap: 4 },
  itemNameRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 },
  itemName: { fontSize: 15, color: '#111827', fontWeight: 500, flex: 1 },
  spec: { fontSize: 13, color: '#6b7280', fontWeight: 400 },
  taxBadge: {
    fontSize: 11, color: '#9ca3af', background: '#f3f4f6',
    padding: '2px 6px', borderRadius: 4, flexShrink: 0,
  },
  priceRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' },
  priceLabel: { fontSize: 13, color: '#6b7280' },
  lineTotal: { fontSize: 16, fontWeight: 700, color: '#111827' },
  taxRow: {},
  taxLabel: { fontSize: 12, color: '#9ca3af' },
  totalsCard: {
    background: '#fff', border: '1px solid #e5e7eb',
    borderRadius: 12, padding: '4px 16px', marginBottom: 16,
  },
  totalRow: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '10px 0', borderBottom: '1px solid #f3f4f6',
  },
  totalLabel: { fontSize: 14, color: '#6b7280' },
  totalValue: { fontSize: 14, color: '#374151', fontWeight: 500 },
  grandTotalRow: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0',
  },
  grandTotalLabel: { fontSize: 15, fontWeight: 700, color: '#111827' },
  grandTotalValue: { fontSize: 20, fontWeight: 700, color: '#111827' },
}
