import { useMemo, useState } from "react";
import { Alert, FlatList, KeyboardAvoidingView, Platform, Pressable, Text, TextInput, View } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useMutation } from "@tanstack/react-query";
import { Camera, Send } from "lucide-react-native";
import { Screen } from "@/components/ui/Screen";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { sendChat } from "@/lib/queries";
import { useFarmStore } from "@/stores/farm-store";
import { useChatStore } from "@/stores/chat-store";
import { useOnlineStatus } from "@/lib/offline";
import type { ChatMessage } from "@/types";

export default function ChatScreen() {
  const [tab, setTab] = useState<"FARMING" | "LIVESTOCK">("FARMING");
  const [sessionId, setSessionId] = useState<string | undefined>();
  const [text, setText] = useState("");
  const [imageBase64, setImageBase64] = useState<string | undefined>();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const farmId = useFarmStore((state) => state.selectedFarmId);
  const enqueue = useChatStore((state) => state.enqueue);
  const queued = useChatStore((state) => state.queued);
  const online = useOnlineStatus();

  const mutation = useMutation({
    mutationFn: sendChat,
    onSuccess: (data) => {
      setSessionId(data.sessionId);
      setMessages((current) => [...current, data.message]);
    },
    onError: (error: any) => Alert.alert("Temo could not answer", error.response?.data?.error ?? "Try again.")
  });

  async function attachPhoto() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permission.status !== "granted") return;
    const result = await ImagePicker.launchImageLibraryAsync({ base64: true, quality: 0.7 });
    if (!result.canceled) {
      setImageBase64(result.assets[0].base64 ?? undefined);
    }
  }

  function submit() {
    if (!text.trim()) return;
    const userMessage: ChatMessage = {
      id: `local-${Date.now()}`,
      sessionId: sessionId ?? "local",
      role: "USER",
      content: text,
      messageType: tab,
      createdAt: new Date().toISOString()
    };
    setMessages((current) => [...current, userMessage]);

    if (!online) {
      enqueue({ id: userMessage.id, message: text, messageType: tab, farmId: farmId ?? undefined, imageBase64, createdAt: new Date().toISOString() });
      setText("");
      setImageBase64(undefined);
      return;
    }

    mutation.mutate({ sessionId, farmId: farmId ?? undefined, message: text, messageType: tab, imageBase64 });
    setText("");
    setImageBase64(undefined);
  }

  const header = useMemo(
    () => (
      <View>
        <Text className="text-3xl font-black text-field-900">AI Chat</Text>
        <Text className="mt-1 text-field-700">Ask about crops, weather, soil, sick animals, and what to do next.</Text>
        <View className="my-4 flex-row rounded-lg bg-white p-1">
          {(["FARMING", "LIVESTOCK"] as const).map((item) => (
            <Pressable key={item} onPress={() => setTab(item)} className={`flex-1 rounded-md py-3 ${tab === item ? "bg-field-700" : ""}`}>
              <Text className={`text-center font-bold ${tab === item ? "text-white" : "text-field-700"}`}>
                {item === "FARMING" ? "Farming" : "Livestock"}
              </Text>
            </Pressable>
          ))}
        </View>
        {queued.length ? <Text className="mb-3 text-sm font-semibold text-yellow-800">{queued.length} offline messages queued.</Text> : null}
      </View>
    ),
    [queued.length, tab]
  );

  return (
    <KeyboardAvoidingView className="flex-1 bg-field-50" behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <Screen scroll={false}>
        {header}
        <FlatList
          className="flex-1"
          data={messages}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={<Text className="mt-8 text-center text-field-700">Start with “What should I plant now near Francistown?”</Text>}
          renderItem={({ item }) => (
            <View className={`mb-3 max-w-[88%] rounded-lg p-3 ${item.role === "USER" ? "ml-auto bg-field-700" : "mr-auto bg-white"}`}>
              <Text className={item.role === "USER" ? "text-white" : "text-field-900"}>{item.content}</Text>
              {item.aiModelUsed ? <View className="mt-2"><Badge label={item.aiModelUsed} tone="blue" /></View> : null}
            </View>
          )}
        />
        <View className="mt-3 flex-row items-center gap-2 rounded-lg bg-white p-2">
          <Pressable accessibilityRole="button" onPress={attachPhoto} className="h-11 w-11 items-center justify-center rounded-lg bg-field-100">
            <Camera size={20} color={imageBase64 ? "#b77938" : "#24623b"} />
          </Pressable>
          <TextInput
            className="min-h-11 flex-1 text-base text-field-900"
            placeholder="Ask Temo..."
            placeholderTextColor="#7f8d83"
            value={text}
            onChangeText={setText}
            multiline
          />
          <Pressable accessibilityRole="button" onPress={submit} className="h-11 w-11 items-center justify-center rounded-lg bg-field-700">
            <Send size={18} color="#fff" />
          </Pressable>
        </View>
        {mutation.isPending ? <Text className="mt-2 text-center text-field-700">Temo is typing...</Text> : null}
      </Screen>
    </KeyboardAvoidingView>
  );
}
