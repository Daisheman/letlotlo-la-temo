import { View, Text } from "react-native";
import Svg, { Circle, Path } from "react-native-svg";

export function Logo({ size = 64, showText = false }: { size?: number; showText?: boolean }) {
  return (
    <View className="items-center">
      <Svg width={size} height={size} viewBox="0 0 96 96">
        <Circle cx="48" cy="48" r="45" fill="#123524" />
        <Circle cx="65" cy="27" r="11" fill="#f5b642" />
        <Path d="M19 65C31 47 48 40 77 42C70 62 51 75 25 75C22 75 20 72 19 65Z" fill="#3d8b55" />
        <Path d="M25 68C39 61 50 55 69 48" stroke="#e5f3e6" strokeWidth="5" strokeLinecap="round" />
        <Path d="M34 76C39 57 47 43 55 30C60 45 57 63 45 80C41 81 37 80 34 76Z" fill="#b77938" />
        <Path d="M44 79C44 64 47 50 54 35" stroke="#f4e6cf" strokeWidth="4" strokeLinecap="round" />
        <Path d="M67 67C73 61 77 56 79 49C84 56 84 66 78 73C74 76 69 73 67 67Z" fill="#dbeafe" />
      </Svg>
      {showText ? <Text className="mt-2 text-xl font-black text-field-900">Letlotlo la Temo</Text> : null}
    </View>
  );
}
