import { useEffect } from "react";
import { Pressable, Text, View } from "react-native";
import { router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { MessageCircle, Plus, Stethoscope, Sun, Wind } from "lucide-react-native";
import { Screen } from "@/components/ui/Screen";
import { Card } from "@/components/ui/Card";
import { Metric } from "@/components/ui/Metric";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { OfflineBanner } from "@/components/OfflineBanner";
import { AdBanner } from "@/components/AdBanner";
import { getCurrentWeather, getFarms } from "@/lib/queries";
import { useAuthStore } from "@/stores/auth-store";
import { useFarmStore } from "@/stores/farm-store";
import { useWeatherStore } from "@/stores/weather-store";

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function daysBetween(date?: string | null) {
  if (!date) return null;
  return Math.max(0, Math.floor((Date.now() - new Date(date).getTime()) / 86400000));
}

export default function DashboardScreen() {
  const user = useAuthStore((state) => state.user);
  const selectedFarmId = useFarmStore((state) => state.selectedFarmId);
  const setSelectedFarmId = useFarmStore((state) => state.setSelectedFarmId);
  const setWeather = useWeatherStore((state) => state.setCurrent);
  const cachedWeather = useWeatherStore((state) => state.current);
  const farmsQuery = useQuery({ queryKey: ["farms"], queryFn: getFarms });
  const farms = farmsQuery.data ?? [];
  const farm = farms.find((item) => item.id === selectedFarmId) ?? farms[0];

  useEffect(() => {
    if (!selectedFarmId && farm) setSelectedFarmId(farm.id);
  }, [farm, selectedFarmId, setSelectedFarmId]);

  const weatherQuery = useQuery({
    queryKey: ["weather", "current", farm?.id],
    queryFn: async () => {
      const weather = await getCurrentWeather(farm!.lat, farm!.lng);
      setWeather(weather);
      return weather;
    },
    enabled: Boolean(farm)
  });

  const weather = weatherQuery.data ?? cachedWeather?.weather;
  const current = (weather as any)?.current ?? {};
  const activeCrops = farm?.crops?.filter((crop) => crop.status === "GROWING") ?? [];
  const livestockCount = farm?.livestock?.reduce((sum, item) => sum + item.count, 0) ?? 0;
  const latestAdvice =
    farm?.recommendations?.[0]?.recommendation ??
    "Check soil moisture before irrigation. In semi-arid conditions, water deeply and less often to encourage stronger roots. PRIORITY ACTION: Walk the field today and inspect crop leaves for stress.";

  return (
    <Screen>
      <OfflineBanner />
      <AdBanner />
      <View className="mb-4">
        <Text className="text-base text-field-700">{greeting()},</Text>
        <Text className="text-3xl font-black text-field-900">{user?.name ?? "Farmer"}</Text>
      </View>

      <Card className="mb-4">
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-sm font-semibold text-field-700">{farm?.name ?? "No farm yet"}</Text>
            <Text className="mt-1 text-4xl font-black text-field-900">{current.temperature_2m ?? "--"}°C</Text>
          </View>
          <Sun size={42} color="#f5b642" />
        </View>
        <View className="mt-4 flex-row gap-2">
          <Metric label="Rain" value={`${current.precipitation ?? 0} mm`} />
          <Metric label="Wind" value={`${current.wind_speed_10m ?? current.windspeed_10m ?? "--"} km/h`} />
          <Metric label="Animals" value={String(livestockCount)} />
        </View>
      </Card>

      <View className="mb-4 rounded-lg bg-blue-100 p-3">
        <View className="flex-row items-center gap-2">
          <Wind size={16} color="#1d4ed8" />
          <Text className="font-bold text-blue-800">Seasonal alert</Text>
        </View>
        <Text className="mt-1 text-blue-800">Frost risk rises in June and July. Protect seedlings when minimum temperatures approach 4°C.</Text>
      </View>

      <Card className="mb-4">
        <View className="mb-2 flex-row items-center justify-between">
          <Text className="text-lg font-black text-field-900">Today's Advice</Text>
          <Badge label={farm?.recommendations?.[0]?.aiModelUsed ?? "Temo"} tone="gold" />
        </View>
        <Text className="leading-6 text-field-800">{latestAdvice}</Text>
      </Card>

      <Text className="mb-2 text-lg font-black text-field-900">Active crops</Text>
      <View className="mb-4 gap-3">
        {activeCrops.length ? (
          activeCrops.map((crop) => (
            <Pressable key={crop.id} onPress={() => router.push(`/farms/${crop.farmId}/crops`)}>
              <Card>
                <Text className="text-lg font-bold text-field-900">{crop.name}</Text>
                <Text className="mt-1 text-field-700">
                  {daysBetween(crop.plantedDate) ?? 0} days since planting. Harvest target:{" "}
                  {crop.expectedHarvestDate ? new Date(crop.expectedHarvestDate).toLocaleDateString() : "not set"}.
                </Text>
              </Card>
            </Pressable>
          ))
        ) : (
          <Card>
            <Text className="text-field-700">No growing crops yet. Add your first crop plan.</Text>
          </Card>
        )}
      </View>

      <View className="gap-3">
        <Button title="Add Crop" icon={Plus} onPress={() => (farm ? router.push(`/farms/${farm.id}/crops`) : router.push("/(tabs)/farms"))} />
        <Button title="Ask AI" icon={MessageCircle} variant="secondary" onPress={() => router.push("/(tabs)/chat")} />
        <Button title="Report Sick Animal" icon={Stethoscope} variant="danger" onPress={() => router.push("/(tabs)/livestock")} />
      </View>
    </Screen>
  );
}
