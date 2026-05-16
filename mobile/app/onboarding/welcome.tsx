import { Pressable, Text, View } from "react-native";
import { router } from "expo-router";
import { ArrowRight } from "lucide-react-native";
import { Logo } from "@/components/Logo";
import { Screen } from "@/components/ui/Screen";
import { Button } from "@/components/ui/Button";
import { useAuthStore } from "@/stores/auth-store";

export default function WelcomeScreen() {
  const language = useAuthStore((state) => state.language);
  const setLanguage = useAuthStore((state) => state.setLanguage);

  return (
    <Screen>
      <View className="mt-10 items-center">
        <Logo size={88} showText />
        <Text className="mt-3 text-center text-lg text-field-700">Your practical AI farming assistant for Botswana.</Text>
      </View>
      <View className="mt-10">
        <Text className="mb-3 text-lg font-bold text-field-900">Choose language</Text>
        <View className="flex-row gap-3">
          {(["EN", "TN"] as const).map((option) => (
            <Pressable
              key={option}
              onPress={() => setLanguage(option)}
              className={`flex-1 rounded-lg border px-4 py-4 ${language === option ? "border-field-700 bg-field-700" : "border-field-100 bg-white"}`}
            >
              <Text className={`text-center font-bold ${language === option ? "text-white" : "text-field-900"}`}>
                {option === "EN" ? "English" : "Setswana"}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
      <View className="mt-8">
        <Button title="Continue" icon={ArrowRight} onPress={() => router.push("/onboarding/location")} />
      </View>
    </Screen>
  );
}
