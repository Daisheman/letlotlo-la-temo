import { useState } from "react";
import { Alert, Text, View } from "react-native";
import { router } from "expo-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Sprout } from "lucide-react-native";
import { Screen } from "@/components/ui/Screen";
import { TextField } from "@/components/ui/TextField";
import { Button } from "@/components/ui/Button";
import { createFarm } from "@/lib/queries";
import { useAuthStore } from "@/stores/auth-store";

export default function FirstFarmScreen() {
  const user = useAuthStore((state) => state.user);
  const queryClient = useQueryClient();
  const [name, setName] = useState("My Farm");
  const [size, setSize] = useState("5");
  const [waterSource, setWaterSource] = useState<"BOREHOLE" | "RAIN" | "MUNICIPAL" | "RIVER" | "MIXED">("BOREHOLE");
  const mutation = useMutation({
    mutationFn: () =>
      createFarm({
        name,
        sizeHectares: Number(size),
        lat: user?.locationLat ?? -21.1667,
        lng: user?.locationLng ?? 27.5167,
        waterSource,
        soilType: "Unknown",
        notes: "Created during onboarding"
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["farms"] });
      router.replace("/(tabs)");
    },
    onError: (error: any) => Alert.alert("Could not create farm", error.response?.data?.error ?? "Try again.")
  });

  return (
    <Screen>
      <Text className="text-3xl font-black text-field-900">Add your first farm</Text>
      <Text className="mt-2 text-field-700">This helps Temo build recommendations around your land, water, crops, and animals.</Text>
      <View className="mt-6">
        <TextField label="Farm name" value={name} onChangeText={setName} />
        <TextField label="Size in hectares" keyboardType="decimal-pad" value={size} onChangeText={setSize} />
        <Text className="mb-2 font-semibold text-field-900">Water source</Text>
        <View className="mb-4 flex-row flex-wrap gap-2">
          {(["BOREHOLE", "RAIN", "MUNICIPAL", "RIVER", "MIXED"] as const).map((source) => (
            <Button key={source} title={source} variant={waterSource === source ? "primary" : "ghost"} onPress={() => setWaterSource(source)} />
          ))}
        </View>
        <Button title="Create farm" icon={Sprout} loading={mutation.isPending} onPress={() => mutation.mutate()} />
        <View className="mt-3">
          <Button title="Skip for now" variant="ghost" onPress={() => router.replace("/(tabs)")} />
        </View>
      </View>
    </Screen>
  );
}
