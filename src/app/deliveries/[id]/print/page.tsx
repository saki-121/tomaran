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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: tenantRow } = await (supabase as any)
    .from('tenants')
    .select('logo_url')
    .eq('id', tenantId)
    .maybeSingle()
  const logoUrl = (tenantRow as { logo_url: string | null } | null)?.logo_url ?? null

  const { deliveries } = await createRepositories(tenantId)
  const delivery = await deliveries.findById(id)
  if (!delivery) notFound()
  if (delivery.tenant_id !== tenantId) notFound()

  const items = delivery.delivery_items ?? []
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
        {logoUrl && (
          <div style={{ marginBottom: 12 }}>
            <img src={logoUrl} alt="会社ロゴ" style={{ maxHeight: 56, maxWidth: 160, objectFit: 'contain' }} />
          </div>
        )}
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
              <th style={{ padding: '8px 10px', width: 80, textAlign: 'center', fontSize: 13, fontWeight: 600, color: '#374151', borderBottom: '2px solid #e5e7eb' }}>数量</th>
            </tr>
          </thead>
          <tbody>
            {items.map(item => {
              return (
                <tr key={item.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <td style={{ padding: '8px 10px', fontSize: 14, color: '#111827' }}>{productLabel(item)}</td>
                  <td style={{ padding: '8px 10px', fontSize: 14, color: '#111827', textAlign: 'center' }}>{item.quantity}</td>
                </tr>
              )
            })}
          </tbody>
        </table>

        <div style={{ marginTop: 32, textAlign: 'center', color: '#6b7280', fontSize: 12 }}>
          <p>以上、御納品申し上げます。</p>
          
          {/* 署名欄 */}
          <div style={{ marginTop: 48, borderTop: '1px solid #e5e7eb', paddingTop: 24 }}>
            <p style={{ fontSize: 12, color: '#6b7280', marginBottom: 8 }}>ご署名ください</p>
            <div style={{
              height: 60,
              border: '1px solid #d1d5db',
              borderRadius: 4,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#9ca3af',
              fontSize: 12,
              fontStyle: 'italic'
            }}>
              署名欄
            </div>
          </div>
        </div>

        {/* 作成ツール表記 */}
        <p style={{ marginTop: 32, fontSize: 8, color: '#d1d5db', textAlign: 'center', letterSpacing: '0.03em' }}>
          この納品書は tomaran.net で作成しました 🔍
        </p>
      </div>
    </>
  )
}
