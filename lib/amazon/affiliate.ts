// lib/amazon/affiliate.ts の修正版

import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit,
  Timestamp 
} from 'firebase/firestore'
import { db } from '@/lib/firebase/config'

export interface AffiliateProduct {
  asin: string
  title: string
  price: number
  imageUrl: string
  category: 'stationery' | 'study-guides' | 'electronics' | 'health'
  description?: string
  recommendationReason?: string
}

export interface AffiliateClick {
  userId: string
  productAsin: string
  productTitle: string
  timestamp: Timestamp
  category: string
}

interface RecommendationParams {
  userId: string
  weakSubjects?: string[]
  userLevel?: 'beginner' | 'intermediate' | 'advanced'
  studyHours?: number
}

// Amazonアフィリエイトリンクを生成
export const generateAffiliateLink = (asin: string): string => {
  const affiliateTag = process.env.NEXT_PUBLIC_AMAZON_AFFILIATE_TAG || 'your-tag-20'
  return `https://www.amazon.co.jp/dp/${asin}?tag=${affiliateTag}`
}

// クリックをトラッキング
export const trackAffiliateClick = async (product: AffiliateProduct, userId: string) => {
  try {
    const clickData: AffiliateClick = {
      userId,
      productAsin: product.asin,
      productTitle: product.title,
      timestamp: Timestamp.now(),
      category: product.category
    }
    
    await setDoc(doc(collection(db, 'affiliateClicks')), clickData)
  } catch (error) {
    console.error('Error tracking affiliate click:', error)
  }
}

// パーソナライズされた商品推薦
export const getPersonalizedRecommendations = async ({
  userId,
  weakSubjects = [],
  userLevel = 'intermediate',
  studyHours = 0
}: RecommendationParams): Promise<AffiliateProduct[]> => {
  
  // 基本の商品リスト（プレースホルダー画像を使用）
  const baseProducts: AffiliateProduct[] = [
    {
      asin: 'B00UKPV8XO',
      title: 'コクヨ キャンパスノート ドット入り罫線 5冊パック',
      price: 498,
      imageUrl: '/api/placeholder/300/300?text=Campus+Notebook',
      category: 'stationery',
      description: 'ドット入り罫線で文字が揃えやすく、図形も描きやすい定番ノート'
    },
    {
      asin: 'B006CQKHIW',
      title: '三菱鉛筆 クルトガ アドバンス 0.5mm',
      price: 550,
      imageUrl: '/api/placeholder/300/300?text=Kurutoga+0.5mm',
      category: 'stationery',
      description: '芯が回ってトガり続ける！集中力を切らさない革新的シャープペンシル'
    },
    {
      asin: 'B0C4PKMGQK',
      title: '無印良品 植林木ペーパー裏うつりしにくいノート5冊組',
      price: 390,
      imageUrl: '/api/placeholder/300/300?text=MUJI+Notebook',
      category: 'stationery',
      description: 'シンプルで使いやすい、裏うつりしにくい高品質ノート'
    }
  ]

  // 科目別の参考書
  const subjectBooks: { [key: string]: AffiliateProduct[] } = {
    '数学': [
      {
        asin: 'B08KDRJB5Y',
        title: 'チャート式基礎からの数学I+A',
        price: 2090,
        imageUrl: 'https://m.media-amazon.com/images/I/71jZLzg9nXL._AC_SL1500_.jpg',
        category: 'study-guides',
        description: '基礎から応用まで段階的に学べる定番参考書'
      }
    ],
    '英語': [
      {
        asin: 'B07FMGR3C7',
        title: 'システム英単語',
        price: 1100,
        imageUrl: 'https://m.media-amazon.com/images/I/51Ht8qPVVJL._AC_SL1000_.jpg',
        category: 'study-guides',
        description: '大学受験に必要な英単語を効率的に学習'
      }
    ],
    '物理': [
      {
        asin: 'B07PJD9M8N',
        title: '物理のエッセンス 力学・波動',
        price: 924,
        imageUrl: 'https://m.media-amazon.com/images/I/51vZJ8g0vWL._AC_SL1000_.jpg',
        category: 'study-guides',
        description: '物理の基本概念を分かりやすく解説'
      }
    ]
  }

  // 学習レベル別の商品
  const levelProducts: { [key: string]: AffiliateProduct[] } = {
    beginner: [
      {
        asin: 'B0BM3MVBKW',
        title: 'Pomera DM30 デジタルメモ',
        price: 29800,
        imageUrl: 'https://m.media-amazon.com/images/I/71N6Vfg5YFL._AC_SL1500_.jpg',
        category: 'electronics',
        description: 'どこでも使えるポータブルメモツール'
      }
    ],
    intermediate: [
      {
        asin: 'B09Y5P2YQ9',
        title: 'タイムタイマー MOD',
        price: 4950,
        imageUrl: 'https://m.media-amazon.com/images/I/71n1p3XJDTL._AC_SL1500_.jpg',
        category: 'stationery',
        description: '時間管理を視覚化！集中力アップに効果的'
      }
    ],
    advanced: [
      {
        asin: 'B0BB2D9YYC',
        title: 'スタンディングデスク 電動昇降式',
        price: 35800,
        imageUrl: 'https://m.media-amazon.com/images/I/71qYF4zKhUL._AC_SL1500_.jpg',
        category: 'electronics',
        description: '長時間の学習でも疲れにくい、健康的な学習環境を実現'
      }
    ]
  }

  // 学習時間に応じた健康グッズ
  const healthProducts: AffiliateProduct[] = studyHours > 50 ? [
    {
      asin: 'B07D77MMRJ',
      title: 'めぐりズム蒸気でホットアイマスク',
      price: 1100,
      imageUrl: 'https://m.media-amazon.com/images/I/71YEFTU9VnL._AC_SL1500_.jpg',
      category: 'health',
      description: '勉強で疲れた目を癒すリラックスアイテム'
    },
    {
      asin: 'B08Y8QZQ7P',
      title: 'ブルーライトカットメガネ',
      price: 2980,
      imageUrl: 'https://m.media-amazon.com/images/I/71iOTJpKvPL._AC_SL1500_.jpg',
      category: 'health',
      description: '長時間の画面学習から目を守る'
    }
  ] : []

  // 汎用的な学習グッズ（データがない場合のデフォルト）
  const universalProducts: AffiliateProduct[] = [
    {
      asin: 'B09T3GFQMD',
      title: 'ぺんてる スマッシュ 0.5mm シャープペンシル',
      price: 880,
      imageUrl: 'https://m.media-amazon.com/images/I/61nYDBbKV1L._AC_SL1500_.jpg',
      category: 'stationery',
      description: 'プロも愛用する書きやすさ抜群のシャープペンシル',
      recommendationReason: '受験生に人気No.1'
    },
    {
      asin: 'B0979JXLGK',
      title: 'トンボ鉛筆 MONO 消しゴム 10個セット',
      price: 660,
      imageUrl: 'https://m.media-amazon.com/images/I/71VKy8rVYhL._AC_SL1500_.jpg',
      category: 'stationery',
      description: '消しやすさNo.1！受験の必需品',
      recommendationReason: '受験生の定番アイテム'
    },
    {
      asin: 'B08CXQRQF3',
      title: 'カンミ堂 ふせん ペントネ',
      price: 880,
      imageUrl: 'https://m.media-amazon.com/images/I/71mipwNYPXL._AC_SL1500_.jpg',
      category: 'stationery',
      description: 'ペンのように持ち運べる便利な付箋',
      recommendationReason: '効率的な学習に'
    }
  ]

  // 推薦商品を組み立て
  let recommendations: AffiliateProduct[] = []
  
  // データがない場合は汎用商品から開始
  if (weakSubjects.length === 0 && studyHours < 10) {
    recommendations = [...baseProducts, ...universalProducts]
    recommendations.forEach(product => {
      if (!product.recommendationReason) {
        product.recommendationReason = '学習の基本アイテム'
      }
    })
  } else {
    // 基本商品は常に含める
    recommendations = [...baseProducts]
    
    // 弱い科目の参考書を追加
    if (weakSubjects.length > 0) {
      for (const subject of weakSubjects) {
        if (subjectBooks[subject]) {
          const books = subjectBooks[subject]
          books.forEach(book => {
            book.recommendationReason = `${subject}の成績向上におすすめ`
          })
          recommendations.push(...books)
        }
      }
    }
    
    // レベルに応じた商品を追加
    if (levelProducts[userLevel] && studyHours > 20) {
      const products = levelProducts[userLevel]
      products.forEach(product => {
        product.recommendationReason = `${userLevel === 'beginner' ? '初級者' : userLevel === 'intermediate' ? '中級者' : '上級者'}向け`
      })
      recommendations.push(...products)
    }
    
    // 学習時間が多い場合は健康グッズを追加
    if (healthProducts.length > 0) {
      healthProducts.forEach(product => {
        product.recommendationReason = '長時間学習のサポートに'
      })
      recommendations.push(...healthProducts)
    }
  }

  // 重複を除去して最大6個まで返す
  const uniqueProducts = recommendations.filter((product, index, self) =>
    index === self.findIndex((p) => p.asin === product.asin)
  ).slice(0, 6)

  return uniqueProducts
}

// 商品の詳細情報を取得
export const getProductDetails = async (asin: string): Promise<AffiliateProduct | null> => {
  try {
    const docRef = doc(db, 'affiliateProducts', asin)
    const docSnap = await getDoc(docRef)
    
    if (docSnap.exists()) {
      return docSnap.data() as AffiliateProduct
    }
    return null
  } catch (error) {
    console.error('Error fetching product details:', error)
    return null
  }
}

// ユーザーのクリック履歴を取得
export const getUserClickHistory = async (userId: string, limit: number = 10): Promise<AffiliateClick[]> => {
  try {
    const q = query(
      collection(db, 'affiliateClicks'),
      where('userId', '==', userId),
      orderBy('timestamp', 'desc'),
      limit(limit)
    )
    
    const querySnapshot = await getDocs(q)
    return querySnapshot.docs.map(doc => doc.data() as AffiliateClick)
  } catch (error) {
    console.error('Error fetching click history:', error)
    return []
  }
}