import { useState } from "react";
import { Alert, Text, View } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Camera, CheckCircle, Stethoscope } from "lucide-react-native";
import { Screen } from "@/components/ui/Screen";
import { Card } from "@/components/ui/Card";
import { TextField } from "@/components/ui/TextField";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { analyzeLivestock, getFarms, getHealthEvents } from "@/lib/queries";

export default function LivestockHealthScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const queryClient = useQueryClient();
  const farmsQuery = useQuery({ queryKey: ["farms"], queryFn: getFarms });
  const group = farmsQuery.data?.flatMap((farm) => farm.livestock ?? []).find((item) => item.id === id);
  const healthQuery = useQuery({ queryKey: ["health", id], queryFn: () => getHealthEvents(id), enabled: Boolean(id) });
  const [step, setStep] = useState(1);
  const [affectedCount, setAffectedCount] = useState("");
  const [symptoms, setSymptoms] = useState("");
  const [duration, setDuration] = useState("");
  const [imageBase64, setImageBase64] = useState<string | undefined>();

  const mutation = useMutation({
    mutationFn: () =>
      analyzeLivestock({
        livestockId: id,
        symptoms,
        affectedCount: affectedCount ? Number(affectedCount) : undefined,
        duration,
        imageBase64
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["health", id] });
      setStep(4);
    },
    onError: (error: any) => Alert.alert("AI vet failed", error.response?.data?.error ?? "Try again.")
  });

  async function attachPhoto() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permission.status !== "granted") return;
    const result = await ImagePicker.launchImageLibraryAsync({ base64: true, quality: 0.7 });
    if (!result.canceled) setImageBase64(result.assets[0].base64 ?? undefined);
  }

  const result = mutation.data;

  return (
    <Screen>
      <Text className="text-3xl font-black text-field-900">AI Vet Flow</Text>
      <Text className="mt-1 text-field-700">{group?.species ?? "Livestock"} health report. DVS Botswana: +267 3950500.</Text>

      <View className="mt-4 flex-row gap-2">
        {[1, 2, 3, 4].map((item) => (
          <View key={item} className={`h-2 flex-1 rounded-full ${step >= item ? "bg-field-700" : "bg-field-100"}`} />
        ))}
      </View>

      {step === 1 ? (
        <Card className="mt-4">
          <Text className="text-lg font-black text-field-900">Which animal and how many?</Text>
          <Text className="mt-2 text-field-700">Total group: {group?.count ?? "--"} animals.</Text>
          <TextField label="How many are affected?" keyboardType="number-pad" value={affectedCount} onChangeText={setAffectedCount} />
          <Button title="Next" onPress={() => setStep(2)} />
        </Card>
      ) : null}

      {step === 2 ? (
        <Card className="mt-4">
          <Text className="text-lg font-black text-field-900">Describe symptoms</Text>
          <TextField
            label="Symptoms"
            value={symptoms}
            onChangeText={setSymptoms}
            multiline
            className="min-h-28"
            placeholder="Fever, salivation, lameness, diarrhea, coughing, blisters..."
          />
          <View className="mb-3">
            <Button title={imageBase64 ? "Photo attached" : "Attach photo"} icon={Camera} variant="secondary" onPress={attachPhoto} />
          </View>
          <Button title="Next" onPress={() => setStep(3)} />
        </Card>
      ) : null}

      {step === 3 ? (
        <Card className="mt-4">
          <Text className="text-lg font-black text-field-900">How long?</Text>
          <TextField label="Duration" value={duration} onChangeText={setDuration} placeholder="2 days, since yesterday, one week" />
          <Button title="Analyze with Dr. Temo" icon={Stethoscope} loading={mutation.isPending} onPress={() => mutation.mutate()} />
        </Card>
      ) : null}

      {step === 4 ? (
        <Card className="mt-4">
          <View className="mb-3 flex-row items-center justify-between">
            <Text className="text-lg font-black text-field-900">AI analysis</Text>
            <Badge label={result?.ai.modelUsed ?? "Dr. Temo"} tone="blue" />
          </View>
          {result?.healthEvent?.mustCallVet ? (
            <View className="mb-3 rounded-lg bg-red-100 p-3">
              <Text className="font-black text-red-700">Call a vet today. If FMD, Anthrax, ASF, Lumpy Skin, CBPP, or Newcastle is suspected, call DVS Botswana now.</Text>
            </View>
          ) : null}
          {result?.healthEvent?.mustReportAuthorities ? (
            <View className="mb-3 rounded-lg bg-red-100 p-3">
              <Text className="font-black text-red-700">Must report to DVS Botswana: +267 3950500. Quarantine and stop animal movement.</Text>
            </View>
          ) : null}
          <Text className="leading-6 text-field-800">{result?.ai.response ?? "Analysis saved."}</Text>
          <View className="mt-4">
            <Button title="Saved to history" icon={CheckCircle} variant="ghost" onPress={() => setStep(1)} />
          </View>
        </Card>
      ) : null}

      <Text className="mb-2 mt-5 text-lg font-black text-field-900">Previous health events</Text>
      <View className="gap-3">
        {(healthQuery.data ?? []).slice(0, 4).map((event) => (
          <Card key={event.id}>
            <Badge label={event.mustCallVet ? "Vet needed" : event.resolved ? "Resolved" : "Open"} tone={event.mustCallVet ? "red" : "gold"} />
            <Text className="mt-2 font-semibold text-field-900">{event.symptoms}</Text>
          </Card>
        ))}
      </View>
    </Screen>
  );
}
