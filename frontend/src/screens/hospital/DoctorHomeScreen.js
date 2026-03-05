/**
 * Doctor Home Screen — lean orchestrator
 * Sub-components live in ./components/
 * All data logic stays here.
 */

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  RefreshControl,
  Alert,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useDispatch, useSelector } from "react-redux";
import { useFocusEffect } from "@react-navigation/native";
import { theme, healthColors } from "../../theme";
import { getScreenPadding, getSafeAreaEdges } from "../../utils/responsive";
import { logoutUser } from "../../store/slices/authSlice";
import { showConfirmation, logError } from "../../utils/errorHandler";
import { doctorService } from "../../services";
import { useDoctorAppointments } from "../../context/DoctorAppointmentContext";
import { EmptyState, SectionHeader } from "../../components/common";
import { useDrawer } from "../../hooks/useDrawer";
import { DrawerMenu } from "../../components/layout";
import {
  DoctorHeader,
  ScheduleStatsCard,
  PatientSearchBar,
  TodayAppointmentCard,
} from "./components";

const QUICK_ACTIONS = [
  { icon: "calendar", color: healthColors.primary.main, label: "Today's\nAppointments", screen: "DoctorTabs", params: { screen: "TodaysAppointments" } },
  { icon: "people", color: healthColors.secondary.main, label: "Patient\nManagement", screen: "PatientManagement" },
  { icon: "document-text", color: healthColors.accent.coral, label: "Create\nPrescription", screen: "CreatePrescription" },
  { icon: "person-add", color: healthColors.accent.green || "#43A047", label: "Walk-in\nPatient", screen: "WalkInPatient" },
];

const DoctorHomeScreen = ({ navigation }) => {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const { menuVisible, openMenu, closeMenu, slideAnim, drawerWidth } = useDrawer();

  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState(null);
  const [schedule, setSchedule] = useState({
    totalAppointments: 0, completed: 0, pending: 0,
    nextPatient: "Loading…", nextTime: "--:--",
  });
  const [todaysAppointments, setTodaysAppointments] = useState([]);

  const { refreshCount } = useDoctorAppointments();

  // ── Data fetching ──
  const fetchDashboardData = useCallback(async () => {
    try {
      setError(null);
      const response = await doctorService.getDashboard();
      if (response?.success) {
        setSchedule({
          totalAppointments: response.data.schedule?.totalAppointments || 0,
          completed: response.data.schedule?.completed || 0,
          pending: response.data.schedule?.pending || 0,
          nextPatient: response.data.schedule?.nextPatient || "No upcoming patients",
          nextTime: response.data.schedule?.nextTime || "--:--",
        });
        setTodaysAppointments(response.data.todaysAppointments || []);
      }
    } catch (err) {
      logError(err, { context: "DoctorHomeScreen.fetchDashboardData" });
      setError("Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchDashboardData(); }, [fetchDashboardData]);

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
  const handleLogout = useCallback(() => {
    showConfirmation("Are you sure you want to logout?", () => dispatch(logoutUser()), () => {}, "Logout");
  }, [dispatch]);

  const handleStartConsultation = useCallback(async (appointment) => {
    try {
      const id = appointment._id || appointment.id;
      if (!id) { Alert.alert("Error", "Invalid appointment ID"); return; }
      await doctorService.updateAppointmentStatus(id, "in_progress");
      fetchDashboardData();
      refreshCount();
      navigation.navigate("Consultation", { appointment });
    } catch (err) {
      logError(err, { context: "DoctorHomeScreen.startConsultation" });
      Alert.alert("Error", "Failed to start consultation. Please try again.");
    }
  }, [fetchDashboardData, refreshCount, navigation]);

  const handleViewHistory = useCallback((appointment) => {
    navigation.navigate("PatientManagement", {
      patientId: appointment.patientId,
      patientName: appointment.patientName,
    });
  }, [navigation]);

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
  const visibleAppointments = useMemo(() => (todaysAppointments || []).filter((a) => {
    const s = String(a?.status || "").toLowerCase().replace(/-/g, "_");
    return s === "scheduled" || s === "confirmed" || s === "in_progress";
  }), [todaysAppointments]);

  // ── Drawer menu ──
  const nav = (screen, params) => () => { closeMenu(); setTimeout(() => navigation.navigate(screen, params), 100); };
  const menuSections = useMemo(() => [
    {
      title: "NAVIGATION",
      items: [
        { icon: "home", iconColor: healthColors.primary.main, label: "Dashboard", onPress: nav("DoctorTabs", { screen: "Dashboard" }) },
        { icon: "calendar", iconColor: healthColors.secondary.main, label: "My Appointments", onPress: nav("DoctorTabs", { screen: "TodaysAppointments" }) },
        { icon: "people", iconColor: healthColors.accent.aqua, label: "Patient Management", onPress: nav("PatientManagement") },
        { icon: "document-text", iconColor: healthColors.accent.coral, label: "Create Prescription", onPress: nav("CreatePrescription") },
        { icon: "person-add", iconColor: healthColors.accent.green || "#43A047", label: "Walk-in Patient", onPress: nav("WalkInPatient") },
      ],
    },
    {
      title: "ACCOUNT",
      items: [
        { icon: "person", iconColor: healthColors.text.secondary, label: "My Profile", onPress: nav("DoctorTabs", { screen: "Profile" }) },
        { icon: "settings", iconColor: healthColors.text.secondary, label: "Settings", onPress: nav("Settings") },
      ],
    },
  ], [navigation, closeMenu]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Render ──
  return (
    <SafeAreaView style={styles.container} edges={getSafeAreaEdges("withTabBar")}>
      <StatusBar barStyle="light-content" backgroundColor={healthColors.primary.main} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh}
            colors={[healthColors.primary.main]} tintColor={healthColors.primary.main} />
        }
      >
        {/* Error banner */}
        {error && (
          <View style={styles.errorBanner}>
            <Ionicons name="warning" size={18} color={healthColors.error.main} />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={fetchDashboardData}>
              <Text style={styles.retryText}>Retry</Text>
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
          onNotificationPress={() => navigation.navigate("NotificationsScreen")}
          onProfilePress={() => navigation.navigate("EditProfile")}
        />

        <View style={styles.body}>
          {/* ── Schedule Stats ── */}
          <ScheduleStatsCard schedule={schedule} />

          {/* ── Patient Search ── */}
          <SectionHeader title="Patient Search" style={styles.sectionHeader} />
          <PatientSearchBar
            value={searchQuery}
            onChangeText={setSearchQuery}
            searching={searching}
            results={searchResults}
            onClear={() => { setSearchQuery(""); setSearchResults([]); }}
            onSelectPatient={(p) =>
              navigation.navigate("PatientManagement", {
                patientId: p.userId || p._id,
              })
            }
          />

          {/* ── Today's Appointments ── */}
          <SectionHeader title="Today's Appointments" style={styles.sectionHeader} />
          {visibleAppointments.length === 0 ? (
            <EmptyState
              icon="calendar-outline"
              title="No Appointments Today"
              message="You have no scheduled or confirmed appointments right now."
            />
          ) : (
            visibleAppointments.map((appt) => (
              <TodayAppointmentCard
                key={appt._id || appt.id}
                appointment={appt}
                onViewHistory={handleViewHistory}
                onStartConsultation={handleStartConsultation}
              />
            ))
          )}

          {/* ── Quick Actions ── */}
          <SectionHeader title="Quick Actions" style={styles.sectionHeader} />
          <View style={styles.quickGrid}>
            {QUICK_ACTIONS.map(({ icon, color, label, screen, params }) => (
              <TouchableOpacity
                key={label}
                style={styles.quickCard}
                onPress={() => navigation.navigate(screen, params)}
                activeOpacity={0.75}
              >
                <View style={[styles.quickIcon, { backgroundColor: color + "18" }]}>
                  <Ionicons name={icon} size={26} color={color} />
                </View>
                <Text style={styles.quickLabel}>{label}</Text>
              </TouchableOpacity>
            ))}
          </View>
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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: healthColors.background.secondary },
  body: { paddingHorizontal: getScreenPadding(), paddingTop: 20, paddingBottom: 24 },
  sectionHeader: { marginTop: 24, marginBottom: 12 },

  errorBanner: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: healthColors.error.background,
    paddingHorizontal: 16, paddingVertical: 10,
  },
  errorText: { flex: 1, fontSize: 13, color: healthColors.error.main },
  retryText: { fontSize: 13, color: healthColors.primary.main, fontWeight: "600" },

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
    width: 52, height: 52, borderRadius: 26,
    justifyContent: "center", alignItems: "center", marginBottom: 10,
  },
  quickLabel: {
    fontSize: 12, fontWeight: "700", color: healthColors.text.primary,
    textAlign: "center", lineHeight: 17,
  },
});

export default DoctorHomeScreen;
