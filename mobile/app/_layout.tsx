import "../global.css";
import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { QueryProvider } from "@/lib/query-client";
import { useAuthStore } from "@/stores/auth-store";
import { useChatStore } from "@/stores/chat-store";
import { useWeatherStore } from "@/stores/weather-store";
import { configureRevenueCat } from "@/lib/revenuecat";

function RootNavigator() {
  const bootstrap = useAuthStore((state) => state.bootstrap);
  const user = useAuthStore((state) => state.user);
  const isBootstrapped = useAuthStore((state) => state.isBootstrapped);
  const hydrateChat = useChatStore((state) => state.hydrate);
  const hydrateWeather = useWeatherStore((state) => state.hydrate);

  useEffect(() => {
    bootstrap();
    hydrateChat();
    hydrateWeather();
  }, [bootstrap, hydrateChat, hydrateWeather]);

  useEffect(() => {
    configureRevenueCat(user?.revenuecatUserId ?? user?.id);
  }, [user?.id, user?.revenuecatUserId]);

  if (!isBootstrapped) {
    return (
      <View className="flex-1 items-center justify-center bg-field-50">
        <ActivityIndicator color="#24623b" />
      </View>
    );
  }

  return (
    <>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="farms" />
        <Stack.Screen name="livestock" />
        <Stack.Screen name="chat" />
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="premium/index" options={{ presentation: "modal" }} />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <QueryProvider>
      <RootNavigator />
    </QueryProvider>
  );
}
