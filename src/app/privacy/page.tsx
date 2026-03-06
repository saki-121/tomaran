import Link from 'next/link'

const BG = '#FDFCFB'
const CARD = '#FFFFFF'
const CARD2 = '#F5F0EB'
const Y = '#A16207'

export default function PrivacyPage() {
  return (
    <div style={{ fontFamily: 'system-ui, -apple-system, sans-serif', background: BG, color: '#333333', minHeight: '100vh' }}>
      {/* Header */}
      <header style={{
        borderBottom: '1px solid #E5E0DA',
        padding: '0 24px', height: 60,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <Link href="/" style={{ fontWeight: 900, fontSize: 20, color: Y, textDecoration: 'none' }}>
          tomaran
        </Link>
        <Link href="/" style={{ color: '#777777', fontSize: 13, textDecoration: 'none' }}>
          ← トップへ
        </Link>
      </header>

      <div style={{ maxWidth: 720, margin: '0 auto', padding: '56px 24px 96px' }}>
        <p style={{
          display: 'inline-block',
          color: Y, fontSize: 11, fontWeight: 700, letterSpacing: '0.18em',
          border: `1px solid ${Y}`, borderRadius: 3, padding: '3px 12px', marginBottom: 24,
        }}>
          PRIVACY POLICY
        </p>
        <h1 style={{ fontSize: 'clamp(24px, 5vw, 36px)', fontWeight: 900, marginBottom: 8, lineHeight: 1.2 }}>
          プライバシーポリシー
        </h1>
        <p style={{ color: '#888888', fontSize: 13, marginBottom: 56 }}>最終更新日：2025年1月1日</p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>

          {/* Intro */}
          <div style={{ background: CARD2, borderLeft: `3px solid ${Y}`, borderRadius: 8, padding: '24px 28px', marginBottom: 32 }}>
            <p style={{ color: '#d1d5db', fontSize: 15, lineHeight: 1.85, margin: 0 }}>
              tomaran（以下「当サービス」）は、ユーザーのプライバシーを尊重します。
              このページでは、何を取得して、何のために使って、どこに保管するかを率直に説明します。
              読んで判断してください。
            </p>
          </div>

          {[
            {
              n: '01',
              title: '収集する情報',
              body: (
                <>
                  <p style={{ marginBottom: 12 }}>
                    当サービスはGoogleアカウントによるログイン（OAuth 2.0）のみに対応しています。ログイン時に取得するのは以下の3点だけです。
                  </p>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {[
                      'Googleアカウントのメールアドレス',
                      'Googleアカウントの表示名',
                      'プロフィール画像URL（使用する場合）',
                    ].map(i => (
                      <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, color: '#d1d5db', fontSize: 15 }}>
                        <span style={{ color: Y, flexShrink: 0, fontWeight: 700 }}>▸</span>{i}
                      </li>
                    ))}
                  </ul>
                  <p style={{ marginTop: 12, color: '#777777', fontSize: 14 }}>
                    パスワードは当サービスでは一切保存・管理しません。
                  </p>
                </>
              ),
            },
            {
              n: '02',
              title: '個人情報の利用目的',
              body: (
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {[
                    'サービスへのログイン認証・ユーザー識別',
                    'サービスに関する重要なお知らせの送信',
                    'LINEサポート対応',
                    '利用状況の集計・サービス改善（個人を特定しない形で実施）',
                  ].map(i => (
                    <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, color: '#d1d5db', fontSize: 15 }}>
                      <span style={{ color: Y, flexShrink: 0, fontWeight: 700 }}>▸</span>{i}
                    </li>
                  ))}
                </ul>
              ),
            },
            {
              n: '03',
              title: '第三者への提供',
              body: (
                <>
                  <p style={{ color: '#d1d5db', fontSize: 15, lineHeight: 1.75, marginBottom: 16 }}>
                    法令に基づく場合を除き、取得した個人情報を第三者に提供・販売・貸与することはありません。
                  </p>
                  <p style={{ color: '#777777', fontSize: 14, marginBottom: 12 }}>
                    当サービスは以下の外部サービスを利用しており、それぞれのポリシーに従い処理されます。
                  </p>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {[
                      'Supabase —— 認証・データベース',
                      'Stripe, Inc. —— 決済処理',
                      'Google LLC —— OAuth認証',
                    ].map(i => (
                      <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, color: '#d1d5db', fontSize: 15 }}>
                        <span style={{ color: '#888888', flexShrink: 0 }}>—</span>{i}
                      </li>
                    ))}
                  </ul>
                </>
              ),
            },
            {
              n: '04',
              title: '情報の保管',
              body: (
                <p style={{ color: '#d1d5db', fontSize: 15, lineHeight: 1.75, margin: 0 }}>
                  取得した情報はSupabaseが管理するデータベース（AWS東京リージョン）に保存されます。
                  アクセス制御・TLS暗号化通信により安全に管理しています。
                </p>
              ),
            },
            {
              n: '05',
              title: '情報の削除',
              body: (
                <p style={{ color: '#d1d5db', fontSize: 15, lineHeight: 1.75, margin: 0 }}>
                  アカウントの削除を希望する場合は、下記メールアドレスへご連絡ください。
                  合理的な期間内にアカウントおよび関連データを削除します。
                </p>
              ),
            },
            {
              n: '06',
              title: 'Cookieの利用',
              body: (
                <p style={{ color: '#d1d5db', fontSize: 15, lineHeight: 1.75, margin: 0 }}>
                  当サービスはログインセッションの維持のためにCookieを使用します。
                  ブラウザでCookieを無効にした場合、ログイン機能が正常に動作しない場合があります。
                  トラッキング目的のCookieは使用しません。
                </p>
              ),
            },
            {
              n: '07',
              title: 'お問い合わせ',
              body: (
                <p style={{ color: '#d1d5db', fontSize: 15, lineHeight: 1.75, margin: 0 }}>
                  個人情報の取り扱いに関するお問い合わせは以下へ。<br />
                  <br />
                  tomaran<br />
                  <a href="mailto:support@tomaran.net" style={{ color: Y, textDecoration: 'underline' }}>
                    support@tomaran.net
                  </a>
                </p>
              ),
            },
          ].map(sec => (
            <div key={sec.n} style={{ background: CARD, border: '1px solid #E5E0DA', borderRadius: 10, padding: '28px 28px', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
                <span style={{
                  background: Y, color: '#000', fontWeight: 900, fontSize: 11,
                  padding: '3px 10px', borderRadius: 3, flexShrink: 0,
                }}>
                  {sec.n}
                </span>
                <h2 style={{ fontWeight: 900, fontSize: 18, margin: 0 }}>{sec.title}</h2>
              </div>
              {sec.body}
            </div>
          ))}
        </div>
      </div>

      <footer style={{
        background: '#F5F0EB', borderTop: '1px solid #E5E0DA',
        padding: '32px 24px', textAlign: 'center',
      }}>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 24, marginBottom: 16, flexWrap: 'wrap' }}>
          <Link href="/legal" style={{ color: '#888888', fontSize: 13, textDecoration: 'underline' }}>
            特定商取引法に基づく表記
          </Link>
          <Link href="/" style={{ color: '#888888', fontSize: 13, textDecoration: 'underline' }}>
            トップへ戻る
          </Link>
        </div>
        <p style={{ color: '#374151', fontSize: 12, margin: 0 }}>© 2025 tomaran. All rights reserved.</p>
      </footer>
    </div>
  )
}
