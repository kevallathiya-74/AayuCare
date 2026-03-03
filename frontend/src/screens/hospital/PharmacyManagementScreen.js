/**
 * Pharmacy Management Screen
 * Production-focused, information-dense layout for pharmacy operations.
 */

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ScrollView,
  RefreshControl,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { theme, healthColors } from "../../theme";
import apiClient from "../../services/apiClient";
import { formatDate } from "../../utils/helpers";
import { logError } from "../../utils/errorHandler";
import { SkeletonCardRow } from "../../components/common";

const FILTERS = ["all", "pending", "preparing", "ready", "dispensed"];

const normalizeStatus = (status) => {
  if (status === "sent_to_pharmacy") return "preparing";
  if (status === "pending") return "pending";
  if (status === "preparing") return "preparing";
  if (status === "ready") return "ready";
  if (status === "dispensed") return "dispensed";
  return "pending";
};

const STATUS_CONFIG = {
  all: {
    label: "All",
    activeBackground: theme.colors.primary,
    activeText: theme.colors.text.white,
  },
  pending: {
    label: "Pending",
    badgeBackground: healthColors.warning.main,
    activeBackground: healthColors.warning.main,
    activeText: theme.colors.text.white,
  },
  preparing: {
    label: "Preparing",
    badgeBackground: healthColors.info.dark,
    activeBackground: healthColors.info.dark,
    activeText: theme.colors.text.white,
  },
  ready: {
    label: "Ready",
    badgeBackground: healthColors.success.main,
    activeBackground: healthColors.success.main,
    activeText: theme.colors.text.white,
  },
  dispensed: {
    label: "Dispensed",
    badgeBackground: healthColors.neutral.gray500,
    activeBackground: healthColors.neutral.gray600,
    activeText: theme.colors.text.white,
  },
};

const getMedicinesSummary = (medicines) => {
  if (!Array.isArray(medicines) || medicines.length === 0) {
    return "No medicines listed";
  }

  if (medicines.length === 1) {
    return medicines[0]?.name || "Medicine";
  }

  const first = medicines[0]?.name || "Medicine";
  const second = medicines[1]?.name || "Medicine";
  const remaining = medicines.length - 2;

  if (remaining > 0) {
    return `${first}, ${second} +${remaining} more`;
  }

  return `${first}, ${second}`;
};

const getSearchableText = (item) => {
  const medicineNames = Array.isArray(item.medicines)
    ? item.medicines.map((m) => m?.name).filter(Boolean).join(" ")
    : "";

  return `${item.patientName || ""} ${item.doctorName || ""} ${medicineNames}`.toLowerCase();
};

const StatusChip = ({ label, count, isActive, onPress }) => {
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      style={[styles.chipBase, isActive ? styles.chipActive : styles.chipInactive]}
      accessibilityRole="button"
      accessibilityLabel={`Filter ${label}`}
    >
      <Text style={[styles.chipLabel, isActive ? styles.chipLabelActive : styles.chipLabelInactive]}>
        {label}
      </Text>
      <Text style={[styles.chipCount, isActive ? styles.chipCountActive : styles.chipCountInactive]}>
        {count}
      </Text>
    </TouchableOpacity>
  );
};

const OrderCard = ({ order }) => {
  const status = normalizeStatus(order.pharmacyStatus);
  const statusLabel = STATUS_CONFIG[status]?.label || "Pending";

  return (
    <View style={styles.orderCard}>
      <View style={styles.orderHeaderRow}>
        <View style={styles.orderTextBlock}>
          <Text style={styles.orderPatientName} numberOfLines={1}>
            {order.patientName || "Unknown Patient"}
          </Text>
          <Text style={styles.orderDoctorName} numberOfLines={1}>
            Dr. {order.doctorName || "Unknown"}
          </Text>
          <Text style={styles.orderMedicineSummary} numberOfLines={1}>
            {getMedicinesSummary(order.medicines)}
          </Text>
          <Text style={styles.orderCreatedTime}>
            {formatDate(order.createdAt || order.prescriptionDate || new Date())}
          </Text>
        </View>

        <View
          style={[
            styles.statusBadge,
            { backgroundColor: STATUS_CONFIG[status]?.badgeBackground || healthColors.warning.main },
          ]}
        >
          <Text style={styles.statusBadgeText}>{statusLabel}</Text>
        </View>
      </View>
    </View>
  );
};

const EmptyState = ({ onViewAll }) => {
  return (
    <View style={styles.emptyStateWrap}>
      <View style={styles.emptyIconWrap}>
        <Ionicons name="medkit-outline" size={theme.iconSizes.lg} color={healthColors.text.tertiary} />
      </View>
      <Text style={styles.emptyTitle}>No Pending Orders</Text>
      <Text style={styles.emptySubtitle}>
        Prescriptions will appear here once created by doctors.
      </Text>
      <TouchableOpacity onPress={onViewAll} style={styles.emptyActionBtn} activeOpacity={0.85}>
        <Text style={styles.emptyActionText}>View All Orders</Text>
      </TouchableOpacity>
    </View>
  );
};

const PharmacyManagementScreen = ({ navigation }) => {
  const [prescriptions, setPrescriptions] = useState([]);
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchPrescriptions = useCallback(async () => {
    try {
      setError(null);
      const response = await apiClient.get("/prescriptions");
      const data = response.data?.prescriptions || response.data || [];
      setPrescriptions(Array.isArray(data) ? data : []);
    } catch (err) {
      logError(err, { context: "PharmacyManagementScreen.fetchPrescriptions" });
      setError("Unable to load pharmacy orders. Please try again.");
      setPrescriptions([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchPrescriptions();
  }, [fetchPrescriptions]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchPrescriptions();
  }, [fetchPrescriptions]);

  const counts = useMemo(() => {
    const base = {
      all: prescriptions.length,
      pending: 0,
      preparing: 0,
      ready: 0,
      dispensed: 0,
    };

    prescriptions.forEach((item) => {
      const status = normalizeStatus(item.pharmacyStatus);
      if (base[status] !== undefined) {
        base[status] += 1;
      }
    });

    return base;
  }, [prescriptions]);

  const filteredOrders = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return prescriptions.filter((item) => {
      const normalized = normalizeStatus(item.pharmacyStatus);
      const statusMatch = selectedFilter === "all" || normalized === selectedFilter;
      const searchMatch = !query || getSearchableText(item).includes(query);

      return statusMatch && searchMatch;
    });
  }, [prescriptions, selectedFilter, searchQuery]);

  const summary = useMemo(() => {
    return {
      totalToday: counts.all,
      pending: counts.pending,
      ready: counts.ready,
    };
  }, [counts]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <StatusBar barStyle="dark-content" backgroundColor={healthColors.background.card} />
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerIconBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={theme.iconSizes.md} color={healthColors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Pharmacy Management</Text>
          <View style={styles.headerIconBtn} />
        </View>
        <View style={{ padding: 16, gap: 12 }}>
          {[1, 2, 3, 4].map((i) => (<SkeletonCardRow key={i} />))}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <StatusBar barStyle="dark-content" backgroundColor={healthColors.background.card} />

      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerIconBtn}
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="arrow-back" size={theme.iconSizes.md} color={healthColors.text.primary} />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Pharmacy Management</Text>

        <TouchableOpacity
          style={styles.headerIconBtn}
          onPress={onRefresh}
          accessibilityRole="button"
          accessibilityLabel="Refresh orders"
        >
          <Ionicons
            name="refresh"
            size={theme.iconSizes.md}
            color={refreshing ? healthColors.text.tertiary : healthColors.text.primary}
          />
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredOrders}
        keyExtractor={(item, index) => item._id || item.id || `order-${index}`}
        renderItem={({ item }) => <OrderCard order={item} />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
        ListHeaderComponent={
          <View>
            <View style={styles.searchWrap}>
              <Ionicons name="search" size={theme.iconSizes.sm} color={healthColors.text.tertiary} />
              <TextInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search by patient, doctor, or medicine"
                placeholderTextColor={healthColors.text.tertiary}
                style={styles.searchInput}
                returnKeyType="search"
              />
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterRow}
            >
              {FILTERS.map((filterKey) => (
                <StatusChip
                  key={filterKey}
                  label={STATUS_CONFIG[filterKey].label}
                  count={counts[filterKey] || 0}
                  isActive={selectedFilter === filterKey}
                  onPress={() => setSelectedFilter(filterKey)}
                />
              ))}
            </ScrollView>

            <View style={styles.summaryRow}>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryLabel}>Total Today</Text>
                <Text style={styles.summaryValue}>{summary.totalToday}</Text>
              </View>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryLabel}>Pending</Text>
                <Text style={styles.summaryValue}>{summary.pending}</Text>
              </View>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryLabel}>Ready</Text>
                <Text style={styles.summaryValue}>{summary.ready}</Text>
              </View>
            </View>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}
          </View>
        }
        ListEmptyComponent={<EmptyState onViewAll={() => setSelectedFilter("all")} />}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: healthColors.background.primary,
  },

  header: {
    height: theme.layout.headerHeight,
    paddingHorizontal: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: healthColors.border.light,
    backgroundColor: healthColors.background.card,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerIconBtn: {
    width: theme.touchTargets.min,
    height: theme.touchTargets.min,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: theme.typography.fontSizes.h5,
    fontWeight: theme.typography.weights.bold,
    color: healthColors.text.primary,
  },

  listContent: {
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.md,
    flexGrow: 1,
  },

  searchWrap: {
    marginTop: theme.spacing.sm + theme.spacing.xs,
    height: theme.touchTargets.min,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.sm + theme.spacing.xs,
    backgroundColor: healthColors.neutral.gray100,
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: theme.typography.fontSizes.bodyMedium,
    fontWeight: theme.typography.weights.regular,
    color: healthColors.text.primary,
  },

  filterRow: {
    marginTop: theme.spacing.sm + theme.spacing.xs,
    gap: theme.spacing.sm,
    paddingRight: theme.spacing.sm,
  },
  chipBase: {
    height: theme.touchTargets.sm,
    borderRadius: theme.spacing.lg - theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm + theme.spacing.xs,
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.xs,
    borderWidth: 1,
  },
  chipActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  chipInactive: {
    backgroundColor: healthColors.background.card,
    borderColor: healthColors.border.main,
  },
  chipLabel: {
    fontSize: theme.typography.fontSizes.bodyMedium,
    fontWeight: theme.typography.weights.medium,
  },
  chipLabelActive: {
    color: theme.colors.text.white,
  },
  chipLabelInactive: {
    color: healthColors.text.secondary,
  },
  chipCount: {
    fontSize: theme.typography.fontSizes.caption,
    fontWeight: theme.typography.weights.semibold,
  },
  chipCountActive: {
    color: theme.colors.text.white,
  },
  chipCountInactive: {
    color: healthColors.text.tertiary,
  },

  summaryRow: {
    marginTop: theme.spacing.md,
    flexDirection: "row",
    gap: theme.spacing.sm,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: healthColors.background.card,
    borderWidth: 1,
    borderColor: healthColors.border.light,
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.sm + theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm + theme.spacing.xs,
  },
  summaryLabel: {
    fontSize: theme.typography.fontSizes.caption,
    color: healthColors.text.secondary,
    fontWeight: theme.typography.weights.regular,
  },
  summaryValue: {
    marginTop: theme.spacing.xs,
    fontSize: theme.typography.fontSizes.h6,
    color: healthColors.text.primary,
    fontWeight: theme.typography.weights.semibold,
  },

  errorText: {
    marginTop: theme.spacing.sm + theme.spacing.xs,
    fontSize: theme.typography.fontSizes.bodySmall,
    color: healthColors.error.main,
  },

  orderCard: {
    marginTop: theme.spacing.sm,
    borderRadius: theme.borderRadius.card,
    padding: theme.spacing.md,
    backgroundColor: healthColors.background.card,
    ...theme.shadows.sm,
  },
  orderHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: theme.spacing.sm,
  },
  orderTextBlock: {
    flex: 1,
  },
  orderPatientName: {
    fontSize: theme.typography.fontSizes.h6,
    fontWeight: theme.typography.weights.semibold,
    color: healthColors.text.primary,
  },
  orderDoctorName: {
    marginTop: theme.spacing.xs,
    fontSize: theme.typography.fontSizes.bodyMedium,
    fontWeight: theme.typography.weights.regular,
    color: healthColors.text.secondary,
  },
  orderMedicineSummary: {
    marginTop: theme.spacing.xs,
    fontSize: theme.typography.fontSizes.bodyMedium,
    fontWeight: theme.typography.weights.regular,
    color: healthColors.text.primary,
  },
  orderCreatedTime: {
    marginTop: theme.spacing.xs,
    fontSize: theme.typography.fontSizes.caption,
    fontWeight: theme.typography.weights.regular,
    color: healthColors.text.tertiary,
  },

  statusBadge: {
    minHeight: theme.spacing.lg,
    borderRadius: theme.spacing.lg,
    paddingHorizontal: theme.spacing.sm + theme.spacing.xs,
    justifyContent: "center",
    alignItems: "center",
  },
  statusBadgeText: {
    fontSize: theme.typography.fontSizes.caption,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.text.white,
  },

  emptyStateWrap: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.xl,
  },
  emptyIconWrap: {
    width: theme.spacing.xxxl,
    height: theme.spacing.xxxl,
    borderRadius: theme.spacing.xxxl,
    backgroundColor: healthColors.background.secondary,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: theme.spacing.sm + theme.spacing.xs,
  },
  emptyTitle: {
    fontSize: theme.typography.fontSizes.h6,
    fontWeight: theme.typography.weights.semibold,
    color: healthColors.text.primary,
    textAlign: "center",
  },
  emptySubtitle: {
    marginTop: theme.spacing.xs,
    fontSize: theme.typography.fontSizes.bodyMedium,
    fontWeight: theme.typography.weights.regular,
    color: healthColors.text.secondary,
    textAlign: "center",
    lineHeight: theme.typography.fontSizes.bodyMedium * 1.35,
  },
  emptyActionBtn: {
    marginTop: theme.spacing.md,
    minHeight: theme.touchTargets.min,
    borderRadius: theme.borderRadius.button,
    paddingHorizontal: theme.spacing.md,
    backgroundColor: theme.colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyActionText: {
    fontSize: theme.typography.fontSizes.bodyMedium,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.text.white,
  },

  centerState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: theme.spacing.lg,
  },
  centerStateText: {
    marginTop: theme.spacing.sm + theme.spacing.xs,
    fontSize: theme.typography.fontSizes.bodyMedium,
    color: healthColors.text.secondary,
  },
});

export default PharmacyManagementScreen;
