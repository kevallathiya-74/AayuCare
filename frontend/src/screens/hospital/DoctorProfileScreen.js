/**
 * Doctor Profile Screen
 * Profile management for doctors
 */

import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useDispatch, useSelector } from "react-redux";
import { theme, healthColors } from "../../theme";
import {
  getScreenPadding,
  verticalScale,
} from "../../utils/responsive";
import Avatar from "../../components/common/Avatar";
import { logoutUser } from "../../store/slices/authSlice";
import { doctorService } from "../../services";
import { logError } from "../../utils/errorHandler";

const DoctorProfileScreen = ({ navigation }) => {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();
  const [stats, setStats] = useState({
    totalPatients: 0,
    rating: 0,
    yearsExperience: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchProfileStats = useCallback(async () => {
    try {
      const response = await doctorService.getProfileStats();
      if (response?.success) {
        setStats({
          totalPatients: response.data.totalPatients || 0,
          rating: response.data.averageRating || 0,
          yearsExperience: response.data.yearsExperience || 0,
        });
      }
    } catch (err) {
      logError(err, "DoctorProfileScreen.fetchProfileStats");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchProfileStats();
  }, [fetchProfileStats]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchProfileStats();
  }, [fetchProfileStats]);

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        onPress: () => dispatch(logoutUser()),
        style: "destructive",
      },
    ]);
  };

  const profileOptions = [
    {
      id: 1,
      title: "Edit Profile",
      icon: "create-outline",
      onPress: () => navigation.navigate("EditProfile"),
    },
    {
      id: 2,
      title: "Schedule & Availability",
      icon: "calendar-outline",
      onPress: () => navigation.navigate("ScheduleAvailability"),
    },
    {
      id: 3,
      title: "Consultation History",
      icon: "time-outline",
      onPress: () => navigation.navigate("ConsultationHistory"),
    },
    {
      id: 4,
      title: "Settings",
      icon: "settings-outline",
      onPress: () => navigation.navigate("Settings"),
    },
    {
      id: 5,
      title: "Help & Support",
      icon: "help-circle-outline",
      onPress: () =>
        Alert.alert(
          "Help & Support",
          "Support feature coming soon! Contact: support@aayucare.com"
        ),
    },
  ];

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={healthColors.background.main}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 20) }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[healthColors.primary.main]}
            tintColor={healthColors.primary.main}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>My Profile</Text>
        </View>

        {/* Profile Card */}
        <View
          style={styles.profileCard}
          accessible={true}
          accessibilityLabel={`Profile of Dr. ${user?.name || "Doctor"}, ${user?.specialization || "Specialist"}`}
        >
          <Avatar size={80} name={user?.name || "Doctor"} />
          <View style={styles.profileInfo}>
            <Text style={styles.doctorName}>{user?.name || "Doctor"}</Text>
            <Text style={styles.specialization}>
              {user?.specialization || "Specialist"} •{" "}
              {user?.department || "OPD"}
            </Text>
            <Text style={styles.doctorId}>
              ID: {user?.userId || user?.employeeId || "DOC001"}
            </Text>
          </View>

          <View style={styles.statsRow}>
            <View
              style={styles.statBox}
              accessible={true}
              accessibilityLabel={`${loading ? "Loading" : stats.totalPatients} patients`}
            >
              {loading ? (
                <ActivityIndicator
                  size="small"
                  color={healthColors.primary.main}
                />
              ) : (
                <Text style={styles.statValue}>{stats.totalPatients}</Text>
              )}
              <Text style={styles.statLabel}>Patients</Text>
            </View>
            <View style={styles.statDivider} />
            <View
              style={styles.statBox}
              accessible={true}
              accessibilityLabel={`${loading ? "Loading" : stats.rating} star rating`}
            >
              {loading ? (
                <ActivityIndicator
                  size="small"
                  color={healthColors.primary.main}
                />
              ) : (
                <Text style={styles.statValue}>{stats.rating.toFixed(1)}</Text>
              )}
              <Text style={styles.statLabel}>Rating</Text>
            </View>
            <View style={styles.statDivider} />
            <View
              style={styles.statBox}
              accessible={true}
              accessibilityLabel={`${loading ? "Loading" : stats.yearsExperience} years of experience`}
            >
              {loading ? (
                <ActivityIndicator
                  size="small"
                  color={healthColors.primary.main}
                />
              ) : (
                <Text style={styles.statValue}>{stats.yearsExperience}</Text>
              )}
              <Text style={styles.statLabel}>Years Exp</Text>
            </View>
          </View>
        </View>

        {/* Options */}
        <View style={styles.optionsSection}>
          {profileOptions.map((option) => (
            <TouchableOpacity
              key={option.id}
              style={styles.optionItem}
              onPress={option.onPress}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={option.title}
            >
              <View style={styles.optionLeft}>
                <View style={styles.optionIconContainer}>
                  <Ionicons
                    name={option.icon}
                    size={22}
                    color={healthColors.primary.main}
                  />
                </View>
                <Text style={styles.optionTitle}>{option.title}</Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={healthColors.text.secondary}
              />
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout Button */}
        <View style={styles.logoutSection}>
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Logout from the app"
          >
            <Ionicons
              name="log-out-outline"
              size={22}
              color={healthColors.error}
            />
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: verticalScale(20) }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: healthColors.background.main,
  },
  header: {
    padding: getScreenPadding(),
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: theme.typography.weights.bold,
    color: healthColors.text.primary,
  },
  profileCard: {
    backgroundColor: healthColors.background.card,
    marginHorizontal: getScreenPadding(),
    marginBottom: verticalScale(20),
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    borderWidth: 2,
    borderColor: healthColors.border.light,
  },
  profileInfo: {
    alignItems: "center",
    marginTop: 16,
    marginBottom: 20,
  },
  doctorName: {
    fontSize: 22,
    fontWeight: theme.typography.weights.bold,
    color: healthColors.text.primary,
    marginBottom: 4,
  },
  specialization: {
    fontSize: 14,
    color: healthColors.text.secondary,
    marginBottom: 4,
  },
  doctorId: {
    fontSize: 12,
    color: healthColors.text.tertiary,
    fontFamily: "monospace",
  },
  statsRow: {
    flexDirection: "row",
    width: "100%",
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: healthColors.border.light,
  },
  statBox: {
    flex: 1,
    alignItems: "center",
  },
  statDivider: {
    width: 1,
    backgroundColor: healthColors.border.light,
  },
  statValue: {
    fontSize: 20,
    fontWeight: theme.typography.weights.bold,
    color: healthColors.primary.main,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: healthColors.text.secondary,
  },
  optionsSection: {
    backgroundColor: healthColors.background.card,
    marginHorizontal: getScreenPadding(),
    marginBottom: verticalScale(20),
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: healthColors.border.light,
  },
  optionItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: healthColors.border.light,
  },
  optionLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  optionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: healthColors.primary.main + "15",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  optionTitle: {
    fontSize: 15,
    fontWeight: theme.typography.weights.semiBold,
    color: healthColors.text.primary,
  },
  logoutSection: {
    paddingHorizontal: getScreenPadding(),
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: healthColors.background.card,
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: healthColors.error,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: theme.typography.weights.semiBold,
    color: healthColors.error,
    marginLeft: 8,
  },
});

export default DoctorProfileScreen;



