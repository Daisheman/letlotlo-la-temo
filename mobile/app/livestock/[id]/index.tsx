import { Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { Stethoscope } from "lucide-react-native";
import { Screen } from "@/components/ui/Screen";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { getFarms, getHealthEvents } from "@/lib/queries";

export default function LivestockDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const farmsQuery = useQuery({ queryKey: ["farms"], queryFn: getFarms });
  const group = farmsQuery.data?.flatMap((farm) => farm.livestock ?? []).find((item) => item.id === id);
  const healthQuery = useQuery({ queryKey: ["health", id], queryFn: () => getHealthEvents(id), enabled: Boolean(id) });

  return (
    <Screen>
      <Text className="text-3xl font-black text-field-900">{group?.species ?? "Livestock"}</Text>
      <Text className="mt-1 text-field-700">{group?.count ?? "--"} animals {group?.breed ? `- ${group.breed}` : ""}</Text>

      <Card className="mt-4">
        <Text className="text-lg font-black text-field-900">Health status</Text>
        <Text className="mt-2 text-field-700">{healthQuery.data?.length ? "Recent health events recorded." : "No health events recorded yet."}</Text>
        <View className="mt-3">
          <Button title="Report Health Issue" icon={Stethoscope} variant="danger" onPress={() => router.push(`/livestock/${id}/health`)} />
        </View>
      </Card>

      <Text className="mb-2 mt-5 text-lg font-black text-field-900">History</Text>
      <View className="gap-3">
        {(healthQuery.data ?? []).map((event) => (
          <Card key={event.id}>
            <View className="flex-row items-start justify-between gap-2">
              <Text className="flex-1 font-bold text-field-900">{new Date(event.reportedAt).toLocaleString()}</Text>
              <Badge label={event.resolved ? "Resolved" : event.mustCallVet ? "Vet needed" : "Open"} tone={event.mustCallVet ? "red" : event.resolved ? "green" : "gold"} />
            </View>
            <Text className="mt-2 text-field-700">{event.symptoms}</Text>
            {event.aiTreatment ? <Text className="mt-2 leading-6 text-field-800">{event.aiTreatment}</Text> : null}
          </Card>
        ))}
      </View>
    </Screen>
  );
}
