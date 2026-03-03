/**
 * EmergencyContactCard
 * Patient Dashboard — one-tap emergency contact + 108 ambulance buttons.
 */

import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert, Linking } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { theme, healthColors } from "../../../theme";
import { logError } from "../../../utils/errorHandler";

const EmergencyContactCard = ({ user }) => {
  const handleEmergencyCall = () => {
    const phone = user?.emergencyContact?.phone;
    if (phone) {
      Linking.openURL(`tel:${phone}`).catch((err) => {
        logError(err, "EmergencyContactCard: Failed to open dialer");
        Alert.alert("Error", "Unable to make call");
      });
    } else {
      Alert.alert("No Contact", "Emergency contact not available");
    }
  };

  const handleAmbulanceCall = () => {
    Linking.openURL("tel:108").catch((err) => {
      logError(err, "EmergencyContactCard: Failed to dial 108");
      Alert.alert("Error", "Unable to make call");
    });
  };

  return (
    <View style={styles.container}>
      {/* Emergency Contact */}
      <TouchableOpacity
        style={styles.buttonWrapper}
        onPress={handleEmergencyCall}
        activeOpacity={0.85}
      >
        <LinearGradient
          colors={[healthColors.error.main, "#C62828"]}
          style={styles.button}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.iconCircle}>
            <Ionicons name="call" size={26} color={theme.colors.text.white} />
          </View>
          <Text style={styles.buttonTitle}>Emergency</Text>
          <Text style={styles.buttonSub}>Contact</Text>
        </LinearGradient>
      </TouchableOpacity>

      {/* Ambulance 108 */}
      <TouchableOpacity
        style={styles.buttonWrapper}
        onPress={handleAmbulanceCall}
        activeOpacity={0.85}
      >
        <LinearGradient
          colors={[healthColors.accent.coral || "#FF7043", "#E64A19"]}
          style={styles.button}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.iconCircle}>
            <Ionicons name="medkit" size={26} color={theme.colors.text.white} />
          </View>
          <Text style={styles.buttonTitle}>Ambulance</Text>
          <Text style={styles.buttonSub}>108</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    gap: 14,
  },
  buttonWrapper: {
    flex: 1,
    borderRadius: 16,
    overflow: "hidden",
    ...theme.shadows.md,
  },
  button: {
    alignItems: "center",
    paddingVertical: 18,
    paddingHorizontal: 12,
    gap: 6,
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: theme.withOpacity(theme.colors.text.white, 0.18),
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
  },
  buttonTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: theme.colors.text.white,
    letterSpacing: 0.3,
  },
  buttonSub: {
    fontSize: 12,
    color: theme.withOpacity(theme.colors.text.white, 0.85),
    fontWeight: "500",
  },
});

export default EmergencyContactCard;
