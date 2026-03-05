import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { getTenant } from '@/lib/get-tenant'
import { createRepositories } from '@/repositories'
import { createApiPerformanceTracker } from '@/lib/performance'

export async function POST(req: Request) {
  const tracker = createApiPerformanceTracker('/api/deliveries')
  const startTime = tracker.start()
  
  try {
    const supabase = await createClient()
    const result = await getTenant(supabase)
    if (result.error) {
      tracker.end(startTime, 401)
      return NextResponse.json({ error: result.error }, { status: 401 })
    }
    const tenantId = result.tenantId as string

    const { delivery_date, company_id, site_id, items } = await req.json()

    if (!delivery_date || !company_id || !site_id) {
      tracker.end(startTime, 400)
      return NextResponse.json({ error: '日付・取引先・現場は必須です' }, { status: 400 })
    }
    if (!Array.isArray(items) || items.length === 0) {
      tracker.end(startTime, 400)
      return NextResponse.json({ error: '商品を1件以上登録してください' }, { status: 400 })
    }
    for (const item of items) {
      if (!item.product_id || !(item.quantity > 0)) {
        tracker.end(startTime, 400)
        return NextResponse.json({ error: '商品・数量を正しく入力してください' }, { status: 400 })
      }
    }

    const { deliveries } = await createRepositories(tenantId)

    const delivery = await deliveries.create({
      delivery_date,
      company_id,
      site_id,
      items: items.map((i: { product_id: string; quantity: number }) => ({
        product_id: i.product_id,
        quantity:   i.quantity,
      })),
    })
    
    tracker.end(startTime, 201)
    return NextResponse.json({ delivery }, { status: 201 })
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : '登録に失敗しました'
    tracker.end(startTime, 500)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
