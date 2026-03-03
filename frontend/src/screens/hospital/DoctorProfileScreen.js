/**
 * Doctor Profile Screen
 * Profile management for doctors
 */

import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Alert,
  RefreshControl,
  Linking,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useDispatch, useSelector } from "react-redux";
import { theme, healthColors, textStyles, spacing } from "../../theme";
import {
  getScreenPadding,
  verticalScale,
} from "../../utils/responsive";
import Avatar from "../../components/common/Avatar";
import { logoutUser } from "../../store/slices/authSlice";
import { doctorService } from "../../services";
import { logError } from "../../utils/errorHandler";

const DoctorProfileScreen = ({ navigation }) => {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();
  const [stats, setStats] = useState({
    totalPatients: 0,
    rating: null,
    yearsExperience: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchProfileStats = useCallback(async () => {
    try {
      const response = await doctorService.getProfileStats();
      if (response?.success) {
        setStats({
          totalPatients: response.data.totalPatients || 0,
          rating: response.data.averageRating ?? null,
          yearsExperience: response.data.yearsExperience || 0,
        });
      }
    } catch (err) {
      logError(err, "DoctorProfileScreen.fetchProfileStats");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchProfileStats();
  }, [fetchProfileStats]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchProfileStats();
  }, [fetchProfileStats]);

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        onPress: () => dispatch(logoutUser()),
        style: "destructive",
      },
    ]);
  };

  const profileOptions = [
    {
      id: 1,
      title: "Edit Profile",
      icon: "create-outline",
      onPress: () => navigation.navigate("EditProfile"),
    },
    {
      id: 2,
      title: "Schedule & Availability",
      icon: "calendar-outline",
      onPress: () => navigation.navigate("ScheduleAvailability"),
    },
    {
      id: 3,
      title: "Consultation History",
      icon: "time-outline",
      onPress: () => navigation.navigate("ConsultationHistory"),
    },
    {
      id: 4,
      title: "Settings",
      icon: "settings-outline",
      onPress: () => navigation.navigate("Settings"),
    },
    {
      id: 5,
      title: "Help & Support",
      icon: "help-circle-outline",
      onPress: async () => {
        const supportEmail = "support@aayucare.com";
        const subject = encodeURIComponent("AayuCare Doctor Support Request");
        const emailUrl = `mailto:${supportEmail}?subject=${subject}`;

        const canOpen = await Linking.canOpenURL(emailUrl);
        if (canOpen) {
          await Linking.openURL(emailUrl);
        } else {
          Alert.alert("Help & Support", `Contact us at ${supportEmail}`);
        }
      },
    },
  ];

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={healthColors.background.primary}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 20) }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[healthColors.primary.main]}
            tintColor={healthColors.primary.main}
          />
        }
      >
        {/* Gradient Hero Header */}
        <LinearGradient
          colors={[healthColors.primary.main, healthColors.primary.dark]}
          style={styles.hero}
        >
          <Avatar size={90} name={user?.name || "Doctor"} />
          <Text style={styles.doctorNameHero}>{user?.name || "Doctor"}</Text>
          <Text style={styles.specializationHero}>
            {user?.specialization || "Specialist"} · {user?.department || "OPD"}
          </Text>
          <View style={styles.idBadge}>
            <Ionicons name="card-outline" size={13} color="rgba(255,255,255,0.85)" />
            <Text style={styles.idBadgeText}>ID: {user?.userId || "—"}</Text>
          </View>

          {/* Stats row inside hero */}
          <View style={styles.heroStats}>
            <View style={styles.heroStatItem}>
              <Text style={styles.heroStatValue}>
                {loading ? "--" : stats.totalPatients}
              </Text>
              <Text style={styles.heroStatLabel}>Patients</Text>
            </View>
            <View style={styles.heroStatDivider} />
            <View style={styles.heroStatItem}>
              <Text style={styles.heroStatValue}>
                {loading ? "--" : (stats.rating != null ? stats.rating.toFixed(1) : "N/A")}
              </Text>
              <Text style={styles.heroStatLabel}>Rating</Text>
            </View>
            <View style={styles.heroStatDivider} />
            <View style={styles.heroStatItem}>
              <Text style={styles.heroStatValue}>
                {loading ? "--" : stats.yearsExperience}
              </Text>
              <Text style={styles.heroStatLabel}>Yrs Exp</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Options */}
        <View style={styles.optionsSection}>
          {profileOptions.map((option) => (
            <TouchableOpacity
              key={option.id}
              style={styles.optionItem}
              onPress={option.onPress}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={option.title}
            >
              <View style={styles.optionLeft}>
                <View style={styles.optionIconContainer}>
                  <Ionicons
                    name={option.icon}
                    size={22}
                    color={healthColors.primary.main}
                  />
                </View>
                <Text style={styles.optionTitle}>{option.title}</Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={healthColors.text.secondary}
              />
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout Button */}
        <View style={styles.logoutSection}>
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Logout from the app"
          >
            <Ionicons
              name="log-out-outline"
              size={22}
              color={healthColors.error.main}
            />
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: healthColors.background.secondary,
  },
  hero: {
    paddingTop: spacing.xl,
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
    alignItems: "center",
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  doctorNameHero: {
    ...textStyles.h1,
    color: theme.colors.white,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  specializationHero: {
    fontSize: theme.typography.sizes.bodyMedium,
    color: "rgba(255,255,255,0.85)",
    marginBottom: spacing.xs,
  },
  idBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
    marginBottom: spacing.lg,
  },
  idBadgeText: {
    fontSize: theme.typography.sizes.caption,
    color: "rgba(255,255,255,0.9)",
    fontWeight: theme.typography.weights.semibold,
  },
  heroStats: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 20,
    width: "100%",
  },
  heroStatItem: {
    flex: 1,
    alignItems: "center",
  },
  heroStatDivider: {
    width: 1,
    backgroundColor: "rgba(255,255,255,0.3)",
  },
  heroStatValue: {
    fontSize: theme.typography.sizes.h3,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.white,
    marginBottom: 2,
  },
  heroStatLabel: {
    fontSize: theme.typography.sizes.caption,
    color: "rgba(255,255,255,0.8)",
  },
  optionsSection: {
    backgroundColor: healthColors.background.card,
    marginHorizontal: getScreenPadding(),
    marginBottom: verticalScale(20),
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: healthColors.border.light,
  },
  optionItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: healthColors.border.light,
  },
  optionLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  optionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: healthColors.primary.main + "15",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  optionTitle: {
    fontSize: theme.typography.sizes.bodyMedium,
    fontWeight: theme.typography.weights.semibold,
    color: healthColors.text.primary,
  },
  logoutSection: {
    paddingHorizontal: getScreenPadding(),
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: healthColors.background.card,
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: healthColors.error.main,
  },
  logoutText: {
    fontSize: theme.typography.sizes.bodyLarge,
    fontWeight: theme.typography.weights.semibold,
    color: healthColors.error.main,
    marginLeft: 8,
  },
  bottomSpacer: {
    height: verticalScale(20),
  },
});

export default DoctorProfileScreen;



