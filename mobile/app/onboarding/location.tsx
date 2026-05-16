import { useState } from "react";
import { Alert, Text, View } from "react-native";
import * as Location from "expo-location";
import MapView, { Marker } from "react-native-maps";
import { router } from "expo-router";
import { MapPin } from "lucide-react-native";
import { Screen } from "@/components/ui/Screen";
import { Button } from "@/components/ui/Button";
import { useAuthStore } from "@/stores/auth-store";
import { updateProfile } from "@/lib/queries";

export default function LocationScreen() {
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const [coords, setCoords] = useState({ latitude: user?.locationLat ?? -24.6282, longitude: user?.locationLng ?? 25.9231 });
  const [loading, setLoading] = useState(false);

  async function requestLocation() {
    setLoading(true);
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== "granted") {
        Alert.alert("Permission needed", "GPS permission helps Temo tailor weather, soil, and water advice.");
        return;
      }
      const position = await Location.getCurrentPositionAsync({});
      setCoords({ latitude: position.coords.latitude, longitude: position.coords.longitude });
    } finally {
      setLoading(false);
    }
  }

  async function confirm() {
    if (user) {
      const updated = await updateProfile({
        locationLat: coords.latitude,
        locationLng: coords.longitude,
        locationName: "Confirmed farm district"
      });
      setUser(updated);
    }
    router.push("/onboarding/first-farm");
  }

  return (
    <Screen>
      <Text className="text-3xl font-black text-field-900">Confirm location</Text>
      <Text className="mt-2 text-field-700">Temo uses GPS to match advice to rainfall, frost risk, soil, and nearby water.</Text>
      <View className="mt-5 h-80 overflow-hidden rounded-lg border border-field-100">
        <MapView
          style={{ flex: 1 }}
          region={{ latitude: coords.latitude, longitude: coords.longitude, latitudeDelta: 0.2, longitudeDelta: 0.2 }}
          onPress={(event) => setCoords(event.nativeEvent.coordinate)}
        >
          <Marker coordinate={coords} title="Farm location" />
        </MapView>
      </View>
      <View className="mt-4 gap-3">
        <Button title="Use my GPS" icon={MapPin} loading={loading} onPress={requestLocation} variant="secondary" />
        <Button title="Confirm district" onPress={confirm} />
      </View>
    </Screen>
  );
}
