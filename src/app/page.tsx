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
// Design tokens
// ─────────────────────────────────────────────────────────────────────────────

const Y    = '#FFD700'
const BG   = '#0a0f1e'
const BG2  = '#0f1629'
const CARD = '#111827'
const C2   = '#1a2035'

const YT_URL   = 'https://youtube.com/@tomaran.net3?si=Ea5PJWp72erIRKHI'
const MAX_W    = 480      // スマホ前提のコンテンツ幅
const PX       = '20px'  // 左右パディング

// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────

export default async function Page() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) redirect('/deliveries')

  return (
    <div style={{ fontFamily: 'system-ui, -apple-system, sans-serif', background: BG, color: '#fff', overflowX: 'hidden' }}>

      {/* ══════════════════════════════════════════════════════════
          HEADER
      ══════════════════════════════════════════════════════════ */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: 'rgba(10,15,30,0.97)', backdropFilter: 'blur(8px)',
        borderBottom: '1px solid rgba(255,215,0,0.15)',
        padding: `0 ${PX}`, height: 56,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <span style={{ fontWeight: 900, fontSize: 22, letterSpacing: '0.05em', color: Y }}>
          tomaran
        </span>
        <Link
          href="/login"
          style={{
            background: Y, padding: '8px 18px',
            fontSize: 13, fontWeight: 700,
            color: '#000', textDecoration: 'none',
            borderRadius: 6, whiteSpace: 'nowrap',
          }}
        >
          ログイン / 始める
        </Link>
      </header>

      {/* ══════════════════════════════════════════════════════════
          1. ファーストビュー
      ══════════════════════════════════════════════════════════ */}
      <section style={{
        padding: '64px 20px 56px',
        maxWidth: MAX_W, margin: '0 auto',
        textAlign: 'center',
      }}>
        {/* メインキャッチ */}
        <p style={{
          fontSize: 13, fontWeight: 700, color: Y,
          letterSpacing: '0.15em', marginBottom: 20,
        }}>
          資材屋の仕事を止めない道具
        </p>

        <h1 style={{
          fontSize: 38, fontWeight: 900, lineHeight: 1.25,
          marginBottom: 12, letterSpacing: '-0.01em',
        }}>
          仕事の<span style={{ color: Y }}>Stop</span>を<br />なくす。
        </h1>

        <p style={{ fontSize: 19, fontWeight: 700, lineHeight: 1.7, marginBottom: 32, color: '#d1d5db' }}>
          資材屋の<br />
          納品・見積・請求を<br />
          <span style={{ color: Y }}>スマホひとつで回す道具。</span>
        </p>

        <p style={{ fontSize: 14, color: '#6b7280', lineHeight: 1.9, marginBottom: 48 }}>
          ITツールでも<br />
          DXでもありません。<br />
          <br />
          ただの<br />
          <strong style={{ color: '#9ca3af' }}>仕事のStopを消す道具</strong>です。
        </p>

        {/* CTA × 2 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
          <a
            href={YT_URL}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              background: '#ff0000', color: '#fff',
              padding: '16px 24px', borderRadius: 10,
              fontWeight: 700, fontSize: 16, textDecoration: 'none',
              boxShadow: '0 4px 20px rgba(255,0,0,0.3)',
              minHeight: 56,
            }}
          >
            <span style={{ fontSize: 22 }}>▶</span>
            30秒でわかる動画を見る
          </a>

          <Link
            href="/login"
            style={{
              display: 'block',
              background: Y, color: '#000',
              padding: '16px 24px', borderRadius: 10,
              fontWeight: 900, fontSize: 18, textDecoration: 'none',
              boxShadow: '0 0 32px rgba(255,215,0,0.25)',
              minHeight: 56, lineHeight: '24px',
            }}
          >
            今すぐ始める →
          </Link>
        </div>

        <p style={{ fontSize: 12, color: '#4b5563', lineHeight: 1.7 }}>
          「使えねえな」と思ったら<br />
          すぐ解約してください。笑
        </p>
      </section>

      {/* ══════════════════════════════════════════════════════════
          2. 向いている会社
      ══════════════════════════════════════════════════════════ */}
      <section style={{ background: BG2, padding: '64px 20px' }}>
        <div style={{ maxWidth: MAX_W, margin: '0 auto' }}>
          <h2 style={{ fontSize: 26, fontWeight: 900, marginBottom: 8, lineHeight: 1.4 }}>
            この道具が<br />向いている資材屋
          </h2>
          <p style={{ color: '#9ca3af', fontSize: 15, marginBottom: 32, lineHeight: 1.7 }}>
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
                background: CARD, border: '1px solid rgba(255,215,0,0.15)',
                borderRadius: 10, padding: '14px 18px',
              }}>
                <span style={{
                  width: 24, height: 24, border: `2px solid ${Y}`,
                  borderRadius: 4, flexShrink: 0, display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                  color: Y, fontWeight: 900, fontSize: 15,
                }}>☑</span>
                <span style={{ fontSize: 15, color: '#d1d5db', fontWeight: 500 }}>{item}</span>
              </div>
            ))}
          </div>

          <div style={{
            background: C2, border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 10, padding: '18px 20px',
          }}>
            <p style={{ fontSize: 13, color: '#6b7280', margin: 0, lineHeight: 1.8 }}>
              逆に——<br />
              <strong style={{ color: '#4b5563' }}>完全デジタル化している会社には<br />たぶん必要ありません。</strong>
            </p>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          3. 資材屋の1日（Stopが起きる瞬間）
      ══════════════════════════════════════════════════════════ */}
      <section style={{ padding: '64px 20px' }}>
        <div style={{ maxWidth: MAX_W, margin: '0 auto' }}>
          <h2 style={{ fontSize: 26, fontWeight: 900, marginBottom: 8, lineHeight: 1.4 }}>
            資材屋の仕事は<br />
            <span style={{ color: '#ef4444' }}>Stopが多すぎる。</span>
          </h2>
          <p style={{ color: '#6b7280', fontSize: 14, marginBottom: 48 }}>
            毎日起きている「あるある」を<br />正直に書きます。
          </p>

          {/* ストーリータイムライン */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {[
              {
                time: '朝',
                scene: '現場から電話',
                detail: '「今日の納品これ追加して」',
                stop: true,
              },
              {
                time: '昼',
                scene: '納品書 手書き',
                detail: 'ボールペンで丁寧に書く。\n消えないように願いながら。',
                stop: false,
              },
              {
                time: '夕方',
                scene: '事務所に戻る',
                detail: '納品書の山。',
                stop: false,
              },
              {
                time: '───',
                scene: '事務員\n「これなんて書いてます？」',
                detail: '社長\n「うーん……」',
                stop: true,
              },
              {
                time: '月末',
                scene: '請求書を作る',
                detail: '確認→修正→また確認。\n\n仕事は忙しいのに\nなぜか\n流れが止まる。',
                stop: true,
              },
            ].map((row, i) => (
              <div key={i} style={{ display: 'flex', gap: 16, marginBottom: 8 }}>
                {/* 時間軸 */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 48, flexShrink: 0 }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: '50%',
                    background: row.stop ? 'rgba(239,68,68,0.15)' : C2,
                    border: `2px solid ${row.stop ? '#ef4444' : 'rgba(255,255,255,0.08)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11, fontWeight: 700,
                    color: row.stop ? '#ef4444' : '#6b7280',
                    flexShrink: 0, textAlign: 'center',
                  }}>
                    {row.time}
                  </div>
                  {i < 4 && <div style={{ width: 2, flex: 1, minHeight: 16, background: 'rgba(255,255,255,0.06)', margin: '4px 0' }} />}
                </div>

                {/* 内容 */}
                <div style={{
                  flex: 1, background: row.stop ? 'rgba(239,68,68,0.05)' : CARD,
                  border: `1px solid ${row.stop ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.06)'}`,
                  borderRadius: 10, padding: '14px 16px', marginBottom: 0,
                }}>
                  <p style={{
                    fontSize: 15, fontWeight: 700, margin: '0 0 6px',
                    color: row.stop ? '#fca5a5' : '#fff',
                    whiteSpace: 'pre-line',
                  }}>
                    {row.stop && <span style={{ fontSize: 12, background: '#ef4444', color: '#fff', borderRadius: 3, padding: '1px 6px', marginRight: 8 }}>STOP</span>}
                    {row.scene}
                  </p>
                  <p style={{ fontSize: 13, color: '#6b7280', margin: 0, lineHeight: 1.8, whiteSpace: 'pre-line' }}>
                    {row.detail}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div style={{
            marginTop: 32, background: C2,
            border: `1px solid ${Y}33`, borderLeft: `4px solid ${Y}`,
            borderRadius: 10, padding: '20px 18px',
          }}>
            <p style={{ fontSize: 15, fontWeight: 700, margin: '0 0 6px', color: Y }}>
              tomaranは
            </p>
            <p style={{ fontSize: 15, color: '#d1d5db', margin: 0, lineHeight: 1.8 }}>
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
          <h2 style={{ fontSize: 26, fontWeight: 900, marginBottom: 24, lineHeight: 1.5 }}>
            仕事のStopを<br />消す道具。
          </h2>

          <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginBottom: 32, flexWrap: 'wrap' }}>
            {['現場', '事務所', '社長'].map(role => (
              <span key={role} style={{
                background: CARD, border: `1px solid ${Y}33`,
                borderRadius: 20, padding: '8px 20px',
                fontSize: 15, fontWeight: 700, color: Y,
              }}>
                {role}
              </span>
            ))}
          </div>

          <p style={{ fontSize: 16, color: '#d1d5db', lineHeight: 2, marginBottom: 40 }}>
            この3つの仕事が<br />
            <strong style={{ color: '#fff' }}>止まらないようにする。</strong><br />
            <br />
            それだけの道具です。
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, textAlign: 'left' }}>
            {[
              '難しい設定　→　いりません',
              'IT知識　→　いりません',
              '研修　→　いりません',
            ].map(line => (
              <div key={line} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                background: CARD, borderRadius: 8, padding: '14px 18px',
              }}>
                <span style={{ color: '#34d399', fontWeight: 900, fontSize: 18, flexShrink: 0 }}>✓</span>
                <span style={{ fontSize: 14, color: '#d1d5db' }}>{line}</span>
              </div>
            ))}
          </div>

          <p style={{ fontSize: 15, color: '#9ca3af', marginTop: 28, lineHeight: 1.8 }}>
            二度手間を消すだけです。
          </p>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          5. tomaranができること
      ══════════════════════════════════════════════════════════ */}
      <section style={{ padding: '64px 20px' }}>
        <div style={{ maxWidth: MAX_W, margin: '0 auto' }}>
          <h2 style={{ fontSize: 26, fontWeight: 900, marginBottom: 8, lineHeight: 1.4 }}>
            tomaranが<br />できること
          </h2>
          <p style={{ color: '#6b7280', fontSize: 14, marginBottom: 40, lineHeight: 1.7 }}>
            機能一覧ではなく<br />「どんなStopが消えるか」で説明します。
          </p>

          {[
            {
              num: '01',
              title: '現場のスマホで完結。\n二度手間、禁止。',
              body: '現場で納品登録したら、その場でPDFの納品書を発行。\nそのままスマホから送るなり、後で印刷するなり、お好きにどうぞ。\n\n「あとで事務所に戻ってから……」\n\nというStopを消します。',
              color: Y,
            },
            {
              num: '02',
              title: '見積もりは\n「出せるもの」から送る。',
              body: '全部揃うまで待つ必要、ありますか？\n\n決まっているものから送れば\nお客さんもあなたも仕事が早い。\n\n「とりあえず今すぐ」を大事にしました。',
              color: '#60a5fa',
            },
            {
              num: '03',
              title: '請求書は解読ではなく\n確認だけ。',
              body: '現場が入力したデータが\nそのまま請求書になります。\n\nあなたは単価が未設定のものだけ\nポチポチ直すだけ。\n\n確認して、確定。それだけです。',
              color: '#34d399',
            },
            {
              num: '04',
              title: '最後はExcelに\nお返しします。',
              body: '請求書はExcel形式で出力。\n\n端数調整でも書き換えでも\n好きにしてください。\n\n煮るなり焼くなりご自由に。笑',
              color: '#f472b6',
            },
          ].map((item, i) => (
            <div key={i} style={{
              background: CARD,
              borderTop: `3px solid ${item.color}`,
              border: `1px solid rgba(255,255,255,0.06)`,
              borderRadius: 12, padding: '24px 20px',
              marginBottom: 12,
            }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: item.color, letterSpacing: '0.15em', marginBottom: 10, marginTop: 0 }}>
                {item.num}
              </p>
              <h3 style={{
                fontSize: 18, fontWeight: 900, lineHeight: 1.5,
                marginBottom: 14, marginTop: 0, whiteSpace: 'pre-line',
                color: '#fff',
              }}>
                {item.title}
              </h3>
              <p style={{ fontSize: 14, color: '#9ca3af', lineHeight: 1.9, margin: 0, whiteSpace: 'pre-line' }}>
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
          <h2 style={{ fontSize: 26, fontWeight: 900, marginBottom: 8, lineHeight: 1.4 }}>
            導入は3分です。
          </h2>
          <p style={{ color: '#6b7280', fontSize: 14, marginBottom: 40 }}>
            本当に3分です。
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {[
              { n: 'STEP 1', icon: '📊', title: '単価表ExcelをアップするかExcel内から登録', body: '今使っているExcelをそのまま投げてください。変換とか不要です。' },
              { n: 'STEP 2', icon: '🏢', title: '取引先ExcelをアップするかExcel内から登録', body: '500件くらいなら5分で終わります。その間コーヒーでも飲んでください。' },
              { n: 'STEP 3', icon: '📱', title: '現場がスマホで使う', body: 'アプリのインストール不要。ブラウザで開くだけ。' },
            ].map((step, idx) => (
              <div key={step.n} style={{ display: 'flex', gap: 16, marginBottom: 0 }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 48, flexShrink: 0 }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: '50%',
                    background: Y, color: '#000',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 900, fontSize: 11, flexShrink: 0, textAlign: 'center',
                  }}>
                    {idx + 1}
                  </div>
                  {idx < 2 && <div style={{ width: 2, height: 32, background: `${Y}33`, margin: '4px 0' }} />}
                </div>
                <div style={{
                  flex: 1, background: CARD, border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: 10, padding: '16px 18px', marginBottom: 8,
                }}>
                  <p style={{ fontSize: 12, color: Y, fontWeight: 700, margin: '0 0 4px' }}>{step.n}</p>
                  <p style={{ fontSize: 24, margin: '0 0 8px' }}>{step.icon}</p>
                  <h3 style={{ fontSize: 15, fontWeight: 900, margin: '0 0 6px', color: '#fff' }}>{step.title}</h3>
                  <p style={{ fontSize: 13, color: '#6b7280', margin: 0, lineHeight: 1.75 }}>{step.body}</p>
                </div>
              </div>
            ))}
          </div>

          <p style={{ fontSize: 18, fontWeight: 900, color: Y, textAlign: 'center', marginTop: 32 }}>
            それだけです。
          </p>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          7. 料金
      ══════════════════════════════════════════════════════════ */}
      <section style={{ padding: '64px 20px' }}>
        <div style={{ maxWidth: MAX_W, margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: 26, fontWeight: 900, marginBottom: 8 }}>
            料金はシンプルです。
          </h2>
          <p style={{ color: '#6b7280', fontSize: 14, marginBottom: 40 }}>
            本当にシンプルです。
          </p>

          <div style={{
            background: CARD, border: `2px solid ${Y}`,
            borderRadius: 16, padding: '40px 24px',
            marginBottom: 24,
          }}>
            <p style={{ color: '#9ca3af', fontSize: 14, margin: '0 0 8px' }}>月額</p>
            <p style={{ fontSize: 64, fontWeight: 900, color: Y, margin: '0 0 4px', lineHeight: 1 }}>
              ¥14,800
            </p>
            <p style={{ color: '#6b7280', fontSize: 13, marginBottom: 32 }}>（税込）</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {[
                { label: '初期費用', value: 'なし' },
                { label: '従量課金', value: 'なし' },
                { label: 'ユーザー課金', value: 'なし' },
              ].map(row => (
                <div key={row.label} style={{
                  display: 'flex', justifyContent: 'space-between',
                  padding: '14px 0', borderBottom: '1px solid rgba(255,255,255,0.06)',
                  fontSize: 15,
                }}>
                  <span style={{ color: '#9ca3af' }}>{row.label}</span>
                  <span style={{ fontWeight: 700, color: '#34d399' }}>{row.value}</span>
                </div>
              ))}
            </div>

            <p style={{ fontSize: 14, color: '#6b7280', marginTop: 28, marginBottom: 0, lineHeight: 1.8 }}>
              資材屋の仕事のStopが減るなら<br />
              <strong style={{ color: '#9ca3af' }}>安い道具だと思います。</strong>
            </p>
          </div>

          <Link
            href="/login"
            style={{
              display: 'block',
              background: Y, color: '#000',
              padding: '18px', borderRadius: 10,
              fontWeight: 900, fontSize: 18, textDecoration: 'none',
              boxShadow: '0 0 32px rgba(255,215,0,0.25)',
            }}
          >
            今すぐ始める →
          </Link>
          <p style={{ marginTop: 12, fontSize: 11, color: '#4b5563' }}>
            縛りなし｜使えないと思ったらすぐ解約OK
          </p>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          8. FAQ
      ══════════════════════════════════════════════════════════ */}
      <section style={{ background: BG2, padding: '64px 20px' }}>
        <div style={{ maxWidth: MAX_W, margin: '0 auto' }}>
          <h2 style={{ fontSize: 26, fontWeight: 900, marginBottom: 40, lineHeight: 1.4 }}>
            よくある質問
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              {
                q: '新しいシステム、覚えられる気がしないんだけど……',
                a: '難しい操作はありません。\n\nガラケーの方はごめんけど、スマホが使えるなら誰でも使えます。\n\nそれでも不安な人のために、30秒でわかる動画（YouTube）を山ほど用意しました。',
              },
              {
                q: '取引先ごとに締め日がバラバラだけど大丈夫？',
                a: '全力で対応しました。\n\n締め日に合わせて発行して、内容がOKだったら確定。\n\n取引先の「わがまま」に、システムが柔軟に合わせます。',
              },
              {
                q: '今使ってるExcelからデータを移すのが一番めんどくさい……',
                a: 'そのExcel、そのまま私に投げてください。\n\nCSVとか難しいことは言いません。\n\n500件くらいなら5分で終わります。その間コーヒーでも飲んで待っててください。',
              },
              {
                q: 'マスタにない新商品が出たとき、入力エラーで止まるんじゃないの？',
                a: '止まりません。\n\n仮登録で進めてください。\n\n商品名だけ入れて納品書を出せます。単価はあとで事務で直せばOK。\n\n現場のスピード優先です。',
              },
            ].map((item, i) => (
              <div key={i} style={{
                background: CARD, border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 12, overflow: 'hidden',
              }}>
                <div style={{
                  padding: '18px 20px',
                  borderLeft: `4px solid ${Y}`,
                }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: Y, margin: '0 0 4px' }}>Q.</p>
                  <p style={{ fontSize: 15, fontWeight: 700, color: '#fff', margin: 0, lineHeight: 1.6 }}>
                    {item.q}
                  </p>
                </div>
                <div style={{
                  padding: '18px 20px',
                  background: C2,
                  borderTop: '1px solid rgba(255,255,255,0.04)',
                }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: '#9ca3af', margin: '0 0 6px' }}>A.</p>
                  <p style={{ fontSize: 14, color: '#d1d5db', margin: 0, lineHeight: 1.9, whiteSpace: 'pre-line' }}>
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
      <section style={{ padding: '72px 20px', textAlign: 'center' }}>
        <div style={{ maxWidth: MAX_W, margin: '0 auto' }}>
          <p style={{ fontSize: 14, color: '#6b7280', marginBottom: 16 }}>
            仕事のStopを減らしたいなら
          </p>
          <h2 style={{ fontSize: 28, fontWeight: 900, marginBottom: 8, lineHeight: 1.4 }}>
            この道具<br />
            <span style={{ color: Y }}>たぶん役に立ちます。</span>
          </h2>
          <p style={{ fontSize: 14, color: '#4b5563', marginBottom: 40 }}>
            「たぶん」と言うのは<br />資材屋さんに正直でいたいからです。
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
            <a
              href={YT_URL}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                background: '#ff0000', color: '#fff',
                padding: '16px 24px', borderRadius: 10,
                fontWeight: 700, fontSize: 16, textDecoration: 'none',
                boxShadow: '0 4px 20px rgba(255,0,0,0.3)',
                minHeight: 56,
              }}
            >
              <span style={{ fontSize: 22 }}>▶</span>
              30秒動画を見る
            </a>

            <Link
              href="/login"
              style={{
                display: 'block',
                background: Y, color: '#000',
                padding: '18px 24px', borderRadius: 10,
                fontWeight: 900, fontSize: 18, textDecoration: 'none',
                boxShadow: '0 0 32px rgba(255,215,0,0.25)',
                minHeight: 56, lineHeight: '20px',
              }}
            >
              今すぐ始める →
            </Link>
          </div>

          <p style={{ fontSize: 13, color: '#374151', lineHeight: 1.8 }}>
            使えねえと思ったら<br />
            すぐ解約してください。笑
          </p>
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
        <p style={{ fontWeight: 900, fontSize: 22, color: Y, marginBottom: 20, marginTop: 0, letterSpacing: '0.05em' }}>
          tomaran
        </p>
        <p style={{ color: '#6b7280', fontSize: 13, marginBottom: 24, lineHeight: 1.9 }}>
          ご相談・お問い合わせはメールにて。<br />
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
          <Link href="/login" style={{ color: '#6b7280', fontSize: 13, textDecoration: 'underline' }}>
            ログイン
          </Link>
        </div>
        <p style={{ color: '#374151', fontSize: 12, margin: 0 }}>
          © 2025 tomaran. All rights reserved.
        </p>
      </footer>

    </div>
  )
}
