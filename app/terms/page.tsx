export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-8">
        <h1 className="text-3xl font-bold mb-8">利用規約</h1>
        <div className="prose max-w-none">
          <p>最終更新日: 2024年1月1日</p>
          
          <h2 className="text-xl font-semibold mt-6 mb-3">1. サービスの利用</h2>
          <p>本サービスは高校生向けの学習支援アプリケーションです。</p>
          
          <h2 className="text-xl font-semibold mt-6 mb-3">2. ユーザーの責任</h2>
          <p>ユーザーは本サービスを適切に利用する責任があります。</p>
          
          <h2 className="text-xl font-semibold mt-6 mb-3">3. プライバシー</h2>
          <p>個人情報の取り扱いについては、プライバシーポリシーをご確認ください。</p>
        </div>
      </div>
    </div>
  )
}
