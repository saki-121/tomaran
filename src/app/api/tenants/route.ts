import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { name } = await req.json() as { name: string }

  if (!name?.trim()) {
    return NextResponse.json({ error: '会社名は必須です' }, { status: 400 })
  }

  // SECURITY DEFINER RPC 経由でテナント作成 + ユーザー紐付けをアトミックに実行
  // （tenants テーブルは通常クライアントからの INSERT 不可のため）
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any).rpc('create_tenant_for_user', {
    tenant_name: name.trim(),
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
