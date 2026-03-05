import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import type { CSSProperties } from 'react'
import { withQueryTracking } from '@/lib/performance'

// ---------------------------------------------------------------------------
// Types — 価格列を含む
// ---------------------------------------------------------------------------

type AdminDeliveryItem = {
  id: string
  quantity: number
  snapshot_unit_price: number
  snapshot_tax_rate: number
}

type AdminDelivery = {
  id: string
  delivery_date: string
  status: 'editable' | 'invoiced'
  company: { id: string; name: string } | null
  site: { id: string; name: string } | null
  delivery_items: AdminDeliveryItem[]
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getTodayJST(): string {
  return new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().split('T')[0]
}

function formatJPY(n: number): string {
  return n.toLocaleString('ja-JP') + '円'
}

/** 小計・税・合計を delivery_items から計算 */
function calcTotals(items: AdminDeliveryItem[]) {
  let subtotal = 0
  let tax      = 0
  for (const item of items) {
    const lineSubtotal = item.quantity * item.snapshot_unit_price
    subtotal += lineSubtotal
    tax      += Math.ceil(lineSubtotal * item.snapshot_tax_rate)
  }
  return { subtotal, tax, total: subtotal + tax }
}

// ---------------------------------------------------------------------------
// Data fetch — snapshot_unit_price / snapshot_tax_rate を含む
// ---------------------------------------------------------------------------

async function fetchAdminDeliveries(
  tenantId: string,
  filters: { company_id?: string; status?: string },
): Promise<{ deliveries: AdminDelivery[]; error: string | null }> {
  const supabase = await createClient()

  let query = supabase
    .from('deliveries')
    .select(`
      id,
      delivery_date,
      status,
      company:companies(id, name),
      site:sites(id, name),
      delivery_items(
        id,
        quantity,
        snapshot_unit_price,
        snapshot_tax_rate
      )
    `)
    .eq('tenant_id', tenantId)
    .order('delivery_date', { ascending: false })
    .limit(100)

  if (filters.company_id) query = query.eq('company_id', filters.company_id)
  if (filters.status === 'editable' || filters.status === 'invoiced') {
    query = query.eq('status', filters.status)
  }

  const { data, error } = await query
  return {
    deliveries: (data ?? []) as unknown as AdminDelivery[],
    error: error?.message ?? null,
  }
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function AdminDeliveryPage({
  searchParams,
}: {
  searchParams: Promise<{ company_id?: string; status?: string }>
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: userTenant } = await supabase
    .from('user_tenants')
    .select('tenant_id, tenants(name)')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle()

  if (!userTenant?.tenants?.name) redirect('/onboarding')
  const tenantId = (userTenant as { tenant_id: string }).tenant_id

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_paid')
    .eq('id', user.id)
    .single()
  if (!profile?.is_paid) redirect('/payment-required')

  const { company_id, status } = await searchParams

  const [{ deliveries, error }, { data: companiesData }] = await Promise.all([
    withQueryTracking('admin-deliveries-load', () => 
      fetchAdminDeliveries(tenantId, { company_id, status })
    ),
    withQueryTracking('admin-companies-load', () =>
      supabase
        .from('companies')
        .select('id, name')
        .eq('tenant_id', tenantId)
        .eq('active_flag', true)
        .order('name')
    )
  ])

  if (error) console.error('[/admin] fetch error:', error)

  const companies = (companiesData ?? []) as { id: string; name: string }[]
  const today     = getTodayJST()
  const todayList = deliveries.filter(d => d.delivery_date === today)
  const pastList  = deliveries.filter(d => d.delivery_date <  today)

  // 全期間合計
  const grandTotal = deliveries.reduce((acc, d) => acc + calcTotals(d.delivery_items).total, 0)

  return (
    <main style={s.main}>
      <h1 style={s.heading}>管理：納品一覧</h1>

      {/* ── LINEお問い合わせリンク ───────────────────────────── */}
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

      {/* ── フィルタ ─────────────────────────────── */}
      <div style={s.filterRow}>
        <form method="GET" style={s.filterForm}>
          <select name="company_id" defaultValue={company_id ?? ''} style={s.select}>
            <option value="">全取引先</option>
            {companies.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <select name="status" defaultValue={status ?? ''} style={s.select}>
            <option value="">全ステータス</option>
            <option value="editable">編集可</option>
            <option value="invoiced">請求済</option>
          </select>
          <button type="submit" style={s.filterBtn}>絞り込む</button>
        </form>
      </div>

      {/* ── 合計サマリ ───────────────────────────── */}
      {deliveries.length > 0 && (
        <div style={s.summaryCard}>
          <span style={s.summaryLabel}>表示中合計</span>
          <span style={s.summaryTotal}>{formatJPY(grandTotal)}</span>
        </div>
      )}

      {/* ── 今日 ─────────────────────────────────────────────────── */}
      <section style={s.section}>
        <p style={s.label}>今日</p>
        {todayList.length === 0 ? (
          <p style={s.empty}>今日の納品はありません</p>
        ) : (
          <ul style={s.list}>
            {todayList.map(d => <AdminDeliveryCard key={d.id} delivery={d} />)}
          </ul>
        )}
      </section>

      {/* ── 昨日以前 ─────────────────────────────── */}
      {pastList.length > 0 && (
        <details style={s.details}>
          <summary style={s.summary}>
            <span>昨日以前（{pastList.length}件）</span>
            <span style={s.arrow}>▼</span>
          </summary>
          <ul style={{ ...s.list, marginTop: 8 }}>
            {pastList.map(d => <AdminDeliveryCard key={d.id} delivery={d} />)}
          </ul>
        </details>
      )}
    </main>
  )
}

// ---------------------------------------------------------------------------
// AdminDeliveryCard — 合計金額を表示
// ---------------------------------------------------------------------------

function AdminDeliveryCard({ delivery }: { delivery: AdminDelivery }) {
  const isEditable = delivery.status === 'editable'
  const { total }  = calcTotals(delivery.delivery_items)

  return (
    <li>
      <Link href={`/admin/${delivery.id}`} style={card.wrap}>
        <div style={card.left}>
          <span style={card.company}>{delivery.company?.name ?? '—'}</span>
          <span style={card.site}>{delivery.site?.name ?? '—'}</span>
          <span style={card.date}>{delivery.delivery_date}</span>
        </div>
        <div style={card.right}>
          <span style={card.total}>{total.toLocaleString('ja-JP')}円</span>
          <span style={isEditable ? card.badgeEditable : card.badgeInvoiced}>
            {isEditable ? '編集可' : '請求済'}
          </span>
        </div>
      </Link>
    </li>
  )
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const s: Record<string, CSSProperties> = {
  main: {
    maxWidth: 960,
    margin: '0 auto',
    padding: '32px 0 80px',
    fontFamily: 'system-ui, -apple-system, sans-serif',
  },
  heading: { fontSize: 22, fontWeight: 700, color: '#fff', margin: '0 0 20px' },
  filterRow: { marginBottom: 16 },
  filterForm: { display: 'flex', gap: 8, flexWrap: 'wrap' },
  select: {
    padding: '8px 12px', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8,
    fontSize: 14, color: '#d1d5db', backgroundColor: '#1a2035', minWidth: 140,
  },
  filterBtn: {
    padding: '8px 20px', background: '#FFD700', color: '#000',
    border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: 'pointer',
  },
  summaryCard: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    background: '#111827', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12,
    padding: '14px 20px', marginBottom: 20,
  },
  summaryLabel: { fontSize: 13, color: '#9ca3af' },
  summaryTotal: { fontSize: 20, fontWeight: 700, color: '#FFD700' },
  section: { marginBottom: 24 },
  label: { fontSize: 12, fontWeight: 600, color: '#6b7280', letterSpacing: '0.05em', margin: '0 0 8px' },
  empty: { fontSize: 14, color: '#6b7280', textAlign: 'center', padding: '24px 0', margin: 0 },
  list: { listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 },
  details: { borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 4 },
  summary: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '10px 0', fontSize: 13, fontWeight: 600, color: '#9ca3af',
    cursor: 'pointer', listStyle: 'none', userSelect: 'none',
  },
  arrow: { fontSize: 10, color: '#6b7280' },
  lineSupport: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
    padding: '12px 16px',
    background: 'rgba(0, 200, 0, 0.1)',
    border: '1px solid rgba(0, 200, 0, 0.3)',
    borderRadius: 8,
  },
  lineText: {
    fontSize: 14,
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
    borderRadius: 6,
    whiteSpace: 'nowrap',
  },
}

const card: Record<string, CSSProperties> = {
  wrap: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    background: '#111827', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12,
    padding: '14px 20px', textDecoration: 'none', minHeight: 72,
  },
  left: { display: 'flex', flexDirection: 'column', gap: 2, flex: 1, marginRight: 16 },
  company: { fontSize: 15, fontWeight: 600, color: '#fff' },
  site: { fontSize: 13, color: '#9ca3af' },
  date: { fontSize: 12, color: '#6b7280' },
  right: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 },
  total: { fontSize: 16, fontWeight: 700, color: '#FFD700' },
  badgeEditable: {
    fontSize: 11, fontWeight: 600, color: '#34d399', background: 'rgba(52,211,153,0.1)',
    padding: '2px 8px', borderRadius: 20,
  },
  badgeInvoiced: {
    fontSize: 11, fontWeight: 600, color: '#9ca3af', background: 'rgba(255,255,255,0.05)',
    padding: '2px 8px', borderRadius: 20,
  },
}
