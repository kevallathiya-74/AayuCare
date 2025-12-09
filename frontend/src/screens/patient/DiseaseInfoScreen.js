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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { healthColors } from '../../theme/healthColors';
import { indianDesign, createShadow } from '../../theme/indianDesign';
import { getScreenPadding, scaledFontSize, moderateScale, verticalScale } from '../../utils/responsive';

const DiseaseInfoScreen = ({ navigation }) => {
    const [selectedDisease, setSelectedDisease] = useState(null);
    const [modalVisible, setModalVisible] = useState(false);

    const categories = [
        { icon: 'heart', name: 'Heart', color: '#E91E63', emoji: '❤️' },
        { icon: 'pulse', name: 'Lung', color: '#2196F3', emoji: '🫁' },
        { icon: 'brain', name: 'Brain', color: '#9C27B0', emoji: '🧠' },
        { icon: 'water', name: 'Diabetes', color: '#FF9800', emoji: '🩺' },
        { icon: 'bone', name: 'Bone', color: '#795548', emoji: '🦴' },
        { icon: 'eye', name: 'Eye', color: '#00BCD4', emoji: '👁️' },
    ];

    const diseaseDetails = {
        Diabetes: {
            name: 'Diabetes Mellitus',
            emoji: '🩺',
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

    const handleCategoryPress = (category) => {
        if (category.name === 'Diabetes') {
            setSelectedDisease(diseaseDetails.Diabetes);
            setModalVisible(true);
        } else {
            // For other categories, show coming soon message
            alert(`${category.name} information coming soon!`);
        }
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
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
                    <Text style={styles.headerIcon}>📚</Text>
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
                                <Text style={styles.categoryEmoji}>{category.emoji}</Text>
                                <Ionicons name={category.icon} size={32} color="#FFF" style={styles.categoryIcon} />
                                <Text style={styles.categoryName}>{category.name}</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Quick Access */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>🔍 QUICK ACCESS</Text>
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
                                            <Text style={styles.modalEmoji}>{selectedDisease.emoji}</Text>
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
                                    <TouchableOpacity style={styles.videoSection}>
                                        <LinearGradient
                                            colors={['#FF9800', '#F57C00']}
                                            style={styles.videoGradient}
                                        >
                                            <Ionicons name="play-circle" size={64} color="#FFF" />
                                            <Text style={styles.videoText}>Watch Educational Video</Text>
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
                                        <Text style={styles.detailTitle}>🛡️ PREVENTION:</Text>
                                        {selectedDisease.prevention.map((item, index) => (
                                            <View key={index} style={styles.listItem}>
                                                <Text style={styles.listBullet}>•</Text>
                                                <Text style={styles.listText}>{item}</Text>
                                            </View>
                                        ))}
                                    </View>

                                    {/* Action Buttons */}
                                    <View style={styles.actionButtons}>
                                        <TouchableOpacity style={styles.actionButton}>
                                            <LinearGradient
                                                colors={['#4CAF50', '#388E3C']}
                                                style={styles.actionGradient}
                                            >
                                                <Text style={styles.actionButtonText}>📊 Diet Chart</Text>
                                            </LinearGradient>
                                        </TouchableOpacity>
                                        <TouchableOpacity style={styles.actionButton}>
                                            <LinearGradient
                                                colors={['#2196F3', '#1976D2']}
                                                style={styles.actionGradient}
                                            >
                                                <Text style={styles.actionButtonText}>🏃 Exercise Plan</Text>
                                            </LinearGradient>
                                        </TouchableOpacity>
                                    </View>
                                </>
                            )}
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
    headerIcon: {
        fontSize: 32,
    },
    headerText: {
        flex: 1,
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
    categoryEmoji: {
        fontSize: 48,
        marginBottom: indianDesign.spacing.sm,
    },
    categoryIcon: {
        marginBottom: indianDesign.spacing.sm,
    },
    categoryName: {
        fontSize: scaledFontSize(16),
        fontWeight: indianDesign.fontWeight.bold,
        color: '#FFF',
    },
    section: {
        marginBottom: indianDesign.spacing.xl,
    },
    sectionTitle: {
        fontSize: scaledFontSize(16),
        fontWeight: indianDesign.fontWeight.bold,
        color: healthColors.text.primary,
        marginBottom: indianDesign.spacing.md,
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
        backgroundColor: '#7E57C2',
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
    modalEmoji: {
        fontSize: 32,
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
    detailTitle: {
        fontSize: scaledFontSize(16),
        fontWeight: indianDesign.fontWeight.bold,
        color: healthColors.text.primary,
        marginBottom: indianDesign.spacing.md,
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
        paddingVertical: indianDesign.spacing.md,
        alignItems: 'center',
    },
    actionButtonText: {
        fontSize: scaledFontSize(14),
        fontWeight: indianDesign.fontWeight.semibold,
        color: '#FFF',
    },
});

export default DiseaseInfoScreen;
