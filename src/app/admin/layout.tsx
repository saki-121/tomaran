import type { ReactNode } from 'react'
import Link from 'next/link'

const nav = [
  { href: '/admin',                   label: '納品一覧' },
  { href: '/admin/invoices',          label: '請求書' },
  { href: '/admin/masters/companies', label: '取引先' },
  { href: '/admin/masters/products',  label: '商品' },
  { href: '/admin/masters/own',       label: '自社設定' },
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
            color: '#ccc',
            textDecoration: 'none',
            padding: '0 14px',
            height: 48,
            display: 'flex',
            alignItems: 'center',
            fontSize: 14,
            borderRight: '1px solid #333',
          }}>
            {label}
          </Link>
        ))}
        <span style={{ marginLeft: 'auto', fontSize: 11, color: '#777', paddingRight: 4 }}>
          pc推奨
        </span>
      </nav>
      <main style={{ padding: 24, maxWidth: 1100, margin: '0 auto' }}>
        {children}
      </main>
    </div>
  )
}
