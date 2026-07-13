/**
 * Doctor Profile View Screen (Patient)
 * Displays a doctor profile summary before booking.
 */

import React, { useMemo } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import {
  ArrowLeft,
  Banknote,
  BriefcaseMedical,
  CalendarClock,
  Star,
  User,
  Video,
} from "lucide-react-native";
import { theme, healthColors } from "@/theme";
import {
  Card,
  Button,
  NetworkStatusIndicator,
  SectionHeader,
} from "@/components/common";
import { getScreenPadding } from "@/utils/responsive";
import { formatCurrency } from "@/utils/helpers";
import { handleSmartBack } from "@/utils/navigation";
import Routes from "@/navigation/routes";

const asText = (value, fallback = "N/A") => {
  if (value == null) return fallback;
  if (typeof value === "string") return value.trim() || fallback;
  if (typeof value === "number")
    return Number.isFinite(value) ? String(value) : fallback;
  if (Array.isArray(value)) {
    const items = value
      .map((item) => String(item || "").trim())
      .filter(Boolean);
    return items.length ? items.join(", ") : fallback;
  }
  if (typeof value === "object") {
    const items = Object.values(value)
      .map((item) => String(item || "").trim())
      .filter(Boolean);
    return items.length ? items.join(", ") : fallback;
  }
  return fallback;
};

const EMPTY_OBJ = {};

const DoctorProfileViewScreen = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const doctor = route?.params?.doctor || EMPTY_OBJ;
  const doctorId = doctor?.id;

  const specialty = useMemo(
    () =>
      asText(doctor?.specialization || doctor?.specialty, "General Medicine"),
    [doctor]
  );

  const experience = useMemo(() => {
    const raw = doctor?.experience;
    if (typeof raw === "number" && Number.isFinite(raw)) return `${raw} years`;
    if (typeof raw === "string" && raw.trim()) return raw;
    return "Experience unavailable";
  }, [doctor]);

  return (
    <SafeAreaView style={styles.container} edges={["left", "right", "bottom"]}>
      <NetworkStatusIndicator />

      <View
        style={[styles.header, { paddingTop: insets.top + theme.spacing.xs }]}
      >
        <TouchableOpacity
          onPress={() => handleSmartBack(navigation, "SpecialistCareFinder")}
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <ArrowLeft
            size={theme.iconSizes.md}
            color={healthColors.text.primary}
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          Doctor Profile
        </Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Card style={styles.profileCard}>
          <View style={styles.avatarWrap}>
            <User size={theme.iconSizes.lg} color={healthColors.primary.main} />
          </View>
          <Text style={styles.nameText} numberOfLines={2}>
            {asText(doctor?.name, "Doctor")}
          </Text>
          <Text style={styles.subText} numberOfLines={1}>
            {specialty}
          </Text>
        </Card>

        <Card>
          <SectionHeader title="Professional Summary" />
          <View style={styles.infoRow}>
            <BriefcaseMedical size={18} color={healthColors.primary.main} />
            <Text style={styles.infoLabel}>Experience</Text>
            <Text style={styles.infoValue}>{experience}</Text>
          </View>
          <View style={styles.infoRow}>
            <Star size={18} color={theme.colors.warning.main} />
            <Text style={styles.infoLabel}>Rating</Text>
            <Text style={styles.infoValue}>
              {asText(doctor?.rating, "N/A")}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Banknote size={18} color={healthColors.success.main} />
            <Text style={styles.infoLabel}>Consultation Fee</Text>
            <Text style={styles.infoValue}>
              {formatCurrency(doctor?.consultationFee || doctor?.fee || 0)}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Video size={18} color={healthColors.info.main} />
            <Text style={styles.infoLabel}>Telemedicine</Text>
            <Text style={styles.infoValue}>
              {doctor?.telemedicine || doctor?.hasTelemedicine
                ? "Available"
                : "Not available"}
            </Text>
          </View>
        </Card>

        <Button
          title="Book Appointment"
          onPress={() =>
            navigation.navigate(Routes.PATIENT.APPOINTMENT_BOOKING, {
              doctorId,
              doctorName: doctor?.name,
              specialization: specialty,
            })
          }
          style={styles.bookButton}
          icon={<CalendarClock size={16} color={healthColors.text.white} />}
        />
      </ScrollView>
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
    paddingHorizontal: getScreenPadding(),
    paddingBottom: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: healthColors.border.light,
    backgroundColor: healthColors.background.card,
  },
  backButton: {
    width: theme.touchTargets.md,
    height: theme.touchTargets.md,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: theme.typography.sizes.h5,
    fontWeight: theme.typography.weights.bold,
    color: healthColors.text.primary,
  },
  content: {
    paddingHorizontal: getScreenPadding(),
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.xl,
    gap: theme.spacing.md,
  },
  profileCard: {
    alignItems: "center",
    gap: theme.spacing.xs,
  },
  avatarWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.withOpacity(healthColors.primary.main, 0.15),
  },
  nameText: {
    textAlign: "center",
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.bold,
    color: healthColors.text.primary,
  },
  subText: {
    fontSize: theme.typography.sizes.bodyMedium,
    color: healthColors.text.secondary,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
  },
  infoLabel: {
    flex: 1,
    fontSize: theme.typography.sizes.bodyMedium,
    color: healthColors.text.secondary,
  },
  infoValue: {
    fontSize: theme.typography.sizes.bodyMedium,
    color: healthColors.text.primary,
    fontWeight: theme.typography.weights.semibold,
  },
  bookButton: {
    marginTop: theme.spacing.xs,
  },
});

export default DoctorProfileViewScreen;
