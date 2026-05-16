import { useState } from "react";
import { Alert, Text, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Brain, Plus } from "lucide-react-native";
import { Screen } from "@/components/ui/Screen";
import { Card } from "@/components/ui/Card";
import { TextField } from "@/components/ui/TextField";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { createCrop, getCrops, getRecommendation } from "@/lib/queries";

function daysFrom(date?: string | null) {
  if (!date) return "Not planted";
  const days = Math.max(0, Math.floor((Date.now() - new Date(date).getTime()) / 86400000));
  return `${days} days since planting`;
}

export default function CropPlannerScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const queryClient = useQueryClient();
  const cropsQuery = useQuery({ queryKey: ["crops", id], queryFn: () => getCrops(id), enabled: Boolean(id) });
  const [name, setName] = useState("");
  const [variety, setVariety] = useState("");
  const [area, setArea] = useState("");
  const [plantedDate, setPlantedDate] = useState("");

  const createMutation = useMutation({
    mutationFn: () =>
      createCrop(id, {
        name,
        variety,
        areaHectares: Number(area),
        plantedDate: plantedDate || null,
        status: plantedDate ? "GROWING" : "PLANNED"
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crops", id] });
      queryClient.invalidateQueries({ queryKey: ["farm", id] });
      setName("");
      setVariety("");
      setArea("");
      setPlantedDate("");
    },
    onError: (error: any) => Alert.alert("Could not add crop", error.response?.data?.error ?? "Try again.")
  });

  const aiMutation = useMutation({
    mutationFn: () => getRecommendation(id, "What should I plant now based on season, soil, water, and weather?"),
    onError: (error: any) => Alert.alert("AI failed", error.response?.data?.error ?? "Try again.")
  });

  return (
    <Screen>
      <Text className="text-3xl font-black text-field-900">Crop Planner</Text>
      <Text className="mt-1 text-field-700">Plan, monitor, harvest, and feed results back into Temo.</Text>

      <Card className="mt-4">
        <Text className="mb-3 text-lg font-black text-field-900">Add crop</Text>
        <TextField label="Crop name" value={name} onChangeText={setName} placeholder="Maize, sorghum, cowpeas" />
        <TextField label="Variety" value={variety} onChangeText={setVariety} placeholder="Macia, SC 719" />
        <TextField label="Area hectares" keyboardType="decimal-pad" value={area} onChangeText={setArea} />
        <TextField label="Planting date" value={plantedDate} onChangeText={setPlantedDate} placeholder="YYYY-MM-DD" />
        <Button title="Save crop" icon={Plus} loading={createMutation.isPending} onPress={() => createMutation.mutate()} />
      </Card>

      <View className="mt-4">
        <Button title="What should I plant now?" icon={Brain} variant="secondary" loading={aiMutation.isPending} onPress={() => aiMutation.mutate()} />
      </View>

      {aiMutation.data ? (
        <Card className="mt-4">
          <Badge label={aiMutation.data.aiModelUsed} tone="blue" />
          <Text className="mt-3 leading-6 text-field-800">{aiMutation.data.recommendation}</Text>
        </Card>
      ) : null}

      <Text className="mb-2 mt-5 text-lg font-black text-field-900">Timeline</Text>
      <View className="gap-3">
        {(cropsQuery.data ?? []).map((crop) => (
          <Card key={crop.id}>
            <View className="flex-row items-start justify-between gap-3">
              <View className="flex-1">
                <Text className="text-xl font-black text-field-900">{crop.name}</Text>
                <Text className="mt-1 text-field-700">{crop.variety || "No variety"} - {crop.areaHectares} ha</Text>
                <Text className="mt-1 text-field-700">{daysFrom(crop.plantedDate)}</Text>
                <Text className="mt-1 text-field-700">Harvest: {crop.expectedHarvestDate ? new Date(crop.expectedHarvestDate).toLocaleDateString() : "not estimated"}</Text>
              </View>
              <Badge label={crop.status} tone={crop.status === "FAILED" ? "red" : crop.status === "HARVESTED" ? "gold" : "green"} />
            </View>
          </Card>
        ))}
      </View>
    </Screen>
  );
}
