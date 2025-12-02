/**
 * AayuCare - Custom Input Component
 * 
 * Features: floating label, validation states, icons, password toggle
 */

import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import colors from '../../theme/colors';
import { textStyles, fontFamilies } from '../../theme/typography';
import { spacing, componentSpacing, layout } from '../../theme/spacing';

const Input = ({
  label,
  value,
  onChangeText,
  placeholder,
  error,
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
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [labelAnim] = useState(new Animated.Value(value ? 1 : 0));

  const handleFocus = () => {
    setIsFocused(true);
    Animated.timing(labelAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: false,
    }).start();
  };

  const handleBlur = () => {
    setIsFocused(false);
    if (!value) {
      Animated.timing(labelAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: false,
      }).start();
    }
  };

  const labelStyle = {
    position: 'absolute',
    left: leftIcon ? 48 : spacing.md,
    top: labelAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [18, -8],
    }),
    fontSize: labelAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [16, 12],
    }),
    color: error
      ? colors.error.main
      : isFocused
      ? colors.primary.main
      : colors.text.tertiary,
    paddingHorizontal: 4,
  };

  const containerStyle = [
    styles.container,
    isFocused && styles.containerFocused,
    error && styles.containerError,
    disabled && styles.containerDisabled,
  ];

  return (
    <View style={[styles.wrapper, style]}>
      <View style={containerStyle}>
        {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}

        {label && <Animated.Text style={labelStyle}>{label}</Animated.Text>}

        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={!label || isFocused || value ? placeholder : ''}
          placeholderTextColor={colors.input.placeholder}
          onFocus={handleFocus}
          onBlur={handleBlur}
          editable={!disabled}
          secureTextEntry={secureTextEntry && !showPassword}
          multiline={multiline}
          numberOfLines={numberOfLines}
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
            <Feather
              name={showPassword ? 'eye-off' : 'eye'}
              size={20}
              color={colors.text.tertiary}
            />
          </TouchableOpacity>
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
};

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: componentSpacing.inputMargin,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.input.background,
    borderWidth: 1,
    borderColor: colors.input.border,
    borderRadius: colors.borderRadius.medium,
    height: layout.inputHeight,
  },
  containerFocused: {
    borderColor: colors.input.borderFocused,
    borderWidth: 2,
  },
  containerError: {
    borderColor: colors.input.borderError,
  },
  containerDisabled: {
    backgroundColor: colors.neutral.gray100,
    opacity: 0.6,
  },
  input: {
    flex: 1,
    fontFamily: fontFamilies.body,
    fontSize: 16,
    color: colors.text.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
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
    color: colors.error.main,
  },
});

export default Input;
