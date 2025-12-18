/**
 * Disease Info Center Screen
 * Health library with categories, disease details, symptoms, prevention
 */

import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Modal,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { healthColors } from '../../theme/healthColors';
import { indianDesign, createShadow } from '../../theme/indianDesign';
import { getScreenPadding, scaledFontSize, moderateScale, verticalScale } from '../../utils/responsive';
import NetworkStatusIndicator from '../../components/common/NetworkStatusIndicator';
import ErrorRecovery from '../../components/common/ErrorRecovery';
import { showError, logError } from '../../utils/errorHandler';
import { useNetworkStatus } from '../../utils/offlineHandler';

const DiseaseInfoScreen = ({ navigation }) => {
    const [selectedDisease, setSelectedDisease] = useState(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [videoModalVisible, setVideoModalVisible] = useState(false);
    const [imageGalleryVisible, setImageGalleryVisible] = useState(false);
    const [dietChartVisible, setDietChartVisible] = useState(false);
    const [exercisePlanVisible, setExercisePlanVisible] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const { isConnected } = useNetworkStatus();

    const categories = [
        { icon: 'heart', name: 'Heart', color: '#E91E63' },
        { icon: 'pulse', name: 'Lung', color: '#2196F3' },
        { icon: 'bulb-outline', name: 'Brain', color: '#9C27B0' },
        { icon: 'water', name: 'Diabetes', color: '#FF9800' },
        { icon: 'bandage-outline', name: 'Bone', color: '#795548' },
        { icon: 'eye', name: 'Eye', color: '#00BCD4' },
    ];

    const diseaseDetails = {
        Diabetes: {
            name: 'Diabetes Mellitus',
            icon: 'water',
            color: '#FF9800',
            description: 'A metabolic disorder characterized by high blood sugar levels over prolonged periods.',
            symptoms: [
                'Frequent urination',
                'Increased thirst',
                'Unexplained weight loss',
                'Fatigue and weakness',
                'Blurred vision',
                'Slow-healing wounds',
            ],
            prevention: [
                'Maintain healthy weight',
                'Exercise regularly (30 min/day)',
                'Balanced diet with low sugar',
                'Regular health checkups',
                'Stress management',
                'Adequate sleep',
            ],
            statistics: {
                prevalence: '8.7% of adults',
                riskAge: '45+ years',
            },
        },
    };

    const handleCategoryPress = async (category) => {
        try {
            setLoading(true);
            setError(null);
            
            if (category.name === 'Diabetes') {
                setSelectedDisease(diseaseDetails.Diabetes);
                setModalVisible(true);
            } else {
                // For other categories, show coming soon message
                alert(`${category.name} information coming soon!`);
            }
        } catch (err) {
            logError(err, { context: 'DiseaseInfoScreen.handleCategoryPress', category: category.name });
            setError(err.message || 'Failed to load disease information');
            showError('Failed to load disease information');
        } finally {
            setLoading(false);
        }
    };

    const handleRetry = () => {
        setError(null);
    };

    if (error) {
        return (
            <SafeAreaView style={styles.container} edges={['top', 'left', 'right', 'bottom']}>
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
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right', 'bottom']}>
            <NetworkStatusIndicator />
            {loading && (
                <View style={styles.loadingOverlay}>
                    <ActivityIndicator size="large" color={healthColors.primary.main} />
                </View>
            )}
            {/* Header */}
            <LinearGradient
                colors={['#7E57C2', '#5E35B1']}
                style={styles.header}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color="#FFF" />
                </TouchableOpacity>
                <View style={styles.headerContent}>
                    <Ionicons name="library" size={32} color="#FFF" />
                    <View style={styles.headerText}>
                        <Text style={styles.headerTitle}>Disease Info Center</Text>
                        <Text style={styles.headerSubtitle}>Health Library</Text>
                    </View>
                </View>
                <TouchableOpacity onPress={() => {}}>
                    <Ionicons name="search" size={24} color="#FFF" />
                </TouchableOpacity>
            </LinearGradient>

            <ScrollView contentContainerStyle={styles.content}>
                {/* Categories Grid */}
                <View style={styles.categoriesGrid}>
                    {categories.map((category, index) => (
                        <TouchableOpacity
                            key={index}
                            style={styles.categoryCard}
                            onPress={() => handleCategoryPress(category)}
                        >
                            <LinearGradient
                                colors={[category.color, category.color + 'DD']}
                                style={styles.categoryGradient}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                            >
                                <Ionicons name={category.icon} size={48} color="#FFF" style={styles.categoryIcon} />
                                <Text style={styles.categoryName}>{category.name}</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Quick Access */}
                <View style={styles.section}>
                    <View style={styles.sectionTitleRow}>
                        <Ionicons name="search" size={20} color={healthColors.primary.main} />
                        <Text style={styles.sectionTitle}>QUICK ACCESS</Text>
                    </View>
                    <View style={styles.quickAccessCard}>
                        <TouchableOpacity style={styles.quickAccessItem}>
                            <Ionicons name="videocam" size={24} color="#E91E63" />
                            <Text style={styles.quickAccessText}>Video Library</Text>
                            <Ionicons name="chevron-forward" size={20} color={healthColors.text.tertiary} />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.quickAccessItem}>
                            <Ionicons name="document-text" size={24} color="#2196F3" />
                            <Text style={styles.quickAccessText}>Articles</Text>
                            <Ionicons name="chevron-forward" size={20} color={healthColors.text.tertiary} />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.quickAccessItem}>
                            <Ionicons name="newspaper" size={24} color="#FF9800" />
                            <Text style={styles.quickAccessText}>Latest News</Text>
                            <Ionicons name="chevron-forward" size={20} color={healthColors.text.tertiary} />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Featured Topics */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>⭐ FEATURED TOPICS</Text>
                    <View style={styles.card}>
                        {['COVID-19 Updates', 'Mental Health Awareness', 'Nutrition Guide'].map((topic, index) => (
                            <TouchableOpacity key={index} style={styles.topicItem}>
                                <View style={styles.topicDot} />
                                <Text style={styles.topicText}>{topic}</Text>
                                <Ionicons name="arrow-forward" size={18} color="#7E57C2" />
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
                                            <View style={[styles.modalIconContainer, { backgroundColor: selectedDisease.color + '20' }]}>
                                                <Ionicons name={selectedDisease.icon} size={32} color={selectedDisease.color} />
                                            </View>
                                            <View style={styles.modalTitleText}>
                                                <Text style={styles.modalTitle}>{selectedDisease.name}</Text>
                                            </View>
                                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                                <Ionicons name="close-circle" size={32} color={healthColors.text.tertiary} />
                                            </TouchableOpacity>
                                        </View>
                                        <Text style={styles.modalDescription}>{selectedDisease.description}</Text>
                                    </View>

                                    {/* Video Section */}
                                    <TouchableOpacity style={styles.videoSection} onPress={() => setVideoModalVisible(true)}>
                                        <LinearGradient
                                            colors={['#FF9800', '#F57C00']}
                                            style={styles.videoGradient}
                                        >
                                            <Ionicons name="play-circle" size={64} color="#FFF" />
                                            <Text style={styles.videoText}>Watch Educational Video</Text>
                                            <Text style={styles.videoDuration}>Duration: 3:45 mins</Text>
                                        </LinearGradient>
                                    </TouchableOpacity>

                                    {/* Image Gallery Button */}
                                    <TouchableOpacity 
                                        style={[styles.videoSection, { marginTop: 0 }]} 
                                        onPress={() => setImageGalleryVisible(true)}
                                    >
                                        <LinearGradient
                                            colors={['#2196F3', '#1976D2']}
                                            style={styles.videoGradient}
                                        >
                                            <Ionicons name="images" size={48} color="#FFF" />
                                            <Text style={styles.videoText}>View Images</Text>
                                        </LinearGradient>
                                    </TouchableOpacity>

                                    {/* Statistics */}
                                    <View style={styles.statsRow}>
                                        <View style={styles.statCard}>
                                            <Text style={styles.statLabel}>Prevalence</Text>
                                            <Text style={styles.statValue}>{selectedDisease.statistics.prevalence}</Text>
                                        </View>
                                        <View style={styles.statCard}>
                                            <Text style={styles.statLabel}>Risk Age</Text>
                                            <Text style={styles.statValue}>{selectedDisease.statistics.riskAge}</Text>
                                        </View>
                                    </View>

                                    {/* Symptoms */}
                                    <View style={styles.detailSection}>
                                        <Text style={styles.detailTitle}>🩺 SYMPTOMS:</Text>
                                        {selectedDisease.symptoms.map((symptom, index) => (
                                            <View key={index} style={styles.listItem}>
                                                <Text style={styles.listBullet}>•</Text>
                                                <Text style={styles.listText}>{symptom}</Text>
                                            </View>
                                        ))}
                                    </View>

                                    {/* Prevention */}
                                    <View style={styles.detailSection}>
                                        <View style={styles.detailTitleContainer}>
                                            <Ionicons name="shield-checkmark-outline" size={18} color={healthColors.primary.main} />
                                            <Text style={styles.detailTitle}>PREVENTION:</Text>
                                        </View>
                                        {selectedDisease.prevention.map((item, index) => (
                                            <View key={index} style={styles.listItem}>
                                                <Text style={styles.listBullet}>•</Text>
                                                <Text style={styles.listText}>{item}</Text>
                                            </View>
                                        ))}
                                    </View>

                                    {/* Action Buttons */}
                                    <View style={styles.actionButtons}>
                                        <TouchableOpacity style={styles.actionButton} onPress={() => setDietChartVisible(true)}>
                                            <LinearGradient
                                                colors={['#4CAF50', '#388E3C']}
                                                style={styles.actionGradient}
                                            >
                                                <Ionicons name="restaurant-outline" size={18} color="#FFF" />
                                                <Text style={styles.actionButtonText}>Diet Chart</Text>
                                            </LinearGradient>
                                        </TouchableOpacity>
                                        <TouchableOpacity style={styles.actionButton} onPress={() => setExercisePlanVisible(true)}>
                                            <LinearGradient
                                                colors={['#2196F3', '#1976D2']}
                                                style={styles.actionGradient}
                                            >
                                                <Ionicons name="fitness-outline" size={18} color="#FFF" />
                                                <Text style={styles.actionButtonText}>Exercise Plan</Text>
                                            </LinearGradient>
                                        </TouchableOpacity>
                                    </View>
                                </>
                            )}
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            {/* Video Player Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={videoModalVisible}
                onRequestClose={() => setVideoModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { maxHeight: '70%' }]}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Educational Video</Text>
                            <TouchableOpacity onPress={() => setVideoModalVisible(false)}>
                                <Ionicons name="close-circle" size={32} color={healthColors.text.tertiary} />
                            </TouchableOpacity>
                        </View>
                        <View style={styles.videoPlayerPlaceholder}>
                            <Ionicons name="play-circle-outline" size={80} color={healthColors.primary.main} />
                            <Text style={styles.placeholderText}>Video Player</Text>
                            <Text style={styles.placeholderSubtext}>
                                Educational video about {selectedDisease?.name}
                            </Text>
                            <Text style={styles.placeholderNote}>
                                Integration with video player required
                            </Text>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Image Gallery Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={imageGalleryVisible}
                onRequestClose={() => setImageGalleryVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { maxHeight: '80%' }]}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Image Gallery</Text>
                            <TouchableOpacity onPress={() => setImageGalleryVisible(false)}>
                                <Ionicons name="close-circle" size={32} color={healthColors.text.tertiary} />
                            </TouchableOpacity>
                        </View>
                        <ScrollView contentContainerStyle={styles.galleryGrid}>
                            {[1, 2, 3, 4, 5, 6].map((item) => (
                                <View key={item} style={styles.galleryItem}>
                                    <Ionicons name="image-outline" size={48} color={healthColors.primary.main} />
                                    <Text style={styles.galleryItemText}>Image {item}</Text>
                                </View>
                            ))}
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
                            <Text style={styles.modalTitle}>Diet Chart for Diabetes</Text>
                            <TouchableOpacity onPress={() => setDietChartVisible(false)}>
                                <Ionicons name="close-circle" size={32} color={healthColors.text.tertiary} />
                            </TouchableOpacity>
                        </View>
                        <ScrollView contentContainerStyle={{ padding: indianDesign.spacing.lg }}>
                            {/* Breakfast */}
                            <View style={styles.dietSection}>
                                <View style={styles.dietMealTitleContainer}>
                                    <Ionicons name="sunny-outline" size={18} color="#FF9800" />
                                    <Text style={styles.dietMealTitle}>BREAKFAST (7:00 - 8:00 AM)</Text>
                                </View>
                                <View style={styles.dietItem}>
                                    <Text style={styles.dietItemText}>• Oatmeal (1 cup) with berries</Text>
                                    <Text style={styles.dietCal}>150 cal</Text>
                                </View>
                                <View style={styles.dietItem}>
                                    <Text style={styles.dietItemText}>• 1 Boiled egg</Text>
                                    <Text style={styles.dietCal}>70 cal</Text>
                                </View>
                                <View style={styles.dietItem}>
                                    <Text style={styles.dietItemText}>• Green tea (unsweetened)</Text>
                                    <Text style={styles.dietCal}>0 cal</Text>
                                </View>
                            </View>

                            {/* Mid-Morning Snack */}
                            <View style={styles.dietSection}>
                                <View style={styles.dietMealTitleContainer}>
                                    <Ionicons name="nutrition-outline" size={18} color="#4CAF50" />
                                    <Text style={styles.dietMealTitle}>MID-MORNING (10:00 AM)</Text>
                                </View>
                                <View style={styles.dietItem}>
                                    <Text style={styles.dietItemText}>• 1 Apple or orange</Text>
                                    <Text style={styles.dietCal}>60 cal</Text>
                                </View>
                                <View style={styles.dietItem}>
                                    <Text style={styles.dietItemText}>• Handful of almonds (5-6)</Text>
                                    <Text style={styles.dietCal}>50 cal</Text>
                                </View>
                            </View>

                            {/* Lunch */}
                            <View style={styles.dietSection}>
                                <View style={styles.dietMealTitleContainer}>
                                    <Ionicons name="restaurant-outline" size={18} color="#FF5722" />
                                    <Text style={styles.dietMealTitle}>LUNCH (12:30 - 1:30 PM)</Text>
                                </View>
                                <View style={styles.dietItem}>
                                    <Text style={styles.dietItemText}>• Brown rice (1 cup)</Text>
                                    <Text style={styles.dietCal}>200 cal</Text>
                                </View>
                                <View style={styles.dietItem}>
                                    <Text style={styles.dietItemText}>• Grilled chicken/fish (100g)</Text>
                                    <Text style={styles.dietCal}>150 cal</Text>
                                </View>
                                <View style={styles.dietItem}>
                                    <Text style={styles.dietItemText}>• Mixed vegetable salad</Text>
                                    <Text style={styles.dietCal}>50 cal</Text>
                                </View>
                                <View style={styles.dietItem}>
                                    <Text style={styles.dietItemText}>• Buttermilk (1 glass)</Text>
                                    <Text style={styles.dietCal}>40 cal</Text>
                                </View>
                            </View>

                            {/* Evening Snack */}
                            <View style={styles.dietSection}>
                                <View style={styles.dietMealTitleContainer}>
                                    <Ionicons name="cafe-outline" size={18} color="#795548" />
                                    <Text style={styles.dietMealTitle}>EVENING (4:00 PM)</Text>
                                </View>
                                <View style={styles.dietItem}>
                                    <Text style={styles.dietItemText}>• Green tea with 2 whole wheat biscuits</Text>
                                    <Text style={styles.dietCal}>80 cal</Text>
                                </View>
                            </View>

                            {/* Dinner */}
                            <View style={styles.dietSection}>
                                <View style={styles.dietMealTitleContainer}>
                                    <Ionicons name="moon-outline" size={18} color="#3F51B5" />
                                    <Text style={styles.dietMealTitle}>DINNER (7:00 - 8:00 PM)</Text>
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
                                <Text style={styles.notesTitle}>⚠️ IMPORTANT NOTES:</Text>
                                <Text style={styles.notesText}>• Drink 8-10 glasses of water daily</Text>
                                <Text style={styles.notesText}>• Avoid sugary drinks and processed foods</Text>
                                <Text style={styles.notesText}>• Eat at regular intervals</Text>
                                <Text style={styles.notesText}>• Monitor blood sugar regularly</Text>
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
                            <Text style={styles.modalTitle}>Exercise Plan for Diabetes</Text>
                            <TouchableOpacity onPress={() => setExercisePlanVisible(false)}>
                                <Ionicons name="close-circle" size={32} color={healthColors.text.tertiary} />
                            </TouchableOpacity>
                        </View>
                        <ScrollView contentContainerStyle={{ padding: indianDesign.spacing.lg }}>
                            {/* Weekly Plan */}
                            <View style={styles.exerciseDay}>
                                <Text style={styles.exerciseDayTitle}>MONDAY - WEDNESDAY - FRIDAY</Text>
                                <Text style={styles.exerciseCategory}>Cardio (30 minutes)</Text>
                                <View style={styles.exerciseItem}>
                                    <Ionicons name="walk" size={20} color="#4CAF50" />
                                    <Text style={styles.exerciseText}>Brisk Walking - 15 min</Text>
                                </View>
                                <View style={styles.exerciseItem}>
                                    <Ionicons name="bicycle" size={20} color="#4CAF50" />
                                    <Text style={styles.exerciseText}>Cycling - 15 min</Text>
                                </View>
                            </View>

                            <View style={styles.exerciseDay}>
                                <Text style={styles.exerciseDayTitle}>TUESDAY - THURSDAY - SATURDAY</Text>
                                <Text style={styles.exerciseCategory}>Strength Training (30 minutes)</Text>
                                <View style={styles.exerciseItem}>
                                    <Ionicons name="fitness" size={20} color="#2196F3" />
                                    <Text style={styles.exerciseText}>Push-ups - 3 sets of 10</Text>
                                </View>
                                <View style={styles.exerciseItem}>
                                    <Ionicons name="fitness" size={20} color="#2196F3" />
                                    <Text style={styles.exerciseText}>Squats - 3 sets of 15</Text>
                                </View>
                                <View style={styles.exerciseItem}>
                                    <Ionicons name="fitness" size={20} color="#2196F3" />
                                    <Text style={styles.exerciseText}>Planks - 3 sets of 30 sec</Text>
                                </View>
                            </View>

                            <View style={styles.exerciseDay}>
                                <Text style={styles.exerciseDayTitle}>DAILY (Morning & Evening)</Text>
                                <Text style={styles.exerciseCategory}>Flexibility & Breathing</Text>
                                <View style={styles.exerciseItem}>
                                    <Ionicons name="hand-left-outline" size={20} color="#9C27B0" />
                                    <Text style={styles.exerciseText}>Yoga - 15 min</Text>
                                </View>
                                <View style={styles.exerciseItem}>
                                    <Ionicons name="heart" size={20} color="#9C27B0" />
                                    <Text style={styles.exerciseText}>Pranayama - 10 min</Text>
                                </View>
                            </View>

                            <View style={styles.exerciseDay}>
                                <Text style={styles.exerciseDayTitle}>SUNDAY</Text>
                                <Text style={styles.exerciseCategory}>Active Rest</Text>
                                <View style={styles.exerciseItem}>
                                    <Ionicons name="walk" size={20} color="#FF9800" />
                                    <Text style={styles.exerciseText}>Light walking - 20 min</Text>
                                </View>
                                <View style={styles.exerciseItem}>
                                    <Ionicons name="resize-outline" size={20} color="#FF9800" />
                                    <Text style={styles.exerciseText}>Stretching - 10 min</Text>
                                </View>
                            </View>

                            {/* Tips */}
                            <View style={styles.notesBox}>
                                <Text style={styles.notesTitle}>💡 EXERCISE TIPS:</Text>
                                <Text style={styles.notesText}>• Start slowly and gradually increase intensity</Text>
                                <Text style={styles.notesText}>• Check blood sugar before and after exercise</Text>
                                <Text style={styles.notesText}>• Stay hydrated during workouts</Text>
                                <Text style={styles.notesText}>• Wear proper footwear</Text>
                                <Text style={styles.notesText}>• Consult doctor before starting new exercises</Text>
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
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: getScreenPadding(),
        paddingTop: verticalScale(20),
        paddingBottom: verticalScale(30),
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: indianDesign.spacing.md,
        flex: 1,
        marginLeft: indianDesign.spacing.md,
    },
    headerText: {
        flex: 1,
        marginLeft: indianDesign.spacing.sm,
    },
    headerTitle: {
        fontSize: scaledFontSize(20),
        fontWeight: indianDesign.fontWeight.bold,
        color: '#FFF',
    },
    headerSubtitle: {
        fontSize: scaledFontSize(13),
        color: 'rgba(255, 255, 255, 0.9)',
    },
    content: {
        padding: getScreenPadding(),
    },
    categoriesGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginBottom: indianDesign.spacing.xl,
    },
    categoryCard: {
        width: '48%',
        marginBottom: indianDesign.spacing.md,
        borderRadius: 16,
        overflow: 'hidden',
        ...createShadow(3),
    },
    categoryGradient: {
        padding: indianDesign.spacing.lg,
        alignItems: 'center',
        minHeight: moderateScale(140),
        justifyContent: 'center',
    },
    categoryIcon: {
        marginBottom: indianDesign.spacing.md,
    },
    categoryName: {
        fontSize: scaledFontSize(16),
        fontWeight: indianDesign.fontWeight.bold,
        color: '#FFF',
    },
    section: {
        marginBottom: indianDesign.spacing.xl,
    },
    sectionTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: indianDesign.spacing.xs,
        marginBottom: indianDesign.spacing.md,
    },
    sectionTitle: {
        fontSize: scaledFontSize(16),
        fontWeight: indianDesign.fontWeight.bold,
        color: healthColors.text.primary,
    },
    quickAccessCard: {
        backgroundColor: healthColors.background.card,
        borderRadius: 16,
        padding: indianDesign.spacing.sm,
        ...createShadow(2),
    },
    quickAccessItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: indianDesign.spacing.md,
        gap: indianDesign.spacing.md,
    },
    quickAccessText: {
        flex: 1,
        fontSize: scaledFontSize(14),
        fontWeight: indianDesign.fontWeight.medium,
        color: healthColors.text.primary,
    },
    card: {
        backgroundColor: healthColors.background.card,
        borderRadius: 16,
        padding: indianDesign.spacing.lg,
        ...createShadow(2),
    },
    topicItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: indianDesign.spacing.md,
        gap: indianDesign.spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: healthColors.border.light,
    },
    topicDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: healthColors.primary.dark,
    },
    topicText: {
        flex: 1,
        fontSize: scaledFontSize(14),
        color: healthColors.text.primary,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: healthColors.background.card,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        maxHeight: '90%',
        paddingBottom: verticalScale(20),
    },
    modalHeader: {
        padding: indianDesign.spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: healthColors.border.light,
    },
    modalTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: indianDesign.spacing.md,
        marginBottom: indianDesign.spacing.sm,
    },
    modalIconContainer: {
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalTitleText: {
        flex: 1,
    },
    modalTitle: {
        fontSize: scaledFontSize(20),
        fontWeight: indianDesign.fontWeight.bold,
        color: healthColors.text.primary,
    },
    modalDescription: {
        fontSize: scaledFontSize(13),
        color: healthColors.text.secondary,
        lineHeight: 20,
    },
    videoSection: {
        margin: indianDesign.spacing.lg,
        borderRadius: 16,
        overflow: 'hidden',
        ...createShadow(3),
    },
    videoGradient: {
        padding: indianDesign.spacing.xl,
        alignItems: 'center',
        justifyContent: 'center',
    },
    videoText: {
        fontSize: scaledFontSize(16),
        fontWeight: indianDesign.fontWeight.bold,
        color: '#FFF',
        marginTop: indianDesign.spacing.sm,
    },
    statsRow: {
        flexDirection: 'row',
        gap: indianDesign.spacing.md,
        paddingHorizontal: indianDesign.spacing.lg,
        marginBottom: indianDesign.spacing.lg,
    },
    statCard: {
        flex: 1,
        backgroundColor: healthColors.background.primary,
        padding: indianDesign.spacing.md,
        borderRadius: indianDesign.borderRadius.medium,
        alignItems: 'center',
    },
    statLabel: {
        fontSize: scaledFontSize(12),
        color: healthColors.text.tertiary,
        marginBottom: 4,
    },
    statValue: {
        fontSize: scaledFontSize(14),
        fontWeight: indianDesign.fontWeight.bold,
        color: healthColors.text.primary,
    },
    detailSection: {
        paddingHorizontal: indianDesign.spacing.lg,
        marginBottom: indianDesign.spacing.lg,
    },
    detailTitleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: moderateScale(6),
        marginBottom: indianDesign.spacing.sm,
    },
    detailTitle: {
        fontSize: scaledFontSize(14),
        fontWeight: indianDesign.fontWeight.bold,
        color: healthColors.text.primary,
    },
    listItem: {
        flexDirection: 'row',
        marginBottom: indianDesign.spacing.sm,
        paddingLeft: indianDesign.spacing.sm,
    },
    listBullet: {
        fontSize: scaledFontSize(14),
        color: healthColors.text.secondary,
        marginRight: indianDesign.spacing.sm,
    },
    listText: {
        flex: 1,
        fontSize: scaledFontSize(13),
        color: healthColors.text.secondary,
        lineHeight: 20,
    },
    actionButtons: {
        flexDirection: 'row',
        gap: indianDesign.spacing.md,
        paddingHorizontal: indianDesign.spacing.lg,
        paddingBottom: indianDesign.spacing.lg,
    },
    actionButton: {
        flex: 1,
        borderRadius: indianDesign.borderRadius.medium,
        overflow: 'hidden',
        ...createShadow(2),
    },
    actionGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: moderateScale(8),
        paddingVertical: indianDesign.spacing.md,
    },
    actionButtonText: {
        fontSize: scaledFontSize(14),
        fontWeight: indianDesign.fontWeight.semibold,
        color: '#FFF',
    },
    loadingOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
    },
    videoDuration: {
        fontSize: scaledFontSize(12),
        color: 'rgba(255, 255, 255, 0.9)',
        marginTop: 8,
    },
    videoPlayerPlaceholder: {
        padding: indianDesign.spacing.xxxl,
        alignItems: 'center',
        justifyContent: 'center',
    },
    placeholderText: {
        fontSize: scaledFontSize(18),
        fontWeight: indianDesign.fontWeight.bold,
        color: healthColors.text.primary,
        marginTop: indianDesign.spacing.md,
    },
    placeholderSubtext: {
        fontSize: scaledFontSize(14),
        color: healthColors.text.secondary,
        marginTop: indianDesign.spacing.sm,
        textAlign: 'center',
    },
    placeholderNote: {
        fontSize: scaledFontSize(12),
        color: healthColors.text.tertiary,
        marginTop: indianDesign.spacing.md,
        fontStyle: 'italic',
    },
    galleryGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        padding: indianDesign.spacing.md,
        gap: indianDesign.spacing.md,
    },
    galleryItem: {
        width: '30%',
        aspectRatio: 1,
        backgroundColor: healthColors.background.primary,
        borderRadius: indianDesign.borderRadius.medium,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: healthColors.border.light,
    },
    galleryItemText: {
        fontSize: scaledFontSize(11),
        color: healthColors.text.secondary,
        marginTop: 4,
    },
    dietSection: {
        marginBottom: indianDesign.spacing.lg,
        backgroundColor: healthColors.background.primary,
        padding: indianDesign.spacing.md,
        borderRadius: indianDesign.borderRadius.medium,
    },
    dietMealTitleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: moderateScale(6),
        marginBottom: indianDesign.spacing.sm,
    },
    dietMealTitle: {
        fontSize: scaledFontSize(14),
        fontWeight: indianDesign.fontWeight.bold,
        color: healthColors.text.primary,
    },
    dietItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: healthColors.border.light,
    },
    dietItemText: {
        flex: 1,
        fontSize: scaledFontSize(13),
        color: healthColors.text.secondary,
    },
    dietCal: {
        fontSize: scaledFontSize(12),
        fontWeight: indianDesign.fontWeight.semibold,
        color: healthColors.success.main,
    },
    notesBox: {
        backgroundColor: '#FFF3E0',
        padding: indianDesign.spacing.md,
        borderRadius: indianDesign.borderRadius.medium,
        borderLeftWidth: 4,
        borderLeftColor: '#FF9800',
        marginTop: indianDesign.spacing.lg,
    },
    notesTitle: {
        fontSize: scaledFontSize(14),
        fontWeight: indianDesign.fontWeight.bold,
        color: '#E65100',
        marginBottom: indianDesign.spacing.sm,
    },
    notesText: {
        fontSize: scaledFontSize(12),
        color: '#E65100',
        marginBottom: 4,
    },
    exerciseDay: {
        marginBottom: indianDesign.spacing.lg,
        backgroundColor: healthColors.background.primary,
        padding: indianDesign.spacing.md,
        borderRadius: indianDesign.borderRadius.medium,
    },
    exerciseDayTitle: {
        fontSize: scaledFontSize(14),
        fontWeight: indianDesign.fontWeight.bold,
        color: healthColors.primary.main,
        marginBottom: indianDesign.spacing.xs,
    },
    exerciseCategory: {
        fontSize: scaledFontSize(13),
        fontWeight: indianDesign.fontWeight.semibold,
        color: healthColors.text.primary,
        marginBottom: indianDesign.spacing.md,
    },
    exerciseItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        gap: indianDesign.spacing.sm,
    },
    exerciseText: {
        fontSize: scaledFontSize(13),
        color: healthColors.text.secondary,
    },
});

export default DiseaseInfoScreen;
