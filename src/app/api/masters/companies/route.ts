import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { getTenant } from '@/lib/get-tenant'

export async function GET(req: Request) {
  const supabase = await createClient()
  const result = await getTenant(supabase)
  if (result.error) return NextResponse.json({ error: result.error }, { status: 401 })
  const tenantId = result.tenantId as string

  const { searchParams } = new URL(req.url)
  const includeInactive = searchParams.get('all') === '1'

  let query = supabase
    .from('companies')
    .select('id, name, address, phone, closing_day, payment_type, active_flag, created_at')
    .eq('tenant_id', tenantId)
    .order('name')

  if (!includeInactive) query = query.eq('active_flag', true)

  const { data, error: dbErr } = await query
  if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 })
  return NextResponse.json({ companies: data ?? [] })
}

export async function POST(req: Request) {
  const supabase = await createClient()
  const result = await getTenant(supabase)
  if (result.error) return NextResponse.json({ error: result.error }, { status: 401 })
  const tenantId = result.tenantId as string

  const body = await req.json()
  const { name, address, phone, closing_day, payment_type } = body

  if (!name?.trim()) return NextResponse.json({ error: '名称は必須です' }, { status: 400 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error: dbErr } = await (supabase as any)
    .from('companies')
    .insert({
      tenant_id:    tenantId,
      name:         name.trim(),
      address:      address ?? null,
      phone:        phone ?? null,
      closing_day:  closing_day ? Number(closing_day) : 99,
      payment_type: payment_type ?? 'next_month_end',
    })
    .select('id, name, address, phone, closing_day, payment_type, active_flag, created_at')
    .single()

  if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 })
  return NextResponse.json({ company: data }, { status: 201 })
}
