import { useState } from "react";
import { Alert, Pressable, Text, View } from "react-native";
import QRCode from "react-native-qrcode-svg";
import { router } from "expo-router";
import { ShieldCheck } from "lucide-react-native";
import { api } from "@/lib/api";
import { Screen } from "@/components/ui/Screen";
import { TextField } from "@/components/ui/TextField";
import { Button } from "@/components/ui/Button";
import { OtpInput } from "@/components/OtpInput";

export default function MfaSetupScreen() {
  const [password, setPassword] = useState("");
  const [method, setMethod] = useState<"EMAIL" | "TOTP">("EMAIL");
  const [step, setStep] = useState<"choose" | "confirm">("choose");
  const [code, setCode] = useState("");
  const [qr, setQr] = useState("");
  const [secret, setSecret] = useState("");
  const [loading, setLoading] = useState(false);

  async function init() {
    setLoading(true);
    try {
      const { data } = await api.post("/auth/mfa/setup-init", { password, method });
      setQr(data.otpauth ?? "");
      setSecret(data.secret ?? "");
      setStep("confirm");
    } catch (err: any) {
      Alert.alert("Could not start MFA", err.response?.data?.error ?? "Try again.");
    } finally {
      setLoading(false);
    }
  }

  async function confirm() {
    setLoading(true);
    try {
      const { data } = await api.post("/auth/mfa/setup-confirm", { method, code });
      if (data.backupCodes?.length) {
        router.replace({ pathname: "/settings/backup-codes", params: { codes: data.backupCodes.join(",") } } as any);
      } else {
        Alert.alert("MFA enabled", "Email OTP is now active on your account.");
        router.back();
      }
    } catch (err: any) {
      Alert.alert("Invalid code", err.response?.data?.error ?? "Try again.");
    } finally {
      setLoading(false);
    }
  }

  async function disable() {
    try {
      await api.post("/auth/mfa/disable", { password, code });
      Alert.alert("MFA disabled", "Two-factor authentication has been disabled.");
      router.back();
    } catch (err: any) {
      Alert.alert("Could not disable", err.response?.data?.error ?? "Enter your password and current code.");
    }
  }

  return (
    <Screen>
      <View className="items-center">
        <ShieldCheck size={52} color="#24623b" />
        <Text className="mt-3 text-3xl font-black text-field-900">Two-Factor Authentication</Text>
      </View>
      {step === "choose" ? (
        <View className="mt-6">
          <TextField label="Current password" value={password} onChangeText={setPassword} secureTextEntry />
          <Text className="mb-2 font-semibold text-field-900">Choose method</Text>
          <View className="mb-4 flex-row gap-2">
            {(["EMAIL", "TOTP"] as const).map((item) => (
              <Pressable key={item} onPress={() => setMethod(item)} className={`flex-1 rounded-lg border px-4 py-3 ${method === item ? "border-field-700 bg-field-700" : "border-field-100 bg-white"}`}>
                <Text className={`text-center font-bold ${method === item ? "text-white" : "text-field-900"}`}>{item === "EMAIL" ? "Email OTP" : "Authenticator App"}</Text>
              </Pressable>
            ))}
          </View>
          <Button title="Start setup" loading={loading} disabled={!password} onPress={init} />
        </View>
      ) : (
        <View className="mt-6">
          {method === "TOTP" ? (
            <View className="mb-4 items-center rounded-lg bg-white p-4">
              <QRCode value={qr} size={190} />
              <Text className="mt-3 text-center text-field-700">Scan this QR code with Google Authenticator or Authy, then enter the current 6-digit code.</Text>
              <Text className="mt-2 text-xs text-field-700">Secret: {secret}</Text>
            </View>
          ) : (
            <Text className="mb-4 text-center text-field-700">A test code was sent to your verified email.</Text>
          )}
          <OtpInput value={code} onChange={setCode} />
          <View className="mt-5 gap-3">
            <Button title="Confirm and enable MFA" loading={loading} disabled={code.length !== 6} onPress={confirm} />
            <Button title="Disable MFA" variant="danger" onPress={disable} />
          </View>
        </View>
      )}
    </Screen>
  );
}
