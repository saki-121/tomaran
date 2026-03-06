import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'tomaran（とまらん）| 資材屋の仕事のStopを消す道具',
  description:
    '手書き伝票も、月末バタバタも、事務の解読作業も。資材屋に起きる「仕事のStop」をスマホひとつで消す道具。月額14,800円、縛りなし。',
  alternates: {
    canonical: 'https://tomaran.net',
  },
  openGraph: {
    url: 'https://tomaran.net',
    title: 'tomaran（とまらん）| 資材屋の仕事のStopを消す道具',
    description:
      '手書き伝票も、月末バタバタも、事務の解読作業も。資材屋に起きる「仕事のStop」をスマホひとつで消す道具。',
  },
}

// ─────────────────────────────────────────────────────────────────────────────
// Design tokens — 暖かみのある紙テーマ
// ─────────────────────────────────────────────────────────────────────────────

const Y      = '#FFD700'   // brand yellow（CTAボタン背景のみ）
const AMBER  = '#A16207'   // dark amber（テキストアクセント）
const GREEN  = '#166534'   // trust green（動画CTAボタン）
const BG     = '#FDFCFB'   // 温かみのある紙
const BG2    = '#F5F0EB'   // 少し濃いベージュ
const CARD   = '#FFFFFF'   // 白カード
const TEXT   = '#333333'   // スミブラック
const TEXT2  = '#555555'   // セカンダリテキスト
const TEXT3  = '#777777'   // 補足テキスト

const YT_URL = 'https://youtube.com/@tomaran.net3?si=Ea5PJWp72erIRKHI'
const MAX_W  = 480
const PX     = '20px'

// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────

export default async function Page() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) redirect('/deliveries')

  return (
    <div style={{ fontFamily: 'system-ui, -apple-system, sans-serif', background: BG, color: TEXT, overflowX: 'hidden' }}>

      {/* ══════════════════════════════════════════════════════════
          HEADER — 見やすさのためダークのまま
      ══════════════════════════════════════════════════════════ */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: 'rgba(10,15,30,0.97)', backdropFilter: 'blur(8px)',
        borderBottom: '1px solid rgba(255,215,0,0.15)',
        padding: `0 ${PX}`, height: 60,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <span style={{ fontWeight: 900, fontSize: 26, letterSpacing: '0.05em', color: Y }}>
          tomaran
        </span>
        <Link
          href="/login"
          style={{
            background: Y, padding: '10px 22px',
            fontSize: 17, fontWeight: 700,
            color: '#000', textDecoration: 'none',
            borderRadius: 12, whiteSpace: 'nowrap',
          }}
        >
          ログイン / 始める
        </Link>
      </header>

      {/* ══════════════════════════════════════════════════════════
          1. ファーストビュー
      ══════════════════════════════════════════════════════════ */}
      <section style={{ padding: '64px 20px 56px', background: '#FFF8EE' }}>
      <div style={{ maxWidth: MAX_W, margin: '0 auto', textAlign: 'center' }}>
        <p style={{ fontSize: 17, fontWeight: 700, color: AMBER, letterSpacing: '0.15em', marginBottom: 20 }}>
          資材屋の仕事を止めない道具
        </p>

        <h1 style={{ fontSize: 42, fontWeight: 900, lineHeight: 1.25, marginBottom: 16, letterSpacing: '-0.01em', color: TEXT }}>
          仕事の<span style={{ color: AMBER }}>Stop</span>を<br />なくす。
        </h1>

        <p style={{ fontSize: 23, fontWeight: 700, lineHeight: 1.7, marginBottom: 32, color: '#444' }}>
          資材屋の<br />
          納品・見積・請求を<br />
          <span style={{ color: AMBER }}>スマホひとつで回す道具。</span>
        </p>

        {/* デモ画面（即実利を示す） */}
        <div style={{
          background: CARD, border: '1px solid #E5E0DA',
          borderRadius: 14, padding: '20px 18px', marginBottom: 32,
          boxShadow: '3px 3px 0 #E5E0DA', textAlign: 'left',
        }}>
          <p style={{ fontSize: 15, color: TEXT3, margin: '0 0 12px', fontWeight: 700 }}>
            ▶ 単価表 Excel 取込デモ
          </p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {[
              { bg: '#F0FDF4', border: '#BBF7D0', color: '#166534', label: '✓ 500件 → 5分' },
              { bg: '#FFF7ED', border: '#FED7AA', color: '#C2410C', label: '✓ CSV変換不要' },
              { bg: '#EFF6FF', border: '#BFDBFE', color: '#1D4ED8', label: '✓ 今のExcelそのまま' },
            ].map(t => (
              <div key={t.label} style={{
                background: t.bg, border: `1px solid ${t.border}`,
                borderRadius: 10, padding: '10px 16px',
                fontSize: 17, color: t.color, fontWeight: 700,
              }}>
                {t.label}
              </div>
            ))}
          </div>
        </div>

        {/* 「本音」ボックス — 明朝体・薄ベージュで思想でなく本音の演出 */}
        <div style={{
          background: '#FFF8F0', border: '1px solid #E5D5C0',
          borderLeft: '4px solid #C2710C',
          borderRadius: 8, padding: '24px 22px', marginBottom: 44,
          textAlign: 'left',
        }}>
          <p style={{ fontSize: 20, color: '#5D4037', lineHeight: 2.1, margin: 0 }}>
            ITツールでも<br />
            DXでもありません。<br />
            <br />
            ただの<br />
            <strong style={{ color: '#C2710C' }}>仕事のStopを消す道具</strong>です。
          </p>
        </div>

        {/* CTA × 2 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 24 }}>
          <a
            href={YT_URL}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              background: GREEN, color: '#fff',
              padding: '18px 24px', borderRadius: 14,
              fontWeight: 700, fontSize: 20, textDecoration: 'none',
              boxShadow: '3px 3px 0 #0F4620', minHeight: 60,
            }}
          >
            <span style={{ fontSize: 24 }}>▶</span>
            30秒でわかる動画を見る
          </a>

          <Link
            href="/login"
            style={{
              display: 'block',
              background: Y, color: '#000',
              padding: '18px 24px', borderRadius: 14,
              fontWeight: 900, fontSize: 22, textDecoration: 'none',
              boxShadow: '3px 3px 0 #B8860B', minHeight: 60, lineHeight: '24px',
            }}
          >
            今すぐ始める →
          </Link>
        </div>

      </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          2. 向いている会社
      ══════════════════════════════════════════════════════════ */}
      <section style={{ background: BG2, padding: '64px 20px' }}>
        <div style={{ maxWidth: MAX_W, margin: '0 auto' }}>
          <h2 style={{ fontSize: 30, fontWeight: 900, marginBottom: 8, lineHeight: 1.4, color: TEXT }}>
            この道具が<br />向いている資材屋
          </h2>
          <p style={{ color: TEXT2, fontSize: 19, marginBottom: 32, lineHeight: 1.7 }}>
            もし3つ以上当てはまるなら<br />たぶん役に立ちます。
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 36 }}>
            {[
              '納品書は手書き',
              '月末の請求で毎回バタバタ',
              '事務が納品書を解読している',
              'Excelで単価管理している',
              '現場→事務の連携が遅い',
              '見積提出が遅れることがある',
            ].map(item => (
              <div key={item} style={{
                display: 'flex', alignItems: 'center', gap: 14,
                background: CARD, border: '1px solid #E5E0DA',
                borderRadius: 12, padding: '16px 18px',
                boxShadow: '2px 2px 0 #E5E0DA',
              }}>
                <span style={{
                  width: 26, height: 26, border: `2px solid ${AMBER}`,
                  borderRadius: 4, flexShrink: 0, display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                  color: AMBER, fontWeight: 900, fontSize: 17,
                }}>☑</span>
                <span style={{ fontSize: 19, color: TEXT, fontWeight: 500 }}>{item}</span>
              </div>
            ))}
          </div>

          <div style={{ background: '#F5F1EC', border: '1px solid #E5E0DA', borderRadius: 10, padding: '20px 20px' }}>
            <p style={{ fontSize: 17, color: TEXT3, margin: 0, lineHeight: 1.8 }}>
              逆に——<br />
              <strong style={{ color: TEXT2 }}>完全デジタル化している会社には<br />たぶん必要ありません。</strong>
            </p>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          3. 資材屋の1日（Stopが起きる瞬間）
      ══════════════════════════════════════════════════════════ */}
      <section style={{ padding: '64px 20px', background: BG }}>
        <div style={{ maxWidth: MAX_W, margin: '0 auto' }}>
          <h2 style={{ fontSize: 30, fontWeight: 900, marginBottom: 8, lineHeight: 1.4, color: TEXT }}>
            資材屋の仕事は<br />
            <span style={{ color: '#DC2626' }}>Stopが多すぎる。</span>
          </h2>
          <p style={{ color: TEXT3, fontSize: 18, marginBottom: 48 }}>
            毎日起きている「あるある」を<br />正直に書きます。
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {[
              { time: '朝',   scene: '現場から電話',                    detail: '「今日の納品これ追加して」',                                                        stop: true  },
              { time: '昼',   scene: '納品書 手書き',                   detail: 'ボールペンで丁寧に書く。\n消えないように願いながら。',                                stop: false },
              { time: '夕方', scene: '事務所に戻る',                    detail: '納品書の山。',                                                                        stop: false },
              { time: '───', scene: '事務員\n「これなんて書いてます？」', detail: '社長\n「うーん……」',                                                              stop: true  },
              { time: '月末', scene: '請求書を作る',                    detail: '確認→修正→また確認。\n\n仕事は忙しいのに\nなぜか\n流れが止まる。',                   stop: true  },
            ].map((row, i) => (
              <div key={i} style={{ display: 'flex', gap: 16, marginBottom: 8 }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 52, flexShrink: 0 }}>
                  <div style={{
                    width: 48, height: 48, borderRadius: '50%',
                    background: row.stop ? 'rgba(220,38,38,0.08)' : '#F0EDE8',
                    border: `2px solid ${row.stop ? '#DC2626' : '#E5E0DA'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 13, fontWeight: 700,
                    color: row.stop ? '#DC2626' : TEXT3,
                    flexShrink: 0, textAlign: 'center',
                  }}>
                    {row.time}
                  </div>
                  {i < 4 && <div style={{ width: 2, flex: 1, minHeight: 16, background: '#E5E0DA', margin: '4px 0' }} />}
                </div>

                <div style={{
                  flex: 1,
                  background: row.stop ? '#FFF5F5' : CARD,
                  border: `1px solid ${row.stop ? '#FECACA' : '#E5E0DA'}`,
                  borderRadius: 12, padding: '16px 18px',
                  boxShadow: '2px 2px 0 #E5E0DA',
                }}>
                  <p style={{
                    fontSize: 19, fontWeight: 700, margin: '0 0 6px',
                    color: row.stop ? '#DC2626' : TEXT, whiteSpace: 'pre-line',
                  }}>
                    {row.stop && <span style={{ fontSize: 13, background: '#DC2626', color: '#fff', borderRadius: 4, padding: '2px 7px', marginRight: 8 }}>STOP</span>}
                    {row.scene}
                  </p>
                  <p style={{ fontSize: 17, color: TEXT3, margin: 0, lineHeight: 1.8, whiteSpace: 'pre-line' }}>
                    {row.detail}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div style={{
            marginTop: 32, background: '#FFFBEB',
            border: `1px solid ${AMBER}55`, borderLeft: `4px solid ${AMBER}`,
            borderRadius: 12, padding: '22px 20px',
          }}>
            <p style={{ fontSize: 19, fontWeight: 700, margin: '0 0 6px', color: AMBER }}>
              tomaranは
            </p>
            <p style={{ fontSize: 19, color: TEXT, margin: 0, lineHeight: 1.8 }}>
              このStopを消すための道具です。
            </p>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          4. tomaranとは
      ══════════════════════════════════════════════════════════ */}
      <section style={{ background: BG2, padding: '64px 20px' }}>
        <div style={{ maxWidth: MAX_W, margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: 30, fontWeight: 900, marginBottom: 24, lineHeight: 1.5, color: TEXT }}>
            仕事のStopを<br />消す道具。
          </h2>

          <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginBottom: 32, flexWrap: 'wrap' }}>
            {['現場', '事務所', '社長'].map(role => (
              <span key={role} style={{
                background: CARD, border: `1px solid ${AMBER}44`,
                borderRadius: 20, padding: '10px 24px',
                fontSize: 19, fontWeight: 700, color: AMBER,
                boxShadow: '2px 2px 0 #E5E0DA',
              }}>
                {role}
              </span>
            ))}
          </div>

          <p style={{ fontSize: 20, color: TEXT2, lineHeight: 2, marginBottom: 40 }}>
            この3つの仕事が<br />
            <strong style={{ color: TEXT }}>止まらないようにする。</strong><br />
            <br />
            それだけの道具です。
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, textAlign: 'left' }}>
            {[
              '難しい設定　→　いりません',
              'IT知識　→　いりません',
              '研修　→　いりません',
              'Googleログイン　→　パスワード管理いりません',
            ].map(line => (
              <div key={line} style={{
                display: 'flex', alignItems: 'center', gap: 14,
                background: CARD, border: '1px solid #E5E0DA',
                borderRadius: 10, padding: '16px 18px',
                boxShadow: '2px 2px 0 #E5E0DA',
              }}>
                <span style={{ color: '#16A34A', fontWeight: 900, fontSize: 22, flexShrink: 0 }}>✓</span>
                <span style={{ fontSize: 18, color: TEXT }}>{line}</span>
              </div>
            ))}
          </div>

          <p style={{ fontSize: 19, color: TEXT2, marginTop: 28, lineHeight: 1.8 }}>
            二度手間を消すだけです。
          </p>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          5. tomaranができること
      ══════════════════════════════════════════════════════════ */}
      <section style={{ padding: '64px 20px', background: BG }}>
        <div style={{ maxWidth: MAX_W, margin: '0 auto' }}>
          <h2 style={{ fontSize: 30, fontWeight: 900, marginBottom: 8, lineHeight: 1.4, color: TEXT }}>
            tomaranが<br />できること
          </h2>
          <p style={{ color: TEXT3, fontSize: 18, marginBottom: 40, lineHeight: 1.7 }}>
            機能一覧ではなく<br />「どんなStopが消えるか」で説明します。
          </p>

          {[
            {
              num: '01',
              title: '現場のスマホで完結。\n二度手間、禁止。',
              body: '現場で納品登録したら、その場でPDFの納品書を発行。\nそのままスマホから送るなり、後で印刷するなり、お好きにどうぞ。\n\n「あとで事務所に戻ってから……」\n\nというStopを消します。',
              color: AMBER,
            },
            {
              num: '02',
              title: '見積もりは\n「出せるもの」から送る。',
              body: '全部揃うまで待つ必要、ありますか？\n\n決まっているものから送れば\nお客さんもあなたも仕事が早い。\n\n「とりあえず今すぐ」を大事にしました。',
              color: '#2563EB',
            },
            {
              num: '03',
              title: '請求書は解読ではなく\n確認だけ。',
              body: '現場が入力したデータが\nそのまま請求書になります。\n\nあなたは単価が未設定のものだけ\nポチポチ直すだけ。\n\n確認して、確定。それだけです。',
              color: '#16A34A',
            },
            {
              num: '04',
              title: '最後はExcelに\nお返しします。',
              body: '請求書はExcel形式で出力。\n\n端数調整でも書き換えでも\n好きにしてください。\n\n煮るなり焼くなりご自由に。笑',
              color: '#9333EA',
            },
          ].map((item, i) => (
            <div key={i} style={{
              background: CARD,
              borderTop: `3px solid ${item.color}`,
              border: `1px solid #E5E0DA`,
              borderRadius: 14, padding: '26px 22px',
              marginBottom: 14,
              boxShadow: '3px 3px 0 #E5E0DA',
            }}>
              <p style={{ fontSize: 16, fontWeight: 700, color: item.color, letterSpacing: '0.15em', marginBottom: 10, marginTop: 0 }}>
                {item.num}
              </p>
              <h3 style={{ fontSize: 22, fontWeight: 900, lineHeight: 1.5, marginBottom: 14, marginTop: 0, whiteSpace: 'pre-line', color: TEXT }}>
                {item.title}
              </h3>
              <p style={{ fontSize: 18, color: TEXT2, lineHeight: 1.9, margin: 0, whiteSpace: 'pre-line' }}>
                {item.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          6. 導入ステップ
      ══════════════════════════════════════════════════════════ */}
      <section style={{ background: BG2, padding: '64px 20px' }}>
        <div style={{ maxWidth: MAX_W, margin: '0 auto' }}>
          <h2 style={{ fontSize: 30, fontWeight: 900, marginBottom: 8, lineHeight: 1.4, color: TEXT }}>
            導入は30分もかかりません。
          </h2>
          <p style={{ color: TEXT3, fontSize: 18, marginBottom: 40, lineHeight: 1.8 }}>
            簡単にできるようにしました。<br />
            だから初期費用もいりません。<br />
            その分利益を最大化してください。
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {[
              { n: 'STEP 1', icon: '📊', title: '単価表ExcelをアップするかExcel内から登録', body: '今使っているExcelをそのまま投げてください。変換とか不要です。' },
              { n: 'STEP 2', icon: '🏢', title: '取引先ExcelをアップするかExcel内から登録', body: '500件くらいなら5分で終わります。その間コーヒーでも飲んでください。' },
              { n: 'STEP 3', icon: '📱', title: '現場がスマホで使う', body: 'アプリのインストール不要。ブラウザで開くだけ。' },
            ].map((step, idx) => (
              <div key={step.n} style={{ display: 'flex', gap: 16, marginBottom: 0 }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 52, flexShrink: 0 }}>
                  <div style={{
                    width: 48, height: 48, borderRadius: '50%',
                    background: Y, color: '#000',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 900, fontSize: 20, flexShrink: 0, textAlign: 'center',
                    boxShadow: '2px 2px 0 #B8860B',
                  }}>
                    {idx + 1}
                  </div>
                  {idx < 2 && <div style={{ width: 2, height: 32, background: '#E5E0DA', margin: '4px 0' }} />}
                </div>
                <div style={{
                  flex: 1, background: CARD, border: '1px solid #E5E0DA',
                  borderRadius: 12, padding: '18px 20px', marginBottom: 10,
                  boxShadow: '2px 2px 0 #E5E0DA',
                }}>
                  <p style={{ fontSize: 16, color: AMBER, fontWeight: 700, margin: '0 0 4px' }}>{step.n}</p>
                  <p style={{ fontSize: 28, margin: '0 0 8px' }}>{step.icon}</p>
                  <h3 style={{ fontSize: 19, fontWeight: 900, margin: '0 0 6px', color: TEXT }}>{step.title}</h3>
                  <p style={{ fontSize: 17, color: TEXT2, margin: 0, lineHeight: 1.75 }}>{step.body}</p>
                </div>
              </div>
            ))}
          </div>

          <p style={{ fontSize: 22, fontWeight: 900, color: AMBER, textAlign: 'center', marginTop: 32 }}>
            それだけです。
          </p>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          7. 料金
      ══════════════════════════════════════════════════════════ */}
      <section style={{ padding: '64px 20px', background: BG }}>
        <div style={{ maxWidth: MAX_W, margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: 30, fontWeight: 900, marginBottom: 8, color: TEXT }}>
            料金はシンプルです。
          </h2>
          <p style={{ color: TEXT3, fontSize: 18, marginBottom: 40 }}>
            本当にシンプルです。
          </p>

          <div style={{
            background: CARD, border: `2px solid ${AMBER}`,
            borderRadius: 18, padding: '40px 26px',
            marginBottom: 24, boxShadow: '4px 4px 0 #E5D5C0',
          }}>
            <p style={{ color: TEXT2, fontSize: 18, margin: '0 0 8px' }}>月額</p>
            <p style={{ fontSize: 68, fontWeight: 900, color: AMBER, margin: '0 0 4px', lineHeight: 1 }}>
              ¥14,800
            </p>
            <p style={{ color: TEXT3, fontSize: 17, marginBottom: 32 }}>（税込）</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {[
                { label: '初期費用', value: 'なし' },
                { label: '従量課金', value: 'なし' },
              ].map(row => (
                <div key={row.label} style={{
                  display: 'flex', justifyContent: 'space-between',
                  padding: '16px 0', borderBottom: '1px solid #E5E0DA',
                  fontSize: 19,
                }}>
                  <span style={{ color: TEXT2 }}>{row.label}</span>
                  <span style={{ fontWeight: 700, color: '#16A34A' }}>{row.value}</span>
                </div>
              ))}
            </div>

            <p style={{ fontSize: 18, color: TEXT2, marginTop: 28, marginBottom: 0, lineHeight: 1.8 }}>
              資材屋の仕事のStopが減るなら<br />
              <strong style={{ color: TEXT }}>安い道具だと思います。</strong>
            </p>
          </div>

          <Link
            href="/login"
            style={{
              display: 'block',
              background: Y, color: '#000',
              padding: '20px', borderRadius: 14,
              fontWeight: 900, fontSize: 22, textDecoration: 'none',
              boxShadow: '3px 3px 0 #B8860B',
            }}
          >
            今すぐ始める →
          </Link>
          <p style={{ marginTop: 14, fontSize: 17, color: TEXT3 }}>
            縛りなし｜使えないと思ったらすぐ解約OK
          </p>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          8. FAQ
      ══════════════════════════════════════════════════════════ */}
      <section style={{ background: BG2, padding: '64px 20px' }}>
        <div style={{ maxWidth: MAX_W, margin: '0 auto' }}>
          <h2 style={{ fontSize: 30, fontWeight: 900, marginBottom: 40, lineHeight: 1.4, color: TEXT }}>
            よくある質問
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[
              {
                q: '新しいシステム、覚えられる気がしないんだけど……',
                a: '難しい操作はありません。\n\nスマホが使えるなら誰でも使えます。\n\nそれでも不安な人のために、30秒でわかる動画（YouTube）を山ほど用意しました。',
              },
              {
                q: '取引先ごとに締め日がバラバラだけど大丈夫？',
                a: '全力で対応しました。\n\n締め日に合わせて発行して、内容がOKだったら確定。\n\n取引先の「わがまま」に、システムが柔軟に合わせます。',
              },
              {
                q: '今使ってるExcelからデータを移すのが一番めんどくさい……',
                a: 'そのExcel、システムに投げてください。\n\nCSVとか難しいことは言いません。\n\n500件くらいなら5分で終わります。その間コーヒーでも飲んで待っててください。',
              },
              {
                q: 'アカウントとかパスワードとか管理してられない…忘れたらどうするの？',
                a: 'Googleログインで一社1アカウント制です。\n\nはじめに会社用のGoogleアカウントだけ作成してください。\n\nそのアカウントで、現場スタッフも事務も社長も、みんな共用で入れます。\n\nパスワードはGoogleが管理してくれるので、tomaranには関係ありません。',
              },
              {
                q: 'マスタにない新商品が出たとき、入力エラーで止まるんじゃないの？',
                a: '止まりません。\n\n仮登録で進めてください。\n\n商品名だけ入れて納品書を出せます。単価はあとで事務で直せばOK。\n\n現場のスピード優先です。',
              },
            ].map((item, i) => (
              <div key={i} style={{
                background: CARD, border: '1px solid #E5E0DA',
                borderRadius: 14, overflow: 'hidden',
                boxShadow: '2px 2px 0 #E5E0DA',
              }}>
                <div style={{ padding: '20px 22px', borderLeft: `4px solid ${AMBER}` }}>
                  <p style={{ fontSize: 17, fontWeight: 700, color: AMBER, margin: '0 0 4px' }}>Q.</p>
                  <p style={{ fontSize: 19, fontWeight: 700, color: TEXT, margin: 0, lineHeight: 1.6 }}>
                    {item.q}
                  </p>
                </div>
                <div style={{ padding: '20px 22px', background: '#FFFBF7', borderTop: '1px solid #E5E0DA' }}>
                  <p style={{ fontSize: 17, fontWeight: 700, color: TEXT2, margin: '0 0 6px' }}>A.</p>
                  <p style={{ fontSize: 18, color: TEXT2, margin: 0, lineHeight: 1.9, whiteSpace: 'pre-line' }}>
                    {item.a}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          9. 最終 CTA
      ══════════════════════════════════════════════════════════ */}
      <section style={{ padding: '72px 20px', textAlign: 'center', background: BG }}>
        <div style={{ maxWidth: MAX_W, margin: '0 auto' }}>
          <p style={{ fontSize: 18, color: TEXT2, marginBottom: 16 }}>
            仕事のStopを減らしたいなら
          </p>
          <h2 style={{ fontSize: 32, fontWeight: 900, marginBottom: 8, lineHeight: 1.4, color: TEXT }}>
            この道具<br />
            <span style={{ color: AMBER }}>たぶん役に立ちます。</span>
          </h2>
          <p style={{ fontSize: 18, color: TEXT3, marginBottom: 40 }}>
            「たぶん」と言うのは<br />資材屋さんに正直でいたいからです。
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 24 }}>
            <a
              href={YT_URL}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                background: GREEN, color: '#fff',
                padding: '18px 24px', borderRadius: 14,
                fontWeight: 700, fontSize: 20, textDecoration: 'none',
                boxShadow: '3px 3px 0 #0F4620', minHeight: 60,
              }}
            >
              <span style={{ fontSize: 24 }}>▶</span>
              30秒動画を見る
            </a>

            <Link
              href="/login"
              style={{
                display: 'block',
                background: Y, color: '#000',
                padding: '20px 24px', borderRadius: 14,
                fontWeight: 900, fontSize: 22, textDecoration: 'none',
                boxShadow: '3px 3px 0 #B8860B', minHeight: 60, lineHeight: '24px',
              }}
            >
              今すぐ始める →
            </Link>
          </div>

        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          FOOTER
      ══════════════════════════════════════════════════════════ */}
      <footer style={{
        background: '#05080f',
        borderTop: '1px solid rgba(255,215,0,0.1)',
        padding: '48px 20px 40px',
        textAlign: 'center',
      }}>
        <p style={{ fontWeight: 900, fontSize: 26, color: Y, marginBottom: 20, marginTop: 0, letterSpacing: '0.05em' }}>
          tomaran
        </p>
        <p style={{ color: '#9ca3af', fontSize: 17, marginBottom: 24, lineHeight: 1.9 }}>
          ご相談・お問い合わせはメールにて。<br />
          <a href="mailto:support@tomaran.net" style={{ color: '#d1d5db', textDecoration: 'underline' }}>
            support@tomaran.net
          </a>
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 24, marginBottom: 24, flexWrap: 'wrap' }}>
          <Link href="/legal" style={{ color: '#9ca3af', fontSize: 17, textDecoration: 'underline' }}>
            特定商取引法に基づく表記
          </Link>
          <Link href="/privacy" style={{ color: '#9ca3af', fontSize: 17, textDecoration: 'underline' }}>
            プライバシーポリシー
          </Link>
          <Link href="/login" style={{ color: '#9ca3af', fontSize: 17, textDecoration: 'underline' }}>
            ログイン
          </Link>
        </div>
        <p style={{ color: '#4b5563', fontSize: 16, margin: 0 }}>
          © 2025 tomaran. All rights reserved.
        </p>
      </footer>

    </div>
  )
}
