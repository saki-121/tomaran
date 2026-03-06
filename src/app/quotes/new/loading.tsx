import type { CSSProperties } from 'react'

const skBlock = (w: number | string, h: number): CSSProperties => ({
  width: w, height: h, borderRadius: 6,
  background: '#E5E0DA',
})

export default function Loading() {
  return (
    <main style={{
      maxWidth: 448, margin: '0 auto',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      minHeight: '100dvh',
    }}>
      {/* header bar skeleton */}
      <div style={{
        background: '#FDFCFB',
        borderBottom: '1px solid #E5E0DA',
        padding: '12px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        marginBottom: 16,
        height: 48,
      }}>
        <div className="sk" style={skBlock(48, 16)} />
        <div className="sk" style={{ ...skBlock(80, 18), margin: '0 auto' }} />
      </div>

      <div style={{ padding: '0 16px' }}>
        {/* recipient input skeleton */}
        <div className="sk" style={{ ...skBlock(40, 12), marginBottom: 6 }} />
        <div className="sk" style={{ ...skBlock('100%', 42), marginBottom: 20, borderRadius: 6 }} />

        {/* search skeleton */}
        <div className="sk" style={{ ...skBlock(56, 12), marginBottom: 6 }} />
        <div className="sk" style={{ ...skBlock('100%', 42), marginBottom: 12, borderRadius: 6 }} />

        {/* product list skeletons */}
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="sk" style={{
            ...skBlock('100%', 52), marginBottom: 4, borderRadius: 6,
          }} />
        ))}
      </div>
    </main>
  )
}
