import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { ChevronDown } from "lucide-react-native";
import { theme, healthColors } from "../../theme";

export const FilterHeaderRow = ({ onClear, clearLabel = "Clear" }) => (
  <View style={styles.headerRow}>
    <TouchableOpacity onPress={onClear} accessibilityRole="button" accessibilityLabel={clearLabel}>
      <Text style={styles.clearText}>{clearLabel}</Text>
    </TouchableOpacity>
  </View>
);

export const FilterSectionTitle = ({ title }) => (
  <Text style={styles.sectionTitle}>{title}</Text>
);

export const FilterSelectField = ({ label, onPress, isOpen = false, accessibilityLabel }) => (
  <TouchableOpacity
    style={styles.selectField}
    onPress={onPress}
    accessibilityRole="button"
    accessibilityLabel={accessibilityLabel || label}
  >
    <Text style={styles.selectFieldText}>{label}</Text>
    <ChevronDown
      size={16}
      color={healthColors.text.secondary}
      style={isOpen ? styles.chevronOpen : undefined}
    />
  </TouchableOpacity>
);

export const FilterDropdownList = ({
  options = [],
  selectedKey,
  onSelect,
  getCount,
  getLabel,
}) => (
  <View style={styles.dropdownMenu}>
    {options.map((option, index) => {
      const optionKey = option.key;
      const active = selectedKey === optionKey;
      const label = getLabel ? getLabel(option) : option.label;
      const count = getCount ? getCount(option) : undefined;
      const isLast = index === options.length - 1;

      return (
        <TouchableOpacity
          key={optionKey}
          style={[
            styles.dropdownOption,
            active && styles.dropdownOptionActive,
            isLast && styles.dropdownOptionLast,
          ]}
          onPress={() => onSelect(option)}
        >
          <Text style={[styles.dropdownOptionText, active && styles.dropdownOptionTextActive]}>
            {label}
          </Text>
          {typeof count === "number" ? (
            <Text style={styles.dropdownOptionCount}>{count}</Text>
          ) : null}
        </TouchableOpacity>
      );
    })}
  </View>
);

export const FilterChipGroup = ({
  options = [],
  selectedKey,
  onSelect,
  getKey,
  getLabel,
  getCount,
}) => (
  <View style={styles.chipWrap}>
    {options.map((option) => {
      const optionKey = getKey ? getKey(option) : option.key;
      const active = selectedKey === optionKey;
      const label = getLabel ? getLabel(option) : option.label;
      const count = getCount ? getCount(option) : undefined;
      const text = typeof count === "number" ? `${label} (${count})` : label;

      return (
        <TouchableOpacity
          key={optionKey}
          style={[styles.chipOption, active && styles.chipOptionActive]}
          onPress={() => onSelect(option)}
        >
          <Text style={[styles.chipOptionText, active && styles.chipOptionTextActive]}>{text}</Text>
        </TouchableOpacity>
      );
    })}
  </View>
);

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginBottom: 8,
  },
  clearText: {
    color: healthColors.secondary.main,
    fontSize: theme.typography.sizes.bodyMedium,
    fontWeight: "600",
  },
  sectionTitle: {
    fontSize: theme.typography.sizes.h6,
    fontWeight: "700",
    color: healthColors.text.primary,
    marginTop: 8,
    marginBottom: 8,
  },
  selectField: {
    minHeight: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: healthColors.border.light,
    backgroundColor: healthColors.background.card,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  selectFieldText: {
    fontSize: theme.typography.sizes.bodyMedium,
    color: healthColors.text.primary,
    fontWeight: "500",
  },
  chevronOpen: {
    transform: [{ rotate: "180deg" }],
  },
  dropdownMenu: {
    marginTop: 8,
    marginBottom: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: healthColors.border.light,
    backgroundColor: healthColors.background.card,
    overflow: "hidden",
  },
  dropdownOption: {
    minHeight: 42,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: healthColors.border.light,
  },
  dropdownOptionLast: {
    borderBottomWidth: 0,
  },
  dropdownOptionActive: {
    backgroundColor: healthColors.primary.main + "12",
  },
  dropdownOptionText: {
    fontSize: theme.typography.sizes.bodyMedium,
    color: healthColors.text.primary,
    fontWeight: "600",
  },
  dropdownOptionTextActive: {
    color: healthColors.primary.main,
  },
  dropdownOptionCount: {
    fontSize: theme.typography.sizes.bodySmall,
    color: healthColors.text.tertiary,
    fontWeight: "700",
  },
  chipWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 4,
  },
  chipOption: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: healthColors.border.light,
    backgroundColor: healthColors.background.card,
  },
  chipOptionActive: {
    borderColor: healthColors.primary.main,
    backgroundColor: healthColors.primary.main,
  },
  chipOptionText: {
    fontSize: theme.typography.sizes.bodySmall,
    color: healthColors.text.secondary,
    fontWeight: "600",
  },
  chipOptionTextActive: {
    color: theme.colors.white,
  },
});
