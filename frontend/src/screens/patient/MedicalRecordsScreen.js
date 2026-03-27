/**
 * Medical Records Screen
 *
 * Production-quality screen that:
 *  - Fetches patient medical records from the API
 *  - Shows skeleton loaders while loading
 *  - Shows EmptyState when no records found
 *  - Filterable by backend-supported record types
 *  - Infinite scroll via pagination
 *  - Full error state with retry
 */

import React, {
  useCallback,
  useMemo,
  useState,
} from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSelector } from "react-redux";
import { useInfiniteQuery } from "@tanstack/react-query";
import {
  FileText,
  FlaskConical,
  Stethoscope,
  ClipboardList,
  Activity,
  ChevronLeft,
  AlertCircle,
  RefreshCw,
} from "lucide-react-native";
import { theme, healthColors } from "../../theme";
import { EmptyState } from "../../components/common";
import SkeletonLoader from "../../components/ui/SkeletonLoader";
import { getSafeAreaEdges } from "../../utils/responsive";
import { getPatientMedicalRecords } from "../../services/medicalRecord.service";
import { queryKeys } from "../../config/reactQueryConfig";
import { logError, parseError } from "../../utils/errorHandler";
import { format, parseISO } from "date-fns";
import { handleSmartBack } from "../../utils/navigation";

// ─────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────

const PAGE_SIZE = 15;

const RECORD_TYPE_ALIASES = {
  lab: "lab_report",
  visit: "doctor_visit",
  report: "test_result",
};

const normalizeRecordType = (type = "") => {
  const normalized = String(type || "").toLowerCase().trim();
  return RECORD_TYPE_ALIASES[normalized] || normalized;
};

const RECORD_TYPE_FILTERS = [
  { key: "all", label: "All" },
  { key: "lab_report", label: "Lab", icon: FlaskConical },
  { key: "prescription", label: "Rx", icon: ClipboardList },
  { key: "doctor_visit", label: "Visit", icon: Stethoscope },
  { key: "test_result", label: "Test", icon: Activity },
  { key: "imaging", label: "Imaging", icon: FileText },
  { key: "vaccination", label: "Vaccine", icon: ClipboardList },
  { key: "other", label: "Other", icon: FileText },
];

const TYPE_META = {
  lab_report: {
    label: "Lab Result",
    icon: FlaskConical,
    color: healthColors.accent.aqua,
    bg: `${healthColors.accent.aqua}18`,
  },
  prescription: {
    label: "Prescription",
    icon: ClipboardList,
    color: healthColors.success.main,
    bg: `${healthColors.success.main}18`,
  },
  doctor_visit: {
    label: "Doctor Visit",
    icon: Stethoscope,
    color: healthColors.primary.main,
    bg: `${healthColors.primary.main}18`,
  },
  test_result: {
    label: "Test Result",
    icon: Activity,
    color: healthColors.info.main,
    bg: `${healthColors.info.main}18`,
  },
  imaging: {
    label: "Imaging",
    icon: FileText,
    color: healthColors.info.main,
    bg: `${healthColors.info.main}18`,
  },
  vaccination: {
    label: "Vaccination",
    icon: ClipboardList,
    color: healthColors.success.main,
    bg: `${healthColors.success.main}18`,
  },
  other: {
    label: "Other",
    icon: FileText,
    color: healthColors.text.secondary,
    bg: healthColors.background.secondary,
  },
  default: {
    label: "Record",
    icon: Activity,
    color: healthColors.text.secondary,
    bg: healthColors.background.secondary,
  },
};

const getTypeMeta = (type = "") =>
  TYPE_META[normalizeRecordType(type)] || TYPE_META.default;

const formatDate = (dateStr) => {
  try {
    return format(parseISO(dateStr), "MMM dd, yyyy");
  } catch {
    return dateStr || "—";
  }
};

// ─────────────────────────────────────────────
// RecordCard Component
// ─────────────────────────────────────────────

const RecordCard = React.memo(({ record, onPress }) => {
  const meta = getTypeMeta(record.recordType || record.type);
  const IconComp = meta.icon;

  return (
    <TouchableOpacity
      onPress={() => onPress && onPress(record)}
      style={styles.card}
      activeOpacity={0.75}
      accessibilityRole="button"
      accessibilityLabel={`Medical record: ${record.title || meta.label}`}
    >
      {/* Icon */}
      <View style={[styles.cardIcon, { backgroundColor: meta.bg }]}>
        <IconComp size={20} color={meta.color} />
      </View>

      {/* Content */}
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle} numberOfLines={1}>
          {record.title || meta.label}
        </Text>
        <Text style={styles.cardMeta} numberOfLines={1}>
          {meta.label} · {formatDate(record.date || record.createdAt)}
        </Text>
        {record.doctorName ? (
          <Text style={styles.cardDoctor} numberOfLines={1}>
            Dr. {record.doctorName}
          </Text>
        ) : null}
      </View>

      {/* Type badge */}
      <View style={[styles.typeBadge, { backgroundColor: meta.bg }]}>
        <Text style={[styles.typeBadgeText, { color: meta.color }]}>
          {meta.label}
        </Text>
      </View>
    </TouchableOpacity>
  );
});

// ─────────────────────────────────────────────
// Filter Pill
// ─────────────────────────────────────────────

const FilterPill = React.memo(({ filter, isActive, onPress }) => {
  const IconComp = filter.icon;
  return (
    <TouchableOpacity
      onPress={() => onPress(filter.key)}
      style={[styles.pill, isActive && styles.pillActive]}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={`Filter by ${filter.label}`}
    >
      {IconComp ? (
        <IconComp
          size={13}
          color={isActive ? healthColors.text.white : healthColors.text.secondary}
          style={{ marginRight: 4 }}
        />
      ) : null}
      <Text style={[styles.pillText, isActive && styles.pillTextActive]}>
        {filter.label}
      </Text>
    </TouchableOpacity>
  );
});

// ─────────────────────────────────────────────
// Skeleton Row (loading placeholder)
// ─────────────────────────────────────────────

const RecordSkeleton = () => (
  <View style={styles.card}>
    <SkeletonLoader variant="avatar" size={44} />
    <View style={{ flex: 1, marginLeft: 12, gap: 6 }}>
      <SkeletonLoader variant="line" width="55%" height={14} />
      <SkeletonLoader variant="line" width="80%" height={11} />
    </View>
  </View>
);

const SkeletonList = () => (
  <>
    {[1, 2, 3, 4, 5].map((i) => (
      <RecordSkeleton key={i} />
    ))}
  </>
);

// ─────────────────────────────────────────────
// Error State
// ─────────────────────────────────────────────

const ErrorView = ({ message, onRetry }) => (
  <View style={styles.errorContainer}>
    <AlertCircle size={40} color={healthColors.error.main} />
    <Text style={styles.errorTitle}>Could not load records</Text>
    <Text style={styles.errorMsg}>{message || "An unexpected error occurred."}</Text>
    <TouchableOpacity
      onPress={onRetry}
      style={styles.retryBtn}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityLabel="Retry loading medical records"
    >
      <RefreshCw size={15} color={healthColors.text.white} style={{ marginRight: 6 }} />
      <Text style={styles.retryText}>Try Again</Text>
    </TouchableOpacity>
  </View>
);

// ─────────────────────────────────────────────
// Main Screen
// ─────────────────────────────────────────────

const MedicalRecordsScreen = ({ navigation }) => {
  const { user } = useSelector((state) => state.auth);
  const [activeFilter, setActiveFilter] = useState("all");
  const {
    data,
    isLoading,
    isRefetching,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch,
    error,
  } = useInfiniteQuery({
    queryKey: queryKeys.medicalRecords.infinite({
      patientId: user?.id || user?.userId,
      filter: activeFilter,
    }),
    enabled: !!(user?.id || user?.userId),
    staleTime: 5 * 60 * 1000,
    initialPageParam: 0,
    queryFn: async ({ pageParam = 0 }) => {
      const patientId = user?.id || user?.userId;
      const params = {
        page: Math.floor(pageParam / PAGE_SIZE) + 1,
        limit: PAGE_SIZE,
      };
      if (activeFilter !== "all") {
        params.recordType = normalizeRecordType(activeFilter);
      }

      const res = await getPatientMedicalRecords(patientId, params);
      const incoming = Array.isArray(res) ? res : res?.records || [];
      return {
        records: incoming,
        total: Number(res?.total || res?.pagination?.total || 0),
      };
    },
    getNextPageParam: (lastPage, allPages) => {
      const loaded = allPages.reduce((sum, page) => sum + (page?.records?.length || 0), 0);
      if (lastPage?.total > 0) {
        return loaded < lastPage.total ? loaded : undefined;
      }
      return (lastPage?.records?.length || 0) >= PAGE_SIZE ? loaded : undefined;
    },
  });

  const records = useMemo(
    () => (data?.pages || []).flatMap((page) => page?.records || []),
    [data]
  );

  // ── Handlers ───────────────────────────────

  const handleFilterChange = useCallback(
    (key) => {
      if (key === activeFilter) return;
      setActiveFilter(key);
    },
    [activeFilter]
  );

  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  const handleLoadMore = useCallback(() => {
    if (!hasNextPage || isFetchingNextPage || isLoading) return;
    fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, isLoading, fetchNextPage]);

  const handleRecordPress = useCallback(
    (record) => {
      // Navigate to record detail if route exists — gracefully no-op if not
      if (navigation.getState().routeNames.includes("RecordDetail")) {
        navigation.navigate("RecordDetail", { record });
      }
    },
    [navigation]
  );

  // ── Render helpers ─────────────────────────

  const ListHeader = useMemo(
    () => (
      <View style={styles.filterRow}>
        {RECORD_TYPE_FILTERS.map((f) => (
          <FilterPill
            key={f.key}
            filter={f}
            isActive={activeFilter === f.key}
            onPress={handleFilterChange}
          />
        ))}
      </View>
    ),
    [activeFilter, handleFilterChange]
  );

  const ListFooter = isFetchingNextPage ? (
    <View style={styles.footerLoader}>
      <RecordSkeleton />
    </View>
  ) : null;

  const renderItem = useCallback(
    ({ item }) => <RecordCard record={item} onPress={handleRecordPress} />,
    [handleRecordPress]
  );

  const keyExtractor = useCallback(
    (item, idx) => item._id || item.id || String(idx),
    []
  );

  // ─────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────

  return (
    <SafeAreaView style={styles.container} edges={getSafeAreaEdges("withTabBar")}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={healthColors.primary.main}
      />

      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => handleSmartBack(navigation, "PatientTabs")}
          style={styles.backBtn}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <ChevronLeft size={22} color={healthColors.text.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Medical Records</Text>
        <View style={styles.backBtn} />
      </View>

      {/* ── Body ── */}
      {isLoading ? (
        <View style={styles.listContent}>
          {ListHeader}
          <SkeletonList />
        </View>
      ) : error ? (
        <ErrorView message={parseError(error)} onRetry={refetch} />
      ) : (
        <FlatList
          data={records}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          ListHeaderComponent={ListHeader}
          ListFooterComponent={ListFooter}
          contentContainerStyle={
            records.length === 0
              ? styles.emptyListContent
              : styles.listContent
          }
          ListEmptyComponent={
            <EmptyState
              icon={FileText}
              title="No Records Found"
              message={
                activeFilter !== "all"
                  ? `No ${activeFilter} records found.\nTry a different filter.`
                  : "Your medical records will appear here once your doctor adds them."
              }
              actionLabel={activeFilter !== "all" ? "Show All" : undefined}
              onActionPress={
                activeFilter !== "all"
                  ? () => setActiveFilter("all")
                  : undefined
              }
            />
          }
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={handleRefresh}
              colors={[healthColors.primary.main]}
              tintColor={healthColors.primary.main}
            />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.4}
          showsVerticalScrollIndicator={false}
          removeClippedSubviews
          maxToRenderPerBatch={12}
          windowSize={10}
        />
      )}
    </SafeAreaView>
  );
};

// ─────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: healthColors.background.secondary,
  },

  // ── Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: healthColors.primary.main,
    paddingHorizontal: 16,
    paddingVertical: 12,
    justifyContent: "space-between",
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 18,
  },
  headerTitle: {
    fontSize: theme.typography.sizes.h6,
    fontWeight: theme.typography.weights.bold,
    color: healthColors.text.white,
    letterSpacing: 0.3,
  },

  // ── Filter bar
  filterRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: theme.borderRadius.full,
    backgroundColor: healthColors.background.card,
    borderWidth: 1,
    borderColor: healthColors.border.light,
    ...theme.shadows.sm,
  },
  pillActive: {
    backgroundColor: healthColors.primary.main,
    borderColor: healthColors.primary.main,
  },
  pillText: {
    fontSize: 13,
    fontWeight: theme.typography.weights.medium,
    color: healthColors.text.secondary,
  },
  pillTextActive: {
    color: healthColors.text.white,
  },

  // ── List
  listContent: {
    paddingBottom: 24,
    paddingHorizontal: 16,
  },
  emptyListContent: {
    flexGrow: 1,
    paddingBottom: 24,
    paddingHorizontal: 16,
  },
  footerLoader: {
    marginTop: 4,
  },

  // ── Card
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: healthColors.background.card,
    borderRadius: theme.borderRadius.card,
    padding: 14,
    marginBottom: 10,
    ...theme.shadows.md,
  },
  cardIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  cardContent: {
    flex: 1,
    gap: 2,
  },
  cardTitle: {
    fontSize: theme.typography.sizes.bodyMedium,
    fontWeight: theme.typography.weights.semibold,
    color: healthColors.text.primary,
  },
  cardMeta: {
    fontSize: 12,
    color: healthColors.text.secondary,
  },
  cardDoctor: {
    fontSize: 11,
    color: healthColors.primary.main,
    marginTop: 1,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: theme.borderRadius.badge,
    marginLeft: 8,
    alignSelf: "center",
  },
  typeBadgeText: {
    fontSize: 10,
    fontWeight: theme.typography.weights.semibold,
  },

  // ── Error
  errorContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    paddingBottom: 60,
  },
  errorTitle: {
    fontSize: theme.typography.sizes.h6,
    fontWeight: theme.typography.weights.semibold,
    color: healthColors.text.primary,
    marginTop: 16,
    marginBottom: 6,
  },
  errorMsg: {
    fontSize: theme.typography.sizes.bodySmall,
    color: healthColors.text.secondary,
    textAlign: "center",
    lineHeight: 18,
    marginBottom: 20,
  },
  retryBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: healthColors.primary.main,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: theme.borderRadius.button,
    ...theme.shadows.button,
  },
  retryText: {
    fontSize: 14,
    fontWeight: theme.typography.weights.semibold,
    color: healthColors.text.white,
  },
});

export default MedicalRecordsScreen;
