export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-8">
        <h1 className="text-3xl font-bold mb-8">プライバシーポリシー</h1>
        <div className="prose max-w-none">
          <p>最終更新日: 2024年1月1日</p>
          
          <h2 className="text-xl font-semibold mt-6 mb-3">1. 収集する情報</h2>
          <p>学習履歴、成績データ、ユーザープロファイル情報を収集します。</p>
          
          <h2 className="text-xl font-semibold mt-6 mb-3">2. 情報の利用目的</h2>
          <p>収集した情報は、学習効果の向上とサービス改善のために利用します。</p>
          
          <h2 className="text-xl font-semibold mt-6 mb-3">3. 情報の保護</h2>
          <p>適切なセキュリティ対策により、個人情報を保護します。</p>
        </div>
      </div>
    </div>
  )
}
