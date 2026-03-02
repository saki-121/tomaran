import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { getTenant } from '@/lib/get-tenant'

export async function GET() {
  const supabase = await createClient()
  const result = await getTenant(supabase)
  if (result.error) return NextResponse.json({ error: result.error }, { status: 401 })
  const tenantId = result.tenantId as string

  const { data, error: dbErr } = await supabase
    .from('products')
    .select('id, name, unit_price')
    .eq('tenant_id', tenantId)
    .eq('active_flag', true)
    .order('name')

  if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 })
  return NextResponse.json({ products: data ?? [] })
}

export async function POST(req: Request) {
  const supabase = await createClient()
  const result = await getTenant(supabase)
  if (result.error) return NextResponse.json({ error: result.error }, { status: 401 })
  const tenantId = result.tenantId as string

  const { name } = await req.json()
  if (!name?.trim()) {
    return NextResponse.json({ error: '名称は必須です' }, { status: 400 })
  }

  // 仮登録: unit_price=0 → STEP8「単価未設定一覧」で正式入力
  const { data, error: dbErr } = await supabase
    .from('products')
    .insert({
      tenant_id:  tenantId,
      name:       name.trim(),
      unit_price: 0,
      tax_rate:   0.1,
    })
    .select('id, name, unit_price')
    .single()

  if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 })
  return NextResponse.json({ product: data }, { status: 201 })
}
