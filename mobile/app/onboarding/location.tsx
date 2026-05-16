import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from "react-native";
import * as Location from "expo-location";
import { router } from "expo-router";

export default function LocationScreen() {
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);

  const getLocation = async () => {
    setLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission needed", "Please allow location access to get farming advice for your area.");
        setLoading(false);
        return;
      }
      const loc = await Location.getCurrentPositionAsync({});
      setLocation({ lat: loc.coords.latitude, lng: loc.coords.longitude });
    } catch (e) {
      Alert.alert("Error", "Could not get your location. Please try again.");
    }
    setLoading(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.emoji}>📍</Text>
        <Text style={styles.title}>Where is your farm?</Text>
        <Text style={styles.subtitle}>
          We use your location to give you accurate soil data, weather forecasts, and farming advice for your area.
        </Text>
        {location && (
          <View style={styles.locationCard}>
            <Text style={styles.locationText}>✓ Location detected</Text>
            <Text style={styles.coordsText}>
              {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
            </Text>
          </View>
        )}
        <TouchableOpacity
          style={styles.button}
          onPress={location ? () => router.push("/onboarding/first-farm") : getLocation}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>
              {location ? "Continue →" : "Detect My Location"}
            </Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity style={styles.skipButton} onPress={() => router.push("/onboarding/first-farm")}>
          <Text style={styles.skipText}>Enter location manually instead</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#1B5E35" },
  content: { flex: 1, padding: 32, justifyContent: "center", alignItems: "center" },
  emoji: { fontSize: 64, marginBottom: 24 },
  title: { fontSize: 28, fontWeight: "bold", color: "#fff", textAlign: "center", marginBottom: 16 },
  subtitle: { fontSize: 16, color: "rgba(255,255,255,0.8)", textAlign: "center", lineHeight: 24, marginBottom: 32 },
  locationCard: { backgroundColor: "rgba(255,255,255,0.15)", borderRadius: 12, padding: 16, marginBottom: 24, width: "100%", alignItems: "center" },
  locationText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  coordsText: { color: "rgba(255,255,255,0.7)", fontSize: 12, marginTop: 4 },
  button: { backgroundColor: "#C8861A", borderRadius: 12, padding: 16, width: "100%", alignItems: "center", marginBottom: 16 },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  skipButton: { padding: 8 },
  skipText: { color: "rgba(255,255,255,0.6)", fontSize: 14, textDecorationLine: "underline" }
});
