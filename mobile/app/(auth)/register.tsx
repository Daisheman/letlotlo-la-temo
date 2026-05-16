import { useState } from "react";
import { Alert, Pressable, Text, View } from "react-native";
import { Link, router } from "expo-router";
import { UserPlus } from "lucide-react-native";
import { Screen } from "@/components/ui/Screen";
import { TextField } from "@/components/ui/TextField";
import { Button } from "@/components/ui/Button";
import { Logo } from "@/components/Logo";
import { useAuthStore } from "@/stores/auth-store";

export default function RegisterScreen() {
  const register = useAuthStore((state) => state.register);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [language, setLanguage] = useState<"EN" | "TN">("EN");
  const [loading, setLoading] = useState(false);

  async function submit() {
    setLoading(true);
    try {
      await register({ name, email, phone, password, preferredLanguage: language });
      router.replace({ pathname: "/(auth)/verify-email", params: { email } } as any);
    } catch (error: any) {
      Alert.alert("Registration failed", error.response?.data?.error ?? "Please check the form.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen>
      <View className="mt-4 items-center">
        <Logo size={56} showText />
      </View>
      <View className="mt-6">
        <TextField label="Full name" value={name} onChangeText={setName} />
        <TextField label="Email" autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} />
        <TextField label="Phone" keyboardType="phone-pad" value={phone} onChangeText={setPhone} />
        <TextField label="Password" secureTextEntry value={password} onChangeText={setPassword} />
        <Text className="mb-2 font-semibold text-field-900">Preferred language</Text>
        <View className="mb-4 flex-row gap-2">
          {(["EN", "TN"] as const).map((option) => (
            <Pressable
              key={option}
              onPress={() => setLanguage(option)}
              className={`flex-1 rounded-lg border px-4 py-3 ${language === option ? "border-field-700 bg-field-700" : "border-field-100 bg-white"}`}
            >
              <Text className={`text-center font-bold ${language === option ? "text-white" : "text-field-900"}`}>
                {option === "EN" ? "English" : "Setswana"}
              </Text>
            </Pressable>
          ))}
        </View>
        <Button title="Create account" icon={UserPlus} loading={loading} onPress={submit} />
      </View>
      <Link href="/(auth)/login" asChild>
        <Pressable className="mt-5 items-center">
          <Text className="font-semibold text-field-700">I already have an account</Text>
        </Pressable>
      </Link>
    </Screen>
  );
}
