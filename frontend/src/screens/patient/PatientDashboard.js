/**
 * Patient Dashboard
 * Hospital-linked patient interface
 * Clear, reassuring design with zero medical jargon
 */

import React, {
  useCallback,
  useMemo,
  useState,
  useRef,
  useEffect,
} from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Platform,
  Alert,
  Dimensions,
  ActivityIndicator,
  Modal,
  Pressable,
  Animated,
  RefreshControl,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useDispatch, useSelector } from "react-redux";
import { theme, healthColors } from "../../theme";
import CompactActionCard from "../../components/common/CompactActionCard";
import LanguageSelector from "../../components/common/LanguageSelector";
import { logoutUser } from "../../store/slices/authSlice";
import {
  getScreenPadding,
  verticalScale,
  getGridColumns,
  getSafeAreaEdges,
  getContainerWidth,
  isTablet,
} from "../../utils/responsive";
import { healthMetricsService, notificationService } from "../../services";
import { logError, showError } from "../../utils/errorHandler";

const { width } = Dimensions.get("window");

const PatientDashboard = ({ navigation }) => {
  const dispatch = useDispatch();
  const { user, loading } = useSelector((state) => state.auth);
  const [menuVisible, setMenuVisible] = useState(false);
  const [healthMetrics, setHealthMetrics] = useState(null);
  const [loadingMetrics, setLoadingMetrics] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const slideAnim = useRef(new Animated.Value(-width * 0.8)).current;
  const insets = useSafeAreaInsets();

  const fetchUnreadNotifications = useCallback(async () => {
    try {
      const response = await notificationService.getUnreadCount();
      setUnreadNotifications(response?.data?.count || 0);
    } catch (error) {
      logError(error, { context: "PatientDashboard.fetchUnreadNotifications" });
      // Silently fail - notification count is not critical
    }
  }, []);

  const fetchHealthMetrics = useCallback(async () => {
    if (!user?.userId) return;

    try {
      setLoadingMetrics(true);
      const response = await healthMetricsService.getMetrics(user.userId);
      setHealthMetrics(response.data || []);
    } catch (error) {
      logError(error, { context: "PatientDashboard.fetchHealthMetrics" });
      // Set empty array on error - don't show error to user for non-critical health metrics
      setHealthMetrics([]);
    } finally {
      setLoadingMetrics(false);
    }
  }, [user?.userId]);

  // Fetch health metrics on mount
  useEffect(() => {
    if (user?._id) {
      fetchHealthMetrics();
      fetchUnreadNotifications();
    }
  }, [user?._id, fetchHealthMetrics, fetchUnreadNotifications]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([fetchHealthMetrics(), fetchUnreadNotifications()]);
    setRefreshing(false);
  }, [fetchHealthMetrics, fetchUnreadNotifications]);

  // Get latest metric value by type
  const getLatestMetric = (type) => {
    if (!healthMetrics || !Array.isArray(healthMetrics)) return null;
    const metricsOfType = healthMetrics.filter((m) => m.type === type);
    if (metricsOfType.length === 0) return null;
    return metricsOfType.sort(
      (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
    )[0];
  };

  // Format blood pressure
  const formatBP = () => {
    const bpMetric = getLatestMetric("bp");
    if (!bpMetric?.value) return "N/A";
    return `${bpMetric.value.systolic}/${bpMetric.value.diastolic}`;
  };

  // Format blood sugar
  const formatSugar = () => {
    const sugarMetric = getLatestMetric("sugar");
    if (!sugarMetric?.value) return "N/A";
    return `${sugarMetric.value}`;
  };

  // Format temperature
  const formatTemp = () => {
    const tempMetric = getLatestMetric("temperature");
    if (!tempMetric?.value) return "N/A";
    return `${tempMetric.value}°F`;
  };

  // Get health status
  const getHealthStatus = () => {
    if (!healthMetrics || healthMetrics.length === 0) {
      return { status: "UNKNOWN", riskScore: "N/A" };
    }
    // Simple risk assessment based on latest metrics
    const bp = getLatestMetric("bp");
    const sugar = getLatestMetric("sugar");
    let riskScore = 0;

    if (bp?.value) {
      const { systolic, diastolic } = bp.value;
      if (systolic > 140 || diastolic > 90) riskScore += 30;
      else if (systolic > 130 || diastolic > 85) riskScore += 15;
    }

    if (sugar?.value) {
      if (sugar.value > 140) riskScore += 30;
      else if (sugar.value > 110) riskScore += 15;
    }

    if (riskScore < 20) return { status: "HEALTHY", riskScore };
    if (riskScore < 40) return { status: "MONITOR", riskScore };
    return { status: "CONSULT DOCTOR", riskScore };
  };

  // Get last update time
  const getLastUpdateTime = () => {
    if (!healthMetrics || healthMetrics.length === 0) return "No data";
    const latestMetric = healthMetrics.sort(
      (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
    )[0];
    const date = new Date(latestMetric.timestamp);
    const today = new Date();
    const isToday = date.toDateString() === today.toDateString();

    if (isToday) {
      return `Today ${date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })}`;
    }
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

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

  const handleLogout = useCallback(async () => {
    await dispatch(logoutUser());
  }, [dispatch]);

  const getTimeBasedGreeting = useCallback(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return "Good Morning";
    if (hour >= 12 && hour < 17) return "Good Afternoon";
    if (hour >= 17 && hour < 21) return "Good Evening";
    return "Good Night";
  }, []);

  const getGreetingIcon = useCallback(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return "sunny";
    if (hour >= 12 && hour < 17) return "partly-sunny";
    if (hour >= 17 && hour < 21) return "moon";
    return "moon-outline";
  }, []);

  const actionCards = useMemo(
    () => [
      {
        title: "Book Appointment",
        icon: "calendar-outline",
        iconColor: healthColors.primary.main,
        onPress: () => navigation.navigate("AppointmentBooking"),
        badge: "",
      },
      {
        title: "Medical Records",
        icon: "folder-open",
        iconColor: healthColors.accent.aqua,
        onPress: () => navigation.navigate("MedicalRecords"),
      },
      {
        title: "Prescriptions",
        icon: "medical",
        iconColor: healthColors.success.main,
        onPress: () => navigation.navigate("MyPrescriptions"),
      },
      {
        title: "Health Metrics",
        icon: "stats-chart",
        iconColor: theme.colors.healthcare.teal,
        onPress: () => navigation.navigate("HealthMetrics"),
      },
      {
        title: "AI Health Assistant",
        icon: "chatbubbles",
        iconColor: healthColors.secondary.main,
        onPress: () => navigation.navigate("AIHealthAssistant"),
      },
      {
        title: "AI Symptom Checker",
        icon: "fitness-outline",
        iconColor: theme.colors.error.main,
        onPress: () => navigation.navigate("AISymptomChecker"),
      },
      {
        title: "Disease Info",
        icon: "information-circle",
        iconColor: theme.colors.healthcare.purple,
        onPress: () => navigation.navigate("DiseaseInfo"),
      },
      {
        title: "Specialist Finder",
        icon: "people",
        iconColor: theme.colors.info.main,
        onPress: () => navigation.navigate("SpecialistCareFinder"),
      },
      {
        title: "Women's Health",
        icon: "flower",
        iconColor: theme.colors.healthcare.pink,
        onPress: () => navigation.navigate("WomensHealth"),
      },
      {
        title: "Hospital Events",
        icon: "calendar-outline",
        iconColor: theme.colors.warning.main,
        onPress: () => navigation.navigate("HospitalEvents"),
      },
      {
        title: "Pharmacy & Billing",
        icon: "cart",
        iconColor: theme.colors.success.main,
        onPress: () => navigation.navigate("PharmacyBilling"),
      },
      {
        title: "Activity Tracker",
        icon: "walk",
        iconColor: theme.colors.healthcare.cyan,
        onPress: () => navigation.navigate("ActivityTracker"),
      },
    ],
    [navigation]
  );

  return (
    <SafeAreaView
      style={styles.container}
      edges={getSafeAreaEdges("withTabBar")}
    >
      <StatusBar
        barStyle="dark-content"
        backgroundColor={healthColors.background.primary}
      />

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
            <Ionicons name="menu" size={24} color={theme.colors.text.white} />
          </TouchableOpacity>
          <Text style={styles.appTitle}>AayuCare</Text>
          <View style={styles.bannerRightIcons}>
            <LanguageSelector compact iconColor={theme.colors.text.white} />
            <TouchableOpacity
              style={styles.bannerIconButton}
              onPress={() => navigation.navigate("More")}
              accessibilityRole="button"
              accessibilityLabel="Notifications"
            >
              <Ionicons
                name="notifications"
                size={24}
                color={theme.colors.text.white}
              />
              {unreadNotifications > 0 && (
                <View style={styles.bannerNotificationBadge}>
                  <Text style={styles.bannerNotificationBadgeText}>
                    {unreadNotifications > 99 ? "99+" : unreadNotifications}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.bannerIconButton}
              onPress={() => navigation.navigate("Profile")}
              accessibilityRole="button"
              accessibilityLabel="Open profile"
            >
              <Ionicons
                name="person"
                size={24}
                color={theme.colors.text.white}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Patient Greeting */}
        <View style={styles.bannerGreeting}>
          {!user || loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={theme.colors.text.white} />
              <Text
                style={[styles.loadingText, { color: theme.colors.text.white }]}
              >
                Loading profile...
              </Text>
            </View>
          ) : (
            <>
              <View style={styles.greetingRow}>
                <Ionicons
                  name={getGreetingIcon()}
                  size={28}
                  color={theme.colors.text.white}
                  style={styles.greetingIcon}
                />
                <View>
                  <Text style={styles.bannerTimeGreeting}>
                    {getTimeBasedGreeting()}
                  </Text>
                  <Text style={styles.bannerWelcomeText}>{user.name}</Text>
                </View>
              </View>
              <View style={styles.bannerInfoCard}>
                <View style={styles.bannerInfoRow}>
                  <Ionicons
                    name="card-outline"
                    size={18}
                    color={theme.colors.text.white}
                  />
                  <Text style={styles.bannerInfoText}>ID: {user.userId}</Text>
                </View>
                <View style={styles.bannerInfoRow}>
                  <Ionicons
                    name="person-outline"
                    size={18}
                    color={theme.colors.text.white}
                  />
                  <Text style={styles.bannerInfoText}>
                    Age: {user.age} • Blood: {user.bloodGroup || "N/A"}
                  </Text>
                </View>
              </View>
            </>
          )}
        </View>
      </LinearGradient>

      {/* Scrollable Content */}
      <ScrollView
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
        {/* Health Status Card */}
        <View style={styles.healthStatusSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.healthStatusTitle}>HEALTH STATUS</Text>
          </View>
          {loadingMetrics ? (
            <View style={styles.healthCard}>
              <ActivityIndicator
                size="large"
                color={healthColors.primary.main}
              />
              <Text style={styles.loadingText}>Loading health data...</Text>
            </View>
          ) : (
            <View style={styles.healthCard}>
              <View style={styles.healthCardLeft}>
                <View style={styles.healthIconCircle}>
                  <Ionicons
                    name="fitness"
                    size={32}
                    color={
                      getHealthStatus().status === "HEALTHY"
                        ? healthColors.success.main
                        : getHealthStatus().status === "MONITOR"
                          ? healthColors.warning.main
                          : healthColors.error.main
                    }
                  />
                </View>
                <View style={styles.healthCardText}>
                  <Text style={styles.healthCardTitle}>
                    {getHealthStatus().status} Risk Score:{" "}
                    {getHealthStatus().riskScore}/100
                  </Text>
                  <View style={styles.healthMetrics}>
                    <View style={styles.metricItem}>
                      <Ionicons
                        name="pulse"
                        size={14}
                        color={healthColors.info.main}
                      />
                      <Text style={styles.healthCardDetail}>
                        BP: {formatBP()}
                      </Text>
                    </View>
                    <View style={styles.metricItem}>
                      <Ionicons
                        name="water"
                        size={14}
                        color={healthColors.warning.main}
                      />
                      <Text style={styles.healthCardDetail}>
                        Sugar: {formatSugar()}
                      </Text>
                    </View>
                    <View style={styles.metricItem}>
                      <Ionicons
                        name="thermometer"
                        size={14}
                        color={healthColors.error.main}
                      />
                      <Text style={styles.healthCardDetail}>
                        Temp: {formatTemp()}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.healthCardUpdateRow}>
                    <Ionicons
                      name="time-outline"
                      size={12}
                      color={healthColors.text.secondary}
                    />
                    <Text style={styles.healthCardUpdated}>
                      Last Updated: {getLastUpdateTime()}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          )}
        </View>

        {/* Main Features Section */}
        <View style={styles.mainFeaturesSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.emergencyTitle}>MAIN FEATURES</Text>
          </View>

          {/* Action Cards - 2-Column Grid matching Doctor Quick Actions */}
          <View style={styles.quickActionsGrid}>
            {actionCards.map((card, index) => (
              <CompactActionCard
                key={index}
                title={card.title}
                icon={card.icon}
                iconColor={card.iconColor}
                onPress={card.onPress}
                badge={card.badge}
              />
            ))}
          </View>
        </View>
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
                    <Ionicons
                      name="person"
                      size={32}
                      color={theme.colors.text.white}
                    />
                  </View>
                  <View style={styles.menuUserInfo}>
                    <Text style={styles.menuUserName}>
                      {user?.name || "Patient"}
                    </Text>
                    <Text style={styles.menuUserRole}>Patient Account</Text>
                    <Text style={styles.menuUserId}>
                      ID: {user?._id?.slice(-6) || "PAT001"}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.menuCloseButton}
                  onPress={closeMenu}
                >
                  <Ionicons
                    name="close"
                    size={28}
                    color={theme.colors.text.white}
                  />
                </TouchableOpacity>
              </View>
            </LinearGradient>

            <ScrollView
              style={styles.menuContent}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.menuSection}>
                <Text style={styles.menuSectionTitle}>QUICK ACCESS</Text>

                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => {
                    closeMenu();
                    setTimeout(
                      () =>
                        navigation.navigate("PatientTabs", {
                          screen: "PatientDashboard",
                        }),
                      100
                    );
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
                    setTimeout(
                      () => navigation.navigate("AppointmentBooking"),
                      100
                    );
                  }}
                >
                  <Ionicons
                    name="calendar"
                    size={22}
                    color={healthColors.primary.main}
                  />
                  <Text style={styles.menuItemText}>Book Appointment</Text>
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
                    setTimeout(
                      () => navigation.navigate("MedicalRecords"),
                      100
                    );
                  }}
                >
                  <Ionicons
                    name="folder-open"
                    size={22}
                    color={healthColors.accent.aqua}
                  />
                  <Text style={styles.menuItemText}>Medical Records</Text>
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
                    setTimeout(
                      () => navigation.navigate("MyPrescriptions"),
                      100
                    );
                  }}
                >
                  <Ionicons
                    name="medical"
                    size={22}
                    color={healthColors.success.main}
                  />
                  <Text style={styles.menuItemText}>My Prescriptions</Text>
                  <Ionicons
                    name="chevron-forward"
                    size={18}
                    color={healthColors.text.tertiary}
                  />
                </TouchableOpacity>
              </View>

              <View style={styles.menuSection}>
                <Text style={styles.menuSectionTitle}>HEALTH & WELLNESS</Text>

                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => {
                    closeMenu();
                    setTimeout(() => navigation.navigate("HealthMetrics"), 100);
                  }}
                >
                  <Ionicons
                    name="stats-chart"
                    size={22}
                    color={theme.colors.healthcare.teal}
                  />
                  <Text style={styles.menuItemText}>Health Metrics</Text>
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
                    setTimeout(
                      () => navigation.navigate("ActivityTracker"),
                      100
                    );
                  }}
                >
                  <Ionicons
                    name="walk"
                    size={22}
                    color={theme.colors.healthcare.cyan}
                  />
                  <Text style={styles.menuItemText}>Activity Tracker</Text>
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
                    setTimeout(() => navigation.navigate("DiseaseInfo"), 100);
                  }}
                >
                  <Ionicons
                    name="information-circle"
                    size={22}
                    color={healthColors.info.main}
                  />
                  <Text style={styles.menuItemText}>Disease Information</Text>
                  <Ionicons
                    name="chevron-forward"
                    size={18}
                    color={healthColors.text.tertiary}
                  />
                </TouchableOpacity>
              </View>

              <View style={styles.menuSection}>
                <Text style={styles.menuSectionTitle}>AI SERVICES</Text>

                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => {
                    closeMenu();
                    setTimeout(
                      () => navigation.navigate("AIHealthAssistant"),
                      100
                    );
                  }}
                >
                  <Ionicons
                    name="chatbubbles"
                    size={22}
                    color={healthColors.secondary.main}
                  />
                  <Text style={styles.menuItemText}>AI Health Assistant</Text>
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
                    setTimeout(
                      () => navigation.navigate("AISymptomChecker"),
                      100
                    );
                  }}
                >
                  <Ionicons
                    name="fitness-outline"
                    size={22}
                    color={theme.colors.error.main}
                  />
                  <Text style={styles.menuItemText}>AI Symptom Checker</Text>
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
                    setTimeout(
                      () => navigation.navigate("SpecialistCareFinder"),
                      100
                    );
                  }}
                >
                  <Ionicons
                    name="search"
                    size={22}
                    color={healthColors.accent.purple}
                  />
                  <Text style={styles.menuItemText}>Find Specialist</Text>
                  <Ionicons
                    name="chevron-forward"
                    size={18}
                    color={healthColors.text.tertiary}
                  />
                </TouchableOpacity>
              </View>

              <View style={styles.menuSection}>
                <Text style={styles.menuSectionTitle}>ACCOUNT</Text>

                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => {
                    closeMenu();
                    setTimeout(() => navigation.navigate("Profile"), 100);
                  }}
                >
                  <Ionicons
                    name="person"
                    size={22}
                    color={healthColors.text.secondary}
                  />
                  <Text style={styles.menuItemText}>My Profile</Text>
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
                    setTimeout(
                      () =>
                        navigation.navigate("PatientTabs", { screen: "More" }),
                      100
                    );
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
                  style={[styles.menuItem, styles.menuItemDanger]}
                  onPress={() => {
                    closeMenu();
                    setTimeout(() => handleLogout(), 100);
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
                  AayuCare Patient v1.0.0
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
    backgroundColor: healthColors.background.secondary,
  },
  welcomeBanner: {
    paddingTop: 12,
    paddingBottom: 24, // spacing.lg for better visual hierarchy
    borderBottomLeftRadius: 16, // Standard border radius
    borderBottomRightRadius: 16,
    ...theme.shadows.lg,
  },
  bannerTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: getScreenPadding(),
    marginBottom: 16, // spacing.md
  },
  bannerIconButton: {
    padding: 8,
    position: "relative",
    backgroundColor: theme.withOpacity(theme.colors.text.white, 0.2),
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  appTitle: {
    fontSize: 18,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.text.white,
  },
  bannerRightIcons: {
    flexDirection: "row",
    alignItems: "center",
  },
  bannerNotificationBadge: {
    position: "absolute",
    top: 2,
    right: 2,
    backgroundColor: healthColors.error.main,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: theme.colors.text.white,
  },
  bannerNotificationBadgeText: {
    fontSize: 10,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.text.white,
  },
  bannerGreeting: {
    paddingHorizontal: getScreenPadding(),
  },
  greetingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  greetingIcon: {
    marginRight: 12,
  },
  bannerTimeGreeting: {
    fontSize: 14,
    fontWeight: theme.typography.weights.medium,
    color: theme.withOpacity(theme.colors.text.white, 0.9),
    marginBottom: 2,
    letterSpacing: 0.5,
  },
  bannerWelcomeText: {
    fontSize: 24,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.text.white,
  },
  bannerInfoCard: {
    backgroundColor: theme.withOpacity(theme.colors.text.white, 0.15),
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: theme.withOpacity(theme.colors.text.white, 0.2),
  },
  bannerInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  bannerInfoText: {
    fontSize: 14,
    color: theme.colors.text.white,
    marginLeft: 8,
    fontWeight: theme.typography.weights.medium,
  },
  healthStatusSection: {
    paddingHorizontal: getScreenPadding(),
    marginBottom: 24, // spacing.lg for section separation
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12, // spacing.md
  },
  healthStatusTitle: {
    fontSize: 14,
    fontWeight: theme.typography.weights.bold,
    color: healthColors.text.primary,
    marginLeft: 8, // spacing.sm
  },
  healthCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: healthColors.success.background,
    padding: 16, // spacing.md
    borderRadius: 12,
    borderWidth: 1,
    borderColor: healthColors.success.light,
  },
  healthCardLeft: {
    flexDirection: "row",
    alignItems: "flex-start",
    flex: 1,
  },
  healthIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: healthColors.success.main + "20",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16, // spacing.md
  },
  healthCardText: {
    flex: 1,
    marginRight: 12, // spacing.md
  },
  healthCardTitle: {
    fontSize: 14,
    fontWeight: theme.typography.weights.bold,
    color: healthColors.success.main,
    marginBottom: 8, // spacing.sm
  },
  healthMetrics: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 8,
  },
  metricItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 12,
    marginBottom: 4,
  },
  healthCardDetail: {
    fontSize: 12,
    color: healthColors.text.primary,
    fontWeight: theme.typography.weights.medium,
    marginLeft: 4,
  },
  healthCardUpdateRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  healthCardUpdated: {
    fontSize: 11,
    color: healthColors.text.secondary,
    marginLeft: 4,
  },
  emergencySection: {
    paddingHorizontal: getScreenPadding(),
    marginBottom: 24, // spacing.lg
  },
  emergencyTitle: {
    fontSize: 14,
    fontWeight: theme.typography.weights.bold,
    color: healthColors.text.primary,
    marginBottom: 12, // spacing.md
  },
  mainFeaturesSection: {
    paddingHorizontal: getScreenPadding(),
    marginBottom: 24, // spacing.lg
  },
  emergencyButtons: {
    flexDirection: "row",
    gap: 12, // spacing.md
  },
  emergencyButton: {
    flex: 1,
    borderRadius: 12,
    overflow: "hidden",
    ...theme.shadows.md,
  },
  emergencyButtonGradient: {
    padding: 16, // spacing.md
    alignItems: "center",
    minHeight: 140,
  },
  emergencyIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.withOpacity(theme.colors.text.white, 0.2),
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12, // spacing.md
  },
  emergencyButtonTitle: {
    fontSize: 13,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.text.white,
    marginBottom: 4, // spacing.xs
  },
  emergencyButtonSubtitle: {
    fontSize: 11,
    color: theme.colors.text.white,
    opacity: 0.9,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: theme.typography.weights.bold,
    color: healthColors.text.primary,
  },
  notificationsSection: {
    backgroundColor: healthColors.background.card,
    borderRadius: 12,
    padding: 16, // spacing.md
    marginTop: 24, // spacing.lg
    marginHorizontal: getScreenPadding(),
    marginBottom: 24, // spacing.lg for proper ending
    ...theme.shadows.md,
  },
  notificationsHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12, // spacing.md
  },
  notificationsTitle: {
    fontSize: 14,
    fontWeight: theme.typography.weights.bold,
    color: healthColors.text.primary,
    marginLeft: 8, // spacing.sm
  },
  notificationsList: {},
  notificationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  notificationItem: {
    flex: 1,
    fontSize: 13,
    color: healthColors.text.primary,
    lineHeight: 18,
    marginRight: 8,
  },
  viewButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  viewButtonText: {
    fontSize: 13,
    fontWeight: theme.typography.weights.semiBold,
    color: healthColors.primary.main,
    marginRight: 4,
  },
  scrollContent: {
    paddingTop: 16,
    paddingBottom: verticalScale(32), // spacing.xxxl for proper footer spacing
    flexGrow: 1,
  },
  quickActionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    justifyContent: "space-between",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    width: "100%",
    paddingHorizontal: getScreenPadding(),
    alignSelf: "center",
  },
  gridItem: {
    width: `${100 / getGridColumns(Dimensions.get("window").width) - 2}%`,
    marginBottom: 16, // spacing.md
    paddingHorizontal: 4, // Small gap between items
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 14,
    color: healthColors.text.secondary,
    fontWeight: theme.typography.weights.medium,
    marginLeft: 8,
  },
  // Profile Styles
  profileHeader: {
    marginBottom: 16,
  },
  profileHeaderGradient: {
    padding: 24,
    alignItems: "center",
    borderRadius: 12,
    marginHorizontal: getScreenPadding(),
  },
  profileAvatarContainer: {
    alignItems: "center",
  },
  profileAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.withOpacity(theme.colors.text.white, 0.2),
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
    borderWidth: 3,
    borderColor: theme.colors.text.white,
  },
  profileName: {
    fontSize: 22,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.text.white,
    marginBottom: 4,
  },
  profileId: {
    fontSize: 14,
    color: theme.withOpacity(theme.colors.text.white, 0.9),
    fontWeight: theme.typography.weights.medium,
  },
  profileSection: {
    paddingHorizontal: getScreenPadding(),
    marginBottom: 16,
  },
  profileSectionTitle: {
    fontSize: 14,
    fontWeight: theme.typography.weights.bold,
    color: healthColors.text.primary,
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  profileCard: {
    backgroundColor: healthColors.background.card,
    borderRadius: 12,
    padding: 16,
    ...theme.shadows.md,
  },
  profileInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
  },
  profileInfoContent: {
    marginLeft: 12,
    flex: 1,
  },
  profileInfoLabel: {
    fontSize: 12,
    color: healthColors.text.secondary,
    marginBottom: 2,
  },
  profileInfoValue: {
    fontSize: 14,
    fontWeight: theme.typography.weights.semiBold,
    color: healthColors.text.primary,
  },
  profileDivider: {
    height: 1,
    backgroundColor: healthColors.border.light,
    marginVertical: 4,
  },
  profileActionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
  },
  profileActionText: {
    flex: 1,
    fontSize: 14,
    fontWeight: theme.typography.weights.semiBold,
    color: healthColors.text.primary,
    marginLeft: 12,
  },
  logoutButtonProfile: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: healthColors.background.card,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: healthColors.error.main,
    ...theme.shadows.sm,
  },
  logoutButtonText: {
    fontSize: 14,
    fontWeight: theme.typography.weights.bold,
    color: healthColors.error.main,
    marginLeft: 8,
  },
  // Menu Styles
  menuOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  menuDrawer: {
    width: Math.min(width * 0.85, 400), // Max 400px for tablets
    height: "100%",
    backgroundColor: theme.colors.text.white,
    borderTopRightRadius: 20,
    borderBottomRightRadius: 20,
    borderRightWidth: 1,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: healthColors.border.light,
  },
  menuHeader: {
    padding: 20,
    paddingTop: 50,
    paddingBottom: 24,
    borderTopRightRadius: 20,
  },
  menuHeaderContent: {
    position: "relative",
  },
  menuProfileSection: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 40,
  },
  menuAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(255,255,255,0.3)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.5)",
    marginRight: 12,
  },
  menuUserInfo: {
    flex: 1,
  },
  menuUserName: {
    fontSize: 18,
    fontWeight: theme.typography.weights.bold,
    color: "white",
    marginBottom: 2,
  },
  menuUserRole: {
    fontSize: 14,
    fontWeight: theme.typography.weights.medium,
    color: "rgba(255,255,255,0.9)",
    marginBottom: 2,
  },
  menuUserId: {
    fontSize: 12,
    color: "rgba(255,255,255,0.7)",
  },
  menuCloseButton: {
    position: "absolute",
    top: 0,
    right: 0,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.25)",
    justifyContent: "center",
    alignItems: "center",
  },
  menuContent: {
    flex: 1,
  },
  menuSection: {
    paddingTop: 16,
    paddingBottom: 12,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: healthColors.border.light,
  },
  menuSectionTitle: {
    fontSize: 12,
    fontWeight: theme.typography.weights.bold,
    color: healthColors.text.secondary,
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 6,
    backgroundColor: "transparent",
  },
  menuItemText: {
    flex: 1,
    fontSize: 15,
    fontWeight: theme.typography.weights.medium,
    color: healthColors.text.primary,
    marginLeft: 12,
  },
  menuItemDanger: {
    backgroundColor: "rgba(244, 67, 54, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(244, 67, 54, 0.2)",
  },
  menuItemTextDanger: {
    flex: 1,
    fontSize: 15,
    fontWeight: theme.typography.weights.semiBold,
    color: healthColors.error.main,
  },
  menuBadge: {
    backgroundColor: healthColors.primary.main,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 24,
    alignItems: "center",
  },
  menuBadgeText: {
    fontSize: 12,
    fontWeight: theme.typography.weights.bold,
    color: "white",
  },
  menuStatCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    backgroundColor: healthColors.background.secondary,
    borderRadius: 8,
    marginBottom: 8,
  },
  menuStatLabel: {
    fontSize: 12,
    color: healthColors.text.secondary,
    marginBottom: 2,
  },
  menuStatValue: {
    fontSize: 16,
    fontWeight: theme.typography.weights.bold,
    color: healthColors.text.primary,
  },
  menuFooter: {
    padding: 24,
    alignItems: "center",
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: healthColors.border.light,
  },
  menuFooterText: {
    fontSize: 12,
    color: healthColors.text.secondary,
    marginBottom: 4,
  },
  loadingText: {
    fontSize: 14,
    color: healthColors.text.secondary,
    marginTop: 12,
    textAlign: "center",
  },
});

export default PatientDashboard;



