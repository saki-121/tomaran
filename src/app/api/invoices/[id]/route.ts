// GET /api/invoices/[id] — 請求書詳細取得

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getTenant } from '@/lib/get-tenant'

type Ctx = { params: Promise<{ id: string }> }

export async function GET(_req: Request, { params }: Ctx) {
  const { id } = await params
  const supabase = await createClient()
  const tenantResult = await getTenant(supabase)
  if (tenantResult.error) return NextResponse.json({ error: tenantResult.error }, { status: 401 })
  const tenantId = tenantResult.tenantId as string

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error: dbErr } = await (supabase as any)
    .from('invoices')
    .select(`
      id, invoice_number, status,
      closing_date, payment_due_date,
      period_from, period_to,
      total_amount, tax_amount, grand_total,
      company:companies(id, name, address, invoice_number)
    `)
    .eq('id', id)
    .eq('tenant_id', tenantId)
    .single()

  if (dbErr) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ invoice: data })
}
