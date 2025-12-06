/**
 * AayuCare - CustomTabBar
 * 
 * Custom bottom tab bar with animations
 * Features: active tab indicator, icon transitions, haptic feedback
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSpring,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import colors from '../theme/colors';
import { textStyles } from '../theme/typography';
import { spacing } from '../theme/spacing';

const CustomTabBar = ({ state, descriptors, navigation }) => {
    return (
        <View style={styles.container}>
            {state.routes.map((route, index) => {
                const { options } = descriptors[route.key];
                const label =
                    options.tabBarLabel !== undefined
                        ? options.tabBarLabel
                        : options.title !== undefined
                            ? options.title
                            : route.name;

                const isFocused = state.index === index;

                const onPress = () => {
                    const event = navigation.emit({
                        type: 'tabPress',
                        target: route.key,
                        canPreventDefault: true,
                    });

                    if (!isFocused && !event.defaultPrevented) {
                        navigation.navigate(route.name);
                    }
                };

                const onLongPress = () => {
                    navigation.emit({
                        type: 'tabLongPress',
                        target: route.key,
                    });
                };

                // Get icon name based on route
                const getIconName = () => {
                    switch (route.name) {
                        case 'Home':
                            return isFocused ? 'home' : 'home-outline';
                        case 'Doctors':
                            return isFocused ? 'people' : 'people-outline';
                        case 'Appointments':
                            return isFocused ? 'calendar' : 'calendar-outline';
                        case 'Profile':
                            return isFocused ? 'person' : 'person-outline';
                        default:
                            return 'ellipse';
                    }
                };

                return (
                    <TouchableOpacity
                        key={index}
                        accessibilityRole="button"
                        accessibilityState={isFocused ? { selected: true } : {}}
                        accessibilityLabel={options.tabBarAccessibilityLabel}
                        testID={options.tabBarTestID}
                        onPress={onPress}
                        onLongPress={onLongPress}
                        style={styles.tab}
                        activeOpacity={0.7}
                    >
                        <Animated.View style={styles.tabContent}>
                            <Ionicons
                                name={getIconName()}
                                size={24}
                                color={isFocused ? colors.primary.main : colors.text.tertiary}
                            />
                            <Text
                                style={[
                                    styles.label,
                                    { color: isFocused ? colors.primary.main : colors.text.tertiary },
                                ]}
                            >
                                {label}
                            </Text>
                        </Animated.View>
                        {isFocused && <View style={styles.indicator} />}
                    </TouchableOpacity>
                );
            })}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        backgroundColor: colors.background.primary,
        borderTopWidth: 1,
        borderTopColor: colors.neutral.gray200,
        paddingBottom: Platform.OS === 'ios' ? spacing.lg : spacing.sm,
        paddingTop: spacing.sm,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: -2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
            },
            android: {
                elevation: 8,
            },
        }),
    },
    tab: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: spacing.sm,
    },
    tabContent: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    label: {
        ...textStyles.caption,
        marginTop: 4,
        fontWeight: '600',
    },
    indicator: {
        position: 'absolute',
        top: 0,
        width: 40,
        height: 3,
        backgroundColor: colors.primary.main,
        borderRadius: 2,
    },
});

export default CustomTabBar;
