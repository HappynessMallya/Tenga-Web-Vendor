require('dotenv/config');

export default ({ config }) => ({
  ...config,
  expo: {
    name: "Tenga Laundry",
    slug: "tenga-laundry",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme: "tengalaundryapp",
    userInterfaceStyle: "automatic",
    splash: {
      image: "./assets/images/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff"
    },
    ios: {
      supportsTablet: true
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/images/adaptive-icon.png",
        backgroundColor: "#ffffff"
      },
      package: "com.anonymous.tengalaundry",
      permissions: [
        "android.permission.INTERNET",
        "android.permission.DETECT_SCREEN_CAPTURE"
      ]
    },
    web: {
      bundler: "metro",
      output: "static",
      favicon: "./assets/images/favicon.png",
      // Disable SSR to avoid Node.js module issues
      ssr: false
    },
    experiments: {
      typedRoutes: true
    },
    plugins: [
      "expo-font",
      "expo-router",
      "expo-secure-store"
    ],
    extra: {
      router: {
        origin: false
      },
      eas: {
        projectId: "d9eb0553-4402-4fed-87b1-d324bcf57f8a"
      },
      // Environment variables exposed to the app
      EXPO_PUBLIC_API_BASE_URL: process.env.EXPO_PUBLIC_API_BASE_URL || 'https://lk-7ly1.onrender.com/api',
      EXPO_PUBLIC_API_URL: process.env.EXPO_PUBLIC_API_URL || process.env.EXPO_PUBLIC_API_BASE_URL || 'https://lk-7ly1.onrender.com/api',
    },
  },
});

