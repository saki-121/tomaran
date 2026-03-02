// POST /api/invoices  — create a draft invoice from a set of deliveries
//
// Request body:
// {
//   tenantId:        string
//   companyId:       string
//   closingDate:     string  // ISO date e.g. "2024-01-31"
//   paymentDueDate:  string  // ISO date
//   deliveryIds:     string[]
// }
//
// The handler fetches delivery_items for the given deliveries, copies their
// snapshotted prices into invoice_items, and creates a draft invoice.

import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { InvoicesRepository, type CreateInvoiceLineItem } from '@/repositories/invoices.repository'
import { RepositoryError } from '@/repositories/base.repository'

const bodySchema = z.object({
  tenantId:       z.string().uuid(),
  companyId:      z.string().uuid(),
  closingDate:    z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  paymentDueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  deliveryIds:    z.array(z.string().uuid()).min(1),
})

export async function POST(request: NextRequest) {
  // ── Auth ──────────────────────────────────────────────────────────────────
  const db = await createClient()
  const { data: { user }, error: authError } = await db.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // ── Parse body ────────────────────────────────────────────────────────────
  const raw = await request.json().catch(() => null)
  const parsed = bodySchema.safeParse(raw)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }
  const { tenantId, companyId, closingDate, paymentDueDate, deliveryIds } = parsed.data

  // ── Verify caller belongs to tenantId ─────────────────────────────────────
  // RLS on the subsequent queries enforces this implicitly, but we check
  // explicitly here to return a clear 403 instead of an opaque 0-row result.
  const { count } = await db
    .from('user_tenants')
    .select('*', { count: 'exact', head: true })
    .eq('tenant_id', tenantId)
    .eq('user_id', user.id)

  if (!count) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // ── Load delivery items (prices already snapshotted by DB trigger) ─────────
  const { data: deliveryItems, error: itemsErr } = await db
    .from('delivery_items')
    .select(`
      *,
      delivery: deliveries (
        id,
        delivery_date,
        site: sites (id, name)
      )
    `)
    .in('delivery_id', deliveryIds)
    .eq('deliveries.status', 'editable') // double-guard; RLS handles tenant scope

  if (itemsErr) {
    return NextResponse.json({ error: itemsErr.message }, { status: 500 })
  }

  if (!deliveryItems?.length) {
    return NextResponse.json(
      { error: 'No editable delivery items found for the given delivery IDs' },
      { status: 422 },
    )
  }

  // ── Flatten to invoice line items ─────────────────────────────────────────
  const lineItems: CreateInvoiceLineItem[] = deliveryItems.map((di) => {
    const delivery = di.delivery as {
      id: string
      delivery_date: string
      site: { id: string; name: string }
    }
    return {
      delivery_id:   di.delivery_id,
      site_name:     delivery.site.name,
      delivery_date: delivery.delivery_date,
      product_name:  `Product ${di.product_id}`, // caller should JOIN products for name
      quantity:      di.quantity,
      unit_price:    di.snapshot_unit_price,
      tax_rate:      di.snapshot_tax_rate,
    }
  })

  // ── Create draft ──────────────────────────────────────────────────────────
  const repo = new InvoicesRepository(db, tenantId)

  try {
    const invoice = await repo.createDraft({
      company_id:       companyId,
      closing_date:     closingDate,
      payment_due_date: paymentDueDate,
      items:            lineItems,
    })

    return NextResponse.json({ invoice }, { status: 201 })
  } catch (err) {
    if (err instanceof RepositoryError) {
      return NextResponse.json({ error: err.message }, { status: 422 })
    }
    console.error('[POST /api/invoices] unexpected error', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
