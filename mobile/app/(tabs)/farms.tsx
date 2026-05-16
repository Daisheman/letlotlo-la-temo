import { useState } from "react";
import { Alert, Pressable, Text, View } from "react-native";
import { router } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MapPin, Plus } from "lucide-react-native";
import { Screen } from "@/components/ui/Screen";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { Badge } from "@/components/ui/Badge";
import { createFarm, getFarms } from "@/lib/queries";
import { useFarmStore } from "@/stores/farm-store";
import { useAuthStore } from "@/stores/auth-store";

export default function FarmsScreen() {
  const user = useAuthStore((state) => state.user);
  const setSelectedFarmId = useFarmStore((state) => state.setSelectedFarmId);
  const queryClient = useQueryClient();
  const farmsQuery = useQuery({ queryKey: ["farms"], queryFn: getFarms });
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [size, setSize] = useState("");

  const createMutation = useMutation({
    mutationFn: () =>
      createFarm({
        name,
        sizeHectares: Number(size),
        lat: user?.locationLat ?? -24.6282,
        lng: user?.locationLng ?? 25.9231,
        waterSource: "RAIN",
        soilType: "Unknown"
      }),
    onSuccess: (farm) => {
      setSelectedFarmId(farm.id);
      queryClient.invalidateQueries({ queryKey: ["farms"] });
      setShowForm(false);
      setName("");
      setSize("");
    },
    onError: (error: any) => Alert.alert("Could not add farm", error.response?.data?.error ?? "Try again.")
  });

  return (
    <Screen>
      <View className="mb-4 flex-row items-center justify-between">
        <View>
          <Text className="text-3xl font-black text-field-900">Farms</Text>
          <Text className="text-field-700">Manage fields, water, soil, crops, and livestock.</Text>
        </View>
        <Button title="Add" icon={Plus} onPress={() => setShowForm((value) => !value)} />
      </View>

      {showForm ? (
        <Card className="mb-4">
          <TextField label="Farm name" value={name} onChangeText={setName} />
          <TextField label="Size in hectares" keyboardType="decimal-pad" value={size} onChangeText={setSize} />
          <Button title="Save farm" loading={createMutation.isPending} onPress={() => createMutation.mutate()} />
        </Card>
      ) : null}

      <View className="gap-3">
        {(farmsQuery.data ?? []).map((farm) => (
          <Pressable key={farm.id} onPress={() => router.push(`/farms/${farm.id}`)}>
            <Card>
              <View className="flex-row items-start justify-between gap-3">
                <View className="flex-1">
                  <Text className="text-xl font-black text-field-900">{farm.name}</Text>
                  <Text className="mt-1 text-field-700">{farm.sizeHectares} ha - {farm.waterSource.toLowerCase()}</Text>
                  <View className="mt-3 flex-row gap-2">
                    <Badge label={`${farm.crops?.length ?? 0} crops`} />
                    <Badge label={`${farm.livestock?.length ?? 0} herds`} tone="gold" />
                  </View>
                </View>
                <MapPin size={22} color="#24623b" />
              </View>
            </Card>
          </Pressable>
        ))}
        {!farmsQuery.data?.length ? (
          <Card>
            <Text className="text-field-700">No farms yet. Add one to unlock local recommendations.</Text>
          </Card>
        ) : null}
      </View>
    </Screen>
  );
}
