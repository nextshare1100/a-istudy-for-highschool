'use client'

import { useState } from 'react'
import { verifyIOSReceipt, verifyAndroidPurchase } from '@/lib/services/subscription-service'
import { auth } from '@/lib/firebase/config'

export function PaymentTestButtons() {
  const [loading, setLoading] = useState(false)
  const isDevelopmentMode = process.env.NEXT_PUBLIC_PAYMENT_DEV_MODE === 'true'
  
  if (!isDevelopmentMode) return null
  
  const simulateIOSPurchase = async (productId: string) => {
    const user = auth.currentUser
    if (!user) {
      alert('ログインしてください')
      return
    }
    
    setLoading(true)
    try {
      // iOS購入をシミュレート
      const result = await verifyIOSReceipt(
        user.uid,
        'mock_receipt_' + Date.now(),
        'mock_transaction_' + Date.now(),
        productId,
        true
      )
      
      if (result.success) {
        alert(`✅ iOS決済シミュレーション成功\n商品ID: ${productId}`)
        
        // 開発環境ではリロードせずに成功メッセージのみ表示
        // 本番環境ではFirestoreの更新後にリロードが必要
      }
    } catch (error) {
      alert('エラーが発生しました')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }
  
  const simulateAndroidPurchase = async (productId: string) => {
    const user = auth.currentUser
    if (!user) {
      alert('ログインしてください')
      return
    }
    
    setLoading(true)
    try {
      // Android購入をシミュレート
      const result = await verifyAndroidPurchase(
        user.uid,
        'mock_token_' + Date.now(),
        productId,
        'mock_order_' + Date.now()
      )
      
      if (result.success) {
        alert(`✅ Android決済シミュレーション成功\n商品ID: ${productId}`)
        
        // 開発環境ではリロードせずに成功メッセージのみ表示
        // 本番環境ではFirestoreの更新後にリロードが必要
      }
    } catch (error) {
      alert('エラーが発生しました')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <div style={{
      position: 'fixed',
      bottom: '80px',
      right: '20px',
      backgroundColor: '#FFFFFF',
      border: '1px solid #E5E7EB',
      borderRadius: '12px',
      padding: '16px',
      boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
      zIndex: 1000,
      maxWidth: '320px'
    }}>
      <h3 style={{ 
        fontSize: '14px', 
        fontWeight: '600', 
        marginBottom: '12px',
        color: '#1F2937'
      }}>
        🧪 決済テストボタン
      </h3>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {/* iOS決済テスト */}
        <div>
          <p style={{ fontSize: '12px', color: '#6B7280', marginBottom: '4px' }}>
            iOS決済をシミュレート:
          </p>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => simulateIOSPurchase('com.aistudy.registration_fee')}
              disabled={loading}
              style={{
                flex: 1,
                padding: '6px 12px',
                fontSize: '12px',
                backgroundColor: '#3B82F6',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.5 : 1
              }}
            >
              初回登録料
            </button>
            <button
              onClick={() => simulateIOSPurchase('com.aistudy.monthly_subscription')}
              disabled={loading}
              style={{
                flex: 1,
                padding: '6px 12px',
                fontSize: '12px',
                backgroundColor: '#8B5CF6',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.5 : 1
              }}
            >
              月額プラン
            </button>
          </div>
        </div>
        
        {/* Android決済テスト */}
        <div style={{ marginTop: '8px' }}>
          <p style={{ fontSize: '12px', color: '#6B7280', marginBottom: '4px' }}>
            Android決済をシミュレート:
          </p>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => simulateAndroidPurchase('registration_fee')}
              disabled={loading}
              style={{
                flex: 1,
                padding: '6px 12px',
                fontSize: '12px',
                backgroundColor: '#10B981',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.5 : 1
              }}
            >
              初回登録料
            </button>
            <button
              onClick={() => simulateAndroidPurchase('monthly_subscription')}
              disabled={loading}
              style={{
                flex: 1,
                padding: '6px 12px',
                fontSize: '12px',
                backgroundColor: '#F59E0B',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.5 : 1
              }}
            >
              月額プラン
            </button>
          </div>
        </div>
      </div>
      
      {loading && (
        <p style={{ 
          fontSize: '11px', 
          color: '#6B7280', 
          marginTop: '8px',
          textAlign: 'center'
        }}>
          処理中...
        </p>
      )}
    </div>
  )
}