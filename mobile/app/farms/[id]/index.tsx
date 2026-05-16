import { Alert, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import MapView, { Marker } from "react-native-maps";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Brain, CloudSun, Droplets, Leaf, Sprout } from "lucide-react-native";
import { Screen } from "@/components/ui/Screen";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Metric } from "@/components/ui/Metric";
import { Badge } from "@/components/ui/Badge";
import { getFarm, getFarmHealthScore, getRecommendation, getSoil, getWater } from "@/lib/queries";

export default function FarmDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const queryClient = useQueryClient();
  const farmQuery = useQuery({ queryKey: ["farm", id], queryFn: () => getFarm(id), enabled: Boolean(id) });
  const farm = farmQuery.data;
  const soilQuery = useQuery({ queryKey: ["soil", farm?.id], queryFn: () => getSoil(farm!.lat, farm!.lng), enabled: Boolean(farm) });
  const waterQuery = useQuery({ queryKey: ["water", farm?.id], queryFn: () => getWater(farm!.lat, farm!.lng), enabled: Boolean(farm) });
  const scoreQuery = useQuery({ queryKey: ["farm-health", id], queryFn: () => getFarmHealthScore(id), enabled: Boolean(id) });
  const recommendationMutation = useMutation({
    mutationFn: () => getRecommendation(id, "full crop, irrigation, soil, and water recommendation"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["farm", id] });
      queryClient.invalidateQueries({ queryKey: ["farms"] });
    },
    onError: (error: any) => Alert.alert("AI recommendation failed", error.response?.data?.error ?? "Try again.")
  });

  if (!farm) {
    return (
      <Screen>
        <Text className="text-field-700">Loading farm...</Text>
      </Screen>
    );
  }

  const soil = soilQuery.data ?? {};
  const waterSources = waterQuery.data ?? [];
  const latestRecommendation = recommendationMutation.data ?? farm.recommendations?.[0];

  return (
    <Screen>
      <Text className="text-3xl font-black text-field-900">{farm.name}</Text>
      <Text className="mt-1 text-field-700">{farm.sizeHectares} hectares - {farm.waterSource.toLowerCase()} water</Text>

      <View className="mt-4 h-72 overflow-hidden rounded-lg border border-field-100">
        <MapView style={{ flex: 1 }} region={{ latitude: farm.lat, longitude: farm.lng, latitudeDelta: 0.12, longitudeDelta: 0.12 }}>
          <Marker coordinate={{ latitude: farm.lat, longitude: farm.lng }} title={farm.name} />
          {waterSources.slice(0, 15).map((source: any) => (
            <Marker
              key={source.id}
              coordinate={{ latitude: source.lat, longitude: source.lng }}
              title={source.name}
              description={source.type}
              pinColor="#2563eb"
            />
          ))}
        </MapView>
      </View>

      <View className="mt-4 flex-row gap-2">
        <Metric label="Health" value={`${scoreQuery.data ?? farm.farmHealthScore ?? "--"}/100`} />
        <Metric label="pH" value={String(farm.soilPh ?? (soil as any).phh2o?.toFixed?.(1) ?? "--")} />
        <Metric label="Water pins" value={String(waterSources.length)} />
      </View>

      <Card className="mt-4">
        <Text className="text-lg font-black text-field-900">Soil quality</Text>
        <View className="mt-3 flex-row flex-wrap gap-2">
          <Metric label="Organic C" value={`${farm.soilOrganicCarbon ?? (soil as any).soc?.toFixed?.(1) ?? "--"}%`} />
          <Metric label="Clay" value={`${farm.soilClayPct ?? (soil as any).clay?.toFixed?.(0) ?? "--"}%`} />
          <Metric label="Sand" value={`${farm.soilSandPct ?? (soil as any).sand?.toFixed?.(0) ?? "--"}%`} />
        </View>
      </Card>

      <Card className="mt-4">
        <Text className="text-lg font-black text-field-900">Water sources nearby</Text>
        <View className="mt-3 gap-2">
          {waterSources.slice(0, 4).map((source: any) => (
            <View key={source.id} className="flex-row items-center gap-2">
              <Droplets size={16} color="#2563eb" />
              <Text className="flex-1 text-field-800">{source.name} - {source.type}</Text>
            </View>
          ))}
          {!waterSources.length ? <Text className="text-field-700">No mapped wells, boreholes, rivers, or springs found within 10km.</Text> : null}
        </View>
      </Card>

      <View className="mt-4 gap-3">
        <Button title="Get AI Recommendation" icon={Brain} loading={recommendationMutation.isPending} onPress={() => recommendationMutation.mutate()} />
        <Button title="Crop Planner" icon={Sprout} variant="secondary" onPress={() => router.push(`/farms/${farm.id}/crops`)} />
        <Button title="Weather" icon={CloudSun} variant="ghost" onPress={() => router.push(`/farms/${farm.id}/weather`)} />
        <Button title="Soil Data" icon={Leaf} variant="ghost" onPress={() => router.push(`/farms/${farm.id}/soil`)} />
      </View>

      {latestRecommendation ? (
        <Card className="mt-4">
          <View className="mb-2 flex-row items-center justify-between">
            <Text className="text-lg font-black text-field-900">Recommendation</Text>
            <Badge label={latestRecommendation.aiModelUsed} tone="blue" />
          </View>
          <Text className="leading-6 text-field-800">{latestRecommendation.recommendation}</Text>
        </Card>
      ) : null}
    </Screen>
  );
}
