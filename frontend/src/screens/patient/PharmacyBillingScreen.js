/**
 * Pharmacy & Billing Screen
 * Medicine purchase, billing summary, payment options
 */

import React, { useState, useEffect, useCallback } from "react";
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
import { Ionicons } from "@expo/vector-icons";
import { useSelector } from "react-redux";
import { theme, healthColors } from "../../theme";
import {
  getScreenPadding,
  verticalScale,
} from "../../utils/responsive";
import NetworkStatusIndicator from "../../components/common/NetworkStatusIndicator";
import ErrorRecovery from "../../components/common/ErrorRecovery";
import { showError, logError } from "../../utils/errorHandler";
import { useNetworkStatus } from "../../utils/offlineHandler";
import { prescriptionService } from "../../services";

const PharmacyBillingScreen = ({ navigation, route }) => {
  const [selectedPayment, setSelectedPayment] = useState("card");
  const [selectedPurchase, setSelectedPurchase] = useState("hospital");
  const [loading, setLoading] = useState(false);
  const [fetchingPrescription, setFetchingPrescription] = useState(true);
  const [error, setError] = useState(null);
  const { isConnected } = useNetworkStatus();
  const { user } = useSelector((state) => state.auth);
  const insets = useSafeAreaInsets();

  // Get prescription from route params or fetch latest
  const [prescription, setPrescription] = useState(
    route?.params?.prescription || null
  );

  const fetchLatestPrescription = useCallback(async () => {
    if (!user?.id) {
      setFetchingPrescription(false);
      return;
    }

    try {
      const response = await prescriptionService.getPatientPrescriptions(
        user.id
      );
      if (response.success && response.data?.length > 0) {
        // Get the most recent prescription
        const prescriptions = response.data.prescriptions || response.data;
        if (prescriptions.length > 0) {
          const latest = prescriptions[0];
          // Format prescription for display
          setPrescription({
            id: latest._id,
            date: new Date(
              latest.prescriptionDate || latest.createdAt
            ).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
              year: "numeric",
            }),
            doctor: latest.doctorId?.name || "Doctor",
            medicines: (latest.medicines || latest.medications || []).map(
              (med) => ({
                name: med.name || med.medicine || "Medication",
                dosage: med.dosage || med.frequency || "As directed",
                duration: med.duration || "7 days",
                price: med.price || 50,
                qty: med.quantity || 1,
              })
            ),
          });
        }
      }
    } catch (err) {
      logError(err, {
        context: "PharmacyBillingScreen.fetchLatestPrescription",
      });
    } finally {
      setFetchingPrescription(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (!route?.params?.prescription) {
      fetchLatestPrescription();
    } else {
      setFetchingPrescription(false);
    }
  }, [route?.params?.prescription, fetchLatestPrescription]);

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

  const handlePayment = async () => {
    try {
      if (!isConnected) {
        showError("No internet connection. Please check your network.");
        return;
      }

      setLoading(true);
      setError(null);

      // Simulate payment processing
      await new Promise((resolve) => setTimeout(resolve, 1000));

      alert(
        `Payment of ₹${total.toFixed(2)} via ${selectedPayment.toUpperCase()} initiated!`
      );
    } catch (err) {
      logError(err, {
        context: "PharmacyBillingScreen.handlePayment",
        amount: total,
        method: selectedPayment,
      });
      setError(err.message || "Payment failed");
      showError("Payment failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

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

  // Loading state
  if (fetchingPrescription) {
    return (
      <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
        <NetworkStatusIndicator />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={healthColors.primary.main} />
          <Text style={styles.loadingText}>Loading prescription...</Text>
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
      <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
        <NetworkStatusIndicator />
        <LinearGradient
          colors={[theme.colors.healthcare.teal, theme.colors.healthcare.teal]}
          style={styles.header}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.white} />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Ionicons name="medical-outline" size={32} color={theme.colors.white} />
            <View style={styles.headerText}>
              <Text style={styles.headerTitle}>Pharmacy & Billing</Text>
              <Text style={styles.headerSubtitle}>
                Medicine purchase & payment
              </Text>
            </View>
          </View>
          <View style={{ width: 24 }} />
        </LinearGradient>
        <View style={styles.emptyState}>
          <Ionicons
            name="medical-outline"
            size={80}
            color={healthColors.text.tertiary}
          />
          <Text style={styles.emptyTitle}>No Active Prescription</Text>
          <Text style={styles.emptySubtitle}>
            You need a valid prescription to purchase medicines.{"\n"}
            Please visit a doctor first.
          </Text>
          <TouchableOpacity
            style={styles.bookButton}
            onPress={() => navigation.navigate("AppointmentBooking")}
          >
            <Text style={styles.bookButtonText}>Book Appointment</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <NetworkStatusIndicator />
      {/* Header */}
      <LinearGradient
        colors={[theme.colors.healthcare.teal, theme.colors.healthcare.teal]}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.white} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Ionicons name="medical-outline" size={32} color={theme.colors.white} />
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>Pharmacy & Billing</Text>
            <Text style={styles.headerSubtitle}>
              Medicine purchase & payment
            </Text>
          </View>
        </View>
        <TouchableOpacity onPress={() => {}}>
          <Ionicons name="receipt" size={24} color={theme.colors.white} />
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
            <Ionicons
              name="document-text-outline"
              size={20}
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
            <Ionicons
              name="medkit-outline"
              size={20}
              color={healthColors.primary.main}
            />
            <Text style={styles.sectionTitle}>
              MEDICINES ({prescription.medicines.length})
            </Text>
          </View>
          <View style={styles.card}>
            {prescription.medicines.map((medicine, index) => (
              <View key={index} style={styles.medicineItem}>
                <View style={styles.medicineIcon}>
                  <Ionicons
                    name="medical"
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
                  <Text style={styles.priceText}>₹{medicine.price}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Purchase Options */}
        <View style={styles.section}>
          <View style={styles.sectionTitleContainer}>
            <Ionicons
              name="business-outline"
              size={20}
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
            >
              <View style={styles.purchaseOptionContent}>
                <Ionicons
                  name={
                    selectedPurchase === "hospital"
                      ? "radio-button-on"
                      : "radio-button-off"
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
            >
              <View style={styles.purchaseOptionContent}>
                <Ionicons
                  name={
                    selectedPurchase === "external"
                      ? "radio-button-on"
                      : "radio-button-off"
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
            <Ionicons
              name="calculator-outline"
              size={20}
              color={healthColors.primary.main}
            />
            <Text style={styles.sectionTitle}>BILLING SUMMARY</Text>
          </View>
          <View style={styles.card}>
            <View style={styles.billingRow}>
              <Text style={styles.billingLabel}>Subtotal:</Text>
              <Text style={styles.billingValue}>₹{subtotal.toFixed(2)}</Text>
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
                {discount > 0 ? "-" : ""}₹{discount.toFixed(2)}
              </Text>
            </View>
            <View style={styles.billingDivider} />
            <View style={styles.billingRow}>
              <Text style={styles.billingTotal}>Total Amount:</Text>
              <Text style={styles.billingTotalValue}>₹{total.toFixed(2)}</Text>
            </View>
          </View>
        </View>

        {/* Payment Methods */}
        <View style={styles.section}>
          <View style={styles.sectionTitleContainer}>
            <Ionicons
              name="card-outline"
              size={20}
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
              >
                <View
                  style={[
                    styles.paymentIcon,
                    { backgroundColor: method.color + "20" },
                  ]}
                >
                  <Ionicons name={method.icon} size={24} color={method.color} />
                </View>
                <Text style={styles.paymentName}>{method.name}</Text>
                <Ionicons
                  name={
                    selectedPayment === method.id
                      ? "checkmark-circle"
                      : "ellipse-outline"
                  }
                  size={24}
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
          disabled={loading}
        >
          <LinearGradient
            colors={[theme.colors.healthcare.teal, theme.colors.healthcare.teal]}
            style={styles.payGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            {loading ? (
              <ActivityIndicator size="small" color={theme.colors.white} />
            ) : (
              <>
                <Ionicons name="card" size={24} color={theme.colors.white} />
                <Text style={styles.payButtonText}>
                  Pay ₹{total.toFixed(2)}
                </Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>

        {/* Info Box */}
        <View style={styles.infoBox}>
          <Ionicons name="information-circle" size={20} color={theme.colors.info.main} />
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: theme.spacing.md,
    fontSize: 14,
    color: healthColors.text.secondary,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: getScreenPadding(),
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: theme.typography.weights.bold,
    color: healthColors.text.primary,
    marginTop: theme.spacing.lg,
  },
  emptySubtitle: {
    fontSize: 14,
    color: healthColors.text.secondary,
    textAlign: "center",
    marginTop: theme.spacing.sm,
    lineHeight: 22,
  },
  bookButton: {
    marginTop: theme.spacing.xl,
    backgroundColor: healthColors.primary.main,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
  },
  bookButtonText: {
    color: theme.colors.white,
    fontSize: 16,
    fontWeight: theme.typography.weights.semibold,
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
    fontSize: 20,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.white,
  },
  headerSubtitle: {
    fontSize: 13,
    color: "rgba(255, 255, 255, 0.9)",
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
    fontSize: 16,
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
    fontSize: 14,
    fontWeight: theme.typography.weights.semibold,
    color: healthColors.text.primary,
    marginBottom: 4,
  },
  prescriptionDate: {
    fontSize: 12,
    color: healthColors.text.tertiary,
  },
  doctorInfo: {
    alignItems: "flex-end",
  },
  doctorLabel: {
    fontSize: 11,
    color: healthColors.text.tertiary,
    marginBottom: 2,
  },
  doctorName: {
    fontSize: 13,
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
  medicineEmoji: {
    fontSize: 24,
  },
  medicineInfo: {
    flex: 1,
  },
  medicineName: {
    fontSize: 14,
    fontWeight: theme.typography.weights.semibold,
    color: healthColors.text.primary,
    marginBottom: 2,
  },
  medicineDosage: {
    fontSize: 12,
    color: healthColors.text.secondary,
    marginBottom: 2,
  },
  medicineQty: {
    fontSize: 11,
    color: healthColors.text.tertiary,
  },
  medicinePrice: {
    alignItems: "flex-end",
  },
  priceText: {
    fontSize: 16,
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
    borderColor: "transparent",
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
    fontSize: 14,
    fontWeight: theme.typography.weights.semibold,
    color: healthColors.text.primary,
    marginBottom: 2,
  },
  purchaseOptionSubtitle: {
    fontSize: 12,
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
    fontSize: 11,
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
    fontSize: 14,
    color: healthColors.text.secondary,
  },
  billingValue: {
    fontSize: 14,
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
    fontSize: 10,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.white,
  },
  billingDivider: {
    height: 1,
    backgroundColor: healthColors.border.light,
    marginVertical: theme.spacing.md,
  },
  billingTotal: {
    fontSize: 16,
    fontWeight: theme.typography.weights.bold,
    color: healthColors.text.primary,
  },
  billingTotalValue: {
    fontSize: 20,
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
    borderColor: "transparent",
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
    fontSize: 14,
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
    fontSize: 18,
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
    fontSize: 12,
    color: healthColors.text.secondary,
    lineHeight: 18,
  },
});

export default PharmacyBillingScreen;



