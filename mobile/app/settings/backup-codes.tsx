import { Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Screen } from "@/components/ui/Screen";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export default function BackupCodesScreen() {
  const { codes = "" } = useLocalSearchParams<{ codes: string }>();
  const list = codes.split(",").filter(Boolean);
  return (
    <Screen>
      <Text className="text-3xl font-black text-field-900">Backup codes</Text>
      <Text className="mt-2 text-field-700">Save these backup codes. Each can only be used once if you lose your authenticator.</Text>
      <Card className="mt-5">
        <View className="flex-row flex-wrap gap-2">
          {list.map((code) => (
            <View key={code} className="rounded-lg bg-field-100 px-3 py-2">
              <Text className="font-black text-field-900">{code}</Text>
            </View>
          ))}
        </View>
      </Card>
      <View className="mt-5">
        <Button title="I saved these codes" onPress={() => router.replace("/(tabs)/profile")} />
      </View>
    </Screen>
  );
}
