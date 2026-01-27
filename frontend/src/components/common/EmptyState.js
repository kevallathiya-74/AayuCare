import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme, healthColors } from '../../theme';
import { textStyles } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import { verticalScale } from '../../utils/responsive';
import Button from './Button';

const EmptyState = ({
    icon = 'file-tray-outline',
    title = 'No data available',
    message = 'There is nothing to display at the moment.',
    actionLabel,
    onActionPress,
    style,
}) => {
    const opacity = useRef(new Animated.Value(0)).current;
    const translateY = useRef(new Animated.Value(20)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(opacity, {
                toValue: 1,
                delay: 100,
                duration: 300,
                useNativeDriver: true,
            }),
            Animated.spring(translateY, {
                toValue: 0,
                delay: 100,
                useNativeDriver: true,
            }),
        ]).start();
    }, []);

    return (
        <Animated.View style={[styles.container, { opacity, transform: [{ translateY }] }, style]}>
            <View style={styles.iconContainer}>
                <Ionicons name={icon} size={80} color={healthColors.neutral.gray300} />
            </View>

            <Text style={styles.title}>{title}</Text>
            <Text style={styles.message}>{message}</Text>

            {actionLabel && onActionPress && (
                <Button
                    onPress={onActionPress}
                    variant="primary"
                    style={styles.button}
                >
                    {actionLabel}
                </Button>
            )}
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: theme.spacing.xl,
        paddingVertical: verticalScale(spacing.xxl),
    },
    iconContainer: {
        marginBottom: theme.spacing.lg,
    },
    title: {
        fontSize: 18,
        fontWeight: '700',
        color: healthColors.text.primary,
        textAlign: 'center',
        marginBottom: theme.spacing.sm,
    },
    message: {
        fontSize: 14,
        color: healthColors.text.secondary,
        textAlign: 'center',
        marginBottom: theme.spacing.lg,
        lineHeight: 14 * 1.5,
    },
    button: {
        marginTop: theme.spacing.md,
        minWidth: 160,
    },
});

export default EmptyState;




