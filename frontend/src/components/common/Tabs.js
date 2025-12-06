/**
 * AayuCare - Tabs Component
 * 
 * Animated tab navigation with sliding indicator
 * Features: scrollable tabs, icon support, badge support
 */

import React, { useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    StyleSheet,
    Dimensions,
} from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSpring,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import colors from '../../theme/colors';
import { textStyles } from '../../theme/typography';
import { spacing } from '../../theme/spacing';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const Tabs = ({
    tabs = [], // [{ label, icon, badge }]
    activeIndex = 0,
    onChange,
    scrollable = false,
    style,
}) => {
    const [tabWidths, setTabWidths] = useState([]);
    const indicatorPosition = useSharedValue(0);
    const indicatorWidth = useSharedValue(0);

    const handleTabPress = (index) => {
        if (onChange) onChange(index);

        // Calculate indicator position
        const position = tabWidths.slice(0, index).reduce((sum, width) => sum + width, 0);
        indicatorPosition.value = withSpring(position, { damping: 20, stiffness: 300 });
        indicatorWidth.value = withSpring(tabWidths[index] || 0, { damping: 20, stiffness: 300 });
    };

    const handleTabLayout = (index, event) => {
        const { width } = event.nativeEvent.layout;
        const newWidths = [...tabWidths];
        newWidths[index] = width;
        setTabWidths(newWidths);

        // Set initial indicator position
        if (index === activeIndex && indicatorWidth.value === 0) {
            const position = newWidths.slice(0, activeIndex).reduce((sum, w) => sum + w, 0);
            indicatorPosition.value = position;
            indicatorWidth.value = width;
        }
    };

    const indicatorStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: indicatorPosition.value }],
        width: indicatorWidth.value,
    }));

    const renderTab = (tab, index) => {
        const isActive = index === activeIndex;

        return (
            <TouchableOpacity
                key={index}
                onPress={() => handleTabPress(index)}
                onLayout={(event) => handleTabLayout(index, event)}
                style={[
                    styles.tab,
                    !scrollable && { flex: 1 },
                ]}
                activeOpacity={0.7}
            >
                {tab.icon && (
                    <Ionicons
                        name={tab.icon}
                        size={20}
                        color={isActive ? colors.primary.main : colors.text.secondary}
                        style={styles.tabIcon}
                    />
                )}
                <Text
                    style={[
                        styles.tabLabel,
                        isActive ? styles.tabLabelActive : styles.tabLabelInactive,
                    ]}
                >
                    {tab.label}
                </Text>
                {tab.badge && (
                    <View style={styles.badge}>
                        <Text style={styles.badgeText}>{tab.badge}</Text>
                    </View>
                )}
            </TouchableOpacity>
        );
    };

    const TabContainer = scrollable ? ScrollView : View;
    const containerProps = scrollable
        ? {
            horizontal: true,
            showsHorizontalScrollIndicator: false,
            contentContainerStyle: styles.scrollContent,
        }
        : { style: styles.container };

    return (
        <View style={[styles.wrapper, style]}>
            <TabContainer {...containerProps}>
                {tabs.map((tab, index) => renderTab(tab, index))}
            </TabContainer>
            <Animated.View style={[styles.indicator, indicatorStyle]} />
        </View>
    );
};

const styles = StyleSheet.create({
    wrapper: {
        backgroundColor: colors.background.primary,
        borderBottomWidth: 1,
        borderBottomColor: colors.neutral.gray200,
    },
    container: {
        flexDirection: 'row',
    },
    scrollContent: {
        paddingHorizontal: spacing.sm,
    },
    tab: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.md,
        minWidth: 80,
    },
    tabIcon: {
        marginRight: spacing.xs,
    },
    tabLabel: {
        ...textStyles.labelLarge,
    },
    tabLabelActive: {
        color: colors.primary.main,
        fontWeight: '600',
    },
    tabLabelInactive: {
        color: colors.text.secondary,
    },
    badge: {
        backgroundColor: colors.error.main,
        borderRadius: 10,
        minWidth: 18,
        height: 18,
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: spacing.xs,
        paddingHorizontal: 4,
    },
    badgeText: {
        ...textStyles.caption,
        color: colors.neutral.white,
        fontSize: 10,
        fontWeight: '600',
    },
    indicator: {
        height: 3,
        backgroundColor: colors.primary.main,
        borderRadius: 2,
        position: 'absolute',
        bottom: 0,
    },
});

export default Tabs;
