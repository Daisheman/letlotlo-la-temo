import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from "react-native";
import { router } from "expo-router";

export default function PremiumScreen() {
  const [loading, setLoading] = useState(false);

  const handleUpgrade = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      Alert.alert("Coming Soon", "Premium payments launching soon. Thank you for your interest!");
    }, 500);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Letlotlo la Temo Premium</Text>
        <Text style={styles.subtitle}>Unlock the full power of AI farming</Text>
      </View>
      <View style={styles.featuresContainer}>
        <Text style={styles.featuresTitle}>Premium Features</Text>
        {[
          "Unlimited AI farming recommendations",
          "Unlimited AI livestock diagnosis",
          "Unlimited chat messages",
          "Historical climate analysis (24 months)",
          "Yield tracking and PDF reports",
          "No advertisements",
          "Priority support"
        ].map((feature, index) => (
          <View key={index} style={styles.featureRow}>
            <Text style={styles.checkmark}>✓</Text>
            <Text style={styles.featureText}>{feature}</Text>
          </View>
        ))}
      </View>
      <View style={styles.pricingContainer}>
        <TouchableOpacity style={styles.planCard}>
          <Text style={styles.planName}>Monthly</Text>
          <Text style={styles.planPrice}>BWP 150</Text>
          <Text style={styles.planPeriod}>per month</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.planCard, styles.planCardFeatured]}>
          <Text style={styles.saveBadge}>SAVE 33%</Text>
          <Text style={styles.planName}>Annual</Text>
          <Text style={styles.planPrice}>BWP 1,200</Text>
          <Text style={styles.planPeriod}>per year</Text>
        </TouchableOpacity>
      </View>
      <TouchableOpacity
        style={[styles.upgradeButton, loading && styles.upgradeButtonDisabled]}
        onPress={handleUpgrade}
        disabled={loading}
      >
        <Text style={styles.upgradeButtonText}>
          {loading ? "Processing..." : "Upgrade to Premium"}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Text style={styles.backButtonText}>Maybe later</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  header: { backgroundColor: "#1B5E35", padding: 32, alignItems: "center" },
  title: { fontSize: 24, fontWeight: "bold", color: "#fff", textAlign: "center" },
  subtitle: { fontSize: 14, color: "rgba(255,255,255,0.8)", marginTop: 8, textAlign: "center" },
  featuresContainer: { backgroundColor: "#fff", margin: 16, borderRadius: 12, padding: 16 },
  featuresTitle: { fontSize: 18, fontWeight: "600", marginBottom: 12, color: "#1B5E35" },
  featureRow: { flexDirection: "row", alignItems: "center", paddingVertical: 8 },
  checkmark: { color: "#1B5E35", fontSize: 16, fontWeight: "bold", marginRight: 12 },
  featureText: { fontSize: 14, color: "#333", flex: 1 },
  pricingContainer: { flexDirection: "row", margin: 16, gap: 12 },
  planCard: { flex: 1, backgroundColor: "#fff", borderRadius: 12, padding: 16, alignItems: "center", borderWidth: 1, borderColor: "#ddd" },
  planCardFeatured: { borderColor: "#C8861A", borderWidth: 2 },
  saveBadge: { backgroundColor: "#C8861A", color: "#fff", fontSize: 10, fontWeight: "bold", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4, marginBottom: 8 },
  planName: { fontSize: 16, fontWeight: "600", color: "#333" },
  planPrice: { fontSize: 24, fontWeight: "bold", color: "#1B5E35", marginTop: 4 },
  planPeriod: { fontSize: 12, color: "#666", marginTop: 2 },
  upgradeButton: { backgroundColor: "#C8861A", margin: 16, borderRadius: 12, padding: 16, alignItems: "center" },
  upgradeButtonDisabled: { opacity: 0.7 },
  upgradeButtonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  backButton: { alignItems: "center", marginBottom: 32 },
  backButtonText: { color: "#666", fontSize: 14 }
});
