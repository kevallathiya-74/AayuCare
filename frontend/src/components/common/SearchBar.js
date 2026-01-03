/**
 * AayuCare - SearchBar Component
 * 
 * Animated search input with focus effects
 * Features: clear button, filter button, voice search icon
 */

import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Platform,
    Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { healthColors } from '../../theme/healthColors';
import { textStyles } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import { moderateScale, scaledFontSize, getInputHeight } from '../../utils/responsive';

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
    const borderColorAnim = useRef(new Animated.Value(0)).current;

    const borderColor = borderColorAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [healthColors.input.border, healthColors.input.borderFocused],
    });

    const handleFocus = () => {
        setIsFocused(true);
        Animated.timing(borderColorAnim, {
            toValue: 1,
            duration: 200,
            useNativeDriver: false,
        }).start();
        if (onFocus) onFocus();
    };

    const handleBlur = () => {
        setIsFocused(false);
        Animated.timing(borderColorAnim, {
            toValue: 0,
            duration: 200,
            useNativeDriver: false,
        }).start();
        if (onBlur) onBlur();
    };

    const handleClear = () => {
        if (onChangeText) onChangeText('');
    };

    return (
        <Animated.View style={[styles.container, { borderColor }, style]}>
            <Ionicons
                name="search"
                size={20}
                color={isFocused ? healthColors.primary.main : healthColors.text.tertiary}
                style={styles.searchIcon}
            />

            <TextInput
                value={value}
                onChangeText={onChangeText}
                onFocus={handleFocus}
                onBlur={handleBlur}
                placeholder={placeholder}
                placeholderTextColor={healthColors.input.placeholder}
                style={styles.input}
                returnKeyType="search"
                accessibilityLabel={placeholder}
                accessibilityRole="search"
            />

            {value?.length > 0 && (
                <TouchableOpacity onPress={handleClear} style={styles.iconButton}>
                    <Ionicons name="close-circle" size={20} color={healthColors.text.tertiary} />
                </TouchableOpacity>
            )}

            {showVoice && !value && (
                <TouchableOpacity style={styles.iconButton}>
                    <Ionicons name="mic" size={20} color={healthColors.text.tertiary} />
                </TouchableOpacity>
            )}

            {showFilter && (
                <TouchableOpacity onPress={onFilterPress} style={styles.filterButton}>
                    <Ionicons name="options" size={20} color={healthColors.primary.main} />
                </TouchableOpacity>
            )}
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: healthColors.input.background,
        borderRadius: healthColors.borderRadius.medium,
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
        color: healthColors.text.primary,
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
        borderLeftColor: healthColors.neutral.gray200,
        paddingLeft: spacing.md,
    },
});

export default SearchBar;
