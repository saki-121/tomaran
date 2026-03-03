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
    <div style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      <nav style={{
        background: '#1a1a2e',
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
        <span style={{ fontWeight: 700, marginRight: 24, fontSize: 15, letterSpacing: 1 }}>
          Admin
        </span>
        {nav.map(({ href, label }) => (
          <Link key={href} href={href} style={{
            color: '#fff',
            textDecoration: 'none',
            padding: '0 16px',
            height: 48,
            display: 'flex',
            alignItems: 'center',
            fontSize: 14,
            fontWeight: 500,
            borderRight: '1px solid #2d2d4e',
            cursor: 'pointer',
          }}>
            {label}
          </Link>
        ))}
        <span style={{ marginLeft: 'auto' }} />
        <Link href="/admin/cancel" style={{
          color: '#fff',
          textDecoration: 'none',
          padding: '0 16px',
          height: 48,
          display: 'flex',
          alignItems: 'center',
          fontSize: 13,
          fontWeight: 600,
          borderLeft: '1px solid #2d2d4e',
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
