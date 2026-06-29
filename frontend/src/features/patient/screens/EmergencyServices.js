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
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import {
  ArrowLeft,
  BriefcaseMedical,
  Phone,
  MapPin,
  Info,
  CheckCircle,
  Shield,
  Flame,
  Venus,
  Map,
} from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { theme, healthColors } from '@/theme';
import {
  getScreenPadding,
  verticalScale,
} from '@/utils/responsive';
import { EmergencyIcon } from '@/components/common/CustomIcons';
import NetworkStatusIndicator from '@/components/common/NetworkStatusIndicator';
import ErrorRecovery from '@/components/common/ErrorRecovery';
import { showError, logError, parseError } from '@/utils/errorHandler';
import { useSelector } from "react-redux";
import { useNetworkStatus } from '@/utils/offlineHandler';
import { handleSmartBack } from '@/utils/navigation';

const EmergencyServices = ({ navigation }) => {
  const [error, setError] = useState(null);
  const { isConnected } = useNetworkStatus();
  const insets = useSafeAreaInsets();
  const { user } = useSelector((state) => state.auth);
  // Build hospitals list: user's own hospital first, then generic placeholders
  const nearbyHospitals = [
    ...(user?.hospitalName
      ? [
          {
            name: user.hospitalName,
            distance: "Your Hospital",
            phone: user?.hospitalPhone || "108",
            emergency: true,
          },
        ]
      : []),
    {
      name: "Find Nearest Hospital",
      distance: "Open Maps",
      phone: null,
      emergency: true,
      openMaps: true,
    },
  ];

  const handleOpenMaps = async (query = "hospitals near me") => {
    try {
      const encoded = encodeURIComponent(query);
      const mapsUrl =
        Platform.OS === "ios"
          ? `maps:0,0?q=${encoded}`
          : `geo:0,0?q=${encoded}`;
      const webUrl = `https://www.google.com/maps/search/?api=1&query=${encoded}`;
      const canOpen = await Linking.canOpenURL(mapsUrl);
      await Linking.openURL(canOpen ? mapsUrl : webUrl);
    } catch (err) {
      logError(err, { context: "EmergencyServices.handleOpenMaps" });
      showError("Could not open maps. Please search manually.");
    }
  };
 

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
      setError(parseError(err));
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
      setError(parseError(err));
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
        <TouchableOpacity onPress={() => handleSmartBack(navigation, "PatientTabs")}>
          accessibilityRole="button"
          accessibilityLabel="Go back"
          accessibilityHint="Returns to patient dashboard"
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <EmergencyIcon size={32} />
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>Emergency Services</Text>
            <Text style={styles.headerSubtitle}>Quick access to help</Text>
          </View>
        </View>
        <View style={styles.headerRightSpacer} />
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
          accessibilityRole="button"
          accessibilityLabel="Call ambulance 108"
        >
          <LinearGradient
            colors={[healthColors.error.main, healthColors.error.dark, healthColors.error.dark]}
            style={styles.ambulanceGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.ambulanceIcon}>
              <BriefcaseMedical  size={48} color={theme.colors.white} />
            </View>
            <View style={styles.ambulanceText}>
              <Text style={styles.ambulanceTitle}>Call Ambulance</Text>
              <Text style={styles.ambulanceNumber}>108</Text>
              <Text style={styles.ambulanceSubtext}>
                24/7 Emergency Service
              </Text>
            </View>
            <Phone  size={32} color={theme.colors.white} />
          </LinearGradient>
        </TouchableOpacity>

        {/* Emergency Numbers */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Emergency Hotlines</Text>
          <View style={styles.numbersGrid}>
            {emergencyNumbers.map((item) => {
              const EmergencyIconComponent = item.Icon;
              return (
                <TouchableOpacity
                  key={item.name}
                  style={styles.numberCard}
                  onPress={() => handleEmergencyCall(item.number, item.name)}
                  accessibilityRole="button"
                  accessibilityLabel={`Call ${item.name} ${item.number}`}
                >
                  <View
                    style={[
                      styles.numberIcon,
                      { backgroundColor: item.color + "20" },
                    ]}
                  >
                    <EmergencyIconComponent size={28} color={item.color} />
                  </View>
                  <Text style={styles.numberName}>{item.name}</Text>
                  <Text style={styles.numberValue}>{item.number}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Nearby Hospitals */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Nearby Hospitals</Text>
            <TouchableOpacity
              onPress={() => handleOpenMaps("hospitals near me")}
              accessibilityRole="button"
              accessibilityLabel="Open nearby hospitals map"
            >
              <Text style={styles.viewAllText}>View Map</Text>
            </TouchableOpacity>
          </View>
          {nearbyHospitals.map((hospital, index) => (
            <View key={index} style={styles.hospitalCard}>
              <View style={styles.hospitalIcon}>
                <BriefcaseMedical size={24} color={healthColors.primary.main} />
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
                  <MapPin size={14} color={healthColors.text.tertiary} />
                  <Text style={styles.hospitalDistance}>
                    {hospital.distance}
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.callButton}
                onPress={() =>
                  hospital.openMaps
                    ? handleOpenMaps("hospitals near me")
                    : handleEmergencyCall(hospital.phone, hospital.name)
                }
                accessibilityRole="button"
                accessibilityLabel={hospital.openMaps ? "Open hospital map" : `Call ${hospital.name}`}
              >
                {hospital.openMaps ? (
                  <Map size={20} color={healthColors.primary.main} />
                ) : (
                  <Phone size={20} color={healthColors.primary.main} />
                )}
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {/* Safety Tips */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Emergency Tips</Text>
          <View style={styles.tipsCard}>
            <View style={styles.tipItem}>
              <CheckCircle size={20} color={healthColors.success.main} />
              <Text style={styles.tipText}>Stay calm and speak clearly</Text>
            </View>
            <View style={styles.tipItem}>
              <CheckCircle  size={20} color={healthColors.success.main} />
              <Text style={styles.tipText}>Provide exact location details</Text>
            </View>
            <View style={styles.tipItem}>
              <CheckCircle  size={20} color={healthColors.success.main} />
              <Text style={styles.tipText}>Describe the emergency clearly</Text>
            </View>
            <View style={styles.tipItem}>
              <CheckCircle  size={20} color={healthColors.success.main} />
              <Text style={styles.tipText}>
                Don&#39;t hang up until told to do so
              </Text>
            </View>
          </View>
        </View>

        {/* Disclaimer */}
        <View style={styles.disclaimer}>
          <Info
            
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
    fontSize: theme.typography.sizes.h4,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.white,
  },
  headerSubtitle: {
    fontSize: theme.typography.sizes.bodyMedium,
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
    fontSize: theme.typography.sizes.h5,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.white,
    marginBottom: 4,
  },
  ambulanceNumber: {
    fontSize: theme.typography.sizes.h1,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.white,
    marginBottom: 4,
  },
  ambulanceSubtext: {
    fontSize: theme.typography.sizes.caption,
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
    fontSize: theme.typography.sizes.bodyLarge,
    fontWeight: theme.typography.weights.bold,
    color: healthColors.text.primary,
  },
  viewAllText: {
    fontSize: theme.typography.sizes.bodyMedium,
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
    fontSize: theme.typography.sizes.caption,
    color: healthColors.text.secondary,
    textAlign: "center",
    marginBottom: 4,
  },
  numberValue: {
    fontSize: theme.typography.sizes.h5,
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
    fontSize: theme.typography.sizes.bodyMedium,
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
    fontSize: theme.typography.sizes.overline,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.white,
  },
  hospitalDetails: {
    flexDirection: "row",
    alignItems: "center",
  },
  hospitalDistance: {
    fontSize: theme.typography.sizes.caption,
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
    fontSize: theme.typography.sizes.bodyMedium,
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
    fontSize: theme.typography.sizes.overline,
    color: healthColors.text.tertiary,
    lineHeight: 16,
    marginLeft: theme.spacing.sm,
  },
  headerRightSpacer: {
    width: 24,
  },
});

export default EmergencyServices;



