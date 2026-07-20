import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { theme, healthColors } from '@/theme';

export const FilterHeaderRow = ({ onClear }) => (
  <View style={styles.headerRow}>
    <Text style={styles.headerTitle}>Filters</Text>
    <TouchableOpacity onPress={onClear}>
      <Text style={styles.clearText}>Clear All</Text>
    </TouchableOpacity>
  </View>
);

export const FilterSectionTitle = ({ title }) => (
  <Text style={styles.sectionTitle}>{title}</Text>
);

export const FilterSelectField = ({ label, value, onPress, isOpen }) => (
  <TouchableOpacity style={styles.selectField} onPress={onPress}>
    <Text style={styles.selectLabel}>{label}</Text>
    <Text style={styles.selectValue}>{value}</Text>
  </TouchableOpacity>
);

export const FilterDropdownList = ({ options, selectedKey, onSelect }) => (
  <View style={styles.dropdownList}>
    {options.map((option) => (
      <TouchableOpacity 
        key={option.key} 
        style={[styles.dropdownItem, selectedKey === option.key && styles.dropdownItemSelected]} 
        onPress={() => onSelect(option.key)}
      >
        <Text style={[styles.dropdownItemText, selectedKey === option.key && styles.dropdownItemTextSelected]}>
          {option.label}
        </Text>
      </TouchableOpacity>
    ))}
  </View>
);

export const FilterChipGroup = ({ options, selectedKeys = [], onToggle }) => (
  <View style={styles.chipGroup}>
    {options.map((option) => {
      const isSelected = selectedKeys.includes(option.key);
      return (
        <TouchableOpacity 
          key={option.key} 
          style={[styles.chip, isSelected && styles.chipSelected]} 
          onPress={() => onToggle(option.key)}
        >
          <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
            {option.label}
          </Text>
        </TouchableOpacity>
      );
    })}
  </View>
);

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  headerTitle: {
    fontSize: theme.typography.sizes.h3,
    fontWeight: '700',
    color: healthColors.text.primary,
  },
  clearText: {
    fontSize: theme.typography.sizes.bodyMedium,
    color: healthColors.primary.main,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: theme.typography.sizes.bodyLarge,
    fontWeight: '600',
    color: healthColors.text.primary,
    marginBottom: theme.spacing.sm,
    marginTop: theme.spacing.md,
  },
  selectField: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: theme.spacing.md,
    backgroundColor: healthColors.background.secondary,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.sm,
  },
  selectLabel: {
    color: healthColors.text.secondary,
  },
  selectValue: {
    color: healthColors.text.primary,
    fontWeight: '600',
  },
  dropdownList: {
    backgroundColor: healthColors.background.secondary,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.md,
    overflow: 'hidden',
  },
  dropdownItem: {
    padding: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: healthColors.border.light,
  },
  dropdownItemSelected: {
    backgroundColor: healthColors.primary.light + '20',
  },
  dropdownItemText: {
    color: healthColors.text.primary,
  },
  dropdownItemTextSelected: {
    color: healthColors.primary.main,
    fontWeight: '600',
  },
  chipGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  chip: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: 20,
    backgroundColor: healthColors.background.secondary,
    borderWidth: 1,
    borderColor: healthColors.border.light,
  },
  chipSelected: {
    backgroundColor: healthColors.primary.main,
    borderColor: healthColors.primary.main,
  },
  chipText: {
    color: healthColors.text.primary,
  },
  chipTextSelected: {
    color: healthColors.white,
    fontWeight: '600',
  },
});
