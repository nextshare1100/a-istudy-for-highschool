'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { TERMS_OF_SERVICE } from '@/constants/terms'

export default function TermsPage() {
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
          <div className="prose prose-sm sm:prose max-w-none">
            <div className="whitespace-pre-wrap text-sm sm:text-base leading-relaxed text-gray-700">
              {TERMS_OF_SERVICE.split('\n').map((line, index) => {
                // タイトル行のスタイリング
                if (index === 0) {
                  return (
                    <h1 key={index} className="text-2xl sm:text-3xl font-bold mb-4 text-gray-900">
                      {line}
                    </h1>
                  )
                }
                
                // 最終更新日のスタイリング
                if (line.startsWith('最終更新日:')) {
                  return (
                    <p key={index} className="text-gray-500 mb-6">
                      {line}
                    </p>
                  )
                }
                
                // 条文タイトルのスタイリング
                if (line.match(/^第\d+条/)) {
                  return (
                    <h2 key={index} className="text-lg sm:text-xl font-semibold mt-6 mb-3 text-gray-800">
                      {line}
                    </h2>
                  )
                }
                
                // セクション区切り
                if (line === '============================================================') {
                  return <hr key={index} className="my-8 border-gray-300" />
                }
                
                // プライバシーポリシータイトル
                if (line === 'プライバシーポリシー') {
                  return (
                    <h1 key={index} className="text-2xl sm:text-3xl font-bold mt-8 mb-4 text-gray-900">
                      {line}
                    </h1>
                  )
                }
                
                // 番号付きセクション
                if (line.match(/^\d+\./)) {
                  return (
                    <h3 key={index} className="text-base sm:text-lg font-semibold mt-6 mb-2 text-gray-800">
                      {line}
                    </h3>
                  )
                }
                
                // 箇条書き
                if (line.startsWith('・')) {
                  return (
                    <li key={index} className="ml-4 list-disc">
                      {line.substring(1)}
                    </li>
                  )
                }
                
                // 空行
                if (line.trim() === '') {
                  return <br key={index} />
                }
                
                // 通常の段落
                return (
                  <p key={index} className="mb-2">
                    {line}
                  </p>
                )
              })}
            </div>
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