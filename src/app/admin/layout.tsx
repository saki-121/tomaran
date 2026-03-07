import type { ReactNode } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

const nav = [
  { href: '/admin',                   label: '納品一覧' },
  { href: '/admin/invoices',          label: '請求書' },
  { href: '/admin/masters/companies', label: '取引先' },
  { href: '/admin/masters/products',  label: '商品' },
  { href: '/admin/masters/own',       label: '自社設定' },
]

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let tenantName: string | null = null
  if (user) {
    const { data } = await supabase
      .from('user_tenants')
      .select('tenants(name)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    tenantName = (data?.tenants as { name?: string } | null)?.name ?? null
  }

  return (
    <div style={{ minHeight: '100vh', background: '#FDFCFB' }}>
      <nav style={{
        background: '#FDFCFB',
        borderBottom: '1px solid #E5E0DA',
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
        color: '#333333',
        display: 'flex',
        alignItems: 'center',
        gap: 0,
        padding: '0 16px',
        height: 52,
        position: 'sticky',
        top: 0,
        zIndex: 100,
        overflowX: 'auto',
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', marginRight: 24 }}>
          <Link href="/deliveries" style={{ fontWeight: 900, fontSize: 15, letterSpacing: 1, color: '#A16207', textDecoration: 'none', whiteSpace: 'nowrap', lineHeight: 1.2 }}>
            tomaran
          </Link>
          {tenantName && (
            <span style={{ fontSize: 11, color: '#888888', lineHeight: 1.2, whiteSpace: 'nowrap' }}>
              ログイン：{tenantName}
            </span>
          )}
        </div>
        {nav.map(({ href, label }) => (
          <Link key={href} href={href} style={{
            color: '#555555',
            textDecoration: 'none',
            padding: '0 14px',
            height: 48,
            display: 'flex',
            alignItems: 'center',
            fontSize: 14,
            fontWeight: 500,
            borderRight: '1px solid #E5E0DA',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}>
            {label}
          </Link>
        ))}
        <span style={{ marginLeft: 'auto' }} />
        <Link href="/deliveries" style={{
          color: '#16A34A',
          textDecoration: 'none',
          padding: '0 14px',
          height: 48,
          display: 'flex',
          alignItems: 'center',
          fontSize: 13,
          fontWeight: 600,
          borderLeft: '1px solid #E5E0DA',
          gap: 4,
          whiteSpace: 'nowrap',
        }}>
          📱 納品入力
        </Link>
        <Link href="/quotes" style={{
          color: '#16A34A',
          textDecoration: 'none',
          padding: '0 14px',
          height: 48,
          display: 'flex',
          alignItems: 'center',
          fontSize: 13,
          fontWeight: 600,
          borderLeft: '1px solid #E5E0DA',
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
          borderLeft: '1px solid #E5E0DA',
          cursor: 'pointer',
          whiteSpace: 'nowrap',
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
