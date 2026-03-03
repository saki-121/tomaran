// GET    /api/masters/products/[id]
// PUT    /api/masters/products/[id]
// DELETE /api/masters/products/[id]  — soft delete

import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { getTenant } from '@/lib/get-tenant'

type Ctx = { params: Promise<{ id: string }> }

export async function GET(_req: Request, { params }: Ctx) {
  const { id } = await params
  const supabase = await createClient()
  const tenantResult = await getTenant(supabase)
  if (tenantResult.error) return NextResponse.json({ error: tenantResult.error }, { status: 401 })
  const tenantId = tenantResult.tenantId as string

  const { data, error: dbErr } = await supabase
    .from('products')
    .select('id, name, spec, unit_price, tax_rate, status, active_flag')
    .eq('id', id)
    .eq('tenant_id', tenantId)
    .single()

  if (dbErr) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ product: data })
}

export async function PUT(req: Request, { params }: Ctx) {
  const { id } = await params
  const supabase = await createClient()
  const tenantResult = await getTenant(supabase)
  if (tenantResult.error) return NextResponse.json({ error: tenantResult.error }, { status: 401 })
  const tenantId = tenantResult.tenantId as string

  const body = await req.json()
  const { name, unit_price, status } = body

  if (!name?.trim()) return NextResponse.json({ error: '名称は必須です' }, { status: 400 })
  if (status && !['active', 'provisional'].includes(status)) {
    return NextResponse.json({ error: 'status は active または provisional' }, { status: 400 })
  }

  const parsedPrice = unit_price === '' || unit_price === null || unit_price === undefined
    ? null
    : Number(unit_price)

  if (parsedPrice !== null && (isNaN(parsedPrice) || parsedPrice < 0)) {
    return NextResponse.json({ error: '単価は0以上の数値を入力してください' }, { status: 400 })
  }

  const resolvedStatus: 'active' | 'provisional' =
    status ?? (parsedPrice !== null ? 'active' : 'provisional')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error: dbErr } = await (supabase as any)
    .from('products')
    .update({
      name:        name.trim(),
      unit_price:  parsedPrice,
      status:      resolvedStatus,
      active_flag: resolvedStatus === 'active',
    })
    .eq('id', id)
    .eq('tenant_id', tenantId)
    .select()
    .single()

  if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 })
  return NextResponse.json({ product: data })
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const { id } = await params
  const supabase = await createClient()
  const tenantResult = await getTenant(supabase)
  if (tenantResult.error) return NextResponse.json({ error: tenantResult.error }, { status: 401 })
  const tenantId = tenantResult.tenantId as string

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: dbErr } = await (supabase as any)
    .from('products')
    .update({ active_flag: false, status: 'provisional' })
    .eq('id', id)
    .eq('tenant_id', tenantId)

  if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
