import React, { useRef, useState, useEffect } from 'react';
import { StyleSheet, View, SafeAreaView, ActivityIndicator, Text, Alert, Platform } from 'react-native';
import { WebView } from 'react-native-webview';
import { StatusBar } from 'expo-status-bar';

// 開発環境チェック
const isDevelopment = __DEV__;

// Simulatorチェック（オプション）
const isSimulator = () => {
  if (Platform.OS === 'ios') {
    return !Platform.isPad && !Platform.isTVOS && Platform.Version.includes('Simulator');
  }
  return false;
};

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
    try {
      const data = JSON.parse(event.nativeEvent.data);
      console.log('Message from WebView:', data);

      switch (data.type) {
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

  // 購入処理
  const handlePurchase = async (data: any) => {
    if (isDevelopment) {
      Alert.alert(
        '開発環境',
        'Simulatorではアプリ内購入をテストできません。\n\n実機でテストするか、Web版でStripe決済をご利用ください。',
        [
          {
            text: 'Web版で購入',
            onPress: () => {
              // WebViewに戻るメッセージを送信
              if (webViewRef.current) {
                webViewRef.current.postMessage(
                  JSON.stringify({
                    type: 'redirectToWeb',
                    message: 'Simulatorでは購入できません'
                  })
                );
              }
            }
          },
          {
            text: 'OK',
            style: 'cancel'
          }
        ]
      );
      return;
    }
    
    // 本番環境での購入処理
    setIsPurchasing(true);
    
    try {
      // TODO: 実際のIAP実装
      console.log('本番環境での購入処理', data);
      
      // 仮の成功処理
      setTimeout(() => {
        setIsPurchasing(false);
        Alert.alert('購入完了', 'サブスクリプションの登録が完了しました');
      }, 2000);
      
    } catch (err: any) {
      setIsPurchasing(false);
      Alert.alert('購入エラー', err.message || '購入処理中にエラーが発生しました');
    }
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

  // WebViewに初期化完了を通知するJavaScript
  const injectedJavaScript = `
    window.ReactNativeWebView = true;
    window.isNativeApp = true;
    window.isDevelopment = ${isDevelopment};
    
    // デバッグ用
    console.log('WebView環境を設定しました');
    console.log('ReactNativeWebView:', window.ReactNativeWebView);
    console.log('isNativeApp:', window.isNativeApp);
    
    // デバッグアラート（一時的）
    setTimeout(() => {
      alert('アプリ環境検出: ' + (window.ReactNativeWebView ? 'アプリ内' : 'ブラウザ'));
    }, 1000);
    
    // アプリの準備完了を通知
    window.postMessage(JSON.stringify({ 
      type: 'appReady',
      isDevelopment: ${isDevelopment},
      platform: '${Platform.OS}'
    }));
    
    // 開発環境の場合、コンソールにメッセージ
    if (${isDevelopment}) {
      console.log('🔧 開発環境で実行中 - アプリ内購入は無効です');
    }
    
    true; // 必須
  `;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="auto" />
      
      {/* 開発環境の表示 */}
      {isDevelopment && (
        <View style={styles.devBanner}>
          <Text style={styles.devBannerText}>開発環境 - IAP無効</Text>
        </View>
      )}
      
      <WebView
        ref={webViewRef}
        source={{ uri: 'https://a-istudy-highschool.vercel.app' }}
        onMessage={handleWebViewMessage}
        injectedJavaScript={injectedJavaScript}
        onLoadEnd={() => setIsLoading(false)}
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