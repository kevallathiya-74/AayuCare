/**
 * AayuCare - ProfileScreen
 *
 * Full user profile page with personal information and account settings
 */

import React, { useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import {
  ArrowLeft,
  User,
  CreditCard,
  Calendar,
  FileText,
  BriefcaseMedical,
  ChevronRight,
  Building2,
  Stethoscope,
  Phone,
  Pencil,
  Lock,
  ShieldCheck,
  CircleHelp,
  LogOut,
  Settings,
} from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSelector, useDispatch } from "react-redux";
import { useQuery } from "@tanstack/react-query";
import { theme, healthColors, textStyles, spacing } from "@/theme";
import { queryKeys } from "@/config/reactQueryConfig";
import { getSafeAreaEdges } from "@/utils/responsive";
import { Card } from "@/components/common";
import { logoutUser } from "@/store/slices/authSlice";
import {
  appointmentService,
  medicalRecordService,
  prescriptionService,
} from "@/services";
import {
  calculateAge,
  formatDate,
  formatMedicalHistoryDuration,
} from "@/utils/dateHelpers";
import { handleSmartBack } from "@/utils/navigation";
import Routes from "@/navigation/routes";

const ProfileScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);
  const insets = useSafeAreaInsets();

  const getCollectionCount = useCallback((payload, keys = []) => {
    if (!payload) return 0;
    if (Array.isArray(payload)) return payload.length;

    for (const key of keys) {
      const value = payload?.[key] || payload?.data?.[key];
      if (Array.isArray(value)) return value.length;
    }

    if (Array.isArray(payload?.data)) return payload.data.length;
    return 0;
  }, []);

  const {
    data: stats = { appointments: 0, records: 0, prescriptions: 0 },
    isLoading: loadingStats,
    isRefetching,
    refetch,
  } = useQuery({
    queryKey: queryKeys.dashboardStats.patient(user?.id),
    enabled: !!user?.id && user?.role === "patient",
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const [appointmentsRes, recordsRes, prescriptionsRes] =
        await Promise.allSettled([
          appointmentService.getPatientAppointments(user.id),
          medicalRecordService.getPatientRecords(user.id),
          prescriptionService.getPatientPrescriptions(user.id),
        ]);

      return {
        appointments:
          appointmentsRes.status === "fulfilled"
            ? getCollectionCount(appointmentsRes.value, [
                "appointments",
                "items",
                "rows",
              ])
            : 0,
        records:
          recordsRes.status === "fulfilled"
            ? getCollectionCount(recordsRes.value, [
                "medicalRecords",
                "records",
                "items",
                "rows",
              ])
            : 0,
        prescriptions:
          prescriptionsRes.status === "fulfilled"
            ? getCollectionCount(prescriptionsRes.value, [
                "prescriptions",
                "items",
                "rows",
              ])
            : 0,
      };
    },
  });

  const onRefresh = useCallback(async () => {
    await refetch();
  }, [refetch]);

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: () => {
          dispatch(logoutUser());
          navigation.reset({
            index: 0,
            routes: [{ name: "Login" }],
          });
        },
      },
    ]);
  };

  const renderStatValue = (value) => {
    if (!loadingStats) {
      return <Text style={styles.statValue}>{value}</Text>;
    }

    return (
      <View
        style={styles.statSkeletonPill}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      >
        <Text style={styles.statSkeletonText}>--</Text>
      </View>
    );
  };

  const getActionHint = (title) => {
    if (title === "Logout") return "Logs you out of this device";
    if (title === "Edit Profile") return "Open profile edit form";
    if (title === "Change Password") return "Open password change form";
    if (title === "Privacy Settings")
      return "Open accessibility and privacy settings";
    return "Opens support contact details";
  };

  const getValueLabel = (label, value) => {
    const normalized = String(value || "Not available").trim();
    return `${label}: ${normalized}`;
  };

  const profileSummaryA11y = [
    `Name ${user?.name || "not available"}`,
    `Patient ID ${user?.userId || "not available"}`,
    `Role ${user?.role || "patient"}`,
  ].join(", ");

  const statsSummaryA11y = loadingStats
    ? "Profile statistics are loading"
    : `Appointments ${stats.appointments}, Records ${stats.records}, Prescriptions ${stats.prescriptions}`;

  // Calculate age from dateOfBirth
  const calculatedAge =
    user?.age || (user?.dateOfBirth ? calculateAge(user.dateOfBirth) : null);

  // Format medical history properly (array of objects)
  const formatMedicalHistory = () => {
    const history =
      user?.medicalHistory?.length > 0
        ? user.medicalHistory
        : user?.chronicConditions || [];

    if (!history || history.length === 0) return "None";

    return history
      .map((item) => {
        if (typeof item === "string") return item;
        const condition = item.condition || "Unknown";
        const duration = item.diagnosedDate
          ? ` (${formatMedicalHistoryDuration(item.diagnosedDate, item.status)})`
          : "";
        const status = item.status ? ` - ${item.status}` : "";
        return `${condition}${duration}${status}`;
      })
      .join("; ");
  };

  const profileSections = [
    {
      title: "Personal Information",
      Icon: User,
      data: [
        { label: "Full Name", value: user?.name || "N/A" },
        { label: "Patient ID", value: user?.userId || "N/A" },
        { label: "Email", value: user?.email || "N/A" },
        { label: "Phone", value: user?.phone || "N/A" },
        {
          label: "Date of Birth",
          value: user?.dateOfBirth ? formatDate(user.dateOfBirth) : "N/A",
        },
        {
          label: "Age",
          value: calculatedAge ? `${calculatedAge} years` : "N/A",
        },
        {
          label: "Gender",
          value: user?.gender
            ? user.gender.charAt(0).toUpperCase() + user.gender.slice(1)
            : "N/A",
        },
        { label: "Blood Group", value: user?.bloodGroup || "N/A" },
        { label: "Address", value: user?.address || "N/A" },
      ],
    },
    {
      title: "Hospital Information",
      Icon: Building2,
      data: [
        { label: "Hospital", value: user?.hospitalName || "N/A" },
        { label: "Hospital ID", value: user?.hospitalId || "N/A" },
        {
          label: "Account Status",
          value: user?.isActive ? "Active" : "Inactive",
        },
        { label: "Verified", value: user?.isVerified ? "Yes" : "No" },
      ],
    },
    {
      title: "Medical Information",
      Icon: Stethoscope,
      data: [
        {
          label: "Medical History",
          value: formatMedicalHistory(),
        },
        { label: "Allergies", value: user?.allergies?.join(", ") || "None" },
        {
          label: "Current Medications",
          value: user?.currentMedications?.join(", ") || "None",
        },
      ],
    },
    {
      title: "Emergency Contact",
      Icon: Phone,
      data: [
        {
          label: "Contact Name",
          value:
            user?.emergencyContact?.name || user?.emergencyContactName || "N/A",
        },
        {
          label: "Contact Phone",
          value:
            user?.emergencyContact?.phone ||
            user?.emergencyContactPhone ||
            "N/A",
        },
        {
          label: "Relationship",
          value: user?.emergencyContact?.relation || "N/A",
        },
      ],
    },
  ];
  const actionItems = [
    {
      title: "Edit Profile",
      Icon: Pencil,
      color: healthColors.primary.main,
      onPress: () => navigation.navigate(Routes.PATIENT.EDIT_PROFILE),
    },
    {
      title: "Change Password",
      Icon: Lock,
      color: healthColors.info.main,
      onPress: () => navigation.navigate(Routes.SHARED.CHANGE_PASSWORD),
    },
    {
      title: "Privacy Settings",
      Icon: ShieldCheck,
      color: healthColors.success.main,
      onPress: () => navigation.navigate(Routes.PATIENT.SETTINGS_ACCESSIBILITY),
    },
    {
      title: "Help & Support",
      Icon: CircleHelp,
      color: healthColors.warning.main,
      onPress: () =>
        Alert.alert(
          "Help & Support",
          "For assistance, please contact:\n\nEmail: support@aayucare.com\nPhone: 1800-123-4567\n\nAvailable 24/7",
          [{ text: "OK" }],
        ),
    },
    {
      title: "Logout",
      Icon: LogOut,
      color: healthColors.error.main,
      onPress: handleLogout,
    },
  ];

  return (
    <SafeAreaView
      style={styles.container}
      edges={getSafeAreaEdges("withTabBar")}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom, 20) },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={onRefresh}
            colors={[healthColors.primary.main]}
            tintColor={healthColors.primary.main}
          />
        }
      >
        {/* Header */}
        <LinearGradient
          colors={[healthColors.primary.main, healthColors.primary.dark]}
          style={styles.header}
          accessible
          accessibilityLabel={profileSummaryA11y}
        >
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => handleSmartBack(navigation, "PatientTabs")}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            accessibilityHint="Returns to your dashboard tabs"
            hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
          >
            <ArrowLeft size={theme.iconSizes.lg} color={theme.colors.white} />
          </TouchableOpacity>

          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <User size={60} color={healthColors.primary.main} />
            </View>
            <Text style={styles.userName}>{user?.name || "User"}</Text>
            <Text style={styles.userRole}>{user?.role || "Patient"}</Text>
            <View style={styles.userIdBadge}>
              <CreditCard
                size={theme.iconSizes.xs}
                color={theme.withOpacity(healthColors.text.white, 0.9)}
              />
              <Text style={styles.userIdText}>
                ID: {user?.userId || "\u2014"}
              </Text>
            </View>
          </View>
        </LinearGradient>

        {/* Quick Stats */}
        <View style={styles.statsContainer}>
          <View
            style={styles.statCard}
            accessible
            accessibilityRole="summary"
            accessibilityLabel={statsSummaryA11y}
          >
            <Calendar size={24} color={healthColors.primary.main} />
            {renderStatValue(stats.appointments)}
            <Text style={styles.statLabel}>Appointments</Text>
          </View>
          <View
            style={styles.statCard}
            accessible
            accessibilityRole="summary"
            accessibilityLabel={statsSummaryA11y}
          >
            <FileText size={24} color={healthColors.success.main} />
            {renderStatValue(stats.records)}
            <Text style={styles.statLabel}>Records</Text>
          </View>
          <View
            style={styles.statCard}
            accessible
            accessibilityRole="summary"
            accessibilityLabel={statsSummaryA11y}
          >
            <BriefcaseMedical size={24} color={healthColors.info.main} />
            {renderStatValue(stats.prescriptions)}
            <Text style={styles.statLabel}>Prescriptions</Text>
          </View>
        </View>

        {/* Profile Sections */}
        {profileSections.map((section, index) => {
          const SectionIcon = section.Icon;
          return (
            <View key={index} style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionIconContainer}>
                  <SectionIcon
                    size={theme.iconSizes.md}
                    color={healthColors.primary.main}
                  />
                </View>
                <Text style={styles.sectionTitle}>{section.title}</Text>
              </View>
              <Card style={styles.card}>
                {section.data.map((item, idx) => (
                  <View key={idx} style={styles.infoRow}>
                    <Text style={styles.infoLabel}>{item.label}</Text>
                    <Text
                      style={styles.infoValue}
                      numberOfLines={2}
                      accessible
                      accessibilityLabel={getValueLabel(item.label, item.value)}
                    >
                      {item.value}
                    </Text>
                  </View>
                ))}
              </Card>
            </View>
          );
        })}

        {/* Action Items */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconContainer}>
              <Settings
                size={theme.iconSizes.md}
                color={healthColors.primary.main}
              />
            </View>
            <Text style={styles.sectionTitle}>Account Actions</Text>
          </View>
          <Card style={styles.card}>
            {actionItems.map((item, index) => {
              const ActionIcon = item.Icon;
              return (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.actionItem,
                    index !== actionItems.length - 1 && styles.actionItemBorder,
                  ]}
                  onPress={item.onPress}
                  accessibilityRole="button"
                  accessibilityLabel={item.title}
                  accessibilityHint={getActionHint(item.title)}
                  hitSlop={{ top: 6, right: 6, bottom: 6, left: 6 }}
                >
                  <View
                    style={[
                      styles.actionIcon,
                      { backgroundColor: item.color + "20" },
                    ]}
                  >
                    <ActionIcon size={theme.iconSizes.md} color={item.color} />
                  </View>
                  <Text style={[styles.actionText, { color: item.color }]}>
                    {item.title}
                  </Text>
                  <ChevronRight
                    size={theme.iconSizes.md}
                    color={healthColors.text.secondary}
                  />
                </TouchableOpacity>
              );
            })}
          </Card>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: healthColors.background.secondary,
  },
  scrollContent: {
    paddingBottom: spacing.xl,
  },
  header: {
    paddingTop: spacing.xl,
    paddingBottom: spacing.xxxl,
    paddingHorizontal: spacing.lg,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.withOpacity(theme.colors.text.white, 0.2),
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  avatarContainer: {
    alignItems: "center",
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: theme.colors.white,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.md,
    borderWidth: 4,
    borderColor: theme.withOpacity(theme.colors.text.white, 0.3),
  },
  userName: {
    ...textStyles.h1,
    color: theme.colors.white,
    marginBottom: spacing.xs,
  },
  userRole: {
    ...textStyles.body,
    color: theme.withOpacity(theme.colors.text.white, 0.8),
    textTransform: "capitalize",
  },
  userIdBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: spacing.xs,
    backgroundColor: theme.withOpacity(theme.colors.text.white, 0.2),
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  userIdText: {
    fontSize: theme.typography.sizes.bodyMedium,
    color: theme.withOpacity(theme.colors.text.white, 0.9),
    fontWeight: theme.typography.weights.semibold,
  },
  statsContainer: {
    flexDirection: "row",
    paddingHorizontal: spacing.lg,
    marginTop: -30,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: theme.colors.white,
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    borderWidth: 2,
    borderColor: healthColors.border.light,
  },
  statValue: {
    fontSize: theme.typography.sizes.h3,
    fontWeight: theme.typography.weights.bold,
    color: healthColors.text.primary,
    marginTop: 8,
  },
  statLabel: {
    fontSize: theme.typography.sizes.caption,
    color: healthColors.text.secondary,
    marginTop: 4,
  },
  section: {
    marginTop: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  sectionIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.withOpacity(healthColors.primary.main, 0.08),
    justifyContent: "center",
    alignItems: "center",
  },
  sectionTitle: {
    ...textStyles.h3,
    color: healthColors.text.primary,
    marginLeft: spacing.sm,
    fontSize: theme.typography.sizes.bodyLarge,
    fontWeight: theme.typography.weights.bold,
  },
  card: {
    padding: spacing.md,
    backgroundColor: theme.colors.white,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: healthColors.border.light,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: healthColors.border.light,
  },
  infoLabel: {
    ...textStyles.body,
    color: healthColors.text.secondary,
    flex: 1,
    fontSize: theme.typography.sizes.bodyMedium,
  },
  infoValue: {
    ...textStyles.body,
    color: healthColors.text.primary,
    fontWeight: theme.typography.weights.semibold,
    flex: 1,
    textAlign: "right",
    fontSize: theme.typography.sizes.bodyMedium,
  },
  actionItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 4,
  },
  actionItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: healthColors.border.light,
  },
  actionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    marginRight: spacing.md,
  },
  actionText: {
    ...textStyles.body,
    flex: 1,
    fontWeight: theme.typography.weights.semibold,
    fontSize: theme.typography.sizes.bodyMedium,
  },
});

export default ProfileScreen;
