import React, { useState, useMemo, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { User, Calendar, Clock, FileText, Phone, ArrowLeft } from "lucide-react-native";
import { theme, healthColors } from "../../theme";
import {
  getScreenPadding,
  verticalScale,
} from "../../utils/responsive";
import { useInfiniteQuery } from "@tanstack/react-query";
import { queryKeys } from "../../config/reactQueryConfig";
import { doctorService } from "../../services";
import { logError, parseError } from "../../utils/errorHandler";
import { convertTo12Hour, getStatusColor } from "../../utils/helpers";
import { SkeletonCardRow, EmptyState } from "../../components/common";
import { EmptyStateConfig } from "../../utils/constants";
import { handleSmartBack } from "../../utils/navigation";

const PAGE_SIZE = 20;

const ConsultationHistoryScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [filter, setFilter] = useState("all");
  const {
    data,
    isLoading: loading,
    isRefetching,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch,
    isError,
    error,
  } = useInfiniteQuery({
    queryKey: queryKeys.appointments.infinite({ scope: "consultation-history", filter }),
    initialPageParam: 1,
    staleTime: 2 * 60 * 1000,
    queryFn: async ({ pageParam = 1 }) => {
      const filters = { page: pageParam, limit: PAGE_SIZE };
      if (filter !== "all") {
        filters.status = filter;
      }

      const response = await doctorService.getConsultationHistory(filters);
      const consultations = response?.data?.consultations || [];
      const pagination = response?.data?.pagination || {};

      return {
        consultations,
        currentPage: Number(pagination?.currentPage || pageParam),
        totalPages: Number(pagination?.totalPages || 1),
        total: Number(pagination?.total || consultations.length),
      };
    },
    getNextPageParam: (lastPage) => {
      const nextPage = lastPage.currentPage + 1;
      return nextPage <= lastPage.totalPages ? nextPage : undefined;
    },
  });

  const consultations = useMemo(
    () => (data?.pages || []).flatMap((page) => page?.consultations || []),
    [data]
  );

  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  const handleLoadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  

  const getStatusText = (status) => {
    switch (status) {
      case "completed":
        return "Completed";
      case "cancelled":
        return "Cancelled";
      case "no_show":
        return "No Show";
      case "confirmed":
        return "Confirmed";
      default:
        return "Scheduled";
    }
  };

  const renderConsultation = ({ item }) => (
    <TouchableOpacity
      style={styles.consultationCard}
      onPress={() =>
        navigation.navigate("PatientDetails", {
          patientId: item.patientUserId || item.patientId,
          patientName: item.patientName,
        })
      }
      activeOpacity={0.7}
    >
      <View style={styles.consultationHeader}>
        <View style={styles.patientInfo}>
          <View style={styles.avatarContainer}>
            <User
              
              size={24}
              color={healthColors.primary.main}
            />
          </View>
          <View style={styles.patientDetails}>
            <Text style={styles.patientName}>
              {item.patientName || "Unknown Patient"}
            </Text>
            <Text style={styles.patientId}>
              {item.patientUserId || item.patientId || "N/A"}
            </Text>
          </View>
        </View>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(item.status) + "20" },
          ]}
        >
          <Text
            style={[styles.statusText, { color: getStatusColor(item.status) }]}
          >
            {getStatusText(item.status)}
          </Text>
        </View>
      </View>

      <View style={styles.consultationDetails}>
        <View style={styles.detailRow}>
          <Calendar
            
            size={16}
            color={healthColors.text.secondary}
          />
          <Text style={styles.detailText}>
            {new Date(item.appointmentDate).toLocaleDateString("en-IN")}
          </Text>
        </View>
        {item.appointmentTime && (
          <View style={styles.detailRow}>
            <Clock
              
              size={16}
              color={healthColors.text.secondary}
            />
            <Text style={styles.detailText}>{convertTo12Hour(item.appointmentTime)}</Text>
          </View>
        )}
        {item.reason && (
          <View style={styles.detailRow}>
            <FileText
              
              size={16}
              color={healthColors.text.secondary}
            />
            <Text style={styles.detailText} numberOfLines={1}>
              {item.reason}
            </Text>
          </View>
        )}
      </View>

      {item.patientPhone && (
        <View style={styles.contactRow}>
          <Phone
            
            size={14}
            color={healthColors.text.disabled}
          />
          <Text style={styles.contactText}>{item.patientPhone}</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  const renderFilterButton = (filterValue, label) => (
    <TouchableOpacity
      style={[
        styles.filterButton,
        filter === filterValue && styles.filterButtonActive,
      ]}
      onPress={() => {
        setFilter(filterValue);
      }}
      activeOpacity={0.7}
    >
      <Text
        style={[
          styles.filterText,
          filter === filterValue && styles.filterTextActive,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => handleSmartBack(navigation, "DoctorTabs")}
          style={styles.backButton}
        >
          <ArrowLeft
            
            size={24}
            color={healthColors.text.primary}
          />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Consultation History</Text>
          <Text style={styles.headerSubtitle}>
            {consultations.length} consultations
          </Text>
        </View>
        <View style={styles.headerIconContainer}>
          <Clock
            
            size={24}
            color={healthColors.primary.main}
          />
        </View>
      </View>

      <View style={styles.filterContainer}>
        {renderFilterButton("all", "All")}
        {renderFilterButton("completed", "Completed")}
        {renderFilterButton("cancelled", "Cancelled")}
        {renderFilterButton("scheduled", "Scheduled")}
      </View>

      <FlatList
        data={consultations}
        renderItem={renderConsultation}
        keyExtractor={(item, index) => item.id || item._id || `consultation-${index}`}
        contentContainerStyle={[
          styles.listContent,
          consultations.length === 0 && { flexGrow: 1 },
          { paddingBottom: Math.max(insets.bottom, 20) },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={handleRefresh}
            tintColor={healthColors.primary.main}
          />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.3}
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        windowSize={10}
        initialNumToRender={10}
        getItemLayout={(_, index) => ({ length: 182, offset: 182 * index, index })}
        ListEmptyComponent={
          !loading && (
            isError ? (
              <EmptyState
                icon={EmptyStateConfig.CONSULTATIONS.icon}
                title="Error Loading Data"
                message={parseError(error)}
                actionLabel="Try Again"
                onActionPress={handleRefresh}
              />
            ) : (
              <EmptyState
                icon={EmptyStateConfig.CONSULTATIONS.icon}
                title={filter === "all" ? EmptyStateConfig.CONSULTATIONS.title : `No ${filter.charAt(0).toUpperCase() + filter.slice(1)} Consultations`}
                message={
                  filter === "all"
                    ? EmptyStateConfig.CONSULTATIONS.message
                    : `No ${filter} consultations found. Try the All tab to see everything.`
                }
              />
            )
          )
        }
        ListFooterComponent={
          isFetchingNextPage &&
          consultations.length > 0 && (
            <ActivityIndicator
              size="small"
              color={healthColors.primary.main}
              style={styles.footerLoader}
            />
          )
        }
      />

      {loading && consultations.length === 0 && (
        <View style={{ padding: 16, gap: 12 }}>{[1, 2, 3, 4].map((i) => (<SkeletonCardRow key={i} />))}</View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: healthColors.background.secondary,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: getScreenPadding(),
    paddingVertical: 16,
    backgroundColor: healthColors.background.card,
    borderBottomWidth: 1,
    borderBottomColor: healthColors.border.light,
  },
  backButton: {
    padding: 4,
  },
  headerContent: {
    flex: 1,
    marginLeft: 12,
  },
  headerTitle: {
    fontSize: theme.typography.sizes.h4,
    fontWeight: theme.typography.weights.bold,
    color: healthColors.text.primary,
  },
  headerSubtitle: {
    fontSize: theme.typography.sizes.bodyMedium,
    color: healthColors.text.secondary,
    marginTop: 2,
  },
  headerIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: healthColors.primary.background,
    alignItems: "center",
    justifyContent: "center",
  },
  filterContainer: {
    flexDirection: "row",
    paddingHorizontal: getScreenPadding(),
    paddingVertical: 12,
    backgroundColor: healthColors.background.card,
    gap: 8,
  },
  filterButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: healthColors.border.light,
    backgroundColor: healthColors.background.primary,
  },
  filterButtonActive: {
    backgroundColor: healthColors.primary.main,
    borderColor: healthColors.primary.main,
  },
  filterText: {
    fontSize: theme.typography.sizes.bodyMedium,
    fontWeight: theme.typography.weights.semibold,
    color: healthColors.text.secondary,
  },
  filterTextActive: {
    color: theme.colors.white,
  },
  listContent: {
    padding: getScreenPadding(),
  },
  consultationCard: {
    backgroundColor: healthColors.background.card,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: healthColors.border.light,
  },
  consultationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  patientInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: healthColors.primary.background,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  patientDetails: {
    flex: 1,
  },
  patientName: {
    fontSize: theme.typography.sizes.bodyLarge,
    fontWeight: theme.typography.weights.bold,
    color: healthColors.text.primary,
    marginBottom: 2,
  },
  patientId: {
    fontSize: theme.typography.sizes.caption,
    color: healthColors.text.secondary,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: theme.typography.sizes.overline,
    fontWeight: theme.typography.weights.bold,
  },
  consultationDetails: {
    gap: 8,
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  detailText: {
    fontSize: theme.typography.sizes.bodyMedium,
    color: healthColors.text.secondary,
    flex: 1,
  },
  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: healthColors.border.light,
    gap: 6,
  },
  contactText: {
    fontSize: theme.typography.sizes.caption,
    color: healthColors.text.disabled,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: verticalScale(80),
  },
  loadingText: {
    fontSize: theme.typography.sizes.bodyMedium,
    color: healthColors.text.secondary,
    marginTop: 12,
  },
  footerLoader: {
    marginVertical: 20,
  },
});

export default ConsultationHistoryScreen;




