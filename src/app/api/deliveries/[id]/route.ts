// PATCH  /api/deliveries/[id]  — 納品日変更
// DELETE /api/deliveries/[id]  — 納品削除（editable のみ）

import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { getTenant } from '@/lib/get-tenant'
import { createRepositories } from '@/repositories'
import { createApiPerformanceTracker } from '@/lib/performance'

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const tracker = createApiPerformanceTracker('/api/deliveries/[id]/PATCH')
  const startTime = tracker.start()
  
  try {
    const { id } = await params
    const supabase = await createClient()
    const result = await getTenant(supabase)
    if (result.error) {
      tracker.end(startTime, 401)
      return NextResponse.json({ error: result.error }, { status: 401 })
    }
    const tenantId = result.tenantId as string

    const { delivery_date, company_id, site_id } = await req.json()

    if (!delivery_date || !company_id || !site_id) {
      tracker.end(startTime, 400)
      return NextResponse.json({ error: '日付・取引先・現場は必須です' }, { status: 400 })
    }

    const { deliveries } = await createRepositories(tenantId)

    const delivery = await deliveries.update(id, {
      delivery_date,
      company_id,
      site_id,
    })
    
    tracker.end(startTime, 200)
    return NextResponse.json({ delivery })
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : '更新に失敗しました'
    tracker.end(startTime, 500)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const tracker = createApiPerformanceTracker('/api/deliveries/[id]/DELETE')
  const startTime = tracker.start()
  
  try {
    const { id } = await params
    const supabase = await createClient()
    const result = await getTenant(supabase)
    if (result.error) {
      tracker.end(startTime, 401)
      return NextResponse.json({ error: result.error }, { status: 401 })
    }
    const tenantId = result.tenantId as string

    const { deliveries } = await createRepositories(tenantId)

    await deliveries.delete(id)
    
    tracker.end(startTime, 200)
    return NextResponse.json({ success: true })
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : '削除に失敗しました'
    tracker.end(startTime, 500)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
