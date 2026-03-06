import type { CSSProperties } from 'react'

const skBlock = (w: number | string, h: number): CSSProperties => ({
  width: w, height: h, borderRadius: 6,
  background: '#E5E0DA',
})

export default function Loading() {
  return (
    <main style={{
      maxWidth: 448, margin: '0 auto',
      padding: '16px 16px 100px',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      minHeight: '100dvh',
    }}>
      {/* filter skeleton */}
      <div className="sk" style={{ ...skBlock('100%', 42), marginBottom: 20, borderRadius: 8 }} />

      {/* 今日 label */}
      <div className="sk" style={{ ...skBlock(28, 12), marginBottom: 10 }} />

      {/* cards */}
      {[1, 2, 3].map(i => (
        <div key={i} className="sk" style={{
          ...skBlock('100%', 64),
          marginBottom: 8, borderRadius: 12,
        }} />
      ))}

      {/* divider */}
      <div style={{ borderTop: '1px solid #E5E0DA', marginTop: 16, paddingTop: 4 }}>
        <div className="sk" style={{ ...skBlock(120, 12), margin: '10px 0' }} />
        {[1, 2].map(i => (
          <div key={i} className="sk" style={{
            ...skBlock('100%', 64), marginBottom: 8, borderRadius: 12,
          }} />
        ))}
      </div>
    </main>
  )
}
