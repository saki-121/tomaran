// =============================================================================
// BaseRepository
// =============================================================================
//
// Design decisions:
//   • tenant_id is ALWAYS passed explicitly on every INSERT — never inferred.
//   • RLS handles all read/write isolation automatically.
//   • Application code never filters by tenant_id in WHERE clauses — that is
//     RLS's job and doing it twice would be redundant and brittle.
//   • The only code that calls supabase directly is inside repository methods.

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

export type TypedClient = SupabaseClient<Database>

// ---------------------------------------------------------------------------
// Error type
// ---------------------------------------------------------------------------

export class RepositoryError extends Error {
  constructor(
    message: string,
    public readonly code?: string,
    public readonly hint?: string,
  ) {
    super(message)
    this.name = 'RepositoryError'
  }
}

export function isNotFound(err: unknown): err is RepositoryError {
  return err instanceof RepositoryError && err.code === 'PGRST116'
}

// ---------------------------------------------------------------------------
// Helper: throw on Supabase error, return data otherwise
// ---------------------------------------------------------------------------

export function unwrap<T>(result: {
  data: T | null
  error: { message: string; code?: string; hint?: string } | null
}): T {
  if (result.error) {
    throw new RepositoryError(
      result.error.message,
      result.error.code,
      result.error.hint,
    )
  }
  if (result.data === null) {
    throw new RepositoryError('Query returned no data', 'PGRST116')
  }
  return result.data
}

// ---------------------------------------------------------------------------
// Base class
// ---------------------------------------------------------------------------

export abstract class BaseRepository {
  constructor(
    protected readonly db: TypedClient,
    protected readonly tenantId: string,
  ) {}
}
