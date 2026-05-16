import { useState } from "react";
import { Alert, Text, View } from "react-native";
import { router } from "expo-router";
import { Send } from "lucide-react-native";
import { api } from "@/lib/api";
import { Screen } from "@/components/ui/Screen";
import { TextField } from "@/components/ui/TextField";
import { Button } from "@/components/ui/Button";

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit() {
    setLoading(true);
    try {
      await api.post("/auth/forgot-password", { email });
      router.push({ pathname: "/(auth)/reset-password-otp", params: { email } } as any);
    } catch (error: any) {
      Alert.alert("Could not request reset", error.response?.data?.error ?? "Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen>
      <View className="mt-10">
        <Text className="text-3xl font-black text-field-900">Reset password</Text>
        <Text className="mt-2 text-field-700">Enter your account email and we will prepare a password reset token.</Text>
      </View>
      <View className="mt-8">
        <TextField label="Email" autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} />
        <Button title="Send reset" icon={Send} loading={loading} onPress={submit} />
      </View>
    </Screen>
  );
}
