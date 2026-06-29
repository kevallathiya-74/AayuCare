import React from "react";
import { View, TextInput, StyleSheet, TouchableOpacity, ActivityIndicator } from "react-native";
import { Search, XCircle } from "lucide-react-native";
import { theme, healthColors } from '@/theme';

const SearchField = ({
  value,
  onChangeText,
  placeholder = "Search",
  onClear,
  loading = false,
  accessibilityLabel = "Search",
  accessibilityHint,
  autoCapitalize = "none",
  returnKeyType = "search",
  inputRef,
  style,
  ...inputProps
}) => {
  const hasValue = typeof value === "string" && value.length > 0;

  return (
    <View style={[styles.container, style]}>
      <Search size={theme.iconSizes.sm} color={healthColors.text.tertiary} />
      <TextInput
        ref={inputRef}
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={healthColors.text.tertiary}
        autoCapitalize={autoCapitalize}
        autoCorrect={false}
        returnKeyType={returnKeyType}
        accessibilityLabel={accessibilityLabel}
        accessibilityHint={accessibilityHint}
        {...inputProps}
      />

      {loading ? (
        <ActivityIndicator size="small" color={healthColors.primary.main} />
      ) : null}

      {!loading && hasValue ? (
        <TouchableOpacity
          onPress={onClear}
          style={styles.clearButton}
          accessibilityRole="button"
          accessibilityLabel="Clear search"
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <XCircle size={theme.iconSizes.sm} color={healthColors.text.disabled} />
        </TouchableOpacity>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    minHeight: theme.touchTargets.md,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: healthColors.neutral.gray100,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: healthColors.border.light,
    paddingHorizontal: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  input: {
    flex: 1,
    color: healthColors.text.primary,
    fontSize: theme.typography.sizes.bodyMedium,
    paddingVertical: theme.spacing.sm,
  },
  clearButton: {
    alignItems: "center",
    justifyContent: "center",
  },
});

export default SearchField;
