import { useState } from "react";
import { Alert, Text, View } from "react-native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Screen } from "@/components/ui/Screen";
import { Card } from "@/components/ui/Card";
import { TextField } from "@/components/ui/TextField";
import { Button } from "@/components/ui/Button";
import { getMarketPrices, reportMarketPrice } from "@/lib/queries";

const covered = "Maize, Sorghum, Millet, Groundnuts, Sunflower, Cowpeas, Watermelon, Sorghum beer grain, Beef, Goat, Chicken";

export default function MarketPricesScreen() {
  const queryClient = useQueryClient();
  const pricesQuery = useQuery({ queryKey: ["market-prices"], queryFn: () => getMarketPrices() });
  const [crop, setCrop] = useState("Maize");
  const [price, setPrice] = useState("");
  const [district, setDistrict] = useState("North-East District");
  const [marketName, setMarketName] = useState("");
  const mutation = useMutation({
    mutationFn: () => reportMarketPrice({ crop, pricePerKg: Number(price), district, marketName }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["market-prices"] });
      setPrice("");
    },
    onError: (err: any) => Alert.alert("Could not report price", err.response?.data?.error ?? "Try again.")
  });

  return (
    <Screen>
      <Text className="text-3xl font-black text-field-900">Market Prices</Text>
      <Text className="mt-2 text-field-700">Prices reported by community members. Verify before trading.</Text>
      <Text className="mt-2 text-xs text-field-700">Covered: {covered}</Text>
      <Card className="mt-4">
        <Text className="mb-3 text-lg font-black text-field-900">Report a price</Text>
        <TextField label="Crop or product" value={crop} onChangeText={setCrop} />
        <TextField label="BWP per kg/head/bird" value={price} onChangeText={setPrice} keyboardType="decimal-pad" />
        <TextField label="District" value={district} onChangeText={setDistrict} />
        <TextField label="Market name" value={marketName} onChangeText={setMarketName} />
        <Button title="Report Price" loading={mutation.isPending} onPress={() => mutation.mutate()} />
      </Card>
      <View className="mt-4 gap-3">
        {(pricesQuery.data ?? []).map((item) => (
          <Card key={item.id}>
            <View className="flex-row items-center justify-between">
              <Text className="font-black text-field-900">{item.crop}</Text>
              <Text className="font-black text-soil-700">BWP {item.pricePerKg.toFixed(2)}</Text>
            </View>
            <Text className="mt-1 text-field-700">{item.district} - {item.marketName ?? "community report"}</Text>
            <View className="mt-3 h-8 flex-row items-end gap-1">
              {Array.from({ length: 12 }).map((_, index) => (
                <View key={index} className="w-3 rounded-t bg-field-500" style={{ height: 8 + ((index * 7) % 24) }} />
              ))}
            </View>
          </Card>
        ))}
      </View>
    </Screen>
  );
}
