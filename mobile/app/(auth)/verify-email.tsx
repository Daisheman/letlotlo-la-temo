import { useEffect, useState } from "react";
import { Alert, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { CheckCircle } from "lucide-react-native";
import { Screen } from "@/components/ui/Screen";
import { Button } from "@/components/ui/Button";
import { Logo } from "@/components/Logo";
import { OtpInput } from "@/components/OtpInput";
import { formatSeconds } from "@/lib/timers";
import { resendVerification } from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";

export default function VerifyEmailScreen() {
  const { email = "" } = useLocalSearchParams<{ email: string }>();
  const verifyEmail = useAuthStore((state) => state.verifyEmail);
  const [code, setCode] = useState("");
  const [remaining, setRemaining] = useState(15 * 60);
  const [resendWait, setResendWait] = useState(60);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setRemaining((value) => Math.max(0, value - 1));
      setResendWait((value) => Math.max(0, value - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  async function submit() {
    setLoading(true);
    setError("");
    try {
      await verifyEmail(email, code);
      setSuccess(true);
      setTimeout(() => router.replace("/(tabs)"), 700);
    } catch (err: any) {
      setError(err.response?.data?.error ?? "Invalid code");
    } finally {
      setLoading(false);
    }
  }

  async function resend() {
    try {
      await resendVerification(email);
      setRemaining(15 * 60);
      setResendWait(60);
      Alert.alert("Code sent", "A fresh verification code was sent.");
    } catch (err: any) {
      Alert.alert("Could not resend", err.response?.data?.error ?? "Try later.");
    }
  }

  return (
    <Screen>
      <View className="items-center rounded-lg bg-field-700 p-6">
        <Logo size={64} />
        <Text className="mt-3 text-2xl font-black text-white">Verify email</Text>
      </View>
      <Text className="mt-6 text-center text-field-700">Enter the 6-digit code sent to {email}</Text>
      <Text className="mt-2 text-center font-bold text-soil-700">{remaining ? formatSeconds(remaining) : "Code expired"}</Text>
      <View className="mt-6">
        <OtpInput value={code} onChange={setCode} hasError={Boolean(error)} />
        {error ? <Text className="mt-3 text-center font-semibold text-red-600">{error}</Text> : null}
        {success ? <View className="mt-4 items-center"><CheckCircle color="#24623b" size={40} /><Text className="mt-2 font-bold text-field-700">Verified</Text></View> : null}
      </View>
      <View className="mt-6 gap-3">
        <Button title="Verify" loading={loading} disabled={code.length !== 6 || remaining === 0} onPress={submit} variant="secondary" />
        <Button title={resendWait ? `Resend Code (${resendWait}s)` : "Resend Code"} disabled={resendWait > 0} variant="ghost" onPress={resend} />
      </View>
    </Screen>
  );
}
