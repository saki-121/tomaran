import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const supabase = await createClient()

  // ログインユーザー取得
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { name } = await req.json()

  // ① 会社作成
  const { data: tenant, error: tenantError } = await supabase
    .from('tenants')
    .insert({ name })
    .select()
    .single()

  if (tenantError) {
    return NextResponse.json({ error: tenantError.message }, { status: 500 })
  }

  // ② ユーザーと会社を紐付け
  const { error: linkError } = await supabase
    .from('user_tenants')
    .insert({
      user_id: user.id,
      tenant_id: tenant.id,
      role: 'owner',
    })

  if (linkError) {
    return NextResponse.json({ error: linkError.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}