'use client'

import { useState } from 'react'
import { verifyIOSReceipt, verifyAndroidPurchase } from '@/lib/services/subscription-service'
import { auth } from '@/lib/firebase/config'

export default function PaymentTestButtons() {
  console.log('PaymentTestButtons rendered')
  const [loading, setLoading] = useState<string | null>(null)
  const isDevelopmentMode = true // 一時的に強制的にtrue
  
  if (!isDevelopmentMode) {
    console.log('PaymentTestButtons hidden because isDevelopmentMode is false')
    return null
  }
  
  const handleTestPurchase = async (platform: 'ios' | 'android', productId: string) => {
    const user = auth.currentUser
    if (!user) {
      alert('ログインしてください')
      return
    }
    
    setLoading(`${platform}-${productId}`)
    
    try {
      let result
      if (platform === 'ios') {
        result = await verifyIOSReceipt(
          user.uid,
          'test_receipt_' + Date.now(),
          'test_transaction_' + Date.now(),
          productId
        )
      } else {
        result = await verifyAndroidPurchase(
          user.uid,
          'test_purchase_token_' + Date.now(),
          productId,
          'test_order_' + Date.now()
        )
      }
      
      if (result.success) {
        alert(`✅ ${platform === 'ios' ? 'iOS' : 'Android'}決済シミュレーション成功\n商品ID: ${productId}`)
        // ページをリロードして状態を更新
        window.location.reload()
      } else {
        alert('決済シミュレーション失敗')
      }
    } catch (error) {
      console.error('Test purchase error:', error)
      alert('エラーが発生しました: ' + (error as Error).message)
    } finally {
      setLoading(null)
    }
  }
  
  return (
    <div style={{
      position: 'fixed',
      bottom: '80px',
      right: '20px',
      backgroundColor: 'white',
      border: '2px solid #8B5CF6',
      borderRadius: '12px',
      padding: '16px',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
      zIndex: 1000,
      minWidth: '240px'
    }}>
      <div style={{ 
        fontWeight: '600', 
        marginBottom: '12px',
        color: '#7C3AED',
        fontSize: '14px'
      }}>
        🧪 決済テストボタン
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <button
          onClick={() => handleTestPurchase('ios', 'com.aistudy.registration_fee')}
          disabled={loading !== null}
          style={{
            padding: '8px 12px',
            borderRadius: '6px',
            border: '1px solid #E5E7EB',
            backgroundColor: loading === 'ios-com.aistudy.registration_fee' ? '#F3F4F6' : 'white',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: '12px',
            textAlign: 'left',
            transition: 'all 0.2s'
          }}
        >
          {loading === 'ios-com.aistudy.registration_fee' ? '処理中...' : '🍎 iOS 初回登録料 (¥500)'}
        </button>
        
        <button
          onClick={() => handleTestPurchase('ios', 'com.aistudy.monthly_subscription')}
          disabled={loading !== null}
          style={{
            padding: '8px 12px',
            borderRadius: '6px',
            border: '1px solid #E5E7EB',
            backgroundColor: loading === 'ios-com.aistudy.monthly_subscription' ? '#F3F4F6' : 'white',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: '12px',
            textAlign: 'left',
            transition: 'all 0.2s'
          }}
        >
          {loading === 'ios-com.aistudy.monthly_subscription' ? '処理中...' : '🍎 iOS 月額プラン (¥980)'}
        </button>
        
        <button
          onClick={() => handleTestPurchase('android', 'registration_fee')}
          disabled={loading !== null}
          style={{
            padding: '8px 12px',
            borderRadius: '6px',
            border: '1px solid #E5E7EB',
            backgroundColor: loading === 'android-registration_fee' ? '#F3F4F6' : 'white',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: '12px',
            textAlign: 'left',
            transition: 'all 0.2s'
          }}
        >
          {loading === 'android-registration_fee' ? '処理中...' : '🤖 Android 初回登録料 (¥500)'}
        </button>
        
        <button
          onClick={() => handleTestPurchase('android', 'monthly_subscription')}
          disabled={loading !== null}
          style={{
            padding: '8px 12px',
            borderRadius: '6px',
            border: '1px solid #E5E7EB',
            backgroundColor: loading === 'android-monthly_subscription' ? '#F3F4F6' : 'white',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: '12px',
            textAlign: 'left',
            transition: 'all 0.2s'
          }}
        >
          {loading === 'android-monthly_subscription' ? '処理中...' : '🤖 Android 月額プラン (¥980)'}
        </button>
      </div>
    </div>
  )
}