/**
 * Health Status Screen
 * View patient's health status and vitals
 */

import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { healthColors } from '../../theme/healthColors';
import { indianDesign, createShadow } from '../../theme/indianDesign';

const HealthStatusScreen = ({ navigation }) => {
    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar barStyle="dark-content" backgroundColor={healthColors.background.primary} />

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
                <Text style={styles.headerTitle}>Health Status</Text>
                <View style={styles.placeholder} />
            </View>

            {/* Content */}
            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.emptyState}>
                    <Ionicons
                        name="heart-outline"
                        size={80}
                        color={healthColors.success.main}
                    />
                    <Text style={styles.emptyTitle}>All Good!</Text>
                    <Text style={styles.emptySubtitle}>
                        Your health vitals will be tracked here
                    </Text>
                </View>
            </ScrollView>
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
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: indianDesign.fontSize.large,
        fontWeight: indianDesign.fontWeight.bold,
        color: healthColors.text.primary,
    },
    placeholder: {
        width: 40,
    },
    content: {
        flexGrow: 1,
        padding: indianDesign.spacing.xl,
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: indianDesign.spacing.xxxl,
    },
    emptyTitle: {
        fontSize: indianDesign.fontSize.large,
        fontWeight: indianDesign.fontWeight.bold,
        color: healthColors.text.primary,
        marginTop: indianDesign.spacing.lg,
    },
    emptySubtitle: {
        fontSize: indianDesign.fontSize.medium,
        color: healthColors.text.secondary,
        marginTop: indianDesign.spacing.xs,
        textAlign: 'center',
    },
});

export default HealthStatusScreen;
