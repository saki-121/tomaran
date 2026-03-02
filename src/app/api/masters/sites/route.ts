import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { getTenant } from '@/lib/get-tenant'

export async function GET(req: Request) {
  const supabase = await createClient()
  const result = await getTenant(supabase)
  if (result.error) return NextResponse.json({ error: result.error }, { status: 401 })
  const tenantId = result.tenantId as string

  const { searchParams } = new URL(req.url)
  const companyId = searchParams.get('company_id')
  if (!companyId) {
    return NextResponse.json({ error: 'company_id is required' }, { status: 400 })
  }

  const { data, error: dbErr } = await supabase
    .from('sites')
    .select('id, name')
    .eq('tenant_id', tenantId)
    .eq('company_id', companyId)
    .eq('active_flag', true)
    .order('name')

  if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 })
  return NextResponse.json({ sites: data ?? [] })
}

export async function POST(req: Request) {
  const supabase = await createClient()
  const result = await getTenant(supabase)
  if (result.error) return NextResponse.json({ error: result.error }, { status: 401 })
  const tenantId = result.tenantId as string

  const { name, company_id } = await req.json()
  if (!name?.trim())  return NextResponse.json({ error: '名称は必須です' }, { status: 400 })
  if (!company_id)    return NextResponse.json({ error: '取引先は必須です' }, { status: 400 })

  const { data, error: dbErr } = await supabase
    .from('sites')
    .insert({
      tenant_id:  tenantId,
      company_id,
      name:       name.trim(),
    })
    .select('id, name')
    .single()

  if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 })
  return NextResponse.json({ site: data }, { status: 201 })
}
