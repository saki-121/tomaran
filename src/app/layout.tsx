import type { Metadata } from 'next'
import type { ReactNode } from 'react'

export const metadata: Metadata = {
  metadataBase: new URL('https://tomaran.net'),
  title: {
    default: 'tomaran（とまらん）| 中小工事資材屋の業務管理クラウド',
    template: '%s | tomaran',
  },
  description:
    '納品入力はスマホで、請求書・見積書はワンクリックで。中小の工事資材屋に特化した月額14,800円の業務管理SaaS。取引先・商品マスタのExcel一括インポートで即日導入できます。',
  keywords: [
    '工事資材', '資材屋', '納品管理', '請求書発行', '見積書', '業務効率化',
    '中小企業', 'SaaS', 'クラウド', 'tomaran', 'とまらん',
  ],
  authors: [{ name: 'tomaran' }],
  robots: { index: true, follow: true },
  openGraph: {
    type: 'website',
    locale: 'ja_JP',
    url: 'https://tomaran.net',
    siteName: 'tomaran',
    title: 'tomaran（とまらん）| 中小工事資材屋の業務管理クラウド',
    description:
      '納品入力はスマホで、請求書・見積書はワンクリックで。月額14,800円、縛りなし。',
  },
  twitter: {
    card: 'summary',
    title: 'tomaran（とまらん）| 中小工事資材屋の業務管理クラウド',
    description: '納品入力はスマホで、請求書・見積書はワンクリックで。月額14,800円、縛りなし。',
  },
  // Google 自動翻訳を無効化
  other: {
    google: 'notranslate',
  },
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    // lang="ja" + translate="no" でブラウザの自動翻訳をブロック
    <html lang="ja" translate="no">
      <head>
        {/* Chrome / Edge 向け翻訳ブロック（二重対策） */}
        <meta name="google" content="notranslate" />
      </head>
      <body className="notranslate" style={{ background: '#0a0f1e', margin: 0 }}>
        <style>{`
          a, button { transition: opacity 0.12s, transform 0.1s; }
          a:active, button:active { opacity: 0.6 !important; transform: scale(0.96) !important; }
        `}</style>
        {children}
      </body>
    </html>
  )
}
