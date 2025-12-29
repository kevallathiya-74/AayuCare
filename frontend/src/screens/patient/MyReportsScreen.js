/**
 * My Reports Screen (Patient)
 * View and download medical reports
 * Categorized by type and date
 */

import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useSelector } from "react-redux";
import { healthColors } from "../../theme/healthColors";
import { indianDesign, createShadow } from "../../theme/indianDesign";
import { ErrorRecovery, NetworkStatusIndicator } from "../../components/common";
import { showError, logError } from "../../utils/errorHandler";
import { useNetworkStatus } from "../../utils/offlineHandler";
import { medicalRecordService } from "../../services";

const MyReportsScreen = ({ navigation }) => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const user = useSelector((state) => state.auth.user);
  const { isConnected } = useNetworkStatus();
  const insets = useSafeAreaInsets();

  // Fetch reports from API
  const fetchReports = useCallback(async () => {
    if (!user?._id) {
      setError("User not found");
      setLoading(false);
      return;
    }

    if (!isConnected) {
      showError("No internet connection");
      setLoading(false);
      return;
    }

    try {
      setError(null);
      const response = await medicalRecordService.getPatientRecords(
        user.userId
      );
      const records =
        response?.data?.medicalRecords || response?.medicalRecords || [];

      // Format records as reports
      const formattedReports = records.map((record) => ({
        id: record._id,
        title: record.title || "Medical Report",
        type: formatRecordType(record.recordType || "general"),
        date: new Date(record.createdAt || record.date).toLocaleDateString(
          "en-IN",
          {
            day: "numeric",
            month: "short",
            year: "numeric",
          }
        ),
        doctor: record.doctorId?.name || record.doctorName || "Unknown Doctor",
        fileType: determineFileType(record),
        recordData: record,
      }));

      setReports(formattedReports);
    } catch (err) {
      logError(err, { context: "MyReportsScreen.fetchReports" });
      setError("Failed to load reports");
      showError("Failed to load reports. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [user, isConnected]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchReports();
    setRefreshing(false);
  }, [fetchReports]);

  const formatRecordType = (type) => {
    const typeMap = {
      lab_report: "Lab Report",
      imaging: "Imaging",
      test_result: "Test Result",
      doctor_visit: "Doctor Visit",
      prescription: "Prescription",
    };
    return typeMap[type] || "Medical Report";
  };

  const determineFileType = (record) => {
    if (record.attachments && record.attachments.length > 0) {
      const ext = record.attachments[0].split(".").pop().toLowerCase();
      return ["jpg", "jpeg", "png", "gif"].includes(ext) ? "Image" : "PDF";
    }
    return record.recordType === "imaging" ? "Image" : "PDF";
  };

  const getFileIcon = (fileType) => {
    return fileType === "PDF" ? "document-text" : "image";
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
        <StatusBar
          barStyle="dark-content"
          backgroundColor={healthColors.background.primary}
        />
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
          <Text style={styles.headerTitle}>My Reports</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={healthColors.primary.main} />
          <Text style={styles.loadingText}>Loading reports...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const renderReport = ({ item }) => (
    <TouchableOpacity
      style={styles.reportCard}
      onPress={() =>
        Alert.alert(
          "Report Viewer",
          `Viewing ${item.title} - Full report viewer coming soon!`
        )
      }
      activeOpacity={0.7}
    >
      {/* Removed navigation to non-existent ReportViewer screen */}
      <View style={styles.reportLeft}>
        <View style={[styles.fileIcon, styles[`fileType_${item.fileType}`]]}>
          <Ionicons
            name={getFileIcon(item.fileType)}
            size={24}
            color={healthColors.text.white}
          />
        </View>
        <View style={styles.reportInfo}>
          <Text style={styles.reportTitle}>{item.title}</Text>
          <Text style={styles.reportType}>{item.type}</Text>
          <View style={styles.reportMeta}>
            <Ionicons
              name="calendar-outline"
              size={12}
              color={healthColors.text.tertiary}
            />
            <Text style={styles.metaText}>{item.date}</Text>
            <Text style={styles.metaDivider}>•</Text>
            <Text style={styles.metaText}>{item.doctor}</Text>
          </View>
        </View>
      </View>
      <View style={styles.reportRight}>
        <TouchableOpacity style={styles.downloadButton} activeOpacity={0.7}>
          <Ionicons
            name="download-outline"
            size={20}
            color={healthColors.primary.main}
          />
        </TouchableOpacity>
        <TouchableOpacity style={styles.shareButton} activeOpacity={0.7}>
          <Ionicons
            name="share-outline"
            size={20}
            color={healthColors.text.secondary}
          />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={healthColors.background.primary}
      />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Ionicons
            name="arrow-back"
            size={24}
            color={healthColors.text.primary}
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Reports</Text>
        <TouchableOpacity style={styles.filterButton} activeOpacity={0.7}>
          <Ionicons name="filter" size={24} color={healthColors.text.primary} />
        </TouchableOpacity>
      </View>

      {/* Reports List */}
      <FlatList
        data={reports}
        renderItem={renderReport}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.listContent,
          reports.length === 0 && styles.emptyListContent,
          { paddingBottom: Math.max(insets.bottom, 20) },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[healthColors.primary.main]}
            tintColor={healthColors.primary.main}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons
              name="document-text-outline"
              size={64}
              color={healthColors.text.disabled}
            />
            <Text style={styles.emptyStateTitle}>No Reports Found</Text>
            <Text style={styles.emptyStateText}>
              Your medical reports will appear here once they are uploaded by
              your doctor.
            </Text>
          </View>
        }
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: indianDesign.spacing.lg,
    paddingVertical: indianDesign.spacing.md,
    backgroundColor: healthColors.background.card,
    ...createShadow(2),
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: healthColors.background.tertiary,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: indianDesign.fontSize.xlarge,
    fontWeight: indianDesign.fontWeight.bold,
    color: healthColors.text.primary,
  },
  filterButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: healthColors.background.tertiary,
    justifyContent: "center",
    alignItems: "center",
  },
  listContent: {
    padding: indianDesign.spacing.lg,
    gap: indianDesign.spacing.md,
  },
  reportCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: healthColors.background.card,
    borderRadius: indianDesign.borderRadius.large,
    padding: indianDesign.spacing.md,
    ...createShadow(2),
  },
  reportLeft: {
    flexDirection: "row",
    flex: 1,
    gap: indianDesign.spacing.md,
  },
  fileIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  fileType_PDF: {
    backgroundColor: healthColors.error.main,
  },
  fileType_Image: {
    backgroundColor: healthColors.info.main,
  },
  reportInfo: {
    flex: 1,
    justifyContent: "center",
  },
  reportTitle: {
    fontSize: indianDesign.fontSize.medium,
    fontWeight: indianDesign.fontWeight.semibold,
    color: healthColors.text.primary,
    marginBottom: 2,
  },
  reportType: {
    fontSize: indianDesign.fontSize.small,
    color: healthColors.text.secondary,
    marginBottom: 4,
  },
  reportMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  metaText: {
    fontSize: indianDesign.fontSize.tiny,
    color: healthColors.text.tertiary,
  },
  metaDivider: {
    fontSize: indianDesign.fontSize.tiny,
    color: healthColors.text.tertiary,
  },
  reportRight: {
    gap: indianDesign.spacing.xs,
    justifyContent: "center",
  },
  downloadButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: healthColors.primary.main + "15",
    justifyContent: "center",
    alignItems: "center",
  },
  shareButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: healthColors.background.tertiary,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: indianDesign.fontSize.medium,
    color: healthColors.text.secondary,
  },
  emptyListContent: {
    flexGrow: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: indianDesign.spacing.xl,
    minHeight: 400,
  },
  emptyStateTitle: {
    fontSize: indianDesign.fontSize.large,
    fontWeight: indianDesign.fontWeight.semibold,
    color: healthColors.text.primary,
    marginTop: indianDesign.spacing.md,
    marginBottom: indianDesign.spacing.xs,
  },
  emptyStateText: {
    fontSize: indianDesign.fontSize.medium,
    color: healthColors.text.secondary,
    textAlign: "center",
    lineHeight: 20,
  },
});

export default MyReportsScreen;
