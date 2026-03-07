import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import PrintToolbar from '@/app/(app)/deliveries/[id]/print/_components/PrintToolbar'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ItemJson = {
  name?: string
  spec?: string
  quantity?: number
  unit_price?: number
  amount?: number
  product?: { name?: string; spec?: string | null } | null
  textProduct?: { name?: string } | null
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDateJP(iso: string): string {
  const d = new Date(iso + 'T12:00:00+09:00')
  return d.toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' })
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

export default async function QuotePrintPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
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
  const { data: tenantRow } = await (supabase as any)
    .from('tenants')
    .select('logo_url')
    .eq('id', tenantId)
    .maybeSingle()
  const logoUrl = (tenantRow as { logo_url: string | null } | null)?.logo_url ?? null

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: quote } = await (supabase as any)
    .from('quotes')
    .select('id, recipient, subtotal, tax_amount, grand_total, issued_date, items_json')
    .eq('id', id)
    .eq('tenant_id', tenantId)
    .maybeSingle()

  if (!quote) notFound()

  const items: ItemJson[] = Array.isArray(quote.items_json) ? quote.items_json : []
  const today = new Date().toLocaleDateString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit' })

  return (
    <>
      <PrintToolbar backHref={`/quotes/${id}`} />

      <div
        style={{
          maxWidth: 640,
          margin: '0 auto',
          padding: '32px 24px',
          fontFamily: 'sans-serif',
          background: '#fff',
          color: '#000',
        }}
      >
        {logoUrl && (
          <div style={{ marginBottom: 12 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={logoUrl} alt="会社ロゴ" style={{ maxHeight: 56, maxWidth: 160, objectFit: 'contain' }} />
          </div>
        )}

        <h1 style={{ textAlign: 'center', fontSize: 24, marginBottom: 4 }}>御見積書</h1>
        <p style={{ textAlign: 'right', color: '#555', marginTop: 0 }}>発行日: {today}</p>

        <div style={{ marginBottom: 24 }}>
          <p style={{ fontSize: 16, fontWeight: 700, margin: '0 0 4px' }}>
            {(quote.recipient as string) || '—'}御中
          </p>
          <p style={{ color: '#444', margin: 0 }}>
            見積日: {formatDateJP(quote.issued_date as string)}
          </p>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 24 }}>
          <thead>
            <tr style={{ background: '#f3f4f6' }}>
              <th style={{ padding: '8px 10px', textAlign: 'left', fontSize: 13, fontWeight: 600, color: '#374151', borderBottom: '2px solid #e5e7eb' }}>品名</th>
              <th style={{ padding: '8px 10px', width: 60, textAlign: 'center', fontSize: 13, fontWeight: 600, color: '#374151', borderBottom: '2px solid #e5e7eb' }}>数量</th>
              <th style={{ padding: '8px 10px', width: 90, textAlign: 'right', fontSize: 13, fontWeight: 600, color: '#374151', borderBottom: '2px solid #e5e7eb' }}>単価</th>
              <th style={{ padding: '8px 10px', width: 90, textAlign: 'right', fontSize: 13, fontWeight: 600, color: '#374151', borderBottom: '2px solid #e5e7eb' }}>金額</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, i) => (
              <tr key={i} style={{ borderBottom: '1px solid #e5e7eb' }}>
                <td style={{ padding: '8px 10px', fontSize: 14, color: '#111827' }}>{itemLabel(item)}</td>
                <td style={{ padding: '8px 10px', fontSize: 14, color: '#111827', textAlign: 'center' }}>{item.quantity ?? 1}</td>
                <td style={{ padding: '8px 10px', fontSize: 14, color: '#111827', textAlign: 'right' }}>
                  {item.unit_price != null ? `¥${item.unit_price.toLocaleString('ja-JP')}` : '—'}
                </td>
                <td style={{ padding: '8px 10px', fontSize: 14, color: '#111827', textAlign: 'right' }}>
                  {item.amount != null ? `¥${item.amount.toLocaleString('ja-JP')}` : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, marginBottom: 32 }}>
          <div style={{ display: 'flex', gap: 24, fontSize: 14 }}>
            <span style={{ color: '#6b7280' }}>税抜金額</span>
            <span style={{ minWidth: 90, textAlign: 'right' }}>¥{(quote.subtotal as number).toLocaleString('ja-JP')}</span>
          </div>
          <div style={{ display: 'flex', gap: 24, fontSize: 14 }}>
            <span style={{ color: '#6b7280' }}>消費税</span>
            <span style={{ minWidth: 90, textAlign: 'right' }}>¥{(quote.tax_amount as number).toLocaleString('ja-JP')}</span>
          </div>
          <div style={{ display: 'flex', gap: 24, fontSize: 16, fontWeight: 700, borderTop: '2px solid #111827', paddingTop: 8 }}>
            <span>合計（税込）</span>
            <span style={{ minWidth: 90, textAlign: 'right' }}>¥{(quote.grand_total as number).toLocaleString('ja-JP')}</span>
          </div>
        </div>

        <p style={{ marginTop: 32, fontSize: 8, color: '#d1d5db', textAlign: 'center', letterSpacing: '0.03em' }}>
          この見積書は tomaran.net で作成しました 🔍
        </p>
      </div>
    </>
  )
}
