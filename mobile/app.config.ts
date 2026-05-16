import type { ExpoConfig } from "expo/config";

const config: ExpoConfig = {
  name: "Letlotlo la Temo",
  slug: "letlotlo-la-temo",
  scheme: "letlotlo",
  version: "1.0.0",
  orientation: "portrait",
  userInterfaceStyle: "light",
  assetBundlePatterns: ["**/*"],
  ios: {
    supportsTablet: true,
    bundleIdentifier: "bw.letlotlo.temo"
  },
  android: {
    package: "bw.letlotlo.temo",
    adaptiveIcon: {
      backgroundColor: "#123524"
    },
    permissions: ["ACCESS_FINE_LOCATION", "ACCESS_COARSE_LOCATION", "CAMERA", "POST_NOTIFICATIONS"]
  },
  extra: {
    eas: {
      projectId: "letlotlo-la-temo-mvp"
    }
  },
  plugins: [
    "expo-router",
    "expo-secure-store",
    "expo-location",
    "expo-camera",
    "expo-image-picker",
    "expo-notifications",
    [
      "react-native-google-mobile-ads",
      {
        androidAppId: process.env.EXPO_PUBLIC_GOOGLE_ADS_APP_ID || "ca-app-pub-3940256099942544~3347511713",
        iosAppId: process.env.EXPO_PUBLIC_GOOGLE_ADS_APP_ID || "ca-app-pub-3940256099942544~1458002511"
      }
    ]
  ],
  experiments: {
    typedRoutes: true
  }
};

export default config;
