import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { createRepositories } from '@/repositories'
import PrintToolbar from './_components/PrintToolbar'

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

function formatDateJP(iso: string): string {
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

export default async function DeliveryPrintPage({
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

  const items = delivery.delivery_items ?? []
  let grandSubtotal = 0
  let grandTax = 0
  for (const item of items) {
    const unitPrice = item.snapshot_unit_price ?? 0
    const subtotal = item.quantity * unitPrice
    const tax = Math.ceil(subtotal * (item.snapshot_tax_rate ?? 0))
    grandSubtotal += subtotal
    grandTax += tax
  }
  const grandTotal = grandSubtotal + grandTax
  const today = new Date().toLocaleDateString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit' })

  function productLabel(item: typeof items[0]): string {
    if (!item.product) return '（削除された商品）'
    return item.product.spec
      ? `${item.product.name}（${item.product.spec}）`
      : item.product.name
  }

  return (
    <>
      <PrintToolbar backHref={`/deliveries/${id}`} />

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
        <h1 style={{ textAlign: 'center', fontSize: 24, marginBottom: 4 }}>御納品書</h1>
        <p style={{ textAlign: 'right', color: '#555', marginTop: 0 }}>発行日: {today}</p>

        <div style={{ marginBottom: 24 }}>
          <p style={{ fontSize: 16, fontWeight: 700, margin: '0 0 4px' }}>
            {delivery.company?.name ?? '—'}御中
          </p>
          <p style={{ color: '#444', margin: 0 }}>
            納品日: {formatDateJP(delivery.delivery_date)}
            {delivery.site?.name ? `　現場: ${delivery.site.name}` : ''}
          </p>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 24 }}>
          <thead>
            <tr style={{ background: '#f3f4f6' }}>
              <th style={{ padding: '8px 10px', textAlign: 'left', fontSize: 13, fontWeight: 600, color: '#374151', borderBottom: '2px solid #e5e7eb' }}>品名</th>
              <th style={{ padding: '8px 10px', width: 60, textAlign: 'center', fontSize: 13, fontWeight: 600, color: '#374151', borderBottom: '2px solid #e5e7eb' }}>数量</th>
              <th style={{ padding: '8px 10px', width: 90, textAlign: 'right', fontSize: 13, fontWeight: 600, color: '#374151', borderBottom: '2px solid #e5e7eb' }}>単価</th>
              <th style={{ padding: '8px 10px', width: 100, textAlign: 'right', fontSize: 13, fontWeight: 600, color: '#374151', borderBottom: '2px solid #e5e7eb' }}>金額</th>
            </tr>
          </thead>
          <tbody>
            {items.map(item => {
              const unitPrice = item.snapshot_unit_price ?? 0
              const amount = item.quantity * unitPrice
              return (
                <tr key={item.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <td style={{ padding: '8px 10px', fontSize: 14, color: '#111827' }}>{productLabel(item)}</td>
                  <td style={{ padding: '8px 10px', fontSize: 14, color: '#111827', textAlign: 'center' }}>{item.quantity}</td>
                  <td style={{ padding: '8px 10px', fontSize: 14, color: '#111827', textAlign: 'right' }}>
                    ¥{unitPrice.toLocaleString('ja-JP')}
                  </td>
                  <td style={{ padding: '8px 10px', fontSize: 14, color: '#111827', textAlign: 'right' }}>
                    ¥{amount.toLocaleString('ja-JP')}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>

        <div style={{ textAlign: 'right', borderTop: '1px solid #e5e7eb', paddingTop: 16 }}>
          <p style={{ fontSize: 20, fontWeight: 700, margin: '0 0 6px' }}>
            合計（税抜き）　¥{grandSubtotal.toLocaleString('ja-JP')}
          </p>
          <p style={{ fontSize: 13, color: '#6b7280', margin: '0 0 2px' }}>
            消費税　¥{grandTax.toLocaleString('ja-JP')}
          </p>
          <p style={{ fontSize: 13, color: '#6b7280', margin: 0 }}>
            税込合計　¥{grandTotal.toLocaleString('ja-JP')}
          </p>
        </div>
      </div>
    </>
  )
}
