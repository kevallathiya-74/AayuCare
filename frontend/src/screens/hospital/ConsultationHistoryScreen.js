import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { healthColors } from "../../theme/healthColors";
import {
  moderateScale,
  scaledFontSize,
  getScreenPadding,
  verticalScale,
} from "../../utils/responsive";
import { doctorService } from "../../services";
import { logError } from "../../utils/errorHandler";

const ConsultationHistoryScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [consultations, setConsultations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [filter, setFilter] = useState("all");

  const fetchConsultations = useCallback(
    async (pageNum = 1, refresh = false) => {
      try {
        if (refresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        const filters = {
          page: pageNum,
          limit: 20,
        };

        // Only add status filter if not "all"
        if (filter !== "all") {
          filters.status = filter;
        }

        const response = await doctorService.getConsultationHistory(filters);

        if (response.success) {
          const newData = response.data.consultations || [];
          if (refresh || pageNum === 1) {
            setConsultations(newData);
          } else {
            setConsultations((prev) => [...prev, ...newData]);
          }
          setHasMore(pageNum < response.data.pagination.totalPages);
        }
      } catch (error) {
        logError(error, {
          context: "ConsultationHistoryScreen.fetchConsultations",
        });
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [filter]
  );

  useEffect(() => {
    fetchConsultations(1, true);
  }, [filter]);

  const handleRefresh = () => {
    setPage(1);
    fetchConsultations(1, true);
  };

  const handleLoadMore = () => {
    if (!loading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchConsultations(nextPage);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "completed":
        return healthColors.success.main;
      case "cancelled":
        return healthColors.error.main;
      case "no_show":
        return healthColors.text.disabled;
      default:
        return healthColors.primary.main;
    }
  };

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
        navigation.navigate("PatientManagement", {
          patientId: item.patientId?._id,
        })
      }
      activeOpacity={0.7}
    >
      <View style={styles.consultationHeader}>
        <View style={styles.patientInfo}>
          <View style={styles.avatarContainer}>
            <Ionicons
              name="person"
              size={24}
              color={healthColors.primary.main}
            />
          </View>
          <View style={styles.patientDetails}>
            <Text style={styles.patientName}>
              {item.patientId?.name || "Unknown Patient"}
            </Text>
            <Text style={styles.patientId}>
              ID: {item.patientId?.userId || "N/A"}
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
          <Ionicons
            name="calendar-outline"
            size={16}
            color={healthColors.text.secondary}
          />
          <Text style={styles.detailText}>
            {new Date(item.appointmentDate).toLocaleDateString("en-IN")}
          </Text>
        </View>
        {item.appointmentTime && (
          <View style={styles.detailRow}>
            <Ionicons
              name="time-outline"
              size={16}
              color={healthColors.text.secondary}
            />
            <Text style={styles.detailText}>{item.appointmentTime}</Text>
          </View>
        )}
        {item.reason && (
          <View style={styles.detailRow}>
            <Ionicons
              name="document-text-outline"
              size={16}
              color={healthColors.text.secondary}
            />
            <Text style={styles.detailText} numberOfLines={1}>
              {item.reason}
            </Text>
          </View>
        )}
      </View>

      {item.patientId?.phone && (
        <View style={styles.contactRow}>
          <Ionicons
            name="call-outline"
            size={14}
            color={healthColors.text.disabled}
          />
          <Text style={styles.contactText}>{item.patientId.phone}</Text>
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
        setPage(1);
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
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons
            name="arrow-back"
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
          <Ionicons
            name="time-outline"
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
        keyExtractor={(item) => item._id}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: Math.max(insets.bottom, 20) },
        ]}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={
          !loading && (
            <View style={styles.emptyState}>
              <Ionicons
                name="file-tray-outline"
                size={80}
                color={healthColors.text.disabled}
              />
              <Text style={styles.emptyStateTitle}>No Consultations Found</Text>
              <Text style={styles.emptyStateText}>
                {filter === "all"
                  ? "You haven't had any consultations yet"
                  : `No ${filter} consultations found`}
              </Text>
            </View>
          )
        }
        ListFooterComponent={
          loading &&
          consultations.length > 0 && (
            <ActivityIndicator
              size="small"
              color={healthColors.primary.main}
              style={{ marginVertical: 20 }}
            />
          )
        }
      />

      {loading && consultations.length === 0 && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={healthColors.primary.main} />
          <Text style={styles.loadingText}>Loading consultations...</Text>
        </View>
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
    paddingVertical: moderateScale(16),
    backgroundColor: healthColors.background.card,
    borderBottomWidth: 1,
    borderBottomColor: healthColors.border.light,
  },
  backButton: {
    padding: moderateScale(4),
  },
  headerContent: {
    flex: 1,
    marginLeft: moderateScale(12),
  },
  headerTitle: {
    fontSize: scaledFontSize(20),
    fontWeight: "700",
    color: healthColors.text.primary,
  },
  headerSubtitle: {
    fontSize: scaledFontSize(13),
    color: healthColors.text.secondary,
    marginTop: moderateScale(2),
  },
  headerIconContainer: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: moderateScale(20),
    backgroundColor: healthColors.primary.background,
    alignItems: "center",
    justifyContent: "center",
  },
  filterContainer: {
    flexDirection: "row",
    paddingHorizontal: getScreenPadding(),
    paddingVertical: moderateScale(12),
    backgroundColor: healthColors.background.card,
    gap: moderateScale(8),
  },
  filterButton: {
    paddingVertical: moderateScale(8),
    paddingHorizontal: moderateScale(16),
    borderRadius: moderateScale(20),
    borderWidth: 1,
    borderColor: healthColors.border.light,
    backgroundColor: healthColors.background.primary,
  },
  filterButtonActive: {
    backgroundColor: healthColors.primary.main,
    borderColor: healthColors.primary.main,
  },
  filterText: {
    fontSize: scaledFontSize(13),
    fontWeight: "600",
    color: healthColors.text.secondary,
  },
  filterTextActive: {
    color: "#FFF",
  },
  listContent: {
    padding: getScreenPadding(),
  },
  consultationCard: {
    backgroundColor: healthColors.background.card,
    borderRadius: moderateScale(14),
    padding: moderateScale(16),
    marginBottom: moderateScale(12),
    borderWidth: 1,
    borderColor: healthColors.border.light,
  },
  consultationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: moderateScale(12),
  },
  patientInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  avatarContainer: {
    width: moderateScale(48),
    height: moderateScale(48),
    borderRadius: moderateScale(24),
    backgroundColor: healthColors.primary.background,
    alignItems: "center",
    justifyContent: "center",
    marginRight: moderateScale(12),
  },
  patientDetails: {
    flex: 1,
  },
  patientName: {
    fontSize: scaledFontSize(16),
    fontWeight: "700",
    color: healthColors.text.primary,
    marginBottom: moderateScale(2),
  },
  patientId: {
    fontSize: scaledFontSize(12),
    color: healthColors.text.secondary,
  },
  statusBadge: {
    paddingHorizontal: moderateScale(10),
    paddingVertical: moderateScale(6),
    borderRadius: moderateScale(12),
  },
  statusText: {
    fontSize: scaledFontSize(11),
    fontWeight: "700",
  },
  consultationDetails: {
    gap: moderateScale(8),
    marginBottom: moderateScale(12),
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(8),
  },
  detailText: {
    fontSize: scaledFontSize(14),
    color: healthColors.text.secondary,
    flex: 1,
  },
  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: moderateScale(12),
    borderTopWidth: 1,
    borderTopColor: healthColors.border.light,
    gap: moderateScale(6),
  },
  contactText: {
    fontSize: scaledFontSize(12),
    color: healthColors.text.disabled,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: verticalScale(80),
  },
  emptyStateTitle: {
    fontSize: scaledFontSize(18),
    fontWeight: "700",
    color: healthColors.text.primary,
    marginTop: moderateScale(16),
    marginBottom: moderateScale(8),
  },
  emptyStateText: {
    fontSize: scaledFontSize(14),
    color: healthColors.text.secondary,
    textAlign: "center",
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: verticalScale(80),
  },
  loadingText: {
    fontSize: scaledFontSize(14),
    color: healthColors.text.secondary,
    marginTop: moderateScale(12),
  },
});

export default ConsultationHistoryScreen;
