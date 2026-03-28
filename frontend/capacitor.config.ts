import { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.dreamnewspaper.app",
  appName: "꿈신문사",
  webDir: "out",   // BUILD_MODE=export 빌드 결과물

  // 앱 내 WebView 설정
  server: {
    androidScheme: "https",
    allowNavigation: [
      "*.dreamnewspaper.com",
      "*.supabase.co",
      "*.stripe.com",
    ],
  },

  plugins: {
    // 스플래시 화면 (네이티브 앱 느낌)
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: "#f5f0e8",
      androidSplashResourceName: "splash",
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },

    // 상태바 (iOS/Android)
    StatusBar: {
      style: "Dark",
      backgroundColor: "#1a1a1a",
    },

    // 푸시 알림 (신문 발행 알림)
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"],
    },

    // 로컬 알림 (오프라인 리마인더)
    LocalNotifications: {
      smallIcon: "ic_stat_icon",
      iconColor: "#1a1a1a",
    },
  },

  // iOS 앱 설정
  ios: {
    contentInset: "always",
    scrollEnabled: true,
    limitsNavigationsToAppBoundDomains: true,
  },

  // Android 앱 설정
  android: {
    backgroundColor: "#f5f0e8",
    captureInput: true,
    webContentsDebuggingEnabled: false,  // 출시 시 false
  },
};

export default config;
