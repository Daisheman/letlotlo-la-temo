import { Text, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { Screen } from "@/components/ui/Screen";
import { Badge } from "@/components/ui/Badge";
import { getChatHistory } from "@/lib/queries";

export default function ChatSessionScreen() {
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
  const historyQuery = useQuery({ queryKey: ["chat-history", sessionId], queryFn: () => getChatHistory(sessionId), enabled: Boolean(sessionId) });

  return (
    <Screen>
      <Text className="text-3xl font-black text-field-900">Chat History</Text>
      <Text className="mt-1 text-field-700">Session {sessionId}</Text>
      <View className="mt-4 gap-3">
        {(historyQuery.data ?? []).map((message) => (
          <View key={message.id} className={`rounded-lg p-3 ${message.role === "USER" ? "bg-field-700" : "bg-white"}`}>
            <Text className={message.role === "USER" ? "text-white" : "text-field-900"}>{message.content}</Text>
            {message.aiModelUsed ? <View className="mt-2"><Badge label={message.aiModelUsed} tone="blue" /></View> : null}
          </View>
        ))}
      </View>
    </Screen>
  );
}
