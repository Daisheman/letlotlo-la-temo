import { View } from "react-native";
import { BannerAd, BannerAdSize, TestIds } from "react-native-google-mobile-ads";
import { useAuthStore } from "@/stores/auth-store";

export function AdBanner() {
  const tier = useAuthStore((state) => state.user?.tier ?? "FREE");
  if (tier === "PREMIUM") return null;
  return (
    <View className="mb-3 items-center overflow-hidden rounded-lg bg-white">
      <BannerAd unitId={TestIds.BANNER} size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER} requestOptions={{ requestNonPersonalizedAdsOnly: true }} />
    </View>
  );
}
