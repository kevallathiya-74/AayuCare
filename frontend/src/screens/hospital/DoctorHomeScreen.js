/**
 * Doctor Home Screen (Screen 8)
 * Main dashboard for doctors with today's schedule and quick patient access
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
  StatusBar,
  RefreshControl,
  TextInput,
  Alert,
  ActivityIndicator,
  Modal,
  Pressable,
  Animated,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useDispatch, useSelector } from "react-redux";
import { useFocusEffect } from "@react-navigation/native";
import { healthColors } from "../../theme/healthColors";
import { indianDesign } from "../../theme/indianDesign";
import {
  getScreenPadding,
  moderateScale,
  verticalScale,
  scaledFontSize,
} from "../../utils/responsive";
import Avatar from "../../components/common/Avatar";
import LanguageSelector from "../../components/common/LanguageSelector";
import { logoutUser } from "../../store/slices/authSlice";
import { showConfirmation, logError } from "../../utils/errorHandler";
import { doctorService } from "../../services";
import { useDoctorAppointments } from "../../context/DoctorAppointmentContext";

const { width } = Dimensions.get("window");

const DoctorHomeScreen = ({ navigation }) => {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState(null);
  const [menuVisible, setMenuVisible] = useState(false);
  const slideAnim = useRef(new Animated.Value(-width * 0.8)).current;

  const [schedule, setSchedule] = useState({
    totalAppointments: 0,
    completed: 0,
    pending: 0,
    nextPatient: "Loading...",
    nextTime: "--:--",
  });

  const [todaysAppointments, setTodaysAppointments] = useState([]);

  // Calculate notification count from pending appointments
  const notificationCount = schedule.pending || 0;

  const fetchDashboardData = useCallback(async () => {
    try {
      setError(null);
      const response = await doctorService.getDashboard();

      if (response?.success) {
        setSchedule(response.data.schedule);
        setTodaysAppointments(response.data.todaysAppointments || []);
      }
    } catch (err) {
      logError(err, { context: "DoctorHomeScreen.fetchDashboardData" });
      setError("Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Get refreshCount from context to sync tab badge
  const { refreshCount } = useDoctorAppointments();

  // Refresh data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchDashboardData();
      refreshCount();
    }, [fetchDashboardData, refreshCount])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchDashboardData();
    refreshCount(); // Also refresh tab badge count
    setRefreshing(false);
  }, [fetchDashboardData, refreshCount]);

  // Real-time search with debouncing (triggers after 1 character)
  useEffect(() => {
    const delaySearch = setTimeout(async () => {
      if (searchQuery.trim().length >= 1) {
        setSearching(true);
        try {
          const response = await doctorService.searchMyPatients(
            searchQuery.trim()
          );
          setSearchResults(response?.data || []);
        } catch (err) {
          logError(err, { context: "DoctorHomeScreen.realtimeSearch" });
          setSearchResults([]);
        } finally {
          setSearching(false);
        }
      } else {
        setSearchResults([]);
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(delaySearch);
  }, [searchQuery]);

  // Menu animation handlers
  useEffect(() => {
    if (menuVisible) {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: -width * 0.8,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [menuVisible, slideAnim]);

  const closeMenu = useCallback(() => {
    setMenuVisible(false);
  }, []);

  const handleLogout = useCallback(() => {
    showConfirmation(
      "Are you sure you want to logout?",
      () => dispatch(logoutUser()),
      () => {},
      "Logout"
    );
  }, [dispatch]);

  const handleStartConsultation = useCallback(
    async (appointment) => {
      try {
        const appointmentId = appointment._id || appointment.id;
        const patientName =
          appointment.patientName || appointment.patient?.name || "Patient";

        await doctorService.updateAppointmentStatus(
          appointmentId,
          "in-progress"
        );
        Alert.alert(
          "Consultation Started",
          `Starting consultation with ${patientName}`
        );
        fetchDashboardData();
        refreshCount(); // Sync tab badge count after status change
      } catch (err) {
        logError(err, { context: "DoctorHomeScreen.handleStartConsultation" });
        Alert.alert("Error", "Failed to start consultation");
      }
    },
    [fetchDashboardData, refreshCount]
  );

  const getGreeting = useCallback(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return "Good Morning";
    if (hour >= 12 && hour < 17) return "Good Afternoon";
    if (hour >= 17 && hour < 21) return "Good Evening";
    return "Good Night";
  }, []);

  const getGreetingIcon = useCallback(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return "sunny"; // Morning sun
    if (hour >= 12 && hour < 17) return "partly-sunny"; // Afternoon
    if (hour >= 17 && hour < 21) return "moon"; // Evening moon
    return "moon-outline"; // Night
  }, []);

  const getStatusColor = useCallback((status) => {
    switch (status) {
      case "completed":
        return healthColors.success.main || healthColors.success;
      case "in-progress":
        return healthColors.info.main || healthColors.info;
      case "cancelled":
      case "no-show":
        return healthColors.error.main || healthColors.error;
      default:
        return healthColors.warning.main || healthColors.warning;
    }
  }, []);

  const getStatusLabel = useCallback((status) => {
    switch (status) {
      case "completed":
        return "Completed";
      case "in-progress":
        return "In Progress";
      case "cancelled":
        return "Cancelled";
      case "no-show":
        return "No Show";
      case "confirmed":
        return "Confirmed";
      default:
        return "Pending";
    }
  }, []);

  if (loading) {
    return (
      <SafeAreaView
        style={styles.container}
        edges={["top", "left", "right", "bottom"]}
      >
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={healthColors.primary.main} />
          <Text style={styles.loadingText}>Loading dashboard...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={styles.container}
      edges={["top", "left", "right", "bottom"]}
    >
      <StatusBar
        barStyle="dark-content"
        backgroundColor={healthColors.background.main}
      />

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
        {error && (
          <View style={styles.errorBanner}>
            <Ionicons
              name="warning"
              size={20}
              color={healthColors.error.main}
            />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={fetchDashboardData}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Enhanced Welcome Banner */}
        <LinearGradient
          colors={[healthColors.primary.main, healthColors.primary.dark]}
          style={styles.welcomeBanner}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          {/* Top Icons Row */}
          <View style={styles.bannerTopRow}>
            <TouchableOpacity
              style={styles.bannerIconButton}
              onPress={() => setMenuVisible(true)}
              accessibilityRole="button"
              accessibilityLabel="Open menu"
            >
              <Ionicons name="menu" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <View style={styles.bannerRightIcons}>
              <TouchableOpacity
                style={styles.bannerIconButton}
                onPress={() =>
                  Alert.alert(
                    "Notifications",
                    notificationCount > 0
                      ? `You have ${notificationCount} pending appointment${notificationCount > 1 ? "s" : ""}`
                      : "No pending appointments"
                  )
                }
                accessibilityRole="button"
                accessibilityLabel={
                  notificationCount > 0
                    ? `${notificationCount} pending appointments`
                    : "No notifications"
                }
              >
                <Ionicons name="notifications" size={24} color="#FFFFFF" />
                {notificationCount > 0 && (
                  <View style={styles.bannerNotificationBadge}>
                    <Text style={styles.bannerNotificationBadgeText}>
                      {notificationCount}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
              <LanguageSelector compact iconColor="#FFFFFF" />
              <TouchableOpacity
                style={styles.bannerIconButton}
                onPress={() => navigation.navigate("Profile")}
                accessibilityRole="button"
                accessibilityLabel="View profile"
              >
                <Ionicons name="person" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Greeting Section */}
          <View style={styles.bannerGreeting}>
            <View style={styles.greetingRow}>
              <Ionicons
                name={getGreetingIcon()}
                size={28}
                color="#FFFFFF"
                style={styles.greetingIcon}
              />
              <View>
                <Text style={styles.bannerTimeGreeting}>{getGreeting()}</Text>
                <Text style={styles.bannerWelcomeText}>
                  {user?.name || "Doctor"}
                </Text>
              </View>
            </View>
            <View style={styles.bannerInfoCard}>
              <View style={styles.bannerInfoRow}>
                <Ionicons name="medical" size={16} color="#FFFFFF" />
                <Text style={styles.bannerInfoText}>
                  {user?.specialization || "General Physician"}
                </Text>
              </View>
              <View style={styles.bannerInfoRow}>
                <Ionicons name="business" size={16} color="#FFFFFF" />
                <Text style={styles.bannerInfoText}>
                  {user?.department || "OPD"}
                </Text>
              </View>
            </View>
          </View>
        </LinearGradient>

        {/* Today's Schedule */}
        <View style={styles.section}>
          <View style={styles.scheduleCard}>
            <View style={styles.scheduleHeader}>
              <Ionicons
                name="calendar-outline"
                size={22}
                color={healthColors.primary.main}
              />
              <Text style={styles.scheduleTitle}>TODAY'S SCHEDULE</Text>
            </View>
            <View style={styles.divider} />

            <View style={styles.scheduleStats}>
              <View style={styles.scheduleStat}>
                <View style={styles.scheduleIconCircle}>
                  <Ionicons
                    name="calendar-number-outline"
                    size={28}
                    color={healthColors.primary.main}
                  />
                </View>
                <Text style={styles.scheduleStatValue}>
                  {schedule.totalAppointments}
                </Text>
                <Text style={styles.scheduleStatLabel}>Appointments</Text>
              </View>
              <View style={styles.scheduleStat}>
                <View style={styles.scheduleIconCircle}>
                  <Ionicons
                    name="time-outline"
                    size={28}
                    color={healthColors.info.main}
                  />
                </View>
                <Text style={styles.scheduleStatValue}>
                  {schedule.nextTime}
                </Text>
                <Text style={styles.scheduleStatLabel}>Next Patient</Text>
              </View>
            </View>

            <View style={styles.progressContainer}>
              <View style={styles.progressRow}>
                <View style={styles.progressItem}>
                  <Ionicons
                    name="checkmark-circle"
                    size={16}
                    color={healthColors.success.main}
                  />
                  <Text style={styles.progressLabel}>
                    Completed: {schedule.completed}
                  </Text>
                </View>
                <View style={styles.progressItem}>
                  <Ionicons
                    name="hourglass-outline"
                    size={16}
                    color={healthColors.warning.main}
                  />
                  <Text style={styles.progressLabel}>
                    Pending: {schedule.pending}
                  </Text>
                </View>
              </View>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width:
                        schedule.totalAppointments > 0
                          ? `${(schedule.completed / schedule.totalAppointments) * 100}%`
                          : "0%",
                    },
                  ]}
                />
              </View>
            </View>

            <View style={styles.nextPatientCard}>
              <Text style={styles.nextPatientLabel}>Next Patient:</Text>
              <Text style={styles.nextPatientName}>{schedule.nextPatient}</Text>
            </View>
          </View>
        </View>

        {/* Quick Patient Search */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>QUICK PATIENT SEARCH:</Text>
          <View style={styles.searchContainer}>
            <Ionicons
              name="search"
              size={20}
              color={healthColors.text.secondary}
              style={styles.searchIcon}
            />
            <TextInput
              style={styles.searchInput}
              placeholder="Enter patient name..."
              placeholderTextColor={healthColors.text.secondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
              accessibilityLabel="Search patients by name"
              accessibilityHint="Type patient name to search"
            />
            {searching && (
              <ActivityIndicator
                size="small"
                color={healthColors.primary.main}
              />
            )}
            {searchQuery.length > 0 && !searching && (
              <TouchableOpacity
                onPress={() => {
                  setSearchQuery("");
                  setSearchResults([]);
                }}
                accessibilityRole="button"
                accessibilityLabel="Clear search"
              >
                <Ionicons
                  name="close-circle"
                  size={20}
                  color={healthColors.text.secondary}
                />
              </TouchableOpacity>
            )}
          </View>
          {searchResults.length > 0 && (
            <View style={styles.searchResultsContainer}>
              {searchResults.map((patient) => (
                <TouchableOpacity
                  key={patient._id || patient.id}
                  style={styles.searchResultItem}
                  onPress={() =>
                    navigation.navigate("PatientManagement", {
                      patientId: patient.userId || patient._id,
                    })
                  }
                  accessibilityRole="button"
                  accessibilityLabel={`View ${patient.name}, ${patient.age || "Unknown age"} years old`}
                >
                  <View style={styles.searchResultInfo}>
                    <Text style={styles.searchResultName}>
                      {patient.name || "Unknown Patient"}
                    </Text>
                    <Text style={styles.searchResultDetails}>
                      {patient.age ? `Age: ${patient.age} | ` : ""}ID:{" "}
                      {patient.userId || patient._id?.slice(-6)}
                    </Text>
                  </View>
                  <Ionicons
                    name="chevron-forward"
                    size={20}
                    color={healthColors.text.secondary}
                  />
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Today's Appointments */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>TODAY'S APPOINTMENTS:</Text>
          {todaysAppointments.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons
                name="calendar-outline"
                size={48}
                color={healthColors.text.secondary}
              />
              <Text style={styles.emptyStateText}>
                No appointments scheduled for today
              </Text>
            </View>
          ) : (
            todaysAppointments.map((appointment) => (
              <View
                key={appointment.id}
                style={styles.appointmentCard}
                accessible={true}
                accessibilityLabel={`Appointment with ${appointment.patientName} at ${appointment.time}, Status: ${getStatusLabel(appointment.status)}`}
              >
                <View style={styles.appointmentHeader}>
                  <View style={styles.appointmentTime}>
                    <Ionicons
                      name="time-outline"
                      size={16}
                      color={healthColors.primary.main}
                    />
                    <Text style={styles.appointmentTimeText}>
                      {appointment.time}
                    </Text>
                  </View>
                  <View style={styles.appointmentTypeBadge}>
                    <Ionicons
                      name={
                        appointment.type === "telemedicine"
                          ? "videocam"
                          : "medical"
                      }
                      size={14}
                      color={
                        appointment.type === "telemedicine"
                          ? healthColors.info.main
                          : healthColors.primary.main
                      }
                    />
                  </View>
                </View>

                <View style={styles.appointmentPatientRow}>
                  <Text style={styles.appointmentPatient}>
                    {appointment.patientName}
                  </Text>
                  <View
                    style={[
                      styles.statusBadge,
                      {
                        backgroundColor:
                          getStatusColor(appointment.status) + "20",
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusText,
                        { color: getStatusColor(appointment.status) },
                      ]}
                    >
                      {getStatusLabel(appointment.status)}
                    </Text>
                  </View>
                </View>
                <Text style={styles.appointmentReason}>
                  ID: {appointment.patientId} | Age: {appointment.age} |{" "}
                  {appointment.reason}
                </Text>

                <View style={styles.appointmentActions}>
                  <TouchableOpacity
                    style={styles.actionButtonSecondary}
                    onPress={() =>
                      navigation.navigate("PatientManagement", {
                        patientId: appointment.patientId,
                      })
                    }
                    accessibilityRole="button"
                    accessibilityLabel={`View history for ${appointment.patientName}`}
                  >
                    <Text style={styles.actionButtonSecondaryText}>
                      View History
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.actionButtonPrimary}
                    onPress={() => handleStartConsultation(appointment)}
                    accessibilityRole="button"
                    accessibilityLabel={`Start consultation with ${appointment.patientName}`}
                  >
                    <Text style={styles.actionButtonPrimaryText}>
                      Start Consultation
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>QUICK ACTIONS:</Text>
          <View style={styles.quickActionsGrid}>
            <TouchableOpacity
              style={styles.quickActionCard}
              onPress={() =>
                navigation.navigate("DoctorTabs", {
                  screen: "TodaysAppointments",
                })
              }
              accessibilityRole="button"
              accessibilityLabel="View today's appointments"
            >
              <View
                style={[
                  styles.quickActionIcon,
                  { backgroundColor: healthColors.primary.main + "15" },
                ]}
              >
                <Ionicons
                  name="calendar"
                  size={28}
                  color={healthColors.primary.main}
                />
              </View>
              <Text style={styles.quickActionTitle}>
                Today's{"\n"}Appointments
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickActionCard}
              onPress={() => navigation.navigate("PatientManagement")}
              accessibilityRole="button"
              accessibilityLabel="Manage patients"
            >
              <View
                style={[
                  styles.quickActionIcon,
                  { backgroundColor: healthColors.secondary.main + "15" },
                ]}
              >
                <Ionicons
                  name="people"
                  size={28}
                  color={healthColors.secondary.main}
                />
              </View>
              <Text style={styles.quickActionTitle}>
                Patient{"\n"}Management
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickActionCard}
              onPress={() => navigation.navigate("CreatePrescription")}
              accessibilityRole="button"
              accessibilityLabel="Create prescription"
            >
              <View
                style={[
                  styles.quickActionIcon,
                  { backgroundColor: healthColors.accent.coral + "15" },
                ]}
              >
                <Ionicons
                  name="document-text"
                  size={28}
                  color={healthColors.accent.coral}
                />
              </View>
              <Text style={styles.quickActionTitle}>
                Create{"\n"}Prescription
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickActionCard}
              onPress={() => navigation.navigate("WalkInPatient")}
              accessibilityRole="button"
              accessibilityLabel="Add walk-in patient"
            >
              <View
                style={[
                  styles.quickActionIcon,
                  { backgroundColor: healthColors.accent.green + "15" },
                ]}
              >
                <Ionicons
                  name="person-add"
                  size={28}
                  color={healthColors.accent.green}
                />
              </View>
              <Text style={styles.quickActionTitle}>Walk-in{"\n"}Patient</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ height: verticalScale(20) }} />
      </ScrollView>

      {/* Side Menu Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={menuVisible}
        onRequestClose={closeMenu}
      >
        <Pressable style={styles.menuOverlay} onPress={closeMenu}>
          <Animated.View
            style={[
              styles.menuDrawer,
              {
                transform: [{ translateX: slideAnim }],
              },
            ]}
            onStartShouldSetResponder={() => true}
          >
            <LinearGradient
              colors={[healthColors.primary.main, healthColors.primary.dark]}
              style={styles.menuHeader}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.menuHeaderContent}>
                <View style={styles.menuProfileSection}>
                  <View style={styles.menuAvatar}>
                    <Ionicons name="person" size={32} color="#FFFFFF" />
                  </View>
                  <View style={styles.menuUserInfo}>
                    <Text style={styles.menuUserName}>
                      {user?.name || "Doctor"}
                    </Text>
                    <Text style={styles.menuUserRole}>
                      {user?.specialization || "General Physician"}
                    </Text>
                    <Text style={styles.menuUserId}>
                      ID: {user?.userId || "DOC001"}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.menuCloseButton}
                  onPress={closeMenu}
                >
                  <Ionicons name="close" size={28} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            </LinearGradient>

            <ScrollView
              style={styles.menuContent}
              showsVerticalScrollIndicator={false}
            >
              {/* Navigation Items */}
              <View style={styles.menuSection}>
                <Text style={styles.menuSectionTitle}>NAVIGATION</Text>

                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => {
                    closeMenu();
                    setTimeout(() => {
                      navigation.navigate("DoctorTabs", {
                        screen: "Dashboard",
                      });
                    }, 100);
                  }}
                >
                  <Ionicons
                    name="home"
                    size={22}
                    color={healthColors.primary.main}
                  />
                  <Text style={styles.menuItemText}>Dashboard</Text>
                  <Ionicons
                    name="chevron-forward"
                    size={18}
                    color={healthColors.text.tertiary}
                  />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => {
                    closeMenu();
                    setTimeout(() => {
                      navigation.navigate("DoctorTabs", {
                        screen: "TodaysAppointments",
                      });
                    }, 100);
                  }}
                >
                  <Ionicons
                    name="calendar"
                    size={22}
                    color={healthColors.secondary.main}
                  />
                  <Text style={styles.menuItemText}>My Appointments</Text>
                  {schedule.pending > 0 && (
                    <View style={styles.menuBadge}>
                      <Text style={styles.menuBadgeText}>
                        {schedule.pending}
                      </Text>
                    </View>
                  )}
                  <Ionicons
                    name="chevron-forward"
                    size={18}
                    color={healthColors.text.tertiary}
                  />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => {
                    closeMenu();
                    setTimeout(() => {
                      navigation.navigate("PatientManagement");
                    }, 100);
                  }}
                >
                  <Ionicons
                    name="people"
                    size={22}
                    color={healthColors.accent.aqua}
                  />
                  <Text style={styles.menuItemText}>Patient Management</Text>
                  <Ionicons
                    name="chevron-forward"
                    size={18}
                    color={healthColors.text.tertiary}
                  />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => {
                    setMenuVisible(false);
                    navigation.navigate("CreatePrescription");
                  }}
                >
                  <Ionicons
                    name="document-text"
                    size={22}
                    color={healthColors.accent.coral}
                  />
                  <Text style={styles.menuItemText}>Create Prescription</Text>
                  <Ionicons
                    name="chevron-forward"
                    size={18}
                    color={healthColors.text.tertiary}
                  />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => {
                    setMenuVisible(false);
                    navigation.navigate("WalkInPatient");
                  }}
                >
                  <Ionicons
                    name="person-add"
                    size={22}
                    color={healthColors.accent.green}
                  />
                  <Text style={styles.menuItemText}>Add Walk-in Patient</Text>
                  <Ionicons
                    name="chevron-forward"
                    size={18}
                    color={healthColors.text.tertiary}
                  />
                </TouchableOpacity>
              </View>

              {/* Quick Stats */}
              <View style={styles.menuSection}>
                <Text style={styles.menuSectionTitle}>TODAY'S STATS</Text>
                <View style={styles.menuStatsGrid}>
                  <View style={styles.menuStatCard}>
                    <Text style={styles.menuStatValue}>
                      {schedule.totalAppointments}
                    </Text>
                    <Text style={styles.menuStatLabel}>Appointments</Text>
                  </View>
                  <View style={styles.menuStatCard}>
                    <Text style={styles.menuStatValue}>
                      {schedule.completed}
                    </Text>
                    <Text style={styles.menuStatLabel}>Completed</Text>
                  </View>
                  <View style={styles.menuStatCard}>
                    <Text style={styles.menuStatValue}>{schedule.pending}</Text>
                    <Text style={styles.menuStatLabel}>Pending</Text>
                  </View>
                </View>
              </View>

              {/* Settings & Account */}
              <View style={styles.menuSection}>
                <Text style={styles.menuSectionTitle}>ACCOUNT</Text>

                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => {
                    closeMenu();
                    setTimeout(() => {
                      navigation.navigate("Settings");
                    }, 100);
                  }}
                >
                  <Ionicons
                    name="settings"
                    size={22}
                    color={healthColors.text.secondary}
                  />
                  <Text style={styles.menuItemText}>Settings</Text>
                  <Ionicons
                    name="chevron-forward"
                    size={18}
                    color={healthColors.text.tertiary}
                  />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => {
                    closeMenu();
                    setTimeout(() => {
                      Alert.alert(
                        "Help & Support",
                        "Contact: support@aayucare.com\nPhone: 1800-XXX-XXXX"
                      );
                    }, 100);
                  }}
                >
                  <Ionicons
                    name="help-circle"
                    size={22}
                    color={healthColors.info.main}
                  />
                  <Text style={styles.menuItemText}>Help & Support</Text>
                  <Ionicons
                    name="chevron-forward"
                    size={18}
                    color={healthColors.text.tertiary}
                  />
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.menuItem, styles.menuItemDanger]}
                  onPress={() => {
                    closeMenu();
                    setTimeout(() => {
                      handleLogout();
                    }, 100);
                  }}
                >
                  <Ionicons
                    name="log-out"
                    size={22}
                    color={healthColors.error.main}
                  />
                  <Text
                    style={[styles.menuItemText, styles.menuItemTextDanger]}
                  >
                    Logout
                  </Text>
                  <Ionicons
                    name="chevron-forward"
                    size={18}
                    color={healthColors.error.main}
                  />
                </TouchableOpacity>
              </View>

              <View style={styles.menuFooter}>
                <Text style={styles.menuFooterText}>
                  AayuCare Doctor v1.0.0
                </Text>
                <Text style={styles.menuFooterText}>
                  © 2025 AayuCare Hospital
                </Text>
              </View>
            </ScrollView>
          </Animated.View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: healthColors.background.main,
  },
  welcomeBanner: {
    paddingTop: moderateScale(12),
    paddingBottom: moderateScale(20),
    borderBottomLeftRadius: moderateScale(24),
    borderBottomRightRadius: moderateScale(24),
    borderWidth: 2,
    borderColor: healthColors.border.light,
  },
  bannerTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: getScreenPadding(),
    marginBottom: moderateScale(16),
  },
  bannerRightIcons: {
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(8),
  },
  bannerIconButton: {
    padding: moderateScale(8),
    position: "relative",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: moderateScale(20),
    width: moderateScale(40),
    height: moderateScale(40),
    justifyContent: "center",
    alignItems: "center",
  },
  bannerNotificationBadge: {
    position: "absolute",
    top: moderateScale(2),
    right: moderateScale(2),
    backgroundColor: healthColors.error.main,
    borderRadius: moderateScale(10),
    minWidth: moderateScale(18),
    height: moderateScale(18),
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: moderateScale(4),
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  bannerNotificationBadgeText: {
    fontSize: scaledFontSize(10),
    fontWeight: "700",
    color: "#FFFFFF",
  },
  bannerGreeting: {
    paddingHorizontal: getScreenPadding(),
  },
  greetingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: moderateScale(12),
  },
  greetingIcon: {
    marginRight: moderateScale(12),
  },
  bannerTimeGreeting: {
    fontSize: scaledFontSize(14),
    fontWeight: "500",
    color: "rgba(255, 255, 255, 0.9)",
    marginBottom: moderateScale(2),
    letterSpacing: 0.5,
  },
  bannerWelcomeText: {
    fontSize: scaledFontSize(24),
    fontWeight: "700",
    color: "#FFFFFF",
  },
  bannerInfoCard: {
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    borderRadius: moderateScale(12),
    padding: moderateScale(12),
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  bannerInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: moderateScale(6),
  },
  bannerInfoText: {
    fontSize: scaledFontSize(14),
    color: "#FFFFFF",
    marginLeft: moderateScale(8),
    fontWeight: "500",
  },
  section: {
    paddingHorizontal: getScreenPadding(),
    marginTop: verticalScale(16),
  },
  sectionTitle: {
    fontSize: scaledFontSize(14),
    fontWeight: "700",
    color: healthColors.text.primary,
    letterSpacing: 0.5,
    marginBottom: moderateScale(12),
  },
  scheduleCard: {
    backgroundColor: healthColors.background.card,
    borderRadius: moderateScale(12),
    padding: moderateScale(16),
    borderWidth: 2,
    borderColor: healthColors.border.light,
  },
  scheduleHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(8),
  },
  scheduleTitle: {
    fontSize: scaledFontSize(14),
    fontWeight: "700",
    color: healthColors.text.primary,
    letterSpacing: 0.5,
  },
  divider: {
    height: 1,
    backgroundColor: healthColors.border.light,
    marginVertical: moderateScale(12),
  },
  scheduleStats: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: moderateScale(16),
  },
  scheduleStat: {
    alignItems: "center",
  },
  scheduleIconCircle: {
    width: moderateScale(56),
    height: moderateScale(56),
    borderRadius: moderateScale(28),
    backgroundColor: healthColors.primary.main + "15",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: moderateScale(8),
  },
  scheduleStatValue: {
    fontSize: scaledFontSize(20),
    fontWeight: "700",
    color: healthColors.text.primary,
    marginTop: moderateScale(4),
  },
  scheduleStatLabel: {
    fontSize: scaledFontSize(12),
    color: healthColors.text.secondary,
    marginTop: moderateScale(4),
  },
  progressContainer: {
    marginBottom: moderateScale(16),
  },
  progressRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: moderateScale(8),
  },
  progressItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(6),
  },
  progressLabel: {
    fontSize: scaledFontSize(12),
    color: healthColors.text.secondary,
    fontWeight: "600",
  },
  progressBar: {
    height: moderateScale(8),
    backgroundColor: healthColors.border.light,
    borderRadius: moderateScale(4),
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: healthColors.success,
    borderRadius: moderateScale(4),
  },
  nextPatientCard: {
    backgroundColor: healthColors.primary.main + "10",
    padding: moderateScale(12),
    borderRadius: moderateScale(8),
    borderLeftWidth: 3,
    borderLeftColor: healthColors.primary.main,
  },
  nextPatientLabel: {
    fontSize: scaledFontSize(12),
    color: healthColors.text.secondary,
    marginBottom: moderateScale(4),
  },
  nextPatientName: {
    fontSize: scaledFontSize(16),
    fontWeight: "700",
    color: healthColors.primary.main,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: healthColors.background.card,
    borderRadius: moderateScale(12),
    paddingHorizontal: moderateScale(16),
    paddingVertical: moderateScale(12),
    borderWidth: 2,
    borderColor: healthColors.border.light,
  },
  searchIcon: {
    marginRight: moderateScale(8),
  },
  searchInput: {
    flex: 1,
    fontSize: scaledFontSize(14),
    color: healthColors.text.primary,
  },
  searchResultsContainer: {
    backgroundColor: healthColors.background.card,
    borderRadius: moderateScale(12),
    marginTop: moderateScale(8),
    borderWidth: 2,
    borderColor: healthColors.border.light,
  },
  searchResultItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: moderateScale(12),
    borderBottomWidth: 1,
    borderBottomColor: healthColors.border.light,
  },
  searchResultInfo: {
    flex: 1,
  },
  searchResultName: {
    fontSize: scaledFontSize(14),
    fontWeight: "600",
    color: healthColors.text.primary,
  },
  searchResultDetails: {
    fontSize: scaledFontSize(12),
    color: healthColors.text.secondary,
    marginTop: moderateScale(2),
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    padding: moderateScale(32),
    backgroundColor: healthColors.background.card,
    borderRadius: moderateScale(12),
    borderWidth: 2,
    borderColor: healthColors.border.light,
  },
  emptyStateText: {
    fontSize: scaledFontSize(14),
    color: healthColors.text.secondary,
    marginTop: moderateScale(12),
    textAlign: "center",
  },
  appointmentCard: {
    backgroundColor: healthColors.background.card,
    borderRadius: moderateScale(12),
    padding: moderateScale(16),
    marginBottom: moderateScale(12),
    borderLeftWidth: 4,
    borderLeftColor: healthColors.primary.main,
    borderWidth: 2,
    borderColor: healthColors.border.light,
  },
  appointmentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: moderateScale(12),
  },
  appointmentTime: {
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(4),
  },
  appointmentTimeText: {
    fontSize: scaledFontSize(14),
    fontWeight: "700",
    color: healthColors.text.primary,
  },
  appointmentTypeBadge: {
    padding: moderateScale(6),
    borderRadius: moderateScale(8),
    backgroundColor: healthColors.background.main,
  },
  appointmentPatientRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: moderateScale(4),
  },
  statusBadge: {
    paddingHorizontal: moderateScale(8),
    paddingVertical: moderateScale(4),
    borderRadius: moderateScale(6),
  },
  statusText: {
    fontSize: scaledFontSize(11),
    fontWeight: "600",
  },
  appointmentPatient: {
    fontSize: scaledFontSize(16),
    fontWeight: "700",
    color: healthColors.text.primary,
  },
  appointmentReason: {
    fontSize: scaledFontSize(13),
    color: healthColors.text.secondary,
    marginBottom: moderateScale(12),
  },
  appointmentActions: {
    flexDirection: "row",
    gap: moderateScale(12),
  },
  actionButtonSecondary: {
    flex: 1,
    paddingVertical: moderateScale(10),
    borderRadius: moderateScale(8),
    backgroundColor: healthColors.background.main,
    borderWidth: 1,
    borderColor: healthColors.primary.main,
    alignItems: "center",
  },
  actionButtonSecondaryText: {
    fontSize: scaledFontSize(13),
    fontWeight: "600",
    color: healthColors.primary.main,
  },
  actionButtonPrimary: {
    flex: 1,
    paddingVertical: moderateScale(10),
    borderRadius: moderateScale(8),
    backgroundColor: healthColors.primary.main,
    alignItems: "center",
  },
  actionButtonPrimaryText: {
    fontSize: scaledFontSize(13),
    fontWeight: "600",
    color: healthColors.background.card,
  },
  addWalkinButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: healthColors.background.card,
    padding: moderateScale(16),
    borderRadius: moderateScale(12),
    borderWidth: 2,
    borderColor: healthColors.primary.main,
    borderStyle: "dashed",
  },
  addWalkinText: {
    fontSize: scaledFontSize(15),
    fontWeight: "600",
    color: healthColors.primary.main,
    marginLeft: moderateScale(8),
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: moderateScale(12),
  },
  loadingText: {
    fontSize: scaledFontSize(14),
    color: healthColors.text.secondary,
    fontWeight: "500",
  },
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: healthColors.error.main + "15",
    marginHorizontal: getScreenPadding(),
    marginTop: moderateScale(12),
    padding: moderateScale(12),
    borderRadius: moderateScale(8),
    borderLeftWidth: 3,
    borderLeftColor: healthColors.error.main,
    gap: moderateScale(8),
  },
  errorText: {
    flex: 1,
    fontSize: scaledFontSize(13),
    color: healthColors.error.main,
    fontWeight: "500",
  },
  retryText: {
    fontSize: scaledFontSize(13),
    color: healthColors.primary.main,
    fontWeight: "600",
  },
  quickActionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: moderateScale(12),
    justifyContent: "space-between",
  },
  quickActionCard: {
    width: "48%",
    backgroundColor: healthColors.background.card,
    borderRadius: moderateScale(12),
    padding: moderateScale(16),
    alignItems: "center",
    borderWidth: 2,
    borderColor: healthColors.border.light,
    minHeight: moderateScale(110),
    justifyContent: "center",
  },
  quickActionIcon: {
    width: moderateScale(56),
    height: moderateScale(56),
    borderRadius: moderateScale(28),
    alignItems: "center",
    justifyContent: "center",
    marginBottom: moderateScale(12),
  },
  quickActionTitle: {
    fontSize: scaledFontSize(13),
    fontWeight: "600",
    color: healthColors.text.primary,
    textAlign: "center",
    lineHeight: scaledFontSize(16),
  },
  // Menu Drawer Styles
  menuOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-start",
  },
  menuDrawer: {
    width: "80%",
    maxWidth: moderateScale(320),
    height: "100%",
    backgroundColor: healthColors.background.card,
    borderWidth: 2,
    borderColor: healthColors.border.light,
  },
  menuHeader: {
    paddingTop: moderateScale(50),
    paddingBottom: moderateScale(20),
    paddingHorizontal: moderateScale(16),
  },
  menuHeaderContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  menuProfileSection: {
    flex: 1,
    flexDirection: "row",
    gap: moderateScale(12),
  },
  menuAvatar: {
    width: moderateScale(56),
    height: moderateScale(56),
    borderRadius: moderateScale(28),
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  menuUserInfo: {
    flex: 1,
    justifyContent: "center",
  },
  menuUserName: {
    fontSize: scaledFontSize(16),
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: moderateScale(2),
  },
  menuUserRole: {
    fontSize: scaledFontSize(13),
    color: "rgba(255, 255, 255, 0.9)",
    marginBottom: moderateScale(2),
  },
  menuUserId: {
    fontSize: scaledFontSize(11),
    color: "rgba(255, 255, 255, 0.7)",
  },
  menuCloseButton: {
    padding: moderateScale(4),
  },
  menuContent: {
    flex: 1,
  },
  menuSection: {
    paddingVertical: moderateScale(16),
    borderBottomWidth: 1,
    borderBottomColor: healthColors.border.light,
  },
  menuSectionTitle: {
    fontSize: scaledFontSize(11),
    fontWeight: "700",
    color: healthColors.text.tertiary,
    paddingHorizontal: moderateScale(16),
    marginBottom: moderateScale(8),
    letterSpacing: 0.5,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: moderateScale(12),
    paddingHorizontal: moderateScale(16),
    gap: moderateScale(12),
  },
  menuItemText: {
    flex: 1,
    fontSize: scaledFontSize(14),
    fontWeight: "500",
    color: healthColors.text.primary,
  },
  menuItemDanger: {
    backgroundColor: healthColors.error.main + "08",
  },
  menuItemTextDanger: {
    color: healthColors.error.main,
    fontWeight: "600",
  },
  menuBadge: {
    backgroundColor: healthColors.error.main,
    borderRadius: moderateScale(10),
    minWidth: moderateScale(20),
    height: moderateScale(20),
    paddingHorizontal: moderateScale(6),
    alignItems: "center",
    justifyContent: "center",
  },
  menuBadgeText: {
    fontSize: scaledFontSize(11),
    fontWeight: "700",
    color: "#FFFFFF",
  },
  menuStatsGrid: {
    flexDirection: "row",
    gap: moderateScale(12),
    paddingHorizontal: moderateScale(16),
  },
  menuStatCard: {
    flex: 1,
    backgroundColor: healthColors.primary.main + "10",
    borderRadius: moderateScale(8),
    padding: moderateScale(12),
    alignItems: "center",
    borderWidth: 1,
    borderColor: healthColors.primary.main + "20",
  },
  menuStatValue: {
    fontSize: scaledFontSize(20),
    fontWeight: "700",
    color: healthColors.primary.main,
    marginBottom: moderateScale(4),
  },
  menuStatLabel: {
    fontSize: scaledFontSize(11),
    color: healthColors.text.secondary,
    textAlign: "center",
  },
  menuFooter: {
    padding: moderateScale(16),
    alignItems: "center",
    gap: moderateScale(4),
  },
  menuFooterText: {
    fontSize: scaledFontSize(11),
    color: healthColors.text.tertiary,
  },
});

export default DoctorHomeScreen;
