// PATCH  /api/deliveries/[id]  — 納品日変更
// DELETE /api/deliveries/[id]  — 納品削除（editable のみ）

import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { getTenant } from '@/lib/get-tenant'

type Ctx = { params: Promise<{ id: string }> }

export async function PATCH(req: Request, { params }: Ctx) {
  const { id } = await params
  const supabase = await createClient()
  const result = await getTenant(supabase)
  if (result.error) return NextResponse.json({ error: result.error }, { status: 401 })
  const tenantId = result.tenantId as string

  const { data: delivery, error: deliveryErr } = await supabase
    .from('deliveries')
    .select('status')
    .eq('id', id)
    .eq('tenant_id', tenantId)
    .single()

  if (deliveryErr || !delivery) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (delivery.status !== 'editable') return NextResponse.json({ error: '請求済みの納品は編集できません' }, { status: 409 })

  const { delivery_date } = await req.json()
  if (!delivery_date || !/^\d{4}-\d{2}-\d{2}$/.test(delivery_date)) {
    return NextResponse.json({ error: '日付の形式が正しくありません' }, { status: 400 })
  }

  const { error: dbErr } = await supabase
    .from('deliveries')
    .update({ delivery_date })
    .eq('id', id)
    .eq('tenant_id', tenantId)

  if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const { id } = await params
  const supabase = await createClient()
  const result = await getTenant(supabase)
  if (result.error) return NextResponse.json({ error: result.error }, { status: 401 })
  const tenantId = result.tenantId as string

  const { data: delivery, error: deliveryErr } = await supabase
    .from('deliveries')
    .select('status')
    .eq('id', id)
    .eq('tenant_id', tenantId)
    .single()

  if (deliveryErr || !delivery) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (delivery.status !== 'editable') return NextResponse.json({ error: '請求済みの納品は削除できません' }, { status: 409 })

  const { error: dbErr } = await supabase
    .from('deliveries')
    .delete()
    .eq('id', id)
    .eq('tenant_id', tenantId)

  if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
