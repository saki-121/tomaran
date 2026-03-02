import type {
  Invoice,
  InvoiceItem,
  InvoiceSnapshot,
  Company,
  Inserts,
} from '@/types/database'
import { BaseRepository, unwrap, RepositoryError } from './base.repository'

// ---------------------------------------------------------------------------
// Composite types
// ---------------------------------------------------------------------------

export interface InvoiceWithItems extends Invoice {
  invoice_items: InvoiceItem[]
  company: Pick<Company, 'id' | 'name'>
}

// ---------------------------------------------------------------------------
// Input types for draft creation
// ---------------------------------------------------------------------------

export interface CreateInvoiceLineItem {
  delivery_id: string
  site_name: string
  delivery_date: string // ISO date
  product_name: string
  quantity: number
  /** From delivery_items.snapshot_unit_price */
  unit_price: number
  /** From delivery_items.snapshot_tax_rate */
  tax_rate: number
}

export interface CreateInvoiceInput {
  company_id: string
  closing_date: string      // ISO date
  payment_due_date: string  // ISO date
  items: CreateInvoiceLineItem[]
}

// ---------------------------------------------------------------------------
// Tax calculation — must match DB behaviour exactly
// ---------------------------------------------------------------------------

/** CEIL(quantity × unit_price × tax_rate) — per-line ceiling, mixed rates OK */
export function calcTaxAmount(
  quantity: number,
  unitPrice: number,
  taxRate: number,
): number {
  return Math.ceil(quantity * unitPrice * taxRate)
}

export function calcAmount(quantity: number, unitPrice: number): number {
  return quantity * unitPrice
}

// ---------------------------------------------------------------------------
// Repository
// ---------------------------------------------------------------------------

export class InvoicesRepository extends BaseRepository {
  // ── Read ──────────────────────────────────────────────────────────────────

  async findAll(opts?: {
    status?: Invoice['status']
    companyId?: string
  }): Promise<Invoice[]> {
    let query = this.db
      .from('invoices')
      .select('*')
      .order('created_at', { ascending: false })

    if (opts?.status)    query = query.eq('status', opts.status)
    if (opts?.companyId) query = query.eq('company_id', opts.companyId)

    const { data, error } = await query
    if (error) throw new RepositoryError(error.message, error.code)
    return data ?? []
  }

  async findById(id: string): Promise<InvoiceWithItems | null> {
    const { data, error } = await this.db
      .from('invoices')
      .select(`
        *,
        invoice_items (*),
        company: companies (id, name)
      `)
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw new RepositoryError(error.message, error.code)
    }
    return data as InvoiceWithItems
  }

  async findByIdOrThrow(id: string): Promise<InvoiceWithItems> {
    const invoice = await this.findById(id)
    if (!invoice) throw new RepositoryError(`Invoice not found: ${id}`, 'PGRST116')
    return invoice
  }

  // ── Write ─────────────────────────────────────────────────────────────────

  /**
   * Create a draft invoice with pre-calculated line items.
   *
   * Amounts are computed here (TypeScript) and stored in invoice_items.
   * Tax rule: CEIL(quantity × unit_price × tax_rate) per line.
   *           Mixed rates (8% / 10%) are fully supported.
   *
   * The audit note is baked into snapshot_json at confirm time; the
   * line-item tax_amount already reflects the ceiling rule.
   */
  async createDraft(input: CreateInvoiceInput): Promise<InvoiceWithItems> {
    if (input.items.length === 0) {
      throw new RepositoryError('An invoice must have at least one line item')
    }

    // 1. Insert invoice header
    const invoice = unwrap(
      await this.db
        .from('invoices')
        .insert({
          tenant_id:        this.tenantId,
          company_id:       input.company_id,
          closing_date:     input.closing_date,
          payment_due_date: input.payment_due_date,
          status:           'draft',
        })
        .select()
        .single(),
    )

    // 2. Insert line items with pre-calculated amounts
    const itemRows: Inserts<'invoice_items'>[] = input.items.map((line) => {
      const amount     = calcAmount(line.quantity, line.unit_price)
      const taxAmount  = calcTaxAmount(line.quantity, line.unit_price, line.tax_rate)

      return {
        tenant_id:     this.tenantId,
        invoice_id:    invoice.id,
        delivery_id:   line.delivery_id,
        site_name:     line.site_name,
        delivery_date: line.delivery_date,
        product_name:  line.product_name,
        quantity:      line.quantity,
        unit_price:    line.unit_price,
        tax_rate:      line.tax_rate,
        tax_amount:    taxAmount,
        amount,
      }
    })

    const { error: itemsError } = await this.db
      .from('invoice_items')
      .insert(itemRows)

    if (itemsError) {
      await this.db.from('invoices').delete().eq('id', invoice.id)
      throw new RepositoryError(itemsError.message, itemsError.code)
    }

    return (await this.findByIdOrThrow(invoice.id))
  }

  /**
   * Confirm a draft invoice via the DB transaction function.
   *
   * The function:
   *   1. Validates caller membership (manual RLS inside SECURITY DEFINER fn)
   *   2. Locks the row (SELECT FOR UPDATE)
   *   3. Generates a sequential, race-safe invoice number (YYYY-NNNN)
   *   4. Builds and stores snapshot_json
   *   5. Sets status = 'confirmed' and confirmed_at = NOW()
   *   6. Marks linked deliveries as 'invoiced'
   *
   * After this call the DB trigger enforces full immutability —
   * no further UPDATE or DELETE on invoices / invoice_items is possible.
   */
  async confirm(invoiceId: string): Promise<InvoiceSnapshot> {
    const { data, error } = await this.db.rpc('confirm_invoice', {
      p_invoice_id: invoiceId,
    })

    if (error) throw new RepositoryError(error.message, error.code, error.hint)
    return data as InvoiceSnapshot
  }

  /**
   * Cancel a draft invoice.
   * Confirmed invoices cannot be cancelled — the DB trigger will reject it.
   */
  async cancel(invoiceId: string): Promise<void> {
    const { error } = await this.db
      .from('invoices')
      .update({ status: 'cancelled' })
      .eq('id', invoiceId)
      .eq('status', 'draft') // belt-and-suspenders: only cancel drafts

    if (error) throw new RepositoryError(error.message, error.code)
  }

  // ── Aggregations ──────────────────────────────────────────────────────────

  async getTotals(invoiceId: string): Promise<{
    subtotal: number
    taxTotal: number
    grandTotal: number
    byTaxRate: Array<{ rate: number; taxableAmount: number; taxAmount: number }>
  }> {
    const { data: items, error } = await this.db
      .from('invoice_items')
      .select('amount, tax_amount, tax_rate')
      .eq('invoice_id', invoiceId)

    if (error) throw new RepositoryError(error.message, error.code)
    const rows = items ?? []

    const subtotal = rows.reduce((s, r) => s + r.amount, 0)
    const taxTotal = rows.reduce((s, r) => s + r.tax_amount, 0)

    const byRateMap = new Map<number, { taxableAmount: number; taxAmount: number }>()
    for (const r of rows) {
      const entry = byRateMap.get(r.tax_rate) ?? { taxableAmount: 0, taxAmount: 0 }
      entry.taxableAmount += r.amount
      entry.taxAmount     += r.tax_amount
      byRateMap.set(r.tax_rate, entry)
    }

    const byTaxRate = [...byRateMap.entries()]
      .sort(([a], [b]) => b - a) // 10% before 8%
      .map(([rate, val]) => ({ rate, ...val }))

    return { subtotal, taxTotal, grandTotal: subtotal + taxTotal, byTaxRate }
  }
}
