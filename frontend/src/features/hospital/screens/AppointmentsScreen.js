/**
 * Admin Appointments Screen
 * View and manage all appointments for admin users with lazy loading
 * Production-ready with cursor-based pagination
 */

import React, { useState, useMemo, useCallback, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { Calendar, ArrowLeft, Filter } from "lucide-react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useQuery } from "@tanstack/react-query";
import { theme, healthColors } from '@/theme';
import { formatDate, getStatusColor } from '@/utils/helpers';
import { useAdminAppointments } from '@/context/AdminAppointmentContext';
import { useAppointmentsInfinite } from '@/hooks/useAppointments';
import {
  EmptyState,
  SkeletonCardRow,
  ModalSheet,
  Button,
  SearchField,
  FilterHeaderRow,
  FilterSectionTitle,
  FilterSelectField,
  FilterDropdownList,
  FilterChipGroup,
} from '@/components/common';
import appointmentService from '@/services/appointment.service';
import { EmptyStateConfig } from '@/utils/constants';
import { queryKeys } from '@/config/reactQueryConfig';
import { parseError } from '@/utils/errorHandler';
import { handleSmartBack } from '@/utils/navigation';

const AppointmentsScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { refreshCount } = useAdminAppointments();
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState({
    status: "all",
    dateRange: "all",
    reservationType: "all",
    sortBy: "newest",
  });
  const [draftFilters, setDraftFilters] = useState(appliedFilters);
  const [searchText, setSearchText] = useState("");
  const [debouncedSearchText, setDebouncedSearchText] = useState("");
  const statusOptions = useMemo(
    () => [
      { key: "all", label: "All", status: undefined },
      { key: "pending", label: "Pending", status: "scheduled,confirmed" },
      { key: "in_progress", label: "In Progress", status: "in_progress" },
      { key: "completed", label: "Completed", status: "completed" },
      { key: "no_show", label: "No Show", status: "no_show" },
      { key: "cancelled", label: "Cancelled", status: "cancelled" },
    ],
    []
  );

  const dateOptions = useMemo(
    () => [
      { key: "all", label: "All Dates" },
      { key: "today", label: "Today" },
      { key: "next_7_days", label: "Next 7 Days" },
    ],
    []
  );

  const queryFilters = useMemo(() => {
    const selectedStatus = statusOptions.find(
      (option) => option.key === appliedFilters.status
    );

    const filters = {
      status: selectedStatus?.status,
      limit: 10,
    };

    const now = new Date();
    if (appliedFilters.dateRange === "today") {
      const start = new Date(now);
      start.setHours(0, 0, 0, 0);
      const end = new Date(now);
      end.setHours(23, 59, 59, 999);
      filters.startDate = start.toISOString();
      filters.endDate = end.toISOString();
    }

    if (appliedFilters.dateRange === "next_7_days") {
      const start = new Date(now);
      start.setHours(0, 0, 0, 0);
      const end = new Date(now);
      end.setDate(end.getDate() + 7);
      end.setHours(23, 59, 59, 999);
      filters.startDate = start.toISOString();
      filters.endDate = end.toISOString();
    }

    return filters;
  }, [appliedFilters, statusOptions]);

  const {
    data: statsSnapshot,
    refetch: refetchStats,
  } = useQuery({
    queryKey: queryKeys.appointments.list({ scope: "admin-stats" }),
    queryFn: async () => {
      const response = await appointmentService.getAppointmentStats();
      const statsArray = response?.data?.stats;
      const dateRangeStats = response?.data?.dateRanges;

      if (!Array.isArray(statsArray)) {
        return {
          statusCounts: {
            all: 0,
            pending: 0,
            in_progress: 0,
            completed: 0,
            no_show: 0,
            cancelled: 0,
          },
          dateCounts: {
            all: 0,
            today: 0,
            next_7_days: 0,
          },
        };
      }

      const byStatus = statsArray.reduce((acc, item) => {
        const statusKey = item?.status;
        const countValue = Number(item?.count || 0);
        if (statusKey) {
          acc[statusKey] = countValue;
        }
        return acc;
      }, {});

      const pendingCount = (byStatus.scheduled || 0) + (byStatus.confirmed || 0);
      const allCount = Object.values(byStatus).reduce(
        (sum, value) => sum + Number(value || 0),
        0
      );

      return {
        statusCounts: {
          all: allCount,
          pending: pendingCount,
          in_progress: byStatus.in_progress || 0,
          completed: byStatus.completed || 0,
          no_show: byStatus.no_show || 0,
          cancelled: byStatus.cancelled || 0,
        },
        dateCounts: {
          all: Number(dateRangeStats?.all || allCount),
          today: Number(dateRangeStats?.today || 0),
          next_7_days: Number(dateRangeStats?.next7Days || 0),
        },
      };
    },
    staleTime: 60 * 1000,
    retry: 1,
  });

  const statusCounts = useMemo(() => statsSnapshot?.statusCounts || {
    all: 0,
    pending: 0,
    in_progress: 0,
    completed: 0,
    no_show: 0,
    cancelled: 0,
  }, [statsSnapshot?.statusCounts]);

  const dateCounts = useMemo(() => statsSnapshot?.dateCounts || {
    all: 0,
    today: 0,
    next_7_days: 0,
  }, [statsSnapshot?.dateCounts]);

  // Use infinite query hook for admin appointments with lazy loading
  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
    isRefetching,
  } = useAppointmentsInfinite({
    ...queryFilters,
  });

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedSearchText(searchText.trim().toLowerCase());
    }, 280);

    return () => clearTimeout(timeoutId);
  }, [searchText]);

  // Flatten paginated data
  const appointments = useMemo(() => {
    if (!data?.pages) return [];
    const allAppointments = data.pages.flatMap((page) => page.appointments || []);

    if (appliedFilters.sortBy === "oldest") {
      return [...allAppointments].sort(
        (a, b) => new Date(a?.appointmentDate || 0) - new Date(b?.appointmentDate || 0)
      );
    }

    return [...allAppointments].sort(
      (a, b) => new Date(b?.appointmentDate || 0) - new Date(a?.appointmentDate || 0)
    );
  }, [data, appliedFilters.sortBy]);

  const normalizeTypeValue = useCallback((value) => {
    return String(value || "")
      .toLowerCase()
      .replace(/[_\s]+/g, "-")
      .trim();
  }, []);

  const reservationTypeOptions = useMemo(() => {
    const baseTypes = ["consultation", "telemedicine", "in-person"];
    const dataTypes = appointments
      .map((item) => normalizeTypeValue(item?.type))
      .filter(Boolean);
    const uniqueTypes = Array.from(new Set([...baseTypes, ...dataTypes]));

    return ["all", ...uniqueTypes];
  }, [appointments, normalizeTypeValue]);

  const fallbackStatusCounts = useMemo(() => {
    const byStatus = appointments.reduce(
      (acc, appointment) => {
        const normalizedStatus = String(appointment?.status || "").toLowerCase();
        if (normalizedStatus) {
          acc[normalizedStatus] = (acc[normalizedStatus] || 0) + 1;
        }
        return acc;
      },
      {}
    );

    return {
      all: appointments.length,
      pending: (byStatus.scheduled || 0) + (byStatus.confirmed || 0),
      in_progress: byStatus.in_progress || 0,
      completed: byStatus.completed || 0,
      no_show: byStatus.no_show || 0,
      cancelled: byStatus.cancelled || 0,
    };
  }, [appointments]);

  const fallbackDateCounts = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(now);
    todayEnd.setHours(23, 59, 59, 999);
    const nextWeekEnd = new Date(now);
    nextWeekEnd.setDate(nextWeekEnd.getDate() + 7);
    nextWeekEnd.setHours(23, 59, 59, 999);

    const todayCount = appointments.filter((appointment) => {
      const date = new Date(appointment?.appointmentDate);
      if (Number.isNaN(date.getTime())) return false;
      return date >= todayStart && date <= todayEnd;
    }).length;

    const nextWeekCount = appointments.filter((appointment) => {
      const date = new Date(appointment?.appointmentDate);
      if (Number.isNaN(date.getTime())) return false;
      return date >= todayStart && date <= nextWeekEnd;
    }).length;

    return {
      all: appointments.length,
      today: todayCount,
      next_7_days: nextWeekCount,
    };
  }, [appointments]);

  const effectiveStatusCounts = useMemo(() => {
    if (statusCounts.all > 0 || appointments.length === 0) {
      return statusCounts;
    }
    return fallbackStatusCounts;
  }, [statusCounts, appointments.length, fallbackStatusCounts]);

  const effectiveDateCounts = useMemo(() => {
    if (dateCounts.all > 0 || appointments.length === 0) {
      return dateCounts;
    }
    return fallbackDateCounts;
  }, [dateCounts, appointments.length, fallbackDateCounts]);

  const filteredAppointments = useMemo(() => {
    return appointments.filter((appointment) => {
      if (
        appliedFilters.reservationType !== "all" &&
        normalizeTypeValue(appointment?.type) !==
          normalizeTypeValue(appliedFilters.reservationType)
      ) {
        return false;
      }

      if (!debouncedSearchText) {
        return true;
      }

      const searchableParts = [
        appointment?.doctorName,
        appointment?.patientName,
        appointment?.reason,
        appointment?.chiefComplaint,
        appointment?.type,
        appointment?.status,
      ]
        .filter(Boolean)
        .map((value) => String(value).toLowerCase());

      return searchableParts.some((value) => value.includes(debouncedSearchText));
    });
  }, [appointments, debouncedSearchText, appliedFilters.reservationType, normalizeTypeValue]);

  const previewSelectedStatus = useMemo(
    () => statusOptions.find((option) => option.key === draftFilters.status),
    [statusOptions, draftFilters.status]
  );

  const draftFilteredCount = useMemo(() => {
    const draftStatusCsv = previewSelectedStatus?.status;
    const draftStatusSet = draftStatusCsv
      ? new Set(String(draftStatusCsv).split(",").map((entry) => entry.trim().toLowerCase()))
      : null;

    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(now);
    todayEnd.setHours(23, 59, 59, 999);
    const nextWeekEnd = new Date(now);
    nextWeekEnd.setDate(nextWeekEnd.getDate() + 7);
    nextWeekEnd.setHours(23, 59, 59, 999);

    return appointments.filter((appointment) => {
      if (draftStatusSet && !draftStatusSet.has(String(appointment?.status || "").toLowerCase())) {
        return false;
      }

      if (draftFilters.dateRange !== "all") {
        const appointmentDate = new Date(appointment?.appointmentDate);
        if (Number.isNaN(appointmentDate.getTime())) {
          return false;
        }

        if (draftFilters.dateRange === "today") {
          if (appointmentDate < todayStart || appointmentDate > todayEnd) {
            return false;
          }
        }

        if (draftFilters.dateRange === "next_7_days") {
          if (appointmentDate < todayStart || appointmentDate > nextWeekEnd) {
            return false;
          }
        }
      }

      if (
        draftFilters.reservationType !== "all" &&
        normalizeTypeValue(appointment?.type) !== normalizeTypeValue(draftFilters.reservationType)
      ) {
        return false;
      }

      if (!debouncedSearchText) {
        return true;
      }

      const searchableParts = [
        appointment?.doctorName,
        appointment?.patientName,
        appointment?.reason,
        appointment?.chiefComplaint,
        appointment?.type,
        appointment?.status,
      ]
        .filter(Boolean)
        .map((value) => String(value).toLowerCase());

      return searchableParts.some((value) => value.includes(debouncedSearchText));
    }).length;
  }, [appointments, draftFilters, debouncedSearchText, previewSelectedStatus, normalizeTypeValue]);

  // Refresh data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      refetch();
      refreshCount();
      refetchStats();
    }, [refetch, refreshCount, refetchStats])
  );

  // Handle pull to refresh
  const onRefresh = useCallback(() => {
    refetch();
    refreshCount(); // Also refresh tab badge count
    refetchStats();
  }, [refetch, refreshCount, refetchStats]);

  // Handle load more for infinite scroll
  const handleLoadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const openFilterSheet = useCallback(() => {
    setDraftFilters(appliedFilters);
    setIsStatusDropdownOpen(false);
    setIsFilterSheetOpen(true);
  }, [appliedFilters]);

  const applyFilters = useCallback(() => {
    setAppliedFilters(draftFilters);
    setIsStatusDropdownOpen(false);
    setIsFilterSheetOpen(false);
  }, [draftFilters]);

  const clearFilters = useCallback(() => {
    setDraftFilters({
      status: "all",
      dateRange: "all",
      reservationType: "all",
      sortBy: "newest",
    });
    setIsStatusDropdownOpen(false);
  }, []);

  

  const formatStatusLabel = (status) => {
    if (!status) return "Unknown";
    return status.replace(/_/g, " ");
  };

  const handleAppointmentPress = useCallback((appointment) => {
    const dateStr = formatDate(appointment?.appointmentDate);
    const status = formatStatusLabel(appointment?.status);
    Alert.alert(
      "Appointment Details",
      [
        `Doctor: ${appointment?.doctorName || "Unknown"}`,
        `Patient: ${appointment?.patientName || "Unknown"}`,
        `Date: ${dateStr}`,
        `Status: ${status}`,
        appointment?.reason ? `Reason: ${appointment.reason}` : null,
        appointment?.type ? `Type: ${appointment.type}` : null,
        appointment?.chiefComplaint ? `Chief Complaint: ${appointment.chiefComplaint}` : null,
      ]
        .filter(Boolean)
        .join("\n")
    );
  }, []);

  const renderAppointment = useCallback(
    ({ item }) => (
      <TouchableOpacity
        style={styles.appointmentCard}
        onPress={() => handleAppointmentPress(item)}
        accessibilityRole="button"
        accessibilityLabel={`Appointment with ${item.doctorName || "Doctor"}`}
      >
        <View style={styles.appointmentHeader}>
          <View style={styles.avatarContainer}>
            <Calendar
              
              size={24}
              color={healthColors.primary.main}
            />
          </View>
          <View style={styles.appointmentInfo}>
            <Text style={styles.doctorName}>
              {item.doctorName || "Unknown Doctor"}
            </Text>
            <Text style={styles.patientName}>
              Patient: {item.patientName || "Unknown"}
            </Text>
            <Text style={styles.appointmentTime}>
              {formatDate(item.appointmentDate)}
            </Text>
          </View>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: getStatusColor(item.status) + "20" },
            ]}
          >
            <Text
              style={[
                styles.statusText,
                { color: getStatusColor(item.status) },
              ]}
            >
              {formatStatusLabel(item.status)}
            </Text>
          </View>
        </View>
        {item.reason && (
          <Text style={styles.reason} numberOfLines={2}>
            Reason: {item.reason}
          </Text>
        )}
      </TouchableOpacity>
    ),
    [handleAppointmentPress]
  );

  const renderEmptyState = () => {
    if (debouncedSearchText && appointments.length > 0) {
      return (
        <EmptyState
          icon={EmptyStateConfig.APPOINTMENTS.icon}
          title="No matching appointments"
          message="Try a different doctor, patient, reason, or status keyword."
        />
      );
    }

    return (
      <EmptyState
        icon={EmptyStateConfig.APPOINTMENTS.icon}
        title={EmptyStateConfig.APPOINTMENTS.title}
        message={error ? parseError(error) : EmptyStateConfig.APPOINTMENTS.message}
        actionLabel={error ? "Retry" : undefined}
        onActionPress={error ? refetch : undefined}
      />
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={healthColors.background.primary}
      />

      <View style={styles.header}>
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
        <Text style={styles.headerTitle}>Appointments</Text>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={openFilterSheet}
          accessibilityRole="button"
          accessibilityLabel="Open appointment filters"
          activeOpacity={0.8}
        >
          <Filter size={18} color={healthColors.text.primary} />
          <Text style={styles.filterButtonText}>Filter</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <SearchField
          value={searchText}
          onChangeText={setSearchText}
          placeholder="Search doctor, patient, reason, status"
          onClear={() => setSearchText("")}
          accessibilityLabel="Search appointments"
        />
      </View>

      {isLoading ? (
        <View style={styles.loadingSkeletonWrap}>
          {[1, 2, 3, 4].map((i) => (<SkeletonCardRow key={i} />))}
        </View>
      ) : (
        <FlatList
          data={filteredAppointments}
          renderItem={renderAppointment}
          keyExtractor={(item, index) => item.id || `appointment-${index}`}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: Math.max(insets.bottom, 20) },
          ]}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.3}
          removeClippedSubviews={true}
          maxToRenderPerBatch={10}
          windowSize={10}
          initialNumToRender={10}

          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={onRefresh}
              colors={[healthColors.primary.main]}
              tintColor={healthColors.primary.main}
            />
          }
          ListFooterComponent={() =>
            isFetchingNextPage ? (
              <View style={styles.footerLoader}>
                <ActivityIndicator
                  size="small"
                  color={healthColors.primary.main}
                />
              </View>
            ) : null
          }
          ListEmptyComponent={renderEmptyState}
          showsVerticalScrollIndicator={false}
        />
      )}

      <ModalSheet
        visible={isFilterSheetOpen}
        onClose={() => setIsFilterSheetOpen(false)}
        title="Filter Appointments"
        maxHeight={0.72}
      >
        <FilterHeaderRow onClear={clearFilters} />

        <FilterSectionTitle title="Sort by" />
        <View style={styles.filterOptionRow}>
          {[{ key: "newest", label: "Newest first" }, { key: "oldest", label: "Oldest first" }].map((option) => {
            const active = draftFilters.sortBy === option.key;
            return (
              <TouchableOpacity
                key={option.key}
                style={[styles.radioOption, active && styles.radioOptionActive]}
                onPress={() => setDraftFilters((prev) => ({ ...prev, sortBy: option.key }))}
                accessibilityRole="button"
                accessibilityLabel={`Sort by ${option.label}`}
                accessibilityState={{ selected: active }}
              >
                <View style={[styles.radioDot, active && styles.radioDotActive]} />
                <Text style={styles.radioLabel}>{option.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <FilterSectionTitle title="Status" />
        <FilterSelectField
          label={statusOptions.find((s) => s.key === draftFilters.status)?.label || "Pending"}
          onPress={() => setIsStatusDropdownOpen((prev) => !prev)}
          isOpen={isStatusDropdownOpen}
          accessibilityLabel="Open status dropdown"
        />
        {isStatusDropdownOpen ? (
          <FilterDropdownList
            options={statusOptions}
            selectedKey={draftFilters.status}
            onSelect={(option) => {
              setDraftFilters((prev) => ({ ...prev, status: option.key }));
              setIsStatusDropdownOpen(false);
            }}
            getCount={(option) => effectiveStatusCounts[option.key] ?? 0}
          />
        ) : null}

        <FilterSectionTitle title="Date range" />
        <FilterChipGroup
          options={dateOptions}
          selectedKey={draftFilters.dateRange}
          onSelect={(option) =>
            setDraftFilters((prev) => ({ ...prev, dateRange: option.key }))
          }
          getCount={(option) => effectiveDateCounts[option.key] ?? 0}
        />

        <FilterSectionTitle title="Reservation type" />
        <FilterChipGroup
          options={reservationTypeOptions}
          selectedKey={draftFilters.reservationType}
          onSelect={(type) =>
            setDraftFilters((prev) => ({ ...prev, reservationType: type }))
          }
          getKey={(type) => type}
          getLabel={(type) =>
            type === "all"
              ? "All"
              : type
                  .split("-")
                  .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
                  .join(" ")
          }
        />

        <Button
          variant="primary"
          title={`Show Results (${draftFilteredCount || 0})`}
          onPress={applyFilters}
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
  filterButton: {
    minWidth: 86,
    height: 40,
    borderRadius: 20,
    backgroundColor: healthColors.background.tertiary,
    borderWidth: 1,
    borderColor: healthColors.border.light,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    gap: 6,
    paddingHorizontal: 12,
  },
  filterButtonText: {
    fontSize: theme.typography.sizes.bodySmall,
    color: healthColors.text.primary,
    fontWeight: "700",
  },
  headerTitle: {
    fontSize: theme.typography.sizes.h5,
    fontWeight: theme.typography.weights.bold,
    color: healthColors.text.primary,
  },
  searchContainer: {
    marginTop: 10,
    marginHorizontal: theme.spacing.md,
    marginBottom: 4,
  },
  loadingSkeletonWrap: {
    padding: theme.spacing.md,
    gap: theme.spacing.sm + theme.spacing.xs,
  },
  listContent: {
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.md,
    flexGrow: 1,
  },
  appointmentCard: {
    backgroundColor: healthColors.background.card,
    borderRadius: theme.borderRadius.card,
    padding: theme.spacing.md,
    marginTop: theme.spacing.sm,
    ...theme.shadows.sm,
  },
  appointmentHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.withOpacity(healthColors.primary.main, 0.08),
    justifyContent: "center",
    alignItems: "center",
    marginRight: theme.spacing.md,
  },
  appointmentInfo: {
    flex: 1,
  },
  doctorName: {
    fontSize: theme.typography.sizes.h6,
    fontWeight: theme.typography.weights.semibold,
    color: healthColors.text.primary,
  },
  patientName: {
    fontSize: theme.typography.sizes.sm,
    color: healthColors.text.secondary,
    marginTop: 2,
  },
  appointmentTime: {
    fontSize: theme.typography.sizes.sm,
    color: healthColors.text.tertiary,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.small,
  },
  statusText: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.medium,
    textTransform: "capitalize",
  },
  reason: {
    fontSize: theme.typography.sizes.sm,
    color: healthColors.text.secondary,
    marginTop: theme.spacing.sm,
    paddingTop: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: healthColors.border.light,
  },
  footerLoader: {
    paddingVertical: theme.spacing.md,
    alignItems: "center",
  },
  filterOptionRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 8,
  },
  radioOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: healthColors.border.light,
    borderRadius: 14,
    backgroundColor: healthColors.background.card,
    gap: 8,
  },
  radioOptionActive: {
    borderColor: healthColors.primary.main,
    backgroundColor: theme.withOpacity(healthColors.primary.main, 0.07),
  },
  radioDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: healthColors.border.medium,
  },
  radioDotActive: {
    borderColor: healthColors.primary.main,
    backgroundColor: healthColors.primary.main,
  },
  radioLabel: {
    fontSize: theme.typography.sizes.bodySmall,
    color: healthColors.text.primary,
    fontWeight: "600",
  },

  applyFilterButton: {
    marginTop: 16,
    marginBottom: 6,
  },
});

export default AppointmentsScreen;