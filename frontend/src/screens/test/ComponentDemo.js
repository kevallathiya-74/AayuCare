/**
 * AayuCare - Component Demo/Test Screen
 * 
 * Test all reusable components
 */

import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';

import {
  Button,
  Card,
  Input,
  Avatar,
  Badge,
  SkeletonLoader,
  SkeletonCard,
  SkeletonText,
} from '../../components/common';

import colors from '../../theme/colors';
import { textStyles } from '../../theme/typography';
import { spacing, componentSpacing } from '../../theme/spacing';

const ComponentDemo = () => {
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Component Library Demo</Text>

        {/* Buttons */}
        <Text style={styles.sectionTitle}>Buttons</Text>
        <Button onPress={() => alert('Primary Button')}>Primary Button</Button>
        <Button variant="secondary" onPress={() => alert('Secondary')}>
          Secondary Button
        </Button>
        <Button variant="outline" onPress={() => alert('Outline')}>
          Outline Button
        </Button>
        <Button
          gradient
          icon={<Feather name="heart" size={20} color={colors.neutral.white} />}
          onPress={() => alert('Gradient')}
        >
          Gradient Button
        </Button>
        <Button loading={true}>Loading Button</Button>
        <Button disabled>Disabled Button</Button>

        {/* Cards */}
        <Text style={styles.sectionTitle}>Cards</Text>
        <Card>
          <Text style={styles.cardTitle}>Simple Card</Text>
          <Text style={styles.cardText}>This is a card with default styling</Text>
        </Card>

        <Card elevation="large" onPress={() => alert('Card pressed!')}>
          <Text style={styles.cardTitle}>Pressable Card</Text>
          <Text style={styles.cardText}>Tap me to see the press animation</Text>
        </Card>

        {/* Inputs */}
        <Text style={styles.sectionTitle}>Inputs</Text>
        <Input
          label="Email"
          placeholder="Enter your email"
          value={inputValue}
          onChangeText={setInputValue}
          leftIcon={<Feather name="mail" size={20} color={colors.text.tertiary} />}
        />

        <Input
          label="Password"
          placeholder="Enter password"
          secureTextEntry
          leftIcon={<Feather name="lock" size={20} color={colors.text.tertiary} />}
        />

        <Input
          label="Phone"
          placeholder="Enter phone number"
          error="Invalid phone number"
          leftIcon={<Feather name="phone" size={20} color={colors.text.tertiary} />}
        />

        {/* Avatars */}
        <Text style={styles.sectionTitle}>Avatars</Text>
        <View style={styles.row}>
          <Avatar name="John Doe" size="small" />
          <Avatar name="Jane Smith" size="medium" />
          <Avatar name="Bob Wilson" size="large" online />
          <Avatar icon="user" size="medium" backgroundColor={colors.secondary.main} />
        </View>

        {/* Badges */}
        <Text style={styles.sectionTitle}>Badges</Text>
        <View style={styles.row}>
          <Badge status="pending">Pending</Badge>
          <Badge status="confirmed">Confirmed</Badge>
          <Badge status="cancelled">Cancelled</Badge>
        </View>
        <View style={styles.row}>
          <Badge variant="count">5</Badge>
          <Badge variant="count">99+</Badge>
          <Badge variant="dot" status="confirmed" />
        </View>

        {/* Skeleton Loaders */}
        <Text style={styles.sectionTitle}>Skeleton Loaders</Text>
        <SkeletonLoader width="100%" height={40} />
        <SkeletonText lines={3} />
        <SkeletonCard />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  scrollContent: {
    padding: componentSpacing.screenPadding,
  },
  title: {
    ...textStyles.displayMedium,
    color: colors.text.primary,
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    ...textStyles.h3,
    color: colors.text.primary,
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  cardTitle: {
    ...textStyles.h4,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  cardText: {
    ...textStyles.bodyMedium,
    color: colors.text.secondary,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
});

export default ComponentDemo;
