// POST /api/deliveries/[id]/items — 既存納品に商品を追加

import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { getTenant } from '@/lib/get-tenant'

type Ctx = { params: Promise<{ id: string }> }

export async function POST(req: Request, { params }: Ctx) {
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

  const { product_id, quantity } = await req.json() as { product_id?: string; quantity?: number }
  if (!product_id) return NextResponse.json({ error: 'product_id は必須です' }, { status: 400 })
  if (typeof quantity !== 'number' || quantity < 1) return NextResponse.json({ error: '数量は1以上です' }, { status: 400 })

  // snapshot_unit_price / snapshot_tax_rate are overwritten by the BEFORE INSERT trigger
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error: dbErr } = await (supabase as any)
    .from('delivery_items')
    .insert({
      tenant_id:           tenantId,
      delivery_id:         id,
      product_id,
      quantity,
      snapshot_unit_price: 0,
      snapshot_tax_rate:   0,
    })
    .select('id, product_id, quantity, snapshot_unit_price')
    .single()

  if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 })
  return NextResponse.json({ item: data }, { status: 201 })
}
