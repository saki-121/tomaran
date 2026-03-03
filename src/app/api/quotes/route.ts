// GET  /api/quotes       — 見積書一覧（?q= で recipient ILIKE 検索）
// POST /api/quotes       — 見積書保存

import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getTenant } from '@/lib/get-tenant'

export async function GET(request: NextRequest) {
  const db = await createClient()
  const tenantResult = await getTenant(db)
  if (tenantResult.error) return NextResponse.json({ error: tenantResult.error }, { status: 401 })
  const tenantId = tenantResult.tenantId as string

  const { searchParams } = new URL(request.url)
  const q = searchParams.get('q')?.trim() ?? ''

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query = (db as any)
    .from('quotes')
    .select('id, recipient, subtotal, tax_amount, grand_total, issued_date, created_at')
    .eq('tenant_id', tenantId)
    .order('issued_date', { ascending: false })
    .limit(200)

  if (q) {
    query = query.ilike('recipient', `%${q}%`)
  }

  const { data, error: dbErr } = await query
  if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 })
  return NextResponse.json({ quotes: data ?? [] })
}

export async function POST(request: NextRequest) {
  const db = await createClient()
  const tenantResult = await getTenant(db)
  if (tenantResult.error) return NextResponse.json({ error: tenantResult.error }, { status: 401 })
  const tenantId = tenantResult.tenantId as string

  const { data: { user } } = await db.auth.getUser()

  const body = await request.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Invalid body' }, { status: 400 })

  const { recipient, subtotal, tax_amount, grand_total, items_json, issued_date } = body as {
    recipient: string
    subtotal: number
    tax_amount: number
    grand_total: number
    items_json: unknown
    issued_date: string
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error: dbErr } = await (db as any)
    .from('quotes')
    .insert({
      tenant_id:   tenantId,
      recipient:   recipient ?? '',
      subtotal:    subtotal ?? 0,
      tax_amount:  tax_amount ?? 0,
      grand_total: grand_total ?? 0,
      items_json:  items_json ?? [],
      issued_date: issued_date ?? new Date().toISOString().split('T')[0],
      created_by:  user?.id ?? null,
    })
    .select()
    .single()

  if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 })
  return NextResponse.json({ quote: data }, { status: 201 })
}
