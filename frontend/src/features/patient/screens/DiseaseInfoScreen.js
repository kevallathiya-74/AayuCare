/**
 * Disease Info Center Screen
 * Production-level, design-system aligned health library for patient education.
 */

import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  StatusBar,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { ArrowLeft, ArrowUpRight, Brain, Eye, Heart, Info, Leaf, Library, Search, ShieldCheck, Stethoscope, Wind, X } from "lucide-react-native";

import { theme, healthColors } from '@/theme';
import {
  Button,
  Card,
  EmptyState,
  ErrorRecovery,
  Input,
  NetworkStatusIndicator,
  SectionHeader,
} from '@/components/common';
import { getScreenPadding } from '@/utils/responsive';
import { handleSmartBack } from '@/utils/navigation';
import { logError, parseError, showError } from '@/utils/errorHandler';
import { useNetworkStatus } from '@/utils/offlineHandler';

const CATEGORIES = [
  { key: "heart", name: "Heart", icon: Heart, color: healthColors.error.main },
  { key: "lung", name: "Lung", icon: Wind, color: healthColors.info.main },
  { key: "brain", name: "Brain", icon: Brain, color: healthColors.primary.main },
  { key: "diabetes", name: "Diabetes", icon: Leaf, color: healthColors.warning.main },
  { key: "eye", name: "Eye", icon: Eye, color: healthColors.success.main },
  { key: "general", name: "General", icon: Stethoscope, color: healthColors.text.secondary },
];

const RESOURCE_LINKS = [
  {
    key: "video",
    title: "Video Library",
    subtitle: "WHO education videos",
    url: "https://www.youtube.com/@WHO",
    color: healthColors.error.main,
  },
  {
    key: "articles",
    title: "Articles",
    subtitle: "Clinical fact sheets",
    url: "https://www.who.int/news-room/fact-sheets",
    color: healthColors.info.main,
  },
  {
    key: "news",
    title: "Latest News",
    subtitle: "Trusted health updates",
    url: "https://www.healthline.com/health-news",
    color: healthColors.warning.main,
  },
];

const FEATURED_TOPICS = [
  {
    key: "covid",
    title: "COVID-19 Updates",
    url: "https://www.who.int/emergencies/diseases/novel-coronavirus-2019",
  },
  {
    key: "mental",
    title: "Mental Health Awareness",
    url: "https://www.who.int/news-room/fact-sheets/detail/mental-health-strengthening-our-response",
  },
  {
    key: "nutrition",
    title: "Nutrition Guide",
    url: "https://www.who.int/news-room/fact-sheets/detail/healthy-diet",
  },
];

const DISEASE_LIBRARY = {
  Heart: {
    title: "Cardiovascular Disease",
    overview:
      "A group of conditions affecting the heart and blood vessels, including coronary artery disease, rhythm disorders, and heart failure.",
    symptoms: [
      "Chest pain or pressure",
      "Shortness of breath",
      "Irregular heartbeat",
      "Fatigue and dizziness",
      "Swelling in legs",
    ],
    causes: [
      "High blood pressure",
      "High cholesterol",
      "Smoking",
      "Sedentary lifestyle",
      "Family history",
    ],
    treatment: [
      "Lifestyle modification",
      "Blood pressure/cholesterol control",
      "Structured exercise",
      "Clinical follow-up",
    ],
  },
  Lung: {
    title: "Respiratory Disease",
    overview:
      "Lung diseases include asthma, COPD, infections, and inflammatory conditions that affect breathing capacity.",
    symptoms: ["Persistent cough", "Wheezing", "Breathlessness", "Chest tightness", "Frequent infections"],
    causes: ["Air pollution", "Smoking", "Allergens", "Occupational exposure", "Infections"],
    treatment: ["Inhalers or medication", "Breathing exercises", "Smoking cessation", "Pulmonary review"],
  },
  Brain: {
    title: "Neurological Disorders",
    overview:
      "Neurological disorders affect the brain, spinal cord, or nerves and can impact movement, memory, and cognition.",
    symptoms: [
      "Persistent headache",
      "Weakness or numbness",
      "Memory changes",
      "Speech difficulty",
      "Balance problems",
    ],
    causes: ["Vascular conditions", "Infections", "Degenerative changes", "Metabolic imbalance", "Trauma"],
    treatment: ["Early diagnosis", "Medication", "Rehabilitation", "Lifestyle and risk control"],
  },
  Diabetes: {
    title: "Diabetes Mellitus",
    overview:
      "A chronic metabolic condition where blood glucose remains elevated due to insulin deficiency or insulin resistance.",
    symptoms: ["Frequent urination", "Increased thirst", "Unexplained weight change", "Fatigue", "Blurred vision"],
    causes: ["Genetic predisposition", "Insulin resistance", "Obesity", "Inactive lifestyle", "Diet patterns"],
    treatment: ["Glucose monitoring", "Diet planning", "Regular exercise", "Medication or insulin"],
  },
  Eye: {
    title: "Ocular Conditions",
    overview:
      "Eye conditions can affect visual acuity, pressure, retina health, and optic nerve function.",
    symptoms: ["Blurred vision", "Eye pain", "Light sensitivity", "Floaters", "Peripheral vision changes"],
    causes: ["Aging", "Diabetes", "UV exposure", "Genetic risk", "Inflammation"],
    treatment: ["Routine eye exams", "Medication", "Corrective lenses", "Procedure-based treatment"],
  },
  General: {
    title: "General Health Conditions",
    overview:
      "General conditions may involve multi-system symptoms and require clinical correlation for diagnosis.",
    symptoms: ["Fatigue", "Fever", "Body aches", "Poor appetite", "Sleep disturbance"],
    causes: ["Infections", "Stress", "Nutritional issues", "Inflammation", "Lifestyle imbalance"],
    treatment: ["Hydration and rest", "Symptom monitoring", "Healthy routine", "Doctor consultation"],
  },
};

const DEFAULT_DISEASE_DETAILS = {
  title: "Condition Overview",
  overview: "This condition overview is educational. Consult a clinician for personalized diagnosis.",
  symptoms: ["Symptoms vary by person and severity"],
  causes: ["Multiple contributing factors may be present"],
  treatment: ["Seek clinical guidance for a tailored treatment plan"],
};

const DiseaseInfoScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { isConnected } = useNetworkStatus();

  const [searchVisible, setSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [detailVisible, setDetailVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [screenError, setScreenError] = useState(null);

  const filteredCategories = useMemo(() => {
    const keyword = searchQuery.trim().toLowerCase();
    if (!keyword) return CATEGORIES;
    return CATEGORIES.filter((item) => item.name.toLowerCase().includes(keyword));
  }, [searchQuery]);

  const selectedDetails = useMemo(() => {
    if (!selectedCategory?.name) return DEFAULT_DISEASE_DETAILS;
    return DISEASE_LIBRARY[selectedCategory.name] || DEFAULT_DISEASE_DETAILS;
  }, [selectedCategory]);

  const openExternalLink = useCallback(
    async (url) => {
      if (!isConnected) {
        showError("No internet connection. Reconnect to open external resources.");
        return;
      }

      try {
        const canOpen = await Linking.canOpenURL(url);
        if (!canOpen) {
          showError("This link cannot be opened on your device.");
          return;
        }
        await Linking.openURL(url);
      } catch (error) {
        logError(error, { context: "DiseaseInfoScreen.openExternalLink", url });
        showError("Unable to open this resource right now.");
      }
    },
    [isConnected]
  );

  const handleOpenCategory = useCallback(async (category) => {
    try {
      setLoading(true);
      setScreenError(null);
      setSelectedCategory(category);
      setDetailVisible(true);
    } catch (error) {
      const message = parseError(error) || "Failed to load disease details.";
      setScreenError(message);
      showError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const closeDetailModal = useCallback(() => {
    setDetailVisible(false);
  }, []);

  const handleRetry = useCallback(() => {
    setScreenError(null);
  }, []);

  if (screenError) {
    return (
      <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
        <NetworkStatusIndicator />
        <ErrorRecovery
          error={screenError}
          onRetry={handleRetry}
          onDismiss={() => setScreenError(null)}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["left", "right", "bottom"]}>
      <StatusBar barStyle="dark-content" backgroundColor={healthColors.background.card} />
      <NetworkStatusIndicator />

      <View
        style={[styles.header, { paddingTop: insets.top + theme.spacing.xs }]}
      >
        <TouchableOpacity
          onPress={() => handleSmartBack(navigation, "PatientTabs")}
          style={styles.headerButton}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <ArrowLeft size={theme.iconSizes.md} color={healthColors.text.primary} />
        </TouchableOpacity>

        <View style={styles.headerTitleWrap} pointerEvents="none">
          <Text style={styles.headerTitle} numberOfLines={1}>Disease Info Center</Text>
        </View>

        <TouchableOpacity
          onPress={() => {
            setSearchVisible((prev) => !prev);
            if (searchVisible) setSearchQuery("");
          }}
          style={styles.headerButton}
          accessibilityRole="button"
          accessibilityLabel={searchVisible ? "Hide search" : "Show search"}
        >
          <Search size={theme.iconSizes.md} color={healthColors.text.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom + theme.spacing.md, theme.spacing.xl) },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.contentColumn}>
          {searchVisible && (
            <Card>
              <Input
                label="Search"
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search categories"
                leftIcon={<Search size={theme.iconSizes.sm} color={healthColors.text.tertiary} />}
              />
            </Card>
          )}

          <Card style={styles.sectionCard}>
            <SectionHeader title="1. Disease Categories" />

            {filteredCategories.length === 0 ? (
              <EmptyState
                icon={Info}
                title="No matching categories"
                message={`No results found for "${searchQuery}".`}
              />
            ) : (
              <View style={styles.categoryGrid}>
                {filteredCategories.map((category) => {
                  const IconComponent = category.icon;
                  return (
                    <TouchableOpacity
                      key={category.key}
                      style={[styles.categoryCard, { borderColor: `${category.color}33` }]}
                      onPress={() => handleOpenCategory(category)}
                      activeOpacity={0.85}
                      accessibilityRole="button"
                      accessibilityLabel={`Open ${category.name} information`}
                    >
                      <View style={[styles.categoryIconWrap, { backgroundColor: `${category.color}14` }]}>
                        <IconComponent size={theme.iconSizes.md} color={category.color} />
                      </View>
                      <Text style={styles.categoryName} numberOfLines={1}>{category.name}</Text>
                      <ArrowUpRight size={theme.iconSizes.xs} color={healthColors.text.tertiary} />
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </Card>

          <Card style={styles.sectionCard}>
            <SectionHeader title="2. Learning Resources" />
            <View style={styles.resourceList}>
              {RESOURCE_LINKS.map((item) => (
                <TouchableOpacity
                  key={item.key}
                  style={styles.resourceCard}
                  onPress={() => openExternalLink(item.url)}
                  accessibilityRole="button"
                  accessibilityLabel={`Open ${item.title}`}
                >
                  <View style={[styles.resourceDot, { backgroundColor: item.color }]} />
                  <View style={styles.resourceTextWrap}>
                    <Text style={styles.resourceTitle} numberOfLines={1}>{item.title}</Text>
                    <Text style={styles.resourceSubtitle} numberOfLines={1}>{item.subtitle}</Text>
                  </View>
                  <ArrowUpRight size={theme.iconSizes.sm} color={healthColors.text.tertiary} />
                </TouchableOpacity>
              ))}
            </View>
          </Card>

          <Card style={styles.sectionCard}>
            <SectionHeader title="3. Featured Topics" />
            <View style={styles.topicList}>
              {FEATURED_TOPICS.map((topic) => (
                <TouchableOpacity
                  key={topic.key}
                  style={styles.topicRow}
                  onPress={() => openExternalLink(topic.url)}
                  accessibilityRole="button"
                  accessibilityLabel={`Open topic ${topic.title}`}
                >
                  <View style={styles.topicBullet} />
                  <Text style={styles.topicText} numberOfLines={2}>{topic.title}</Text>
                  <ArrowUpRight size={theme.iconSizes.sm} color={healthColors.primary.main} />
                </TouchableOpacity>
              ))}
            </View>
          </Card>
        </View>
      </ScrollView>

      <Modal statusBarTranslucent
        visible={detailVisible}
        animationType="slide"
        transparent
        onRequestClose={closeDetailModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderLeft}>
                <Library size={theme.iconSizes.md} color={healthColors.primary.main} />
                <Text style={styles.modalTitle} numberOfLines={2}>{selectedDetails.title}</Text>
              </View>
              <TouchableOpacity
                onPress={closeDetailModal}
                style={styles.closeButton}
                accessibilityRole="button"
                accessibilityLabel="Close details"
              >
                <X size={theme.iconSizes.md} color={healthColors.text.secondary} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalContent}>
              <View style={styles.detailCard}>
                <Text style={styles.detailSectionTitle}>Overview</Text>
                <Text style={styles.detailBody}>{selectedDetails.overview}</Text>
              </View>

              <View style={styles.detailCard}>
                <Text style={styles.detailSectionTitle}>Symptoms</Text>
                {selectedDetails.symptoms.map((item) => (
                  <View key={`symptom-${item}`} style={styles.listRow}>
                    <Text style={styles.listBullet}>•</Text>
                    <Text style={styles.listBody}>{item}</Text>
                  </View>
                ))}
              </View>

              <View style={styles.detailCard}>
                <Text style={styles.detailSectionTitle}>Causes</Text>
                {selectedDetails.causes.map((item) => (
                  <View key={`cause-${item}`} style={styles.listRow}>
                    <Text style={styles.listBullet}>•</Text>
                    <Text style={styles.listBody}>{item}</Text>
                  </View>
                ))}
              </View>

              <View style={styles.detailCard}>
                <View style={styles.treatmentTitleRow}>
                  <ShieldCheck size={theme.iconSizes.sm} color={healthColors.success.main} />
                  <Text style={styles.detailSectionTitle}>Treatment</Text>
                </View>
                {selectedDetails.treatment.map((item) => (
                  <View key={`treat-${item}`} style={styles.listRow}>
                    <Text style={styles.listBullet}>•</Text>
                    <Text style={styles.listBody}>{item}</Text>
                  </View>
                ))}
              </View>

              <Button
                title="Open More Clinical Resources"
                onPress={() => openExternalLink("https://www.who.int/news-room/fact-sheets")}
                style={styles.modalAction}
              />
            </ScrollView>
          </View>
        </View>
      </Modal>

      {loading && (
        <View style={styles.loadingOverlay} pointerEvents="none">
          <ActivityIndicator size="large" color={healthColors.primary.main} />
        </View>
      )}
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
    paddingHorizontal: getScreenPadding(),
    paddingBottom: theme.spacing.md,
    minHeight: theme.spacing.xxxxl,
    backgroundColor: healthColors.background.card,
    borderBottomWidth: 1,
    borderBottomColor: healthColors.border.light,
  },
  headerButton: {
    width: theme.touchTargets.md,
    height: theme.touchTargets.md,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitleWrap: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: theme.spacing.sm,
  },
  headerTitle: {
    fontSize: theme.typography.sizes.xl,
    fontWeight: theme.typography.weights.bold,
    color: healthColors.text.primary,
    textAlign: "center",
  },

  scrollContent: {
    flexGrow: 1,
  },
  contentColumn: {
    width: "100%",
    maxWidth: 960,
    alignSelf: "center",
    paddingHorizontal: getScreenPadding(),
    paddingTop: theme.spacing.md,
    gap: theme.spacing.md,
  },
  sectionCard: {
    borderRadius: theme.borderRadius.card,
  },
  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.sm,
  },
  categoryCard: {
    width: "48%",
    minHeight: 96,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    backgroundColor: healthColors.background.card,
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  categoryIconWrap: {
    width: theme.spacing.xxl,
    height: theme.spacing.xxl,
    borderRadius: theme.borderRadius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  categoryName: {
    flex: 1,
    fontSize: theme.typography.sizes.bodyLarge,
    fontWeight: theme.typography.weights.semibold,
    color: healthColors.text.primary,
  },
  resourceList: {
    gap: theme.spacing.sm,
  },
  resourceCard: {
    minHeight: theme.touchTargets.md + 10,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: healthColors.border.light,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: healthColors.background.card,
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
  },
  resourceDot: {
    width: theme.spacing.sm,
    height: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
  },
  resourceTextWrap: {
    flex: 1,
    minWidth: 0,
  },
  resourceTitle: {
    fontSize: theme.typography.sizes.bodyMedium,
    color: healthColors.text.primary,
    fontWeight: theme.typography.weights.semibold,
  },
  resourceSubtitle: {
    marginTop: 2,
    fontSize: theme.typography.sizes.caption,
    color: healthColors.text.secondary,
  },
  topicList: {
    gap: theme.spacing.xs,
  },
  topicRow: {
    minHeight: theme.touchTargets.md,
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
    paddingVertical: theme.spacing.sm,
  },
  topicBullet: {
    width: 6,
    height: 6,
    borderRadius: theme.borderRadius.full,
    backgroundColor: healthColors.primary.main,
  },
  topicText: {
    flex: 1,
    fontSize: theme.typography.sizes.bodyMedium,
    color: healthColors.text.primary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: healthColors.background.overlay,
    justifyContent: "flex-end",
  },
  modalSheet: {
    maxHeight: "88%",
    backgroundColor: healthColors.background.primary,
    borderTopLeftRadius: theme.borderRadius.xxl,
    borderTopRightRadius: theme.borderRadius.xxl,
    overflow: "hidden",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: healthColors.border.light,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
  },
  modalHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
    flex: 1,
    minWidth: 0,
  },
  modalTitle: {
    flex: 1,
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.bold,
    color: healthColors.text.primary,
  },
  closeButton: {
    width: theme.touchTargets.md,
    height: theme.touchTargets.md,
    alignItems: "center",
    justifyContent: "center",
  },
  modalContent: {
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  detailCard: {
    borderRadius: theme.borderRadius.md,
    backgroundColor: healthColors.background.secondary,
    padding: theme.spacing.md,
    gap: theme.spacing.xs,
  },
  detailSectionTitle: {
    fontSize: theme.typography.sizes.bodyMedium,
    fontWeight: theme.typography.weights.semibold,
    color: healthColors.text.primary,
  },
  detailBody: {
    fontSize: theme.typography.sizes.bodyMedium,
    color: healthColors.text.secondary,
    lineHeight: theme.typography.sizes.bodyLarge + 4,
  },
  listRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: theme.spacing.xs,
  },
  listBullet: {
    color: healthColors.text.secondary,
    fontSize: theme.typography.sizes.bodyMedium,
    lineHeight: theme.typography.sizes.bodyLarge + 4,
  },
  listBody: {
    flex: 1,
    fontSize: theme.typography.sizes.bodyMedium,
    color: healthColors.text.secondary,
    lineHeight: theme.typography.sizes.bodyLarge + 4,
  },
  treatmentTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.xs,
    marginBottom: 2,
  },
  modalAction: {
    marginTop: theme.spacing.xs,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.withOpacity(healthColors.text.white, 0.45),
  },
});

export default DiseaseInfoScreen;
