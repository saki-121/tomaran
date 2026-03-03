// POST /api/invoices/generate
//
// Manually trigger invoice generation for a specific date.
// Body (optional): { date: "YYYY-MM-DD" } — defaults to today (JST)

import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { getTenant } from '@/lib/get-tenant'

function todayJST(): string {
  return new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().split('T')[0]
}

export async function POST(req: Request) {
  const supabase = await createClient()
  const tenantResult = await getTenant(supabase)
  if (tenantResult.error) return NextResponse.json({ error: tenantResult.error }, { status: 401 })
  const tenantId = tenantResult.tenantId as string

  const body = await req.json().catch(() => ({}))
  const date: string = body.date ?? todayJST()

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: 'date must be YYYY-MM-DD' }, { status: 400 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error: rpcErr } = await (supabase as any).rpc('generate_invoices_for_date', {
    p_date: date,
  })

  if (rpcErr) return NextResponse.json({ error: rpcErr.message }, { status: 500 })

  // Filter to only this tenant's results
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const results = ((data ?? []) as any[]).filter((r) => r.r_tenant_id === tenantId)

  return NextResponse.json({ date, results })
}
