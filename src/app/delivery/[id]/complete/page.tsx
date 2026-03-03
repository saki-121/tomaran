import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import type { CSSProperties } from 'react'

// ---------------------------------------------------------------------------
// Types — 価格列を一切含まない
// ---------------------------------------------------------------------------

type FieldDeliveryComplete = {
  id: string
  tenant_id: string
  delivery_date: string
  company: { id: string; name: string } | null
  site: { id: string; name: string } | null
  delivery_items: {
    id: string
    quantity: number
    product: { name: string } | null
    // snapshot_unit_price / snapshot_tax_rate は取得しない
  }[]
}

// ---------------------------------------------------------------------------
// Data fetch — 価格カラムを明示的に除外
// ---------------------------------------------------------------------------

async function fetchCompleteSummary(id: string): Promise<FieldDeliveryComplete | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('deliveries')
    .select(`
      id,
      tenant_id,
      delivery_date,
      company:companies(id, name),
      site:sites(id, name),
      delivery_items(
        id,
        quantity,
        product:products(name)
      )
    `)
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    return null
  }
  return data as unknown as FieldDeliveryComplete
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

export default async function FieldCompletePage({
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

  const delivery = await fetchCompleteSummary(id)
  if (!delivery) notFound()
  if (delivery.tenant_id !== tenantId) notFound()

  return (
    <main style={s.main}>

      {/* ── 完了アイコン ─────────────────────────── */}
      <div style={s.iconWrap}>
        <div style={s.icon}>✓</div>
      </div>

      <h1 style={s.heading}>登録しました</h1>

      {/* ── 登録内容サマリ — 金額は表示しない ───── */}
      <div style={s.card}>
        <Row label="納品日" value={formatDateJP(delivery.delivery_date)} />
        <Row label="取引先" value={delivery.company?.name ?? '—'} />
        <Row label="現場"   value={delivery.site?.name    ?? '—'} />
        <div style={s.divider} />
        <p style={s.itemCount}>商品 {delivery.delivery_items.length}件</p>
        <ul style={s.itemList}>
          {delivery.delivery_items.map(item => (
            <li key={item.id} style={s.itemLine}>
              <span style={s.itemName}>{item.product?.name ?? '—'}</span>
              <span style={s.itemQty}>× {item.quantity}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* ── アクション ───────────────────────────── */}
      <div style={s.actions}>
        <Link href="/delivery/new" style={s.btnPrimary}>
          続けて登録
        </Link>
        <Link href="/delivery" style={s.btnSecondary}>
          一覧に戻る
        </Link>
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
    padding: '48px 16px 40px',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    backgroundColor: '#f9fafb',
    minHeight: '100dvh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  iconWrap: { marginBottom: 16 },
  icon: {
    width: 64, height: 64, borderRadius: '50%',
    backgroundColor: '#22c55e', color: '#fff',
    fontSize: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700,
  },
  heading: { fontSize: 22, fontWeight: 700, color: '#111827', margin: '0 0 28px' },
  card: {
    width: '100%', background: '#fff', border: '1px solid #e5e7eb',
    borderRadius: 12, padding: '16px 20px', marginBottom: 24,
  },
  row: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '6px 0',
  },
  rowLabel: { fontSize: 13, color: '#6b7280', flexShrink: 0, marginRight: 16 },
  rowValue: { fontSize: 15, fontWeight: 600, color: '#111827', textAlign: 'right' },
  divider: { borderTop: '1px solid #e5e7eb', margin: '8px 0' },
  itemCount: { fontSize: 13, fontWeight: 600, color: '#6b7280', margin: '0 0 8px' },
  itemList: {
    listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 4,
  },
  itemLine: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0',
  },
  itemName: { fontSize: 14, color: '#374151', flex: 1, marginRight: 8 },
  itemQty: { fontSize: 14, color: '#6b7280', flexShrink: 0 },
  actions: { width: '100%', display: 'flex', flexDirection: 'column', gap: 12 },
  btnPrimary: {
    display: 'block', textAlign: 'center', padding: '16px 0',
    background: '#2563eb', color: '#fff', borderRadius: 12,
    fontSize: 16, fontWeight: 700, textDecoration: 'none', minHeight: 56, lineHeight: '24px',
  },
  btnSecondary: {
    display: 'block', textAlign: 'center', padding: '14px 0',
    background: '#fff', color: '#374151', border: '1px solid #d1d5db',
    borderRadius: 12, fontSize: 15, textDecoration: 'none', minHeight: 52, lineHeight: '24px',
  },
}
