/**
 * AayuCare - SearchBar Component
 * 
 * Animated search input with focus effects
 * Features: clear button, filter button, voice search icon
 */

import React, { useState } from 'react';
import {
    View,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Platform,
} from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withTiming,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import colors from '../../theme/colors';
import { textStyles } from '../../theme/typography';
import { spacing } from '../../theme/spacing';

const SearchBar = ({
    value,
    onChangeText,
    onFocus,
    onBlur,
    onFilterPress,
    placeholder = 'Search...',
    showFilter = false,
    showVoice = false,
    style,
}) => {
    const [isFocused, setIsFocused] = useState(false);
    const borderColor = useSharedValue(colors.input.border);

    const animatedStyle = useAnimatedStyle(() => ({
        borderColor: borderColor.value,
    }));

    const handleFocus = () => {
        setIsFocused(true);
        borderColor.value = withTiming(colors.input.borderFocused, { duration: 200 });
        if (onFocus) onFocus();
    };

    const handleBlur = () => {
        setIsFocused(false);
        borderColor.value = withTiming(colors.input.border, { duration: 200 });
        if (onBlur) onBlur();
    };

    const handleClear = () => {
        if (onChangeText) onChangeText('');
    };

    return (
        <Animated.View style={[styles.container, animatedStyle, style]}>
            <Ionicons
                name="search"
                size={20}
                color={isFocused ? colors.primary.main : colors.text.tertiary}
                style={styles.searchIcon}
            />

            <TextInput
                value={value}
                onChangeText={onChangeText}
                onFocus={handleFocus}
                onBlur={handleBlur}
                placeholder={placeholder}
                placeholderTextColor={colors.input.placeholder}
                style={styles.input}
                returnKeyType="search"
            />

            {value?.length > 0 && (
                <TouchableOpacity onPress={handleClear} style={styles.iconButton}>
                    <Ionicons name="close-circle" size={20} color={colors.text.tertiary} />
                </TouchableOpacity>
            )}

            {showVoice && !value && (
                <TouchableOpacity style={styles.iconButton}>
                    <Ionicons name="mic" size={20} color={colors.text.tertiary} />
                </TouchableOpacity>
            )}

            {showFilter && (
                <TouchableOpacity onPress={onFilterPress} style={styles.filterButton}>
                    <Ionicons name="options" size={20} color={colors.primary.main} />
                </TouchableOpacity>
            )}
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.input.background,
        borderRadius: colors.borderRadius.medium,
        borderWidth: 1,
        paddingHorizontal: spacing.md,
        height: 48,
    },
    searchIcon: {
        marginRight: spacing.sm,
    },
    input: {
        flex: 1,
        ...textStyles.bodyMedium,
        color: colors.text.primary,
        paddingVertical: 0,
    },
    iconButton: {
        padding: spacing.xs,
        marginLeft: spacing.xs,
    },
    filterButton: {
        padding: spacing.xs,
        marginLeft: spacing.sm,
        borderLeftWidth: 1,
        borderLeftColor: colors.neutral.gray200,
        paddingLeft: spacing.md,
    },
});

export default SearchBar;
