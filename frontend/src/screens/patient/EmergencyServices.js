/**
 * Emergency Services Screen
 * One-click ambulance booking with location detection
 * Emergency contacts and nearest hospital finder
 */

import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Alert,
  Platform,
  ActivityIndicator,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { theme, healthColors } from "../../theme";
import {
  getScreenPadding,
  verticalScale,
} from "../../utils/responsive";
import { EmergencyIcon } from "../../components/common/CustomIcons";
import NetworkStatusIndicator from "../../components/common/NetworkStatusIndicator";
import ErrorRecovery from "../../components/common/ErrorRecovery";
import { showError, logError } from "../../utils/errorHandler";
import { useNetworkStatus } from "../../utils/offlineHandler";

const EmergencyServices = ({ navigation }) => {
  const [calling, setCalling] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { isConnected } = useNetworkStatus();
  const insets = useSafeAreaInsets();

  const emergencyNumbers = [
    { name: "Ambulance", number: "108", icon: "medical", color: healthColors.error.main },
    { name: "Police", number: "100", icon: "shield", color: healthColors.info.main },
    { name: "Fire Brigade", number: "101", icon: "flame", color: healthColors.warning.main },
    { name: "Women Helpline", number: "1091", icon: "woman", color: healthColors.error.light },
  ];

  const nearbyHospitals = [
    {
      name: "City General Hospital",
      distance: "2.5 km",
      phone: "+91-2222-222222",
      emergency: true,
    },
    {
      name: "Apollo Hospital",
      distance: "3.8 km",
      phone: "+91-3333-333333",
      emergency: true,
    },
    {
      name: "Fortis Healthcare",
      distance: "5.2 km",
      phone: "+91-4444-444444",
      emergency: true,
    },
  ];

  const handleEmergencyCall = async (number, name) => {
    try {
      Alert.alert(`Call ${name}?`, `This will dial ${number} immediately`, [
        { text: "Cancel", style: "cancel" },
        {
          text: "Call Now",
          style: "destructive",
          onPress: async () => {
            try {
              const phoneNumber =
                Platform.OS === "ios" ? `telprompt:${number}` : `tel:${number}`;
              const canOpen = await Linking.canOpenURL(phoneNumber);
              if (canOpen) {
                await Linking.openURL(phoneNumber);
              } else {
                throw new Error("Cannot make phone calls on this device");
              }
            } catch (err) {
              logError(err, {
                context: "EmergencyServices.handleEmergencyCall",
                number,
              });
              showError("Failed to initiate call. Please try again.");
            }
          },
        },
      ]);
    } catch (err) {
      logError(err, {
        context: "EmergencyServices.handleEmergencyCall",
        number,
      });
      setError(err.message || "Failed to initiate emergency call");
    }
  };

  const handleAmbulanceCall = async () => {
    try {
      Alert.alert(
        "Call Ambulance?",
        "This will immediately dial 108 for emergency medical assistance",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Call 108",
            style: "destructive",
            onPress: async () => {
              try {
                const phoneNumber =
                  Platform.OS === "ios" ? "telprompt:108" : "tel:108";
                const canOpen = await Linking.canOpenURL(phoneNumber);
                if (canOpen) {
                  await Linking.openURL(phoneNumber);
                } else {
                  throw new Error("Cannot make phone calls on this device");
                }
              } catch (err) {
                logError(err, {
                  context: "EmergencyServices.handleAmbulanceCall",
                });
                showError(
                  "Failed to call ambulance. Please dial 108 manually."
                );
              }
            },
          },
        ]
      );
    } catch (err) {
      logError(err, { context: "EmergencyServices.handleAmbulanceCall" });
      setError(err.message || "Failed to initiate ambulance call");
    }
  };

  const handleRetry = () => {
    setError(null);
  };

  if (error) {
    return (
      <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
        <NetworkStatusIndicator />
        <ErrorRecovery
          error={error}
          onRetry={handleRetry}
          onDismiss={() => setError(null)}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <NetworkStatusIndicator />
      {/* Header */}
      <LinearGradient
        colors={[healthColors.error.main, healthColors.error.dark]}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.white} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <EmergencyIcon size={32} />
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>Emergency Services</Text>
            <Text style={styles.headerSubtitle}>Quick access to help</Text>
          </View>
        </View>
        <View style={{ width: 24 }} />
      </LinearGradient>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: Math.max(insets.bottom, 20) },
        ]}
      >
        {/* Ambulance Quick Call */}
        <TouchableOpacity
          style={styles.ambulanceButton}
          onPress={handleAmbulanceCall}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={[healthColors.error.main, healthColors.error.dark, healthColors.error.dark]}
            style={styles.ambulanceGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.ambulanceIcon}>
              <Ionicons name="medkit" size={48} color={theme.colors.white} />
            </View>
            <View style={styles.ambulanceText}>
              <Text style={styles.ambulanceTitle}>Call Ambulance</Text>
              <Text style={styles.ambulanceNumber}>108</Text>
              <Text style={styles.ambulanceSubtext}>
                24/7 Emergency Service
              </Text>
            </View>
            <Ionicons name="call" size={32} color={theme.colors.white} />
          </LinearGradient>
        </TouchableOpacity>

        {/* Emergency Numbers */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Emergency Hotlines</Text>
          <View style={styles.numbersGrid}>
            {emergencyNumbers.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={styles.numberCard}
                onPress={() => handleEmergencyCall(item.number, item.name)}
              >
                <View
                  style={[
                    styles.numberIcon,
                    { backgroundColor: item.color + "20" },
                  ]}
                >
                  <Ionicons name={item.icon} size={28} color={item.color} />
                </View>
                <Text style={styles.numberName}>{item.name}</Text>
                <Text style={styles.numberValue}>{item.number}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Nearby Hospitals */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Nearby Hospitals</Text>
            <TouchableOpacity>
              <Text style={styles.viewAllText}>View Map</Text>
            </TouchableOpacity>
          </View>
          {nearbyHospitals.map((hospital, index) => (
            <View key={index} style={styles.hospitalCard}>
              <View style={styles.hospitalIcon}>
                <Ionicons
                  name="business"
                  size={24}
                  color={healthColors.primary.main}
                />
              </View>
              <View style={styles.hospitalInfo}>
                <View style={styles.hospitalHeader}>
                  <Text style={styles.hospitalName}>{hospital.name}</Text>
                  {hospital.emergency && (
                    <View style={styles.emergencyBadge}>
                      <Text style={styles.emergencyBadgeText}>24/7</Text>
                    </View>
                  )}
                </View>
                <View style={styles.hospitalDetails}>
                  <Ionicons
                    name="location"
                    size={14}
                    color={healthColors.text.tertiary}
                  />
                  <Text style={styles.hospitalDistance}>
                    {hospital.distance}
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.callButton}
                onPress={() =>
                  handleEmergencyCall(hospital.phone, hospital.name)
                }
              >
                <Ionicons
                  name="call"
                  size={20}
                  color={healthColors.primary.main}
                />
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {/* Safety Tips */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Emergency Tips</Text>
          <View style={styles.tipsCard}>
            <View style={styles.tipItem}>
              <Ionicons name="checkmark-circle" size={20} color={healthColors.success.main} />
              <Text style={styles.tipText}>Stay calm and speak clearly</Text>
            </View>
            <View style={styles.tipItem}>
              <Ionicons name="checkmark-circle" size={20} color={healthColors.success.main} />
              <Text style={styles.tipText}>Provide exact location details</Text>
            </View>
            <View style={styles.tipItem}>
              <Ionicons name="checkmark-circle" size={20} color={healthColors.success.main} />
              <Text style={styles.tipText}>Describe the emergency clearly</Text>
            </View>
            <View style={styles.tipItem}>
              <Ionicons name="checkmark-circle" size={20} color={healthColors.success.main} />
              <Text style={styles.tipText}>
                Don&#39;t hang up until told to do so
              </Text>
            </View>
          </View>
        </View>

        {/* Disclaimer */}
        <View style={styles.disclaimer}>
          <Ionicons
            name="information-circle"
            size={20}
            color={healthColors.text.tertiary}
          />
          <Text style={styles.disclaimerText}>
            For life-threatening emergencies, call 108 immediately. This app is
            a convenience tool and should not replace professional emergency
            services.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: healthColors.background.primary,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: getScreenPadding(),
    paddingTop: verticalScale(20),
    paddingBottom: verticalScale(30),
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginLeft: theme.spacing.md,
  },
  headerText: {
    flex: 1,
    marginLeft: theme.spacing.md,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.white,
  },
  headerSubtitle: {
    fontSize: 13,
    color: theme.withOpacity(theme.colors.white, 0.9),
  },
  content: {
    padding: getScreenPadding(),
  },
  ambulanceButton: {
    borderRadius: 20,
    overflow: "hidden",
    marginBottom: theme.spacing.xl,
    ...theme.shadows.xl,
  },
  ambulanceGradient: {
    flexDirection: "row",
    alignItems: "center",
    padding: theme.spacing.xl,
  },
  ambulanceIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.withOpacity(theme.colors.white, 0.2),
    justifyContent: "center",
    alignItems: "center",
    marginRight: theme.spacing.lg,
  },
  ambulanceText: {
    flex: 1,
    marginRight: theme.spacing.lg,
  },
  ambulanceTitle: {
    fontSize: 18,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.white,
    marginBottom: 4,
  },
  ambulanceNumber: {
    fontSize: 32,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.white,
    marginBottom: 4,
  },
  ambulanceSubtext: {
    fontSize: 12,
    color: theme.withOpacity(theme.colors.white, 0.9),
  },
  section: {
    marginBottom: theme.spacing.xl,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: theme.typography.weights.bold,
    color: healthColors.text.primary,
  },
  viewAllText: {
    fontSize: 13,
    color: healthColors.primary.main,
    fontWeight: theme.typography.weights.semibold,
  },
  numbersGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  numberCard: {
    width: "48%",
    backgroundColor: healthColors.background.card,
    borderRadius: 16,
    padding: theme.spacing.md,
    alignItems: "center",
    ...theme.shadows.md,
    marginRight: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  numberIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: theme.spacing.sm,
  },
  numberName: {
    fontSize: 12,
    color: healthColors.text.secondary,
    textAlign: "center",
    marginBottom: 4,
  },
  numberValue: {
    fontSize: 18,
    fontWeight: theme.typography.weights.bold,
    color: healthColors.text.primary,
  },
  hospitalCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: healthColors.background.card,
    padding: theme.spacing.md,
    borderRadius: 12,
    marginBottom: theme.spacing.sm,
    ...theme.shadows.sm,
  },
  hospitalIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: healthColors.primary.main + "15",
    justifyContent: "center",
    alignItems: "center",
    marginRight: theme.spacing.md,
  },
  hospitalInfo: {
    flex: 1,
  },
  hospitalHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  hospitalName: {
    fontSize: 14,
    fontWeight: theme.typography.weights.semibold,
    color: healthColors.text.primary,
    flex: 1,
    marginRight: theme.spacing.xs,
  },
  emergencyBadge: {
    backgroundColor: healthColors.success.main,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  emergencyBadgeText: {
    fontSize: 9,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.white,
  },
  hospitalDetails: {
    flexDirection: "row",
    alignItems: "center",
  },
  hospitalDistance: {
    fontSize: 12,
    color: healthColors.text.tertiary,
    marginLeft: 4,
  },
  callButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: healthColors.primary.main + "15",
    justifyContent: "center",
    alignItems: "center",
  },
  tipsCard: {
    backgroundColor: healthColors.background.card,
    borderRadius: 12,
    padding: theme.spacing.md,
    ...theme.shadows.sm,
  },
  tipItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: theme.spacing.sm,
  },
  tipText: {
    flex: 1,
    fontSize: 13,
    color: healthColors.text.secondary,
    lineHeight: 20,
    marginLeft: theme.spacing.sm,
  },
  disclaimer: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: healthColors.background.tertiary,
    padding: theme.spacing.md,
    borderRadius: 12,
    marginTop: theme.spacing.lg,
  },
  disclaimerText: {
    flex: 1,
    fontSize: 11,
    color: healthColors.text.tertiary,
    lineHeight: 16,
    marginLeft: theme.spacing.sm,
  },
});

export default EmergencyServices;



