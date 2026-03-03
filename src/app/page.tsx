import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

const Y = '#FFD700'   // construction yellow
const BG = '#0a0f1e'  // dark navy
const BG2 = '#0f1629' // slightly lighter navy
const CARD = '#111827'
const CARD2 = '#1a2035'

export default async function Page() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) redirect('/deliveries')

  return (
    <div style={{ fontFamily: 'system-ui, -apple-system, sans-serif', background: BG, color: '#fff', overflowX: 'hidden' }}>

      {/* ── HEADER ──────────────────────────────────────────────────────────── */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: 'rgba(10,15,30,0.95)', backdropFilter: 'blur(8px)',
        borderBottom: '1px solid rgba(255,215,0,0.15)',
        padding: '0 24px', height: 60,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <span style={{ fontWeight: 900, fontSize: 22, letterSpacing: '0.05em', color: Y }}>
          tomaran
        </span>
        <Link
          href="/login"
          style={{
            background: Y, color: '#000', fontWeight: 900, fontSize: 14,
            padding: '10px 20px', borderRadius: 6, textDecoration: 'none',
            whiteSpace: 'nowrap',
          }}
        >
          Googleで利用開始 →
        </Link>
      </header>

      {/* ── HERO ────────────────────────────────────────────────────────────── */}
      <section style={{ padding: '80px 24px 72px', textAlign: 'center', maxWidth: 840, margin: '0 auto' }}>
        <p style={{
          display: 'inline-block',
          color: Y, fontSize: 12, fontWeight: 700, letterSpacing: '0.18em',
          border: `1px solid ${Y}`, borderRadius: 4,
          padding: '4px 14px', marginBottom: 32,
        }}>
          業務改善SaaS for 中小工事資材屋
        </p>

        <h1 style={{
          fontSize: 'clamp(30px, 7vw, 56px)', fontWeight: 900,
          lineHeight: 1.2, marginBottom: 28, letterSpacing: '-0.01em',
        }}>
          現場も、営業も、事務も。<br />
          <span style={{ color: Y }}>もう、業務を止めない。</span>
        </h1>

        <p style={{ fontSize: 'clamp(15px, 2.5vw, 18px)', color: '#9ca3af', lineHeight: 1.8, maxWidth: 560, margin: '0 auto 48px' }}>
          スマホで納品を入力したら、事務はボタン一つでExcelに書き出せる。<br />
          確認の電話も、手書き伝票の解読も、もう要らない。
        </p>

        {/* Phone → Excel visual */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 20, marginBottom: 52, flexWrap: 'wrap' }}>
          <div style={{
            width: 130, height: 220,
            background: CARD2, border: `3px solid ${Y}`,
            borderRadius: 22, display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: 44, margin: 0 }}>📱</p>
              <p style={{ fontSize: 12, color: '#9ca3af', marginTop: 10, lineHeight: 1.5 }}>
                スマホで<br />納品入力
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <span style={{ fontSize: 28, color: Y, fontWeight: 900 }}>→</span>
            <span style={{ fontSize: 11, color: '#6b7280', letterSpacing: '0.1em' }}>即時反映</span>
          </div>
          <div style={{
            width: 130, height: 220,
            background: CARD2, border: '3px solid #34d399',
            borderRadius: 22, display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: 44, margin: 0 }}>📊</p>
              <p style={{ fontSize: 12, color: '#9ca3af', marginTop: 10, lineHeight: 1.5 }}>
                Excel請求書<br />自動生成
              </p>
            </div>
          </div>
        </div>

        <Link
          href="/login"
          style={{
            display: 'inline-block',
            background: Y, color: '#000',
            padding: '18px 44px', borderRadius: 8,
            fontWeight: 900, fontSize: 18, textDecoration: 'none',
            boxShadow: '0 0 32px rgba(255,215,0,0.25)',
          }}
        >
          Googleで利用開始 →
        </Link>
        <p style={{ marginTop: 16, fontSize: 13, color: '#6b7280' }}>
          月額 14,800円（税込）｜縛りなし｜今日から使える
        </p>
      </section>

      {/* ── PROBLEM ─────────────────────────────────────────────────────────── */}
      <section style={{ background: BG2, padding: '80px 24px' }}>
        <div style={{ maxWidth: 920, margin: '0 auto' }}>
          <p style={{ color: '#ef4444', fontWeight: 700, letterSpacing: '0.18em', fontSize: 12, marginBottom: 16 }}>
            ⛔ STOP
          </p>
          <h2 style={{ fontSize: 'clamp(24px, 5vw, 42px)', fontWeight: 900, marginBottom: 16, lineHeight: 1.25 }}>
            その「待ち」が、<br />会社の時間を食っている。
          </h2>
          <p style={{ color: '#6b7280', marginBottom: 52, fontSize: 15 }}>
            毎日起きている「小さなSTOP」が、月に換算すると何時間になるか、数えたことがあるか。
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20 }}>
            {[
              {
                icon: '📞',
                title: '現場からの確認電話',
                body: '「あの単価いくら？」「この商品、マスタにある？」—— 現場が止まり、事務も止まる。毎日来る。',
              },
              {
                icon: '🚗',
                title: '営業の帰社待ち',
                body: '伝票は現場に置いてきた。データはない。事務は営業が戻るまで処理できない。夕方まで待つ。',
              },
              {
                icon: '📝',
                title: '読めない手書きメモ',
                body: '丸まった紙切れ、消えかけた数字。事務が解読に使う30分は、業務ではなく謎解きだ。',
              },
            ].map(item => (
              <div key={item.title} style={{
                background: CARD2,
                border: '1px solid rgba(239,68,68,0.4)',
                borderRadius: 12, padding: 28,
              }}>
                <p style={{ fontSize: 40, marginBottom: 14, marginTop: 0 }}>{item.icon}</p>
                <h3 style={{ fontWeight: 700, marginBottom: 10, fontSize: 18, marginTop: 0 }}>{item.title}</h3>
                <p style={{ color: '#9ca3af', fontSize: 15, lineHeight: 1.75, margin: 0 }}>{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SOLUTION ────────────────────────────────────────────────────────── */}
      <section style={{ padding: '80px 24px' }}>
        <div style={{ maxWidth: 920, margin: '0 auto' }}>
          <p style={{ color: Y, fontWeight: 700, letterSpacing: '0.18em', fontSize: 12, marginBottom: 16 }}>
            ✓ SOLUTION
          </p>
          <h2 style={{ fontSize: 'clamp(24px, 5vw, 42px)', fontWeight: 900, marginBottom: 16, lineHeight: 1.25 }}>
            全員が、自分の仕事に<br />集中できる環境をつくる。
          </h2>
          <p style={{ color: '#6b7280', marginBottom: 52, fontSize: 15 }}>
            役割ごとに最適化。スマホ一台で全部つながる。
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20 }}>
            {[
              {
                role: '現場',
                emoji: '🏗️',
                color: Y,
                desc: '商品を選んで、数量を入れる。単価は要らない。マスタになければ仮登録。それだけ。',
                items: ['マスタから商品を選ぶだけ', '単価入力は不要', '仮登録で現場を止めない', 'スマホで60秒以内に完了'],
              },
              {
                role: '営業',
                emoji: '📱',
                color: '#60a5fa',
                desc: 'スマホで見積書が作れる。単価は事務が管理するから、触らなくていい。',
                items: ['スマホで即見積書作成', '単価は事務が管理（触らせない）', '移動中でも完結', '印刷・PDF保存まで一気に'],
              },
              {
                role: '事務',
                emoji: '🖥️',
                color: '#34d399',
                desc: '全部揃ったらボタンを押す。Excelが出てくる。確認の電話は来ない。',
                items: ['ボタン一つでExcel出力', '電話が鳴らないオフィス', '取引先のExcel一括登録', '請求漏れがなくなる'],
              },
            ].map(item => (
              <div key={item.role} style={{
                background: CARD,
                border: `1px solid ${item.color}33`,
                borderTop: `3px solid ${item.color}`,
                borderRadius: 12, padding: 28,
              }}>
                <p style={{ fontSize: 40, marginBottom: 14, marginTop: 0 }}>{item.emoji}</p>
                <h3 style={{ color: item.color, fontWeight: 900, fontSize: 22, marginBottom: 10, marginTop: 0 }}>
                  {item.role}
                </h3>
                <p style={{ color: '#9ca3af', fontSize: 14, lineHeight: 1.7, marginBottom: 20 }}>{item.desc}</p>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {item.items.map(i => (
                    <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 14, color: '#d1d5db' }}>
                      <span style={{ color: item.color, flexShrink: 0, fontWeight: 700 }}>▸</span>
                      {i}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── YOUTUBE ─────────────────────────────────────────────────────────── */}
      <section style={{ background: BG2, padding: '80px 24px' }}>
        <div style={{ maxWidth: 920, margin: '0 auto' }}>
          <p style={{ color: Y, fontWeight: 700, letterSpacing: '0.18em', fontSize: 12, marginBottom: 16 }}>
            📹 HOW TO
          </p>
          <h2 style={{ fontSize: 'clamp(24px, 5vw, 42px)', fontWeight: 900, marginBottom: 16, lineHeight: 1.25 }}>
            マニュアルPDFは<br />廃止しました。
          </h2>
          <p style={{ color: '#9ca3af', fontSize: 15, marginBottom: 52, lineHeight: 1.8, maxWidth: 560 }}>
            全部YouTubeショート（30秒以内）で見てください。<br />
            読む時間も、説明を聞く時間も、無駄です。
          </p>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 200px))',
            gap: 20, justifyContent: 'center',
          }}>
            {[
              { title: '納品入力の基本', dur: '0:28', no: '01' },
              { title: '請求書をExcelで出力する', dur: '0:35', no: '02' },
              { title: '商品マスタを登録する', dur: '0:22', no: '03' },
            ].map(v => (
              <a
                key={v.title}
                href="https://youtube.com/@tomaran"
                target="_blank"
                rel="noopener noreferrer"
                style={{ textDecoration: 'none', color: '#fff' }}
              >
                <div style={{ background: CARD2, borderRadius: 12, overflow: 'hidden' }}>
                  <div style={{
                    aspectRatio: '9/16', background: BG,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    position: 'relative',
                  }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{
                        width: 56, height: 56, background: '#ff0000',
                        borderRadius: '50%', display: 'flex', alignItems: 'center',
                        justifyContent: 'center', margin: '0 auto 12px', fontSize: 22,
                      }}>
                        ▶
                      </div>
                      <p style={{ fontSize: 11, color: '#6b7280', margin: 0 }}>YouTube</p>
                    </div>
                    <div style={{
                      position: 'absolute', top: 10, left: 10,
                      background: Y, color: '#000', fontSize: 10,
                      fontWeight: 900, padding: '2px 8px', borderRadius: 3,
                    }}>
                      #{v.no}
                    </div>
                    <div style={{
                      position: 'absolute', bottom: 10, right: 10,
                      background: 'rgba(0,0,0,0.8)', fontSize: 11,
                      padding: '2px 6px', borderRadius: 3,
                    }}>
                      {v.dur}
                    </div>
                  </div>
                  <div style={{ padding: '12px 14px' }}>
                    <p style={{ fontWeight: 700, fontSize: 13, margin: 0, lineHeight: 1.4 }}>{v.title}</p>
                  </div>
                </div>
              </a>
            ))}
          </div>

          <p style={{ textAlign: 'center', marginTop: 36 }}>
            <a
              href="https://youtube.com/@tomaran"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: Y, fontWeight: 700, textDecoration: 'none', fontSize: 15 }}
            >
              YouTubeチャンネルをすべて見る →
            </a>
          </p>
        </div>
      </section>

      {/* ── ANTI-POLICY ─────────────────────────────────────────────────────── */}
      <section style={{ padding: '80px 24px', background: BG }}>
        <div style={{ maxWidth: 760, margin: '0 auto', textAlign: 'center' }}>
          <p style={{ color: '#6b7280', fontWeight: 700, letterSpacing: '0.18em', fontSize: 12, marginBottom: 16 }}>
            ✕ ANTI-POLICY
          </p>
          <h2 style={{ fontSize: 'clamp(24px, 5vw, 42px)', fontWeight: 900, marginBottom: 48, lineHeight: 1.25 }}>
            あえて、やらないこと。
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 56, textAlign: 'left' }}>
            {[
              { label: '電話サポート', reason: 'お互いの時間をリアルタイムで止めるから。' },
              { label: '個別カスタマイズ', reason: '1社のためにつくると、全員のサービスが遅くなるから。' },
              { label: '導入支援・オンボーディング費用', reason: '30秒の動画で全部わかるように設計したから。' },
              { label: '対面・オンライン説明会', reason: '「会いましょう」と言い始めたら、本質から逃げてる。' },
            ].map(item => (
              <div key={item.label} style={{
                background: CARD2,
                border: '1px solid rgba(255,255,255,0.06)',
                borderLeft: '3px solid #ef4444',
                borderRadius: 8, padding: '18px 24px',
                display: 'flex', flexDirection: 'column', gap: 4,
              }}>
                <span style={{ fontWeight: 900, fontSize: 16 }}>✕ &nbsp;{item.label}</span>
                <span style={{ color: '#6b7280', fontSize: 14 }}>{item.reason}</span>
              </div>
            ))}
          </div>

          <div style={{
            background: CARD2,
            border: `1px solid ${Y}44`,
            borderLeft: `4px solid ${Y}`,
            borderRadius: 8, padding: '32px 36px',
            textAlign: 'left',
          }}>
            <p style={{ fontWeight: 900, fontSize: 20, marginBottom: 16, marginTop: 0, color: Y }}>
              LINEで解決。
            </p>
            <p style={{ color: '#d1d5db', fontSize: 16, lineHeight: 1.9, margin: 0 }}>
              質問はLINEに送ってください。<br />
              動画で答えます。それで95%解決します。<br />
              <br />
              <span style={{ color: '#9ca3af', fontSize: 14 }}>
                お互いの時間を止めるのはやめましょう。
              </span>
            </p>
          </div>
        </div>
      </section>

      {/* ── PRICING ─────────────────────────────────────────────────────────── */}
      <section style={{ background: BG2, padding: '80px 24px' }}>
        <div style={{ maxWidth: 560, margin: '0 auto', textAlign: 'center' }}>
          <p style={{ color: Y, fontWeight: 700, letterSpacing: '0.18em', fontSize: 12, marginBottom: 16 }}>
            💴 PRICING
          </p>
          <h2 style={{ fontSize: 'clamp(24px, 5vw, 40px)', fontWeight: 900, marginBottom: 48 }}>
            シンプルに、一択。
          </h2>

          <div style={{
            background: CARD, border: `2px solid ${Y}`,
            borderRadius: 16, padding: '48px 40px',
          }}>
            <p style={{ color: '#9ca3af', fontSize: 14, marginBottom: 8, marginTop: 0 }}>月額料金（税込）</p>
            <p style={{ fontSize: 'clamp(48px, 10vw, 72px)', fontWeight: 900, color: Y, margin: '0 0 4px', lineHeight: 1 }}>
              ¥14,800
            </p>
            <p style={{ color: '#6b7280', fontSize: 15, marginBottom: 36 }}>/ 月</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 40, textAlign: 'left' }}>
              {[
                '縛りなし —— いつでも解約OK',
                '初期費用なし',
                '人数制限なし（テナント内のチーム利用）',
                'アップデートは自動で反映',
              ].map(f => (
                <div key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 15, color: '#d1d5db' }}>
                  <span style={{ color: '#34d399', fontWeight: 900, flexShrink: 0 }}>✓</span>
                  {f}
                </div>
              ))}
            </div>

            <div style={{
              background: BG2, borderRadius: 8,
              padding: '16px 20px', marginBottom: 36, textAlign: 'left',
            }}>
              <p style={{ color: Y, fontWeight: 700, fontSize: 13, marginBottom: 6, marginTop: 0 }}>
                無料期間がない理由
              </p>
              <p style={{ color: '#9ca3af', fontSize: 14, lineHeight: 1.7, margin: 0 }}>
                使い方動画を全部公開しています。迷うなら先に全部見てきてください。
                それで判断できます。自信があるから、無料期間は設けていません。
              </p>
            </div>

            <Link
              href="/login"
              style={{
                display: 'block',
                background: Y, color: '#000',
                padding: '18px', borderRadius: 8,
                fontWeight: 900, fontSize: 18, textDecoration: 'none',
                textAlign: 'center',
              }}
            >
              Googleで利用開始 →
            </Link>
          </div>
        </div>
      </section>

      {/* ── ONBOARDING ──────────────────────────────────────────────────────── */}
      <section style={{ padding: '80px 24px' }}>
        <div style={{ maxWidth: 760, margin: '0 auto' }}>
          <p style={{ color: Y, fontWeight: 700, letterSpacing: '0.18em', fontSize: 12, marginBottom: 16, textAlign: 'center' }}>
            🚀 ONBOARDING
          </p>
          <h2 style={{ fontSize: 'clamp(24px, 5vw, 40px)', fontWeight: 900, marginBottom: 16, lineHeight: 1.25, textAlign: 'center' }}>
            今日から使える。<br />設定は3ステップ。
          </h2>
          <p style={{ color: '#6b7280', fontSize: 15, marginBottom: 52, textAlign: 'center' }}>
            電話も、書類も、来社も要りません。
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {[
              { n: '01', icon: '🔑', title: 'Googleアカウントで登録', body: 'パスワード不要。持っているGoogleアカウントで即登録。30秒で完了。' },
              { n: '02', icon: '🏢', title: 'あなたの会社名を登録', body: '会社名を入力するだけ。取引先・商品マスタはあとからExcelで一括登録できます。' },
              { n: '03', icon: '💳', title: '決済して、即開始！', body: 'クレジットカードを登録したら全機能が使えます。Stripeで安全に処理。' },
            ].map((step, idx) => (
              <div key={step.n} style={{ display: 'flex', gap: 0, alignItems: 'stretch' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 48, flexShrink: 0 }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: '50%',
                    background: Y, color: '#000',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 900, fontSize: 14, flexShrink: 0,
                  }}>
                    {step.n}
                  </div>
                  {idx < 2 && <div style={{ width: 2, flex: 1, background: `${Y}33`, margin: '4px 0' }} />}
                </div>
                <div style={{
                  background: CARD2, borderRadius: 10, padding: '20px 24px',
                  marginLeft: 16, marginBottom: idx < 2 ? 8 : 0, flex: 1,
                }}>
                  <p style={{ fontSize: 28, marginBottom: 8, marginTop: 0 }}>{step.icon}</p>
                  <h3 style={{ fontWeight: 900, fontSize: 17, marginBottom: 6, marginTop: 0 }}>{step.title}</h3>
                  <p style={{ color: '#9ca3af', fontSize: 14, lineHeight: 1.7, margin: 0 }}>{step.body}</p>
                </div>
              </div>
            ))}
          </div>

          <div style={{ textAlign: 'center', marginTop: 56 }}>
            <Link
              href="/login"
              style={{
                display: 'inline-block',
                background: Y, color: '#000',
                padding: '18px 48px', borderRadius: 8,
                fontWeight: 900, fontSize: 18, textDecoration: 'none',
                boxShadow: '0 0 32px rgba(255,215,0,0.2)',
              }}
            >
              Googleで利用開始 →
            </Link>
            <p style={{ marginTop: 14, fontSize: 13, color: '#6b7280' }}>
              月額 14,800円（税込）｜縛りなし
            </p>
          </div>
        </div>
      </section>

      {/* ── FOOTER ──────────────────────────────────────────────────────────── */}
      <footer style={{
        background: '#05080f',
        borderTop: '1px solid rgba(255,215,0,0.1)',
        padding: '48px 24px',
        textAlign: 'center',
      }}>
        <p style={{ fontWeight: 900, fontSize: 20, color: Y, marginBottom: 24, marginTop: 0 }}>tomaran</p>
        <p style={{ color: '#6b7280', fontSize: 13, marginBottom: 24, lineHeight: 1.9 }}>
          サポートはLINEから。<br />
          <span style={{ color: '#9ca3af' }}>
            メールは返信が遅れる可能性があることをご了承ください。
          </span><br />
          <a href="mailto:support@tomaran.net" style={{ color: '#9ca3af', textDecoration: 'underline' }}>
            support@tomaran.net
          </a>
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 24, marginBottom: 24, flexWrap: 'wrap' }}>
          <Link href="/legal" style={{ color: '#6b7280', fontSize: 13, textDecoration: 'underline' }}>
            特定商取引法に基づく表記
          </Link>
          <Link href="/privacy" style={{ color: '#6b7280', fontSize: 13, textDecoration: 'underline' }}>
            プライバシーポリシー
          </Link>
        </div>
        <p style={{ color: '#374151', fontSize: 12, margin: 0 }}>
          © 2025 tomaran. All rights reserved.
        </p>
      </footer>
    </div>
  )
}
