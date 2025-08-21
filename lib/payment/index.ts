// lib/utils/platform.ts
export const getPlatform = () => {
  if (typeof window === 'undefined') return 'web';
  
  // React Native WebView検出
  if ((window as any).ReactNativeWebView) {
    return 'app';
  }
  
  // Capacitor/Cordova検出
  if ((window as any).Capacitor || (window as any).cordova) {
    return 'app';
  }
  
  return 'web';
};

export const isAppEnvironment = () => getPlatform() === 'app';