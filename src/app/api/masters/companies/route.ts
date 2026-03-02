import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { getTenant } from '@/lib/get-tenant'

export async function GET() {
  const supabase = await createClient()
  const result = await getTenant(supabase)
  if (result.error) return NextResponse.json({ error: result.error }, { status: 401 })
  const tenantId = result.tenantId as string

  const { data, error: dbErr } = await supabase
    .from('companies')
    .select('id, name')
    .eq('tenant_id', tenantId)
    .eq('active_flag', true)
    .order('name')

  if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 })
  return NextResponse.json({ companies: data ?? [] })
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

  // 仮登録: closing_day=31, payment_type='next_month_end'
  // → STEP7 マスタ管理画面で正式編集
  const { data, error: dbErr } = await supabase
    .from('companies')
    .insert({
      tenant_id:    tenantId,
      name:         name.trim(),
      closing_day:  31,
      payment_type: 'next_month_end',
    })
    .select('id, name')
    .single()

  if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 })
  return NextResponse.json({ company: data }, { status: 201 })
}
