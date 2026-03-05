// GET /api/masters/own  — 自社マスタ取得
// PUT /api/masters/own  — 自社マスタ保存（upsert）

import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { getTenant } from '@/lib/get-tenant'

export async function GET() {
  const supabase = await createClient()
  const tenantResult = await getTenant(supabase)
  if (tenantResult.error) return NextResponse.json({ error: tenantResult.error }, { status: 401 })
  const tenantId = tenantResult.tenantId as string

  // Get tenant info with logo
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: tenant, error: tenantErr } = await (supabase as any)
    .from('tenants')
    .select('logo_url')
    .eq('id', tenantId)
    .single()

  if (tenantErr) return NextResponse.json({ error: tenantErr.message }, { status: 500 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error: dbErr } = await (supabase as any)
    .from('own_company_profiles')
    .select('*')
    .eq('tenant_id', tenantId)
    .maybeSingle()

  if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 })
  return NextResponse.json({ 
    profile: data,
    logo_url: tenant?.logo_url || null
  })
}

export async function PUT(req: Request) {
  const supabase = await createClient()
  const tenantResult = await getTenant(supabase)
  if (tenantResult.error) return NextResponse.json({ error: tenantResult.error }, { status: 401 })
  const tenantId = tenantResult.tenantId as string

  const body = await req.json()
  const { company_name, address, phone, invoice_registration_number } = body

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error: dbErr } = await (supabase as any)
    .from('own_company_profiles')
    .upsert(
      {
        tenant_id:                   tenantId,
        company_name:                company_name ?? null,
        address:                     address ?? null,
        phone:                       phone ?? null,
        invoice_registration_number: invoice_registration_number ?? null,
      },
      { onConflict: 'tenant_id' },
    )
    .select()
    .single()

  if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 })
  return NextResponse.json({ profile: data })
}
