import type { CSSProperties } from 'react'

const skBlock = (w: number | string, h: number): CSSProperties => ({
  width: w, height: h, borderRadius: 4,
  background: 'rgba(255,255,255,0.08)',
})

export default function Loading() {
  return (
    <main style={{
      maxWidth: 448, margin: '0 auto',
      padding: '16px 16px 48px',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      minHeight: '100dvh',
    }}>
      {/* header skeleton */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <div className="sk" style={skBlock(48, 16)} />
        <div className="sk" style={skBlock(72, 20)} />
      </div>

      {/* info card skeleton */}
      <div style={{
        background: '#111827', border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 12, padding: '4px 16px', marginBottom: 16,
      }}>
        {[56, 100, 80, 64].map((w, i) => (
          <div key={i} style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '12px 0', borderBottom: i < 3 ? '1px solid rgba(255,255,255,0.05)' : 'none',
          }}>
            <div className="sk" style={skBlock(52, 13)} />
            <div className="sk" style={skBlock(w, 15)} />
          </div>
        ))}
      </div>

      {/* section title skeleton */}
      <div className="sk" style={{ ...skBlock(28, 13), marginBottom: 8, marginLeft: 4 }} />

      {/* product card skeleton */}
      <div style={{
        background: '#111827', border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 12, padding: '4px 16px',
      }}>
        {[120, 80].map((w, i) => (
          <div key={i} style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '12px 0', borderBottom: i < 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
          }}>
            <div className="sk" style={{ ...skBlock(1, 15), flex: 1, marginRight: 16 }} />
            <div className="sk" style={skBlock(w, 15)} />
          </div>
        ))}
      </div>
    </main>
  )
}
