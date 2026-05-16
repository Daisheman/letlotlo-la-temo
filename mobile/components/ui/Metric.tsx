import { Text, View } from "react-native";

export function Metric({ label, value }: { label: string; value: string }) {
  return (
    <View className="min-w-[92px] rounded-lg bg-field-50 p-3">
      <Text className="text-lg font-bold text-field-900">{value}</Text>
      <Text className="mt-1 text-xs text-field-700">{label}</Text>
    </View>
  );
}
