import { useState } from "react";
import { Alert, Pressable, Switch, Text, View } from "react-native";
import { router } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, Crown, LogOut, Save } from "lucide-react-native";
import { Screen } from "@/components/ui/Screen";
import { Card } from "@/components/ui/Card";
import { TextField } from "@/components/ui/TextField";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { getProfile, updateProfile } from "@/lib/queries";
import { registerForPushNotifications } from "@/lib/notifications";
import { useAuthStore } from "@/stores/auth-store";

export default function ProfileScreen() {
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const logout = useAuthStore((state) => state.logout);
  const queryClient = useQueryClient();
  const profileQuery = useQuery({ queryKey: ["profile"], queryFn: getProfile, initialData: user ?? undefined });
  const profile = profileQuery.data;
  const [name, setName] = useState(profile?.name ?? "");
  const [phone, setPhone] = useState(profile?.phone ?? "");
  const [language, setLanguage] = useState<"EN" | "TN">(profile?.preferredLanguage ?? "EN");
  const [weatherAlerts, setWeatherAlerts] = useState(true);
  const [plantingReminders, setPlantingReminders] = useState(true);
  const [diseaseAlerts, setDiseaseAlerts] = useState(true);

  const saveMutation = useMutation({
    mutationFn: () => updateProfile({ name, phone, preferredLanguage: language }),
    onSuccess: (updated) => {
      setUser(updated);
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      Alert.alert("Profile saved", "Your settings are updated.");
    }
  });

  async function enablePush() {
    try {
      const token = await registerForPushNotifications();
      Alert.alert(token ? "Notifications enabled" : "Notifications unavailable", token ? "Weather and disease alerts can now reach this phone." : "Use a physical device with notification permission.");
    } catch (error: any) {
      Alert.alert("Could not enable notifications", error.message ?? "Try again.");
    }
  }

  return (
    <Screen>
      <Text className="text-3xl font-black text-field-900">Profile</Text>
      <Text className="mt-1 text-field-700">Settings, language, subscription, and support.</Text>

      <Card className="mt-4">
        <View className="mb-3 flex-row items-center justify-between">
          <Text className="text-lg font-black text-field-900">{profile?.email}</Text>
          <Badge label={profile?.tier ?? "FREE"} tone={profile?.tier === "PREMIUM" ? "gold" : "green"} />
        </View>
        <TextField label="Name" value={name} onChangeText={setName} />
        <TextField label="Phone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
        <Text className="mb-2 font-semibold text-field-900">Language</Text>
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
        <Button title="Save profile" icon={Save} loading={saveMutation.isPending} onPress={() => saveMutation.mutate()} />
      </Card>

      <Card className="mt-4">
        <Text className="mb-3 text-lg font-black text-field-900">Notifications</Text>
        {[
          ["Weather alerts", weatherAlerts, setWeatherAlerts],
          ["Planting reminders", plantingReminders, setPlantingReminders],
          ["Disease outbreak alerts", diseaseAlerts, setDiseaseAlerts]
        ].map(([label, value, setter]) => (
          <View key={label as string} className="mb-3 flex-row items-center justify-between">
            <Text className="font-semibold text-field-800">{label as string}</Text>
            <Switch value={value as boolean} onValueChange={setter as (value: boolean) => void} />
          </View>
        ))}
        <Button title="Enable push alerts" icon={Bell} variant="secondary" onPress={enablePush} />
      </Card>

      <Card className="mt-4">
        <Text className="text-lg font-black text-field-900">Subscription</Text>
        <Text className="mt-1 text-field-700">Free includes 20 AI messages per day. Premium unlocks unlimited AI, full recommendations, and no ads.</Text>
        <View className="mt-3">
          <Button title="Upgrade to Premium" icon={Crown} onPress={() => router.push("/premium")} />
        </View>
      </Card>

      <Card className="mt-4">
        <Text className="text-lg font-black text-field-900">Security</Text>
        <Text className="mt-1 text-field-700">Protect your account with email codes or an authenticator app.</Text>
        <View className="mt-3">
          <Button title="Manage Two-Factor Authentication" variant="secondary" onPress={() => router.push("/settings/mfa-setup" as any)} />
        </View>
      </Card>

      <Card className="mt-4">
        <Text className="font-black text-field-900">Emergency contacts</Text>
        <Text className="mt-2 text-field-700">DVS Botswana: +267 3950500</Text>
        <Text className="text-field-700">Ministry of Agriculture: +267 3950500</Text>
        <Text className="text-field-700">BAMB seeds/fertilizer: +267 3659500</Text>
        <Text className="mt-3 text-xs text-field-600">Version 1.0.0 - support@letlotlotemo.bw</Text>
      </Card>

      <View className="mt-4">
        <Button title="Log out" icon={LogOut} variant="ghost" onPress={async () => { await logout(); router.replace("/(auth)/login"); }} />
      </View>
    </Screen>
  );
}
