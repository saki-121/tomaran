// PUT    /api/masters/bank-accounts/[id]
// DELETE /api/masters/bank-accounts/[id]  — 物理削除

import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { getTenant } from '@/lib/get-tenant'

type Ctx = { params: Promise<{ id: string }> }

export async function PUT(req: Request, { params }: Ctx) {
  const { id } = await params
  const supabase = await createClient()
  const result = await getTenant(supabase)
  if (result.error) return NextResponse.json({ error: result.error }, { status: 401 })
  const tenantId = result.tenantId as string

  const body = await req.json()
  const { bank_name, branch_name, account_type, account_number, account_holder, is_default } = body

  if (!bank_name?.trim()) return NextResponse.json({ error: '銀行名は必須です' }, { status: 400 })

  // is_default=true の場合、他をクリア（自分以外）
  if (is_default) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any)
      .from('bank_accounts')
      .update({ is_default: false })
      .eq('tenant_id', tenantId)
      .neq('id', id)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error: dbErr } = await (supabase as any)
    .from('bank_accounts')
    .update({
      bank_name:      bank_name.trim(),
      branch_name:    branch_name?.trim() ?? null,
      account_type:   account_type ?? null,
      account_number: account_number?.trim() ?? null,
      account_holder: account_holder?.trim() ?? null,
      is_default:     is_default ?? false,
    })
    .eq('id', id)
    .eq('tenant_id', tenantId)
    .select('*')
    .single()

  if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 })
  return NextResponse.json({ bank_account: data })
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const { id } = await params
  const supabase = await createClient()
  const result = await getTenant(supabase)
  if (result.error) return NextResponse.json({ error: result.error }, { status: 401 })
  const tenantId = result.tenantId as string

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: dbErr } = await (supabase as any)
    .from('bank_accounts')
    .delete()
    .eq('id', id)
    .eq('tenant_id', tenantId)

  if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
