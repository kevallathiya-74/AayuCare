/**
 * AayuCare - Custom Input Component
 * 
 * Features: floating label, validation states, icons, password toggle
 */

import React, { useState, useCallback, useRef, forwardRef, memo, useEffect } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { Eye, EyeOff, CheckCircle2 } from 'lucide-react-native';
import { theme, healthColors } from '@/theme';
import { textStyles, fontFamilies } from '@/theme/typography';
import { spacing, layout } from '@/theme/spacing';
import { 
    touchTargets,
    borderRadius as responsiveBorderRadius,
    getInputHeight,
} from '@/utils/responsive';

const Input = memo(forwardRef(({
  label,
  value,
  onChangeText,
  placeholder,
  error,
  success,
  helperText,
  leftIcon,
  rightIcon,
  secureTextEntry,
  disabled = false,
  multiline = false,
  numberOfLines = 1,
  style,
  inputStyle,
  ...props
}, ref) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // Use useRef to keep the Animated.Value reference completely stable across renders
  const labelAnim = useRef(new Animated.Value(value ? 1 : 0)).current;

  // Keep labelAnim synchronized with focus and value changes smoothly
  useEffect(() => {
    Animated.timing(labelAnim, {
      toValue: (value || isFocused) ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [value, isFocused, labelAnim]);

  const handleFocus = useCallback(() => {
    setIsFocused(true);
  }, []);

  const handleBlur = useCallback(() => {
    setIsFocused(false);
  }, []);

  const labelStyle = {
    position: 'absolute',
    left: leftIcon ? 48 : spacing.md,
    top: 13,
    fontSize: 16,
    color: error
      ? healthColors.error.main
      : success
      ? healthColors.success.main
      : isFocused
      ? healthColors.primary.main
      : healthColors.text.tertiary,
    backgroundColor: healthColors.background.primary,
    paddingHorizontal: 6,
    fontWeight: '500',
    zIndex: 1,
    transform: [
      {
        translateY: labelAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -23],
        }),
      },
      {
        scale: labelAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [1, 0.75],
        }),
      },
      {
        translateX: labelAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -12],
        }),
      },
    ],
  };

  const containerStyle = [
    styles.container,
    isFocused && styles.containerFocused,
    error && styles.containerError,
    success && !error && styles.containerSuccess,
    disabled && styles.containerDisabled,
  ];

  return (
    <View style={[styles.wrapper, style]}>
      <View style={containerStyle}>
        {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}

        {label && <Animated.Text style={labelStyle} pointerEvents="none">{label}</Animated.Text>}

        <TextInput
          ref={ref}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={(label && !isFocused && !value) ? 'transparent' : healthColors.input.placeholder}
          onFocus={handleFocus}
          onBlur={handleBlur}
          editable={!disabled}
          secureTextEntry={secureTextEntry && !showPassword}
          multiline={multiline}
          numberOfLines={numberOfLines}
          autoCorrect={false}
          autoCapitalize="none"
          accessibilityLabel={label || placeholder}
          accessibilityHint={helperText}
          accessibilityState={{ disabled }}
          style={[
            styles.input,
            leftIcon && styles.inputWithLeftIcon,
            (rightIcon || secureTextEntry) && styles.inputWithRightIcon,
            multiline && styles.inputMultiline,
            inputStyle,
          ]}
          {...props}
        />

        {secureTextEntry && (
          <TouchableOpacity
            style={styles.rightIcon}
            onPress={() => setShowPassword(!showPassword)}
          >
            {showPassword ? (
              <EyeOff size={20} color={healthColors.text.tertiary} />
            ) : (
              <Eye size={20} color={healthColors.text.tertiary} />
            )}
          </TouchableOpacity>
        )}

        {success && !error && !rightIcon && !secureTextEntry && (
          <View style={styles.rightIcon}>
            <CheckCircle2 size={20} color={healthColors.success.main} />
          </View>
        )}

        {rightIcon && !secureTextEntry && (
          <View style={styles.rightIcon}>{rightIcon}</View>
        )}
      </View>

      {(error || helperText) && (
        <Text style={[styles.helperText, error && styles.errorText]}>
          {error || helperText}
        </Text>
      )}
    </View>
  );
}));

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: theme.spacing.lg,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: healthColors.background.primary,
    borderWidth: 1.5,
    borderColor: healthColors.input.border,
    borderRadius: responsiveBorderRadius.medium,
    minHeight: Math.max(getInputHeight(), touchTargets.medium),
    paddingVertical: 4, // Internal padding for better alignment
  },
  containerFocused: {
    borderColor: healthColors.input.borderFocused,
    borderWidth: 1.5,
    backgroundColor: healthColors.background.primary,
    shadowColor: healthColors.primary.main,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
    elevation: 0,
  },
  containerError: {
    borderColor: healthColors.input.borderError,
    borderWidth: 1.5,
  },
  containerSuccess: {
    borderColor: healthColors.success.main,
    borderWidth: 1.5,
  },
  containerDisabled: {
    backgroundColor: healthColors.neutral.gray100,
    opacity: 0.6,
  },
  input: {
    flex: 1,
    fontFamily: fontFamilies.body,
    fontSize: theme.typography.sizes.bodyLarge,
    color: healthColors.text.primary,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    paddingTop: 10,
    textAlign: 'left',
  },
  inputWithLeftIcon: {
    paddingLeft: 0,
  },
  inputWithRightIcon: {
    paddingRight: 0,
  },
  inputMultiline: {
    height: 'auto',
    minHeight: layout.inputHeight,
    paddingTop: spacing.md,
    textAlignVertical: 'top',
  },
  leftIcon: {
    paddingLeft: spacing.md,
    paddingRight: spacing.sm,
  },
  rightIcon: {
    paddingRight: spacing.md,
    paddingLeft: spacing.sm,
  },
  helperText: {
    ...textStyles.caption,
    marginTop: spacing.xs,
    marginLeft: spacing.sm,
  },
  errorText: {
    color: healthColors.error.main,
  },
});

export default Input;




