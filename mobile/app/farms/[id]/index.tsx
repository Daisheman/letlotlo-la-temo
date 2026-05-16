import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native";
import { useLocalSearchParams, router } from "expo-router";

export default function FarmDetailScreen() {
  const { id } = useLocalSearchParams();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => setLoading(false), 1000);
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1B5E35" />
        <Text style={styles.loadingText}>Loading farm data...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Farm Detail</Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>📍 Location</Text>
        <Text style={styles.cardText}>Map view coming in next update</Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>🌱 Soil Health</Text>
        <Text style={styles.cardText}>Fetch soil data to see details</Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>💧 Water Sources</Text>
        <Text style={styles.cardText}>Nearby water sources will appear here</Text>
      </View>
      <TouchableOpacity style={styles.aiButton}>
        <Text style={styles.aiButtonText}>Get AI Recommendation</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  loadingContainer: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#f5f5f5" },
  loadingText: { marginTop: 12, color: "#666", fontSize: 14 },
  header: { backgroundColor: "#1B5E35", padding: 20, paddingTop: 50 },
  backButton: { marginBottom: 8 },
  backText: { color: "rgba(255,255,255,0.8)", fontSize: 14 },
  title: { fontSize: 24, fontWeight: "bold", color: "#fff" },
  card: { backgroundColor: "#fff", margin: 16, marginBottom: 0, borderRadius: 12, padding: 16 },
  cardTitle: { fontSize: 16, fontWeight: "600", color: "#1B5E35", marginBottom: 8 },
  cardText: { fontSize: 14, color: "#666" },
  aiButton: { backgroundColor: "#1B5E35", margin: 16, borderRadius: 12, padding: 16, alignItems: "center" },
  aiButtonText: { color: "#fff", fontSize: 16, fontWeight: "bold" }
});
