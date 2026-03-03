/**
 * Admin Home Screen — lean orchestrator (decomposed from 2520-line monolith)
 * Sub-components live in ./components/
 * Data logic + navigation kept here.
 */

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  StatusBar,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSelector, useDispatch } from "react-redux";
import { useFocusEffect } from "@react-navigation/native";
import { theme, healthColors } from "../../theme";
import { getSafeAreaEdges } from "../../utils/responsive";
import { logoutUser } from "../../store/slices/authSlice";
import { showConfirmation, logError } from "../../utils/errorHandler";
import { formatCurrency } from "../../utils/helpers";
import adminService from "../../services/admin.service";
import notificationService from "../../services/notification.service";
import eventService from "../../services/event.service";
import { useAdminAppointments } from "../../context/AdminAppointmentContext";
import { useDrawer } from "../../hooks/useDrawer";
import { DrawerMenu } from "../../components/layout";
import {
  AdminHeader,
  AdminWelcomeBanner,
  AdminStatsCarousel,
  AdminQuickActionsGrid,
  AdminUsersList,
  AdminRecentActivity,
  AdminProfileView,
} from "./components";

const AdminHomeScreen = ({ navigation }) => {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const { menuVisible, openMenu, closeMenu, slideAnim, drawerWidth } = useDrawer();
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
  const [systemHealth, setSystemHealth] = useState(null);
  const [systemMetrics, setSystemMetrics] = useState(null);

  // ── Data fetching ──
  const fetchDashboardData = useCallback(async () => {
    try {
      const [
        statsRes, activitiesRes, notifRes, eventsRes,
        doctorsRes, patientsRes, metricsRes,
      ] = await Promise.all([
        adminService.getDashboardStats().catch(() => null),
        adminService.getRecentActivities(activitiesLimit).catch(() => null),
        notificationService.getUnreadCount().catch(() => null),
        eventService.getUpcomingEvents({ limit: 100 }).catch(() => null),
        adminService.getUsers({ role: "doctor", limit: 10 }).catch(() => null),
        adminService.getUsers({ role: "patient", limit: 10 }).catch(() => null),
        adminService.getSystemMetrics().catch(() => null),
      ]);

      if (statsRes?.success) {
        const d = statsRes.data;
        setStats({
          appointments: typeof d.appointments === "object"
            ? d.appointments : { total: d.appointments || 0, today: 0, pending: 0, completed: 0, trend: 0 },
          doctors: typeof d.doctors === "object"
            ? d.doctors : { total: d.doctors || 0, active: 0, onDuty: 0, trend: 0 },
          patients: typeof d.patients === "object"
            ? d.patients : { total: d.patients || 0, new: 0, returning: 0, trend: 0 },
          prescriptions: typeof d.prescriptions === "object"
            ? d.prescriptions : { total: d.prescriptions || 0, today: 0, trend: 0 },
          revenue: d.revenue || { total: 0, today: 0, trend: 0 },
        });
      }
      if (activitiesRes?.success) setRecentActivities(activitiesRes.data);
      if (notifRes?.success) setNotificationCount(notifRes.data?.count || 0);
      if (eventsRes?.success) setUpcomingEventsCount(eventsRes.data?.length || 0);
      if (doctorsRes?.success) setDoctorsList(doctorsRes.data || []);
      if (patientsRes?.success) setPatientsList(patientsRes.data || []);
      if (metricsRes?.success) setSystemMetrics(metricsRes.data || null);

      // Non-critical system health
      try {
        const healthRes = await adminService.getSystemHealth();
        setSystemHealth(healthRes?.success ? healthRes.data : null);
      } catch { setSystemHealth(null); }
    } catch (err) {
      logError(err, { context: "AdminHomeScreen.fetchDashboardData" });
    }
  }, [activitiesLimit]);

  useFocusEffect(
    useCallback(() => {
      fetchDashboardData();
      refreshCount();
    }, [fetchDashboardData, refreshCount])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchDashboardData();
    refreshCount();
    setRefreshing(false);
  }, [fetchDashboardData, refreshCount]);

  const handleLogout = useCallback(() => {
    showConfirmation("Are you sure you want to logout?", () => dispatch(logoutUser()), () => {}, "Logout");
  }, [dispatch]);

  // ── Derived data ──
  const greeting = useMemo(() => {
    const h = new Date().getHours();
    if (h >= 5 && h < 12) return "Good Morning";
    if (h >= 12 && h < 17) return "Good Afternoon";
    if (h >= 17 && h < 21) return "Good Evening";
    return "Good Night";
  }, []);

  const statCards = useMemo(() => [
    { title: "Appointments", value: stats.appointments.total,
      subtitle: `${stats.appointments.today} today • ${stats.appointments.pending} pending`,
      icon: "calendar", gradient: [healthColors.primary.main, healthColors.primary.dark],
      trend: stats.appointments.trend, screen: "Appointments", isTabScreen: true },
    { title: "Total Doctors", value: stats.doctors.total,
      subtitle: `${stats.doctors.active} active • ${stats.doctors.onDuty} on duty`,
      icon: "medical", gradient: [healthColors.secondary.main, healthColors.secondary.dark],
      trend: stats.doctors.trend, screen: "ManageDoctors", isTabScreen: false },
    { title: "Total Patients", value: stats.patients.total.toLocaleString(),
      subtitle: `${stats.patients.new} new • ${stats.patients.returning} returning`,
      icon: "people", gradient: [healthColors.accent.coral, "#E57399"],
      trend: stats.patients.trend, screen: "PatientManagement", isTabScreen: false },
    { title: "Prescriptions", value: stats.prescriptions.total,
      subtitle: `${stats.prescriptions.today} issued today`,
      icon: "medkit", gradient: [healthColors.info.main, healthColors.info.dark],
      trend: stats.prescriptions.trend, screen: "Reports", isTabScreen: true },
  ], [stats]);

  // Navigate helper
  const nav = (screen, params, isTab = false) => () => {
    if (isTab) navigation.navigate("AdminTabs", { screen, ...params });
    else navigation.navigate(screen, params);
  };

  const quickActions = useMemo(() => [
    { title: "Patients", icon: "people", color: healthColors.primary.main, onPress: nav("PatientManagement") },
    { title: "Doctors", icon: "medical", color: healthColors.secondary.main, onPress: nav("ManageDoctors") },
    { title: "Appointments", icon: "calendar", color: healthColors.accent.coral,
      badge: stats.appointments.pending || null, onPress: nav("Appointments", {}, true) },
    { title: "Reports", icon: "document-text", color: healthColors.info.main, onPress: nav("Reports", {}, true) },
    { title: "Pharmacy", icon: "medkit", color: healthColors.accent.purple,
      badge: stats.prescriptions.today > 0 ? stats.prescriptions.today : null, onPress: nav("PharmacyManagement") },
    { title: "Events", icon: "calendar-outline", color: healthColors.accent.green,
      badge: upcomingEventsCount > 0 ? upcomingEventsCount : null, onPress: nav("HospitalEventsScreen") },
  ], [stats, upcomingEventsCount, navigation]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Drawer menu ──
  const navFromDrawer = (screen, isTab = false) => () => {
    closeMenu();
    setTimeout(() => {
      if (isTab) navigation.navigate("AdminTabs", { screen });
      else navigation.navigate(screen);
    }, 100);
  };

  const menuSections = useMemo(() => [
    {
      title: "SYSTEM MANAGEMENT",
      items: [
        { icon: "home", iconColor: healthColors.primary.main, label: "Dashboard", onPress: navFromDrawer("Dashboard", true) },
        { icon: "medical", iconColor: healthColors.secondary.main, label: "Manage Doctors", onPress: navFromDrawer("ManageDoctors") },
        { icon: "people", iconColor: healthColors.accent.aqua, label: "Manage Patients", onPress: navFromDrawer("PatientManagement") },
        { icon: "calendar", iconColor: healthColors.accent.coral, label: "Appointments", onPress: navFromDrawer("Appointments", true) },
        { icon: "bar-chart", iconColor: healthColors.info.main, label: "Reports & Records", onPress: navFromDrawer("Reports", true) },
      ],
    },
    {
      title: "ACCOUNT",
      items: [
        { icon: "person", iconColor: healthColors.text.secondary, label: "Profile",
          onPress: () => { closeMenu(); setTimeout(() => setShowProfile(true), 100); } },
        { icon: "settings", iconColor: healthColors.text.secondary, label: "Settings", onPress: navFromDrawer("Settings", true) },
      ],
    },
  ], [navigation, closeMenu]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Render ──
  return (
    <SafeAreaView style={styles.container} edges={getSafeAreaEdges("withTabBar")}>
      <StatusBar barStyle="dark-content" backgroundColor={healthColors.background.primary} />

      <AdminHeader
        notificationCount={notificationCount}
        showProfile={showProfile}
        onMenuOpen={openMenu}
        onNotificationPress={() => navigation.navigate("NotificationsScreen")}
        onProfileToggle={() => setShowProfile((v) => !v)}
      />

      {showProfile ? (
        <AdminProfileView
          user={user}
          onNavigate={(screen) => { setShowProfile(false); navigation.navigate(screen); }}
          onLogout={handleLogout}
        />
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh}
              colors={[healthColors.primary.main]} tintColor={healthColors.primary.main} />
          }
        >
          {/* Welcome */}
          <View style={styles.bannerWrap}>
            <AdminWelcomeBanner greeting={greeting} user={user} />
          </View>

          {/* Stats */}
          <View style={styles.sectionWrap}>
            <AdminStatsCarousel
              statCards={statCards}
              onCardPress={(stat) => {
                if (stat.isTabScreen) navigation.navigate("AdminTabs", { screen: stat.screen });
                else if (stat.screen) navigation.navigate(stat.screen);
              }}
            />
          </View>

          {/* Quick Actions */}
          <AdminQuickActionsGrid title="Quick Actions" actions={quickActions} />

          {/* Doctors list */}
          <AdminUsersList
            title="Total Doctors"
            titleIcon="medical"
            iconColor={healthColors.secondary.main}
            users={doctorsList}
            onViewAll={() => navigation.navigate("ManageDoctors")}
            onUserPress={(doctor) => {
              const id = doctor?.userId || doctor?._id || doctor?.id;
              navigation.navigate("ManageDoctors", id ? { doctorId: id, doctorName: doctor?.name } : undefined);
            }}
          />

          {/* Patients list */}
          <AdminUsersList
            title="Recent Patients"
            titleIcon="people"
            iconColor={healthColors.accent.coral}
            users={patientsList}
            onViewAll={() => navigation.navigate("PatientManagement")}
            onUserPress={(patient) => {
              const id = patient?.userId || patient?._id || patient?.id;
              navigation.navigate("PatientManagement", id ? { patientId: id, patientName: patient?.name } : undefined);
            }}
          />

          {/* Recent Activity */}
          <AdminRecentActivity
            activities={recentActivities}
            showAll={activitiesLimit > 5}
            onToggle={() => setActivitiesLimit((prev) => (prev > 5 ? 5 : 20))}
          />

          <View style={styles.bottomPad} />
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
  bannerWrap: { paddingBottom: 8 },
  sectionWrap: { paddingVertical: 8 },
  bottomPad: { height: 24 },
});

export default AdminHomeScreen;
