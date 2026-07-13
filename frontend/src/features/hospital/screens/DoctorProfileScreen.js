/**
 * Doctor Profile Screen
 * Profile management for doctors
 */

import React, { useCallback } from "react";
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
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CreditCard, LogOut } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useDispatch, useSelector } from "react-redux";
import { useQuery } from "@tanstack/react-query";
import { theme, healthColors, textStyles, spacing } from "@/theme";
import { queryKeys } from "@/config/reactQueryConfig";
import { getScreenPadding, verticalScale } from "@/utils/responsive";
import Avatar from "@/components/common/Avatar";
import { logoutUser } from "@/store/slices/authSlice";
import { doctorService } from "@/services";
import { DynamicIcon } from "@/components/common";
import Routes from "@/navigation/routes";

const formatDoctorName = (name) => {
  if (!name) return "Doctor";
  const trimmed = name.trim();
  if (
    trimmed.toLowerCase().startsWith("dr.") ||
    trimmed.toLowerCase().startsWith("dr ")
  ) {
    return trimmed;
  }
  return `Dr. ${trimmed}`;
};

const DoctorProfileScreen = ({ navigation }) => {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();
  const {
    data: stats = { totalPatients: 0, rating: null, yearsExperience: 0 },
    isLoading: loading,
    isRefetching,
    refetch,
  } = useQuery({
    queryKey: queryKeys.doctors.detail(user?.id || "me"),
    enabled: !!user && user?.role === "doctor",
    staleTime: 10 * 60 * 1000,
    queryFn: async () => {
      const response = await doctorService.getProfileStats();
      if (!response?.success) {
        return { totalPatients: 0, rating: null, yearsExperience: 0 };
      }
      return {
        totalPatients: response.data.totalPatients || 0,
        rating: response.data.averageRating ?? null,
        yearsExperience: response.data.yearsExperience || 0,
      };
    },
  });

  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

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
      onPress: () => navigation.navigate(Routes.DOCTOR.EDIT_PROFILE),
    },
    {
      id: 2,
      title: "Schedule & Availability",
      icon: "calendar-outline",
      onPress: () => navigation.navigate(Routes.DOCTOR.SCHEDULE_AVAILABILITY),
    },
    {
      id: 3,
      title: "Consultation History",
      icon: "time-outline",
      onPress: () => navigation.navigate(Routes.DOCTOR.CONSULTATION_HISTORY),
    },
    {
      id: 4,
      title: "Settings",
      icon: "settings-outline",
      onPress: () => navigation.navigate(Routes.DOCTOR.SETTINGS),
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
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={healthColors.primary.main}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 20) }}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={handleRefresh}
            colors={[healthColors.primary.main]}
            tintColor={healthColors.primary.main}
          />
        }
      >
        {/* Gradient Hero Header */}
        <LinearGradient
          colors={[healthColors.primary.main, healthColors.primary.dark]}
          style={[styles.hero, { paddingTop: insets.top + spacing.xl }]}
        >
          <Avatar
            size={90}
            name={formatDoctorName(user?.name)}
            backgroundColor={theme.withOpacity(theme.colors.white, 0.15)}
            textColor={theme.colors.white}
            style={styles.avatarBorder}
          />
          <Text style={styles.doctorNameHero}>
            {formatDoctorName(user?.name)}
          </Text>
          <Text style={styles.specializationHero}>
            {user?.specialization || "Specialist"} · {user?.department || "OPD"}
          </Text>
          <View style={styles.idBadge}>
            <CreditCard
              size={13}
              color={theme.withOpacity(healthColors.text.white, 0.85)}
            />
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
                {loading
                  ? "--"
                  : stats.rating != null
                  ? stats.rating.toFixed(1)
                  : "N/A"}
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
          {profileOptions.map((option, index) => (
            <TouchableOpacity
              key={option.id}
              style={[
                styles.optionItem,
                index === profileOptions.length - 1 && styles.optionItemLast,
              ]}
              onPress={option.onPress}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={option.title}
            >
              <View style={styles.optionLeft}>
                <View style={styles.optionIconContainer}>
                  <DynamicIcon
                    name={option.icon}
                    size={23}
                    color={healthColors.primary.main}
                  />
                </View>
                <Text style={styles.optionTitle}>{option.title}</Text>
              </View>
              <DynamicIcon
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
            <LogOut size={22} color={healthColors.error.main} />
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: healthColors.background.secondary,
  },
  hero: {
    paddingBottom: spacing.xl + spacing.md,
    paddingHorizontal: spacing.lg,
    alignItems: "center",
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  avatarBorder: {
    borderWidth: 2.5,
    borderColor: theme.colors.white,
    borderRadius: 45,
  },
  doctorNameHero: {
    ...textStyles.h1,
    color: theme.colors.white,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  specializationHero: {
    fontSize: theme.typography.sizes.bodyMedium,
    color: theme.withOpacity(healthColors.text.white, 0.85),
    marginBottom: spacing.xs,
  },
  idBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: theme.withOpacity(healthColors.text.white, 0.2),
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
    marginBottom: spacing.lg,
  },
  idBadgeText: {
    fontSize: theme.typography.sizes.caption,
    color: theme.withOpacity(healthColors.text.white, 0.9),
    fontWeight: theme.typography.weights.semibold,
  },
  heroStats: {
    flexDirection: "row",
    backgroundColor: theme.withOpacity(healthColors.text.white, 0.12),
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 20,
    width: "100%",
    borderWidth: 1,
    borderColor: theme.withOpacity(theme.colors.white, 0.15),
  },
  heroStatItem: {
    flex: 1,
    alignItems: "center",
  },
  heroStatDivider: {
    width: 1,
    backgroundColor: theme.withOpacity(healthColors.text.white, 0.3),
  },
  heroStatValue: {
    fontSize: theme.typography.sizes.h3,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.white,
    marginBottom: 2,
  },
  heroStatLabel: {
    fontSize: theme.typography.sizes.caption,
    color: theme.withOpacity(healthColors.text.white, 0.8),
  },
  optionsSection: {
    backgroundColor: healthColors.background.card,
    marginHorizontal: getScreenPadding(),
    marginBottom: verticalScale(20),
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: healthColors.border.light,
    ...theme.shadows.sm,
  },
  optionItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: healthColors.border.light,
  },
  optionItemLast: {
    borderBottomWidth: 0,
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
    backgroundColor: theme.withOpacity(healthColors.primary.main, 0.08),
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
    backgroundColor: theme.withOpacity(healthColors.error.main, 0.03),
    padding: 16,
    borderRadius: 12,
    borderWidth: 1.5,
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
