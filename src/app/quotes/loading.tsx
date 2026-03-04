import type { CSSProperties } from 'react'

const skBlock = (w: number | string, h: number): CSSProperties => ({
  width: w, height: h, borderRadius: 6,
  background: 'rgba(255,255,255,0.08)',
})

export default function Loading() {
  return (
    <main style={{
      maxWidth: 448, margin: '0 auto',
      padding: '12px 16px 120px',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      minHeight: '100dvh',
    }}>
      {/* search skeleton */}
      <div className="sk" style={{ ...skBlock('100%', 42), marginBottom: 16, borderRadius: 6 }} />

      {/* quote cards */}
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="sk" style={{
          ...skBlock('100%', 62), marginBottom: 6, borderRadius: 8,
        }} />
      ))}
    </main>
  )
}
