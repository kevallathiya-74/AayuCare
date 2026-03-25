/**
 * Women's Health Hub Screen
 * Menstrual tracker, pregnancy care, mental wellness
 */

import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  Linking,
  Platform,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { ArrowLeft, Flower, Calendar, BarChart2, Lightbulb, Heart, Activity, List, CheckCircle, BriefcaseMedical, Cross, HeartPulse, Phone, XCircle, ChevronRight, Music } from "lucide-react-native";
import { theme, healthColors } from "../../theme";
import {
  getScreenPadding,
  verticalScale,
} from "../../utils/responsive";
import NetworkStatusIndicator from "../../components/common/NetworkStatusIndicator";
import ErrorRecovery from "../../components/common/ErrorRecovery";
import { showError, logError } from "../../utils/errorHandler";
import { useNetworkStatus } from "../../utils/offlineHandler";
import { getItem, setItem } from "../../utils/appStorage";
import { handleSmartBack } from "../../utils/navigation";

const BABY_SIZES = [
  "(too early)", "(too early)", "(too early)", "(too early)",
  "🫘 Poppy seed", "🍎 Apple seed", "🫐 Blueberry", "🫐 Raspberry",
  "🫘 Kidney bean", "🍇 Grape", "🍊 Kumquat", "🍋 Fig",
  "🍋 Lime", "🫑 Lemon", "🍋 Peach", "🍎 Apple",
  "🥑 Avocado", "🥦 Turnip", "🥔 Sweet potato", "🥭 Mango",
  "🍌 Banana", "🌽 Corn", "🥕 Carrot", "🥭 Large mango",
  "🌽 Ear of corn", "🥦 Cauliflower", "🥬 Lettuce head", "🥒 Cucumber",
  "🍆 Eggplant", "🥦 Butternut squash", "🥥 Coconut", "🍍 Pineapple",
  "🥬 Napa cabbage", "🥬 Large cabbage", "🥬 Honeydew melon", "🎃 Small pumpkin",
  "🥬 Swiss chard bunch", "🥬 Winter melon", "🎃 Mini pumpkin", "🥬 Watermelon",
];

const getCycleInsight = (day, cycleDays) => {
  if (day <= 5) return "Menstruation phase. Rest and stay hydrated.";
  if (day <= Math.floor(cycleDays * 0.45)) return "Follicular phase. Energy rising — great for new activities!";
  if (day === Math.floor(cycleDays * 0.5)) return "Ovulation day. You may feel more energetic and social.";
  return "Luteal phase. Practice self-care and manage stress.";
};

const WomensHealthScreen = ({ navigation }) => {
  const [cycleSettings, setCycleSettings] = useState({ lastPeriodDate: null, cycleDays: 28 });
  const [pregnancySettings, setPregnancySettings] = useState({ startDate: null, totalWeeks: 40 });
  const [cycleModalVisible, setCycleModalVisible] = useState(false);
  const [editLastPeriod, setEditLastPeriod] = useState("");
  const [editCycleDays, setEditCycleDays] = useState("28");
  const [error, setError] = useState(null);
  const { isConnected } = useNetworkStatus();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    const loadData = async () => {
      try {
        const cycleRaw = await getItem("womens_health_cycle");
        if (cycleRaw) setCycleSettings(JSON.parse(cycleRaw));
        const pregRaw = await getItem("womens_health_pregnancy");
        if (pregRaw) setPregnancySettings(JSON.parse(pregRaw));
      } catch (e) {
        logError(e, { context: "WomensHealthScreen.loadData" });
      }
    };
    loadData();
  }, []);

  const menstrualData = useMemo(() => {
    const today = new Date();
    const last = cycleSettings.lastPeriodDate ? new Date(cycleSettings.lastPeriodDate) : null;
    const daysSince = last ? Math.floor((today - last) / 86400000) : 11;
    const cycleDays = cycleSettings.cycleDays || 28;
    const currentDay = (daysSince % cycleDays) + 1;
    const nextPeriod = cycleDays - currentDay;
    return {
      currentDay,
      cycleDays,
      nextPeriod: nextPeriod < 0 ? 0 : nextPeriod,
      insight: getCycleInsight(currentDay, cycleDays),
    };
  }, [cycleSettings]);

  const pregnancyData = useMemo(() => {
    const today = new Date();
    const start = pregnancySettings.startDate ? new Date(pregnancySettings.startDate) : null;
    const week = start ? Math.min(Math.floor((today - start) / (86400000 * 7)), 40) : 24;
    const totalWeeks = pregnancySettings.totalWeeks || 40;
    const weeksLeft = totalWeeks - week;
    const dueDate = start
      ? new Date(start.getTime() + totalWeeks * 7 * 86400000)
      : null;
    const dueDateStr = dueDate
      ? dueDate.toLocaleDateString("en-IN", { day: "numeric", month: "short" })
      : "Not set";
    return {
      week,
      totalWeeks,
      babySize: BABY_SIZES[Math.min(week, BABY_SIZES.length - 1)] || "🥭 Mango",
      tips: ["Prenatal vitamin intake", "Gentle yoga exercises", "Stay well hydrated"],
      nextCheckup: weeksLeft <= 4 ? "Weekly checkups" : dueDateStr,
    };
  }, [pregnancySettings]);

  const openCycleModal = () => {
    const lastStr = cycleSettings.lastPeriodDate
      ? new Date(cycleSettings.lastPeriodDate).toISOString().split("T")[0]
      : "";
    setEditLastPeriod(lastStr);
    setEditCycleDays(String(cycleSettings.cycleDays || 28));
    setCycleModalVisible(true);
  };

  const saveCycleData = async () => {
    const lastDate = new Date(editLastPeriod);
    if (!editLastPeriod || isNaN(lastDate.getTime())) {
      Alert.alert("Invalid Date", "Please enter a valid date in YYYY-MM-DD format.");
      return;
    }
    const days = parseInt(editCycleDays, 10);
    if (isNaN(days) || days < 20 || days > 45) {
      Alert.alert("Invalid Cycle", "Cycle length must be between 20 and 45 days.");
      return;
    }
    try {
      const data = { lastPeriodDate: lastDate.toISOString(), cycleDays: days };
      await setItem("womens_health_cycle", JSON.stringify(data));
      setCycleSettings(data);
      setCycleModalVisible(false);
    } catch (e) {
      logError(e, { context: "WomensHealthScreen.saveCycleData" });
      showError("Failed to save cycle data");
    }
  };

  const handleWellnessActivity = (activity) => {
    if (activity.name === "Counseling Support") {
      Linking.openURL("tel:1091").catch(() =>
        Alert.alert("Helpline", "Women's Helpline: 1091")
      );
    } else if (activity.name === "Breathing Exercises") {
      Alert.alert(
        "Breathing Exercise",
        "Breathe in for 4 seconds → Hold for 4 seconds → Breathe out for 6 seconds.\n\nRepeat 5 times for best results."
      );
    } else if (activity.name === "Guided Meditation") {
      Alert.alert(
        "Guided Meditation",
        "Find a quiet space, close your eyes, and focus on your breath.\n\nSuggested apps: Calm, Headspace, or Insight Timer."
      );
    }
  };

  const mentalWellnessActivities = [
    { icon: Activity, name: "Breathing Exercises", duration: "5 min", color: theme.colors.success.main },
    { icon: Music, name: "Guided Meditation", duration: "10 min", color: theme.colors.healthcare.purple },
    { icon: Phone, name: "Counseling Support", action: "Call Now", color: theme.colors.error.main },
  ];

  const handleRetry = () => {
    setError(null);
  };

  if (error) {
    return (
      <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
        <NetworkStatusIndicator />
        <ErrorRecovery
          error={error}
          onRetry={handleRetry}
          onDismiss={() => setError(null)}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <NetworkStatusIndicator />
      {/* Header */}
      <LinearGradient
        colors={[theme.colors.healthcare.pink, theme.colors.healthcare.pink]}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <TouchableOpacity onPress={() => handleSmartBack(navigation, "PatientTabs")}>
          <ArrowLeft  size={24} color={theme.colors.white} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Flower  size={32} color={theme.colors.white} />
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>Women's Health</Text>
            <Text style={styles.headerSubtitle}>
              Personalized care for women
            </Text>
          </View>
        </View>
        <TouchableOpacity onPress={openCycleModal}>
          <Calendar  size={24} color={theme.colors.white} />
        </TouchableOpacity>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: Math.max(insets.bottom, 20) },
        ]}
      >
        {/* Menstrual Tracker */}
        <View style={styles.section}>
          <View style={styles.sectionTitleContainer}>
            <Calendar
              
              size={20}
              color={healthColors.primary.main}
            />
            <Text style={styles.sectionTitle}>MENSTRUAL TRACKER</Text>
          </View>
          <View style={styles.card}>
            <View style={styles.cycleInfo}>
              <Text style={styles.cycleText}>
                Current Cycle: Day {menstrualData.currentDay} of{" "}
                {menstrualData.cycleDays}
              </Text>
              <Text style={styles.nextPeriodText}>
                Next Period: {menstrualData.nextPeriod} days
              </Text>
            </View>

            {/* Cycle Progress */}
            <View style={styles.cycleProgress}>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${(menstrualData.currentDay / menstrualData.cycleDays) * 100}%`,
                      backgroundColor: healthColors.primary.main,
                    },
                  ]}
                />
              </View>
            </View>

            <TouchableOpacity style={styles.calendarButton} onPress={openCycleModal}>
              <BarChart2  size={18} color={theme.colors.healthcare.pink} />
              <Text style={styles.calendarButtonText}>View Full Calendar</Text>
              <ChevronRight  size={16} color={theme.colors.healthcare.pink} />
            </TouchableOpacity>

            <View style={styles.insightBox}>
              <Lightbulb  size={20} color={theme.colors.warning.light} />
              <View style={styles.insightContent}>
                <Text style={styles.insightTitle}>Today's Insight:</Text>
                <Text style={styles.insightText}>{menstrualData.insight}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Pregnancy Care */}
        <View style={styles.section}>
          <View style={styles.sectionTitleContainer}>
            <Heart
              
              size={20}
              color={healthColors.primary.main}
            />
            <Text style={styles.sectionTitle}>PREGNANCY CARE</Text>
          </View>
          <View style={styles.card}>
            <View style={styles.pregnancyHeader}>
              <Text style={styles.pregnancyWeek}>
                Week {pregnancyData.week} of {pregnancyData.totalWeeks}
              </Text>
              <View style={styles.babySizeContainer}>
                <Activity
                  
                  size={18}
                  color={healthColors.text.secondary}
                />
                <Text style={styles.babySize}>Baby Size: {pregnancyData.babySize}</Text>
              </View>
            </View>

            <View style={styles.tipsSection}>
              <View style={styles.tipsHeader}>
                <List
                  
                  size={18}
                  color={healthColors.text.primary}
                />
                <Text style={styles.tipsTitle}>This Week's Tips:</Text>
              </View>
              {pregnancyData.tips.map((tip, index) => (
                <View key={index} style={styles.tipItem}>
                  <CheckCircle
                    
                    size={16}
                    color={healthColors.success.main}
                  />
                  <Text style={styles.tipText}>{tip}</Text>
                </View>
              ))}
            </View>

            <View style={styles.checkupInfo}>
              <View style={styles.checkupRow}>
                <BriefcaseMedical  size={20} color={theme.colors.healthcare.pink} />
                <Text style={styles.checkupText}>
                  Next Checkup: {pregnancyData.nextCheckup}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.scheduleButton}
                onPress={() =>
                  Alert.alert(
                    "Immunization Schedule",
                    "Recommended vaccines during pregnancy:\n\n• Tdap (28-36 weeks)\n• Flu vaccine (any trimester)\n• COVID-19 booster (safe anytime)\n\nConsult your OB-GYN for a personalised schedule."
                  )
                }
              >
                <Cross  size={18} color={theme.colors.healthcare.pink} />
                <Text style={styles.scheduleButtonText}>
                  Immunization Schedule
                </Text>
                <ChevronRight  size={16} color={theme.colors.healthcare.pink} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Mental Wellness */}
        <View style={styles.section}>
          <View style={styles.sectionTitleContainer}>
            <HeartPulse
              
              size={20}
              color={healthColors.primary.main}
            />
            <Text style={styles.sectionTitle}>MENTAL WELLNESS</Text>
          </View>
          <View style={styles.card}>
            {mentalWellnessActivities.map((activity) => {
              const WellnessIcon = activity.icon;
              return (
              <TouchableOpacity
                key={activity.name}
                style={styles.activityItem}
                onPress={() => handleWellnessActivity(activity)}
              >
                <View
                  style={[
                    styles.activityIcon,
                    { backgroundColor: activity.color + "20" },
                  ]}
                >
                  <WellnessIcon size={24} color={activity.color} />
                </View>
                <View style={styles.activityInfo}>
                  <Text style={styles.activityName}>{activity.name}</Text>
                  <Text style={styles.activityDuration}>
                    {activity.duration || activity.action}
                  </Text>
                </View>
                {activity.action ? (
                  <LinearGradient
                    colors={[activity.color, activity.color + "DD"]}
                    style={styles.actionButton}
                  >
                    <Text style={styles.actionButtonText}>
                      {activity.action}
                    </Text>
                  </LinearGradient>
                ) : (
                  <ChevronRight size={28} color={activity.color} />
                )}
              </TouchableOpacity>
            )})}
          </View>
        </View>

        {/* Emergency Contact */}
        <TouchableOpacity
          style={styles.emergencyButton}
          onPress={() =>
            Linking.openURL("tel:1091").catch(() =>
              Alert.alert("Women's Helpline", "Call 1091 for support.")
            )
          }
        >
          <LinearGradient
            colors={[theme.colors.error.main, theme.colors.error.dark]}
            style={styles.emergencyGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Phone  size={24} color={theme.colors.white} />
            <Text style={styles.emergencyText}>Women's Helpline: 1091</Text>
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>

      {/* Cycle Settings Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={cycleModalVisible}
        onRequestClose={() => setCycleModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Menstrual Cycle Settings</Text>
              <TouchableOpacity onPress={() => setCycleModalVisible(false)}>
                <XCircle  size={28} color="#888" />
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Last Period Start Date (YYYY-MM-DD)</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. 2025-07-01"
                value={editLastPeriod}
                onChangeText={setEditLastPeriod}
                keyboardType="numbers-and-punctuation"
                maxLength={10}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Cycle Length (days, 20–45)</Text>
              <TextInput
                style={styles.textInput}
                placeholder="28"
                value={editCycleDays}
                onChangeText={setEditCycleDays}
                keyboardType="number-pad"
                maxLength={2}
              />
            </View>

            <TouchableOpacity style={styles.saveButton} onPress={saveCycleData}>
              <Text style={styles.saveButtonText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: healthColors.background.primary,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: getScreenPadding(),
    paddingTop: verticalScale(20),
    paddingBottom: verticalScale(30),
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.md,
    flex: 1,
    marginLeft: theme.spacing.md,
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: theme.typography.sizes.h4,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.white,
  },
  headerSubtitle: {
    fontSize: theme.typography.sizes.bodyMedium,
    color: theme.withOpacity(theme.colors.white, 0.9),
  },
  content: {
    padding: getScreenPadding(),
  },
  section: {
    marginBottom: theme.spacing.xl,
  },
  sectionTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: theme.typography.sizes.bodyLarge,
    fontWeight: theme.typography.weights.bold,
    color: healthColors.text.primary,
  },
  card: {
    backgroundColor: theme.colors.white,
    borderRadius: 16,
    padding: theme.spacing.lg,
    borderWidth: 2,
    borderColor: healthColors.border.light,
  },
  cycleInfo: {
    marginBottom: theme.spacing.md,
  },
  cycleText: {
    fontSize: theme.typography.sizes.bodyLarge,
    fontWeight: theme.typography.weights.semibold,
    color: healthColors.text.primary,
    marginBottom: 4,
  },
  nextPeriodText: {
    fontSize: theme.typography.sizes.bodyMedium,
    color: healthColors.text.secondary,
  },
  cycleProgress: {
    marginBottom: theme.spacing.md,
  },
  progressBar: {
    height: 12,
    backgroundColor: healthColors.background.tertiary,
    borderRadius: 6,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
  },
  calendarButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  calendarButtonText: {
    fontSize: theme.typography.sizes.bodyMedium,
    color: theme.colors.healthcare.pink,
    fontWeight: theme.typography.weights.medium,
  },
  insightBox: {
    flexDirection: "row",
    backgroundColor: healthColors.background.secondary,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    gap: theme.spacing.sm,
  },
  insightContent: {
    flex: 1,
  },
  insightTitle: {
    fontSize: theme.typography.sizes.bodyMedium,
    fontWeight: theme.typography.weights.semibold,
    color: healthColors.text.primary,
    marginBottom: 4,
  },
  insightText: {
    fontSize: theme.typography.sizes.caption,
    color: healthColors.text.secondary,
    lineHeight: 18,
  },
  pregnancyHeader: {
    alignItems: "center",
    marginBottom: theme.spacing.lg,
  },
  pregnancyWeek: {
    fontSize: theme.typography.sizes.h5,
    fontWeight: theme.typography.weights.bold,
    color: healthColors.text.primary,
    marginBottom: 4,
  },
  babySizeContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 4,
  },
  babySize: {
    fontSize: theme.typography.sizes.bodyLarge,
    color: healthColors.text.secondary,
  },
  tipsSection: {
    marginBottom: theme.spacing.lg,
  },
  tipsHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: theme.spacing.sm,
  },
  tipsTitle: {
    fontSize: theme.typography.sizes.bodyMedium,
    fontWeight: theme.typography.weights.semibold,
    color: healthColors.text.primary,
  },
  tipItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: theme.spacing.sm,
    paddingLeft: theme.spacing.sm,
  },
  tipText: {
    flex: 1,
    fontSize: theme.typography.sizes.bodyMedium,
    color: healthColors.text.secondary,
    lineHeight: 20,
  },
  checkupInfo: {
    borderTopWidth: 1,
    borderColor: healthColors.border.light,
    paddingTop: theme.spacing.md,
  },
  checkupRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  checkupText: {
    fontSize: theme.typography.sizes.bodyMedium,
    fontWeight: theme.typography.weights.medium,
    color: healthColors.text.primary,
  },
  scheduleButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: theme.spacing.xs,
    paddingVertical: theme.spacing.sm,
  },
  scheduleButtonText: {
    fontSize: theme.typography.sizes.bodyMedium,
    color: theme.colors.healthcare.pink,
    fontWeight: theme.typography.weights.medium,
  },
  activityItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: theme.spacing.md,
    backgroundColor: healthColors.background.primary,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.sm,
  },
  activityIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginRight: theme.spacing.md,
  },
  activityInfo: {
    flex: 1,
  },
  activityName: {
    fontSize: theme.typography.sizes.bodyMedium,
    fontWeight: theme.typography.weights.semibold,
    color: healthColors.text.primary,
  },
  activityDuration: {
    fontSize: theme.typography.sizes.caption,
    color: healthColors.text.tertiary,
  },
  actionButton: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.small,
  },
  actionButtonText: {
    fontSize: theme.typography.sizes.caption,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.white,
  },
  emergencyButton: {
    borderRadius: theme.borderRadius.md,
    overflow: "hidden",
    marginTop: theme.spacing.lg,
  },
  emergencyGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  emergencyText: {
    fontSize: theme.typography.sizes.bodyLarge,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.white,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: theme.colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: theme.spacing.xl,
    paddingBottom: theme.spacing.xxxxl,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing.xl,
  },
  modalTitle: {
    fontSize: theme.typography.sizes.h5,
    fontWeight: theme.typography.weights.bold,
    color: healthColors.text.primary,
  },
  inputGroup: {
    marginBottom: theme.spacing.lg,
  },
  inputLabel: {
    fontSize: theme.typography.sizes.bodyMedium,
    fontWeight: theme.typography.weights.semibold,
    color: healthColors.text.secondary,
    marginBottom: theme.spacing.xs,
  },
  textInput: {
    borderWidth: 1,
    borderColor: healthColors.border.light,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    fontSize: theme.typography.sizes.bodyMedium,
    color: healthColors.text.primary,
    backgroundColor: healthColors.background.primary,
  },
  saveButton: {
    backgroundColor: theme.colors.healthcare.pink,
    borderRadius: theme.borderRadius.lg,
    paddingVertical: theme.spacing.md,
    alignItems: "center",
    marginTop: theme.spacing.sm,
  },
  saveButtonText: {
    fontSize: theme.typography.sizes.bodyLarge,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.white,
  },
});

export default WomensHealthScreen;



