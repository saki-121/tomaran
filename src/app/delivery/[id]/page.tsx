import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import type { CSSProperties } from 'react'

// ---------------------------------------------------------------------------
// Types — 価格列を一切含まない
// ---------------------------------------------------------------------------

type FieldDeliveryDetail = {
  id: string
  tenant_id: string
  delivery_date: string
  status: 'editable' | 'invoiced'
  company: { id: string; name: string } | null
  site: { id: string; name: string } | null
  delivery_items: {
    id: string
    product_id: string
    quantity: number
    product: { id: string; name: string } | null
    // snapshot_unit_price / snapshot_tax_rate は取得しない
  }[]
}

// ---------------------------------------------------------------------------
// Data fetch — 価格カラムを明示的に除外
// ---------------------------------------------------------------------------

async function fetchFieldDelivery(id: string): Promise<FieldDeliveryDetail | null> {
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
        product_id,
        quantity,
        product:products(id, name)
      )
    `)
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    console.error('[/delivery/[id]] fetch error:', error.message)
    return null
  }
  return data as unknown as FieldDeliveryDetail
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDateJP(iso: string): string {
  const d   = new Date(`${iso}T00:00:00+09:00`)
  const m   = d.getMonth() + 1
  const dd  = d.getDate()
  const day = ['日', '月', '火', '水', '木', '金', '土'][d.getDay()]
  return `${m}月${dd}日（${day}）`
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function DeliveryFieldDetailPage({
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

  const delivery = await fetchFieldDelivery(id)
  if (!delivery) notFound()
  if (delivery.tenant_id !== tenantId) notFound()

  const isEditable = delivery.status === 'editable'

  return (
    <main style={s.main}>

      {/* ── ヘッダー ─────────────────────────────── */}
      <div style={s.header}>
        <Link href="/delivery" style={s.backLink}>← 戻る</Link>
        <h1 style={s.heading}>納品詳細</h1>
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

      {/* ── 商品一覧（数量のみ — 単価・合計は表示しない） ── */}
      <h2 style={s.sectionTitle}>商品</h2>

      <div style={s.card}>
        {delivery.delivery_items.map((item, idx) => (
          <div key={item.id}>
            {idx > 0 && <div style={s.divider} />}
            <div style={s.itemRow}>
              <span style={s.itemName}>{item.product?.name ?? '—'}</span>
              <span style={s.itemQty}>{item.quantity}</span>
            </div>
          </div>
        ))}
      </div>

    </main>
  )
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
// Styles
// ---------------------------------------------------------------------------

const s: Record<string, CSSProperties> = {
  main: {
    maxWidth: 448,
    margin: '0 auto',
    padding: '16px 16px 48px',
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
    fontSize: 13, fontWeight: 600, color: '#6b7280',
    margin: '0 0 8px 4px', letterSpacing: '0.05em',
  },
  divider: { borderTop: '1px solid #f3f4f6' },
  itemRow: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '14px 0', minHeight: 44,
  },
  itemName: { fontSize: 15, color: '#111827', flex: 1, marginRight: 12 },
  itemQty: { fontSize: 15, fontWeight: 600, color: '#374151', flexShrink: 0 },
}
