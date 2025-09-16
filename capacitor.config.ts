import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.nextshare.a_istudy_for_high',
  appName: 'a-istudy for highschool',
  webDir: 'public',
  server: {
    // 本番環境のAPIサーバーURL
    url: 'https://a-istudy-highschool.vercel.app',
    cleartext: false,
    allowNavigation: ['*']
  },
  ios: {
    contentInset: 'automatic',
    // Info.plistの権限設定を追加
    infoPlist: {
      NSCameraUsageDescription: '学習記録の写真撮影やQRコードの読み取りに使用します',
      NSPhotoLibraryUsageDescription: '学習記録に画像を添付するために使用します',
      NSMicrophoneUsageDescription: '音声メモの録音機能に使用します',
      NSSpeechRecognitionUsageDescription: '音声入力機能に使用します'
    }
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 3000,
      launchAutoHide: true,
      backgroundColor: "#ffffffff",
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
      showSpinner: true,
      androidSpinnerStyle: "large",
      iosSpinnerStyle: "small",
      spinnerColor: "#999999",
      splashFullScreen: true,
      splashImmersive: true,
      layoutName: "launch_screen",
      useDialog: true,
    },
    CapacitorHttp: {
      enabled: true
    },
    StatusBar: {
      style: 'light',
      backgroundColor: '#4f46e5'
    }
  },
};

export default config;