/**
 * Performance monitoring utilities
 * Free optimization for tracking query performance and bottlenecks
 */

// Query performance logging
export function logQueryTime(queryName: string, startTime: number) {
  const duration = Date.now() - startTime
  
  // Log slow queries (>1 second)
  if (duration > 1000) {
    console.warn(`🐌 Slow query detected: ${queryName} (${duration}ms)`)
  }
  
  // Log medium queries (>500ms) in development
  if (duration > 500 && process.env.NODE_ENV === 'development') {
    console.info(`⚠️  Medium query: ${queryName} (${duration}ms)`)
  }
  
  // Log fast queries for optimization tracking
  if (duration <= 100) {
    console.log(`✅ Fast query: ${queryName} (${duration}ms)`)
  }
}

// Database query wrapper with performance tracking
export async function withQueryTracking<T>(
  queryName: string,
  queryFn: () => Promise<T>
): Promise<T> {
  const startTime = Date.now()
  
  try {
    const result = await queryFn()
    logQueryTime(queryName, startTime)
    return result
  } catch (error) {
    console.error(`❌ Query failed: ${queryName} (${Date.now() - startTime}ms)`, error)
    throw error
  }
}

// Memory usage tracking (development only)
export function logMemoryUsage(context: string) {
  if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined' && 'memory' in performance) {
    const memory = (performance as any).memory
    console.log(`🧠 Memory (${context}):`, {
      used: `${Math.round(memory.usedJSHeapSize / 1024 / 1024)}MB`,
      total: `${Math.round(memory.totalJSHeapSize / 1024 / 1024)}MB`,
      limit: `${Math.round(memory.jsHeapSizeLimit / 1024 / 1024)}MB`
    })
  }
}

// Component render performance tracking
export function trackComponentRender(componentName: string) {
  if (process.env.NODE_ENV === 'development') {
    const startTime = Date.now()
    
    return () => {
      const duration = Date.now() - startTime
      if (duration > 100) {
        console.warn(`🎨 Slow render: ${componentName} (${duration}ms)`)
      }
    }
  }
  
  return () => {} // No-op in production
}

// API response time tracking middleware helper
export function createApiPerformanceTracker(apiPath: string) {
  return {
    start: () => Date.now(),
    end: (startTime: number, statusCode?: number) => {
      const duration = Date.now() - startTime
      const status = statusCode ? ` [${statusCode}]` : ''
      
      if (duration > 2000) {
        console.error(`🚨 Very slow API: ${apiPath}${status} (${duration}ms)`)
      } else if (duration > 1000) {
        console.warn(`⚠️  Slow API: ${apiPath}${status} (${duration}ms)`)
      } else {
        console.log(`✅ API: ${apiPath}${status} (${duration}ms)`)
      }
    }
  }
}

// Database connection health check
export async function checkDatabaseHealth(supabase: any) {
  try {
    const startTime = Date.now()
    const { error } = await supabase.from('tenants').select('id').limit(1)
    const duration = Date.now() - startTime
    
    if (error) {
      console.error('❌ Database health check failed:', error)
      return { healthy: false, error: error.message, duration }
    }
    
    if (duration > 500) {
      console.warn(`⚠️  Slow database response: ${duration}ms`)
    }
    
    return { healthy: true, duration }
  } catch (error) {
    console.error('❌ Database health check error:', error)
    return { healthy: false, error: (error as Error).message, duration: 0 }
  }
}
