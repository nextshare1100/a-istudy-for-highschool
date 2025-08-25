'use client'

export default function DevModeIndicator() {
  console.log('DevModeIndicator rendered')
  const isDevelopmentMode = true
  
  if (!isDevelopmentMode) {
    console.log('DevModeIndicator hidden because isDevelopmentMode is false')
    return null
  }
  
  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      backgroundColor: '#FEF3C7',
      border: '1px solid #F59E0B',
      borderRadius: '8px',
      padding: '12px 16px',
      fontSize: '12px',
      color: '#92400E',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
      zIndex: 1000,
      maxWidth: '300px'
    }}>
      <div style={{ fontWeight: '600', marginBottom: '4px' }}>
        🔧 開発モード
      </div>
      <div>
        決済処理はモックで動作しています。
        実際の課金は発生しません。
      </div>
    </div>
  )
}