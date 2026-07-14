/**
 * Doctor Home Screen — lean orchestrator
 * Sub-components live in ./components/
 * All data logic stays here.
 */

import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from "react-native";
import { StatusBar } from "expo-status-bar";

import {
  AlertTriangle,
  Calendar,
  Users,
  FileText,
  UserPlus,
  Home,
  User,
  Settings,
} from "lucide-react-native";
import { useDispatch, useSelector } from "react-redux";
import { useQuery } from "@tanstack/react-query";
import { useFocusEffect, useIsFocused } from "@react-navigation/native";
import { theme, healthColors } from "@/theme";
import { getScreenPadding } from "@/utils/responsive";
import { logoutUser } from "@/store/slices/authSlice";
import { logError, parseError } from "@/utils/errorHandler";
import { doctorService } from "@/services";
import { useDoctorAppointments } from "@/context/DoctorAppointmentContext";
import { queryKeys } from "@/config/reactQueryConfig";
import {
  EmptyState,
  SectionHeader,
  ModalSheet,
  Button,
  SkeletonCardRow,
  SkeletonStatGrid,
} from "@/components/common";
import { useDrawer } from "@/hooks/useDrawer";
import { DrawerMenu } from "@/components/layout";
import {
  DoctorHeader,
  ScheduleStatsCard,
  PatientSearchBar,
  TodayAppointmentCard,
} from "./components";
import Routes from "@/navigation/routes";
import { useTranslation } from 'react-i18next';

const QUICK_ACTIONS = [
  {
    icon: Calendar,
    color: healthColors.primary.main,
    label: "Today's\nAppointments",
    screen: "DoctorTabs",
    params: { screen: "TodaysAppointments" },
  },
  {
    icon: Users,
    color: healthColors.secondary.main,
    label: "Patient\nManagement",
    screen: "PatientManagement",
  },
  {
    icon: FileText,
    color: healthColors.accent.coral,
    label: "Create\nPrescription",
    screen: "CreatePrescription",
  },
  {
    icon: UserPlus,
    color: healthColors.accent.green,
    label: "Walk-in\nPatient",
    screen: "WalkInPatient",
  },
];

const DoctorHomeScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const isFocused = useIsFocused();
  const { menuVisible, openMenu, closeMenu, slideAnim, drawerWidth } =
    useDrawer();

  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  const { refreshCount } = useDoctorAppointments();

  const {
    data: dashboardData,
    isLoading: loading,
    error,
    refetch: refetchDashboard,
  } = useQuery({
    queryKey: queryKeys.dashboardStats.doctor(user?.id),
    enabled: !!user?.id && user?.role === "doctor",
    staleTime: 60 * 1000,
    queryFn: async () => {
      const response = await doctorService.getDashboard();
      return response?.data || {};
    },
  });

  const schedule = useMemo(
    () => ({
      totalAppointments: dashboardData?.schedule?.totalAppointments || 0,
      completed: dashboardData?.schedule?.completed || 0,
      pending: dashboardData?.schedule?.pending || 0,
      nextPatient:
        dashboardData?.schedule?.nextPatient || "No upcoming patients",
      nextTime: dashboardData?.schedule?.nextTime || "--:--",
    }),
    [dashboardData]
  );

  const todaysAppointments = useMemo(
    () => dashboardData?.todaysAppointments || [],
    [dashboardData]
  );

  useFocusEffect(
    useCallback(() => {
      refetchDashboard();
      refreshCount();
    }, [refetchDashboard, refreshCount])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetchDashboard();
    refreshCount();
    setRefreshing(false);
  }, [refetchDashboard, refreshCount]);

  // ── Patient search (debounced) ──
  const searchTimeout = useRef(null);
  useEffect(() => {
    clearTimeout(searchTimeout.current);
    if (searchQuery.trim().length < 1) {
      setSearchResults([]);
      return;
    }
    searchTimeout.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await doctorService.searchMyPatients(searchQuery.trim());
        setSearchResults(res?.data?.patients || res?.data || []);
      } catch (err) {
        logError(err, { context: "DoctorHomeScreen.search" });
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 500);
    return () => clearTimeout(searchTimeout.current);
  }, [searchQuery]);

  // ── Handlers ──
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = useCallback(() => {
    setShowLogoutModal(true);
  }, []);

  const confirmLogout = async () => {
    setLoggingOut(true);
    try {
      await dispatch(logoutUser()).unwrap();
    } catch (err) {
      logError(err, { context: "DoctorHomeScreen.handleLogout" });
    } finally {
      setLoggingOut(false);
      setShowLogoutModal(false);
    }
  };

  const handleStartConsultation = useCallback(
    async (appointment) => {
      try {
        const id = appointment.id;
        if (!id) {
          Alert.alert("Error", "Invalid appointment ID");
          return;
        }
        await doctorService.updateAppointmentStatus(id, "in_progress");
        refetchDashboard();
        refreshCount();
        navigation.navigate(Routes.DOCTOR.CONSULTATION, { appointment });
      } catch (err) {
        logError(err, { context: "DoctorHomeScreen.startConsultation" });
        Alert.alert("Error", "Failed to start consultation. Please try again.");
      }
    },
    [refetchDashboard, refreshCount, navigation]
  );

  const handleViewHistory = useCallback(
    (appointment) => {
      navigation.navigate(Routes.DOCTOR.PATIENT_MANAGEMENT, {
        patientId: appointment.patientId,
        patientName: appointment.patientName,
      });
    },
    [navigation]
  );

  // ── Greeting helpers ──
  const getGreeting = useCallback(() => {
    const h = new Date().getHours();
    if (h >= 5 && h < 12) return "Good Morning";
    if (h >= 12 && h < 17) return "Good Afternoon";
    if (h >= 17 && h < 21) return "Good Evening";
    return "Good Night";
  }, []);

  const getGreetingIcon = useCallback(() => {
    const h = new Date().getHours();
    if (h >= 5 && h < 12) return "sunny";
    if (h >= 12 && h < 17) return "partly-sunny";
    if (h >= 17 && h < 21) return "moon";
    return "moon-outline";
  }, []);

  // ── Visible appointments ──
  const visibleAppointments = useMemo(
    () =>
      (todaysAppointments || []).filter((a) => {
        const s = String(a?.status || "")
          .toLowerCase()
          .replace(/-/g, "_")
          .replace(/\s+/g, "_");
        return s === "scheduled" || s === "confirmed" || s === "in_progress";
      }),
    [todaysAppointments]
  );

  // ── Drawer menu ──
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
        title: "NAVIGATION",
        items: [
          {
            icon: Home,
            iconColor: healthColors.primary.main,
            label: "Dashboard",
            onPress: nav("DoctorTabs", { screen: "Dashboard" }),
          },
          {
            icon: Calendar,
            iconColor: healthColors.secondary.main,
            label: "My Appointments",
            onPress: nav("DoctorTabs", { screen: "TodaysAppointments" }),
          },
          {
            icon: Users,
            iconColor: healthColors.accent.aqua,
            label: "Patient Management",
            onPress: nav("PatientManagement"),
          },
          {
            icon: FileText,
            iconColor: healthColors.accent.coral,
            label: "Create Prescription",
            onPress: nav("CreatePrescription"),
          },
          {
            icon: UserPlus,
            iconColor: healthColors.accent.green,
            label: "Walk-in Patient",
            onPress: nav("WalkInPatient"),
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
            onPress: nav("DoctorTabs", { screen: "Profile" }),
          },
          {
            icon: Settings,
            iconColor: healthColors.text.secondary,
            label: "Settings",
            onPress: nav("Settings"),
          },
        ],
      },
    ],
    [nav]
  );

  // ── Render ──
  return (
    <View style={styles.container}>
      {isFocused && (
        <StatusBar style="light" backgroundColor="transparent" translucent />
      )}

      <ScrollView
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
        {/* Error banner */}
        {error && (
          <View style={styles.errorBanner}>
            <AlertTriangle size={18} color={healthColors.error.main} />
            <Text style={styles.errorText}>{parseError(error)}</Text>
            <TouchableOpacity
              onPress={refetchDashboard}
              accessibilityRole="button"
              accessibilityLabel="Retry loading dashboard"
            >
              <Text style={styles.retryText}>{t('retry')}</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── Hero Header ── */}
        <DoctorHeader
          user={user}
          greeting={getGreeting()}
          greetingIcon={getGreetingIcon()}
          notificationCount={schedule.pending}
          onMenuOpen={openMenu}
          onNotificationPress={() =>
            navigation.navigate(Routes.DOCTOR.NOTIFICATIONS)
          }
        />

        <View style={styles.body}>
          {loading ? (
            <View style={styles.loadingSkeletonWrap}>
              <SkeletonStatGrid rows={2} />
              <SkeletonCardRow />
              <SkeletonCardRow />
              <SkeletonCardRow />
            </View>
          ) : (
            <>
              {/* ── Schedule Stats ── */}
              <ScheduleStatsCard schedule={schedule} />

              {/* ── Patient Search ── */}
              <SectionHeader
                title="Patient Search"
                style={styles.sectionHeader}
              />
              <PatientSearchBar
                value={searchQuery}
                onChangeText={setSearchQuery}
                searching={searching}
                results={searchResults}
                onClear={() => {
                  setSearchQuery("");
                  setSearchResults([]);
                }}
                onSelectPatient={(p) =>
                  navigation.navigate(Routes.DOCTOR.PATIENT_MANAGEMENT, {
                    patientId: p.userId,
                  })
                }
              />

              {/* ── Today's Appointments ── */}
              <SectionHeader
                title="Today's Appointments"
                style={styles.sectionHeader}
              />
              {visibleAppointments.length === 0 ? (
                <EmptyState
                  icon={Calendar}
                  title="No Appointments Today"
                  message="You have no scheduled or confirmed appointments right now."
                />
              ) : (
                visibleAppointments.map((appt) => (
                  <TodayAppointmentCard
                    key={appt.id}
                    appointment={appt}
                    onViewHistory={handleViewHistory}
                    onStartConsultation={handleStartConsultation}
                  />
                ))
              )}

              {/* ── Quick Actions ── */}
              <SectionHeader
                title="Quick Actions"
                style={styles.sectionHeader}
              />
              <View style={styles.quickGrid}>
                {QUICK_ACTIONS.map(
                  ({ icon: Icon, color, label, screen, params }) => (
                    <TouchableOpacity
                      key={label}
                      style={styles.quickCard}
                      onPress={() => navigation.navigate(screen, params)}
                      activeOpacity={0.75}
                      accessibilityRole="button"
                      accessibilityLabel={label.replace("\n", " ")}
                    >
                      <View
                        style={[
                          styles.quickIcon,
                          { backgroundColor: theme.withOpacity(color, 0.18) },
                        ]}
                      >
                        {Icon ? <Icon size={26} color={color} /> : null}
                      </View>
                      <Text style={styles.quickLabel}>{label}</Text>
                    </TouchableOpacity>
                  )
                )}
              </View>
            </>
          )}
        </View>
      </ScrollView>

      {/* ── Side Drawer ── */}
      <DrawerMenu
        visible={menuVisible}
        onClose={closeMenu}
        slideAnim={slideAnim}
        drawerWidth={drawerWidth}
        user={user}
        role="Doctor"
        menuSections={menuSections}
        onLogout={handleLogout}
      />

      {/* ── Logout Modal ── */}
      <ModalSheet
        visible={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        title="Logout"
        maxHeight={0.35}
      >
        <Text style={styles.modalText}>
          {t('are_you_sure_you_want_to_log_o')}
        </Text>
        <View style={styles.modalActions}>
          <Button
            variant="outline"
            onPress={() => setShowLogoutModal(false)}
            style={styles.modalButton}
            disabled={loggingOut}
            title="Cancel"
          />
          <Button
            variant="primary"
            onPress={confirmLogout}
            style={[
              styles.modalButton,
              {
                backgroundColor: healthColors.error.main,
                borderColor: healthColors.error.main,
              },
            ]}
            textStyle={{ color: healthColors.neutral.white }}
            loading={loggingOut}
            title="Logout"
          />
        </View>
      </ModalSheet>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: healthColors.background.secondary },
  body: {
    paddingHorizontal: getScreenPadding(),
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
  },
  loadingSkeletonWrap: { gap: theme.spacing.sm + theme.spacing.xs },
  sectionHeader: {
    marginTop: theme.spacing.xl,
    marginBottom: theme.spacing.sm + theme.spacing.xs,
  },

  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: healthColors.error.background,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  errorText: {
    flex: 1,
    fontSize: theme.typography.sizes.bodyMedium,
    color: healthColors.error.main,
  },
  retryText: {
    fontSize: theme.typography.sizes.bodyMedium,
    color: healthColors.primary.main,
    fontWeight: "600",
  },

  quickGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  quickCard: {
    width: "47%",
    backgroundColor: healthColors.background.card,
    borderRadius: theme.borderRadius.card,
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: healthColors.border.light,
    ...theme.shadows.sm,
  },
  quickIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  quickLabel: {
    fontSize: theme.typography.sizes.bodySmall,
    fontWeight: "700",
    color: healthColors.text.primary,
    textAlign: "center",
    lineHeight: 17,
  },
  modalText: {
    fontSize: theme.typography.sizes.bodyLarge,
    color: healthColors.text.primary,
    lineHeight: 24,
    marginBottom: 24,
    textAlign: "center",
  },
  modalActions: {
    flexDirection: "row",
    gap: 12,
  },
  modalButton: {
    flex: 1,
  },
});

export default DoctorHomeScreen;
