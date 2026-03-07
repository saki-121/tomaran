'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function MobileNav({ tenantName }: { tenantName?: string | null }) {
  const path = usePathname()

  const tabs = [
    { href: '/deliveries', label: '納品' },
    { href: '/quotes',     label: '見積書' },
  ]

  return (
    <nav className="no-print" style={{
      background: '#FDFCFB',
      borderBottom: '1px solid #E5E0DA',
      boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
      display: 'flex',
      alignItems: 'center',
      padding: '0 16px',
      height: 52,
      position: 'sticky',
      top: 0,
      zIndex: 100,
      fontFamily: 'system-ui, -apple-system, sans-serif',
    }}>
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', marginRight: 16 }}>
        <Link href="/deliveries" style={{
          fontWeight: 900, fontSize: 15,
          letterSpacing: 1, color: '#A16207', textDecoration: 'none',
          whiteSpace: 'nowrap', lineHeight: 1.2,
        }}>
          tomaran
        </Link>
        {tenantName && (
          <span style={{ fontSize: 11, color: '#888888', lineHeight: 1.2, whiteSpace: 'nowrap' }}>
            ログイン：{tenantName}
          </span>
        )}
      </div>

      {tabs.map(tab => {
        const isActive = path === tab.href || path.startsWith(tab.href + '/')
        return (
          <Link key={tab.href} href={tab.href} style={{
            color: isActive ? '#A16207' : '#888888',
            textDecoration: 'none',
            padding: '0 12px',
            height: 48,
            display: 'flex',
            alignItems: 'center',
            fontSize: 14,
            fontWeight: isActive ? 700 : 500,
            borderBottom: isActive ? '2px solid #A16207' : '2px solid transparent',
            whiteSpace: 'nowrap',
          }}>
            {tab.label}
          </Link>
        )
      })}

      <span style={{ marginLeft: 'auto' }} />

      <Link href="/admin" aria-label="管理画面" style={{
        color: '#888888',
        textDecoration: 'none',
        padding: '0 8px',
        height: 48,
        display: 'flex',
        alignItems: 'center',
        fontSize: 14,
        borderLeft: '1px solid #E5E0DA',
      }}>
        ⚙️
      </Link>
    </nav>
  )
}
