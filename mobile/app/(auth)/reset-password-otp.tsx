import { useEffect, useState } from "react";
import { Alert, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { api } from "@/lib/api";
import { Screen } from "@/components/ui/Screen";
import { Button } from "@/components/ui/Button";
import { OtpInput } from "@/components/OtpInput";
import { formatSeconds } from "@/lib/timers";

export default function ResetPasswordOtpScreen() {
  const { email = "" } = useLocalSearchParams<{ email: string }>();
  const [code, setCode] = useState("");
  const [remaining, setRemaining] = useState(900);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setRemaining((value) => Math.max(0, value - 1)), 1000);
    return () => clearInterval(timer);
  }, []);

  async function submit() {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.post("/auth/verify-reset-otp", { email, code });
      router.replace({ pathname: "/(auth)/new-password", params: { resetToken: data.resetToken } } as any);
    } catch (err: any) {
      setError(err.response?.data?.error ?? "Invalid code");
    } finally {
      setLoading(false);
    }
  }

  async function resend() {
    await api.post("/auth/forgot-password", { email });
    setRemaining(900);
    Alert.alert("Code sent", "A new reset code was sent if the email is registered.");
  }

  return (
    <Screen>
      <Text className="mt-8 text-3xl font-black text-field-900">Reset code</Text>
      <Text className="mt-2 text-field-700">Enter the code sent to {email}</Text>
      <Text className="mt-4 font-bold text-soil-700">{formatSeconds(remaining)}</Text>
      <View className="mt-6">
        <OtpInput value={code} onChange={setCode} hasError={Boolean(error)} />
        {error ? <Text className="mt-3 text-center font-semibold text-red-600">{error}</Text> : null}
      </View>
      <View className="mt-6 gap-3">
        <Button title="Continue" loading={loading} disabled={code.length !== 6} onPress={submit} />
        <Button title="Resend code" variant="ghost" onPress={resend} />
      </View>
    </Screen>
  );
}
