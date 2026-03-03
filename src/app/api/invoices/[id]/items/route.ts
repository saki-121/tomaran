// GET /api/invoices/[id]/items — 請求書明細一覧

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

  const { data, error: dbErr } = await supabase
    .from('invoice_items')
    .select('id, site_name, delivery_date, product_name, quantity, unit_price, tax_amount, amount')
    .eq('invoice_id', id)
    .eq('tenant_id', tenantId)
    .order('site_name')
    .order('delivery_date')
    .order('product_name')

  if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 })
  return NextResponse.json({ items: data ?? [] })
}
