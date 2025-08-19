// app/api/placeholder/[width]/[height]/route.ts

import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { width: string; height: string } }
) {
  const { width, height } = params
  const searchParams = request.nextUrl.searchParams
  const text = searchParams.get('text') || 'Product'
  
  // SVGでプレースホルダー画像を生成
  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${width}" height="${height}" fill="#f5f5f5"/>
      <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="16" fill="#999" text-anchor="middle" dy=".3em">
        ${text.replace(/\+/g, ' ')}
      </text>
    </svg>
  `
  
  return new NextResponse(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  })
}

// または、より良い解決策として、商品画像をローカルに保存する

// public/images/products/ に以下のファイルを配置：
// - campus-notebook.jpg
// - kurutoga-pencil.jpg  
// - muji-notebook.jpg
// など

// そして affiliate.ts で：
/*
const baseProducts: AffiliateProduct[] = [
  {
    asin: 'B00UKPV8XO',
    title: 'コクヨ キャンパスノート ドット入り罫線 5冊パック',
    price: 498,
    imageUrl: '/images/products/campus-notebook.jpg', // ローカル画像
    category: 'stationery',
    description: 'ドット入り罫線で文字が揃えやすく、図形も描きやすい定番ノート'
  },
  // ...
]
*/