import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Linking,
} from "react-native";
import {
  User,
  Clock,
  Calendar,
  CheckCircle,
  XCircle,
  Phone,
  Cross,
  FileText,
  UserCircle,
} from "lucide-react-native";
import { theme, healthColors } from "@/theme";
import Routes from "@/navigation/routes";
import { getStatusStyle } from "@/utils/helpers";

const AppointmentCard = ({
  item,
  selectedFilter,
  getStatusLabel,
  handleStartConsultation,
  handleCreatePrescription,
  handleStatusUpdate,
  navigation,
  normalizeStatus,
  updatingAppointmentId,
  t,
}) => {
  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={`Appointment for ${item.patientName || "Unknown"}`}
    >
      <View style={styles.cardHeader}>
        <View style={styles.cardLeft}>
          <View style={styles.avatar}>
            <User size={24} color={healthColors.primary.main} />
          </View>
          <View style={styles.patientInfo}>
            <Text style={styles.patientName} numberOfLines={1}>
              {item.patientName || "Unknown Patient"}
            </Text>
            <Text style={styles.reason} numberOfLines={1}>
              {item.reasonForVisit || item.reason || "Consultation"}
            </Text>
            <View style={styles.timeContainer}>
              <Clock size={14} color={healthColors.text.secondary} />
              <Text style={styles.time}>
                {item.timeSlot || item.time || "N/A"}
              </Text>
              {item.appointmentDate && selectedFilter === "upcoming" && (
                <>
                  <Calendar
                    size={14}
                    color={healthColors.text.secondary}
                    style={styles.calendarIconMargin}
                  />
                  <Text style={styles.time}>
                    {new Date(item.appointmentDate).toLocaleDateString(
                      "en-IN",
                      {
                        day: "numeric",
                        month: "short",
                      },
                    )}
                  </Text>
                </>
              )}
            </View>
            {(() => {
              const normalizedStatus = normalizeStatus(item.status);
              const canConfirm = normalizedStatus === "scheduled";
              const canCancel =
                normalizedStatus === "scheduled" ||
                normalizedStatus === "confirmed";
              const isBusy = updatingAppointmentId === item.id;

              if (!canConfirm && !canCancel) {
                return null;
              }

              return (
                <View style={styles.statusActionsRow}>
                  {canConfirm && (
                    <TouchableOpacity
                      style={[
                        styles.statusActionButton,
                        styles.confirmActionButton,
                        isBusy && styles.statusActionButtonDisabled,
                      ]}
                      activeOpacity={0.8}
                      disabled={isBusy}
                      onPress={() => handleStatusUpdate(item, "confirmed")}
                      accessibilityRole="button"
                      accessibilityLabel="Confirm appointment"
                    >
                      {isBusy ? (
                        <ActivityIndicator
                          size="small"
                          color={healthColors.text.white}
                        />
                      ) : (
                        <>
                          <CheckCircle
                            size={16}
                            color={healthColors.text.white}
                          />
                          <Text style={styles.statusActionButtonText}>
                            {t("confirm", "Confirm")}
                          </Text>
                        </>
                      )}
                    </TouchableOpacity>
                  )}
                  {canCancel && (
                    <TouchableOpacity
                      style={[
                        styles.statusActionButton,
                        styles.cancelActionButton,
                        isBusy && styles.statusActionButtonDisabled,
                      ]}
                      activeOpacity={0.8}
                      disabled={isBusy}
                      onPress={() => {
                        Alert.alert(
                          "Cancel Appointment",
                          "Are you sure you want to cancel this appointment?",
                          [
                            { text: "No", style: "cancel" },
                            {
                              text: "Yes, Cancel",
                              style: "destructive",
                              onPress: () =>
                                handleStatusUpdate(item, "cancelled"),
                            },
                          ],
                        );
                      }}
                      accessibilityRole="button"
                      accessibilityLabel="Cancel appointment"
                    >
                      {isBusy ? (
                        <ActivityIndicator
                          size="small"
                          color={healthColors.text.white}
                        />
                      ) : (
                        <>
                          <XCircle size={16} color={healthColors.text.white} />
                          <Text style={styles.statusActionButtonText}>
                            {t("cancel", "Cancel")}
                          </Text>
                        </>
                      )}
                    </TouchableOpacity>
                  )}
                </View>
              );
            })()}
          </View>
        </View>
        <View style={styles.cardRight}>
          <TouchableOpacity
            style={styles.actionButton}
            activeOpacity={0.7}
            onPress={async () => {
              if (!item.phone || item.phone === "N/A") {
                Alert.alert(
                  "Call Unavailable",
                  "Patient phone number is not available.",
                );
                return;
              }
              const phoneUrl = `tel:${item.phone}`;
              const canOpen = await Linking.canOpenURL(phoneUrl);
              if (!canOpen) {
                Alert.alert("Call Failed", "Unable to open phone dialer.");
                return;
              }
              await Linking.openURL(phoneUrl);
            }}
            accessibilityRole="button"
            accessibilityLabel="Call patient"
          >
            <Phone size={20} color={healthColors.primary.main} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.actionButton,
              !["scheduled", "confirmed", "in_progress"].includes(
                normalizeStatus(item.status),
              ) && styles.actionButtonDisabled,
            ]}
            activeOpacity={0.7}
            onPress={() => {
              const normalizedStatus = normalizeStatus(item.status);
              if (
                !["scheduled", "confirmed", "in_progress"].includes(
                  normalizedStatus,
                )
              ) {
                Alert.alert(
                  "Unavailable",
                  "Consultation can only be started for scheduled, confirmed, or in-progress appointments.",
                );
                return;
              }
              handleStartConsultation(item);
            }}
            accessibilityRole="button"
            accessibilityLabel="Start consultation"
          >
            <Cross size={20} color={healthColors.success.main} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            activeOpacity={0.7}
            onPress={() => handleCreatePrescription(item)}
            accessibilityRole="button"
            accessibilityLabel="Create prescription"
          >
            <FileText size={20} color={healthColors.accent.coral} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            activeOpacity={0.7}
            onPress={() =>
              navigation.navigate(Routes.DOCTOR.PATIENT_MANAGEMENT, {
                patientId: item.patientUserId || item.patientId,
                patientName: item.patientName,
              })
            }
            accessibilityRole="button"
            accessibilityLabel={`View history for ${item.patientName}`}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <UserCircle size={20} color={healthColors.info.main} />
          </TouchableOpacity>
          <View
            style={[
              styles.statusBadge,
              getStatusStyle(item.status),
            ]}
          >
            <Text
              style={[
                styles.statusText,
                { color: getStatusStyle(item.status).color },
              ]}
            >
              {getStatusLabel(item.status)}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: healthColors.background.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: healthColors.border.light,
    ...theme.shadows.sm,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  cardLeft: {
    flex: 1,
    flexDirection: "row",
    marginRight: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.withOpacity(healthColors.primary.main, 0.1),
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  patientInfo: {
    flex: 1,
  },
  patientName: {
    fontSize: theme.typography.sizes.bodyLarge,
    fontWeight: theme.typography.weights.bold,
    color: healthColors.text.primary,
    marginBottom: 4,
  },
  reason: {
    fontSize: theme.typography.sizes.body,
    color: healthColors.text.secondary,
    marginBottom: 8,
  },
  timeContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: healthColors.background.secondary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: "flex-start",
    marginBottom: 8,
  },
  time: {
    fontSize: theme.typography.sizes.caption,
    fontWeight: theme.typography.weights.semibold,
    color: healthColors.text.secondary,
    marginLeft: 6,
  },
  calendarIconMargin: {
    marginLeft: 12,
  },
  statusActionsRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 8,
  },
  statusActionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6,
  },
  confirmActionButton: {
    backgroundColor: healthColors.success.main,
  },
  cancelActionButton: {
    backgroundColor: healthColors.error.main,
  },
  statusActionButtonDisabled: {
    opacity: 0.7,
  },
  statusActionButtonText: {
    color: healthColors.text.white,
    fontSize: theme.typography.sizes.caption,
    fontWeight: theme.typography.weights.bold,
  },
  cardRight: {
    alignItems: "flex-end",
    gap: 8,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: theme.typography.sizes.caption,
    fontWeight: theme.typography.weights.bold,
    textTransform: "capitalize",
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: healthColors.background.secondary,
    justifyContent: "center",
    alignItems: "center",
  },
  actionButtonDisabled: {
    opacity: 0.3,
  },
});

export default React.memo(AppointmentCard);
