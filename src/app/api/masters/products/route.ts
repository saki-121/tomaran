import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { getTenant } from '@/lib/get-tenant'

export async function GET(req: Request) {
  const supabase = await createClient()
  const result = await getTenant(supabase)
  if (result.error) return NextResponse.json({ error: result.error }, { status: 401 })
  const tenantId = result.tenantId as string

  const { searchParams } = new URL(req.url)
  const includeAll = searchParams.get('all') === '1'

  let query = supabase
    .from('products')
    .select('id, name, spec, unit_price, tax_rate, status, active_flag')
    .eq('tenant_id', tenantId)
    .order('name')

  // Default: active only (field delivery form)
  // all=1: include provisional (admin master page)
  if (!includeAll) query = query.eq('active_flag', true)

  const { data, error: dbErr } = await query
  if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 })
  return NextResponse.json({ products: data ?? [] })
}

export async function POST(req: Request) {
  const supabase = await createClient()
  const result = await getTenant(supabase)
  if (result.error) return NextResponse.json({ error: result.error }, { status: 401 })
  const tenantId = result.tenantId as string

  const body = await req.json()
  const { name, unit_price, status } = body

  if (!name?.trim()) return NextResponse.json({ error: '名称は必須です' }, { status: 400 })

  const parsedPrice = (unit_price === '' || unit_price === null || unit_price === undefined)
    ? null
    : Number(unit_price)

  const resolvedStatus = status ?? (parsedPrice !== null ? 'active' : 'provisional')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error: dbErr } = await (supabase as any)
    .from('products')
    .insert({
      tenant_id:   tenantId,
      name:        name.trim(),
      unit_price:  parsedPrice,
      tax_rate:    0.1,
      status:      resolvedStatus,
      active_flag: resolvedStatus === 'active',
    })
    .select('id, name, spec, unit_price, tax_rate, status, active_flag')
    .single()

  if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 })
  return NextResponse.json({ product: data }, { status: 201 })
}
