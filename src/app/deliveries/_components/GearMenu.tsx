'use client'

import { useRef, useState, useEffect } from 'react'
import Link from 'next/link'

export default function GearMenu() {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(prev => !prev)}
        style={{
          fontSize: 22,
          minWidth: 44,
          minHeight: 44,
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: '#FFD700',
          lineHeight: 1,
          padding: '4px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        aria-label="メニュー"
      >
        ⚙️
      </button>

      {open && (
        <div
          style={{
            position: 'absolute',
            right: 0,
            top: '100%',
            background: '#FFFFFF',
            border: '1px solid #E5E0DA',
            borderRadius: 8,
            boxShadow: '4px 4px 0 #E5E0DA',
            zIndex: 100,
            minWidth: 180,
            overflow: 'hidden',
          }}
        >
          <Link
            href="/quotes/new"
            onClick={() => setOpen(false)}
            style={menuItemStyle}
          >
            📋 見積書作成
          </Link>
          <Link
            href="/quotes"
            onClick={() => setOpen(false)}
            style={menuItemStyle}
          >
            📋 見積書一覧
          </Link>
          <Link
            href="/admin"
            onClick={() => setOpen(false)}
            style={menuItemStyle}
          >
            ⚙️ 管理画面
          </Link>
        </div>
      )}
    </div>
  )
}

const menuItemStyle: React.CSSProperties = {
  display: 'block',
  padding: '14px 18px',
  fontSize: 15,
  minHeight: 44,
  color: '#555555',
  textDecoration: 'none',
  whiteSpace: 'nowrap',
  borderBottom: '1px solid #F0EDE8',
}
