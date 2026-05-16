import { Text, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { Screen } from "@/components/ui/Screen";
import { Card } from "@/components/ui/Card";
import { Metric } from "@/components/ui/Metric";
import { getFarm, getSoil } from "@/lib/queries";

function value(input: unknown, suffix = "") {
  return typeof input === "number" ? `${input.toFixed(1)}${suffix}` : "--";
}

export default function SoilScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const farmQuery = useQuery({ queryKey: ["farm", id], queryFn: () => getFarm(id), enabled: Boolean(id) });
  const farm = farmQuery.data;
  const soilQuery = useQuery({ queryKey: ["soil", farm?.id], queryFn: () => getSoil(farm!.lat, farm!.lng), enabled: Boolean(farm) });
  const soil = soilQuery.data ?? {};

  return (
    <Screen>
      <Text className="text-3xl font-black text-field-900">Soil Data</Text>
      <Text className="mt-1 text-field-700">ISRIC SoilGrids profile plus farm-entered measurements.</Text>

      <Card className="mt-4">
        <Text className="mb-3 text-lg font-black text-field-900">{farm?.soilType ?? "Soil profile"}</Text>
        <View className="flex-row flex-wrap gap-2">
          <Metric label="pH" value={value(farm?.soilPh ?? (soil as any).phh2o)} />
          <Metric label="Organic C" value={value(farm?.soilOrganicCarbon ?? (soil as any).soc, "%")} />
          <Metric label="Clay" value={value(farm?.soilClayPct ?? (soil as any).clay, "%")} />
          <Metric label="Sand" value={value(farm?.soilSandPct ?? (soil as any).sand, "%")} />
          <Metric label="Silt" value={value((soil as any).silt, "%")} />
          <Metric label="Nitrogen" value={value((soil as any).nitrogen)} />
        </View>
      </Card>

      <Card className="mt-4">
        <Text className="text-lg font-black text-field-900">Soil action</Text>
        <Text className="mt-2 leading-6 text-field-800">
          For sandy or low organic carbon soils, apply well-rotted manure or compost before planting, mulch exposed soil, and split nitrogen applications after rain or irrigation.
        </Text>
      </Card>
    </Screen>
  );
}
