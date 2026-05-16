import { useEffect, useState } from "react";
import { Alert, Text, View } from "react-native";
import { router } from "expo-router";
import { Crown, ShieldCheck } from "lucide-react-native";
import type { PurchasesPackage } from "react-native-purchases";
import { Screen } from "@/components/ui/Screen";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { getPremiumPackages, purchasePremium } from "@/lib/revenuecat";

export default function PremiumScreen() {
  const [packages, setPackages] = useState<PurchasesPackage[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getPremiumPackages()
      .then(setPackages)
      .catch(() => setPackages([]));
  }, []);

  async function purchase(pkg?: PurchasesPackage) {
    if (!pkg) {
      Alert.alert("RevenueCat not configured", "Add RevenueCat product keys and offerings to enable live Apple Pay or Google Pay checkout.");
      return;
    }
    setLoading(true);
    try {
      await purchasePremium(pkg);
      Alert.alert("Premium active", "Your subscription is active.");
      router.back();
    } catch (error: any) {
      Alert.alert("Purchase not completed", error.message ?? "Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen>
      <View className="items-center">
        <Crown size={52} color="#b77938" />
        <Text className="mt-3 text-3xl font-black text-field-900">Letlotlo Premium</Text>
        <Text className="mt-2 text-center text-field-700">Unlimited Temo guidance, full farm recommendations, image diagnosis, no ads.</Text>
      </View>

      <View className="mt-6 flex-row gap-3">
        <Card className="flex-1">
          <Badge label="Free" />
          <Text className="mt-3 text-field-700">20 AI messages per day</Text>
          <Text className="mt-2 text-field-700">Banner ads</Text>
          <Text className="mt-2 text-field-700">Basic farm records</Text>
        </Card>
        <Card className="flex-1 border-soil-400">
          <Badge label="Premium" tone="gold" />
          <Text className="mt-3 text-field-700">Unlimited AI</Text>
          <Text className="mt-2 text-field-700">No ads</Text>
          <Text className="mt-2 text-field-700">Image analysis</Text>
          <Text className="mt-2 text-field-700">Weather alerts</Text>
        </Card>
      </View>

      <Card className="mt-5">
        <View className="flex-row items-center gap-2">
          <ShieldCheck size={20} color="#24623b" />
          <Text className="text-lg font-black text-field-900">Pricing in Botswana Pula</Text>
        </View>
        <Text className="mt-3 text-2xl font-black text-field-900">BWP 150/month</Text>
        <Text className="mt-1 text-field-700">Flexible monthly plan for active growers and livestock keepers.</Text>
        <View className="mt-4">
          <Button title="Choose monthly" loading={loading} onPress={() => purchase(packages.find((item) => item.packageType === "MONTHLY"))} />
        </View>
      </Card>

      <Card className="mt-4">
        <Text className="text-2xl font-black text-field-900">BWP 1,200/year</Text>
        <Text className="mt-1 text-field-700">Best value for farms that need year-round planning and alerts.</Text>
        <View className="mt-4">
          <Button title="Choose annual" variant="secondary" loading={loading} onPress={() => purchase(packages.find((item) => item.packageType === "ANNUAL"))} />
        </View>
      </Card>

      <View className="mt-4">
        <Button title="Not now" variant="ghost" onPress={() => router.back()} />
      </View>
    </Screen>
  );
}
