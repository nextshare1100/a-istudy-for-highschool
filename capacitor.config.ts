import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.nextshare.aistudyhigh',
  appName: 'A-IStudy高校講座',
  webDir: 'out', // 'public' から 'out' に変更
  server: {
    // server.url をコメントアウト（ローカルファイルを使用）
    // url: 'https://a-istudy-highschool.vercel.app',
    cleartext: true,
    allowNavigation: ['*']
  },
  ios: {
    contentInset: 'automatic'
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 3000,
      launchAutoHide: true,
      backgroundColor: "#ffffffff",
      showSpinner: true,
      spinnerColor: "#999999",
    },
    CapacitorHttp: {
      enabled: true
    }
  },
};

export default config;