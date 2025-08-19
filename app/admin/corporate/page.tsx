'use client';

import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  QrCode,
  Loader2, 
  CheckCircle2, 
  AlertCircle,
  ArrowRight,
  Shield,
  Users,
  Sparkles,
  Info,
  Camera,
  Image
} from 'lucide-react';

export default function CorporateActivationPage() {
  const [corporateId, setCorporateId] = useState('');
  const [isActivating, setIsActivating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  
  // レスポンシブ対応
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // ファイル選択（写真ライブラリ）からQRコード読み取り
  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsScanning(true);
    setError(null);

    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const mockCorporateId = 'CORP-' + Math.random().toString(36).substr(2, 9).toUpperCase();
      setCorporateId(mockCorporateId);
      
      await handleActivateWithId(mockCorporateId);
      
    } catch (err) {
      setError('QRコードの読み取りに失敗しました');
    } finally {
      setIsScanning(false);
      event.target.value = '';
    }
  };

  // カメラからQRコード読み取り
  const handleCameraCapture = async () => {
    setIsScanning(true);
    setError(null);

    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const mockCorporateId = 'CORP-' + Math.random().toString(36).substr(2, 9).toUpperCase();
      setCorporateId(mockCorporateId);
      
      await handleActivateWithId(mockCorporateId);
      
    } catch (err) {
      setError('カメラへのアクセスが拒否されました');
    } finally {
      setIsScanning(false);
    }
  };

  // 法人ID有効化処理（ID指定版）
  const handleActivateWithId = async (id: string) => {
    if (!id.trim()) {
      setError('法人IDを入力してください');
      return;
    }

    setIsActivating(true);
    setError(null);

    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const isValid = Math.random() > 0.3;
      
      if (isValid) {
        setSuccess(true);
      } else {
        throw new Error('無効な法人IDです。企業・学校の管理者にご確認ください。');
      }
      
    } catch (err) {
      setError(err instanceof Error ? err.message : '法人契約の有効化に失敗しました');
    } finally {
      setIsActivating(false);
    }
  };

  // 法人ID有効化処理
  const handleActivate = async () => {
    await handleActivateWithId(corporateId);
  };

  // スタイル定義
  const styles = {
    wrapper: {
      backgroundColor: '#f8fafc',
      minHeight: '100vh',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Hiragino Sans", sans-serif',
    },
    container: {
      maxWidth: '800px',
      margin: '0 auto',
      padding: isMobile ? '16px' : '24px',
    },
    header: {
      textAlign: 'center' as const,
      paddingTop: isMobile ? '24px' : '48px',
      paddingBottom: isMobile ? '16px' : '32px',
    },
    badge: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: isMobile ? '4px' : '6px',
      padding: isMobile ? '4px 12px' : '6px 16px',
      backgroundColor: '#e0e7ff',
      color: '#4338ca',
      borderRadius: '20px',
      fontSize: isMobile ? '12px' : '14px',
      fontWeight: '600',
      marginBottom: isMobile ? '12px' : '16px',
    },
    title: {
      fontSize: isMobile ? '24px' : '36px',
      fontWeight: '800',
      color: '#1f2937',
      marginBottom: isMobile ? '12px' : '16px',
      lineHeight: 1.2,
    },
    subtitle: {
      fontSize: isMobile ? '14px' : '18px',
      color: '#6b7280',
      maxWidth: '600px',
      margin: '0 auto',
      lineHeight: 1.6,
    },
    benefitsCard: {
      backgroundColor: 'white',
      borderRadius: isMobile ? '12px' : '16px',
      padding: isMobile ? '16px' : '24px',
      marginBottom: isMobile ? '16px' : '24px',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
      border: '1px solid #e5e7eb',
    },
    benefitsTitle: {
      fontSize: isMobile ? '14px' : '16px',
      fontWeight: '700',
      color: '#1f2937',
      marginBottom: isMobile ? '12px' : '16px',
      display: 'flex',
      alignItems: 'center',
      gap: isMobile ? '6px' : '8px',
    },
    benefitsList: {
      display: 'grid',
      gap: isMobile ? '10px' : '12px',
    },
    benefitItem: {
      display: 'flex',
      alignItems: 'flex-start',
      gap: isMobile ? '10px' : '12px',
    },
    benefitIcon: {
      width: isMobile ? '28px' : '32px',
      height: isMobile ? '28px' : '32px',
      borderRadius: '8px',
      backgroundColor: '#dbeafe',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    },
    benefitContent: {
      flex: 1,
    },
    benefitTitle: {
      fontSize: isMobile ? '13px' : '14px',
      fontWeight: '600',
      color: '#1f2937',
      marginBottom: '2px',
    },
    benefitDescription: {
      fontSize: isMobile ? '12px' : '13px',
      color: '#6b7280',
    },
    mainCard: {
      backgroundColor: 'white',
      borderRadius: isMobile ? '16px' : '20px',
      padding: isMobile ? '20px' : '32px',
      boxShadow: '0 10px 20px rgba(0, 0, 0, 0.05)',
      border: '1px solid #e5e7eb',
      marginBottom: isMobile ? '16px' : '24px',
    },
    inputSection: {
      marginBottom: isMobile ? '20px' : '24px',
    },
    label: {
      display: 'block',
      fontSize: isMobile ? '13px' : '14px',
      fontWeight: '600',
      color: '#374151',
      marginBottom: isMobile ? '6px' : '8px',
    },
    inputWrapper: {
      position: 'relative' as const,
    },
    input: {
      width: '100%',
      padding: isMobile ? '12px 14px' : '14px 16px',
      borderRadius: isMobile ? '10px' : '12px',
      border: '2px solid #e5e7eb',
      fontSize: isMobile ? '14px' : '16px',
      fontFamily: 'monospace',
      textTransform: 'uppercase' as const,
      transition: 'all 0.2s',
      boxSizing: 'border-box' as const,
    },
    inputHelper: {
      fontSize: isMobile ? '11px' : '12px',
      color: '#6b7280',
      marginTop: isMobile ? '6px' : '8px',
    },
    qrButtonContainer: {
      display: 'flex',
      gap: isMobile ? '10px' : '12px',
      marginTop: isMobile ? '12px' : '16px',
      flexDirection: isMobile ? 'column' as const : 'row' as const,
    },
    qrButton: {
      flex: 1,
      padding: isMobile ? '10px 16px' : '12px 20px',
      borderRadius: isMobile ? '8px' : '10px',
      border: '1px solid #e5e7eb',
      backgroundColor: 'white',
      color: '#4b5563',
      fontSize: isMobile ? '13px' : '14px',
      fontWeight: '600',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: isMobile ? '6px' : '8px',
      transition: 'all 0.2s',
    },
    fileInput: {
      display: 'none',
    },
    submitButton: {
      width: '100%',
      padding: isMobile ? '14px 20px' : '16px 24px',
      borderRadius: isMobile ? '10px' : '12px',
      border: 'none',
      backgroundColor: '#3b82f6',
      color: 'white',
      fontSize: isMobile ? '14px' : '16px',
      fontWeight: '700',
      cursor: 'pointer',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: isMobile ? '6px' : '8px',
      transition: 'all 0.2s',
    },
    errorAlert: {
      backgroundColor: '#fee2e2',
      border: '1px solid #fca5a5',
      borderRadius: isMobile ? '10px' : '12px',
      padding: isMobile ? '12px' : '16px',
      marginBottom: isMobile ? '12px' : '16px',
      display: 'flex',
      alignItems: 'flex-start',
      gap: isMobile ? '10px' : '12px',
    },
    successCard: {
      backgroundColor: 'white',
      borderRadius: isMobile ? '16px' : '20px',
      padding: isMobile ? '24px 20px' : '48px',
      textAlign: 'center' as const,
      boxShadow: '0 10px 20px rgba(0, 0, 0, 0.05)',
      border: '1px solid #e5e7eb',
    },
    successIcon: {
      width: isMobile ? '64px' : '80px',
      height: isMobile ? '64px' : '80px',
      borderRadius: '50%',
      backgroundColor: '#dcfce7',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      margin: isMobile ? '0 auto 20px' : '0 auto 24px',
    },
    successTitle: {
      fontSize: isMobile ? '22px' : '28px',
      fontWeight: '700',
      color: '#1f2937',
      marginBottom: isMobile ? '10px' : '12px',
    },
    successDescription: {
      fontSize: isMobile ? '14px' : '16px',
      color: '#6b7280',
      marginBottom: isMobile ? '24px' : '32px',
      lineHeight: 1.6,
    },
    successBenefits: {
      backgroundColor: '#f0fdf4',
      borderRadius: isMobile ? '10px' : '12px',
      padding: isMobile ? '16px' : '20px',
      marginBottom: isMobile ? '24px' : '32px',
      textAlign: 'left' as const,
    },
    homeButton: {
      padding: isMobile ? '12px 24px' : '14px 32px',
      borderRadius: isMobile ? '8px' : '10px',
      border: 'none',
      backgroundColor: '#3b82f6',
      color: 'white',
      fontSize: isMobile ? '14px' : '16px',
      fontWeight: '600',
      cursor: 'pointer',
      display: 'inline-flex',
      alignItems: 'center',
      gap: isMobile ? '6px' : '8px',
      transition: 'all 0.2s',
    },
    infoCard: {
      backgroundColor: '#eff6ff',
      borderRadius: isMobile ? '10px' : '12px',
      padding: isMobile ? '12px' : '16px',
      marginTop: isMobile ? '16px' : '24px',
      display: 'flex',
      gap: isMobile ? '10px' : '12px',
      alignItems: 'flex-start',
    },
    infoContent: {
      flex: 1,
      fontSize: isMobile ? '12px' : '13px',
      color: '#1e40af',
      lineHeight: 1.5,
    },
    scanningOverlay: {
      position: 'fixed' as const,
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
    },
    scanningCard: {
      backgroundColor: 'white',
      borderRadius: isMobile ? '12px' : '16px',
      padding: isMobile ? '24px' : '32px',
      textAlign: 'center' as const,
      maxWidth: isMobile ? '280px' : '320px',
    },
    scanningIcon: {
      width: isMobile ? '48px' : '64px',
      height: isMobile ? '48px' : '64px',
      margin: isMobile ? '0 auto 12px' : '0 auto 16px',
      animation: 'pulse 2s infinite',
    },
    scanningText: {
      fontSize: isMobile ? '14px' : '16px',
      color: '#1f2937',
      fontWeight: '600',
    },
  };

  // 成功画面
  if (success) {
    return (
      <div style={styles.wrapper}>
        <div style={styles.container}>
          <div style={styles.successCard}>
            <div style={styles.successIcon}>
              <CheckCircle2 size={isMobile ? 32 : 40} color="#22c55e" />
            </div>
            <h1 style={styles.successTitle}>
              法人契約が有効化されました！
            </h1>
            <p style={styles.successDescription}>
              プレミアムプランのすべての機能が無料でご利用いただけます。
              企業・学校の契約期間中は、追加料金は一切かかりません。
            </p>
            
            <div style={styles.successBenefits}>
              <h3 style={{ 
                fontSize: isMobile ? '14px' : '16px', 
                fontWeight: '600', 
                marginBottom: isMobile ? '10px' : '12px' 
              }}>
                利用可能な機能：
              </h3>
              <ul style={{ 
                margin: 0, 
                paddingLeft: isMobile ? '16px' : '20px', 
                color: '#059669',
                fontSize: isMobile ? '13px' : '14px'
              }}>
                <li>AIによる学習分析と最適化</li>
                <li>全教科の学習管理システム</li>
                <li>詳細な進捗レポートとグラフ</li>
                <li>24時間365日のサポート</li>
              </ul>
            </div>
            
            <button
              style={styles.homeButton}
              onClick={() => console.log('Navigate to home')}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#2563eb';
                e.currentTarget.style.transform = 'scale(1.02)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#3b82f6';
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              学習を始める
              <ArrowRight size={isMobile ? 16 : 20} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // メイン画面
  return (
    <div style={styles.wrapper}>
      <div style={styles.container}>
        {/* ヘッダー */}
        <div style={styles.header}>
          <div style={styles.badge}>
            <Building2 size={isMobile ? 14 : 16} />
            法人契約
          </div>
          <h1 style={styles.title}>
            法人契約を有効化
          </h1>
          <p style={styles.subtitle}>
            企業・学校から提供された法人IDまたはQRコードを使用して、
            無料でプレミアムプランをご利用いただけます。
          </p>
        </div>

        {/* 特典説明カード */}
        <div style={styles.benefitsCard}>
          <h2 style={styles.benefitsTitle}>
            <Sparkles size={isMobile ? 16 : 18} />
            法人契約の特典
          </h2>
          <div style={styles.benefitsList}>
            <div style={styles.benefitItem}>
              <div style={styles.benefitIcon}>
                <Shield size={isMobile ? 16 : 18} color="#3b82f6" />
              </div>
              <div style={styles.benefitContent}>
                <div style={styles.benefitTitle}>月額料金が無料</div>
                <div style={styles.benefitDescription}>
                  通常月額980円のプレミアムプランが無料で利用可能
                </div>
              </div>
            </div>
            <div style={styles.benefitItem}>
              <div style={styles.benefitIcon}>
                <Users size={isMobile ? 16 : 18} color="#3b82f6" />
              </div>
              <div style={styles.benefitContent}>
                <div style={styles.benefitTitle}>組織全体でのサポート</div>
                <div style={styles.benefitDescription}>
                  同じ組織の仲間と一緒に学習を進められます
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* メインカード */}
        <div style={styles.mainCard}>
          {/* エラー表示 */}
          {error && (
            <div style={styles.errorAlert}>
              <AlertCircle size={isMobile ? 18 : 20} color="#ef4444" style={{ flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ 
                  fontWeight: '600', 
                  color: '#7f1d1d', 
                  marginBottom: '4px',
                  fontSize: isMobile ? '13px' : '14px'
                }}>
                  エラー
                </div>
                <div style={{ 
                  fontSize: isMobile ? '12px' : '14px', 
                  color: '#991b1b' 
                }}>
                  {error}
                </div>
              </div>
            </div>
          )}

          {/* 法人ID入力セクション */}
          <div>
            <div style={styles.inputSection}>
              <label style={styles.label}>
                法人ID
              </label>
              <div style={styles.inputWrapper}>
                <input
                  style={styles.input}
                  type="text"
                  value={corporateId}
                  onChange={(e) => setCorporateId(e.target.value.toUpperCase())}
                  placeholder="例: CORP-ABC123XYZ"
                  disabled={isActivating || isScanning}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#3b82f6';
                    setError(null);
                  }}
                  onBlur={(e) => e.currentTarget.style.borderColor = '#e5e7eb'}
                />
                <div style={styles.inputHelper}>
                  企業・学校の管理者から提供された法人IDを入力してください
                </div>
              </div>

              {/* QRコード読み取りボタン */}
              <div style={styles.qrButtonContainer}>
                <button
                  style={styles.qrButton}
                  onClick={handleCameraCapture}
                  disabled={isActivating || isScanning}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
                >
                  <Camera size={isMobile ? 16 : 18} />
                  カメラでQRコード撮影
                </button>
                
                <label style={styles.qrButton}>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    style={styles.fileInput}
                    disabled={isActivating || isScanning}
                  />
                  <Image size={isMobile ? 16 : 18} />
                  写真からQRコード読込
                </label>
              </div>
            </div>

            <button
              style={{
                ...styles.submitButton,
                opacity: isActivating || isScanning ? 0.6 : 1,
                cursor: isActivating || isScanning ? 'not-allowed' : 'pointer',
              }}
              onClick={handleActivate}
              disabled={isActivating || isScanning}
              onMouseEnter={(e) => {
                if (!isActivating && !isScanning) {
                  e.currentTarget.style.backgroundColor = '#2563eb';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 10px 20px rgba(59, 130, 246, 0.3)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#3b82f6';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              {isActivating ? (
                <>
                  <Loader2 size={isMobile ? 16 : 20} className="animate-spin" />
                  確認中...
                </>
              ) : (
                <>
                  有効化する
                  <ArrowRight size={isMobile ? 16 : 20} />
                </>
              )}
            </button>
          </div>
        </div>

        {/* 情報カード */}
        <div style={styles.infoCard}>
          <Info size={isMobile ? 16 : 20} color="#1e40af" style={{ flexShrink: 0 }} />
          <div style={styles.infoContent}>
            <strong>ご注意：</strong>
            法人IDは企業・学校の管理者から配布されます。
            QRコードは配布された資料に記載されています。
            不明な場合は、所属組織の担当者にお問い合わせください。
          </div>
        </div>
      </div>
      
      {/* スキャン中のオーバーレイ */}
      {isScanning && (
        <div style={styles.scanningOverlay}>
          <div style={styles.scanningCard}>
            <QrCode size={isMobile ? 48 : 64} style={styles.scanningIcon} />
            <p style={styles.scanningText}>QRコードを読み取っています...</p>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .animate-spin {
          animation: spin 1s linear infinite;
        }
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: .5;
          }
        }
      `}</style>
    </div>
  );
}