import { Text, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { CloudRain, ThermometerSun } from "lucide-react-native";
import { Screen } from "@/components/ui/Screen";
import { Card } from "@/components/ui/Card";
import { getFarm, getWeather } from "@/lib/queries";

export default function FarmWeatherScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const farmQuery = useQuery({ queryKey: ["farm", id], queryFn: () => getFarm(id), enabled: Boolean(id) });
  const farm = farmQuery.data;
  const weatherQuery = useQuery({ queryKey: ["forecast", farm?.id], queryFn: () => getWeather(farm!.lat, farm!.lng, 14), enabled: Boolean(farm) });
  const daily = (weatherQuery.data as any)?.daily ?? {};
  const dates: string[] = daily.time ?? [];

  return (
    <Screen>
      <Text className="text-3xl font-black text-field-900">Farm Weather</Text>
      <Text className="mt-1 text-field-700">14-day forecast for irrigation, planting, frost, and rain risk.</Text>

      <View className="mt-4 gap-3">
        {dates.map((date, index) => {
          const min = daily.temperature_2m_min?.[index];
          const max = daily.temperature_2m_max?.[index];
          const rain = daily.precipitation_sum?.[index] ?? 0;
          const frost = typeof min === "number" && min < 4;
          const heavyRain = rain > 40;
          return (
            <Card key={date}>
              <View className="flex-row items-center justify-between">
                <View>
                  <Text className="font-black text-field-900">{new Date(date).toLocaleDateString()}</Text>
                  <Text className="mt-1 text-field-700">{min ?? "--"}°C min / {max ?? "--"}°C max</Text>
                  <Text className="mt-1 text-field-700">{rain} mm rain</Text>
                </View>
                {rain > 0 ? <CloudRain size={28} color="#2563eb" /> : <ThermometerSun size={28} color="#f5b642" />}
              </View>
              {frost ? <Text className="mt-2 font-bold text-red-600">Frost warning: protect seedlings and young vegetables.</Text> : null}
              {heavyRain ? <Text className="mt-2 font-bold text-blue-700">Heavy rain warning: check drainage and delay fertilizer spreading.</Text> : null}
            </Card>
          );
        })}
        {!dates.length ? (
          <Card>
            <Text className="text-field-700">Forecast unavailable. Cached weather will appear when available.</Text>
          </Card>
        ) : null}
      </View>
    </Screen>
  );
}
