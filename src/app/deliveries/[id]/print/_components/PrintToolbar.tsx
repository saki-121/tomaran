'use client'

import Link from 'next/link'

type Props = {
  backHref: string
}

export default function PrintToolbar({ backHref }: Props) {
  return (
    <>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { margin: 0; background: #fff; }
        }
      `}</style>
      <div
        className="no-print"
        style={{
          position: 'sticky',
          top: 0,
          background: '#111827',
          borderBottom: '1px solid rgba(255,215,0,0.12)',
          padding: '12px 16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          zIndex: 10,
        }}
      >
        <Link
          href={backHref}
          style={{
            padding: '10px 14px',
            fontSize: 15,
            background: 'none',
            color: '#FFD700',
            border: '1px solid rgba(255,215,0,0.3)',
            borderRadius: 8,
            cursor: 'pointer',
            minHeight: 44,
            textDecoration: 'none',
          }}
        >
          ← 戻る
        </Link>
        <button
          type="button"
          onClick={() => window.print()}
          style={{
            padding: '10px 18px',
            fontSize: 15,
            fontWeight: 700,
            background: '#FFD700',
            color: '#000',
            border: 'none',
            borderRadius: 8,
            cursor: 'pointer',
            minHeight: 44,
          }}
        >
          印刷 / PDF保存
        </button>
      </div>
    </>
  )
}
