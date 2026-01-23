/**
 * Admin Home Screen (Screen 5)
 * Modern admin dashboard with comprehensive analytics, visualizations, and quick actions
 * Features: Real-time stats, system health, trend indicators, organized action cards
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
  Dimensions,
  Alert,
  ActivityIndicator,
  Platform,
  Modal,
  Pressable,
  Animated,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSelector, useDispatch } from "react-redux";
import { useFocusEffect } from "@react-navigation/native";
import { theme, healthColors } from "../../theme";
import {
  verticalScale,
  getScreenPadding,
  getSafeAreaEdges,
  isTablet,
  getContainerWidth,
} from "../../utils/responsive";
import LanguageSelector from "../../components/common/LanguageSelector";
import { logoutUser } from "../../store/slices/authSlice";
import {
  showConfirmation,
  showError,
  logError,
} from "../../utils/errorHandler";
import adminService from "../../services/admin.service";
import notificationService from "../../services/notification.service";
import eventService from "../../services/event.service";
import { useAdminAppointments } from "../../context/AdminAppointmentContext";

const { width } = Dimensions.get("window");

const AdminHomeScreen = ({ navigation }) => {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showProfile, setShowProfile] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const slideAnim = useRef(new Animated.Value(-width * 0.8)).current;
  const insets = useSafeAreaInsets();
  const [stats, setStats] = useState({
    appointments: { total: 0, today: 0, pending: 0, completed: 0, trend: 0 },
    doctors: { total: 0, active: 0, onDuty: 0, trend: 0 },
    patients: { total: 0, new: 0, returning: 0, trend: 0 },
    prescriptions: { total: 0, today: 0, trend: 0 },
    revenue: { total: 0, today: 0, trend: 0 },
  });
  const [recentActivities, setRecentActivities] = useState([]);
  const [systemHealth, setSystemHealth] = useState({
    status: "good",
    issues: 0,
  });
  const [notificationCount, setNotificationCount] = useState(0);
  const [upcomingEventsCount, setUpcomingEventsCount] = useState(0);

  const fetchDashboardData = useCallback(async () => {
    try {
      setError(null);

      // Fetch stats, activities, notifications, and events in parallel
      const [
        statsResponse,
        activitiesResponse,
        notificationsResponse,
        eventsResponse,
      ] = await Promise.all([
        adminService.getDashboardStats().catch(() => null),
        adminService.getRecentActivities(5).catch(() => null),
        notificationService.getUnreadCount().catch(() => null),
        eventService.getUpcomingEvents({ limit: 100 }).catch(() => null),
      ]);

      if (statsResponse?.success) {
        // Use real data from backend - no mock calculations
        const data = statsResponse.data;
        setStats({
          appointments:
            typeof data.appointments === "object"
              ? data.appointments
              : {
                  total: data.appointments || 0,
                  today: 0,
                  pending: 0,
                  completed: 0,
                  trend: 0,
                },
          doctors:
            typeof data.doctors === "object"
              ? data.doctors
              : {
                  total: data.doctors || 0,
                  active: 0,
                  onDuty: 0,
                  trend: 0,
                },
          patients:
            typeof data.patients === "object"
              ? data.patients
              : {
                  total: data.patients || 0,
                  new: 0,
                  returning: 0,
                  trend: 0,
                },
          prescriptions:
            typeof data.prescriptions === "object"
              ? data.prescriptions
              : {
                  total: data.prescriptions || 0,
                  today: 0,
                  trend: 0,
                },
          revenue: data.revenue || { total: 0, today: 0, trend: 0 },
        });
      }

      if (activitiesResponse?.success) {
        setRecentActivities(activitiesResponse.data);
      }

      if (notificationsResponse?.success) {
        setNotificationCount(notificationsResponse.data?.count || 0);
      }

      if (eventsResponse?.success) {
        setUpcomingEventsCount(eventsResponse.data?.length || 0);
      }

      // Fetch system health from API
      try {
        const healthResponse = await adminService.getSystemHealth();
        if (healthResponse?.success) {
          setSystemHealth(healthResponse.data);
        } else {
          // Fallback if API doesn't return expected data
          setSystemHealth({ status: "good", issues: 0 });
        }
      } catch (healthErr) {
        // Non-critical error, use fallback
        setSystemHealth({ status: "good", issues: 0 });
        console.warn("System health check failed:", healthErr.message);
      }
    } catch (err) {
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        "Failed to load dashboard";
      setError(errorMessage);
      logError(err, { context: "AdminHomeScreen.fetchDashboardData" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Get refreshCount from context to sync tab badge
  const { refreshCount } = useAdminAppointments();

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

  const handleLogout = useCallback(() => {
    showConfirmation(
      "Are you sure you want to logout?",
      () => dispatch(logoutUser()),
      () => {},
      "Logout"
    );
  }, [dispatch]);

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

  // Get time-based greeting (memoized)
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return "Good Morning";
    if (hour >= 12 && hour < 17) return "Good Afternoon";
    if (hour >= 17 && hour < 21) return "Good Evening";
    return "Good Night";
  }, []);

  // Render stat card with gradient (memoized)
  const renderStatCard = useCallback(
    (stat, index) => (
      <TouchableOpacity
        key={index}
        style={styles.statCardWrapper}
        onPress={() => {
          // Navigate based on card type
          if (stat.screen) {
            if (stat.isTabScreen) {
              navigation.navigate("AdminTabs", { screen: stat.screen });
            } else {
              navigation.navigate(stat.screen);
            }
          }
        }}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={stat.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.statCard}
        >
          <View style={styles.statCardHeader}>
            <View style={styles.statIconContainer}>
              <Ionicons name={stat.icon} size={24} color="white" />
            </View>
            {stat.trend !== 0 && (
              <View style={styles.trendContainer}>
                <Ionicons
                  name={stat.trend > 0 ? "trending-up" : "trending-down"}
                  size={16}
                  color="white"
                />
                <Text style={styles.trendText}>{Math.abs(stat.trend)}%</Text>
              </View>
            )}
          </View>
          <Text style={styles.statValue}>{stat.value}</Text>
          <Text style={styles.statTitle}>{stat.title}</Text>
          <Text style={styles.statSubtitle}>{stat.subtitle}</Text>
        </LinearGradient>
      </TouchableOpacity>
    ),
    [navigation]
  );

  // Render action section (memoized)
  const renderActionSection = useCallback(
    (title, actions) => (
      <View style={styles.actionSection}>
        <Text style={styles.actionSectionTitle}>{title}</Text>
        <View style={styles.actionGrid}>
          {actions.map((action, index) => (
            <TouchableOpacity
              key={index}
              style={styles.actionCard}
              onPress={() => {
                try {
                  if (action.action) {
                    action.action();
                  } else if (action.screen) {
                    // Navigate to tab screens via AdminTabs, others directly
                    if (action.isTabScreen) {
                      navigation.navigate("AdminTabs", {
                        screen: action.screen,
                      });
                    } else {
                      navigation.navigate(action.screen);
                    }
                  }
                } catch (error) {
                  console.error("[AdminHomeScreen] Navigation error:", error);
                  Alert.alert(
                    "Navigation Error",
                    "Unable to open this section. Please try again."
                  );
                }
              }}
              activeOpacity={0.8}
            >
              <View
                style={[
                  styles.actionIconWrapper,
                  { backgroundColor: action.color + "15" },
                ]}
              >
                <Ionicons name={action.icon} size={24} color={action.color} />
                {action.badge ? (
                  <View style={styles.actionBadge}>
                    <Text style={styles.actionBadgeText}>{action.badge}</Text>
                  </View>
                ) : null}
              </View>
              <Text style={styles.actionTitle} numberOfLines={2}>
                {action.title}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    ),
    [navigation]
  );

  // Render system health indicator (memoized)
  const SystemHealthBanner = useMemo(() => {
    const healthStatus = {
      good: {
        icon: "checkmark-circle",
        color: healthColors.success.main,
        text: "System Status: All Good",
      },
      warning: {
        icon: "warning",
        color: healthColors.warning.main,
        text: "System Status: Warning",
      },
      critical: {
        icon: "alert-circle",
        color: healthColors.error.main,
        text: "System Status: Critical",
      },
    };

    const current = healthStatus[systemHealth.status] || healthStatus.good;

    return (
      <View
        style={[styles.healthBanner, { backgroundColor: current.color + "15" }]}
      >
        <Ionicons name={current.icon} size={20} color={current.color} />
        <Text style={[styles.healthText, { color: current.color }]}>
          {current.text}
        </Text>
        {systemHealth.issues > 0 && (
          <TouchableOpacity
            style={styles.healthButton}
            onPress={() => navigation.navigate("Analytics")}
          >
            <Text style={[styles.healthButtonText, { color: current.color }]}>
              View {systemHealth.issues} Issues
            </Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }, [systemHealth.status, systemHealth.issues, navigation]);

  const quickActions = useMemo(
    () => ({
      management: [
        {
          title: "Patients",
          icon: "people",
          color: healthColors.primary.main,
          screen: "PatientManagement",
          isTabScreen: false,
          badge: null,
        },
        {
          title: "Doctors",
          icon: "medical",
          color: healthColors.secondary.main,
          screen: "ManageDoctors",
          isTabScreen: false,
          badge: null,
        },
        {
          title: "Appointments",
          icon: "calendar",
          color: healthColors.accent.coral,
          screen: "Appointments",
          isTabScreen: true,
          badge: stats.appointments.pending,
        },
        {
          title: "Reports",
          icon: "document-text",
          color: healthColors.info.main,
          screen: "Reports",
          isTabScreen: true,
          badge: null,
        },
        {
          title: "Pharmacy",
          icon: "medkit",
          color: healthColors.accent.purple,
          screen: "Reports",
          isTabScreen: true,
          badge:
            stats.prescriptions.today > 0 ? stats.prescriptions.today : null,
        },
        {
          title: "Events",
          icon: "calendar-outline",
          color: healthColors.accent.green,
          screen: "HospitalEventsScreen",
          isTabScreen: false,
          badge: upcomingEventsCount > 0 ? upcomingEventsCount : null,
        },
      ],
    }),
    [
      stats.appointments.pending,
      stats.prescriptions.today,
      upcomingEventsCount,
      navigation,
    ]
  );

  const statCards = useMemo(
    () => [
      {
        title: "Appointments",
        value: stats.appointments.total,
        subtitle: `${stats.appointments.today} today • ${stats.appointments.pending} pending`,
        icon: "calendar",
        gradient: [healthColors.primary.main, healthColors.primary.dark],
        trend: stats.appointments.trend,
        screen: "Appointments",
        isTabScreen: true,
      },
      {
        title: "Active Doctors",
        value: stats.doctors.active,
        subtitle: `${stats.doctors.total} total • ${stats.doctors.onDuty} on duty`,
        icon: "medical",
        gradient: [healthColors.secondary.main, healthColors.secondary.dark],
        trend: stats.doctors.trend,
        screen: "ManageDoctors",
        isTabScreen: false,
      },
      {
        title: "Total Patients",
        value: stats.patients.total.toLocaleString(),
        subtitle: `${stats.patients.new} new • ${stats.patients.returning} returning`,
        icon: "people",
        gradient: [healthColors.accent.coral, "#D84B6F"],
        trend: stats.patients.trend,
        screen: "PatientManagement",
        isTabScreen: false,
      },
      {
        title: "Prescriptions",
        value: stats.prescriptions.total,
        subtitle: `${stats.prescriptions.today} issued today`,
        icon: "medkit",
        gradient: [healthColors.info.main, healthColors.info.dark],
        trend: stats.prescriptions.trend,
        screen: "Reports",
        isTabScreen: true,
      },
    ],
    [stats]
  );

  // Memoize menu navigation handlers
  const handleMenuNavigation = useCallback(
    (screen, isTabScreen = false) => {
      closeMenu();
      setTimeout(() => {
        if (isTabScreen) {
          navigation.navigate("AdminTabs", { screen });
        } else {
          navigation.navigate(screen);
        }
      }, 100);
    },
    [navigation, closeMenu]
  );

  const handleProfileOpen = useCallback(() => {
    closeMenu();
    setTimeout(() => {
      setShowProfile(true);
    }, 100);
  }, [closeMenu]);

  return (
    <SafeAreaView
      style={styles.container}
      edges={getSafeAreaEdges("withTabBar")}
    >
      <StatusBar
        barStyle="dark-content"
        backgroundColor={healthColors.background.primary}
      />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.menuButton}
          onPress={() => setMenuVisible(true)}
          accessibilityRole="button"
          accessibilityLabel="Open menu"
          accessibilityHint="Opens the navigation menu"
        >
          <Ionicons name="menu" size={28} color={healthColors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Admin Dashboard</Text>
        <View style={styles.headerRight}>
          <LanguageSelector compact iconColor={healthColors.primary.main} />
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => navigation.navigate("NotificationsScreen")}
            accessibilityRole="button"
            accessibilityLabel="Notifications"
            accessibilityHint="Opens notification list"
          >
            <Ionicons
              name="notifications-outline"
              size={24}
              color={healthColors.text.primary}
            />
            {notificationCount > 0 && (
              <View style={styles.notificationDot}>
                <Text style={styles.notificationDotText}>
                  {notificationCount > 9 ? "9+" : notificationCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => setShowProfile(!showProfile)}
            accessibilityRole="button"
            accessibilityLabel="Profile"
            accessibilityHint="Toggle profile view"
          >
            <Ionicons
              name={
                showProfile ? "close-circle-outline" : "person-circle-outline"
              }
              size={24}
              color={
                showProfile
                  ? healthColors.primary.main
                  : healthColors.text.primary
              }
            />
          </TouchableOpacity>
        </View>
      </View>

      {showProfile ? (
        <ScrollView
          showsVerticalScrollIndicator={false}
          style={styles.profileContainer}
          contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 20) }}
          removeClippedSubviews={true}
          scrollEventThrottle={16}
          decelerationRate="fast"
        >
          {/* Profile Header */}
          <LinearGradient
            colors={[healthColors.primary.main, healthColors.primary.dark]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.profileHeader}
          >
            <View style={styles.profileAvatarContainer}>
              <View style={styles.profileAvatar}>
                <Ionicons name="person" size={60} color="white" />
              </View>
            </View>
            <Text style={styles.profileName}>{user?.name || "Admin User"}</Text>
            <Text style={styles.profileEmail}>
              {user?.email || "admin@aayucare.com"}
            </Text>
            <View style={styles.profileRoleBadge}>
              <Ionicons name="shield-checkmark" size={16} color="white" />
              <Text style={styles.profileRoleText}>
                {user?.role?.toUpperCase() || "ADMIN"}
              </Text>
            </View>
          </LinearGradient>

          {/* Profile Info Section */}
          <View style={styles.profileSection}>
            <Text style={styles.profileSectionTitle}>Personal Information</Text>
            <View style={styles.profileCard}>
              <View style={styles.profileInfoRow}>
                <Ionicons
                  name="id-card-outline"
                  size={20}
                  color={healthColors.primary.main}
                />
                <View style={styles.profileInfoContent}>
                  <Text style={styles.profileInfoLabel}>Admin ID</Text>
                  <Text style={styles.profileInfoValue}>
                    {user?.userId || user?.employeeId || "ADM001"}
                  </Text>
                </View>
              </View>
              <View style={styles.profileDivider} />
              <View style={styles.profileInfoRow}>
                <Ionicons
                  name="person-outline"
                  size={20}
                  color={healthColors.primary.main}
                />
                <View style={styles.profileInfoContent}>
                  <Text style={styles.profileInfoLabel}>Full Name</Text>
                  <Text style={styles.profileInfoValue}>
                    {user?.name || "Admin User"}
                  </Text>
                </View>
              </View>
              <View style={styles.profileDivider} />
              <View style={styles.profileInfoRow}>
                <Ionicons
                  name="mail-outline"
                  size={20}
                  color={healthColors.primary.main}
                />
                <View style={styles.profileInfoContent}>
                  <Text style={styles.profileInfoLabel}>Email Address</Text>
                  <Text style={styles.profileInfoValue}>
                    {user?.email || "admin@aayucare.com"}
                  </Text>
                </View>
              </View>
              <View style={styles.profileDivider} />
              <View style={styles.profileInfoRow}>
                <Ionicons
                  name="call-outline"
                  size={20}
                  color={healthColors.primary.main}
                />
                <View style={styles.profileInfoContent}>
                  <Text style={styles.profileInfoLabel}>Phone Number</Text>
                  <Text style={styles.profileInfoValue}>
                    {user?.phone || "+91 XXXXXXXXXX"}
                  </Text>
                </View>
              </View>
              <View style={styles.profileDivider} />
              <View style={styles.profileInfoRow}>
                <Ionicons
                  name="briefcase-outline"
                  size={20}
                  color={healthColors.primary.main}
                />
                <View style={styles.profileInfoContent}>
                  <Text style={styles.profileInfoLabel}>Role</Text>
                  <Text style={styles.profileInfoValue}>
                    {user?.role || "admin"}
                  </Text>
                </View>
              </View>
              <View style={styles.profileDivider} />
              <View style={styles.profileInfoRow}>
                <Ionicons
                  name="calendar-outline"
                  size={20}
                  color={healthColors.primary.main}
                />
                <View style={styles.profileInfoContent}>
                  <Text style={styles.profileInfoLabel}>Member Since</Text>
                  <Text style={styles.profileInfoValue}>
                    {user?.createdAt
                      ? new Date(user.createdAt).toLocaleDateString()
                      : "January 2025"}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Profile Actions */}
          <View style={styles.profileSection}>
            <Text style={styles.profileSectionTitle}>Account Settings</Text>
            <View style={styles.profileCard}>
              <TouchableOpacity
                style={styles.profileActionRow}
                onPress={() => {
                  setShowProfile(false);
                  navigation.navigate("Settings");
                }}
              >
                <Ionicons
                  name="settings-outline"
                  size={22}
                  color={healthColors.text.primary}
                />
                <Text style={styles.profileActionText}>Settings</Text>
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={healthColors.text.tertiary}
                />
              </TouchableOpacity>
              <View style={styles.profileDivider} />
              <TouchableOpacity
                style={styles.profileActionRow}
                onPress={() =>
                  Alert.alert(
                    "Edit Profile",
                    "Edit profile feature coming soon!"
                  )
                }
              >
                <Ionicons
                  name="create-outline"
                  size={22}
                  color={healthColors.text.primary}
                />
                <Text style={styles.profileActionText}>Edit Profile</Text>
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={healthColors.text.tertiary}
                />
              </TouchableOpacity>
              <View style={styles.profileDivider} />
              <TouchableOpacity
                style={styles.profileActionRow}
                onPress={() =>
                  Alert.alert(
                    "Change Password",
                    "Change password feature coming soon!"
                  )
                }
              >
                <Ionicons
                  name="key-outline"
                  size={22}
                  color={healthColors.text.primary}
                />
                <Text style={styles.profileActionText}>Change Password</Text>
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={healthColors.text.tertiary}
                />
              </TouchableOpacity>
              <View style={styles.profileDivider} />
              <TouchableOpacity
                style={styles.profileActionRow}
                onPress={() =>
                  Alert.alert(
                    "Privacy Settings",
                    "Privacy settings coming soon!"
                  )
                }
              >
                <Ionicons
                  name="shield-outline"
                  size={22}
                  color={healthColors.text.primary}
                />
                <Text style={styles.profileActionText}>Privacy & Security</Text>
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={healthColors.text.tertiary}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Logout Button */}
          <View style={styles.profileSection}>
            <TouchableOpacity
              style={styles.logoutButtonProfile}
              onPress={handleLogout}
            >
              <Ionicons
                name="log-out-outline"
                size={22}
                color={healthColors.error.main}
              />
              <Text style={styles.logoutButtonText}>Logout</Text>
            </TouchableOpacity>
          </View>

          <View style={{ height: 50 }} />
        </ScrollView>
      ) : loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={healthColors.primary.main} />
          <Text style={styles.loadingText}>Loading dashboard...</Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 20) }}
          removeClippedSubviews={true}
          scrollEventThrottle={16}
          decelerationRate="fast"
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[healthColors.primary.main]}
              tintColor={healthColors.primary.main}
            />
          }
        >
          {/* Welcome Banner */}
          <LinearGradient
            colors={[healthColors.primary.main, healthColors.primary.dark]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.welcomeBanner}
          >
            <View style={styles.welcomeContent}>
              <Text style={styles.timeGreeting}>{greeting}</Text>
              <Text style={styles.welcomeGreeting}>
                Welcome{user?.name ? ` ${user.name}` : ""}
              </Text>
              <View style={styles.roleInfoRow}>
                <Text style={styles.roleInfoText}>
                  {user?.role?.toUpperCase() || "ADMIN"}
                </Text>
              </View>
            </View>
          </LinearGradient>

          {/* Statistics Cards */}
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <Ionicons
                name="analytics"
                size={22}
                color={healthColors.primary.main}
              />
              <Text style={styles.sectionTitle}>Today's Overview</Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.statCardsContainer}
              removeClippedSubviews={true}
              scrollEventThrottle={16}
              decelerationRate="fast"
            >
              {statCards.map((stat, index) => renderStatCard(stat, index))}
            </ScrollView>
          </View>

          {/* Quick Actions */}
          {renderActionSection("Quick Actions", quickActions.management)}

          {/* Recent Activities */}
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <Ionicons
                name="time-outline"
                size={22}
                color={healthColors.primary.main}
              />
              <Text style={styles.sectionTitle}>Recent Activities</Text>
              <TouchableOpacity
                onPress={() =>
                  Alert.alert(
                    "Activity Log",
                    "Full activity log feature coming soon!"
                  )
                }
              >
                <Text style={styles.viewAllText}>View All</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.activitiesCard}>
              {recentActivities.length > 0 ? (
                recentActivities.map((activity, index) => (
                  <View
                    key={activity.id || activity._id || index}
                    style={styles.activityItem}
                  >
                    <View style={styles.activityIconWrapper}>
                      <Ionicons
                        name={activity.icon || "checkmark-circle"}
                        size={20}
                        color={healthColors.primary.main}
                      />
                    </View>
                    <View style={styles.activityContent}>
                      <Text style={styles.activityText}>
                        {activity.text || activity.description}
                      </Text>
                      <Text style={styles.activityTime}>
                        {activity.time || "Just now"}
                      </Text>
                    </View>
                  </View>
                ))
              ) : (
                <View style={styles.emptyState}>
                  <Ionicons
                    name="information-circle-outline"
                    size={48}
                    color={healthColors.text.disabled}
                  />
                  <Text style={styles.emptyText}>No recent activities</Text>
                  <Text style={styles.emptySubtext}>
                    Activities will appear here as they occur
                  </Text>
                </View>
              )}
            </View>
          </View>

          <View style={{ height: 100 }} />
        </ScrollView>
      )}

      {/* Side Menu Drawer */}
      <Modal
        visible={menuVisible}
        transparent
        animationType="fade"
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
            {/* Menu Header */}
            <LinearGradient
              colors={[healthColors.primary.main, healthColors.primary.dark]}
              style={styles.menuHeader}
            >
              <View style={styles.menuProfileSection}>
                <View style={styles.menuAvatar}>
                  <Ionicons name="shield-checkmark" size={32} color="white" />
                </View>
                <View style={styles.menuUserInfo}>
                  <Text style={styles.menuUserName}>
                    {user?.name || "Administrator"}
                  </Text>
                  <Text style={styles.menuUserRole}>System Admin</Text>
                  <Text style={styles.menuUserId}>ID: {user?.id || "N/A"}</Text>
                </View>
              </View>
              <Pressable style={styles.menuCloseButton} onPress={closeMenu}>
                <Ionicons name="close" size={24} color="white" />
              </Pressable>
            </LinearGradient>

            {/* Menu Content */}
            <ScrollView
              style={styles.menuContent}
              showsVerticalScrollIndicator={false}
              removeClippedSubviews={Platform.OS === "android"}
              scrollEventThrottle={16}
              decelerationRate="fast"
              bounces={false}
              overScrollMode="never"
              nestedScrollEnabled={true}
              persistentScrollbar={false}
              keyboardShouldPersistTaps="handled"
            >
              {/* System Management */}
              <View style={styles.menuSection}>
                <Text style={styles.menuSectionTitle}>SYSTEM MANAGEMENT</Text>

                <Pressable
                  style={styles.menuItem}
                  onPress={() => handleMenuNavigation("Dashboard", true)}
                >
                  <Ionicons
                    name="home-outline"
                    size={22}
                    color={healthColors.text.primary}
                  />
                  <Text style={styles.menuItemText}>Dashboard</Text>
                  <Ionicons
                    name="chevron-forward"
                    size={20}
                    color={healthColors.text.secondary}
                  />
                </Pressable>

                <Pressable
                  style={styles.menuItem}
                  onPress={() => handleMenuNavigation("ManageDoctors", false)}
                >
                  <Ionicons
                    name="medical-outline"
                    size={22}
                    color={healthColors.text.primary}
                  />
                  <Text style={styles.menuItemText}>Manage Doctors</Text>
                  <Ionicons
                    name="chevron-forward"
                    size={20}
                    color={healthColors.text.secondary}
                  />
                </Pressable>

                <Pressable
                  style={styles.menuItem}
                  onPress={() =>
                    handleMenuNavigation("PatientManagement", false)
                  }
                >
                  <Ionicons
                    name="people-outline"
                    size={22}
                    color={healthColors.text.primary}
                  />
                  <Text style={styles.menuItemText}>Manage Patients</Text>
                  <Ionicons
                    name="chevron-forward"
                    size={20}
                    color={healthColors.text.secondary}
                  />
                </Pressable>

                <Pressable
                  style={styles.menuItem}
                  onPress={() => handleMenuNavigation("Appointments", true)}
                >
                  <Ionicons
                    name="calendar-outline"
                    size={22}
                    color={healthColors.text.primary}
                  />
                  <Text style={styles.menuItemText}>Appointments</Text>
                  <Ionicons
                    name="chevron-forward"
                    size={20}
                    color={healthColors.text.secondary}
                  />
                </Pressable>

                <Pressable
                  style={styles.menuItem}
                  onPress={() => handleMenuNavigation("Reports", true)}
                >
                  <Ionicons
                    name="bar-chart-outline"
                    size={22}
                    color={healthColors.text.primary}
                  />
                  <Text style={styles.menuItemText}>Reports & Analytics</Text>
                  <Ionicons
                    name="chevron-forward"
                    size={20}
                    color={healthColors.text.secondary}
                  />
                </Pressable>
              </View>

              {/* System Stats */}
              <View style={styles.menuSection}>
                <Text style={styles.menuSectionTitle}>SYSTEM STATS</Text>

                <View style={styles.menuStatCard}>
                  <Ionicons
                    name="people"
                    size={20}
                    color={healthColors.primary.main}
                  />
                  <View style={styles.menuStatContent}>
                    <Text style={styles.menuStatLabel}>Active Users</Text>
                    <Text style={styles.menuStatValue}>
                      {stats.doctors.active + stats.patients.total}
                    </Text>
                  </View>
                </View>

                <View style={styles.menuStatCard}>
                  <Ionicons
                    name="calendar"
                    size={20}
                    color={healthColors.success.main}
                  />
                  <View style={styles.menuStatContent}>
                    <Text style={styles.menuStatLabel}>
                      Today's Appointments
                    </Text>
                    <Text style={styles.menuStatValue}>
                      {stats.appointments.today}
                    </Text>
                  </View>
                </View>

                <View style={styles.menuStatCard}>
                  <Ionicons
                    name="cash"
                    size={20}
                    color={healthColors.warning.main}
                  />
                  <View style={styles.menuStatContent}>
                    <Text style={styles.menuStatLabel}>Today's Revenue</Text>
                    <Text style={styles.menuStatValue}>
                      ₹{stats.revenue.today.toLocaleString()}
                    </Text>
                  </View>
                </View>
              </View>

              {/* System Settings */}
              <View style={styles.menuSection}>
                <Text style={styles.menuSectionTitle}>SYSTEM SETTINGS</Text>

                <Pressable
                  style={styles.menuItem}
                  onPress={() => handleMenuNavigation("Settings", true)}
                >
                  <Ionicons
                    name="settings-outline"
                    size={22}
                    color={healthColors.text.primary}
                  />
                  <Text style={styles.menuItemText}>Settings</Text>
                  <Ionicons
                    name="chevron-forward"
                    size={20}
                    color={healthColors.text.secondary}
                  />
                </Pressable>

                <Pressable style={styles.menuItem} onPress={handleProfileOpen}>
                  <Ionicons
                    name="person-outline"
                    size={22}
                    color={healthColors.text.primary}
                  />
                  <Text style={styles.menuItemText}>Profile</Text>
                  <Ionicons
                    name="chevron-forward"
                    size={20}
                    color={healthColors.text.secondary}
                  />
                </Pressable>
              </View>

              {/* Account */}
              <View style={styles.menuSection}>
                <Text style={styles.menuSectionTitle}>ACCOUNT</Text>

                <Pressable
                  style={[styles.menuItem, styles.menuItemDanger]}
                  onPress={() => {
                    closeMenu();
                    setTimeout(() => {
                      handleLogout();
                    }, 100);
                  }}
                >
                  <Ionicons
                    name="log-out-outline"
                    size={22}
                    color={healthColors.error.main}
                  />
                  <Text style={styles.menuItemTextDanger}>Logout</Text>
                </Pressable>
              </View>

              {/* Footer */}
              <View style={styles.menuFooter}>
                <Text style={styles.menuFooterText}>AayuCare Admin v1.0.0</Text>
                <Text style={styles.menuFooterText}>
                  © 2024 AayuCare Health
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: getScreenPadding(),
    paddingVertical: 12,
    backgroundColor: healthColors.background.card,
    borderBottomWidth: 2,
    borderBottomColor: healthColors.border.light,
  },
  menuButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: theme.typography.weights.bold,
    color: healthColors.text.primary,
    flex: 1,
    marginLeft: 12,
  },
  headerRight: {
    flexDirection: "row",
    gap: 8,
  },
  iconButton: {
    padding: 4,
    position: "relative",
  },
  notificationDot: {
    position: "absolute",
    top: 2,
    right: 2,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: healthColors.error.main,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: healthColors.background.primary,
  },
  notificationDotText: {
    fontSize: 10,
    fontWeight: theme.typography.weights.bold,
    color: "white",
  },
  // Welcome Banner Styles
  welcomeBanner: {
    paddingHorizontal: getScreenPadding(),
    paddingVertical: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 24, // spacing.lg for section separation
  },
  welcomeContent: {
    flex: 1,
  },
  timeGreeting: {
    fontSize: 12,
    fontWeight: theme.typography.weights.medium,
    color: "rgba(255,255,255,0.9)",
    marginBottom: 4,
    letterSpacing: 0.3,
  },
  welcomeGreeting: {
    fontSize: 20,
    fontWeight: theme.typography.weights.bold,
    color: "white",
    marginBottom: 8,
  },
  roleInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  roleInfoText: {
    fontSize: 14,
    fontWeight: theme.typography.weights.medium,
    color: "rgba(255,255,255,0.95)",
    letterSpacing: 0.3,
  },
  roleDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.8)",
  },
  // Legacy styles (kept for compatibility)
  welcomeName: {
    fontSize: 26,
    fontWeight: theme.typography.weights.bold,
    color: "white",
    marginBottom: 8,
  },
  roleBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  roleText: {
    fontSize: 11,
    fontWeight: theme.typography.weights.semiBold,
    color: "white",
    letterSpacing: 0.5,
  },
  logoutButton: {
    padding: 8,
  },
  logoutIconWrapper: {
    backgroundColor: "rgba(255,255,255,0.2)",
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: "center",
    alignItems: "center",
  },
  // System Health Banner
  healthBanner: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 12,
    gap: 10,
    borderWidth: 2,
    borderColor: healthColors.border.light,
  },
  healthText: {
    flex: 1,
    fontSize: 14,
    fontWeight: theme.typography.weights.semiBold,
  },
  healthButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: "rgba(255,255,255,0.9)",
  },
  healthButtonText: {
    fontSize: 12,
    fontWeight: theme.typography.weights.semiBold,
  },
  section: {
    paddingHorizontal: getScreenPadding(),
    marginBottom: 20,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 14,
  },
  sectionTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: theme.typography.weights.bold,
    color: healthColors.text.primary,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: theme.typography.weights.semiBold,
    color: healthColors.primary.main,
  },
  // Statistics Cards
  statCardsContainer: {
    paddingRight: getScreenPadding(),
  },
  statCardWrapper: {
    width: width * 0.7,
    marginRight: 16,
  },
  statCard: {
    borderRadius: 16,
    padding: 20,
    minHeight: 160,
    justifyContent: "space-between",
  },
  statCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  statIconContainer: {
    backgroundColor: "rgba(255,255,255,0.3)",
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  trendContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255,255,255,0.3)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8, // Standard small border radius
  },
  trendText: {
    fontSize: 12,
    fontWeight: theme.typography.weights.bold,
    color: "white",
  },
  statValue: {
    fontSize: 36,
    fontWeight: "800",
    color: "white",
    marginBottom: 4,
  },
  statTitle: {
    fontSize: 15,
    fontWeight: theme.typography.weights.semiBold,
    color: "white",
    marginBottom: 4,
  },
  statSubtitle: {
    fontSize: 12,
    color: "rgba(255,255,255,0.8)",
  },
  // Action Section
  actionSection: {
    paddingHorizontal: getScreenPadding(),
    marginBottom: 24, // spacing.lg for consistent section separation
  },
  actionSectionTitle: {
    fontSize: 14,
    fontWeight: theme.typography.weights.bold,
    color: healthColors.text.primary,
    marginBottom: 12,
    letterSpacing: 0.3,
  },
  actionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  actionCard: {
    width: (width - getScreenPadding() * 2 - 12) / 2,
    backgroundColor: healthColors.background.card,
    borderRadius: 12, // Standard medium border radius
    padding: 16,
    alignItems: "center",
    borderWidth: 1, // Reduced from 2 for subtlety
    borderColor: healthColors.border.light,
    minHeight: 140,
  },
  actionIconWrapper: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
    position: "relative",
  },
  actionBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: healthColors.error.main,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 6,
    borderWidth: 2,
    borderColor: healthColors.background.card,
  },
  actionBadgeText: {
    fontSize: 10,
    fontWeight: theme.typography.weights.bold,
    color: "white",
  },
  actionTitle: {
    fontSize: 13,
    fontWeight: theme.typography.weights.semiBold,
    color: healthColors.text.primary,
    textAlign: "center",
    minHeight: 34,
  },
  // Recent Activities
  activitiesCard: {
    backgroundColor: healthColors.background.card,
    borderRadius: 14,
    padding: 18,
    borderWidth: 2,
    borderColor: healthColors.border.light,
  },
  activityItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: healthColors.border.light,
  },
  activityIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: healthColors.primary.main + "15",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityText: {
    fontSize: 14,
    fontWeight: theme.typography.weights.medium,
    color: healthColors.text.primary,
    marginBottom: 4,
    lineHeight: 20,
  },
  activityTime: {
    fontSize: 12,
    color: healthColors.text.secondary,
  },
  // Empty State
  emptyState: {
    alignItems: "center",
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: theme.typography.weights.semiBold,
    color: healthColors.text.secondary,
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 13,
    color: healthColors.text.disabled,
    marginTop: 4,
    textAlign: "center",
  },
  // Loading State
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
  },
  loadingText: {
    fontSize: 15,
    fontWeight: theme.typography.weights.medium,
    color: healthColors.text.secondary,
  },
  // Profile View Styles
  profileContainer: {
    flex: 1,
    backgroundColor: healthColors.background.secondary,
  },
  profileHeader: {
    alignItems: "center",
    paddingTop: verticalScale(30),
    paddingBottom: verticalScale(30),
    paddingHorizontal: getScreenPadding(),
  },
  profileAvatarContainer: {
    marginBottom: verticalScale(16),
  },
  profileAvatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 4,
    borderColor: "rgba(255,255,255,0.3)",
  },
  profileName: {
    fontSize: 24,
    fontWeight: theme.typography.weights.bold,
    color: "white",
    marginBottom: verticalScale(4),
  },
  profileEmail: {
    fontSize: 14,
    color: "rgba(255,255,255,0.9)",
    marginBottom: verticalScale(12),
  },
  profileRoleBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },
  profileRoleText: {
    fontSize: 12,
    fontWeight: theme.typography.weights.bold,
    color: "white",
    letterSpacing: 1,
  },
  profileSection: {
    paddingHorizontal: getScreenPadding(),
    marginTop: verticalScale(20),
  },
  profileSectionTitle: {
    fontSize: 16,
    fontWeight: theme.typography.weights.bold,
    color: healthColors.text.primary,
    marginBottom: 12,
    letterSpacing: 0.3,
  },
  profileCard: {
    backgroundColor: healthColors.background.card,
    borderRadius: 14,
    padding: 16,
    borderWidth: 2,
    borderColor: healthColors.border.light,
  },
  profileInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
  },
  profileInfoContent: {
    flex: 1,
    marginLeft: 16,
  },
  profileInfoLabel: {
    fontSize: 12,
    color: healthColors.text.secondary,
    marginBottom: 4,
  },
  profileInfoValue: {
    fontSize: 15,
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
    paddingVertical: 14,
    gap: 12,
  },
  profileActionText: {
    flex: 1,
    fontSize: 15,
    fontWeight: theme.typography.weights.medium,
    color: healthColors.text.primary,
  },
  logoutButtonProfile: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: healthColors.background.card,
    paddingVertical: 16,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: healthColors.error.main,
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: theme.typography.weights.semiBold,
    color: healthColors.error.main,
  },
  // Menu Styles
  menuOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-start",
  },
  menuDrawer: {
    width: "80%",
    maxWidth: 320,
    height: "100%",
    backgroundColor: "white",
    borderTopRightRadius: 20,
    borderBottomRightRadius: 20,
    borderWidth: 2,
    borderLeftWidth: 0,
    borderColor: healthColors.border.light,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  menuHeader: {
    padding: 16,
    paddingTop: 48,
    paddingBottom: 24,
    borderTopRightRadius: 16, // Standard border radius
  },
  menuProfileSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
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
    top: 50,
    right: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.25)",
    justifyContent: "center",
    alignItems: "center",
  },
  menuContent: {
    flex: 1,
  },
  menuSection: {
    paddingVertical: 16,
    paddingHorizontal: 16, // spacing.md for consistency
    borderBottomWidth: 1,
    borderBottomColor: healthColors.background.secondary,
  },
  menuSectionTitle: {
    fontSize: 10,
    fontWeight: theme.typography.weights.bold,
    color: healthColors.text.secondary,
    marginBottom: 12,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 12,
    marginBottom: 8, // spacing.sm for better separation
    minHeight: 48, // Enforce minimum touch target
  },
  menuItemText: {
    flex: 1,
    fontSize: 15,
    fontWeight: theme.typography.weights.medium,
    color: healthColors.text.primary,
  },
  menuItemDanger: {
    backgroundColor: "rgba(244, 67, 54, 0.05)",
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
    borderRadius: 12, // Standard medium border radius
    gap: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: healthColors.border.light,
  },
  menuStatContent: {
    flex: 1,
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
    padding: 16,
    alignItems: "center",
    marginTop: 24, // spacing.lg
  },
  menuFooterText: {
    fontSize: 12,
    color: healthColors.text.secondary,
    marginBottom: 4,
  },
});

export default AdminHomeScreen;



