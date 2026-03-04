import Link from 'next/link'

const BG = '#0a0f1e'
const CARD = '#111827'
const CARD2 = '#1a2035'
const Y = '#FFD700'

const rows: { label: string; value: React.ReactNode }[] = [
  { label: '販売業者', value: '請求があった場合は遅延なく開示いたします' },
  { label: '運営責任者', value: '請求があった場合は遅延なく開示いたします' },
  { label: '所在地', value: '請求があった場合は遅延なく開示いたします' },
  {
    label: '連絡先',
    value: (
      <>
        メール：<a href="mailto:support@tomaran.net" style={{ color: Y, textDecoration: 'underline' }}>support@tomaran.net</a>
        <br />電話：請求があった場合は遅延なく開示いたします
        <br /><span style={{ color: '#6b7280', fontSize: 13 }}>※ 日常のサポートはLINEで対応しています</span>
      </>
    ),
  },
  { label: 'サービス名', value: 'tomaran（とまらん）' },
  { label: '販売価格', value: '月額 14,800円（税込）' },
  {
    label: '支払い方法',
    value: (
      <>
        クレジットカード（Visa・Mastercard・American Express・JCB）<br />
        <span style={{ color: '#9ca3af', fontSize: 13 }}>決済代行：Stripe, Inc.</span>
      </>
    ),
  },
  {
    label: '支払い時期',
    value: (
      <>
        決済日に初回請求が発生します。以降は<strong>決済日の翌月同日</strong>に自動更新されます。<br />
        <span style={{ color: '#9ca3af', fontSize: 13 }}>
          例：3月5日に決済した場合、次回は4月5日に自動更新されます。
        </span>
      </>
    ),
  },
  { label: 'サービス提供時期', value: '決済完了後、即時利用可能。' },
  {
    label: '返金・キャンセルポリシー',
    value: (
      <>
        月額サブスクリプションのため、原則として決済済みの料金の返金は承っておりません。
        ただし、システム障害など当社側の事由による場合はこの限りではありません。
        <br /><br />
        解約後も当該月の末日までサービスをご利用いただけます。
      </>
    ),
  },
  {
    label: '解約方法',
    value: (
      <>
        ダッシュボード内の「アカウント設定」→「サブスクリプションを解約する」より
        いつでも解約可能です。<br />
        解約はお問い合わせ不要で即時反映されます。
        <br /><span style={{ color: '#9ca3af', fontSize: 13 }}>電話での解約手続きは受け付けておりません。</span>
      </>
    ),
  },
]

export default function LegalPage() {
  return (
    <div style={{ fontFamily: 'system-ui, -apple-system, sans-serif', background: BG, color: '#fff', minHeight: '100vh' }}>
      {/* Header */}
      <header style={{
        borderBottom: '1px solid rgba(255,215,0,0.15)',
        padding: '0 24px', height: 60,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <Link href="/" style={{ fontWeight: 900, fontSize: 20, color: Y, textDecoration: 'none' }}>
          tomaran
        </Link>
        <Link href="/" style={{ color: '#9ca3af', fontSize: 13, textDecoration: 'none' }}>
          ← トップへ
        </Link>
      </header>

      <div style={{ maxWidth: 720, margin: '0 auto', padding: '56px 24px 96px' }}>
        <p style={{
          display: 'inline-block',
          color: Y, fontSize: 11, fontWeight: 700, letterSpacing: '0.18em',
          border: `1px solid ${Y}`, borderRadius: 3, padding: '3px 12px', marginBottom: 24,
        }}>
          LEGAL
        </p>
        <h1 style={{ fontSize: 'clamp(22px, 5vw, 32px)', fontWeight: 900, marginBottom: 8, lineHeight: 1.25 }}>
          特定商取引法に基づく表記
        </h1>
        <p style={{ color: '#6b7280', fontSize: 13, marginBottom: 48, lineHeight: 1.7 }}>
          法律に基づき、販売条件を明記します。<br />
          シンプルに書きます。読んでください。
        </p>

        {/* Policy summary box */}
        <div style={{
          background: CARD2, borderLeft: `4px solid ${Y}`,
          borderRadius: 8, padding: '20px 24px', marginBottom: 40,
        }}>
          <p style={{ color: Y, fontWeight: 900, fontSize: 14, marginBottom: 8, marginTop: 0 }}>
            tomaranの基本スタンス
          </p>
          <p style={{ color: '#9ca3af', fontSize: 14, lineHeight: 1.75, margin: 0 }}>
            初期費用なし、縛りなし、解約はいつでも自分でできます。
            サポートは電話ではなくLINEで対応します。
            合わないと思ったらすぐ解約してください。引き止めません。
          </p>
        </div>

        {/* Table */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {rows.map(row => (
            <div key={row.label} style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(140px, 180px) 1fr',
              background: CARD, border: '1px solid rgba(255,255,255,0.05)',
              borderRadius: 8, overflow: 'hidden',
            }}>
              <div style={{
                background: CARD2, padding: '18px 20px',
                fontSize: 13, fontWeight: 700, color: '#9ca3af',
                display: 'flex', alignItems: 'flex-start',
              }}>
                {row.label}
              </div>
              <div style={{
                padding: '18px 20px', fontSize: 14,
                lineHeight: 1.75, color: '#d1d5db',
              }}>
                {row.value}
              </div>
            </div>
          ))}
        </div>

        <div style={{
          background: CARD2, border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 8, padding: '20px 24px', marginTop: 32,
        }}>
          <p style={{ color: '#6b7280', fontSize: 13, lineHeight: 1.75, margin: 0 }}>
            ※ 本表記は特定商取引法第11条に基づくものです。内容に疑義がある場合は
            <a href="mailto:support@tomaran.net" style={{ color: Y, textDecoration: 'underline', marginLeft: 4 }}>
              support@tomaran.net
            </a> までご連絡ください。
          </p>
        </div>
      </div>

      <footer style={{
        background: '#05080f', borderTop: '1px solid rgba(255,215,0,0.1)',
        padding: '32px 24px', textAlign: 'center',
      }}>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 24, marginBottom: 16, flexWrap: 'wrap' }}>
          <Link href="/privacy" style={{ color: '#6b7280', fontSize: 13, textDecoration: 'underline' }}>
            プライバシーポリシー
          </Link>
          <Link href="/" style={{ color: '#6b7280', fontSize: 13, textDecoration: 'underline' }}>
            トップへ戻る
          </Link>
        </div>
        <p style={{ color: '#374151', fontSize: 12, margin: 0 }}>© 2025 tomaran. All rights reserved.</p>
      </footer>
    </div>
  )
}
