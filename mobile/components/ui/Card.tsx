import { PropsWithChildren } from "react";
import { View } from "react-native";

export function Card({ children, className = "" }: PropsWithChildren<{ className?: string }>) {
  return <View className={`rounded-lg border border-field-100 bg-white p-4 shadow-sm ${className}`}>{children}</View>;
}
