/**
 * AayuCare - BottomSheet Component
 * 
 * Animated bottom sheet modal with gesture handling
 * Features: snap points, backdrop, smooth animations
 */

import React, { useEffect, useCallback } from 'react';
import {
    View,
    StyleSheet,
    Modal,
    TouchableWithoutFeedback,
    Dimensions,
    Platform,
} from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    withTiming,
    runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import colors from '../../theme/colors';
import { spacing } from '../../theme/spacing';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const BottomSheet = ({
    visible = false,
    onClose,
    children,
    snapPoints = [0.5, 0.9], // Percentage of screen height
    initialSnap = 0, // Index of snapPoints
    enableBackdrop = true,
    backdropOpacity = 0.5,
    style,
}) => {
    const translateY = useSharedValue(SCREEN_HEIGHT);
    const backdropOpacityValue = useSharedValue(0);
    const context = useSharedValue({ y: 0 });

    const snapPointsInPixels = snapPoints.map(point => SCREEN_HEIGHT * (1 - point));

    useEffect(() => {
        if (visible) {
            translateY.value = withSpring(snapPointsInPixels[initialSnap], {
                damping: 50,
                stiffness: 400,
            });
            backdropOpacityValue.value = withTiming(backdropOpacity, { duration: 300 });
        } else {
            translateY.value = withSpring(SCREEN_HEIGHT, {
                damping: 50,
                stiffness: 400,
            });
            backdropOpacityValue.value = withTiming(0, { duration: 300 });
        }
    }, [visible]);

    const handleClose = useCallback(() => {
        if (onClose) {
            onClose();
        }
    }, [onClose]);

    const panGesture = Gesture.Pan()
        .onStart(() => {
            context.value = { y: translateY.value };
        })
        .onUpdate((event) => {
            const newY = context.value.y + event.translationY;
            // Prevent dragging above the highest snap point
            if (newY >= snapPointsInPixels[snapPointsInPixels.length - 1]) {
                translateY.value = newY;
            }
        })
        .onEnd((event) => {
            const velocity = event.velocityY;
            const currentY = translateY.value;

            // If dragged down significantly or fast velocity, close
            if (currentY > SCREEN_HEIGHT * 0.6 || velocity > 500) {
                translateY.value = withSpring(SCREEN_HEIGHT, {
                    damping: 50,
                    stiffness: 400,
                });
                runOnJS(handleClose)();
            } else {
                // Snap to nearest snap point
                let nearestSnap = snapPointsInPixels[0];
                let minDistance = Math.abs(currentY - nearestSnap);

                snapPointsInPixels.forEach(snap => {
                    const distance = Math.abs(currentY - snap);
                    if (distance < minDistance) {
                        minDistance = distance;
                        nearestSnap = snap;
                    }
                });

                translateY.value = withSpring(nearestSnap, {
                    damping: 50,
                    stiffness: 400,
                });
            }
        });

    const sheetStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: translateY.value }],
    }));

    const backdropStyle = useAnimatedStyle(() => ({
        opacity: backdropOpacityValue.value,
    }));

    if (!visible) return null;

    return (
        <Modal
            transparent
            visible={visible}
            onRequestClose={onClose}
            animationType="none"
            statusBarTranslucent
        >
            <View style={styles.container}>
                {enableBackdrop && (
                    <TouchableWithoutFeedback onPress={onClose}>
                        <Animated.View style={[styles.backdrop, backdropStyle]} />
                    </TouchableWithoutFeedback>
                )}

                <GestureDetector gesture={panGesture}>
                    <Animated.View style={[styles.sheet, sheetStyle, style]}>
                        <View style={styles.handleContainer}>
                            <View style={styles.handle} />
                        </View>
                        {children}
                    </Animated.View>
                </GestureDetector>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: colors.background.overlay,
    },
    sheet: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        height: SCREEN_HEIGHT,
        backgroundColor: colors.background.primary,
        borderTopLeftRadius: colors.borderRadius.large,
        borderTopRightRadius: colors.borderRadius.large,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: -2 },
                shadowOpacity: 0.15,
                shadowRadius: 8,
            },
            android: {
                elevation: 8,
            },
        }),
    },
    handleContainer: {
        alignItems: 'center',
        paddingVertical: spacing.md,
    },
    handle: {
        width: 40,
        height: 4,
        backgroundColor: colors.neutral.gray300,
        borderRadius: 2,
    },
});

export default BottomSheet;
