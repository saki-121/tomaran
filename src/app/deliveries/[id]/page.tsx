import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createRepositories } from '@/repositories'
import type { CSSProperties } from 'react'
import DeliveryItemList from './_components/DeliveryItemList'

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

function formatDateJP(iso: string): string {
  // 日付のみ取り出し（ISO時刻の場合は先頭10文字）、JSTで解釈してずれを防ぐ
  const datePart = iso.slice(0, 10)
  const d = new Date(`${datePart}T12:00:00+09:00`)
  const m = d.getMonth() + 1
  const dd = d.getDate()
  const day = ['日', '月', '火', '水', '木', '金', '土'][d.getDay()]
  return `${m}月${dd}日（${day}）`
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function DeliveryDetailPage({
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

  const { deliveries } = await createRepositories(tenantId)
  const delivery = await deliveries.findById(id)
  if (!delivery) notFound()
  if (delivery.tenant_id !== tenantId) notFound()

  const isEditable = delivery.status === 'editable'

  return (
    <main style={s.main}>

      {/* ── ヘッダー ─────────────────────────────── */}
      <div style={s.header}>
        <Link href="/deliveries" style={s.backLink}>← 戻る</Link>
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

      {/* ── 納品書発行 ─────────────────────────────── */}
      <div style={{ marginBottom: 16 }}>
        <Link
          href={`/deliveries/${id}/print`}
          target="_blank"
          rel="noopener noreferrer"
          style={s.printButton}
        >
          📄 納品書PDFダウンロード
        </Link>
      </div>

      {/* ── 編集ボタン ─────────────────────────────── */}
      {isEditable && (
        <div style={{ marginBottom: 16 }}>
          <Link
            href={`/deliveries/${id}`}
            style={s.editButton}
          >
            ✏️ 納品内容を編集
          </Link>
        </div>
      )}

      {/* ── 商品一覧 ─────────────────────────────── */}
      <h2 style={s.sectionTitle}>
        商品{isEditable && <span style={{ fontSize: 11, fontWeight: 400, color: '#888888', marginLeft: 6 }}>編集・削除できます</span>}
      </h2>

      <DeliveryItemList
        deliveryId={id}
        initialItems={delivery.delivery_items.map(item => ({
          id: item.id,
          quantity: item.quantity,
          product: item.product ? { name: item.product.name, spec: item.product.spec ?? null } : null,
        }))}
        isEditable={isEditable}
      />

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
    backgroundColor: '#FDFCFB',
    minHeight: '100dvh',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  backLink: {
    fontSize: 14,
    color: '#A16207',
    textDecoration: 'none',
    padding: '8px 0',
    minHeight: 44,
    display: 'flex',
    alignItems: 'center',
  },
  heading: {
    fontSize: 18,
    fontWeight: 700,
    color: '#333333',
    margin: 0,
  },
  card: {
    background: '#FFFFFF',
    border: '1px solid #E5E0DA',
    borderRadius: 12,
    padding: '4px 16px',
    marginBottom: 16,
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
    fontSize: 13,
    color: '#777777',
    flexShrink: 0,
  },
  rowValue: {
    fontSize: 15,
    fontWeight: 600,
    color: '#333333',
    textAlign: 'right',
    marginLeft: 16,
  },
  rowStatus: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 0',
  },
  statusLabel: {
    fontSize: 13,
    color: '#777777',
  },
  badgeEditable: {
    fontSize: 12,
    fontWeight: 600,
    color: '#16A34A',
    background: '#DCFCE7',
    padding: '3px 10px',
    borderRadius: 20,
  },
  badgeInvoiced: {
    fontSize: 12,
    fontWeight: 600,
    color: '#777777',
    background: '#F0EDE8',
    padding: '3px 10px',
    borderRadius: 20,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: 600,
    color: '#888888',
    margin: '0 0 8px 4px',
    letterSpacing: '0.05em',
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
}
