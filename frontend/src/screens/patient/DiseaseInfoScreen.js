/**
 * Disease Info Center Screen
 * Health library with categories, disease details, symptoms, prevention
 */

import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  TextInput,
  Linking,
  Alert,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { ArrowLeft, Library, Search, XCircle, Video, ChevronRight, FileText, Newspaper, ArrowRight, PlayCircle, Image, ShieldCheck, Utensils, Activity, Sun, Apple, Coffee, Moon, Footprints, Bike, Hand, Heart, Maximize } from "lucide-react-native";
import { theme, healthColors } from "../../theme";
import {
  getScreenPadding,
  verticalScale,
} from "../../utils/responsive";
import NetworkStatusIndicator from "../../components/common/NetworkStatusIndicator";
import ErrorRecovery from "../../components/common/ErrorRecovery";
import EmptyState from "../../components/common/EmptyState";
import { showError, logError, parseError } from "../../utils/errorHandler";
import { useNetworkStatus } from "../../utils/offlineHandler";
import { DynamicIcon } from "../../components/common";
import { handleSmartBack } from "../../utils/navigation";

const quickAccessLinks = {
  "Video Library": "https://www.youtube.com/@WHO",
  "Articles": "https://www.who.int/news-room/fact-sheets",
  "Latest News": "https://www.healthline.com/health-news",
};

const featuredTopicLinks = {
  "COVID-19 Updates": "https://www.who.int/emergencies/diseases/novel-coronavirus-2019",
  "Mental Health Awareness": "https://www.who.int/news-room/fact-sheets/detail/mental-health-strengthening-our-response",
  "Nutrition Guide": "https://www.who.int/news-room/fact-sheets/detail/healthy-diet",
};

const categories = [
  { icon: "heart", name: "Heart", color: healthColors.error.main },
  { icon: "pulse", name: "Lung", color: healthColors.info.main },
  { icon: "bulb-outline", name: "Brain", color: theme.colors.healthcare.purple },
  { icon: "water", name: "Diabetes", color: healthColors.warning.main },
  { icon: "medkit", name: "Bone", color: healthColors.text.secondary },
  { icon: "eye", name: "Eye", color: theme.colors.healthcare.teal },
];

const DiseaseInfoScreen = ({ navigation }) => {
  const [selectedDisease, setSelectedDisease] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [dietChartVisible, setDietChartVisible] = useState(false);
  const [exercisePlanVisible, setExercisePlanVisible] = useState(false);
  const [searchVisible, setSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { isConnected } = useNetworkStatus();
  const insets = useSafeAreaInsets();

  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return categories;
    return categories.filter((c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  const openURL = async (url) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert("Cannot Open", "Unable to open this link on your device.");
      }
    } catch (e) {
      logError(e, { context: "DiseaseInfoScreen.openURL", url });
      Alert.alert("Error", "Failed to open link.");
    }
  };

  const diseaseDetails = {
    Diabetes: {
      name: "Diabetes Mellitus",
      icon: "water",
      color: healthColors.warning.main,
      description:
        "A metabolic disorder characterized by high blood sugar levels over prolonged periods.",
      symptoms: [
        "Frequent urination",
        "Increased thirst",
        "Unexplained weight loss",
        "Fatigue and weakness",
        "Blurred vision",
        "Slow-healing wounds",
      ],
      prevention: [
        "Maintain healthy weight",
        "Exercise regularly (30 min/day)",
        "Balanced diet with low sugar",
        "Regular health checkups",
        "Stress management",
        "Adequate sleep",
      ],
      statistics: { prevalence: "8.7% of adults", riskAge: "45+ years" },
    },
    Heart: {
      name: "Cardiovascular Disease",
      icon: "heart",
      color: healthColors.error.main,
      description:
        "A group of disorders affecting the heart and blood vessels, including coronary artery disease, heart failure, and arrhythmias.",
      symptoms: [
        "Chest pain or pressure",
        "Shortness of breath",
        "Irregular heartbeat",
        "Fatigue and dizziness",
        "Swelling in legs or ankles",
        "Pain radiating to arm or jaw",
      ],
      prevention: [
        "Quit smoking",
        "Exercise 150 min/week",
        "Control blood pressure",
        "Maintain healthy cholesterol",
        "Eat heart-healthy foods",
        "Limit alcohol intake",
      ],
      statistics: { prevalence: "Leading cause of death", riskAge: "40+ years" },
    },
    Lung: {
      name: "Respiratory Diseases",
      icon: "pulse",
      color: healthColors.info.main,
      description:
        "Conditions affecting the lungs and airways, including asthma, COPD, pneumonia, and lung cancer.",
      symptoms: [
        "Persistent cough",
        "Shortness of breath",
        "Wheezing",
        "Chest tightness",
        "Mucus production",
        "Frequent respiratory infections",
      ],
      prevention: [
        "Avoid smoking and second-hand smoke",
        "Reduce air pollution exposure",
        "Wear mask in dusty environments",
        "Get annual flu vaccine",
        "Maintain good indoor air quality",
        "Regular lung function tests",
      ],
      statistics: { prevalence: "10% of population", riskAge: "All ages" },
    },
    Brain: {
      name: "Neurological Disorders",
      icon: "bulb-outline",
      color: theme.colors.healthcare.purple,
      description:
        "Disorders affecting the brain, spinal cord, and nerves, including stroke, epilepsy, Parkinson's disease, and Alzheimer's.",
      symptoms: [
        "Sudden severe headache",
        "Memory loss or confusion",
        "Weakness or numbness",
        "Vision disturbances",
        "Difficulty speaking",
        "Loss of balance or coordination",
      ],
      prevention: [
        "Control blood pressure",
        "Exercise regularly",
        "Avoid head injuries (wear helmets)",
        "Manage diabetes and cholesterol",
        "Avoid smoking and excess alcohol",
        "Stay mentally active",
      ],
      statistics: { prevalence: "1 in 6 people", riskAge: "55+ years" },
    },
    Bone: {
      name: "Musculoskeletal Disorders",
      icon: "medkit",
      color: healthColors.text.secondary,
      description:
        "Conditions affecting bones, muscles, and joints, including arthritis, osteoporosis, and back pain.",
      symptoms: [
        "Joint pain and stiffness",
        "Swelling around joints",
        "Limited range of motion",
        "Bone tenderness",
        "Muscle weakness",
        "Frequent fractures",
      ],
      prevention: [
        "Calcium and Vitamin D intake",
        "Weight-bearing exercises",
        "Avoid smoking",
        "Maintain healthy weight",
        "Ergonomic posture",
        "Regular bone density check",
      ],
      statistics: { prevalence: "30% of adults over 50", riskAge: "50+ years" },
    },
    Eye: {
      name: "Ocular Diseases",
      icon: "eye",
      color: theme.colors.healthcare.teal,
      description:
        "Conditions affecting vision and eye health, including glaucoma, cataracts, diabetic retinopathy, and macular degeneration.",
      symptoms: [
        "Blurred or cloudy vision",
        "Eye pain or redness",
        "Flashes of light or floaters",
        "Loss of peripheral vision",
        "Sensitivity to light",
        "Double vision",
      ],
      prevention: [
        "Annual eye examinations",
        "Wear UV-protective sunglasses",
        "Control blood sugar (prevent diabetic retinopathy)",
        "Eat leafy greens and fish",
        "Limit screen time and take breaks",
        "Avoid smoking",
      ],
      statistics: { prevalence: "2.2 billion people affected", riskAge: "40+ years" },
    },
  };

  const handleCategoryPress = async (category) => {
    try {
      setLoading(true);
      setError(null);

      const info = diseaseDetails[category.name];
      if (info) {
        setSelectedDisease(info);
        setModalVisible(true);
      } else {
        // Fallback: generic placeholder for unmapped categories
        setSelectedDisease({
          name: `${category.name} Conditions`,
          icon: category.icon,
          color: category.color,
          description: `Information about ${category.name} related conditions and disorders.`,
          symptoms: ["Consult your doctor for specific symptoms"],
          prevention: ["Regular checkups", "Healthy lifestyle"],
          statistics: { prevalence: "Varies", riskAge: "All ages" },
        });
        setModalVisible(true);
      }
    } catch (err) {
      logError(err, {
        context: "DiseaseInfoScreen.handleCategoryPress",
        category: category.name,
      });
      setError(parseError(err));
      showError("Failed to load disease information");
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    setError(null);
  };

  if (error) {
    return (
      <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
        <NetworkStatusIndicator />
        <ErrorRecovery
          error={error}
          onRetry={handleRetry}
          onDismiss={() => setError(null)}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <NetworkStatusIndicator />
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={healthColors.primary.main} />
        </View>
      )}
      {/* Header */}
      <LinearGradient
        colors={[theme.colors.healthcare.purple, theme.colors.healthcare.purple]}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <TouchableOpacity onPress={() => handleSmartBack(navigation, "PatientTabs")}>
          <ArrowLeft  size={24} color={theme.colors.white} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Library  size={32} color={theme.colors.white} />
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>Disease Info Center</Text>
            <Text style={styles.headerSubtitle}>Health Library</Text>
          </View>
        </View>
        <TouchableOpacity onPress={() => setSearchVisible((v) => !v)}>
          <Search  size={24} color={theme.colors.white} />
        </TouchableOpacity>
      </LinearGradient>

      {searchVisible && (
        <View style={styles.searchBar}>
          <Search  size={18} color={healthColors.text.tertiary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search diseases..."
            placeholderTextColor={healthColors.text.tertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <XCircle  size={18} color={healthColors.text.tertiary} />
            </TouchableOpacity>
          )}
        </View>
      )}
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: Math.max(insets.bottom, 20) },
        ]}
      >
        {/* Categories Grid */}
        <View style={styles.categoriesGrid}>
          {filteredCategories.length === 0 ? (
            <EmptyState
              icon="search-outline"
              title="No Categories Found"
              message={`We couldn't find any health categories matching "${searchQuery}".`}
            />
          ) : (
            filteredCategories.map((category) => (
              <TouchableOpacity
                key={category.name}
                style={styles.categoryCard}
                onPress={() => handleCategoryPress(category)}
              >
                <LinearGradient
                  colors={[category.color, category.color + "DD"]}
                  style={styles.categoryGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <DynamicIcon
                    name={category.icon}
                    size={48}
                    color={theme.colors.text.white}
                    style={styles.categoryIcon}
                  />
                  <Text style={styles.categoryName}>{category.name}</Text>
                </LinearGradient>
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* Quick Access */}
        <View style={styles.section}>
          <View style={styles.sectionTitleRow}>
            <DynamicIcon
              name="search"
              size={20}
              color={healthColors.primary.main}
            />
            <Text style={styles.sectionTitle}>QUICK ACCESS</Text>
          </View>
          <View style={styles.quickAccessCard}>
            <TouchableOpacity
              style={styles.quickAccessItem}
              onPress={() => openURL(quickAccessLinks["Video Library"])}
            >
              <Video  size={24} color={healthColors.error.main} />
              <Text style={styles.quickAccessText}>Video Library</Text>
              <ChevronRight  size={20} color={healthColors.text.tertiary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickAccessItem}
              onPress={() => openURL(quickAccessLinks["Articles"])}
            >
              <FileText  size={24} color={healthColors.info.main} />
              <Text style={styles.quickAccessText}>Articles</Text>
              <ChevronRight  size={20} color={healthColors.text.tertiary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickAccessItem}
              onPress={() => openURL(quickAccessLinks["Latest News"])}
            >
              <Newspaper  size={24} color={healthColors.warning.main} />
              <Text style={styles.quickAccessText}>Latest News</Text>
              <ChevronRight  size={20} color={healthColors.text.tertiary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Featured Topics */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⭐ FEATURED TOPICS</Text>
          <View style={styles.card}>
            {[
              "COVID-19 Updates",
              "Mental Health Awareness",
              "Nutrition Guide",
            ].map((topic) => (
              <TouchableOpacity
                key={topic}
                style={styles.topicItem}
                onPress={() => openURL(featuredTopicLinks[topic])}
              >
                <View style={styles.topicDot} />
                <Text style={styles.topicText}>{topic}</Text>
                <ArrowRight  size={18} color={theme.colors.healthcare.purple} />
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Disease Detail Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView>
              {selectedDisease && (
                <>
                  {/* Modal Header */}
                  <View style={styles.modalHeader}>
                    <View style={styles.modalTitleRow}>
                      <View
                        style={[
                          styles.modalIconContainer,
                          { backgroundColor: selectedDisease.color + "20" },
                        ]}
                      >
                        <DynamicIcon
                          name={selectedDisease.icon}
                          size={32}
                          color={selectedDisease.color}
                        />
                      </View>
                      <View style={styles.modalTitleText}>
                        <Text style={styles.modalTitle}>
                          {selectedDisease.name}
                        </Text>
                      </View>
                      <TouchableOpacity onPress={() => setModalVisible(false)}>
                        <DynamicIcon
                          name="close-circle"
                          size={32}
                          color={healthColors.text.tertiary}
                        />
                      </TouchableOpacity>
                    </View>
                    <Text style={styles.modalDescription}>
                      {selectedDisease.description}
                    </Text>
                  </View>

                  {/* Video Section */}
                  <TouchableOpacity
                    style={styles.videoSection}
                    onPress={() => openURL(`https://www.youtube.com/results?search_query=${encodeURIComponent((selectedDisease?.name || "") + " disease education")}`)}>
                    <LinearGradient
                      colors={[healthColors.warning.main, healthColors.warning.dark]}
                      style={styles.videoGradient}
                    >
                      <PlayCircle  size={64} color={theme.colors.white} />
                      <Text style={styles.videoText}>
                        Watch Educational Video
                      </Text>
                      <Text style={styles.videoDuration}>
                        Duration: 3:45 mins
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>

                  {/* Image Gallery Button */}
                  <TouchableOpacity
                    style={[styles.videoSection, { marginTop: 0 }]}
                    onPress={() => openURL(`https://www.google.com/search?tbm=isch&q=${encodeURIComponent((selectedDisease?.name || "") + " anatomy diagram")}`)}>
                    <LinearGradient
                      colors={[healthColors.info.main, healthColors.info.dark]}
                      style={styles.videoGradient}
                    >
                      <Image  size={48} color={theme.colors.white} />
                      <Text style={styles.videoText}>View Images</Text>
                    </LinearGradient>
                  </TouchableOpacity>

                  {/* Statistics */}
                  <View style={styles.statsRow}>
                    <View style={styles.statCard}>
                      <Text style={styles.statLabel}>Prevalence</Text>
                      <Text style={styles.statValue}>
                        {selectedDisease.statistics.prevalence}
                      </Text>
                    </View>
                    <View style={styles.statCard}>
                      <Text style={styles.statLabel}>Risk Age</Text>
                      <Text style={styles.statValue}>
                        {selectedDisease.statistics.riskAge}
                      </Text>
                    </View>
                  </View>

                  {/* Symptoms */}
                  <View style={styles.detailSection}>
                    <Text style={styles.detailTitle}>SYMPTOMS:</Text>
                    {selectedDisease.symptoms.map((symptom) => (
                      <View key={symptom} style={styles.listItem}>
                        <Text style={styles.listBullet}>•</Text>
                        <Text style={styles.listText}>{symptom}</Text>
                      </View>
                    ))}
                  </View>

                  {/* Prevention */}
                  <View style={styles.detailSection}>
                    <View style={styles.detailTitleContainer}>
                      <ShieldCheck
                        
                        size={18}
                        color={healthColors.primary.main}
                      />
                      <Text style={styles.detailTitle}>PREVENTION:</Text>
                    </View>
                    {selectedDisease.prevention.map((item) => (
                      <View key={item} style={styles.listItem}>
                        <Text style={styles.listBullet}>•</Text>
                        <Text style={styles.listText}>{item}</Text>
                      </View>
                    ))}
                  </View>

                  {/* Action Buttons */}
                  <View style={styles.actionButtons}>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => setDietChartVisible(true)}
                    >
                      <LinearGradient
                        colors={[healthColors.success.main, healthColors.success.dark]}
                        style={styles.actionGradient}
                      >
                        <Utensils
                          
                          size={18}
                          color={theme.colors.white}
                        />
                        <Text style={styles.actionButtonText}>Diet Chart</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => setExercisePlanVisible(true)}
                    >
                      <LinearGradient
                        colors={[healthColors.info.main, healthColors.info.dark]}
                        style={styles.actionGradient}
                      >
                        <Activity
                          
                          size={18}
                          color={theme.colors.white}
                        />
                        <Text style={styles.actionButtonText}>
                          Exercise Plan
                        </Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Diet Chart Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={dietChartVisible}
        onRequestClose={() => setDietChartVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Diet Chart for {selectedDisease?.name || "Diabetes"}</Text>
              <TouchableOpacity onPress={() => setDietChartVisible(false)}>
                <XCircle
                  
                  size={32}
                  color={healthColors.text.tertiary}
                />
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={{ padding: theme.spacing.lg }}>
              {/* Breakfast */}
              <View style={styles.dietSection}>
                <View style={styles.dietMealTitleContainer}>
                  <Sun  size={18} color={healthColors.warning.main} />
                  <Text style={styles.dietMealTitle}>
                    BREAKFAST (7:00 - 8:00 AM)
                  </Text>
                </View>
                <View style={styles.dietItem}>
                  <Text style={styles.dietItemText}>
                    • Oatmeal (1 cup) with berries
                  </Text>
                  <Text style={styles.dietCal}>150 cal</Text>
                </View>
                <View style={styles.dietItem}>
                  <Text style={styles.dietItemText}>• 1 Boiled egg</Text>
                  <Text style={styles.dietCal}>70 cal</Text>
                </View>
                <View style={styles.dietItem}>
                  <Text style={styles.dietItemText}>
                    • Green tea (unsweetened)
                  </Text>
                  <Text style={styles.dietCal}>0 cal</Text>
                </View>
              </View>

              {/* Mid-Morning Snack */}
              <View style={styles.dietSection}>
                <View style={styles.dietMealTitleContainer}>
                  <Apple
                    
                    size={18}
                    color={healthColors.success.main}
                  />
                  <Text style={styles.dietMealTitle}>
                    MID-MORNING (10:00 AM)
                  </Text>
                </View>
                <View style={styles.dietItem}>
                  <Text style={styles.dietItemText}>• 1 Apple or orange</Text>
                  <Text style={styles.dietCal}>60 cal</Text>
                </View>
                <View style={styles.dietItem}>
                  <Text style={styles.dietItemText}>
                    • Handful of almonds (5-6)
                  </Text>
                  <Text style={styles.dietCal}>50 cal</Text>
                </View>
              </View>

              {/* Lunch */}
              <View style={styles.dietSection}>
                <View style={styles.dietMealTitleContainer}>
                  <Utensils
                    
                    size={18}
                    color={healthColors.error.main}
                  />
                  <Text style={styles.dietMealTitle}>
                    LUNCH (12:30 - 1:30 PM)
                  </Text>
                </View>
                <View style={styles.dietItem}>
                  <Text style={styles.dietItemText}>• Brown rice (1 cup)</Text>
                  <Text style={styles.dietCal}>200 cal</Text>
                </View>
                <View style={styles.dietItem}>
                  <Text style={styles.dietItemText}>
                    • Grilled chicken/fish (100g)
                  </Text>
                  <Text style={styles.dietCal}>150 cal</Text>
                </View>
                <View style={styles.dietItem}>
                  <Text style={styles.dietItemText}>
                    • Mixed vegetable salad
                  </Text>
                  <Text style={styles.dietCal}>50 cal</Text>
                </View>
                <View style={styles.dietItem}>
                  <Text style={styles.dietItemText}>
                    • Buttermilk (1 glass)
                  </Text>
                  <Text style={styles.dietCal}>40 cal</Text>
                </View>
              </View>

              {/* Evening Snack */}
              <View style={styles.dietSection}>
                <View style={styles.dietMealTitleContainer}>
                  <Coffee  size={18} color={healthColors.text.secondary} />
                  <Text style={styles.dietMealTitle}>EVENING (4:00 PM)</Text>
                </View>
                <View style={styles.dietItem}>
                  <Text style={styles.dietItemText}>
                    • Green tea with 2 whole wheat biscuits
                  </Text>
                  <Text style={styles.dietCal}>80 cal</Text>
                </View>
              </View>

              {/* Dinner */}
              <View style={styles.dietSection}>
                <View style={styles.dietMealTitleContainer}>
                  <Moon  size={18} color={healthColors.info.dark} />
                  <Text style={styles.dietMealTitle}>
                    DINNER (7:00 - 8:00 PM)
                  </Text>
                </View>
                <View style={styles.dietItem}>
                  <Text style={styles.dietItemText}>• 2 Whole wheat rotis</Text>
                  <Text style={styles.dietCal}>150 cal</Text>
                </View>
                <View style={styles.dietItem}>
                  <Text style={styles.dietItemText}>• Dal (1 bowl)</Text>
                  <Text style={styles.dietCal}>100 cal</Text>
                </View>
                <View style={styles.dietItem}>
                  <Text style={styles.dietItemText}>• Vegetable curry</Text>
                  <Text style={styles.dietCal}>80 cal</Text>
                </View>
                <View style={styles.dietItem}>
                  <Text style={styles.dietItemText}>• Salad</Text>
                  <Text style={styles.dietCal}>30 cal</Text>
                </View>
              </View>

              {/* Important Notes */}
              <View style={styles.notesBox}>
                <Text style={styles.notesTitle}>IMPORTANT NOTES:</Text>
                <Text style={styles.notesText}>
                  • Drink 8-10 glasses of water daily
                </Text>
                <Text style={styles.notesText}>
                  • Avoid sugary drinks and processed foods
                </Text>
                <Text style={styles.notesText}>• Eat at regular intervals</Text>
                <Text style={styles.notesText}>
                  • Monitor blood sugar regularly
                </Text>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Exercise Plan Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={exercisePlanVisible}
        onRequestClose={() => setExercisePlanVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Exercise Plan for {selectedDisease?.name || "Diabetes"}</Text>
              <TouchableOpacity onPress={() => setExercisePlanVisible(false)}>
                <XCircle
                  
                  size={32}
                  color={healthColors.text.tertiary}
                />
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={{ padding: theme.spacing.lg }}>
              {/* Weekly Plan */}
              <View style={styles.exerciseDay}>
                <Text style={styles.exerciseDayTitle}>
                  MONDAY - WEDNESDAY - FRIDAY
                </Text>
                <Text style={styles.exerciseCategory}>Cardio (30 minutes)</Text>
                <View style={styles.exerciseItem}>
                  <Footprints  size={20} color={healthColors.success.main} />
                  <Text style={styles.exerciseText}>
                    Brisk Walking - 15 min
                  </Text>
                </View>
                <View style={styles.exerciseItem}>
                  <Bike  size={20} color={healthColors.success.main} />
                  <Text style={styles.exerciseText}>Cycling - 15 min</Text>
                </View>
              </View>

              <View style={styles.exerciseDay}>
                <Text style={styles.exerciseDayTitle}>
                  TUESDAY - THURSDAY - SATURDAY
                </Text>
                <Text style={styles.exerciseCategory}>
                  Strength Training (30 minutes)
                </Text>
                <View style={styles.exerciseItem}>
                  <Activity  size={20} color={healthColors.info.main} />
                  <Text style={styles.exerciseText}>
                    Push-ups - 3 sets of 10
                  </Text>
                </View>
                <View style={styles.exerciseItem}>
                  <Activity  size={20} color={healthColors.info.main} />
                  <Text style={styles.exerciseText}>Squats - 3 sets of 15</Text>
                </View>
                <View style={styles.exerciseItem}>
                  <Activity  size={20} color={healthColors.info.main} />
                  <Text style={styles.exerciseText}>
                    Planks - 3 sets of 30 sec
                  </Text>
                </View>
              </View>

              <View style={styles.exerciseDay}>
                <Text style={styles.exerciseDayTitle}>
                  DAILY (Morning & Evening)
                </Text>
                <Text style={styles.exerciseCategory}>
                  Flexibility & Breathing
                </Text>
                <View style={styles.exerciseItem}>
                  <Hand
                    
                    size={20}
                    color={theme.colors.healthcare.purple}
                  />
                  <Text style={styles.exerciseText}>Yoga - 15 min</Text>
                </View>
                <View style={styles.exerciseItem}>
                  <Heart  size={20} color={theme.colors.healthcare.purple} />
                  <Text style={styles.exerciseText}>Pranayama - 10 min</Text>
                </View>
              </View>

              <View style={styles.exerciseDay}>
                <Text style={styles.exerciseDayTitle}>SUNDAY</Text>
                <Text style={styles.exerciseCategory}>Active Rest</Text>
                <View style={styles.exerciseItem}>
                  <Footprints  size={20} color={healthColors.warning.main} />
                  <Text style={styles.exerciseText}>
                    Light walking - 20 min
                  </Text>
                </View>
                <View style={styles.exerciseItem}>
                  <Maximize  size={20} color={healthColors.warning.main} />
                  <Text style={styles.exerciseText}>Stretching - 10 min</Text>
                </View>
              </View>

              {/* Tips */}
              <View style={styles.notesBox}>
                <Text style={styles.notesTitle}>EXERCISE TIPS:</Text>
                <Text style={styles.notesText}>
                  • Start slowly and gradually increase intensity
                </Text>
                <Text style={styles.notesText}>
                  • Check blood sugar before and after exercise
                </Text>
                <Text style={styles.notesText}>
                  • Stay hydrated during workouts
                </Text>
                <Text style={styles.notesText}>• Wear proper footwear</Text>
                <Text style={styles.notesText}>
                  • Consult doctor before starting new exercises
                </Text>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
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
    padding: getScreenPadding(),
    paddingTop: verticalScale(20),
    paddingBottom: verticalScale(30),
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginLeft: theme.spacing.md,
  },
  headerText: {
    flex: 1,
    marginLeft: theme.spacing.sm,
    marginRight: theme.spacing.md,
  },
  headerTitle: {
    fontSize: theme.typography.sizes.h4,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.white,
  },
  headerSubtitle: {
    fontSize: theme.typography.sizes.bodyMedium,
    color: theme.withOpacity(theme.colors.white, 0.9),
  },
  content: {
    padding: getScreenPadding(),
  },
  categoriesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: theme.spacing.xl,
  },
  categoryCard: {
    width: "48%",
    marginBottom: theme.spacing.md,
    borderRadius: 16,
    overflow: "hidden",
    ...theme.shadows.lg,
  },
  categoryGradient: {
    padding: theme.spacing.lg,
    alignItems: "center",
    minHeight: 140,
    justifyContent: "center",
  },
  categoryIcon: {
    marginBottom: theme.spacing.md,
  },
  categoryName: {
    fontSize: theme.typography.sizes.bodyLarge,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.white,
  },
  section: {
    marginBottom: theme.spacing.xl,
  },
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: theme.typography.sizes.bodyLarge,
    fontWeight: theme.typography.weights.bold,
    color: healthColors.text.primary,
    marginLeft: theme.spacing.xs,
  },
  quickAccessCard: {
    backgroundColor: healthColors.background.card,
    borderRadius: 16,
    padding: theme.spacing.sm,
    ...theme.shadows.md,
  },
  quickAccessItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: theme.spacing.md,
  },
  quickAccessText: {
    flex: 1,
    fontSize: theme.typography.sizes.bodyMedium,
    fontWeight: theme.typography.weights.medium,
    color: healthColors.text.primary,
    marginLeft: theme.spacing.md,
    marginRight: theme.spacing.md,
  },
  card: {
    backgroundColor: healthColors.background.card,
    borderRadius: 16,
    padding: theme.spacing.lg,
    ...theme.shadows.md,
  },
  topicItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: healthColors.border.light,
  },
  topicDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: healthColors.primary.dark,
    marginRight: theme.spacing.md,
  },
  topicText: {
    flex: 1,
    fontSize: theme.typography.sizes.bodyMedium,
    color: healthColors.text.primary,
    marginRight: theme.spacing.md,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: theme.colors.background.overlay,
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: healthColors.background.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "90%",
    paddingBottom: verticalScale(20),
  },
  modalHeader: {
    padding: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: healthColors.border.light,
  },
  modalTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: theme.spacing.sm,
  },
  modalIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    marginRight: theme.spacing.md,
  },
  modalTitleText: {
    flex: 1,
    marginRight: theme.spacing.md,
  },
  modalTitle: {
    fontSize: theme.typography.sizes.h4,
    fontWeight: theme.typography.weights.bold,
    color: healthColors.text.primary,
  },
  modalDescription: {
    fontSize: theme.typography.sizes.bodyMedium,
    color: healthColors.text.secondary,
    lineHeight: 20,
  },
  videoSection: {
    margin: theme.spacing.lg,
    borderRadius: 16,
    overflow: "hidden",
    ...theme.shadows.lg,
  },
  videoGradient: {
    padding: theme.spacing.xl,
    alignItems: "center",
    justifyContent: "center",
  },
  videoText: {
    fontSize: theme.typography.sizes.bodyLarge,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.white,
    marginTop: theme.spacing.sm,
  },
  statsRow: {
    flexDirection: "row",
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  statCard: {
    flex: 1,
    backgroundColor: healthColors.background.primary,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: "center",
    marginRight: theme.spacing.md,
  },
  statLabel: {
    fontSize: theme.typography.sizes.caption,
    color: healthColors.text.tertiary,
    marginBottom: 4,
  },
  statValue: {
    fontSize: theme.typography.sizes.bodyMedium,
    fontWeight: theme.typography.weights.bold,
    color: healthColors.text.primary,
  },
  detailSection: {
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  detailTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: theme.spacing.sm,
  },
  detailTitle: {
    fontSize: theme.typography.sizes.bodyMedium,
    fontWeight: theme.typography.weights.bold,
    color: healthColors.text.primary,
    marginLeft: 6,
  },
  listItem: {
    flexDirection: "row",
    marginBottom: theme.spacing.sm,
    paddingLeft: theme.spacing.sm,
  },
  listBullet: {
    fontSize: theme.typography.sizes.bodyMedium,
    color: healthColors.text.secondary,
    marginRight: theme.spacing.sm,
  },
  listText: {
    flex: 1,
    fontSize: theme.typography.sizes.bodyMedium,
    color: healthColors.text.secondary,
    lineHeight: 20,
  },
  actionButtons: {
    flexDirection: "row",
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.lg,
  },
  actionButton: {
    flex: 1,
    borderRadius: theme.borderRadius.md,
    overflow: "hidden",
    ...theme.shadows.md,
    marginRight: theme.spacing.md,
  },
  actionGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: theme.spacing.md,
  },
  actionButtonText: {
    fontSize: theme.typography.sizes.bodyMedium,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.white,
    marginLeft: 8,
  },
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: theme.withOpacity(theme.colors.grays.black, 0.3),
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  videoDuration: {
    fontSize: theme.typography.sizes.caption,
    color: theme.withOpacity(theme.colors.white, 0.9),
    marginTop: 8,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: healthColors.background.primary,
    marginHorizontal: getScreenPadding(),
    marginBottom: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderWidth: 1,
    borderColor: healthColors.border.light,
    gap: theme.spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: theme.typography.sizes.bodyMedium,
    color: healthColors.text.primary,
    paddingVertical: 0,
  },
  dietSection: {
    marginBottom: theme.spacing.lg,
    backgroundColor: healthColors.background.primary,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
  },
  dietMealTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: theme.spacing.sm,
  },
  dietMealTitle: {
    fontSize: theme.typography.sizes.bodyMedium,
    fontWeight: theme.typography.weights.bold,
    color: healthColors.text.primary,
    marginLeft: 6,
  },
  dietItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: healthColors.border.light,
  },
  dietItemText: {
    flex: 1,
    fontSize: theme.typography.sizes.bodyMedium,
    color: healthColors.text.secondary,
  },
  dietCal: {
    fontSize: theme.typography.sizes.caption,
    fontWeight: theme.typography.weights.semibold,
    color: healthColors.success.main,
  },
  notesBox: {
    backgroundColor: theme.withOpacity(healthColors.warning.main, 0.1),
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    borderLeftWidth: 4,
    borderLeftColor: healthColors.warning.main,
    marginTop: theme.spacing.lg,
  },
  notesTitle: {
    fontSize: theme.typography.sizes.bodyMedium,
    fontWeight: theme.typography.weights.bold,
    color: healthColors.warning.dark,
    marginBottom: theme.spacing.sm,
  },
  notesText: {
    fontSize: theme.typography.sizes.caption,
    color: healthColors.warning.dark,
    marginBottom: 4,
  },
  exerciseDay: {
    marginBottom: theme.spacing.lg,
    backgroundColor: healthColors.background.primary,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
  },
  exerciseDayTitle: {
    fontSize: theme.typography.sizes.bodyMedium,
    fontWeight: theme.typography.weights.bold,
    color: healthColors.primary.main,
    marginBottom: theme.spacing.xs,
  },
  exerciseCategory: {
    fontSize: theme.typography.sizes.bodyMedium,
    fontWeight: theme.typography.weights.semibold,
    color: healthColors.text.primary,
    marginBottom: theme.spacing.md,
  },
  exerciseItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
  },
  exerciseText: {
    fontSize: theme.typography.sizes.bodyMedium,
    color: healthColors.text.secondary,
    marginLeft: theme.spacing.sm,
  },
});

export default DiseaseInfoScreen;



