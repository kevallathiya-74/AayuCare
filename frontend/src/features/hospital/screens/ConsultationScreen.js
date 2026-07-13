/**
 * Consultation Screen
 * Active consultation workspace for doctors.
 * Navigated to from DoctorHomeScreen and TodaysAppointmentsScreen
 * when "Start Consultation" is pressed (appointment status already set to in_progress).
 */

import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useLayoutEffect,
} from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  BackHandler,
  KeyboardAvoidingView,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import {
  ChevronLeft,
  Clock,
  User,
  Calendar,
  Cross,
  FileText,
  UserCircle,
  Activity,
  Clipboard,
  Edit,
} from "lucide-react-native";
import { theme, healthColors } from "@/theme";
import { getScreenPadding, getKeyboardConfig } from "@/utils/responsive";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { doctorService } from "@/services";
import { logError } from "@/utils/errorHandler";
import { Button, Input } from "@/components/common";
import { queryKeys } from "@/config/reactQueryConfig";
import { handleSmartBack } from "@/utils/navigation";
import Routes from "@/navigation/routes";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Format elapsed seconds → "mm:ss" or "h:mm:ss" */
const formatElapsed = (totalSeconds) => {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  const mm = String(m).padStart(2, "0");
  const ss = String(s).padStart(2, "0");
  if (h > 0) return `${h}:${mm}:${ss}`;
  return `${mm}:${ss}`;
};

/** Build a structured notes string from consultation data */
const buildNotesText = ({ vitals, diagnosis, notes }) => {
  const parts = [];

  // Vitals section
  const vitalLines = [];
  if (vitals.bpSystolic || vitals.bpDiastolic) {
    const sys = vitals.bpSystolic || "--";
    const dia = vitals.bpDiastolic || "--";
    vitalLines.push(`Blood Pressure: ${sys}/${dia} mmHg`);
  }
  if (vitals.temperature) {
    vitalLines.push(`Temperature: ${vitals.temperature} °F`);
  }
  if (vitals.pulse) {
    vitalLines.push(`Pulse: ${vitals.pulse} bpm`);
  }
  if (vitalLines.length > 0) {
    parts.push("=== VITALS ===\n" + vitalLines.join("\n"));
  }

  // Diagnosis
  if (diagnosis.trim()) {
    parts.push("=== DIAGNOSIS ===\n" + diagnosis.trim());
  }

  // Notes
  if (notes.trim()) {
    parts.push("=== CONSULTATION NOTES ===\n" + notes.trim());
  }

  return parts.join("\n\n");
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const ConsultationScreen = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const appointment = route?.params?.appointment || {};

  // Appointment fields — tolerate both camelCase and snake_case field names
  const appointmentId = appointment.id || appointment.appointmentId;
  const patientName = appointment.patientName || "Unknown Patient";
  const patientShortId =
    appointment.patientUserId || appointment.patientId || "";
  const patientUUID = appointment.patientUUID || appointment.patientId || "";
  const patientAge = appointment.age || appointment.patientAge || "";
  const reason =
    appointment.reason ||
    appointment.chiefComplaint ||
    appointment.chief_complaint ||
    "";
  const appointmentDate =
    appointment.appointmentDate || appointment.appointment_date || "";
  const appointmentTime =
    appointment.appointmentTime || appointment.appointment_time || "";
  // Timer
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef(null);

  // Form state
  const [vitals, setVitals] = useState({
    bpSystolic: "",
    bpDiastolic: "",
    temperature: "",
    pulse: "",
  });
  const [diagnosis, setDiagnosis] = useState("");
  const [notes, setNotes] = useState("");

  const queryClient = useQueryClient();

  const completeConsultationMutation = useMutation({
    mutationFn: async ({ apptId, formattedNotes }) => {
      await doctorService.updateAppointmentStatus(
        apptId,
        "completed",
        formattedNotes
      );
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.appointments.all,
      });
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      Alert.alert(
        "Consultation Completed",
        `${patientName}'s consultation has been marked as completed.`,
        [
          {
            text: "OK",
            onPress: () => handleSmartBack(navigation, "DoctorTabs"),
          },
        ]
      );
    },
    onError: (err) => {
      logError(err, { context: "ConsultationScreen.handleComplete" });
      Alert.alert(
        "Error",
        "Failed to complete consultation. Please try again."
      );
    },
  });

  // Derived dirty flag — any field has content
  const isDirty =
    vitals.bpSystolic !== "" ||
    vitals.bpDiastolic !== "" ||
    vitals.temperature !== "" ||
    vitals.pulse !== "" ||
    diagnosis !== "" ||
    notes !== "";

  // ---------------------------------------------------------------------------
  // Start timer on mount
  // ---------------------------------------------------------------------------
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setElapsed((prev) => prev + 1);
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // ---------------------------------------------------------------------------
  // Back guard — hardware back (Android)
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const handler = () => {
      if (isDirty) {
        Alert.alert(
          "Leave Consultation?",
          "You have unsaved notes. The appointment is still marked as In Progress. Are you sure you want to leave?",
          [
            { text: "Stay", style: "cancel" },
            {
              text: "Leave",
              style: "destructive",
              onPress: () => handleSmartBack(navigation, "DoctorTabs"),
            },
          ]
        );
        return true; // prevent default back
      }
      return false; // allow default back
    };
    const sub = BackHandler.addEventListener("hardwareBackPress", handler);
    return () => sub.remove();
  }, [isDirty, navigation]);

  // ---------------------------------------------------------------------------
  // Back guard — header back button
  // ---------------------------------------------------------------------------
  useLayoutEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <TouchableOpacity
          onPress={() => {
            if (isDirty) {
              Alert.alert(
                "Leave Consultation?",
                "You have unsaved notes. The appointment is still marked as In Progress. Are you sure you want to leave?",
                [
                  { text: "Stay", style: "cancel" },
                  {
                    text: "Leave",
                    style: "destructive",
                    onPress: () => handleSmartBack(navigation, "DoctorTabs"),
                  },
                ]
              );
            } else {
              handleSmartBack(navigation, "DoctorTabs");
            }
          }}
          style={styles.headerBackButton}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <ChevronLeft size={24} color={healthColors.text.primary} />
        </TouchableOpacity>
      ),
      headerTitle: () => (
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Active Consultation</Text>
          <View style={styles.timerBadge}>
            <Clock size={12} color={healthColors.warning.dark} />
            <Text style={styles.timerText}>{formatElapsed(elapsed)}</Text>
          </View>
        </View>
      ),
    });
  }, [navigation, isDirty, elapsed]);

  // ---------------------------------------------------------------------------
  // Complete consultation
  // ---------------------------------------------------------------------------
  const handleComplete = useCallback(async () => {
    if (!appointmentId) {
      Alert.alert("Error", "Invalid appointment. Cannot complete.");
      return;
    }

    const formattedNotes = buildNotesText({ vitals, diagnosis, notes });

    Alert.alert(
      "Complete Consultation",
      "Mark this consultation as completed?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Complete",
          onPress: async () => {
            await completeConsultationMutation.mutateAsync({
              apptId: appointmentId,
              formattedNotes,
            });
          },
        },
      ]
    );
  }, [appointmentId, vitals, diagnosis, notes, completeConsultationMutation]);

  // ---------------------------------------------------------------------------
  // Navigate to prescription
  // ---------------------------------------------------------------------------
  const handleCreatePrescription = useCallback(() => {
    navigation.navigate(Routes.DOCTOR.CREATE_PRESCRIPTION, {
      patientId: patientShortId || patientUUID,
      appointmentId,
    });
  }, [navigation, patientShortId, patientUUID, appointmentId]);

  // ---------------------------------------------------------------------------
  // Navigate to patient history
  // ---------------------------------------------------------------------------
  const handleViewHistory = useCallback(() => {
    navigation.navigate(Routes.DOCTOR.PATIENT_MANAGEMENT, {
      patientId: patientShortId || patientUUID,
      patientName,
    });
  }, [navigation, patientShortId, patientUUID, patientName]);

  // ---------------------------------------------------------------------------
  // Vitals input helper
  // ---------------------------------------------------------------------------
  const updateVital = useCallback((key, value) => {
    // Allow only digits and single decimal point
    const cleaned = value.replace(/[^0-9.]/g, "");
    setVitals((prev) => ({ ...prev, [key]: cleaned }));
  }, []);

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  const screenPadding = getScreenPadding();

  return (
    <SafeAreaView style={styles.container} edges={["bottom", "left", "right"]}>
      <KeyboardAvoidingView {...getKeyboardConfig()} style={styles.flex}>
        <ScrollView
          style={styles.flex}
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingHorizontal: screenPadding,
              paddingBottom: insets.bottom + 24,
            },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* ── In Progress banner ── */}
          <View style={styles.statusBanner}>
            <View style={styles.statusDot} />
            <Text style={styles.statusBannerText}>In Progress</Text>
            <View style={styles.flex} />
            <Clock size={14} color={healthColors.warning.dark} />
            <Text style={styles.bannerTimer}>{formatElapsed(elapsed)}</Text>
          </View>

          {/* ── Patient info card ── */}
          <View style={styles.patientCard}>
            <View style={styles.patientCardHeader}>
              <View style={styles.avatarCircle}>
                <User size={28} color={healthColors.primary.main} />
              </View>
              <View style={styles.patientMeta}>
                <Text style={styles.patientName}>{patientName}</Text>
                {patientShortId ? (
                  <Text style={styles.patientSub}>ID: {patientShortId}</Text>
                ) : null}
                {patientAge ? (
                  <Text style={styles.patientSub}>Age: {patientAge}</Text>
                ) : null}
              </View>
            </View>

            {/* Appointment info row */}
            <View style={styles.apptInfoRow}>
              {appointmentDate ? (
                <View style={styles.apptInfoItem}>
                  <Calendar size={14} color={healthColors.text.secondary} />
                  <Text style={styles.apptInfoText}>{appointmentDate}</Text>
                </View>
              ) : null}
              {appointmentTime ? (
                <View style={styles.apptInfoItem}>
                  <Clock size={14} color={healthColors.text.secondary} />
                  <Text style={styles.apptInfoText}>{appointmentTime}</Text>
                </View>
              ) : null}
            </View>

            {/* Reason / chief complaint */}
            {reason ? (
              <View style={styles.reasonRow}>
                <Cross size={14} color={healthColors.primary.main} />
                <Text style={styles.reasonText}>{reason}</Text>
              </View>
            ) : null}

            {/* Quick action buttons */}
            <View style={styles.quickActions}>
              <TouchableOpacity
                style={styles.quickActionBtn}
                onPress={handleCreatePrescription}
                accessibilityRole="button"
                accessibilityLabel="Create prescription"
                accessibilityHint="Opens prescription creation for this patient"
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <FileText size={16} color={healthColors.accent.coral} />
                <Text
                  style={[
                    styles.quickActionText,
                    { color: healthColors.accent.coral },
                  ]}
                >
                  Prescription
                </Text>
              </TouchableOpacity>
              <View style={styles.quickActionDivider} />
              <TouchableOpacity
                style={styles.quickActionBtn}
                onPress={handleViewHistory}
                accessibilityRole="button"
                accessibilityLabel="View patient history"
                accessibilityHint="Opens this patient history"
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <UserCircle size={16} color={healthColors.primary.main} />
                <Text
                  style={[
                    styles.quickActionText,
                    { color: healthColors.primary.main },
                  ]}
                >
                  History
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* ── Vitals section ── */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Activity size={18} color={healthColors.primary.main} />
              <Text style={styles.sectionTitle}>Vitals</Text>
              <Text style={styles.sectionOptional}>(optional)</Text>
            </View>

            {/* Blood Pressure */}
            <Text style={styles.fieldLabel}>Blood Pressure (mmHg)</Text>
            <View style={styles.bpRow}>
              <View style={styles.bpInputWrapper}>
                <Input
                  style={styles.bpInputControl}
                  inputStyle={styles.bpInputText}
                  placeholder="Systolic"
                  keyboardType="numeric"
                  value={vitals.bpSystolic}
                  onChangeText={(v) => updateVital("bpSystolic", v)}
                  maxLength={3}
                  accessibilityLabel="Blood pressure systolic"
                />
                <Text style={styles.bpUnit}>sys</Text>
              </View>
              <Text style={styles.bpSlash}>/</Text>
              <View style={styles.bpInputWrapper}>
                <Input
                  style={styles.bpInputControl}
                  inputStyle={styles.bpInputText}
                  placeholder="Diastolic"
                  keyboardType="numeric"
                  value={vitals.bpDiastolic}
                  onChangeText={(v) => updateVital("bpDiastolic", v)}
                  maxLength={3}
                  accessibilityLabel="Blood pressure diastolic"
                />
                <Text style={styles.bpUnit}>dia</Text>
              </View>
            </View>

            {/* Temperature + Pulse row */}
            <View style={styles.vitalRow}>
              <View style={styles.vitalField}>
                <Text style={styles.fieldLabel}>Temp (°F)</Text>
                <Input
                  style={styles.inputControl}
                  inputStyle={styles.inputText}
                  placeholder="e.g. 98.6"
                  keyboardType="decimal-pad"
                  value={vitals.temperature}
                  onChangeText={(v) => updateVital("temperature", v)}
                  maxLength={5}
                  accessibilityLabel="Temperature"
                />
              </View>
              <View style={styles.vitalFieldGap} />
              <View style={styles.vitalField}>
                <Text style={styles.fieldLabel}>Pulse (bpm)</Text>
                <Input
                  style={styles.inputControl}
                  inputStyle={styles.inputText}
                  placeholder="e.g. 72"
                  keyboardType="numeric"
                  value={vitals.pulse}
                  onChangeText={(v) => updateVital("pulse", v)}
                  maxLength={3}
                  accessibilityLabel="Pulse"
                />
              </View>
            </View>
          </View>

          {/* ── Diagnosis section ── */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Clipboard size={18} color={healthColors.primary.main} />
              <Text style={styles.sectionTitle}>Diagnosis</Text>
              <Text style={styles.sectionOptional}>(optional)</Text>
            </View>
            <Input
              style={styles.inputControl}
              inputStyle={styles.inputText}
              placeholder="Enter diagnosis or ICD code..."
              value={diagnosis}
              onChangeText={setDiagnosis}
              maxLength={500}
              autoCapitalize="sentences"
              accessibilityLabel="Diagnosis"
            />
          </View>

          {/* ── Consultation notes section ── */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Edit size={18} color={healthColors.primary.main} />
              <Text style={styles.sectionTitle}>Consultation Notes</Text>
              <Text style={styles.sectionOptional}>(optional)</Text>
            </View>
            <Input
              style={styles.inputControl}
              inputStyle={styles.notesInputText}
              placeholder="Enter consultation notes, observations, treatment plan..."
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={5}
              maxLength={5000}
              autoCapitalize="sentences"
              accessibilityLabel="Consultation notes"
            />
            <Text style={styles.charCount}>{notes.length}/5000</Text>
          </View>

          {/* ── Complete button ── */}
          <Button
            variant="primary"
            size="large"
            fullWidth
            gradient
            loading={completeConsultationMutation.isPending}
            disabled={completeConsultationMutation.isPending}
            onPress={handleComplete}
            style={styles.completeButton}
            accessibilityRole="button"
            accessibilityLabel="Complete consultation"
            accessibilityHint="Marks this consultation as completed"
            title="Complete Consultation"
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

// ---------------------------------------------------------------------------
// Styles — all values from 8-pt grid, all colors from healthColors
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  flex: { flex: 1 },

  container: {
    flex: 1,
    backgroundColor: healthColors.background.secondary,
  },

  scrollContent: {
    paddingTop: 16,
  },

  // ── Header ──
  headerBackButton: {
    minWidth: theme.touchTargets.md,
    minHeight: theme.touchTargets.md,
    justifyContent: "center",
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    marginLeft: 4,
  },
  headerTitleContainer: {
    alignItems: "center",
  },
  headerTitle: {
    fontSize: theme.typography.sizes.bodyLarge,
    fontWeight: "600",
    color: healthColors.text.primary,
  },
  timerBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: healthColors.warning.background,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginTop: 2,
  },
  timerText: {
    fontSize: theme.typography.sizes.caption,
    color: healthColors.warning.dark,
    fontWeight: "600",
  },

  // ── Status banner ──
  statusBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: healthColors.warning.light,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 16,
    gap: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: healthColors.warning.dark,
  },
  statusBannerText: {
    fontSize: theme.typography.sizes.bodyMedium,
    fontWeight: "600",
    color: healthColors.warning.dark,
  },
  bannerTimer: {
    fontSize: theme.typography.sizes.bodyMedium,
    fontWeight: "700",
    color: healthColors.warning.dark,
    marginLeft: 4,
  },

  // ── Patient card ──
  patientCard: {
    backgroundColor: healthColors.background.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: healthColors.shadows.color,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  patientCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  avatarCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: theme.withOpacity(healthColors.primary.main, 0.09),
    alignItems: "center",
    justifyContent: "center",
  },
  patientMeta: { flex: 1 },
  patientName: {
    fontSize: theme.typography.sizes.bodyLarge,
    fontWeight: "700",
    color: healthColors.text.primary,
    marginBottom: 2,
  },
  patientSub: {
    fontSize: theme.typography.sizes.bodyMedium,
    color: healthColors.text.secondary,
  },

  apptInfoRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 8,
  },
  apptInfoItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  apptInfoText: {
    fontSize: theme.typography.sizes.bodyMedium,
    color: healthColors.text.secondary,
  },

  reasonRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
    backgroundColor: healthColors.primary.main + "0D",
    borderRadius: 8,
    padding: 10,
    marginTop: 4,
    marginBottom: 12,
  },
  reasonText: {
    flex: 1,
    fontSize: theme.typography.sizes.bodyMedium,
    color: healthColors.text.primary,
    lineHeight: 18,
  },

  quickActions: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: healthColors.border.light,
    paddingTop: 12,
    marginTop: 4,
  },
  quickActionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 8,
  },
  quickActionText: {
    fontSize: theme.typography.sizes.bodyMedium,
    fontWeight: "500",
  },
  quickActionDivider: {
    width: 1,
    backgroundColor: healthColors.border.light,
    marginHorizontal: 8,
  },

  // ── Section cards ──
  sectionCard: {
    backgroundColor: healthColors.background.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: healthColors.shadows.color,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: theme.typography.sizes.bodyLarge,
    fontWeight: "600",
    color: healthColors.text.primary,
  },
  sectionOptional: {
    fontSize: theme.typography.sizes.bodySmall,
    color: healthColors.text.tertiary,
    marginLeft: 4,
  },

  // ── Form fields ──
  fieldLabel: {
    fontSize: theme.typography.sizes.bodyMedium,
    fontWeight: "500",
    color: healthColors.text.secondary,
    marginBottom: 6,
  },
  inputControl: {
    marginBottom: 0,
    backgroundColor: healthColors.background.secondary,
    borderColor: healthColors.border.light,
  },
  inputText: {
    fontSize: theme.typography.sizes.bodyMedium,
    color: healthColors.text.primary,
  },
  notesInputText: {
    minHeight: 100,
    textAlignVertical: "top",
  },
  charCount: {
    fontSize: theme.typography.sizes.caption,
    color: healthColors.text.tertiary,
    textAlign: "right",
    marginTop: 4,
  },

  // Blood pressure row
  bpRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  bpInputWrapper: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: healthColors.background.secondary,
    borderWidth: 1,
    borderColor: healthColors.border.light,
    borderRadius: 10,
    paddingHorizontal: 12,
    minHeight: 44,
  },
  bpInputControl: {
    flex: 1,
    marginBottom: 0,
    borderWidth: 0,
    backgroundColor: healthColors.background.secondary,
  },
  bpInputText: {
    flex: 1,
    fontSize: theme.typography.sizes.bodyMedium,
    color: healthColors.text.primary,
    paddingVertical: theme.spacing.sm,
  },
  bpUnit: {
    fontSize: theme.typography.sizes.caption,
    color: healthColors.text.tertiary,
  },
  bpSlash: {
    fontSize: theme.typography.sizes.h4,
    color: healthColors.text.secondary,
    fontWeight: "300",
  },

  // Temperature + Pulse row
  vitalRow: {
    flexDirection: "row",
  },
  vitalField: { flex: 1 },
  vitalFieldGap: { width: 12 },

  // ── Complete button ──
  completeButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: healthColors.success.main,
    borderRadius: 12,
    paddingVertical: 14,
    marginTop: 8,
    marginBottom: 8,
    shadowColor: healthColors.success.main,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
});

export default ConsultationScreen;
