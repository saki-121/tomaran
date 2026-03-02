import type { Company, Site, Inserts, Updates } from '@/types/database'
import { BaseRepository, unwrap, RepositoryError } from './base.repository'

type CompanyInsert = Omit<Inserts<'companies'>, 'tenant_id'>
type CompanyUpdate = Omit<Updates<'companies'>, 'tenant_id' | 'id' | 'created_at'>

export interface CompanyWithSites extends Company {
  sites: Site[]
}

export class CompaniesRepository extends BaseRepository {
  // ── Read ──────────────────────────────────────────────────────────────────

  async findAll(opts?: { activeOnly?: boolean }): Promise<Company[]> {
    let query = this.db
      .from('companies')
      .select('*')
      .order('name')

    if (opts?.activeOnly) {
      query = query.eq('active_flag', true)
    }

    const { data, error } = await query
    if (error) throw new RepositoryError(error.message, error.code)
    return data ?? []
  }

  async findById(id: string): Promise<Company | null> {
    const { data, error } = await this.db
      .from('companies')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw new RepositoryError(error.message, error.code)
    }
    return data
  }

  async findByIdOrThrow(id: string): Promise<Company> {
    const company = await this.findById(id)
    if (!company) throw new RepositoryError(`Company not found: ${id}`, 'PGRST116')
    return company
  }

  async findWithSites(id: string): Promise<CompanyWithSites | null> {
    const { data, error } = await this.db
      .from('companies')
      .select('*, sites(*)')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw new RepositoryError(error.message, error.code)
    }
    return data as CompanyWithSites
  }

  // ── Write ─────────────────────────────────────────────────────────────────

  async create(input: CompanyInsert): Promise<Company> {
    return unwrap(
      await this.db
        .from('companies')
        .insert({ ...input, tenant_id: this.tenantId })
        .select()
        .single(),
    )
  }

  async update(id: string, input: CompanyUpdate): Promise<Company> {
    return unwrap(
      await this.db
        .from('companies')
        .update(input)
        .eq('id', id)
        .select()
        .single(),
    )
  }

  async deactivate(id: string): Promise<void> {
    const { error } = await this.db
      .from('companies')
      .update({ active_flag: false })
      .eq('id', id)

    if (error) throw new RepositoryError(error.message, error.code)
  }

  // ── Date helpers (delegate to DB functions) ───────────────────────────────

  async calculateClosingDate(
    company: Pick<Company, 'closing_day'>,
    baseDate: Date,
  ): Promise<Date> {
    const { data, error } = await this.db.rpc('calculate_closing_date', {
      p_closing_day: company.closing_day,
      p_base_date: baseDate.toISOString().split('T')[0],
    })

    if (error) throw new RepositoryError(error.message)
    return new Date(data as string)
  }

  async calculatePaymentDueDate(
    company: Pick<Company, 'payment_type'>,
    closingDate: Date,
  ): Promise<Date> {
    const { data, error } = await this.db.rpc('calculate_payment_due_date', {
      p_closing_date: closingDate.toISOString().split('T')[0],
      p_payment_type: company.payment_type,
    })

    if (error) throw new RepositoryError(error.message)
    return new Date(data as string)
  }

  /**
   * Convenience: returns both closing_date and payment_due_date for a company
   * given a reference date (e.g. today).
   */
  async calculateDates(
    company: Pick<Company, 'closing_day' | 'payment_type'>,
    baseDate: Date = new Date(),
  ): Promise<{ closingDate: Date; paymentDueDate: Date }> {
    const closingDate = await this.calculateClosingDate(company, baseDate)
    const paymentDueDate = await this.calculatePaymentDueDate(company, closingDate)
    return { closingDate, paymentDueDate }
  }
}
