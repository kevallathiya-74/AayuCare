/**
 * Pharmacy & Billing Screen
 * Medicine purchase, billing summary, payment options
 */

import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { ArrowLeft, Cross, Receipt, FileText, BriefcaseMedical, Building, CreditCard, Info } from "lucide-react-native";
import { useSelector } from "react-redux";
import { theme, healthColors } from '@/theme';
import { getScreenPadding } from '@/utils/responsive';
import { SkeletonCardRow, NetworkStatusIndicator, ErrorRecovery, EmptyState } from '@/components/common';
import { showError, logError } from '@/utils/errorHandler';
import { useNetworkStatus } from '@/utils/offlineHandler';
import { formatCurrency } from '@/utils/helpers';
import { prescriptionService, paymentService, appointmentService } from '@/services';
import { DynamicIcon } from '@/components/common';
import { useMutation, useQuery } from "@tanstack/react-query";
import { queryKeys } from '@/config/reactQueryConfig';
import { handleSmartBack } from '@/utils/navigation';
import Routes from '@/navigation/routes';

const PharmacyBillingScreen = ({ navigation, route }) => {
  const [paymentResult, setPaymentResult] = useState(null);
  const [selectedPurchase, setSelectedPurchase] = useState("hospital");
  const [selectedPayment, setSelectedPayment] = useState("card");
  const [error, setError] = useState(null);
  const { isConnected } = useNetworkStatus();
  const { user } = useSelector((state) => state.auth);
  const insets = useSafeAreaInsets();

  // Get prescription from route params or fetch latest
  const routePrescription = route?.params?.prescription || null;

  const {
    data: fetchedPrescription,
    isLoading: fetchingPrescription,
    refetch: refetchPrescription,
  } = useQuery({
    queryKey: queryKeys.prescriptions.patient(user?.id || "unknown"),
    queryFn: async () => {
      const response = await prescriptionService.getPatientPrescriptions(user.id);
      if (!response?.success) {
        return null;
      }

      const prescriptions = response?.data?.prescriptions || response?.data || [];
      if (!Array.isArray(prescriptions) || prescriptions.length === 0) {
        return null;
      }

      const latest = prescriptions[0];
      return {
        id: latest.id,
        date: new Date(latest.prescriptionDate || latest.createdAt).toLocaleDateString(
          "en-IN",
          {
            day: "numeric",
            month: "short",
            year: "numeric",
          }
        ),
        doctor: latest.doctorName || "Doctor",
        medicines: (latest.medicines || latest.medications || []).map((med) => ({
          name: med.name || med.medicine || "Medication",
          dosage: med.dosage || med.frequency || "As directed",
          duration: med.duration || "7 days",
          price: med.price || 50,
          qty: med.quantity || 1,
        })),
      };
    },
    enabled: !!user?.id && !routePrescription,
    staleTime: 60 * 1000,
    retry: 1,
  });

  const prescription = routePrescription || fetchedPrescription || null;

  const { data: hasUpcomingAppointment = false } = useQuery({
    queryKey: queryKeys.appointments.list({
      scope: "pharmacy-empty-state-appointment-check",
      patientId: user?.id,
    }),
    enabled: !!user?.id,
    staleTime: 30 * 1000,
    queryFn: async () => {
      const response = await appointmentService.getPatientAppointments(user.id);
      const appointments = response?.data?.appointments || response?.data || [];
      if (!Array.isArray(appointments) || appointments.length === 0) {
        return false;
      }

      return appointments.some((appointment) => {
        const status = String(appointment?.status || "")
          .toLowerCase()
          .trim()
          .replace(/-/g, "_");

        return ["scheduled", "confirmed", "in_progress"].includes(status);
      });
    },
  });

  const subtotal =
    prescription?.medicines?.reduce((sum, med) => sum + (med.price || 0), 0) ||
    0;
  const discount = selectedPurchase === "hospital" ? subtotal * 0.15 : 0;
  const total = subtotal - discount;

  const paymentMethods = [
    { id: "card", icon: "card", name: "Card Payment", color: theme.colors.info.main },
    { id: "upi", icon: "phone-portrait", name: "UPI", color: theme.colors.success.main },
    { id: "cash", icon: "cash", name: "Cash", color: theme.colors.warning.main },
  ];

  const paymentMutation = useMutation({
    mutationFn: (payload) => paymentService.createPayment(payload),
    onSuccess: (response) => {
      if (response?.success) {
        setPaymentResult(response.data);
        Alert.alert(
          "Payment Successful",
          `Payment of ${formatCurrency(total)} via ${selectedPayment.toUpperCase()} processed successfully!\nPayment ID: ${response.data?.payment_id || "N/A"}`,
          [{ text: "OK" }]
        );
        return;
      }

      throw new Error(response?.message || "Payment failed");
    },
    onError: (err) => {
      logError(err, {
        context: "PharmacyBillingScreen.handlePayment",
        amount: total,
        method: selectedPayment,
      });
      setError(err?.message || "Payment failed");
      showError("Payment failed. Please try again.");
    },
  });

  const handlePayment = async () => {
    if (!isConnected) {
      showError("No internet connection. Please check your network.");
      return;
    }

    setError(null);
    await paymentMutation.mutateAsync({
      amount: total,
      paymentMethod: selectedPayment,
      purchaseType: selectedPurchase,
      prescriptionId: prescription?.id || null,
      medicines: prescription?.medicines || [],
    });
  };

  const handleRetry = () => {
    setError(null);
    if (!routePrescription) {
      refetchPrescription();
    }
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

  // Loading state
  if (fetchingPrescription) {
    return (
      <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
        <NetworkStatusIndicator />
        <View style={styles.loadingListWrapper}>
          {[1, 2, 3, 4].map((i) => (<SkeletonCardRow key={i} />))}
        </View>
      </SafeAreaView>
    );
  }

  // No prescription state
  if (
    !prescription ||
    !prescription.medicines ||
    prescription.medicines.length === 0
  ) {
    return (
      <SafeAreaView style={styles.container} edges={["left", "right", "bottom"]}>
        <NetworkStatusIndicator />
        <LinearGradient
          colors={healthColors.gradients.primary}
          style={[styles.header, { paddingTop: insets.top + theme.spacing.xs }]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <TouchableOpacity
            onPress={() => handleSmartBack(navigation, "PatientTabs")}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <ArrowLeft  size={theme.iconSizes.lg} color={theme.colors.white} />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Cross  size={theme.iconSizes.xxl} color={theme.colors.white} />
            <View style={styles.headerText}>
              <Text style={styles.headerTitle}>Pharmacy & Billing</Text>
              <Text style={styles.headerSubtitle}>
                Medicine purchase & payment
              </Text>
            </View>
          </View>
          <View style={styles.headerRightSpacer} />
        </LinearGradient>
        <EmptyState
          icon="receipt-outline"
          title="No Active Prescription"
          message={
            hasUpcomingAppointment
              ? "You already have an upcoming appointment. Your prescription will appear here after doctor consultation."
              : "You need a valid prescription to purchase medicines. Please book an appointment and consult a doctor first."
          }
          actionLabel={hasUpcomingAppointment ? "View My Appointments" : "Book Appointment"}
          onActionPress={() =>
            hasUpcomingAppointment
              ? navigation.navigate(Routes.PATIENT.MY_APPOINTMENTS)
              : navigation.navigate(Routes.PATIENT.APPOINTMENT_BOOKING)
          }
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["left", "right", "bottom"]}>
      <NetworkStatusIndicator />
      {/* Header */}
      <LinearGradient
        colors={healthColors.gradients.primary}
        style={[styles.header, { paddingTop: insets.top + theme.spacing.xs }]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <TouchableOpacity
          onPress={() => handleSmartBack(navigation, "PatientTabs")}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <ArrowLeft  size={theme.iconSizes.lg} color={theme.colors.white} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Cross  size={theme.iconSizes.xxl} color={theme.colors.white} />
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>Pharmacy & Billing</Text>
            <Text style={styles.headerSubtitle}>
              Medicine purchase & payment
            </Text>
          </View>
        </View>
        <TouchableOpacity
          onPress={() =>
            paymentResult
              ? Alert.alert(
                  "Payment Receipt",
                  `Payment ID: ${paymentResult.payment_id}\nAmount: ${formatCurrency(total)}\nMethod: ${selectedPayment.toUpperCase()}\nStatus: ${paymentResult.status || "completed"}`
                )
              : Alert.alert("No Receipt", "Complete a payment to view the receipt.")
          }
          accessibilityRole="button"
          accessibilityLabel="View payment receipt"
        >
          <Receipt  size={theme.iconSizes.lg} color={theme.colors.white} />
        </TouchableOpacity>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: Math.max(insets.bottom, 20) },
        ]}
      >
        {/* Prescription Info */}
        <View style={styles.section}>
          <View style={styles.sectionTitleContainer}>
            <FileText
              
              size={theme.iconSizes.md}
              color={healthColors.primary.main}
            />
            <Text style={styles.sectionTitle}>PRESCRIPTION DETAILS</Text>
          </View>
          <View style={styles.card}>
            <View style={styles.prescriptionHeader}>
              <View>
                <Text style={styles.prescriptionId}>
                  Rx ID: {prescription.id}
                </Text>
                <Text style={styles.prescriptionDate}>
                  Date: {prescription.date}
                </Text>
              </View>
              <View style={styles.doctorInfo}>
                <Text style={styles.doctorLabel}>Prescribed by:</Text>
                <Text style={styles.doctorName}>{prescription.doctor}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Medicines List */}
        <View style={styles.section}>
          <View style={styles.sectionTitleContainer}>
            <BriefcaseMedical size={theme.iconSizes.md} color={healthColors.primary.main} />
            <Text style={styles.sectionTitle}>
              MEDICINES ({prescription.medicines.length})
            </Text>
          </View>
          <View style={styles.card}>
            {prescription.medicines.map((medicine) => (
              <View key={medicine.name} style={styles.medicineItem}>
                <View style={styles.medicineIcon}>
                  <DynamicIcon
                    name="hospital"
                    size={24}
                    color={healthColors.primary.main}
                  />
                </View>
                <View style={styles.medicineInfo}>
                  <Text style={styles.medicineName}>{medicine.name}</Text>
                  <Text style={styles.medicineDosage}>
                    {medicine.dosage} × {medicine.duration}
                  </Text>
                  <Text style={styles.medicineQty}>
                    Quantity: {medicine.qty} tablets
                  </Text>
                </View>
                <View style={styles.medicinePrice}>
                  <Text style={styles.priceText}>{formatCurrency(medicine.price)}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Purchase Options */}
        <View style={styles.section}>
          <View style={styles.sectionTitleContainer}>
            <Building
              
              size={theme.iconSizes.md}
              color={healthColors.primary.main}
            />
            <Text style={styles.sectionTitle}>PURCHASE OPTIONS</Text>
          </View>
          <View style={styles.card}>
            <TouchableOpacity
              style={[
                styles.purchaseOption,
                selectedPurchase === "hospital" &&
                  styles.purchaseOptionSelected,
              ]}
              onPress={() => setSelectedPurchase("hospital")}
              accessibilityRole="button"
              accessibilityLabel="Choose hospital pharmacy"
              accessibilityState={{ selected: selectedPurchase === "hospital" }}
            >
              <View style={styles.purchaseOptionContent}>
                <DynamicIcon
                  name={
                    selectedPurchase === "hospital"
                      ? "checkmark-circle"
                      : "circle"
                  }
                  size={24}
                  color={
                    selectedPurchase === "hospital"
                      ? theme.colors.healthcare.teal
                      : healthColors.text.tertiary
                  }
                />
                <View style={styles.purchaseOptionText}>
                  <Text style={styles.purchaseOptionTitle}>
                    Hospital Pharmacy
                  </Text>
                  <Text style={styles.purchaseOptionSubtitle}>
                    15% discount • Verified quality • Instant delivery
                  </Text>
                </View>
              </View>
              {selectedPurchase === "hospital" && (
                <View style={styles.discountBadge}>
                  <Text style={styles.discountText}>15% OFF</Text>
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.purchaseOption,
                selectedPurchase === "external" &&
                  styles.purchaseOptionSelected,
              ]}
              onPress={() => setSelectedPurchase("external")}
              accessibilityRole="button"
              accessibilityLabel="Choose external pharmacy"
              accessibilityState={{ selected: selectedPurchase === "external" }}
            >
              <View style={styles.purchaseOptionContent}>
                <DynamicIcon
                  name={
                    selectedPurchase === "external"
                      ? "checkmark-circle"
                      : "circle"
                  }
                  size={24}
                  color={
                    selectedPurchase === "external"
                      ? theme.colors.healthcare.teal
                      : healthColors.text.tertiary
                  }
                />
                <View style={styles.purchaseOptionText}>
                  <Text style={styles.purchaseOptionTitle}>
                    External Pharmacy
                  </Text>
                  <Text style={styles.purchaseOptionSubtitle}>
                    No discount • Purchase outside hospital
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Billing Summary */}
        <View style={styles.section}>
          <View style={styles.sectionTitleContainer}>
            <DynamicIcon
              name="calculator-outline"
              size={theme.iconSizes.md}
              color={healthColors.primary.main}
            />
            <Text style={styles.sectionTitle}>BILLING SUMMARY</Text>
          </View>
          <View style={styles.card}>
            <View style={styles.billingRow}>
              <Text style={styles.billingLabel}>Subtotal:</Text>
              <Text style={styles.billingValue}>{formatCurrency(subtotal)}</Text>
            </View>
            <View style={styles.billingRow}>
              <View style={styles.billingLabelWithIcon}>
                <Text style={styles.billingLabel}>Hospital Discount:</Text>
                {selectedPurchase === "hospital" && (
                  <View style={styles.discountTag}>
                    <Text style={styles.discountTagText}>15%</Text>
                  </View>
                )}
              </View>
              <Text
                style={[
                  styles.billingValue,
                  discount > 0 && styles.discountValue,
                ]}
              >
                {discount > 0 ? "-" : ""}{formatCurrency(discount)}
              </Text>
            </View>
            <View style={styles.billingDivider} />
            <View style={styles.billingRow}>
              <Text style={styles.billingTotal}>Total Amount:</Text>
              <Text style={styles.billingTotalValue}>{formatCurrency(total)}</Text>
            </View>
          </View>
        </View>

        {/* Payment Methods */}
        <View style={styles.section}>
          <View style={styles.sectionTitleContainer}>
            <CreditCard
              
              size={theme.iconSizes.md}
              color={healthColors.primary.main}
            />
            <Text style={styles.sectionTitle}>PAYMENT METHOD</Text>
          </View>
          <View style={styles.card}>
            {paymentMethods.map((method) => (
              <TouchableOpacity
                key={method.id}
                style={[
                  styles.paymentMethod,
                  selectedPayment === method.id && styles.paymentMethodSelected,
                ]}
                onPress={() => setSelectedPayment(method.id)}
                accessibilityRole="button"
                accessibilityLabel={`Select payment method ${method.name}`}
                accessibilityState={{ selected: selectedPayment === method.id }}
              >
                <View
                  style={[
                    styles.paymentIcon,
                    { backgroundColor: method.color + "20" },
                  ]}
                >
                  <DynamicIcon name={method.icon} size={theme.iconSizes.lg} color={method.color} />
                </View>
                <Text style={styles.paymentName}>{method.name}</Text>
                <DynamicIcon
                  name={
                    selectedPayment === method.id
                      ? "checkmark-circle"
                      : "circle"
                  }
                   size={theme.iconSizes.lg}
                   color={
                     selectedPayment === method.id
                       ? method.color
                       : healthColors.text.tertiary
                   }
                />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Pay Button */}
        <TouchableOpacity
          style={styles.payButton}
          onPress={handlePayment}
          disabled={paymentMutation.isPending}
          accessibilityRole="button"
          accessibilityLabel={`Pay ${formatCurrency(total)}`}
          accessibilityState={{ disabled: paymentMutation.isPending }}
        >
          <LinearGradient
            colors={[theme.colors.healthcare.teal, theme.colors.healthcare.teal]}
            style={styles.payGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            {paymentMutation.isPending ? (
              <ActivityIndicator size="small" color={theme.colors.white} />
            ) : (
              <>
                <DynamicIcon name="card" size={theme.iconSizes.lg} color={theme.colors.white} />
                <Text style={styles.payButtonText}>
                  Pay {formatCurrency(total)}
                </Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>

        {/* Info Box */}
        <View style={styles.infoBox}>
          <Info  size={theme.iconSizes.md} color={theme.colors.info.main} />
          <Text style={styles.infoText}>
            Medicine will be dispensed after successful payment verification
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: healthColors.background.primary,
  },

  loadingListWrapper: {
    padding: theme.spacing.md,
    gap: theme.spacing.sm + theme.spacing.xs,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: getScreenPadding(),
    paddingBottom: theme.spacing.md,
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
    backgroundColor: healthColors.background.card,
    borderRadius: 16,
    padding: theme.spacing.lg,
    ...theme.shadows.md,
  },
  prescriptionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  prescriptionId: {
    fontSize: theme.typography.sizes.bodyMedium,
    fontWeight: theme.typography.weights.semibold,
    color: healthColors.text.primary,
    marginBottom: 4,
  },
  prescriptionDate: {
    fontSize: theme.typography.sizes.caption,
    color: healthColors.text.tertiary,
  },
  doctorInfo: {
    alignItems: "flex-end",
  },
  doctorLabel: {
    fontSize: theme.typography.sizes.overline,
    color: healthColors.text.tertiary,
    marginBottom: 2,
  },
  doctorName: {
    fontSize: theme.typography.sizes.bodyMedium,
    fontWeight: theme.typography.weights.semibold,
    color: healthColors.text.primary,
  },
  medicineItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: theme.spacing.md,
    backgroundColor: healthColors.background.primary,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.sm,
  },
  medicineIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: healthColors.info.light,
    justifyContent: "center",
    alignItems: "center",
    marginRight: theme.spacing.md,
  },

  medicineInfo: {
    flex: 1,
  },
  medicineName: {
    fontSize: theme.typography.sizes.bodyMedium,
    fontWeight: theme.typography.weights.semibold,
    color: healthColors.text.primary,
    marginBottom: 2,
  },
  medicineDosage: {
    fontSize: theme.typography.sizes.caption,
    color: healthColors.text.secondary,
    marginBottom: 2,
  },
  medicineQty: {
    fontSize: theme.typography.sizes.overline,
    color: healthColors.text.tertiary,
  },
  medicinePrice: {
    alignItems: "flex-end",
  },
  priceText: {
    fontSize: theme.typography.sizes.bodyLarge,
    fontWeight: theme.typography.weights.bold,
    color: healthColors.success.dark,
  },
  purchaseOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: theme.spacing.md,
    backgroundColor: healthColors.background.primary,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.sm,
    borderWidth: 2,
    borderColor: healthColors.transparent,
  },
  purchaseOptionSelected: {
    borderColor: healthColors.success.dark,
    backgroundColor: healthColors.success.light,
  },
  purchaseOptionContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.md,
    flex: 1,
  },
  purchaseOptionText: {
    flex: 1,
  },
  purchaseOptionTitle: {
    fontSize: theme.typography.sizes.bodyMedium,
    fontWeight: theme.typography.weights.semibold,
    color: healthColors.text.primary,
    marginBottom: 2,
  },
  purchaseOptionSubtitle: {
    fontSize: theme.typography.sizes.caption,
    color: healthColors.text.secondary,
    lineHeight: 18,
  },
  discountBadge: {
    backgroundColor: healthColors.success.dark,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: 8,
  },
  discountText: {
    fontSize: theme.typography.sizes.overline,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.white,
  },
  billingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing.sm,
  },
  billingLabelWithIcon: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.xs,
  },
  billingLabel: {
    fontSize: theme.typography.sizes.bodyMedium,
    color: healthColors.text.secondary,
  },
  billingValue: {
    fontSize: theme.typography.sizes.bodyMedium,
    fontWeight: theme.typography.weights.medium,
    color: healthColors.text.primary,
  },
  discountValue: {
    color: healthColors.success.main,
  },
  discountTag: {
    backgroundColor: healthColors.success.main,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  discountTagText: {
    fontSize: theme.typography.sizes.overline,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.white,
  },
  billingDivider: {
    height: 1,
    backgroundColor: healthColors.border.light,
    marginVertical: theme.spacing.md,
  },
  billingTotal: {
    fontSize: theme.typography.sizes.bodyLarge,
    fontWeight: theme.typography.weights.bold,
    color: healthColors.text.primary,
  },
  billingTotalValue: {
    fontSize: theme.typography.sizes.h4,
    fontWeight: theme.typography.weights.bold,
    color: healthColors.success.dark,
  },
  paymentMethod: {
    flexDirection: "row",
    alignItems: "center",
    padding: theme.spacing.md,
    backgroundColor: healthColors.background.primary,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.sm,
    borderWidth: 2,
    borderColor: healthColors.transparent,
  },
  paymentMethodSelected: {
    borderColor: healthColors.success.dark,
    backgroundColor: healthColors.success.light,
  },
  paymentIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginRight: theme.spacing.md,
  },
  paymentName: {
    flex: 1,
    fontSize: theme.typography.sizes.bodyMedium,
    fontWeight: theme.typography.weights.medium,
    color: healthColors.text.primary,
  },
  payButton: {
    borderRadius: theme.borderRadius.md,
    overflow: "hidden",
    marginBottom: theme.spacing.lg,
    ...theme.shadows.lg,
  },
  payGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  payButtonText: {
    fontSize: theme.typography.sizes.h5,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.white,
  },
  infoBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: healthColors.info.light,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    gap: theme.spacing.sm,
  },
  infoText: {
    flex: 1,
    fontSize: theme.typography.sizes.caption,
    color: healthColors.text.secondary,
    lineHeight: 18,
  },
  headerRightSpacer: {
    width: 24,
  },
});

export default PharmacyBillingScreen;



