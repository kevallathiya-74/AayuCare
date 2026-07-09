/**
 * Admin Reports Screen
 * View and manage medical reports for admin users
 */

import React, { useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  StatusBar,
  RefreshControl,
  Alert,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { ChevronRight, ArrowLeft, Filter } from "lucide-react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useQuery } from "@tanstack/react-query";
import { useSelector } from "react-redux";
import { theme, healthColors } from '@/theme';
import { queryKeys } from '@/config/reactQueryConfig';
import { medicalRecordService } from '@/services';
import { parseError } from '@/utils/errorHandler';
import { formatDate } from '@/utils/helpers';
import {
  EmptyState,
  SkeletonCardRow,
  ModalSheet,
  Button,
  FilterHeaderRow,
  FilterSectionTitle,
  FilterChipGroup,
} from '@/components/common';
import { DynamicIcon } from '@/components/common';
import { handleSmartBack } from '@/utils/navigation';

const ReportsScreen = ({ navigation }) => {
  const user = useSelector((state) => state.auth.user);
  const [selectedRecordType, setSelectedRecordType] = useState("all");
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
  const [draftRecordType, setDraftRecordType] = useState("all");
  const insets = useSafeAreaInsets();

  const formatRecordTypeLabel = useCallback((value) => {
    const normalized = String(value || "other")
      .replace(/[_-]+/g, " ")
      .trim()
      .toLowerCase();

    return normalized
      .split(" ")
      .filter(Boolean)
      .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
      .join(" ");
  }, []);

  const {
    data: reports = [],
    isLoading: loading,
    isRefetching,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: queryKeys.medicalRecords.list({ scope: "admin-reports" }),
    staleTime: 5 * 60 * 1000,
    enabled: !!user?.id && user?.role === "admin",
    queryFn: async () => {
      const response = await medicalRecordService.getAllRecords({ limit: 20 });

      const responseData = response?.data;
      const rawReports =
        (Array.isArray(responseData?.medicalRecords) && responseData.medicalRecords) ||
        (Array.isArray(responseData?.records) && responseData.records) ||
        (Array.isArray(responseData?.items) && responseData.items) ||
        (Array.isArray(responseData) && responseData) ||
        [];

      return rawReports.map((report, index) => {
        const recordType = String(report?.recordType || report?.type || "other").toLowerCase();
        return {
          ...report,
          id: report?.id || `record-${index}`,
          recordType,
          recordTypeLabel: formatRecordTypeLabel(recordType),
          patientName:
            report?.patientName ||
            report?.patient?.name ||
            report?.patient_id ||
            report?.patientId ||
            "Unknown",
          createdAt: report?.createdAt || report?.date || report?.updatedAt,
        };
      });
    },
  });

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch])
  );

  const availableRecordTypes = useMemo(
    () =>
      Array.from(
        new Set(
          reports
            .map((report) => report.recordType)
            .filter((recordType) => !!recordType)
        )
      ),
    [reports]
  );

  const filterTypeOptions = useMemo(
    () => ["all", ...availableRecordTypes],
    [availableRecordTypes]
  );

  const filteredReports =
    selectedRecordType === "all"
      ? reports
      : reports.filter(
          (report) =>
            (report.recordType || "").toLowerCase() ===
            selectedRecordType.toLowerCase()
        );

  const draftFilteredCount =
    draftRecordType === "all"
      ? reports.length
      : reports.filter(
          (report) =>
            (report.recordType || "").toLowerCase() === draftRecordType.toLowerCase()
        ).length;

  const onRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  const getRecordTypeIcon = (type) => {
    const icons = {
      blood_test: "water",
      x_ray: "body",
      prescription: "document-text",
      diagnosis: "medkit",
      lab_result: "flask",
      imaging: "scan",
    };
    return icons[type?.toLowerCase()] || "document";
  };

  const handleReportPress = (report) => {
    Alert.alert(
      "Report Details",
      `Type: ${report.recordTypeLabel || "N/A"}\nPatient: ${report.patientName || "N/A"}\nDate: ${formatDate(report.createdAt)}`,
      [{ text: "OK" }]
    );
  };

  const openFilterSheet = useCallback(() => {
    setDraftRecordType(selectedRecordType);
    setIsFilterSheetOpen(true);
  }, [selectedRecordType]);

  const applyFilter = useCallback(() => {
    setSelectedRecordType(draftRecordType);
    setIsFilterSheetOpen(false);
  }, [draftRecordType]);

  const clearFilter = useCallback(() => {
    setDraftRecordType("all");
  }, []);

  const renderReport = useCallback(
    ({ item }) => (
      <TouchableOpacity
        style={styles.reportCard}
        onPress={() => handleReportPress(item)}
        accessibilityRole="button"
        accessibilityLabel={`Report ${item.recordType || item.type || "Medical Record"}`}
      >
        <View style={styles.reportHeader}>
          <View style={styles.iconContainer}>
            <DynamicIcon
              name={getRecordTypeIcon(item.recordType || item.type)}
              size={24}
              color={healthColors.primary.main}
            />
          </View>
          <View style={styles.reportInfo}>
            <Text style={styles.reportType}>
              {item.recordTypeLabel || "Medical Record"}
            </Text>
            <Text style={styles.patientName}>
              Patient: {item.patientName || "Unknown"}
            </Text>
            <Text style={styles.reportDate}>{formatDate(item.createdAt)}</Text>
          </View>
          <ChevronRight
            size={20}
            color={healthColors.text.tertiary}
          />
        </View>
        {item.description && (
          <Text style={styles.description} numberOfLines={2}>
            {item.description}
          </Text>
        )}
      </TouchableOpacity>
    ),
    []
  );

  const renderEmptyState = () => (
    <EmptyState
      icon="document-text-outline"
      title="No Reports"
      message={
        isError
          ? parseError(error)
          : selectedRecordType === "all"
            ? "Medical reports will appear here."
            : `No reports found for type: ${selectedRecordType}`
      }
      actionLabel={isError ? "Retry" : undefined}
      onActionPress={isError ? refetch : undefined}
    />
  );

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={healthColors.background.primary}
      />

      <View style={styles.header}>
        {navigation.canGoBack() ? (
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => handleSmartBack(navigation, "AdminTabs")}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <ArrowLeft
              size={24}
              color={healthColors.text.primary}
            />
          </TouchableOpacity>
        ) : (
          <View style={styles.placeholder} />
        )}
        <Text style={styles.headerTitle}>Reports & Records</Text>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={openFilterSheet}
          accessibilityRole="button"
          accessibilityLabel="Filter reports"
        >
          <Filter  size={24} color={healthColors.text.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.selectedFilterRow}>
        <Text style={styles.selectedFilterLabel}>Selected:</Text>
        <Text style={styles.selectedFilterValue}>
          {selectedRecordType === "all" ? "All Types" : formatRecordTypeLabel(selectedRecordType)}
        </Text>
      </View>

      {loading ? (
        <View style={styles.skeletonContainer}>{[1, 2, 3, 4].map((i) => (<SkeletonCardRow key={i} />))}</View>
      ) : (
        <FlatList
          data={filteredReports}
          renderItem={renderReport}
          keyExtractor={(item, index) => item.id || `report-${index}`}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: Math.max(insets.bottom, 20) },
          ]}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={onRefresh}
              colors={[healthColors.primary.main]}
              tintColor={healthColors.primary.main}
            />
          }
          ListEmptyComponent={renderEmptyState}
          showsVerticalScrollIndicator={false}
        />
      )}

      <ModalSheet
        visible={isFilterSheetOpen}
        onClose={() => setIsFilterSheetOpen(false)}
        title="Filter Reports"
        maxHeight={0.48}
      >
        <FilterHeaderRow onClear={clearFilter} />
        <FilterSectionTitle title="Record type" />
        <FilterChipGroup
          options={filterTypeOptions}
          selectedKey={draftRecordType}
          onSelect={(type) => setDraftRecordType(type)}
          getKey={(type) => type}
          getLabel={(type) => (type === "all" ? "All Types" : formatRecordTypeLabel(type))}
          getCount={(type) =>
            type === "all"
              ? reports.length
              : reports.filter((report) => report.recordType === type).length
          }
        />
        <Button
          variant="primary"
          title={`Show Results (${draftFilteredCount})`}
          onPress={applyFilter}
          style={styles.applyFilterButton}
        />
      </ModalSheet>
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: theme.spacing.md,
    backgroundColor: healthColors.background.card,
    borderBottomWidth: 1,
    borderBottomColor: healthColors.border.light,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: healthColors.background.tertiary,
    justifyContent: "center",
    alignItems: "center",
  },
  placeholder: {
    width: 40,
  },
  filterButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: healthColors.background.tertiary,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: theme.typography.sizes.h5,
    fontWeight: theme.typography.weights.bold,
    color: healthColors.text.primary,
  },
  selectedFilterRow: {
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.sm,
    paddingBottom: 2,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  selectedFilterLabel: {
    fontSize: theme.typography.sizes.bodySmall,
    color: healthColors.text.tertiary,
    fontWeight: "600",
  },
  selectedFilterValue: {
    fontSize: theme.typography.sizes.bodySmall,
    color: healthColors.primary.main,
    fontWeight: "700",
  },
  listContent: {
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.md,
    flexGrow: 1,
  },
  reportCard: {
    backgroundColor: healthColors.background.card,
    borderRadius: theme.borderRadius.card,
    padding: theme.spacing.md,
    marginTop: theme.spacing.sm,
    ...theme.shadows.sm,
  },
  reportHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.withOpacity(healthColors.primary.main, 0.08),
    justifyContent: "center",
    alignItems: "center",
    marginRight: theme.spacing.md,
  },
  reportInfo: {
    flex: 1,
  },
  reportType: {
    fontSize: theme.typography.sizes.h6,
    fontWeight: theme.typography.weights.semibold,
    color: healthColors.text.primary,
    textTransform: "capitalize",
  },
  patientName: {
    fontSize: theme.typography.sizes.sm,
    color: healthColors.text.secondary,
    marginTop: 2,
  },
  reportDate: {
    fontSize: theme.typography.sizes.sm,
    color: healthColors.text.tertiary,
    marginTop: 2,
  },
  description: {
    fontSize: theme.typography.sizes.sm,
    color: healthColors.text.secondary,
    marginTop: theme.spacing.sm,
    paddingTop: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: healthColors.border.light,
  },
  skeletonContainer: {
    padding: 16,
    gap: 12,
  },
  applyFilterButton: {
    marginTop: 16,
  },
});

export default ReportsScreen;


