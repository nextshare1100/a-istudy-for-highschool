import React, { useRef, useState, useEffect } from 'react';
import { StyleSheet, View, SafeAreaView, ActivityIndicator, Text, Alert, Platform } from 'react-native';
import { WebView } from 'react-native-webview';
import { StatusBar } from 'expo-status-bar';

// 開発環境チェック
const isDevelopment = __DEV__;

export default function App() {
  const webViewRef = useRef<WebView>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPurchasing, setIsPurchasing] = useState(false);

  useEffect(() => {
    // 開発環境の場合はIAP初期化をスキップ
    if (!isDevelopment) {
      initializeIAP();
    } else {
      console.log('開発環境のため、アプリ内購入の初期化をスキップします');
    }
  }, []);

  // アプリ内購入の初期化（本番環境のみ）
  const initializeIAP = async () => {
    console.log('本番環境でのIAP初期化は後で実装します');
    // TODO: 本番環境でのreact-native-iap実装
  };

  // WebViewからのメッセージ処理
  const handleWebViewMessage = async (event: any) => {
    console.log('Raw message received:', event.nativeEvent.data);
    
    try {
      const data = JSON.parse(event.nativeEvent.data);
      console.log('Message from WebView:', data);

      switch (data.type) {
        case 'console_log':
          console.log(data.message);
          break;
          
        case 'openInAppPurchase':
          await handlePurchase(data);
          break;
          
        case 'checkSubscription':
          await checkSubscriptionStatus();
          break;
          
        case 'restorePurchases':
          await handleRestorePurchases();
          break;
          
        default:
          console.log('Unknown message type:', data.type);
      }
    } catch (error) {
      console.error('Error handling WebView message:', error);
    }
  };

  // 購入処理（修正版 - WebViewに成功を通知）
  const handlePurchase = async (data: any) => {
    console.log('handlePurchase called with:', data);
    setIsPurchasing(true);
    
    // 2秒後に成功（開発・本番共通のテスト処理）
    setTimeout(() => {
      setIsPurchasing(false);
      
      // 成功データを準備
      const successData = {
        type: 'purchaseSuccess',
        productId: data.productType,
        userId: data.userId,
        transactionId: 'test_' + Date.now(),
        platform: Platform.OS
      };
      
      if (webViewRef.current) {
        console.log('Sending purchase success to WebView:', successData);
        
        // 方法1: postMessage
        webViewRef.current.postMessage(JSON.stringify(successData));
        
        // 方法2: injectJavaScript（より確実）
        const jsCode = `
          (function() {
            const data = ${JSON.stringify(successData)};
            console.log('[WebView] Receiving purchase success:', data);
            
            // 複数の方法でメッセージを送信
            window.postMessage(data, '*');
            
            // グローバル関数が存在する場合は直接呼び出し
            if (window.handlePurchaseSuccess) {
              window.handlePurchaseSuccess(data);
            }
            
            // MessageEventを手動で発火
            const event = new MessageEvent('message', {
              data: data,
              origin: 'react-native'
            });
            window.dispatchEvent(event);
          })();
          true;
        `;
        
        webViewRef.current.injectJavaScript(jsCode);
      }
      
      const message = isDevelopment 
        ? 'テスト購入完了\n開発環境のため、実際の課金は発生しません'
        : '購入完了\nサブスクリプションの登録が完了しました';
      
      Alert.alert('成功', message);
    }, 2000);
  };

  // 購入の復元
  const handleRestorePurchases = async () => {
    if (isDevelopment) {
      Alert.alert('開発環境', '実機でテストしてください');
      return;
    }
    
    try {
      // TODO: 実際の復元処理
      Alert.alert('復元完了', '購入の復元が完了しました');
    } catch (err) {
      console.warn('Restore error:', err);
      Alert.alert('復元エラー', '購入の復元中にエラーが発生しました');
    }
  };

  // サブスクリプション状態の確認
  const checkSubscriptionStatus = async () => {
    if (isDevelopment) {
      // 開発環境では常に未購入として返す
      if (webViewRef.current) {
        webViewRef.current.postMessage(
          JSON.stringify({
            type: 'subscriptionStatus',
            isActive: false,
            isDevelopment: true
          })
        );
      }
      return;
    }
    
    try {
      // TODO: 実際のチェック処理
      const hasActiveSubscription = false;
      
      if (webViewRef.current) {
        webViewRef.current.postMessage(
          JSON.stringify({
            type: 'subscriptionStatus',
            isActive: hasActiveSubscription,
          })
        );
      }
    } catch (error) {
      console.error('Check subscription error:', error);
    }
  };

  // WebViewに初期化スクリプトを注入
  const setupWebView = () => {
    const script = `
      (function() {
        // ReactNativeWebViewが存在しない場合は作成
        if (!window.ReactNativeWebView) {
          window.ReactNativeWebView = {
            postMessage: function(message) {
              window.webkit.messageHandlers.ReactNativeWebView.postMessage(message);
            }
          };
        }
        
        // アプリ環境フラグを設定
        window.isNativeApp = true;
        window.isDevelopment = ${isDevelopment};
        
        // ログ転送を設定
        const originalLog = console.log;
        console.log = function(...args) {
          originalLog.apply(console, args);
          const message = args.map(arg => 
            typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
          ).join(' ');
          try {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'console_log',
              message: '[WebView] ' + message
            }));
          } catch(e) {
            // エラーを無視
          }
        };
        
        // エラーログも転送
        const originalError = console.error;
        console.error = function(...args) {
          originalError.apply(console, args);
          const message = args.map(arg => 
            typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
          ).join(' ');
          try {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'console_log',
              message: '[WebView ERROR] ' + message
            }));
          } catch(e) {
            // エラーを無視
          }
        };
        
        console.log('WebView setup complete');
        console.log('Current URL:', window.location.href);
        console.log('Platform detection:', {
          ReactNativeWebView: typeof window.ReactNativeWebView,
          isNativeApp: window.isNativeApp,
          isDevelopment: window.isDevelopment
        });
      })();
      true;
    `;
    
    if (webViewRef.current) {
      webViewRef.current.injectJavaScript(script);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="auto" />
      
      {/* 開発環境の表示 */}
      {isDevelopment && (
        <View style={styles.devBanner}>
          <Text style={styles.devBannerText}>開発環境 - テストモード</Text>
        </View>
      )}
      
      <WebView
        ref={webViewRef}
        source={{ uri: 'https://d8907f45b85e.ngrok-free.app' }}
        onMessage={handleWebViewMessage}
        onLoadEnd={() => {
          setIsLoading(false);
          console.log('WebView loaded successfully');
          // ページ読み込み完了後にスクリプトを注入（遅延を増やす）
          setTimeout(setupWebView, 1000);
        }}
        onLoadStart={() => console.log('WebView loading started')}
        startInLoadingState={true}
        renderLoading={() => (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#667eea" />
            <Text style={styles.loadingText}>読み込み中...</Text>
          </View>
        )}
        // iOS specific
        allowsInlineMediaPlayback={true}
        mediaPlaybackRequiresUserAction={false}
        // Android specific
        javaScriptEnabled={true}
        domStorageEnabled={true}
        mixedContentMode="compatibility"
        // 共通設定
        originWhitelist={['*']}
        onError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          console.warn('WebView error:', nativeEvent);
        }}
        // デバッグ用
        onHttpError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          console.warn('HTTP error:', nativeEvent);
        }}
      />
      
      {/* 購入処理中のオーバーレイ */}
      {isPurchasing && (
        <View style={styles.purchasingOverlay}>
          <View style={styles.purchasingModal}>
            <ActivityIndicator size="large" color="#667eea" />
            <Text style={styles.purchasingText}>購入処理中...</Text>
            <Text style={styles.purchasingSubtext}>しばらくお待ちください</Text>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  devBanner: {
    backgroundColor: '#f59e0b',
    padding: 8,
    alignItems: 'center',
  },
  devBannerText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  purchasingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  purchasingModal: {
    backgroundColor: 'white',
    padding: 30,
    borderRadius: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  purchasingText: {
    marginTop: 15,
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
  },
  purchasingSubtext: {
    marginTop: 5,
    fontSize: 14,
    color: '#666',
  },
});