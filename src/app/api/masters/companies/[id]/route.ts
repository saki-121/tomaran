// GET    /api/masters/companies/[id]
// PUT    /api/masters/companies/[id]
// DELETE /api/masters/companies/[id]  — soft delete (active_flag = false)

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
    .from('companies')
    .select('id, name, address, phone, closing_day, payment_type, active_flag, created_at')
    .eq('id', id)
    .eq('tenant_id', tenantId)
    .single()

  if (dbErr) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ company: data })
}

export async function PUT(req: Request, { params }: Ctx) {
  const { id } = await params
  const supabase = await createClient()
  const tenantResult = await getTenant(supabase)
  if (tenantResult.error) return NextResponse.json({ error: tenantResult.error }, { status: 401 })
  const tenantId = tenantResult.tenantId as string

  const body = await req.json()
  const { name, address, phone, closing_day, payment_type } = body

  if (!name?.trim()) return NextResponse.json({ error: '名称は必須です' }, { status: 400 })
  if (!closing_day)  return NextResponse.json({ error: '締め日は必須です' }, { status: 400 })
  if (!payment_type) return NextResponse.json({ error: '支払条件は必須です' }, { status: 400 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error: dbErr } = await (supabase as any)
    .from('companies')
    .update({
      name:         name.trim(),
      address:      address ?? null,
      phone:        phone ?? null,
      closing_day:  Number(closing_day),
      payment_type: payment_type as 'after_30_days' | 'next_month_end',
    })
    .eq('id', id)
    .eq('tenant_id', tenantId)
    .select()
    .single()

  if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 })
  return NextResponse.json({ company: data })
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const { id } = await params
  const supabase = await createClient()
  const tenantResult = await getTenant(supabase)
  if (tenantResult.error) return NextResponse.json({ error: tenantResult.error }, { status: 401 })
  const tenantId = tenantResult.tenantId as string

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: dbErr } = await (supabase as any)
    .from('companies')
    .update({ active_flag: false })
    .eq('id', id)
    .eq('tenant_id', tenantId)

  if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
