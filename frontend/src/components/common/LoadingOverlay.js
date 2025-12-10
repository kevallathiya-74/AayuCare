/**
 * AayuCare - LoadingOverlay Component
 * 
 * Full-screen loading with spinner and backdrop
 * Features: blur effect, loading message
 */

import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Modal } from 'react-native';
import { healthColors } from '../../theme/healthColors';
import { textStyles } from '../../theme/typography';
import { spacing } from '../../theme/spacing';

const LoadingOverlay = ({
    visible = false,
    message = 'Loading...',
    transparent = true,
}) => {
    if (!visible) return null;

    return (
        <Modal
            transparent={transparent}
            visible={visible}
            animationType="fade"
            statusBarTranslucent
        >
            <View style={styles.container}>
                <View style={styles.content}>
                    <ActivityIndicator size="large" color={healthColors.primary.main} />
                    {message && <Text style={styles.message}>{message}</Text>}
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: healthColors.background.overlay,
        alignItems: 'center',
        justifyContent: 'center',
    },
    content: {
        backgroundColor: healthColors.background.primary,
        borderRadius: healthColors.borderRadius.large,
        padding: spacing.xl,
        alignItems: 'center',
        minWidth: 120,
    },
    message: {
        ...textStyles.bodyMedium,
        color: healthColors.text.primary,
        marginTop: spacing.md,
    },
});

export default LoadingOverlay;
