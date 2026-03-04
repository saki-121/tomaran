'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function MobileNav() {
  const path = usePathname()

  const tabs = [
    { href: '/deliveries', label: '納品' },
    { href: '/quotes',     label: '見積書' },
  ]

  return (
    <nav style={{
      background: '#05080f',
      borderBottom: '1px solid rgba(255,215,0,0.12)',
      display: 'flex',
      alignItems: 'center',
      padding: '0 16px',
      height: 48,
      position: 'sticky',
      top: 0,
      zIndex: 100,
      fontFamily: 'system-ui, -apple-system, sans-serif',
    }}>
      <Link href="/deliveries" style={{
        fontWeight: 900, marginRight: 16, fontSize: 15,
        letterSpacing: 1, color: '#FFD700', textDecoration: 'none',
        whiteSpace: 'nowrap',
      }}>
        tomaran
      </Link>

      {tabs.map(tab => {
        const isActive = path === tab.href || path.startsWith(tab.href + '/')
        return (
          <Link key={tab.href} href={tab.href} style={{
            color: isActive ? '#FFD700' : '#9ca3af',
            textDecoration: 'none',
            padding: '0 12px',
            height: 48,
            display: 'flex',
            alignItems: 'center',
            fontSize: 14,
            fontWeight: isActive ? 700 : 500,
            borderBottom: isActive ? '2px solid #FFD700' : '2px solid transparent',
            whiteSpace: 'nowrap',
          }}>
            {tab.label}
          </Link>
        )
      })}

      <span style={{ marginLeft: 'auto' }} />

      <Link href="/admin" style={{
        color: '#9ca3af',
        textDecoration: 'none',
        padding: '0 12px',
        height: 48,
        display: 'flex',
        alignItems: 'center',
        fontSize: 13,
        fontWeight: 500,
        borderLeft: '1px solid rgba(255,255,255,0.06)',
        whiteSpace: 'nowrap',
      }}>
        管理画面
      </Link>
    </nav>
  )
}
