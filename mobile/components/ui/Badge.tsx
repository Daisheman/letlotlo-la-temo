import { Text, View } from "react-native";

export function Badge({ label, tone = "green" }: { label: string; tone?: "green" | "gold" | "red" | "blue" }) {
  const style = {
    green: "bg-field-100 text-field-700",
    gold: "bg-yellow-100 text-yellow-800",
    red: "bg-red-100 text-red-700",
    blue: "bg-blue-100 text-blue-700"
  }[tone];
  return (
    <View className={`self-start rounded-full px-3 py-1 ${style.split(" ")[0]}`}>
      <Text className={`text-xs font-bold ${style.split(" ")[1]}`}>{label}</Text>
    </View>
  );
}
