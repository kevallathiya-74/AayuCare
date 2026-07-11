/**
 * My Reports Screen (Patient)
 * View and download medical reports
 * Categorized by type and date
 */

import React, { useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  StatusBar,
  Alert,
  RefreshControl,
  Linking,
  Share,
  Modal,
  ScrollView,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import {
  ArrowLeft,
  Calendar,
  Download,
  Share2,
  Filter,
  XCircle,
  Folder,
  User,
} from "lucide-react-native";
import { useSelector } from "react-redux";
import { useQuery } from "@tanstack/react-query";
import { theme, healthColors } from "@/theme";
import { queryKeys } from "@/config/reactQueryConfig";
import {
  ErrorRecovery,
  SkeletonCardRow,
  EmptyState,
  ModalSheet,
  FilterHeaderRow,
  FilterSectionTitle,
  FilterChipGroup,
  Card,
} from "@/components/common";
import { parseError } from "@/utils/errorHandler";
import { medicalRecordService } from "@/services";
import { DynamicIcon } from "@/components/common";
import { handleSmartBack } from "@/utils/navigation";

const MyReportsScreen = ({ navigation }) => {
  const [selectedReport, setSelectedReport] = useState(null);
  const [filterType, setFilterType] = useState(null);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const user = useSelector((state) => state.auth.user);

  const insets = useSafeAreaInsets();

  const {
    data: reports = [],
    isLoading: loading,
    isRefetching,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: queryKeys.medicalRecords.list({
      scope: "patient-reports",
      patientId: user?.id,
    }),
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const response = await medicalRecordService.getPatientRecords(user.id);
      const records =
        response?.data?.medicalRecords || response?.medicalRecords || [];

      return records.map((record) => ({
        id: record.id,
        title: record.title || "Medical Report",
        type: formatRecordType(record.recordType || "general"),
        date: new Date(record.createdAt || record.date).toLocaleDateString(
          "en-IN",
          {
            day: "numeric",
            month: "short",
            year: "numeric",
          },
        ),
        doctor: record.doctorName || "Unknown Doctor",
        fileType: determineFileType(record),
        recordData: record,
      }));
    },
  });

  const onRefresh = useCallback(async () => {
    await refetch();
  }, [refetch]);

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

  const FILTER_OPTIONS = [
    "All",
    "Lab Report",
    "Imaging",
    "Test Result",
    "Doctor Visit",
    "Prescription",
  ];

  const filteredReports = useMemo(
    () => (filterType ? reports.filter((r) => r.type === filterType) : reports),
    [filterType, reports],
  );

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
            onPress={() => handleSmartBack(navigation, "PatientTabs")}
            style={styles.backButton}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <ArrowLeft size={24} color={healthColors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Reports</Text>
          <View style={styles.headerRightSpacer} />
        </View>
        <View style={styles.skeletonWrap}>
          {[1, 2, 3, 4].map((i) => (
            <SkeletonCardRow key={i} />
          ))}
        </View>
      </SafeAreaView>
    );
  }

  const renderReport = ({ item }) => (
    <Card style={styles.reportCard} onPress={() => setSelectedReport(item)}>
      {/* Removed navigation to non-existent ReportViewer screen */}
      <View style={styles.reportLeft}>
        <View style={[styles.fileIcon, styles[`fileType_${item.fileType}`]]}>
          <DynamicIcon
            name={getFileIcon(item.fileType)}
            size={theme.iconSizes.lg}
            color={healthColors.text.white}
          />
        </View>
        <View style={styles.reportInfo}>
          <Text style={styles.reportTitle}>{item.title}</Text>
          <Text style={styles.reportType}>{item.type}</Text>
          <View style={styles.reportMeta}>
            <DynamicIcon
              name="calendar-outline"
              size={theme.iconSizes.xs}
              color={healthColors.text.tertiary}
            />
            <Text style={styles.metaText}>{item.date}</Text>
            <Text style={styles.metaDivider}>•</Text>
            <Text style={styles.metaText}>{item.doctor}</Text>
          </View>
        </View>
      </View>
      <View style={styles.reportRight}>
        <TouchableOpacity
          style={styles.downloadButton}
          activeOpacity={0.7}
          onPress={() => {
            const url = item.recordData?.attachments?.[0];
            if (url) {
              Linking.openURL(url).catch(() =>
                Alert.alert("Error", "Unable to open file."),
              );
            } else {
              Alert.alert(
                "Not Available",
                "No downloadable file is attached to this report.",
              );
            }
          }}
          accessibilityRole="button"
          accessibilityLabel={`Download report ${item.title}`}
        >
          <Download size={20} color={healthColors.primary.main} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.shareButton}
          activeOpacity={0.7}
          onPress={() => {
            Share.share({
              title: item.title,
              message: `${item.title}\nType: ${item.type}\nDate: ${item.date}\nDoctor: ${item.doctor}`,
            }).catch(() => {});
          }}
          accessibilityRole="button"
          accessibilityLabel={`Share report ${item.title}`}
        >
          <Share2 size={20} color={healthColors.text.secondary} />
        </TouchableOpacity>
      </View>
    </Card>
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
          onPress={() => handleSmartBack(navigation, "PatientTabs")}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <ArrowLeft size={24} color={healthColors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Reports</Text>
        <TouchableOpacity
          style={styles.filterButton}
          activeOpacity={0.7}
          onPress={() => setFilterModalVisible(true)}
          accessibilityRole="button"
          accessibilityLabel="Open report filters"
        >
          <Filter size={theme.iconSizes.lg} color={healthColors.text.primary} />
        </TouchableOpacity>
      </View>

      {/* Reports List */}
      {isError && !reports.length ? (
        <ErrorRecovery
          error={parseError(error)}
          onRetry={refetch}
          onGoBack={() => handleSmartBack(navigation, "PatientTabs")}
        />
      ) : (
        <FlatList
          data={filteredReports}
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
              refreshing={isRefetching}
              onRefresh={onRefresh}
              colors={[healthColors.primary.main]}
              tintColor={healthColors.primary.main}
            />
          }
          removeClippedSubviews={true}
          maxToRenderPerBatch={10}
          windowSize={10}
          initialNumToRender={10}
          ListEmptyComponent={
            <EmptyState
              icon="document-text-outline"
              title="No Reports Found"
              message="Your medical reports will appear here once they are uploaded by your doctor."
            />
          }
        />
      )}

      {/* Report Detail Modal */}
      <Modal
        statusBarTranslucent
        animationType="slide"
        transparent={true}
        visible={!!selectedReport}
        onRequestClose={() => setSelectedReport(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle} numberOfLines={2}>
                {selectedReport?.title}
              </Text>
              <TouchableOpacity
                onPress={() => setSelectedReport(null)}
                accessibilityRole="button"
                accessibilityLabel="Close report details"
              >
                <XCircle size={28} color={healthColors.text.tertiary} />
              </TouchableOpacity>
            </View>
            <ScrollView>
              {selectedReport && (
                <>
                  <View style={styles.detailRow}>
                    <Calendar
                      size={theme.iconSizes.xs}
                      color={healthColors.text.secondary}
                    />
                    <Text style={styles.detailText}>{selectedReport.date}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Folder
                      size={theme.iconSizes.xs}
                      color={healthColors.text.secondary}
                    />
                    <Text style={styles.detailText}>{selectedReport.type}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <User
                      size={theme.iconSizes.xs}
                      color={healthColors.text.secondary}
                    />
                    <Text style={styles.detailText}>
                      Dr. {selectedReport.doctor}
                    </Text>
                  </View>
                  {selectedReport.recordData?.description && (
                    <View style={styles.detailBlock}>
                      <Text style={styles.detailBlockTitle}>Description</Text>
                      <Text style={styles.detailBlockBody}>
                        {selectedReport.recordData.description}
                      </Text>
                    </View>
                  )}
                  {selectedReport.recordData?.diagnosis && (
                    <View style={styles.detailBlock}>
                      <Text style={styles.detailBlockTitle}>Diagnosis</Text>
                      <Text style={styles.detailBlockBody}>
                        {selectedReport.recordData.diagnosis}
                      </Text>
                    </View>
                  )}
                  {selectedReport.recordData?.aiAnalysis?.summary && (
                    <View style={styles.detailBlockAi}>
                      <Text style={styles.detailBlockTitle}>AI Analysis</Text>
                      <Text style={styles.detailBlockBody}>
                        {selectedReport.recordData.aiAnalysis.summary}
                      </Text>
                    </View>
                  )}
                  <View style={styles.modalActions}>
                    <TouchableOpacity
                      style={styles.modalActionBtn}
                      onPress={() => {
                        const url = selectedReport.recordData?.attachments?.[0];
                        if (url) {
                          Linking.openURL(url).catch(() =>
                            Alert.alert("Error", "Unable to open file."),
                          );
                        } else {
                          Alert.alert("Not Available", "No file attached.");
                        }
                      }}
                      accessibilityRole="button"
                      accessibilityLabel="Download selected report"
                    >
                      <Download
                        size={theme.iconSizes.sm}
                        color={healthColors.primary.main}
                      />
                      <Text style={styles.modalActionText}>Download</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.modalActionBtn}
                      onPress={() =>
                        Share.share({
                          title: selectedReport.title,
                          message: `${selectedReport.title}\nType: ${selectedReport.type}\nDate: ${selectedReport.date}\nDoctor: ${selectedReport.doctor}`,
                        }).catch(() => {})
                      }
                      accessibilityRole="button"
                      accessibilityLabel="Share selected report"
                    >
                      <Share2
                        size={theme.iconSizes.sm}
                        color={healthColors.text.secondary}
                      />
                      <Text style={styles.modalActionText}>Share</Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <ModalSheet
        visible={filterModalVisible}
        onClose={() => setFilterModalVisible(false)}
        title="Filter Reports"
        maxHeight={0.55}
      >
        <FilterHeaderRow
          clearLabel="Clear"
          onClear={() => {
            setFilterType(null);
            setFilterModalVisible(false);
          }}
        />
        <FilterSectionTitle title="Report type" />
        <FilterChipGroup
          options={FILTER_OPTIONS}
          selectedKey={filterType || "All"}
          onSelect={(opt) => {
            setFilterType(opt === "All" ? null : opt);
            setFilterModalVisible(false);
          }}
          getKey={(opt) => opt}
          getLabel={(opt) => opt}
          getCount={(opt) => {
            if (opt === "All") return reports.length;
            return reports.filter((report) => report.type === opt).length;
          }}
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
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
  headerTitle: {
    fontSize: theme.typography.sizes.xxxl,
    fontWeight: theme.typography.weights.bold,
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
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  reportCard: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  reportLeft: {
    flexDirection: "row",
    flex: 1,
    gap: theme.spacing.md,
  },
  fileIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },

  reportInfo: {
    flex: 1,
    justifyContent: "center",
  },
  reportTitle: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.semibold,
    color: healthColors.text.primary,
    marginBottom: 2,
  },
  reportType: {
    fontSize: theme.typography.sizes.sm,
    color: healthColors.text.secondary,
    marginBottom: 4,
  },
  reportMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  metaText: {
    fontSize: theme.typography.sizes.xs,
    color: healthColors.text.tertiary,
  },
  metaDivider: {
    fontSize: theme.typography.sizes.xs,
    color: healthColors.text.tertiary,
  },
  reportRight: {
    gap: theme.spacing.xs,
    justifyContent: "center",
  },
  downloadButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.withOpacity(healthColors.primary.main, 0.08),
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

  emptyListContent: {
    flexGrow: 1,
  },
  headerRightSpacer: {
    width: 24,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: healthColors.background.overlay,
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: theme.colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: theme.spacing.xl,
    maxHeight: "85%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: theme.spacing.lg,
  },
  modalTitle: {
    fontSize: theme.typography.sizes.h5,
    fontWeight: theme.typography.weights.bold,
    color: healthColors.text.primary,
    flex: 1,
    marginRight: theme.spacing.md,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: theme.spacing.sm,
  },
  detailText: {
    fontSize: theme.typography.sizes.bodyMedium,
    color: healthColors.text.secondary,
  },
  detailBlock: {
    marginTop: theme.spacing.md,
    padding: theme.spacing.md,
    backgroundColor: healthColors.background.secondary,
    borderRadius: theme.borderRadius.md,
  },
  detailBlockTitle: {
    fontSize: theme.typography.sizes.bodyMedium,
    fontWeight: theme.typography.weights.bold,
    color: healthColors.text.primary,
    marginBottom: 4,
  },
  detailBlockBody: {
    fontSize: theme.typography.sizes.bodyMedium,
    color: healthColors.text.secondary,
    lineHeight: 22,
  },
  modalActions: {
    flexDirection: "row",
    gap: theme.spacing.md,
    marginTop: theme.spacing.lg,
  },
  modalActionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: healthColors.border.light,
  },
  modalActionText: {
    fontSize: theme.typography.sizes.bodyMedium,
    color: healthColors.text.secondary,
  },

  skeletonWrap: { padding: 16, gap: 12 },
  detailBlockAi: {
    marginTop: theme.spacing.md,
    padding: theme.spacing.md,
    backgroundColor: healthColors.background.secondary,
    borderRadius: theme.borderRadius.md,
    borderLeftColor: healthColors.primary.main,
    borderLeftWidth: 3,
  },
});

export default MyReportsScreen;
