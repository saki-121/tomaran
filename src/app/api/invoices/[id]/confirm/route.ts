// POST /api/invoices/[id]/confirm
//
// Confirms a draft invoice:
//   1. Validates the caller is authenticated
//   2. Validates the caller belongs to the invoice's tenant
//   3. Calls the DB transaction function confirm_invoice()
//   4. Returns the immutable snapshot JSON
//
// After this endpoint returns 200 the invoice is permanently sealed.

import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { InvoicesRepository } from '@/repositories/invoices.repository'
import { RepositoryError }     from '@/repositories/base.repository'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const { id: invoiceId } = await params

  // ── 1. Auth ───────────────────────────────────────────────────────────────
  const db = await createClient()
  const {
    data: { user },
    error: authError,
  } = await db.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // ── 2. Resolve tenant ─────────────────────────────────────────────────────
  // We need the tenant_id to construct the repository.
  // Read the invoice first (RLS guarantees we can only see it if we belong
  // to its tenant — so this also acts as an implicit membership check).
  const { data: invoice, error: readError } = await db
    .from('invoices')
    .select('id, tenant_id, status')
    .eq('id', invoiceId)
    .single()

  if (readError) {
    return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
  }

  if (!invoice) {
    return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
  }

  if (invoice.status !== 'draft') {
    return NextResponse.json(
      { error: `Invoice is already "${invoice.status}" — only draft invoices can be confirmed` },
      { status: 422 },
    )
  }

  // ── 3. Confirm via DB transaction ─────────────────────────────────────────
  const repo = new InvoicesRepository(db, invoice.tenant_id)

  try {
    const snapshot = await repo.confirm(invoiceId)

    return NextResponse.json(
      {
        message:  'Invoice confirmed successfully',
        snapshot,
      },
      { status: 200 },
    )
  } catch (err) {
    if (err instanceof RepositoryError) {
      // Surface DB-level errors (e.g. empty invoice, wrong status, immutability)
      return NextResponse.json(
        { error: err.message },
        { status: err.code === 'PGRST116' ? 404 : 422 },
      )
    }
    console.error('[confirm_invoice] unexpected error', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
