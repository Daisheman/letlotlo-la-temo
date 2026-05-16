import { useState } from "react";
import { Text, View, Switch } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { ShieldCheck } from "lucide-react-native";
import { Screen } from "@/components/ui/Screen";
import { Button } from "@/components/ui/Button";
import { OtpInput } from "@/components/OtpInput";
import { useAuthStore } from "@/stores/auth-store";

export default function MfaVerifyScreen() {
  const { mfaToken = "", method = "EMAIL" } = useLocalSearchParams<{ mfaToken: string; method: string }>();
  const verifyMfa = useAuthStore((state) => state.verifyMfa);
  const [code, setCode] = useState("");
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit() {
    setLoading(true);
    setError("");
    try {
      await verifyMfa({ mfaToken, code, rememberDevice: remember, deviceFingerprint: "mobile-local-device", deviceName: "Mobile app" });
      router.replace("/(tabs)");
    } catch (err: any) {
      setError(err.response?.data?.error ?? "Invalid MFA code");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen>
      <View className="mt-8 items-center">
        <ShieldCheck size={54} color="#24623b" />
        <Text className="mt-3 text-3xl font-black text-field-900">Two-factor code</Text>
        <Text className="mt-2 text-center text-field-700">{method === "TOTP" ? "Enter the code from your authenticator app." : "Enter the code sent to your verified email."}</Text>
      </View>
      <View className="mt-8">
        <OtpInput value={code} onChange={setCode} hasError={Boolean(error)} />
        {error ? <Text className="mt-3 text-center font-semibold text-red-600">{error}</Text> : null}
      </View>
      <View className="mt-5 flex-row items-center justify-between">
        <Text className="font-semibold text-field-800">Remember this device for 30 days</Text>
        <Switch value={remember} onValueChange={setRemember} />
      </View>
      <View className="mt-6">
        <Button title="Verify" loading={loading} disabled={code.length !== 6} onPress={submit} />
      </View>
    </Screen>
  );
}
