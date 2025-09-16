'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'

export default function PrivacyPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-gray-50 py-6 px-4 sm:py-12">
      <div className="max-w-4xl mx-auto">
        {/* ヘッダー */}
        <div className="mb-6 sm:mb-8">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft size={20} />
            <span>戻る</span>
          </button>
        </div>

        {/* コンテンツ */}
        <div className="bg-white rounded-lg shadow-md p-6 sm:p-8">
          <h1 className="text-2xl sm:text-3xl font-bold mb-4 text-gray-900">
            プライバシーポリシー
          </h1>
          
          <p className="text-gray-500 mb-6">最終更新日: 2025年9月10日</p>
          
          <div className="prose prose-sm sm:prose max-w-none text-gray-700">
            <p className="mb-6">
              株式会社ネクシェア（以下「当社」といいます。）は、A-IStudyサービス（以下「本サービス」といいます。）における個人情報の取扱いについて、以下のとおりプライバシーポリシーを定めます。
            </p>

            <section className="mb-8">
              <h2 className="text-lg sm:text-xl font-semibold mb-4 text-gray-800">
                1. 収集する情報
              </h2>
              <p className="mb-2">当社は、本サービスの提供にあたり、以下の情報を収集します：</p>
              <ul className="list-disc ml-6 space-y-1">
                <li>アカウント情報（氏名、メールアドレス、パスワード）</li>
                <li>学年情報</li>
                <li>学習履歴（問題演習記録、学習時間、成績データ）</li>
                <li>アクセスログ（IPアドレス、ブラウザ情報）</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-lg sm:text-xl font-semibold mb-4 text-gray-800">
                2. 情報の利用目的
              </h2>
              <p className="mb-2">収集した情報は以下の目的で利用します：</p>
              <ul className="list-disc ml-6 space-y-1">
                <li>本サービスの提供、維持、改善</li>
                <li>ユーザーサポートの提供</li>
                <li>学習効果の分析とフィードバック</li>
                <li>利用規約違反の調査、対応</li>
                <li>法令に基づく対応</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-lg sm:text-xl font-semibold mb-4 text-gray-800">
                3. 情報の共有
              </h2>
              <p className="mb-2">当社は、以下の場合を除き、個人情報を第三者に提供しません：</p>
              <ul className="list-disc ml-6 space-y-1">
                <li>ユーザーの同意がある場合</li>
                <li>法令に基づく場合</li>
                <li>人の生命、身体または財産の保護のために必要な場合</li>
                <li>公衆衛生の向上または児童の健全な育成の推進のために必要な場合</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-lg sm:text-xl font-semibold mb-4 text-gray-800">
                4. 情報の保護
              </h2>
              <p>
                当社は、個人情報の漏洩、滅失、毀損の防止その他の安全管理のために必要かつ適切な措置を講じます。
                具体的には、SSL暗号化通信の使用、アクセス制限、定期的なセキュリティ監査等を実施しています。
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-lg sm:text-xl font-semibold mb-4 text-gray-800">
                5. Cookieの使用
              </h2>
              <p>
                本サービスでは、サービス向上のためCookieを使用しています。
                Cookieは、ユーザーの設定情報の保存、ログイン状態の維持、利用状況の分析等に使用されます。
                ブラウザの設定によりCookieを無効にすることができますが、一部機能が利用できなくなる場合があります。
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-lg sm:text-xl font-semibold mb-4 text-gray-800">
                6. 未成年者の個人情報
              </h2>
              <p>
                本サービスは13歳以上の方を対象としています。
                18歳未満の利用者については、保護者の同意を得た上でサービスを利用していただくものとします。
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-lg sm:text-xl font-semibold mb-4 text-gray-800">
                7. 個人情報の開示・訂正・削除
              </h2>
              <p>
                ユーザーは、当社が保有する自己の個人情報について、開示、訂正、削除を請求することができます。
                請求の際は、本人確認のための手続きを行わせていただきます。
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-lg sm:text-xl font-semibold mb-4 text-gray-800">
                8. お問い合わせ
              </h2>
              <p>
                個人情報の取扱いに関するお問い合わせは、アプリ内の問い合わせフォームまたは
                以下のメールアドレスまでご連絡ください：
              </p>
              <p className="mt-2 font-medium">
                support@a-istudy.com
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-lg sm:text-xl font-semibold mb-4 text-gray-800">
                9. 改定
              </h2>
              <p>
                本プライバシーポリシーは、法令の改正や当社の判断により、予告なく改定される場合があります。
                改定後のプライバシーポリシーは、本サービス上に掲載した時点から効力を生じるものとします。
              </p>
            </section>
          </div>
        </div>

        {/* フッター */}
        <div className="mt-8 text-center">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <ArrowLeft size={18} />
            前のページに戻る
          </button>
        </div>
      </div>
    </div>
  )
}