import { ReactNode } from 'react'

interface PageWrapperProps {
  children: ReactNode
  title?: string
  description?: string
}

export function PageWrapper({ children, title, description }: PageWrapperProps) {
  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* 装飾的な背景要素 */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="decorative-blob top-0 -left-40 w-80 h-80 bg-purple-300"></div>
        <div className="decorative-blob top-0 right-0 w-96 h-96 bg-blue-300"></div>
        <div className="decorative-blob bottom-0 left-1/2 w-72 h-72 bg-indigo-300"></div>
      </div>
      
      {/* メインコンテンツ */}
      <div className="relative z-10 page-container animate-fade-in">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {title && (
            <div className="mb-12 text-center">
              <h1 className="text-6xl font-black gradient-text mb-4 animate-slide-up">
                {title}
              </h1>
              {description && (
                <p className="text-2xl text-gray-600 animate-slide-up" style={{ animationDelay: '0.1s' }}>
                  {description}
                </p>
              )}
            </div>
          )}
          <div className="space-y-8">
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}
