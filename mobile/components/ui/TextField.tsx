import { Text, TextInput, TextInputProps, View } from "react-native";

type Props = TextInputProps & {
  label: string;
};

export function TextField({ label, className = "", ...props }: Props) {
  return (
    <View className="mb-3">
      <Text className="mb-1 text-sm font-semibold text-field-900">{label}</Text>
      <TextInput
        placeholderTextColor="#7f8d83"
        className={`min-h-12 rounded-lg border border-field-100 bg-white px-3 text-base text-field-900 ${className}`}
        {...props}
      />
    </View>
  );
}
