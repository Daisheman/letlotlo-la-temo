import { Platform } from "react-native";
import Purchases, { PurchasesPackage } from "react-native-purchases";

let configured = false;

export function configureRevenueCat(userId?: string) {
  if (configured) return;
  const apiKey =
    Platform.OS === "ios" ? process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY : process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY;
  if (!apiKey) return;
  Purchases.configure({ apiKey, appUserID: userId });
  configured = true;
}

export async function getPremiumPackages() {
  const offerings = await Purchases.getOfferings();
  return offerings.current?.availablePackages ?? [];
}

export async function purchasePremium(pkg: PurchasesPackage) {
  return Purchases.purchasePackage(pkg);
}
