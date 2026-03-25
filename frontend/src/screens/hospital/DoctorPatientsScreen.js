/**
 * Doctor Patients Screen
 * Lists patients who have visited this doctor.
 * Allows quick access to Write Rx and View History per patient.
 */

import React, { useState, useCallback, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { FileText, Eye, UserPlus, Search, XCircle } from "lucide-react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useInfiniteQuery } from "@tanstack/react-query";
import { theme, healthColors } from "../../theme";
import { getScreenPadding, verticalScale } from "../../utils/responsive";
import { doctorService } from "../../services";
import { queryKeys } from "../../config/reactQueryConfig";
import { logError, parseError } from "../../utils/errorHandler";
import { SkeletonCardRow, EmptyState, ErrorRecovery } from "../../components/common";

const PAGE_SIZE = 20;

const DoctorPatientsScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const searchDebounce = useRef(null);

  const {
    data,
    isLoading: loading,
    isError,
    error,
    refetch,
    isRefetching,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: queryKeys.patients.infinite({ doctor: true, search: debouncedSearch }),
    initialPageParam: 0,
    staleTime: 2 * 60 * 1000,
    queryFn: async ({ pageParam = 0 }) => {
      const response = await doctorService.searchMyPatients(debouncedSearch || "");

      let list = [];
      if (Array.isArray(response)) {
        list = response;
      } else if (response?.data) {
        list = Array.isArray(response.data) ? response.data : (response.data.patients || []);
      } else if (response?.patients) {
        list = response.patients;
      }

      const normalized = list.map((p) => ({
        ...p,
        id: p.id || p._id || p.userId,
        _id: p._id || p.id || p.userId,
      }));

      const start = pageParam;
      const items = normalized.slice(start, start + PAGE_SIZE);
      return {
        items,
        total: normalized.length,
      };
    },
    getNextPageParam: (lastPage, allPages) => {
      const loaded = allPages.reduce((sum, page) => sum + (page?.items?.length || 0), 0);
      return loaded < (lastPage?.total || 0) ? loaded : undefined;
    },
  });

  const patients = (data?.pages || []).flatMap((page) => page?.items || []);

  // Initial load & focus refresh
  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch])
  );

  // Debounced search
  useEffect(() => {
    if (searchDebounce.current) clearTimeout(searchDebounce.current);
    searchDebounce.current = setTimeout(() => {
      setDebouncedSearch(searchQuery.trim());
    }, 400);
    return () => clearTimeout(searchDebounce.current);
  }, [searchQuery]);

  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  const handleLoadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const handleWriteRx = useCallback(
    (patient) => {
      const patientId = patient.userId || patient.id || patient._id;
      if (!patientId) {
        Alert.alert("Error", "Unable to identify patient. Please try again.");
        return;
      }
      navigation.navigate("CreatePrescription", { patientId });
    },
    [navigation]
  );

  const handleViewHistory = useCallback(
    (patient) => {
      const patientId = patient.userId || patient.id || patient._id;
      navigation.navigate("PatientDetails", {
        patientId,
        patientName: patient.name,
      });
    },
    [navigation]
  );

  const renderPatientCard = ({ item }) => {
    const displayId = item.userId || item.formatted_user_id || item.id || "N/A";
    const initials = (item.name || "?")
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();

    return (
      <View style={styles.card}>
        <View style={styles.cardLeft}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <View style={styles.patientInfo}>
            <Text style={styles.patientName} numberOfLines={1}>
              {item.name || "Unknown Patient"}
            </Text>
            <Text style={styles.patientId}>ID: {displayId}</Text>
            {item.phone && (
              <Text style={styles.patientPhone}>{item.phone}</Text>
            )}
          </View>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.rxButton}
            onPress={() => handleWriteRx(item)}
            activeOpacity={0.7}
            accessibilityLabel={`Write prescription for ${item.name}`}
          >
            <FileText
              
              size={14}
              color={healthColors.primary.contrastText || "#fff"}
            />
            <Text style={styles.rxButtonText}>Write Rx</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.historyButton}
            onPress={() => handleViewHistory(item)}
            activeOpacity={0.7}
            accessibilityLabel={`View details for ${item.name}`}
          >
            <Eye
              
              size={18}
              color={healthColors.primary.main}
            />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>My Patients</Text>
          <Text style={styles.headerSubtitle}>
            {patients.length > 0
              ? `${patients.length} patient${patients.length !== 1 ? "s" : ""}`
              : "Search to find patients"}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.walkInButton}
          onPress={() => navigation.navigate("WalkInPatient")}
          activeOpacity={0.7}
        >
          <UserPlus  size={20} color={healthColors.primary.main} />
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Search
          
          size={18}
          color={healthColors.text.secondary}
          style={styles.searchIcon}
        />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name or phone…"
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor={healthColors.text.disabled}
          returnKeyType="search"
          clearButtonMode="while-editing"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery("")} style={styles.clearButton}>
            <XCircle  size={18} color={healthColors.text.disabled} />
          </TouchableOpacity>
        )}
      </View>

      {/* List */}
      {loading ? (
        <View style={{ padding: 16, gap: 12 }}>
          {[1, 2, 3, 4].map((i) => (<SkeletonCardRow key={i} />))}
        </View>
      ) : (
        <FlatList
          data={patients}
          renderItem={renderPatientCard}
          keyExtractor={(item, index) => String(item.id || item._id || item.userId || item.patientId || `patient-${index}`)}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.3}
          removeClippedSubviews={true}
          maxToRenderPerBatch={10}
          windowSize={10}
          initialNumToRender={10}
          getItemLayout={(_, index) => ({ length: 82, offset: 82 * index, index })}
          contentContainerStyle={[
            styles.listContent,
            patients.length === 0 && { flexGrow: 1 },
            { paddingBottom: Math.max(insets.bottom, 20) },
          ]}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={handleRefresh}
              tintColor={healthColors.primary.main}
            />
          }
          ListFooterComponent={
            isFetchingNextPage ? (
              <View style={styles.footerLoader}>
                <ActivityIndicator size="small" color={healthColors.primary.main} />
              </View>
            ) : null
          }
          ListEmptyComponent={
            isError ? (
              <EmptyState
                icon="alert-circle-outline"
                title="Unable to Load Patients"
                message={parseError(error)}
                actionLabel="Try Again"
                onActionPress={handleRefresh}
              />
            ) : (
              <EmptyState
                icon={searchQuery ? "search-outline" : "people-outline"}
                title={searchQuery ? "No Results Found" : "No Patients Yet"}
                message={
                  searchQuery
                    ? `No patients match "${searchQuery}". Try a different name or phone number.`
                    : "Patients who have consulted you will appear here. Register a walk-in patient to get started."
                }
                actionLabel={searchQuery ? undefined : "Register Walk-In"}
                onActionPress={searchQuery ? undefined : () => navigation.navigate("WalkInPatient")}
              />
            )
          }
        />
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
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: theme.typography.sizes.h4,
    fontWeight: theme.typography.weights.bold,
    color: healthColors.text.primary,
  },
  headerSubtitle: {
    fontSize: theme.typography.sizes.caption,
    color: healthColors.text.secondary,
    marginTop: 2,
  },
  walkInButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: healthColors.primary.light + "20",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: healthColors.background.card,
    marginHorizontal: getScreenPadding(),
    marginVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: healthColors.border.light,
    paddingHorizontal: 12,
    height: 44,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: theme.typography.sizes.body,
    color: healthColors.text.primary,
    paddingVertical: 0,
  },
  clearButton: {
    padding: 4,
  },
  listContent: {
    paddingHorizontal: getScreenPadding(),
    paddingTop: 4,
  },
  footerLoader: {
    paddingVertical: 12,
    alignItems: "center",
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: healthColors.background.card,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: healthColors.border.light,
    shadowColor: healthColors.shadows?.small || "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  cardLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: healthColors.primary.light + "30",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  avatarText: {
    fontSize: theme.typography.sizes.subheading,
    fontWeight: theme.typography.weights.bold,
    color: healthColors.primary.main,
  },
  patientInfo: {
    flex: 1,
  },
  patientName: {
    fontSize: theme.typography.sizes.body,
    fontWeight: theme.typography.weights.semibold || "600",
    color: healthColors.text.primary,
  },
  patientId: {
    fontSize: theme.typography.sizes.caption,
    color: healthColors.text.secondary,
    marginTop: 2,
  },
  patientPhone: {
    fontSize: theme.typography.sizes.caption,
    color: healthColors.text.disabled,
    marginTop: 1,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  rxButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: healthColors.primary.main,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  rxButtonText: {
    fontSize: theme.typography.sizes.bodySmall,
    fontWeight: "600",
    color: healthColors.primary.contrastText || "#fff",
  },
  historyButton: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: healthColors.primary.light + "20",
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  loadingText: {
    fontSize: theme.typography.sizes.body,
    color: healthColors.text.secondary,
  },
});

export default DoctorPatientsScreen;
