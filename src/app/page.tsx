import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function Page() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* Header */}
      <header className="border-b border-gray-200 px-6 py-4">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <span className="text-lg font-bold">建設クラウド</span>
          <Link
            href="/login"
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            ログイン
          </Link>
        </div>
      </header>

      {/* Hero */}
      <main className="mx-auto max-w-3xl px-6 py-20">
        <h1 className="mb-4 text-3xl font-bold leading-snug">
          建設業の現場管理・請求業務を<br />クラウドで一元化
        </h1>
        <p className="mb-8 text-base text-gray-600">
          本サービスは法人・個人事業主向けの業務支援クラウドサービスです。
          tomaranは、建設・工務店向けの業務改善SaaSです。
          現場の進捗管理、請求書作成、取引先管理をひとつの画面で完結。
          導入実績多数、初期費用ゼロで即日スタート。
        </p>

        {/* Price */}
        <div className="mb-10 inline-block rounded-xl border border-gray-200 bg-gray-50 px-8 py-6 text-center">
          <p className="mb-1 text-sm text-gray-500">月額料金（税込）</p>
          <p className="text-4xl font-bold">¥14,800<span className="text-lg font-normal text-gray-500"> / 月</span></p>
          <p className="mt-2 text-xs text-gray-400">解約はいつでも可能。</p>
        </div>

        {/* CTA */}
        <div className="mb-16">
          <Link
            href="/login"
            className="inline-block rounded-lg bg-blue-600 px-8 py-4 text-base font-semibold text-white hover:bg-blue-700"
          >
            Googleアカウントではじめる
          </Link>
        </div>

        {/* Features */}
        <ul className="mb-16 space-y-3 text-sm text-gray-700">
          {[
            '現場ごとの進捗・工程管理',
            '請求書・見積書の自動生成',
            '取引先・協力会社の一元管理',
            'マルチテナント対応・チーム利用可',
            'PC・スマートフォン両対応',
          ].map((f) => (
            <li key={f} className="flex items-start gap-2">
              <span className="mt-0.5 text-blue-600">✓</span>
              {f}
            </li>
          ))}
        </ul>
      </main>

<footer className="mt-16 border-t pt-6 text-sm text-gray-500">

  {/* contact */}
  <p className="mb-2">
    お問い合わせ：
    <a
      href="mailto:support@tomaran.net"
      className="underline ml-1"
    >
      support@tomaran.net
    </a>
  </p>

  {/* links */}
  <div className="space-x-4 mb-2">
    <a href="/legal" className="underline">
      特定商取引法に基づく表記
    </a>
    <a href="/privacy" className="underline">
      プライバシーポリシー
    </a>
  </div>

  {/* copyright */}
  <p>© 2025 tomaran. All rights reserved.</p>

</footer>
    </div>
  )
}
