import type { CSSProperties } from 'react'

// ---------------------------------------------------------------------------
// Skeleton — 詳細ページ遷移時に即表示（① 遷移即時フィードバック）
// ---------------------------------------------------------------------------

export default function Loading() {
  return (
    <main style={s.main}>

      {/* ヘッダー skeleton */}
      <div style={s.header}>
        <div style={{ ...s.sk, width: 48, height: 16 }} />
        <div style={{ ...s.sk, width: 72, height: 20 }} />
      </div>

      {/* 基本情報 skeleton */}
      <div style={s.card}>
        {([56, 100, 80, 64] as number[]).map((w, i) => (
          <div key={i} style={s.row}>
            <div style={{ ...s.sk, width: 52, height: 13 }} />
            <div style={{ ...s.sk, width: w,  height: 15 }} />
          </div>
        ))}
      </div>

      {/* セクションタイトル skeleton */}
      <div style={{ ...s.sk, width: 28, height: 13, marginBottom: 8, marginLeft: 4 }} />

      {/* 商品 skeleton */}
      <div style={s.card}>
        {([120, 80] as number[]).map((w, i) => (
          <div key={i} style={s.row}>
            <div style={{ ...s.sk, flex: 1, height: 15, marginRight: 16 }} />
            <div style={{ ...s.sk, width: w, height: 15 }} />
          </div>
        ))}
      </div>

    </main>
  )
}

const s: Record<string, CSSProperties> = {
  main: {
    maxWidth: 448,
    margin: '0 auto',
    padding: '16px 16px 48px',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    backgroundColor: '#f9fafb',
    minHeight: '100dvh',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  card: {
    background: '#fff',
    border: '1px solid #e5e7eb',
    borderRadius: 12,
    padding: '4px 16px',
    marginBottom: 16,
  },
  row: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 0',
    borderBottom: '1px solid #f3f4f6',
  },
  sk: {
    background: '#e5e7eb',
    borderRadius: 4,
  },
}
