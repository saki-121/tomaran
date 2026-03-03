import Link from 'next/link'

export default function LegalPage() {
  return (
    <div className="min-h-screen bg-white text-gray-900">
      <div className="mx-auto max-w-2xl px-6 py-16">
        <Link href="/" className="mb-8 inline-block text-sm text-blue-600 hover:underline">
          ← トップへ戻る
        </Link>

        <h1 className="mb-10 text-2xl font-bold">特定商取引法に基づく表記</h1>

        <dl className="space-y-6 text-sm">
          <div className="border-b border-gray-100 pb-6">
            <dt className="mb-1 font-semibold text-gray-500">販売業者</dt>
            <dd>請求があった場合は遅延なく開示いたします</dd>
          </div>
          <div className="border-b border-gray-100 pb-6">
            <dt className="mb-1 font-semibold text-gray-500">運営責任者</dt>
            <dd>請求があった場合は遅延なく開示いたします</dd>
          </div>
          <div className="border-b border-gray-100 pb-6">
            <dt className="mb-1 font-semibold text-gray-500">所在地</dt>
            <dd>請求があった場合は遅延なく開示いたします</dd>
          </div>
          <div className="border-b border-gray-100 pb-6">
            <dt className="mb-1 font-semibold text-gray-500">連絡先</dt>
            <dd>
              メール：support@tomaran.net<br />
              電話：請求があった場合は遅延なく開示いたします
            </dd>
          </div>
          <div className="border-b border-gray-100 pb-6">
            <dt className="mb-1 font-semibold text-gray-500">サービス名</dt>
            <dd>建設クラウド</dd>
          </div>
          <div className="border-b border-gray-100 pb-6">
            <dt className="mb-1 font-semibold text-gray-500">販売価格</dt>
            <dd>月額 14,800円（税込）</dd>
          </div>
          <div className="border-b border-gray-100 pb-6">
            <dt className="mb-1 font-semibold text-gray-500">支払い方法</dt>
            <dd>クレジットカード（Visa・Mastercard・American Express・JCB）<br />
            決済代行：Stripe, Inc.</dd>
          </div>
          <div className="border-b border-gray-100 pb-6">
            <dt className="mb-1 font-semibold text-gray-500">支払い時期</dt>
            <dd>サブスクリプション登録時に初回決済。以降、毎月同日に自動更新。</dd>
          </div>
          <div className="border-b border-gray-100 pb-6">
            <dt className="mb-1 font-semibold text-gray-500">サービス提供時期</dt>
            <dd>決済完了後、即時利用可能。</dd>
          </div>
          <div className="border-b border-gray-100 pb-6">
            <dt className="mb-1 font-semibold text-gray-500">返金・キャンセルポリシー</dt>
            <dd>
              月額サブスクリプションのため、原則として決済済みの料金の返金は承っておりません。
              ただし、システム障害など当社側の事由による場合はこの限りではありません。
              解約後も当該月の末日までサービスをご利用いただけます。
            </dd>
          </div>
          <div className="pb-6">
            <dt className="mb-1 font-semibold text-gray-500">解約方法</dt>
            <dd>
              ダッシュボード内の「アカウント設定」→「サブスクリプションを解約する」より
              いつでも解約可能です。解約はお問い合わせ不要で即時反映されます。
            </dd>
          </div>
        </dl>
      </div>
    </div>
  )
}
