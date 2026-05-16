import { useState } from "react";
import { Alert, Pressable, Text, View } from "react-native";
import { Link, router } from "expo-router";
import { LogIn } from "lucide-react-native";
import { Screen } from "@/components/ui/Screen";
import { TextField } from "@/components/ui/TextField";
import { Button } from "@/components/ui/Button";
import { Logo } from "@/components/Logo";
import { useAuthStore } from "@/stores/auth-store";
import { api } from "@/lib/api";
import { secureKeys, setSecureItem } from "@/lib/storage";

export default function LoginScreen() {
  const setUser = useAuthStore((state) => state.setUser);
  const [email, setEmail] = useState("kefilwe@example.com");
  const [password, setPassword] = useState("Password123!");
  const [loading, setLoading] = useState(false);

  async function submit() {
    setLoading(true);
    try {
      const { data } = await api.post("/auth/login", { email, password, deviceFingerprint: "mobile-local-device" });
      if (data.emailVerificationRequired) {
        router.replace({ pathname: "/(auth)/verify-email", params: { email } } as any);
      } else if (data.mfaRequired) {
        router.replace({ pathname: "/(auth)/mfa-verify", params: { mfaToken: data.mfaToken, method: data.mfaMethod } } as any);
      } else {
        await setSecureItem(secureKeys.accessToken, data.accessToken);
        await setSecureItem(secureKeys.refreshToken, data.refreshToken);
        setUser(data.user);
        router.replace("/(tabs)");
      }
    } catch (error: any) {
      Alert.alert("Login failed", error.response?.data?.error ?? "Check your email and password.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen>
      <View className="mt-8 items-center">
        <Logo showText />
        <Text className="mt-2 text-center text-field-700">AI farming guidance for Botswana and Southern Africa</Text>
      </View>
      <View className="mt-8">
        <TextField label="Email" autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} />
        <TextField label="Password" secureTextEntry value={password} onChangeText={setPassword} />
        <Button title="Log in" icon={LogIn} loading={loading} onPress={submit} />
      </View>
      <View className="mt-5 items-center gap-3">
        <Link href="/(auth)/forgot-password" asChild>
          <Pressable>
            <Text className="font-semibold text-field-700">Forgot password?</Text>
          </Pressable>
        </Link>
        <Link href="/(auth)/register" asChild>
          <Pressable>
            <Text className="font-semibold text-soil-700">Create a new farmer account</Text>
          </Pressable>
        </Link>
      </View>
    </Screen>
  );
}
