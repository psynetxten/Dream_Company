import { CapacitorConfig } from "@capacitor/cli";

// 앱이 로드할 URL
// - 프로덕션: 배포된 웹앱 URL (server.url 설정)
// - 로컬 개발: webDir 사용 (server.url 제거)
const PRODUCTION_URL = "https://app.dreamnewspaper.com";

const config: CapacitorConfig = {
  appId: "com.dreamnewspaper.app",
  appName: "꿈신문사",
  webDir: "out",  // 로컬 정적 빌드용 (fallback)

  // 프로덕션 앱은 배포된 웹앱을 WebView로 로드
  server: {
    url: PRODUCTION_URL,
    androidScheme: "https",
    cleartext: false,
    allowNavigation: [
      "*.dreamnewspaper.com",
      "*.supabase.co",
      "*.kakao.com",
      "*.googleapis.com",
    ],
  },

  plugins: {
    SplashScreen: {
      launchShowDuration: 2500,
      launchAutoHide: true,
      backgroundColor: "#1A1A1A",
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
      iosSpinnerStyle: "large",
      spinnerColor: "#CC2200",
    },

    StatusBar: {
      style: "Dark",
      backgroundColor: "#1A1A1A",
      overlaysWebView: false,
    },

    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"],
    },

    LocalNotifications: {
      smallIcon: "ic_stat_icon_config_sample",
      iconColor: "#CC2200",
    },

    Keyboard: {
      resize: "body",
      style: "dark",
      resizeOnFullScreen: true,
    },
  },

  ios: {
    contentInset: "always",
    scrollEnabled: true,
    limitsNavigationsToAppBoundDomains: false,
    backgroundColor: "#1A1A1A",
  },

  android: {
    backgroundColor: "#1A1A1A",
    captureInput: true,
    webContentsDebuggingEnabled: false,
    loggingBehavior: "none",
  },
};

export default config;
