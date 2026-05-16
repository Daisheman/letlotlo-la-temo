import { useState } from "react";
import { Alert, Pressable, Text, View } from "react-native";
import { router } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Beef, Plus, Stethoscope } from "lucide-react-native";
import { Screen } from "@/components/ui/Screen";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { Badge } from "@/components/ui/Badge";
import { createLivestock, getFarms, getLivestock } from "@/lib/queries";
import { useFarmStore } from "@/stores/farm-store";

export default function LivestockScreen() {
  const queryClient = useQueryClient();
  const selectedFarmId = useFarmStore((state) => state.selectedFarmId);
  const farmsQuery = useQuery({ queryKey: ["farms"], queryFn: getFarms });
  const farmId = selectedFarmId ?? farmsQuery.data?.[0]?.id;
  const livestockQuery = useQuery({ queryKey: ["livestock", farmId], queryFn: () => getLivestock(farmId!), enabled: Boolean(farmId) });
  const [showForm, setShowForm] = useState(false);
  const [species, setSpecies] = useState("");
  const [breed, setBreed] = useState("");
  const [count, setCount] = useState("");

  const mutation = useMutation({
    mutationFn: () => createLivestock(farmId!, { species, breed, count: Number(count) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["livestock", farmId] });
      queryClient.invalidateQueries({ queryKey: ["farms"] });
      setShowForm(false);
      setSpecies("");
      setBreed("");
      setCount("");
    },
    onError: (error: any) => Alert.alert("Could not add livestock", error.response?.data?.error ?? "Try again.")
  });

  return (
    <Screen>
      <View className="mb-4 flex-row items-start justify-between">
        <View className="flex-1">
          <Text className="text-3xl font-black text-field-900">Livestock</Text>
          <Text className="mt-1 text-field-700">Track herds and report health issues to Dr. Temo.</Text>
        </View>
        <Button title="Add" icon={Plus} onPress={() => setShowForm((value) => !value)} />
      </View>

      {showForm ? (
        <Card className="mb-4">
          <TextField label="Species" value={species} onChangeText={setSpecies} placeholder="Cattle, goats, chickens" />
          <TextField label="Breed" value={breed} onChangeText={setBreed} placeholder="Tswana, Boer, indigenous" />
          <TextField label="Count" keyboardType="number-pad" value={count} onChangeText={setCount} />
          <Button title="Save livestock" loading={mutation.isPending} onPress={() => mutation.mutate()} />
        </Card>
      ) : null}

      <View className="gap-3">
        {(livestockQuery.data ?? []).map((group) => (
          <Pressable key={group.id} onPress={() => router.push(`/livestock/${group.id}`)}>
            <Card>
              <View className="flex-row items-start gap-3">
                <View className="h-12 w-12 items-center justify-center rounded-lg bg-field-100">
                  <Beef size={24} color="#24623b" />
                </View>
                <View className="flex-1">
                  <Text className="text-xl font-black text-field-900">{group.species}</Text>
                  <Text className="text-field-700">{group.count} head {group.breed ? `- ${group.breed}` : ""}</Text>
                  <View className="mt-3 flex-row items-center gap-2">
                    <Badge label={group.healthEvents?.length ? "Recent health event" : "Healthy"} tone={group.healthEvents?.length ? "gold" : "green"} />
                    <Pressable onPress={() => router.push(`/livestock/${group.id}/health`)} className="flex-row items-center gap-1">
                      <Stethoscope size={15} color="#dc2626" />
                      <Text className="font-bold text-red-600">Report</Text>
                    </Pressable>
                  </View>
                </View>
              </View>
            </Card>
          </Pressable>
        ))}
        {!livestockQuery.data?.length ? (
          <Card>
            <Text className="text-field-700">No livestock groups yet. Add cattle, goats, chickens, sheep, or pigs.</Text>
          </Card>
        ) : null}
      </View>
    </Screen>
  );
}
