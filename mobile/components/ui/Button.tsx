import { ActivityIndicator, Pressable, Text, View } from "react-native";
import type { LucideIcon } from "lucide-react-native";

type ButtonProps = {
  title: string;
  onPress?: () => void;
  icon?: LucideIcon;
  variant?: "primary" | "secondary" | "danger" | "ghost";
  loading?: boolean;
  disabled?: boolean;
};

const styles = {
  primary: "bg-field-700",
  secondary: "bg-soil-400",
  danger: "bg-red-600",
  ghost: "bg-transparent border border-field-700"
};

const text = {
  primary: "text-white",
  secondary: "text-white",
  danger: "text-white",
  ghost: "text-field-700"
};

export function Button({ title, onPress, icon: Icon, variant = "primary", loading, disabled }: ButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled || loading}
      onPress={onPress}
      className={`min-h-12 flex-row items-center justify-center rounded-lg px-4 ${styles[variant]} ${disabled ? "opacity-50" : ""}`}
    >
      {loading ? (
        <ActivityIndicator color={variant === "ghost" ? "#24623b" : "#ffffff"} />
      ) : (
        <View className="flex-row items-center gap-2">
          {Icon ? <Icon size={18} color={variant === "ghost" ? "#24623b" : "#ffffff"} /> : null}
          <Text className={`font-semibold ${text[variant]}`}>{title}</Text>
        </View>
      )}
    </Pressable>
  );
}
