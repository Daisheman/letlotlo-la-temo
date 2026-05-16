import { useMemo, useState } from "react";
import { Alert, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Eye, EyeOff } from "lucide-react-native";
import { api } from "@/lib/api";
import { Screen } from "@/components/ui/Screen";
import { TextField } from "@/components/ui/TextField";
import { Button } from "@/components/ui/Button";

export default function NewPasswordScreen() {
  const { resetToken = "" } = useLocalSearchParams<{ resetToken: string }>();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const requirements = useMemo(
    () => [
      ["At least 8 characters", password.length >= 8],
      ["One uppercase letter", /[A-Z]/.test(password)],
      ["One number", /\d/.test(password)],
      ["One special character (!@#$%^&*)", /[!@#$%^&*]/.test(password)]
    ] as const,
    [password]
  );
  const met = requirements.filter((item) => item[1]).length;
  const ready = met === requirements.length && password === confirm;

  async function submit() {
    setLoading(true);
    try {
      await api.post("/auth/reset-password", { resetToken, newPassword: password, confirmPassword: confirm });
      Alert.alert("Password reset", "Password reset! Please log in.");
      router.replace("/(auth)/login");
    } catch (err: any) {
      Alert.alert("Could not reset", err.response?.data?.error ?? "Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen>
      <Text className="mt-8 text-3xl font-black text-field-900">New password</Text>
      <Text className="mt-2 text-field-700">Choose a strong password for your farming account.</Text>
      <View className="mt-6">
        <TextField label="New password" value={password} onChangeText={setPassword} secureTextEntry={!show} />
        <Button title={show ? "Hide password" : "Show password"} icon={show ? EyeOff : Eye} variant="ghost" onPress={() => setShow((value) => !value)} />
        <View className="my-4 h-2 overflow-hidden rounded-full bg-field-100">
          <View className={`${met <= 1 ? "bg-red-500" : met === 2 ? "bg-yellow-500" : met === 3 ? "bg-blue-500" : "bg-field-700"} h-2`} style={{ width: `${met * 25}%` }} />
        </View>
        <TextField label="Confirm password" value={confirm} onChangeText={setConfirm} secureTextEntry={!show} />
        {requirements.map(([label, ok]) => (
          <Text key={label} className={`mb-1 font-semibold ${ok ? "text-field-700" : "text-gray-500"}`}>✓ {label}</Text>
        ))}
        <Text className={`mt-1 font-semibold ${password && confirm && password === confirm ? "text-field-700" : "text-gray-500"}`}>✓ Passwords match</Text>
        <View className="mt-5">
          <Button title="Reset Password" loading={loading} disabled={!ready} onPress={submit} />
        </View>
      </View>
    </Screen>
  );
}
