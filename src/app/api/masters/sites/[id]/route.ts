// GET    /api/masters/sites/[id]
// PUT    /api/masters/sites/[id]
// DELETE /api/masters/sites/[id]  — soft delete

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
    .from('sites')
    .select('id, name, company_id, active_flag')
    .eq('id', id)
    .eq('tenant_id', tenantId)
    .single()

  if (dbErr) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ site: data })
}

export async function PUT(req: Request, { params }: Ctx) {
  const { id } = await params
  const supabase = await createClient()
  const tenantResult = await getTenant(supabase)
  if (tenantResult.error) return NextResponse.json({ error: tenantResult.error }, { status: 401 })
  const tenantId = tenantResult.tenantId as string

  const { name } = await req.json()
  if (!name?.trim()) return NextResponse.json({ error: '名称は必須です' }, { status: 400 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error: dbErr } = await (supabase as any)
    .from('sites')
    .update({ name: name.trim() })
    .eq('id', id)
    .eq('tenant_id', tenantId)
    .select()
    .single()

  if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 })
  return NextResponse.json({ site: data })
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const { id } = await params
  const supabase = await createClient()
  const tenantResult = await getTenant(supabase)
  if (tenantResult.error) return NextResponse.json({ error: tenantResult.error }, { status: 401 })
  const tenantId = tenantResult.tenantId as string

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: dbErr } = await (supabase as any)
    .from('sites')
    .update({ active_flag: false })
    .eq('id', id)
    .eq('tenant_id', tenantId)

  if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
