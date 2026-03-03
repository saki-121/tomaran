import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import type { CSSProperties } from 'react'

// ---------------------------------------------------------------------------
// Types — 価格列を一切含まない
// ---------------------------------------------------------------------------

type FieldDelivery = {
  id: string
  delivery_date: string
  status: 'editable' | 'invoiced'
  company: { id: string; name: string } | null
  site: { id: string; name: string } | null
  delivery_items: { id: string }[]
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getTodayJST(): string {
  return new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().split('T')[0]
}

// ---------------------------------------------------------------------------
// Data fetch — snapshot_unit_price / snapshot_tax_rate は SELECT しない
// ---------------------------------------------------------------------------

async function fetchFieldDeliveries(
  tenantId: string,
  filters: { company_id?: string; status?: string },
): Promise<{ deliveries: FieldDelivery[]; error: string | null }> {
  const supabase = await createClient()

  let query = supabase
    .from('deliveries')
    .select(`
      id,
      delivery_date,
      status,
      company:companies(id, name),
      site:sites(id, name),
      delivery_items(id)
    `)
    .eq('tenant_id', tenantId)
    .order('delivery_date', { ascending: false })
    .limit(50)

  if (filters.company_id) query = query.eq('company_id', filters.company_id)
  if (filters.status === 'editable' || filters.status === 'invoiced') {
    query = query.eq('status', filters.status)
  }

  const { data, error } = await query
  return {
    deliveries: (data ?? []) as unknown as FieldDelivery[],
    error: error?.message ?? null,
  }
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function DeliveryFieldPage({
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
    fetchFieldDeliveries(tenantId, { company_id, status }),
    supabase
      .from('companies')
      .select('id, name')
      .eq('tenant_id', tenantId)
      .eq('active_flag', true)
      .order('name'),
  ])

  if (error) console.error('[/delivery] fetch error:', error)

  const companies = (companiesData ?? []) as { id: string; name: string }[]
  const today     = getTodayJST()
  const todayList = deliveries.filter(d => d.delivery_date === today)
  const pastList  = deliveries.filter(d => d.delivery_date <  today)
  const isFiltering = !!(company_id || (status === 'editable' || status === 'invoiced'))

  return (
    <main style={s.main}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h1 style={{ ...s.heading, margin: 0 }}>納品一覧</h1>
        <Link href="/admin" style={s.adminLink}>管理画面</Link>
      </div>

      {/* ── フィルタ ─────────────────────────────── */}
      <div style={s.filterRow}>
        <select
          defaultValue={company_id ?? ''}
          onChange={e => {
            const url = new URL(window.location.href)
            e.target.value ? url.searchParams.set('company_id', e.target.value)
                           : url.searchParams.delete('company_id')
            window.location.href = url.toString()
          }}
          style={s.select}
        >
          <option value="">全取引先</option>
          {companies.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      {/* ── 今日 ─────────────────────────────────────────────────── */}
      <section style={s.section}>
        <p style={s.label}>今日</p>
        {todayList.length === 0 ? (
          <p style={s.empty}>
            {isFiltering ? '条件に一致する今日の納品はありません' : '今日の納品はありません'}
          </p>
        ) : (
          <ul style={s.list}>
            {todayList.map(d => <DeliveryCard key={d.id} delivery={d} />)}
          </ul>
        )}
      </section>

      {/* ── 昨日以前（折りたたみ） ───────────────────────────────── */}
      {pastList.length > 0 && (
        <details style={s.details}>
          <summary style={s.summary}>
            <span>昨日以前（{pastList.length}件）</span>
            <span style={s.arrow}>▼</span>
          </summary>
          <ul style={{ ...s.list, marginTop: 8 }}>
            {pastList.map(d => <DeliveryCard key={d.id} delivery={d} />)}
          </ul>
        </details>
      )}

      {isFiltering && todayList.length === 0 && pastList.length === 0 && (
        <p style={s.empty}>条件に一致する納品がありません</p>
      )}

      {/* ── FAB ─────────────────────────────────────────────────── */}
      <Link href="/delivery/new" style={s.fab} aria-label="納品を登録">
        ＋
      </Link>
    </main>
  )
}

// ---------------------------------------------------------------------------
// DeliveryCard
// ---------------------------------------------------------------------------

function DeliveryCard({ delivery }: { delivery: FieldDelivery }) {
  const isEditable = delivery.status === 'editable'
  return (
    <li>
      <Link href={`/delivery/${delivery.id}`} style={card.wrap}>
        <div style={card.left}>
          <span style={card.company}>{delivery.company?.name ?? '—'}</span>
          <span style={card.site}>{delivery.site?.name ?? '—'}</span>
        </div>
        <div style={card.right}>
          <span style={card.count}>{delivery.delivery_items.length}件</span>
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
    maxWidth: 448,
    margin: '0 auto',
    padding: '24px 16px 100px',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    backgroundColor: '#f9fafb',
    minHeight: '100dvh',
  },
  heading: { fontSize: 20, fontWeight: 700, color: '#111827', margin: '0 0 16px' },
  adminLink: {
    fontSize: 12, color: '#6b7280', textDecoration: 'none',
    padding: '5px 10px', border: '1px solid #d1d5db', borderRadius: 6,
    background: '#fff',
  },
  filterRow: { marginBottom: 16 },
  select: {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #d1d5db',
    borderRadius: 8,
    fontSize: 14,
    color: '#374151',
    backgroundColor: '#fff',
  },
  section: { marginBottom: 24 },
  label: { fontSize: 12, fontWeight: 600, color: '#6b7280', letterSpacing: '0.05em', margin: '0 0 8px' },
  empty: { fontSize: 14, color: '#9ca3af', textAlign: 'center', padding: '32px 0', margin: 0 },
  list: { listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 },
  details: { borderTop: '1px solid #e5e7eb', paddingTop: 4 },
  summary: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '10px 0', fontSize: 13, fontWeight: 600, color: '#6b7280',
    cursor: 'pointer', listStyle: 'none', userSelect: 'none',
  },
  arrow: { fontSize: 10, color: '#9ca3af' },
  fab: {
    position: 'fixed', bottom: 24, right: 16,
    width: 56, height: 56, borderRadius: '50%',
    background: '#2563eb', color: '#ffffff',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 28, textDecoration: 'none',
    boxShadow: '0 4px 14px rgba(37,99,235,0.45)',
  },
}

const card: Record<string, CSSProperties> = {
  wrap: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12,
    padding: '14px 16px', textDecoration: 'none', minHeight: 64,
  },
  left: { display: 'flex', flexDirection: 'column', gap: 2, flex: 1, marginRight: 12 },
  company: { fontSize: 15, fontWeight: 600, color: '#111827' },
  site: { fontSize: 13, color: '#6b7280' },
  right: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 },
  count: { fontSize: 13, color: '#374151' },
  badgeEditable: {
    fontSize: 11, fontWeight: 600, color: '#16a34a', background: '#dcfce7',
    padding: '2px 8px', borderRadius: 20,
  },
  badgeInvoiced: {
    fontSize: 11, fontWeight: 600, color: '#6b7280', background: '#f3f4f6',
    padding: '2px 8px', borderRadius: 20,
  },
}
