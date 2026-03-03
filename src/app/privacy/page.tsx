import Link from 'next/link'

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white text-gray-900">
      <div className="mx-auto max-w-2xl px-6 py-16">
        <Link href="/" className="mb-8 inline-block text-sm text-blue-600 hover:underline">
          ← トップへ戻る
        </Link>

        <h1 className="mb-2 text-2xl font-bold">プライバシーポリシー</h1>
        <p className="mb-10 text-xs text-gray-400">最終更新日：2025年1月1日</p>

        <div className="space-y-10 text-sm leading-7 text-gray-700">
          <section>
            <h2 className="mb-3 text-base font-bold text-gray-900">1. 収集する情報</h2>
            <p>
              当サービスは、Googleアカウントによるログイン（OAuth 2.0）を採用しています。
              ログイン時に取得する情報は以下の通りです。
            </p>
            <ul className="mt-2 list-disc pl-5 space-y-1">
              <li>Googleアカウントのメールアドレス</li>
              <li>Googleアカウントの表示名</li>
              <li>プロフィール画像URL（取得する場合）</li>
            </ul>
            <p className="mt-2">
              パスワードは当サービスでは一切保存・管理しません。
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-base font-bold text-gray-900">2. 個人情報の利用目的</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>サービスへのログイン認証・ユーザー識別</li>
              <li>サービスに関する重要なお知らせの送信</li>
              <li>サポート対応</li>
              <li>利用状況の集計・サービス改善（個人を特定しない形で実施）</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-base font-bold text-gray-900">3. 第三者への提供</h2>
            <p>
              当サービスは、法令に基づく場合を除き、取得した個人情報を第三者に提供・販売・貸与することはありません。
            </p>
            <p className="mt-2">
              なお、当サービスは以下の外部サービスを利用しており、それぞれのプライバシーポリシーに従い情報が処理される場合があります。
            </p>
            <ul className="mt-2 list-disc pl-5 space-y-1">
              <li>Supabase（認証・データベース）</li>
              <li>Stripe, Inc.（決済処理）</li>
              <li>Google LLC（OAuth認証）</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-base font-bold text-gray-900">4. 情報の保管</h2>
            <p>
              取得した情報はSupabaseが管理するデータベース（AWS東京リージョン）に保存されます。
              アクセス制御・暗号化通信（TLS）により安全に管理しています。
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-base font-bold text-gray-900">5. 情報の削除</h2>
            <p>
              アカウントの削除をご希望の場合は、下記お問い合わせ先までご連絡ください。
              合理的な期間内にアカウントおよび関連データを削除します。
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-base font-bold text-gray-900">6. Cookieの利用</h2>
            <p>
              当サービスはログインセッションの維持のためにCookieを使用します。
              ブラウザの設定でCookieを無効にした場合、ログイン機能が正常に動作しない場合があります。
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-base font-bold text-gray-900">7. お問い合わせ先</h2>
            <p>個人情報の取り扱いに関するお問い合わせは以下にご連絡ください。</p>
            <p className="mt-2">
              tomaran<br />
              メール：support@tomaran.net
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
