import React from "react";
import { View, Text, StyleSheet } from "react-native";

export default function AdBanner() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Advertisement</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    height: 50,
    backgroundColor: "#f0f0f0",
    alignItems: "center",
    justifyContent: "center",
    borderTopWidth: 1,
    borderTopColor: "#ddd"
  },
  text: {
    color: "#999",
    fontSize: 12
  }
});
