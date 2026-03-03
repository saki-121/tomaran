// GET  /api/masters/bank-accounts
// POST /api/masters/bank-accounts

import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { getTenant } from '@/lib/get-tenant'

export async function GET() {
  const supabase = await createClient()
  const result = await getTenant(supabase)
  if (result.error) return NextResponse.json({ error: result.error }, { status: 401 })
  const tenantId = result.tenantId as string

  const { data, error: dbErr } = await supabase
    .from('bank_accounts')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('is_default', { ascending: false })

  if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 })
  return NextResponse.json({ bank_accounts: data ?? [] })
}

export async function POST(req: Request) {
  const supabase = await createClient()
  const result = await getTenant(supabase)
  if (result.error) return NextResponse.json({ error: result.error }, { status: 401 })
  const tenantId = result.tenantId as string

  const body = await req.json()
  const { bank_name, branch_name, account_type, account_number, account_holder, is_default } = body

  if (!bank_name?.trim()) return NextResponse.json({ error: '銀行名は必須です' }, { status: 400 })

  // is_default=true の場合、先に他をクリア
  if (is_default) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any)
      .from('bank_accounts')
      .update({ is_default: false })
      .eq('tenant_id', tenantId)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error: dbErr } = await (supabase as any)
    .from('bank_accounts')
    .insert({
      tenant_id:      tenantId,
      bank_name:      bank_name.trim(),
      branch_name:    branch_name?.trim() ?? null,
      account_type:   account_type ?? null,
      account_number: account_number?.trim() ?? null,
      account_holder: account_holder?.trim() ?? null,
      is_default:     is_default ?? false,
    })
    .select('*')
    .single()

  if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 })
  return NextResponse.json({ bank_account: data }, { status: 201 })
}
