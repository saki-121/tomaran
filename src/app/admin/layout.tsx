import type { ReactNode } from 'react'
import Link from 'next/link'

const nav = [
  { href: '/admin',                   label: '納品一覧' },
  { href: '/admin/invoices',          label: '請求書' },
  { href: '/admin/masters/companies', label: '取引先' },
  { href: '/admin/masters/products', label: '商品' },
  { href: '/admin/masters/own',      label: '自社設定' },
]

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div style={{ minHeight: '100vh', background: '#0a0f1e' }}>
      <nav style={{
        background: '#05080f',
        borderBottom: '1px solid rgba(255,215,0,0.12)',
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        gap: 0,
        padding: '0 16px',
        height: 48,
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}>
        <Link href="/deliveries" style={{ fontWeight: 900, marginRight: 24, fontSize: 15, letterSpacing: 1, color: '#FFD700', textDecoration: 'none' }}>
          tomaran
        </Link>
        {nav.map(({ href, label }) => (
          <Link key={href} href={href} style={{
            color: '#9ca3af',
            textDecoration: 'none',
            padding: '0 14px',
            height: 48,
            display: 'flex',
            alignItems: 'center',
            fontSize: 14,
            fontWeight: 500,
            borderRight: '1px solid rgba(255,255,255,0.06)',
            cursor: 'pointer',
          }}>
            {label}
          </Link>
        ))}
        <span style={{ marginLeft: 'auto' }} />
        {/* スマホ画面リンク */}
        <Link href="/deliveries" style={{
          color: '#34d399',
          textDecoration: 'none',
          padding: '0 14px',
          height: 48,
          display: 'flex',
          alignItems: 'center',
          fontSize: 13,
          fontWeight: 600,
          borderLeft: '1px solid rgba(255,255,255,0.06)',
          gap: 4,
          whiteSpace: 'nowrap',
        }}>
          📱 納品入力
        </Link>
        <Link href="/quotes" style={{
          color: '#34d399',
          textDecoration: 'none',
          padding: '0 14px',
          height: 48,
          display: 'flex',
          alignItems: 'center',
          fontSize: 13,
          fontWeight: 600,
          borderLeft: '1px solid rgba(255,255,255,0.06)',
          gap: 4,
          whiteSpace: 'nowrap',
        }}>
          📄 見積書
        </Link>
        <Link href="/admin/cancel" style={{
          color: '#ef4444',
          textDecoration: 'none',
          padding: '0 16px',
          height: 48,
          display: 'flex',
          alignItems: 'center',
          fontSize: 13,
          fontWeight: 600,
          borderLeft: '1px solid rgba(255,255,255,0.06)',
          cursor: 'pointer',
        }}>
          解約
        </Link>
      </nav>
      <main style={{ padding: 24, maxWidth: 1100, margin: '0 auto' }}>
        {children}
      </main>
    </div>
  )
}
