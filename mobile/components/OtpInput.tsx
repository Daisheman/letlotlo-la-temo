import { useEffect, useRef } from "react";
import { Animated, TextInput, View } from "react-native";

export function OtpInput({ value, onChange, hasError }: { value: string; onChange: (value: string) => void; hasError?: boolean }) {
  const refs = useRef<Array<TextInput | null>>([]);
  const shake = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!hasError) return;
    Animated.sequence([
      Animated.timing(shake, { toValue: 8, duration: 50, useNativeDriver: true }),
      Animated.timing(shake, { toValue: -8, duration: 50, useNativeDriver: true }),
      Animated.timing(shake, { toValue: 0, duration: 50, useNativeDriver: true })
    ]).start();
  }, [hasError, shake]);

  return (
    <Animated.View style={{ transform: [{ translateX: shake }] }}>
      <View className="flex-row justify-between gap-2">
        {Array.from({ length: 6 }).map((_, index) => (
          <TextInput
            key={index}
            ref={(ref) => (refs.current[index] = ref)}
            value={value[index] ?? ""}
            keyboardType="number-pad"
            maxLength={1}
            onChangeText={(text) => {
              const digit = text.replace(/\D/g, "");
              const next = value.split("");
              next[index] = digit;
              const joined = next.join("").slice(0, 6);
              onChange(joined);
              if (digit && index < 5) refs.current[index + 1]?.focus();
            }}
            className={`h-14 flex-1 rounded-lg border bg-white text-center text-2xl font-black text-field-900 ${hasError ? "border-red-600" : "border-soil-400"}`}
          />
        ))}
      </View>
    </Animated.View>
  );
}
