import type {
  Delivery,
  DeliveryItem,
  Company,
  Site,
  Product,
} from '@/types/database'
import { BaseRepository, unwrap, RepositoryError } from './base.repository'

// ---------------------------------------------------------------------------
// Composite types
// ---------------------------------------------------------------------------

export interface DeliveryWithDetails extends Delivery {
  delivery_items: Array<
    DeliveryItem & {
      product: Pick<Product, 'id' | 'name' | 'spec'>
    }
  >
  company: Pick<Company, 'id' | 'name'>
  site: Pick<Site, 'id' | 'name'>
}

// ---------------------------------------------------------------------------
// Input types
// ---------------------------------------------------------------------------

export interface CreateDeliveryItemInput {
  product_id: string
  quantity: number
  // snapshot_unit_price / snapshot_tax_rate are intentionally absent —
  // they are set by the BEFORE INSERT trigger from the product master.
}

export interface CreateDeliveryInput {
  delivery_date: string // ISO date
  company_id: string
  site_id: string
  items: CreateDeliveryItemInput[]
}

// ---------------------------------------------------------------------------
// Repository
// ---------------------------------------------------------------------------

export class DeliveriesRepository extends BaseRepository {
  // ── Read ──────────────────────────────────────────────────────────────────

  async findByDateRange(opts: {
    startDate: string
    endDate: string
    companyId?: string
    status?: Delivery['status']
  }): Promise<Delivery[]> {
    let query = this.db
      .from('deliveries')
      .select('*')
      .gte('delivery_date', opts.startDate)
      .lte('delivery_date', opts.endDate)
      .order('delivery_date', { ascending: false })

    if (opts.companyId) query = query.eq('company_id', opts.companyId)
    if (opts.status)    query = query.eq('status', opts.status)

    const { data, error } = await query
    if (error) throw new RepositoryError(error.message, error.code)
    return data ?? []
  }

  async findById(id: string): Promise<DeliveryWithDetails | null> {
    const { data, error } = await this.db
      .from('deliveries')
      .select(`
        *,
        delivery_items (
          *,
          product: products (id, name, spec)
        ),
        company: companies (id, name),
        site:    sites     (id, name)
      `)
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw new RepositoryError(error.message, error.code)
    }
    return data as DeliveryWithDetails
  }

  /**
   * Returns editable deliveries for a company up to and including the
   * closing date — i.e. the set eligible for the next invoice.
   */
  async findInvoiceable(
    companyId: string,
    closingDate: string,
  ): Promise<Delivery[]> {
    const { data, error } = await this.db
      .from('deliveries')
      .select('*')
      .eq('company_id', companyId)
      .eq('status', 'editable')
      .lte('delivery_date', closingDate)
      .order('delivery_date')

    if (error) throw new RepositoryError(error.message, error.code)
    return data ?? []
  }

  // ── Write ─────────────────────────────────────────────────────────────────

  /**
   * Create a delivery with line items.
   *
   * The trigger `delivery_items_snapshot_prices` automatically overwrites
   * snapshot_unit_price and snapshot_tax_rate from the product master —
   * the caller never touches those fields.
   *
   * The trigger `delivery_items_guard_invoiced_status` prevents adding items
   * if the delivery is already invoiced (shouldn't happen here, but safety net).
   */
  async create(input: CreateDeliveryInput): Promise<DeliveryWithDetails> {
    if (input.items.length === 0) {
      throw new RepositoryError('A delivery must have at least one item')
    }

    // 1. Create delivery header
    const delivery = unwrap(
      await this.db
        .from('deliveries')
        .insert({
          tenant_id:     this.tenantId,
          delivery_date: input.delivery_date,
          company_id:    input.company_id,
          site_id:       input.site_id,
        })
        .select()
        .single(),
    )

    // 2. Create line items — snapshot columns are set by DB trigger
    const itemRows = input.items.map((item) => ({
      tenant_id:   this.tenantId,
      delivery_id: delivery.id,
      product_id:  item.product_id,
      quantity:    item.quantity,
      // snapshot_unit_price / snapshot_tax_rate: DB trigger fills these in.
      // We still need to satisfy NOT NULL at parse time, so we pass 0.
      // The trigger runs BEFORE the constraint check, so it overwrites 0.
      snapshot_unit_price: 0,
      snapshot_tax_rate:   0,
    }))

    const { error: itemsError } = await this.db
      .from('delivery_items')
      .insert(itemRows)

    if (itemsError) {
      // Attempt cleanup — delivery has no items, it's useless
      await this.db.from('deliveries').delete().eq('id', delivery.id)
      throw new RepositoryError(itemsError.message, itemsError.code)
    }

    return unwrap(
      await this.db
        .from('deliveries')
        .select(`
          *,
          delivery_items (
            *,
            product: products (id, name, spec)
          ),
          company: companies (id, name),
          site:    sites     (id, name)
        `)
        .eq('id', delivery.id)
        .single(),
    ) as DeliveryWithDetails
  }

  async updateItem(
    itemId: string,
    quantity: number,
  ): Promise<DeliveryItem> {
    // Guard enforced by trigger (invoiced delivery → blocked at DB level)
    return unwrap(
      await this.db
        .from('delivery_items')
        .update({ quantity })
        .eq('id', itemId)
        .select()
        .single(),
    )
  }

  async deleteItem(itemId: string): Promise<void> {
    const { error } = await this.db
      .from('delivery_items')
      .delete()
      .eq('id', itemId)

    if (error) throw new RepositoryError(error.message, error.code)
  }
}
