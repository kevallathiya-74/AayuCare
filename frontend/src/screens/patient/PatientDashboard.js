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
import { healthColors } from "../../theme/healthColors";
import { indianDesign, createShadow } from "../../theme/indianDesign";
import LargeActionCard from "../../components/common/LargeActionCard";
import LanguageSelector from "../../components/common/LanguageSelector";
import { logoutUser } from "../../store/slices/authSlice";
import {
  getScreenPadding,
  moderateScale,
  verticalScale,
  scaledFontSize,
  getGridColumns,
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

  // Fetch health metrics
  useEffect(() => {
    if (user?._id) {
      fetchHealthMetrics();
      fetchUnreadNotifications();
    }
  }, [user?._id]);

  const fetchUnreadNotifications = async () => {
    try {
      const response = await notificationService.getUnreadCount();
      setUnreadNotifications(response?.data?.count || 0);
    } catch (error) {
      logError(error, { context: "PatientDashboard.fetchUnreadNotifications" });
      // Silently fail - notification count is not critical
    }
  };

  const fetchHealthMetrics = async () => {
    try {
      setLoadingMetrics(true);
      const response = await healthMetricsService.getMetrics(user._id);
      setHealthMetrics(response.data);
    } catch (error) {
      logError(error, { context: "PatientDashboard.fetchHealthMetrics" });
      // Don't show error to user for non-critical health metrics
    } finally {
      setLoadingMetrics(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([fetchHealthMetrics(), fetchUnreadNotifications()]);
    setRefreshing(false);
  }, [user?._id]);

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
        iconColor: "#00897B",
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
        iconColor: "#F44336",
        onPress: () => navigation.navigate("AISymptomChecker"),
      },
      {
        title: "Disease Info",
        icon: "information-circle",
        iconColor: "#7E57C2",
        onPress: () => navigation.navigate("DiseaseInfo"),
      },
      {
        title: "Specialist Finder",
        icon: "people",
        iconColor: "#2196F3",
        onPress: () => navigation.navigate("SpecialistCareFinder"),
      },
      {
        title: "Women's Health",
        icon: "flower",
        iconColor: "#EC4899",
        onPress: () => navigation.navigate("WomensHealth"),
      },
      {
        title: "Hospital Events",
        icon: "calendar-outline",
        iconColor: "#FF9800",
        onPress: () => navigation.navigate("HospitalEvents"),
      },
      {
        title: "Pharmacy & Billing",
        icon: "cart",
        iconColor: "#4CAF50",
        onPress: () => navigation.navigate("PharmacyBilling"),
      },
      {
        title: "Activity Tracker",
        icon: "walk",
        iconColor: "#00BCD4",
        onPress: () => navigation.navigate("ActivityTracker"),
      },
    ],
    [navigation]
  );

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
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
            <Ionicons name="menu" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.appTitle}>AayuCare</Text>
          <View style={styles.bannerRightIcons}>
            <LanguageSelector compact iconColor="#FFFFFF" />
            <TouchableOpacity
              style={styles.bannerIconButton}
              onPress={() => navigation.navigate("More")}
              accessibilityRole="button"
              accessibilityLabel="Notifications"
            >
              <Ionicons name="notifications" size={24} color="#FFFFFF" />
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
              <Ionicons name="person" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Patient Greeting */}
        <View style={styles.bannerGreeting}>
          {!user || loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#FFFFFF" />
              <Text style={[styles.loadingText, { color: "#FFFFFF" }]}>
                Loading profile...
              </Text>
            </View>
          ) : (
            <>
              <View style={styles.greetingRow}>
                <Ionicons
                  name={getGreetingIcon()}
                  size={28}
                  color="#FFFFFF"
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
                  <Ionicons name="card-outline" size={18} color="#FFFFFF" />
                  <Text style={styles.bannerInfoText}>ID: {user.userId}</Text>
                </View>
                <View style={styles.bannerInfoRow}>
                  <Ionicons name="person-outline" size={18} color="#FFFFFF" />
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
            <Ionicons
              name="heart-circle"
              size={20}
              color={healthColors.primary.main}
            />
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

        {/* Quick Emergency Buttons */}
        <View style={styles.emergencySection}>
          <View style={styles.sectionHeader}>
            <Ionicons
              name="warning"
              size={20}
              color={healthColors.error.main}
            />
            <Text style={styles.emergencyTitle}>QUICK EMERGENCY</Text>
          </View>
          <View style={styles.emergencyButtons}>
            <TouchableOpacity
              style={[styles.emergencyButton, styles.ambulanceButton]}
              onPress={() => navigation.navigate("Emergency")}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Call ambulance"
            >
              <LinearGradient
                colors={[healthColors.error.main, healthColors.error.dark]}
                style={styles.emergencyButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={styles.emergencyIconCircle}>
                  <Ionicons name="medkit" size={28} color="#FFFFFF" />
                </View>
                <Text style={styles.emergencyButtonTitle}>CALL AMBULANCE</Text>
                <Text style={styles.emergencyButtonSubtitle}>ONE CLICK</Text>
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.emergencyButton, styles.doctorButton]}
              onPress={() =>
                Alert.alert("Emergency Helpline", "Calling doctor helpline...")
              }
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Call doctor helpline"
            >
              <LinearGradient
                colors={[healthColors.primary.main, healthColors.primary.dark]}
                style={styles.emergencyButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={styles.emergencyIconCircle}>
                  <Ionicons name="call" size={28} color="#FFFFFF" />
                </View>
                <Text style={styles.emergencyButtonTitle}>CALL DOCTOR</Text>
                <Text style={styles.emergencyButtonSubtitle}>HELPLINE</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>

        {/* Main Features Section */}
        <View style={styles.mainFeaturesSection}>
          <View style={styles.sectionHeader}>
            <Ionicons name="grid" size={20} color={healthColors.primary.main} />
            <Text style={styles.emergencyTitle}>MAIN FEATURES</Text>
          </View>

          {/* Action Cards */}
          <View style={styles.grid}>
            {actionCards.map((card, index) => (
              <View key={index} style={styles.gridItem}>
                <LargeActionCard
                  title={card.title}
                  icon={card.icon}
                  iconColor={card.iconColor}
                  onPress={card.onPress}
                  badge={card.badge}
                />
              </View>
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
                    <Ionicons name="person" size={32} color="#FFFFFF" />
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
                  <Ionicons name="close" size={28} color="#FFFFFF" />
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
                  <Ionicons name="stats-chart" size={22} color="#00897B" />
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
                  <Ionicons name="walk" size={22} color="#00BCD4" />
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
                  <Ionicons name="fitness-outline" size={22} color="#F44336" />
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
    paddingTop: moderateScale(12),
    paddingBottom: moderateScale(20),
    borderBottomLeftRadius: moderateScale(24),
    borderBottomRightRadius: moderateScale(24),
    ...createShadow(4),
  },
  bannerTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: getScreenPadding(),
    marginBottom: moderateScale(16),
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
  appTitle: {
    fontSize: scaledFontSize(18),
    fontWeight: "700",
    color: "#FFFFFF",
  },
  bannerRightIcons: {
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(8),
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
  healthStatusSection: {
    paddingHorizontal: getScreenPadding(),
    marginBottom: moderateScale(16),
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(8),
    marginBottom: moderateScale(12),
  },
  healthStatusTitle: {
    fontSize: scaledFontSize(14),
    fontWeight: "700",
    color: healthColors.text.primary,
  },
  healthCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: healthColors.success.background,
    padding: moderateScale(16),
    borderRadius: moderateScale(12),
    borderWidth: 1,
    borderColor: healthColors.success.light,
  },
  healthCardLeft: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: moderateScale(12),
    flex: 1,
  },
  healthIconCircle: {
    width: moderateScale(56),
    height: moderateScale(56),
    borderRadius: moderateScale(28),
    backgroundColor: healthColors.success.main + "20",
    justifyContent: "center",
    alignItems: "center",
  },
  healthCardText: {
    flex: 1,
  },
  healthCardTitle: {
    fontSize: scaledFontSize(14),
    fontWeight: "700",
    color: healthColors.success.main,
    marginBottom: moderateScale(8),
  },
  healthMetrics: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: moderateScale(12),
    marginBottom: moderateScale(8),
  },
  metricItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(4),
  },
  healthCardDetail: {
    fontSize: scaledFontSize(12),
    color: healthColors.text.primary,
    fontWeight: "500",
  },
  healthCardUpdateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(4),
  },
  healthCardUpdated: {
    fontSize: scaledFontSize(11),
    color: healthColors.text.secondary,
  },
  emergencySection: {
    paddingHorizontal: getScreenPadding(),
    marginBottom: moderateScale(16),
  },
  emergencyTitle: {
    fontSize: scaledFontSize(14),
    fontWeight: "700",
    color: healthColors.text.primary,
  },
  mainFeaturesSection: {
    paddingHorizontal: getScreenPadding(),
    marginBottom: moderateScale(16),
  },
  emergencyButtons: {
    flexDirection: "row",
    gap: moderateScale(12),
  },
  emergencyButton: {
    flex: 1,
    borderRadius: moderateScale(12),
    overflow: "hidden",
    ...createShadow(3),
  },
  emergencyButtonGradient: {
    padding: moderateScale(16),
    alignItems: "center",
  },
  emergencyIconCircle: {
    width: moderateScale(56),
    height: moderateScale(56),
    borderRadius: moderateScale(28),
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: moderateScale(8),
  },
  emergencyButtonTitle: {
    fontSize: scaledFontSize(13),
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: moderateScale(2),
  },
  emergencyButtonSubtitle: {
    fontSize: scaledFontSize(11),
    color: "#FFFFFF",
    opacity: 0.9,
  },
  sectionTitle: {
    fontSize: scaledFontSize(14),
    fontWeight: "700",
    color: healthColors.text.primary,
  },
  notificationsSection: {
    backgroundColor: healthColors.background.card,
    borderRadius: moderateScale(12),
    padding: moderateScale(16),
    marginTop: moderateScale(16),
    marginHorizontal: getScreenPadding(),
    ...createShadow(2),
  },
  notificationsHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(8),
    marginBottom: moderateScale(12),
  },
  notificationsTitle: {
    fontSize: scaledFontSize(14),
    fontWeight: "700",
    color: healthColors.text.primary,
  },
  notificationsList: {
    gap: moderateScale(8),
  },
  notificationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(8),
  },
  notificationItem: {
    flex: 1,
    fontSize: scaledFontSize(13),
    color: healthColors.text.primary,
    lineHeight: scaledFontSize(18),
  },
  viewButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(4),
  },
  viewButtonText: {
    fontSize: scaledFontSize(13),
    fontWeight: "600",
    color: healthColors.primary.main,
  },
  scrollContent: {
    paddingTop: moderateScale(16),
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    width: "100%",
  },
  gridItem: {
    paddingHorizontal: getScreenPadding(),
    width: "48%",
    aspectRatio: 1.2,
    marginBottom: moderateScale(12),
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(8),
  },
  loadingText: {
    fontSize: scaledFontSize(14),
    color: healthColors.text.secondary,
    fontWeight: "500",
  },
  // Profile Styles
  profileHeader: {
    marginBottom: moderateScale(16),
  },
  profileHeaderGradient: {
    padding: moderateScale(24),
    alignItems: "center",
    borderRadius: moderateScale(12),
    marginHorizontal: getScreenPadding(),
  },
  profileAvatarContainer: {
    alignItems: "center",
  },
  profileAvatar: {
    width: moderateScale(80),
    height: moderateScale(80),
    borderRadius: moderateScale(40),
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: moderateScale(12),
    borderWidth: 3,
    borderColor: "#FFFFFF",
  },
  profileName: {
    fontSize: scaledFontSize(22),
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: moderateScale(4),
  },
  profileId: {
    fontSize: scaledFontSize(14),
    color: "rgba(255, 255, 255, 0.9)",
    fontWeight: "500",
  },
  profileSection: {
    paddingHorizontal: getScreenPadding(),
    marginBottom: moderateScale(16),
  },
  profileSectionTitle: {
    fontSize: scaledFontSize(14),
    fontWeight: "700",
    color: healthColors.text.primary,
    marginBottom: moderateScale(12),
    letterSpacing: 0.5,
  },
  profileCard: {
    backgroundColor: healthColors.background.card,
    borderRadius: moderateScale(12),
    padding: moderateScale(16),
    ...createShadow(2),
  },
  profileInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: moderateScale(8),
  },
  profileInfoContent: {
    marginLeft: moderateScale(12),
    flex: 1,
  },
  profileInfoLabel: {
    fontSize: scaledFontSize(12),
    color: healthColors.text.secondary,
    marginBottom: moderateScale(2),
  },
  profileInfoValue: {
    fontSize: scaledFontSize(14),
    fontWeight: "600",
    color: healthColors.text.primary,
  },
  profileDivider: {
    height: 1,
    backgroundColor: healthColors.border.light,
    marginVertical: moderateScale(4),
  },
  profileActionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: moderateScale(12),
  },
  profileActionText: {
    flex: 1,
    fontSize: scaledFontSize(14),
    fontWeight: "600",
    color: healthColors.text.primary,
    marginLeft: moderateScale(12),
  },
  logoutButtonProfile: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: healthColors.background.card,
    padding: moderateScale(16),
    borderRadius: moderateScale(12),
    borderWidth: 1,
    borderColor: healthColors.error.main,
    ...createShadow(1),
  },
  logoutButtonText: {
    fontSize: scaledFontSize(14),
    fontWeight: "700",
    color: healthColors.error.main,
    marginLeft: moderateScale(8),
  },
  // Menu Styles
  menuOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  menuDrawer: {
    width: "85%",
    height: "100%",
    backgroundColor: "#FFFFFF",
    borderTopRightRadius: moderateScale(20),
    borderBottomRightRadius: moderateScale(20),
    borderRightWidth: 1,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: healthColors.border.light,
  },
  menuHeader: {
    padding: moderateScale(20),
    paddingTop: moderateScale(50),
    paddingBottom: moderateScale(24),
    borderTopRightRadius: moderateScale(20),
  },
  menuHeaderContent: {
    position: "relative",
  },
  menuProfileSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(12),
    marginRight: moderateScale(40),
  },
  menuAvatar: {
    width: moderateScale(60),
    height: moderateScale(60),
    borderRadius: moderateScale(30),
    backgroundColor: "rgba(255,255,255,0.3)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.5)",
  },
  menuUserInfo: {
    flex: 1,
  },
  menuUserName: {
    fontSize: scaledFontSize(18),
    fontWeight: "700",
    color: "white",
    marginBottom: moderateScale(2),
  },
  menuUserRole: {
    fontSize: scaledFontSize(14),
    fontWeight: "500",
    color: "rgba(255,255,255,0.9)",
    marginBottom: moderateScale(2),
  },
  menuUserId: {
    fontSize: scaledFontSize(12),
    color: "rgba(255,255,255,0.7)",
  },
  menuCloseButton: {
    position: "absolute",
    top: 0,
    right: 0,
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: moderateScale(20),
    backgroundColor: "rgba(255,255,255,0.25)",
    justifyContent: "center",
    alignItems: "center",
  },
  menuContent: {
    flex: 1,
  },
  menuSection: {
    paddingTop: moderateScale(16),
    paddingBottom: moderateScale(12),
    paddingHorizontal: moderateScale(20),
    borderBottomWidth: 1,
    borderBottomColor: healthColors.border.light,
  },
  menuSectionTitle: {
    fontSize: scaledFontSize(12),
    fontWeight: "700",
    color: healthColors.text.secondary,
    marginBottom: moderateScale(12),
    letterSpacing: 0.5,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: moderateScale(14),
    paddingHorizontal: moderateScale(12),
    borderRadius: moderateScale(10),
    gap: moderateScale(12),
    marginBottom: moderateScale(6),
    backgroundColor: "transparent",
  },
  menuItemText: {
    flex: 1,
    fontSize: scaledFontSize(15),
    fontWeight: "500",
    color: healthColors.text.primary,
  },
  menuItemDanger: {
    backgroundColor: "rgba(244, 67, 54, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(244, 67, 54, 0.2)",
  },
  menuItemTextDanger: {
    flex: 1,
    fontSize: scaledFontSize(15),
    fontWeight: "600",
    color: healthColors.error.main,
  },
  menuBadge: {
    backgroundColor: healthColors.primary.main,
    paddingHorizontal: moderateScale(8),
    paddingVertical: moderateScale(2),
    borderRadius: moderateScale(10),
    minWidth: moderateScale(24),
    alignItems: "center",
  },
  menuBadgeText: {
    fontSize: scaledFontSize(12),
    fontWeight: "700",
    color: "white",
  },
  menuStatCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: moderateScale(12),
    backgroundColor: healthColors.background.secondary,
    borderRadius: moderateScale(8),
    gap: moderateScale(12),
    marginBottom: moderateScale(8),
  },
  menuStatLabel: {
    fontSize: scaledFontSize(12),
    color: healthColors.text.secondary,
    marginBottom: moderateScale(2),
  },
  menuStatValue: {
    fontSize: scaledFontSize(16),
    fontWeight: "700",
    color: healthColors.text.primary,
  },
  menuFooter: {
    padding: moderateScale(24),
    alignItems: "center",
    marginTop: moderateScale(16),
    borderTopWidth: 1,
    borderTopColor: healthColors.border.light,
  },
  menuFooterText: {
    fontSize: scaledFontSize(12),
    color: healthColors.text.secondary,
    marginBottom: moderateScale(4),
  },
  loadingText: {
    fontSize: scaledFontSize(14),
    color: healthColors.text.secondary,
    marginTop: moderateScale(12),
    textAlign: "center",
  },
});

export default PatientDashboard;
