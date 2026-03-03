// PATCH  /api/deliveries/[id]/items/[itemId]  — 数量変更
// DELETE /api/deliveries/[id]/items/[itemId]  — 削除

import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { getTenant } from '@/lib/get-tenant'

type Ctx = { params: Promise<{ id: string; itemId: string }> }

export async function PATCH(req: Request, { params }: Ctx) {
  const { id, itemId } = await params
  const supabase = await createClient()
  const result = await getTenant(supabase)
  if (result.error) return NextResponse.json({ error: result.error }, { status: 401 })
  const tenantId = result.tenantId as string

  // 親 delivery のステータス確認
  const { data: delivery, error: deliveryErr } = await supabase
    .from('deliveries')
    .select('status')
    .eq('id', id)
    .eq('tenant_id', tenantId)
    .single()

  if (deliveryErr || !delivery) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (delivery.status !== 'editable') return NextResponse.json({ error: '請求済みの納品は編集できません' }, { status: 409 })

  const { quantity } = await req.json()
  if (typeof quantity !== 'number' || quantity < 0) {
    return NextResponse.json({ error: '数量は0以上の数値です' }, { status: 400 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error: dbErr } = await (supabase as any)
    .from('delivery_items')
    .update({ quantity })
    .eq('id', itemId)
    .eq('delivery_id', id)
    .select('id, quantity')
    .single()

  if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 })
  return NextResponse.json({ item: data })
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const { id, itemId } = await params
  const supabase = await createClient()
  const result = await getTenant(supabase)
  if (result.error) return NextResponse.json({ error: result.error }, { status: 401 })
  const tenantId = result.tenantId as string

  // 親 delivery のステータス確認
  const { data: delivery, error: deliveryErr } = await supabase
    .from('deliveries')
    .select('status')
    .eq('id', id)
    .eq('tenant_id', tenantId)
    .single()

  if (deliveryErr || !delivery) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (delivery.status !== 'editable') return NextResponse.json({ error: '請求済みの納品は編集できません' }, { status: 409 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: dbErr } = await (supabase as any)
    .from('delivery_items')
    .delete()
    .eq('id', itemId)
    .eq('delivery_id', id)

  if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
