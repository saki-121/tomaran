import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import type { CSSProperties } from 'react'
import DeliveryFilter from './_components/DeliveryFilter'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type DeliveryRow = {
  id: string
  delivery_date: string
  status: string
  company: { id: string; name: string } | null
  site: { id: string; name: string } | null
  delivery_items: { id: string }[]
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getTodayJST(): string {
  const jstOffset = 9 * 60 * 60 * 1000
  return new Date(Date.now() + jstOffset).toISOString().split('T')[0]
}

function formatDate(iso: string): string {
  const [, m, d] = iso.split('-')
  return `${parseInt(m)}月${parseInt(d)}日`
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function DeliveriesPage({
  searchParams,
}: {
  searchParams: Promise<{ company_id?: string; status?: string }>
}) {
  const supabase = await createClient()

  // ── 認証チェック ─────────────────────────────────────────────────────────
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // ── テナントチェック ──────────────────────────────────────────────────────
  const { data: userTenant } = await supabase
    .from('user_tenants')
    .select('tenant_id, tenants(name)')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle()

  if (!userTenant?.tenants?.name) redirect('/onboarding')
  const tenantId = (userTenant as { tenant_id: string }).tenant_id

  // ── 課金チェック ──────────────────────────────────────────────────────────
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_paid')
    .eq('id', user.id)
    .single()

  if (!profile?.is_paid) redirect('/payment-required')

  // ── フィルタ値を取得 ──────────────────────────────────────────────────────
  const { company_id, status } = await searchParams
  const filterCompanyId = company_id ?? ''
  const filterStatus    = status === 'editable' || status === 'invoiced' ? status : ''

  // ── 初期データを並列取得 ──────────────────────────────────────────────────
  const deliveriesQuery = supabase
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

  if (filterCompanyId) deliveriesQuery.eq('company_id', filterCompanyId)
  if (filterStatus)    deliveriesQuery.eq('status',     filterStatus)

  const [{ data: deliveriesData, error }, { data: companiesData }] = await Promise.all([
    deliveriesQuery,
    supabase
      .from('companies')
      .select('id, name')
      .eq('tenant_id', tenantId)
      .eq('active_flag', true)
      .order('name'),
  ])

  if (error) {
    console.error('deliveries fetch error:', error.message)
  }

  const deliveries = (deliveriesData ?? []) as unknown as DeliveryRow[]
  const companies  = (companiesData  ?? []) as { id: string; name: string }[]

  const today     = getTodayJST()
  const todayList = deliveries.filter(d => d.delivery_date === today)
  const pastList  = deliveries.filter(d => d.delivery_date <  today)

  const isFiltering = !!(filterCompanyId || filterStatus)

  return (
    <main style={s.main}>
      <h1 style={s.heading}>納品一覧</h1>

      {/* ── フィルタ ─────────────────────────────────────────────── */}
      <DeliveryFilter
        companies={companies}
        currentCompanyId={filterCompanyId}
        currentStatus={filterStatus}
      />

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

      {/* 過去もなく今日もない場合 */}
      {isFiltering && todayList.length === 0 && pastList.length === 0 && (
        <p style={s.empty}>条件に一致する納品がありません</p>
      )}

      {/* ── FAB ─────────────────────────────────────────────────── */}
      <Link href="/deliveries/new" style={s.fab} aria-label="納品を登録">
        ＋
      </Link>
    </main>
  )
}

// ---------------------------------------------------------------------------
// DeliveryCard
// ---------------------------------------------------------------------------

function DeliveryCard({ delivery }: { delivery: DeliveryRow }) {
  return (
    <li>
      <Link href={`/deliveries/${delivery.id}`} style={s.card}>
        <div style={s.cardLeft}>
          <p style={s.siteName}>{delivery.site?.name    ?? '—'}</p>
          <p style={s.companyName}>{delivery.company?.name ?? '—'}</p>
        </div>
        <div style={s.cardRight}>
          <p style={s.itemCount}>{delivery.delivery_items.length}点</p>
          <p style={s.date}>{formatDate(delivery.delivery_date)}</p>
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
  heading: {
    fontSize: 20,
    fontWeight: 700,
    color: '#111827',
    margin: '0 0 16px',
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 12,
    fontWeight: 600,
    color: '#6b7280',
    letterSpacing: '0.05em',
    margin: '0 0 8px',
  },
  empty: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    padding: '32px 0',
    margin: 0,
  },
  list: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  details: {
    borderTop: '1px solid #e5e7eb',
    paddingTop: 4,
  },
  summary: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 0',
    fontSize: 13,
    fontWeight: 600,
    color: '#6b7280',
    cursor: 'pointer',
    listStyle: 'none',
    userSelect: 'none',
  },
  arrow: {
    fontSize: 10,
    color: '#9ca3af',
  },
  card: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    padding: '14px 16px',
    minHeight: 64,
    background: '#ffffff',
    border: '1px solid #e5e7eb',
    borderRadius: 12,
    textDecoration: 'none',
    WebkitTapHighlightColor: 'transparent',
  },
  cardLeft: {
    minWidth: 0,
    flex: 1,
  },
  siteName: {
    fontSize: 15,
    fontWeight: 600,
    color: '#111827',
    margin: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  companyName: {
    fontSize: 13,
    color: '#6b7280',
    margin: '3px 0 0',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  cardRight: {
    textAlign: 'right',
    flexShrink: 0,
  },
  itemCount: {
    fontSize: 14,
    fontWeight: 500,
    color: '#374151',
    margin: 0,
  },
  date: {
    fontSize: 12,
    color: '#9ca3af',
    margin: '2px 0 0',
  },
  fab: {
    position: 'fixed',
    bottom: 24,
    right: 16,
    width: 56,
    height: 56,
    borderRadius: '50%',
    background: '#2563eb',
    color: '#ffffff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 28,
    textDecoration: 'none',
    boxShadow: '0 4px 14px rgba(37,99,235,0.45)',
  },
}
