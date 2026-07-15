/**
 * Admin Home Screen — lean orchestrator (decomposed from 2520-line monolith)
 * Sub-components live in ./components/
 * Data logic + navigation kept here.
 */

import React, { useState, useCallback, useMemo } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  StatusBar,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSelector } from "react-redux";
import { useQuery } from "@tanstack/react-query";
import { useFocusEffect } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import { theme, healthColors } from "@/theme";
import Routes from "@/navigation/routes";
import { getSafeAreaEdges } from "@/utils/responsive";
import { useAuth } from "@/context/AuthContext";
import { showConfirmation, logError } from "@/utils/errorHandler";
import { queryKeys } from "@/config/reactQueryConfig";
import adminService from "@/services/admin.service";
import notificationService from "@/services/notification.service";
import eventService from "@/services/event.service";
import doctorService from "@/features/hospital/api/doctor.service";
import patientService from "@/features/patient/api/patient.service";
import {
  Calendar,
  Stethoscope,
  Users,
  Pill,
  FileText,
  CalendarDays,
  Home,
  BarChart2,
  User,
  Settings,
} from "lucide-react-native";
import { useAdminAppointments } from "@/context/AdminAppointmentContext";
import { useDrawer } from "@/hooks/useDrawer";
import { DrawerMenu } from "@/components/layout";
import { SkeletonCardRow, SkeletonStatGrid } from "@/components/common";
import {
  AdminHeader,
  AdminWelcomeBanner,
  AdminStatsCarousel,
  AdminQuickActionsGrid,
  AdminUsersList,
  AdminRecentActivity,
  AdminProfileView,
} from "./components";

const extractUsers = (response) => {
  const payload = response?.data;
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.users)) return payload.users;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
};

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const isUuid = (value) => typeof value === "string" && UUID_REGEX.test(value);

const resolveEntityId = (entity) => {
  if (!entity || typeof entity !== "object") return null;

  return (
    entity.id ||
    entity.userId ||
    entity.user_id ||
    entity.doctorId ||
    entity.doctor_id ||
    entity.patientId ||
    entity.patient_id ||
    null
  );
};

const AdminHomeScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const notificationPermission = useSelector(
    (state) => state.permissions?.notification || {}
  );
  const canUseNotifications =
    !!notificationPermission.granted &&
    !!notificationPermission.notificationsEnabled;

  const { menuVisible, openMenu, closeMenu, slideAnim, drawerWidth } =
    useDrawer();
  const { refreshCount } = useAdminAppointments();

  const [refreshing, setRefreshing] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [activitiesLimit, setActivitiesLimit] = useState(5);
  const [stats, setStats] = useState({
    appointments: { total: 0, today: 0, pending: 0, completed: 0, trend: 0 },
    doctors: { total: 0, active: 0, onDuty: 0, trend: 0 },
    patients: { total: 0, new: 0, returning: 0, trend: 0 },
    prescriptions: { total: 0, today: 0, trend: 0 },
    revenue: { total: 0, today: 0, trend: 0 },
  });
  const [recentActivities, setRecentActivities] = useState([]);
  const [notificationCount, setNotificationCount] = useState(0);
  const [upcomingEventsCount, setUpcomingEventsCount] = useState(0);
  const [doctorsList, setDoctorsList] = useState([]);
  const [patientsList, setPatientsList] = useState([]);
  // ── Data fetching ──
  const fetchDashboardData = useCallback(async () => {
    try {
      const [
        statsRes,
        activitiesRes,
        notifRes,
        eventsRes,
        doctorsRes,
        patientsRes,
      ] = await Promise.all([
        adminService.getDashboardStats().catch(() => null),
        adminService.getRecentActivities(activitiesLimit).catch(() => null),
        canUseNotifications
          ? notificationService.getUnreadCount().catch(() => null)
          : Promise.resolve(null),
        eventService.getUpcomingEvents({ limit: 100 }).catch(() => null),
        adminService.getUsers({ role: "doctor", limit: 3 }).catch(() => null),
        adminService.getUsers({ role: "patient", limit: 3 }).catch(() => null),
      ]);

      if (statsRes?.success) {
        const d = statsRes.data;
        setStats({
          appointments:
            typeof d.appointments === "object"
              ? d.appointments
              : {
                  total: d.appointments || 0,
                  today: 0,
                  pending: 0,
                  completed: 0,
                  trend: 0,
                },
          doctors:
            typeof d.doctors === "object"
              ? d.doctors
              : { total: d.doctors || 0, active: 0, onDuty: 0, trend: 0 },
          patients:
            typeof d.patients === "object"
              ? d.patients
              : { total: d.patients || 0, new: 0, returning: 0, trend: 0 },
          prescriptions:
            typeof d.prescriptions === "object"
              ? d.prescriptions
              : { total: d.prescriptions || 0, today: 0, trend: 0 },
          revenue: d.revenue || { total: 0, today: 0, trend: 0 },
        });
      }
      if (activitiesRes?.success) setRecentActivities(activitiesRes.data);
      if (notifRes?.success) setNotificationCount(notifRes.data?.count || 0);
      if (!canUseNotifications) setNotificationCount(0);
      if (eventsRes?.success)
        setUpcomingEventsCount(eventsRes.data?.length || 0);
      if (doctorsRes?.success) setDoctorsList(extractUsers(doctorsRes));
      if (patientsRes?.success) setPatientsList(extractUsers(patientsRes));

      return {
        ok: true,
        updatedAt: Date.now(),
      };
    } catch (err) {
      logError(err, { context: "AdminHomeScreen.fetchDashboardData" });
      return {
        ok: false,
        updatedAt: Date.now(),
      };
    }
  }, [activitiesLimit, canUseNotifications]);

  const { isLoading: dashboardLoading, refetch: refetchDashboard } = useQuery({
    queryKey: queryKeys.dashboardStats.admin(),
    queryFn: fetchDashboardData,
    staleTime: 60 * 1000,
    enabled: !!user?.id && user?.role === "admin",
  });

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

  const handleLogout = useCallback(() => {
    showConfirmation(
      "Are you sure you want to logout?",
      () => logout(),
      () => {},
      "Logout",
      "log-out-outline"
    );
  }, [logout]);

  // ── Derived data ──
  const greeting = useMemo(() => {
    const h = new Date().getHours();
    if (h >= 5 && h < 12) return t("dashboard.goodMorning", "Good Morning");
    if (h >= 12 && h < 17)
      return t("dashboard.goodAfternoon", "Good Afternoon");
    if (h >= 17 && h < 21) return t("dashboard.goodEvening", "Good Evening");
    return t("dashboard.goodNight", "Good Night");
  }, [t]);

  const statCards = useMemo(
    () => [
      {
        title: t("dashboard.appointments", "Appointments"),
        value: stats.appointments.total,
        subtitle: t(
          "dashboard.appointmentsSubtitle",
          "{{today}} today • {{pending}} pending",
          {
            today: stats.appointments.today,
            pending: stats.appointments.pending,
          }
        ),
        icon: Calendar,
        gradient: [healthColors.primary.main, healthColors.primary.dark],
        trend: stats.appointments.trend,
        screen: Routes.ADMIN_TABS.APPOINTMENTS,
        isTabScreen: true,
      },
      {
        title: t("dashboard.totalDoctors", "Total Doctors"),
        value: stats.doctors.total,
        subtitle: t(
          "dashboard.doctorsSubtitle",
          "{{active}} active • {{onDuty}} on duty",
          { active: stats.doctors.active, onDuty: stats.doctors.onDuty }
        ),
        icon: Stethoscope,
        gradient: [healthColors.secondary.main, healthColors.secondary.dark],
        trend: stats.doctors.trend,
        screen: Routes.ADMIN.MANAGE_DOCTORS,
        isTabScreen: false,
      },
      {
        title: t("dashboard.totalPatients", "Total Patients"),
        value: stats.patients.total.toLocaleString(),
        subtitle: t(
          "dashboard.patientsSubtitle",
          "{{new}} new • {{returning}} returning",
          { new: stats.patients.new, returning: stats.patients.returning }
        ),
        icon: Users,
        gradient: [healthColors.accent.coral, healthColors.accent.pink],
        trend: stats.patients.trend,
        screen: Routes.ADMIN.PATIENT_MANAGEMENT,
        isTabScreen: false,
      },
      {
        title: t("dashboard.prescriptions", "Prescriptions"),
        value: stats.prescriptions.total,
        subtitle: t(
          "dashboard.prescriptionsSubtitle",
          "{{today}} issued today",
          { today: stats.prescriptions.today }
        ),
        icon: Pill,
        gradient: [healthColors.info.main, healthColors.info.dark],
        trend: stats.prescriptions.trend,
        screen: Routes.ADMIN_TABS.REPORTS,
        isTabScreen: true,
      },
    ],
    [stats, t]
  );

  // Navigate helper
  const nav = useCallback(
    (screen, params, isTab = false) =>
      () => {
        if (isTab)
          navigation.navigate(Routes.TABS.ADMIN, { screen, ...params });
        else navigation.navigate(screen, params);
      },
    [navigation]
  );

  const quickActions = useMemo(
    () => [
      {
        title: t("dashboard.patients", "Patients"),
        icon: Users,
        color: healthColors.primary.main,
        onPress: nav(Routes.ADMIN.PATIENT_MANAGEMENT),
      },
      {
        title: t("dashboard.doctors", "Doctors"),
        icon: Stethoscope,
        color: healthColors.secondary.main,
        onPress: nav(Routes.ADMIN.MANAGE_DOCTORS),
      },
      {
        title: t("dashboard.appointments", "Appointments"),
        icon: Calendar,
        color: healthColors.accent.coral,
        badge: stats.appointments.pending || null,
        onPress: nav(Routes.ADMIN_TABS.APPOINTMENTS, {}, true),
      },
      {
        title: t("dashboard.reports", "Reports"),
        icon: FileText,
        color: healthColors.info.main,
        onPress: nav(Routes.ADMIN_TABS.REPORTS, {}, true),
      },
      {
        title: t("dashboard.pharmacy", "Pharmacy"),
        icon: Pill,
        color: healthColors.accent.purple,
        badge: stats.prescriptions.today > 0 ? stats.prescriptions.today : null,
        onPress: nav(Routes.ADMIN.PHARMACY_MANAGEMENT),
      },
      {
        title: t("dashboard.events", "Events"),
        icon: CalendarDays,
        color: healthColors.accent.green,
        badge: upcomingEventsCount > 0 ? upcomingEventsCount : null,
        onPress: nav(Routes.ADMIN.HOSPITAL_EVENTS),
      },
    ],
    [stats, upcomingEventsCount, nav, t]
  );

  const warmManageDoctors = useCallback(() => {
    const hospitalFilters = user?.hospitalId
      ? { hospitalId: user.hospitalId }
      : {};
    doctorService.getAllDoctors(hospitalFilters).catch(() => {});
  }, [user?.hospitalId]);

  const warmManagePatients = useCallback(() => {
    patientService.getAllPatients({}, { forceFresh: false }).catch(() => {});
  }, []);

  const handleDoctorPress = useCallback(
    (doctor) => {
      const id = resolveEntityId(doctor);
      warmManageDoctors();
      if (isUuid(id)) {
        doctorService.getDoctor(id).catch(() => {});
      }

      try {
        if (typeof navigation.preload === "function") {
          navigation.preload(
            Routes.ADMIN.MANAGE_DOCTORS,
            id
              ? {
                  doctorId: id,
                  doctorName: doctor?.name,
                  doctorPayload: doctor,
                }
              : undefined
          );
        }
      } catch {
        // Ignore preload failures and continue with normal navigation.
      }

      navigation.navigate(
        Routes.ADMIN.MANAGE_DOCTORS,
        id
          ? { doctorId: id, doctorName: doctor?.name, doctorPayload: doctor }
          : undefined
      );
    },
    [navigation, warmManageDoctors]
  );

  const handlePatientPress = useCallback(
    (patient) => {
      const id = resolveEntityId(patient);
      warmManagePatients();
      if (isUuid(id)) {
        patientService.getPatientById(id).catch(() => {});
      }

      try {
        if (typeof navigation.preload === "function") {
          navigation.preload(
            Routes.ADMIN.PATIENT_MANAGEMENT,
            id
              ? {
                  patientId: id,
                  patientName: patient?.name,
                  patientPayload: patient,
                }
              : undefined
          );
        }
      } catch {
        // Ignore preload failures and continue with normal navigation.
      }

      navigation.navigate(
        Routes.ADMIN.PATIENT_MANAGEMENT,
        id
          ? {
              patientId: id,
              patientName: patient?.name,
              patientPayload: patient,
            }
          : undefined
      );
    },
    [navigation, warmManagePatients]
  );

  const handleDoctorsSectionPress = useCallback(() => {
    warmManageDoctors();
    navigation.navigate(Routes.ADMIN.MANAGE_DOCTORS);
  }, [navigation, warmManageDoctors]);

  const handlePatientsSectionPress = useCallback(() => {
    warmManagePatients();
    navigation.navigate(Routes.ADMIN.PATIENT_MANAGEMENT);
  }, [navigation, warmManagePatients]);

  // ── Drawer menu ──
  const navFromDrawer = useCallback(
    (screen, isTab = false) =>
      () => {
        closeMenu();
        setTimeout(() => {
          if (isTab) navigation.navigate(Routes.TABS.ADMIN, { screen });
          else navigation.navigate(screen);
        }, 100);
      },
    [navigation, closeMenu]
  );

  const menuSections = useMemo(
    () => [
      {
        title: t("drawer.systemManagement", "SYSTEM MANAGEMENT"),
        items: [
          {
            icon: Home,
            iconColor: healthColors.primary.main,
            label: t("drawer.dashboard", "Dashboard"),
            onPress: navFromDrawer(Routes.ADMIN_TABS.DASHBOARD, true),
          },
          {
            icon: Stethoscope,
            iconColor: healthColors.secondary.main,
            label: t("drawer.manageDoctors", "Manage Doctors"),
            onPress: navFromDrawer(Routes.ADMIN.MANAGE_DOCTORS),
          },
          {
            icon: Users,
            iconColor: healthColors.accent.aqua,
            label: t("drawer.managePatients", "Manage Patients"),
            onPress: navFromDrawer(Routes.ADMIN.PATIENT_MANAGEMENT),
          },
          {
            icon: Calendar,
            iconColor: healthColors.accent.coral,
            label: t("drawer.appointments", "Appointments"),
            onPress: navFromDrawer(Routes.ADMIN_TABS.APPOINTMENTS, true),
          },
          {
            icon: BarChart2,
            iconColor: healthColors.info.main,
            label: t("drawer.reportsAndRecords", "Reports & Records"),
            onPress: navFromDrawer(Routes.ADMIN_TABS.REPORTS, true),
          },
        ],
      },
      {
        title: t("drawer.account", "ACCOUNT"),
        items: [
          {
            icon: User,
            iconColor: healthColors.text.secondary,
            label: t("drawer.profile", "Profile"),
            onPress: () => {
              closeMenu();
              setTimeout(() => setShowProfile(true), 100);
            },
          },
          {
            icon: Settings,
            iconColor: healthColors.text.secondary,
            label: t("drawer.settings", "Settings"),
            onPress: navFromDrawer(Routes.ADMIN_TABS.SETTINGS, true),
          },
        ],
      },
    ],
    [navFromDrawer, closeMenu, t]
  );

  // ── Render ──
  return (
    <SafeAreaView
      style={styles.container}
      edges={getSafeAreaEdges("withTabBar")}
    >
      <StatusBar
        barStyle="dark-content"
        backgroundColor={healthColors.background.primary}
      />

      <AdminHeader
        notificationCount={notificationCount}
        showProfile={showProfile}
        onMenuOpen={openMenu}
        onNotificationPress={() =>
          navigation.navigate(Routes.ADMIN.NOTIFICATIONS)
        }
        onProfileToggle={() => setShowProfile((v) => !v)}
      />

      {showProfile ? (
        <AdminProfileView
          user={user}
          onNavigate={(screen) => {
            setShowProfile(false);
            navigation.navigate(screen);
          }}
          onLogout={handleLogout}
        />
      ) : (
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
          {dashboardLoading ? (
            <View style={styles.loadingSkeletonWrap}>
              <SkeletonStatGrid rows={2} />
              <SkeletonCardRow />
              <SkeletonCardRow />
              <SkeletonCardRow />
            </View>
          ) : (
            <>
              {/* Welcome */}
              <View style={styles.bannerWrap}>
                <AdminWelcomeBanner greeting={greeting} user={user} />
              </View>

              {/* Stats */}
              <View style={styles.sectionWrap}>
                <AdminStatsCarousel
                  statCards={statCards}
                  onCardPress={(stat) => {
                    if (stat.isTabScreen)
                      navigation.navigate(Routes.TABS.ADMIN, {
                        screen: stat.screen,
                      });
                    else if (stat.screen) navigation.navigate(stat.screen);
                  }}
                />
              </View>

              {/* Quick Actions */}
              <AdminQuickActionsGrid
                title="Quick Actions"
                actions={quickActions}
              />

              {/* Doctors list */}
              <AdminUsersList
                title="Total Doctors"
                titleIcon={Stethoscope}
                iconColor={healthColors.secondary.main}
                users={doctorsList}
                onSectionPress={handleDoctorsSectionPress}
                onViewAll={handleDoctorsSectionPress}
                onUserPress={handleDoctorPress}
              />

              {/* Patients list */}
              <AdminUsersList
                title="Recent Patients"
                titleIcon={Users}
                iconColor={healthColors.accent.coral}
                users={patientsList}
                onSectionPress={handlePatientsSectionPress}
                onViewAll={handlePatientsSectionPress}
                onUserPress={handlePatientPress}
              />

              {/* Recent Activity */}
              <AdminRecentActivity
                activities={recentActivities}
                showAll={activitiesLimit > 5}
                onToggle={() =>
                  setActivitiesLimit((prev) => (prev > 5 ? 5 : 20))
                }
              />

              <View style={styles.bottomPad} />
            </>
          )}
        </ScrollView>
      )}

      {/* Side Drawer */}
      <DrawerMenu
        visible={menuVisible}
        onClose={closeMenu}
        slideAnim={slideAnim}
        drawerWidth={drawerWidth}
        user={user}
        role="Admin"
        menuSections={menuSections}
        onLogout={handleLogout}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: healthColors.background.secondary },
  loadingSkeletonWrap: {
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.md,
    gap: theme.spacing.sm + theme.spacing.xs,
  },
  bannerWrap: { paddingBottom: theme.spacing.sm },
  sectionWrap: { paddingVertical: theme.spacing.sm },
  bottomPad: { height: theme.spacing.xl },
});

export default AdminHomeScreen;
