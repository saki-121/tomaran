// Repository factory — use this in Route Handlers and Server Actions.
//
// Usage:
//   const { companies, invoices } = await createRepositories(tenantId)
//   const co = await companies.findByIdOrThrow(companyId)

import { createClient } from '@/lib/supabase/server'
import { CompaniesRepository } from './companies.repository'
import { DeliveriesRepository } from './deliveries.repository'
import { InvoicesRepository }   from './invoices.repository'

export async function createRepositories(tenantId: string) {
  const db = await createClient()
  return {
    companies:  new CompaniesRepository(db, tenantId),
    deliveries: new DeliveriesRepository(db, tenantId),
    invoices:   new InvoicesRepository(db, tenantId),
  }
}

export { CompaniesRepository }  from './companies.repository'
export { DeliveriesRepository } from './deliveries.repository'
export { InvoicesRepository }   from './invoices.repository'
export { RepositoryError, isNotFound } from './base.repository'
