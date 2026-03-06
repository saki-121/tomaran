import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createRepositories } from '@/repositories'
import type { CSSProperties } from 'react'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** "2024-01-05" → "1月5日（月）"（JSTで解釈） */
function formatDateJP(iso: string): string {
  const datePart = iso.slice(0, 10)
  const d = new Date(`${datePart}T12:00:00+09:00`)
  const m  = d.getMonth() + 1
  const dd = d.getDate()
  const day = ['日', '月', '火', '水', '木', '金', '土'][d.getDay()]
  return `${m}月${dd}日（${day}）`
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function CompletePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const supabase = await createClient()

  // ── 認証 ─────────────────────────────────────────────────────────────────
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // ── テナント取得 ──────────────────────────────────────────────────────────
  const { data: userTenant } = await supabase
    .from('user_tenants')
    .select('tenant_id')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tenantId = (userTenant as any)?.tenant_id as string | undefined
  if (!tenantId) redirect('/onboarding')

  // ── 納品データ取得（RLS + tenant_id で二重保護） ──────────────────────────
  const { deliveries } = await createRepositories(tenantId)
  const delivery = await deliveries.findById(id)
  if (!delivery) notFound()

  // 別テナントの IDを直打ちされた場合の防衛
  if (delivery.tenant_id !== tenantId) notFound()

  const itemCount = delivery.delivery_items.length

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <main style={s.main}>

      {/* ── 完了アイコン ─────────────────────────── */}
      <div style={s.iconWrap}>
        <div style={s.icon}>✓</div>
      </div>

      <h1 style={s.heading}>登録しました</h1>

      {/* ── 登録内容サマリ ───────────────────────── */}
      <div style={s.card}>
        <Row label="納品日" value={formatDateJP(delivery.delivery_date)} />
        <Row label="取引先" value={delivery.company?.name ?? '—'} />
        <Row label="現場"   value={delivery.site?.name    ?? '—'} />
        <div style={s.divider} />
        <p style={s.itemCount}>商品 {itemCount}件</p>
        <ul style={s.itemList}>
          {delivery.delivery_items.map((item) => (
            <li key={item.id} style={s.itemLine}>
              <span style={s.itemName}>{item.product?.name ?? '—'}</span>
              <span style={s.itemQty}>× {item.quantity}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* ── アクション ───────────────────────────── */}
      <div style={s.actions}>
        <Link href="/deliveries/new" style={s.btnPrimary}>
          続けて登録
        </Link>
        <Link href="/deliveries" style={s.btnSecondary}>
          一覧に戻る
        </Link>
      </div>

    </main>
  )
}

// ---------------------------------------------------------------------------
// Row — ラベル + 値の1行
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
    backgroundColor: '#FDFCFB',
    minHeight: '100dvh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  iconWrap: {
    marginBottom: 16,
  },
  icon: {
    width: 64,
    height: 64,
    borderRadius: '50%',
    backgroundColor: '#16A34A',
    color: '#fff',
    fontSize: 32,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 700,
  },
  heading: {
    fontSize: 22,
    fontWeight: 700,
    color: '#333333',
    margin: '0 0 28px',
  },
  card: {
    width: '100%',
    background: '#FFFFFF',
    border: '1px solid #E5E0DA',
    borderRadius: 12,
    padding: '16px 20px',
    marginBottom: 24,
    boxShadow: '2px 2px 0 #E5E0DA',
  },
  row: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    padding: '6px 0',
  },
  rowLabel: {
    fontSize: 13,
    color: '#777777',
    flexShrink: 0,
    marginRight: 16,
  },
  rowValue: {
    fontSize: 15,
    fontWeight: 600,
    color: '#333333',
    textAlign: 'right',
  },
  divider: {
    borderTop: '1px solid #F0EDE8',
    margin: '8px 0',
  },
  itemCount: {
    fontSize: 13,
    fontWeight: 600,
    color: '#777777',
    margin: '0 0 8px',
  },
  itemList: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  itemLine: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '4px 0',
  },
  itemName: {
    fontSize: 14,
    color: '#555555',
    flex: 1,
    marginRight: 8,
  },
  itemQty: {
    fontSize: 14,
    color: '#777777',
    flexShrink: 0,
  },
  actions: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  btnPrimary: {
    display: 'block',
    textAlign: 'center',
    padding: '16px 0',
    background: '#FFD700',
    color: '#000',
    borderRadius: 12,
    fontSize: 16,
    fontWeight: 700,
    textDecoration: 'none',
    minHeight: 56,
    lineHeight: '24px',
  },
  btnSecondary: {
    display: 'block',
    textAlign: 'center',
    padding: '14px 0',
    background: '#F0EDE8',
    color: '#777777',
    border: '1px solid #D0CAC3',
    borderRadius: 12,
    fontSize: 15,
    textDecoration: 'none',
    minHeight: 52,
    lineHeight: '24px',
  },
}
