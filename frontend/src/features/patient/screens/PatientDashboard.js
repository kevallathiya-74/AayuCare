/**
 * Patient Dashboard — lean orchestrator
 * Visual sub-components live in ./components/
 * All data logic stays here.
 */

import React, { useCallback, useMemo, useState, useEffect } from "react";
import { View, StyleSheet, ScrollView, RefreshControl } from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";
import { useDispatch, useSelector } from "react-redux";
import { useQuery } from "@tanstack/react-query";
import { useIsFocused } from "@react-navigation/native";
import { theme, healthColors } from "@/theme";
import { useAuth } from "@/context/AuthContext";
import { getSafeAreaEdges, getScreenPadding } from "@/utils/responsive";
import { notificationService } from "@/services";
import { queryKeys } from "@/config/reactQueryConfig";
import { fetchHealthMetrics } from "@/store/slices/healthSlice";
import {
  Calendar,
  FolderOpen,
  Stethoscope,
  Activity,
  MessageCircle,
  HeartPulse,
  Info,
  Users,
  ShoppingCart,
  Home,
  User,
  Settings,
} from "lucide-react-native";
import { SectionHeader } from "@/components/common";
import { useDrawer } from "@/hooks/useDrawer";
import { DrawerMenu } from "@/components/layout";
import {
  SkeletonCardRow,
  SkeletonStatGrid,
  PatientHeader,
  HealthStatusCard,
  MedicalHistoryCard,
  EmergencyContactCard,
  QuickActionsGrid,
} from "./components";
import {
  computeHealthStatus,
  getTimeBasedGreeting,
  getGreetingIcon,
  getLatestMetric,
} from "@/utils/vitalsSelector";
import Routes from "@/navigation/routes";

const PatientDashboard = ({ navigation }) => {
  const dispatch = useDispatch();
  const { user, isLoading: authLoading } = useSelector((state) => state.auth);
  const { logout } = useAuth();
  const { vitals: healthMetrics, isLoading: loadingMetrics } = useSelector(
    (state) => state.health
  );
  const notificationPermission = useSelector(
    (state) => state.permissions?.notification || {}
  );
  const [refreshing, setRefreshing] = useState(false);
  const isFocused = useIsFocused();
  const canUseNotifications =
    !!notificationPermission.granted &&
    !!notificationPermission.notificationsEnabled;

  // ── Shared drawer hook ──
  const { menuVisible, openMenu, closeMenu, slideAnim, drawerWidth } =
    useDrawer();

  const { data: unreadNotifications = 0, refetch: refetchUnreadNotifications } =
    useQuery({
      queryKey: queryKeys.notifications.unreadCount(),
      queryFn: async () => {
        const response = await notificationService.getUnreadCount();
        return Number(response?.data?.count || 0);
      },
      enabled: !!user?.id && user?.role === "patient" && canUseNotifications,
      staleTime: 30 * 1000,
      retry: 1,
    });

  useEffect(() => {
    if (user?.id) {
      dispatch(fetchHealthMetrics(user.id));
    }
  }, [user?.id, dispatch]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        dispatch(fetchHealthMetrics(user?.id)),
        canUseNotifications ? refetchUnreadNotifications() : Promise.resolve(),
      ]);
    } catch (e) {
      console.error(e);
    } finally {
      setRefreshing(false);
    }
  }, [dispatch, refetchUnreadNotifications, user?.id, canUseNotifications]);

  // ── Metric helpers ──
  const safeMetrics = useMemo(
    () => (Array.isArray(healthMetrics) ? healthMetrics : []),
    [healthMetrics]
  );

  const formatBP = useCallback(() => {
    const m = getLatestMetric(safeMetrics, "bp");
    if (!m?.value) return "N/A";
    return `${m.value.systolic}/${m.value.diastolic}`;
  }, [safeMetrics]);

  const formatSugar = useCallback(() => {
    const m = getLatestMetric(safeMetrics, "sugar");
    return m?.value ? `${m.value}` : "N/A";
  }, [safeMetrics]);

  const formatTemp = useCallback(() => {
    const m = getLatestMetric(safeMetrics, "temperature");
    return m?.value ? `${m.value}°F` : "N/A";
  }, [safeMetrics]);

  const getHealthStatus = useCallback(() => {
    return computeHealthStatus(safeMetrics);
  }, [safeMetrics]);

  const getLastUpdateTime = useCallback(() => {
    if (!safeMetrics.length) return "No data";
    const latest = [...safeMetrics].sort(
      (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
    )[0];
    const date = new Date(latest.timestamp);
    const isToday = date.toDateString() === new Date().toDateString();
    if (isToday)
      return `Today ${date.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      })}`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }, [safeMetrics]);

  const getGreeting = useCallback(() => {
    return getTimeBasedGreeting();
  }, []);

  const getGreetingIconName = useCallback(() => {
    return getGreetingIcon();
  }, []);

  const handleLogout = useCallback(async () => {
    await logout();
  }, [logout]);

  // ── Action cards ──
  const actionCards = useMemo(
    () => [
      {
        title: "Book Appointment",
        icon: Calendar,
        iconColor: healthColors.primary.main,
        onPress: () => navigation.navigate(Routes.PATIENT.APPOINTMENT_BOOKING),
      },
      {
        title: "Medical Records",
        icon: FolderOpen,
        iconColor: healthColors.accent.aqua,
        onPress: () => navigation.navigate(Routes.PATIENT.MEDICAL_RECORDS),
      },
      {
        title: "Prescriptions",
        icon: Stethoscope,
        iconColor: healthColors.success.main,
        onPress: () => navigation.navigate(Routes.PATIENT.MY_PRESCRIPTIONS),
      },
      {
        title: "Health Metrics",
        icon: Activity,
        iconColor: healthColors.primary.main,
        onPress: () => navigation.navigate(Routes.PATIENT.HEALTH_METRICS),
      },
      {
        title: "AI Health Assistant",
        icon: MessageCircle,
        iconColor: healthColors.secondary.main,
        onPress: () => navigation.navigate(Routes.PATIENT.AI_HEALTH_ASSISTANT),
      },
      {
        title: "AI Symptom Checker",
        icon: HeartPulse,
        iconColor: healthColors.error.main,
        onPress: () => navigation.navigate(Routes.PATIENT.AI_SYMPTOM_CHECKER),
      },
      {
        title: "Disease Info",
        icon: Info,
        iconColor: healthColors.accent.purple,
        onPress: () => navigation.navigate(Routes.PATIENT.DISEASE_INFO),
      },
      {
        title: "Specialist Finder",
        icon: Users,
        iconColor: healthColors.info.main,
        onPress: () =>
          navigation.navigate(Routes.PATIENT.SPECIALIST_CARE_FINDER),
      },
      {
        title: "Hospital Events",
        icon: Calendar,
        iconColor: healthColors.warning.main,
        onPress: () => navigation.navigate(Routes.PATIENT.HOSPITAL_EVENTS),
      },
      {
        title: "Pharmacy & Billing",
        icon: ShoppingCart,
        iconColor: healthColors.success.main,
        onPress: () => navigation.navigate(Routes.PATIENT.PHARMACY_BILLING),
      },
    ],
    [navigation]
  );

  // ── Drawer menu sections ──
  const nav = useCallback(
    (screen, params) => () => {
      closeMenu();
      setTimeout(() => navigation.navigate(screen, params), 100);
    },
    [navigation, closeMenu]
  );

  const menuSections = useMemo(
    () => [
      {
        title: "QUICK ACCESS",
        items: [
          {
            icon: Home,
            iconColor: healthColors.primary.main,
            label: "Dashboard",
            onPress: nav(Routes.TABS.PATIENT, {
              screen: Routes.PATIENT_TABS.DASHBOARD,
            }),
          },
          {
            icon: Calendar,
            iconColor: healthColors.primary.main,
            label: "Book Appointment",
            onPress: nav(Routes.PATIENT.APPOINTMENT_BOOKING),
          },
          {
            icon: FolderOpen,
            iconColor: healthColors.accent.aqua,
            label: "Medical Records",
            onPress: nav(Routes.PATIENT.MEDICAL_RECORDS),
          },
          {
            icon: Stethoscope,
            iconColor: healthColors.success.main,
            label: "My Prescriptions",
            onPress: nav(Routes.PATIENT.MY_PRESCRIPTIONS),
          },
        ],
      },
      {
        title: "HEALTH & WELLNESS",
        items: [
          {
            icon: Activity,
            iconColor: theme.colors.healthcare.teal,
            label: "Health Metrics",
            onPress: nav(Routes.PATIENT.HEALTH_METRICS),
          },
          {
            icon: Info,
            iconColor: healthColors.info.main,
            label: "Disease Information",
            onPress: nav(Routes.PATIENT.DISEASE_INFO),
          },
        ],
      },
      {
        title: "AI SERVICES",
        items: [
          {
            icon: MessageCircle,
            iconColor: healthColors.secondary.main,
            label: "AI Health Assistant",
            onPress: nav(Routes.PATIENT.AI_HEALTH_ASSISTANT),
          },
          {
            icon: HeartPulse,
            iconColor: theme.colors.error.main,
            label: "AI Symptom Checker",
            onPress: nav(Routes.PATIENT.AI_SYMPTOM_CHECKER),
          },
          {
            icon: Users,
            iconColor:
              healthColors.accent.purple || healthColors.secondary.main,
            label: "Find Specialist",
            onPress: nav(Routes.PATIENT.SPECIALIST_CARE_FINDER),
          },
        ],
      },
      {
        title: "ACCOUNT",
        items: [
          {
            icon: User,
            iconColor: healthColors.text.secondary,
            label: "My Profile",
            onPress: nav(Routes.PATIENT.PROFILE),
          },
          {
            icon: Settings,
            iconColor: healthColors.text.secondary,
            label: "Settings",
            onPress: nav(Routes.TABS.PATIENT, {
              screen: Routes.PATIENT_TABS.MORE,
            }),
          },
        ],
      },
    ],
    [nav]
  );

  const healthStatus = useMemo(() => getHealthStatus(), [getHealthStatus]);

  if (authLoading && !user) {
    return (
      <SafeAreaView
        style={styles.container}
        edges={getSafeAreaEdges("withTabBar")}
      >
        <View style={styles.loadingSkeletonWrap}>
          <SkeletonStatGrid rows={2} />
          <SkeletonCardRow />
          <SkeletonCardRow />
          <SkeletonCardRow />
          <SkeletonCardRow />
        </View>
      </SafeAreaView>
    );
  }

  // ── Render ──
  return (
    <SafeAreaView
      style={styles.container}
      edges={getSafeAreaEdges("withTabBar")}
    >
      {isFocused && (
        <StatusBar style="light" backgroundColor="transparent" translucent />
      )}

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[healthColors.primary.main]}
            tintColor={healthColors.primary.main}
          />
        }
      >
        {/* ── Hero Header ── */}
        <PatientHeader
          user={user}
          isLoading={authLoading}
          unreadNotifications={unreadNotifications}
          greeting={getGreeting()}
          greetingIcon={getGreetingIconName()}
          onMenuOpen={openMenu}
          onNotificationPress={() =>
            navigation.navigate(Routes.PATIENT.NOTIFICATIONS)
          }
          onProfilePress={() => navigation.navigate(Routes.PATIENT.PROFILE)}
        />

        <View style={styles.body}>
          {/* ── Health Status ── */}
          <SectionHeader title="Health Status" style={styles.sectionHeader} />
          <HealthStatusCard
            loadingMetrics={loadingMetrics}
            status={healthStatus.status}
            riskScore={healthStatus.riskScore}
            bp={formatBP()}
            sugar={formatSugar()}
            temp={formatTemp()}
            lastUpdated={getLastUpdateTime()}
            onPress={() => navigation.navigate(Routes.PATIENT.HEALTH_METRICS)}
          />

          {/* ── Medical History ── */}
          {(user?.medicalHistory?.length > 0 ||
            user?.allergies?.length > 0 ||
            user?.currentMedications?.length > 0) && (
            <>
              <SectionHeader
                title="Medical History"
                style={styles.sectionHeader}
              />
              <MedicalHistoryCard
                medicalHistory={user?.medicalHistory || []}
                allergies={user?.allergies || []}
                currentMedications={user?.currentMedications || []}
              />
            </>
          )}

          {/* ── Emergency Contact ── */}
          <SectionHeader title="Emergency" style={styles.sectionHeader} />
          <EmergencyContactCard user={user} />

          {/* ── Quick Actions ── */}
          <SectionHeader title="Main Features" style={styles.sectionHeader} />
          <QuickActionsGrid actionCards={actionCards} />
        </View>
      </ScrollView>

      {/* ── Side Drawer ── */}
      <DrawerMenu
        visible={menuVisible}
        onClose={closeMenu}
        slideAnim={slideAnim}
        drawerWidth={drawerWidth}
        user={user}
        role="Patient"
        menuSections={menuSections}
        onLogout={handleLogout}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: healthColors.background.secondary,
  },
  loadingSkeletonWrap: {
    paddingHorizontal: getScreenPadding(),
    paddingTop: theme.spacing.md + theme.spacing[4],
    gap: theme.spacing.sm + theme.spacing.xs,
  },
  scrollView: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingBottom: 24 },
  body: {
    paddingHorizontal: getScreenPadding(),
    paddingTop: 20,
    gap: 0,
  },
  sectionHeader: { marginTop: 24, marginBottom: 12 },
});

export default PatientDashboard;
