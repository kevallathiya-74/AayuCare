import React, { memo, useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Image,
  ScrollView,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import {
  Building2,
  UserCircle2,
  ChevronRight,
  ShieldCheck,
} from "lucide-react-native";
import { theme, healthColors, textStyles, spacing } from "@/theme";
import { ModalSheet, Button } from "@/components/common";

import Routes from "@/navigation/routes";
import { useTranslation } from 'react-i18next';

const RoleCard = memo(
  ({
    Icon,
    gradientColors,
    onPress,
    accessibilityLabel,
    title,
    subtitle,
    badge,
  }) => {
    const { t } = useTranslation();
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={onPress}
        activeOpacity={0.9}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
      >
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        style={styles.cardGradient}
      >
        <View style={styles.cardContent}>
          <View style={styles.iconContainer}>
            <Icon size={theme.iconSizes.xxl} color={theme.colors.text.white} />
          </View>
          <View style={styles.cardTextContainer}>
            <Text style={styles.cardLabel}>{t('continue_as')}</Text>
            <Text style={styles.cardTitle}>{title}</Text>
            <Text style={styles.cardDescription}>{subtitle}</Text>
          </View>
          {badge ? (
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>{badge}</Text>
            </View>
          ) : (
            <View style={styles.actionIcon}>
              <ChevronRight
                size={theme.iconSizes.lg}
                color={theme.withOpacity(theme.colors.text.white, 0.7)}
              />
            </View>
          )}
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
});

const BoxSelectionScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [showUserModal, setShowUserModal] = useState(false);
  const { height } = useWindowDimensions();

  const handleHospitalPress = useCallback(() => {
    try {
      navigation.navigate(Routes.AUTH.LOGIN);
    } catch (error) {
      console.error("BoxSelectionScreen", "Navigation error", error);
    }
  }, [navigation]);

  const handleUserPress = useCallback(() => {
    setShowUserModal(true);
  }, []);

  // Compute dynamic spacing and heights based on screen size
  const isSmallScreen = height < 650;

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="transparent"
        translucent
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: Math.max(insets.top, spacing.lg),
            paddingBottom: Math.max(insets.bottom + spacing.md, spacing.lg),
          },
        ]}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <View style={[styles.header, isSmallScreen && styles.headerSmall]}>
          <View
            style={[styles.logoWrap, isSmallScreen && styles.logoWrapSmall]}
          >
            <Image
              source={require("../../../../assets/icons/aayucare-logo.png")}
              style={[styles.logo, isSmallScreen && styles.logoSmall]}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.welcomeText}>{t('welcome_to')}</Text>
          <Text style={styles.brandTitle}>{t('aayucare')}</Text>
          <View style={styles.subtitleWrap}>
            <Text style={styles.subtitle}>{t('choose_your_role_to_get_starte')}</Text>
          </View>
        </View>

        <View
          style={[
            styles.cardsContainer,
            isSmallScreen && styles.cardsContainerSmall,
          ]}
        >
          <RoleCard
            icon={Building2}
            gradientColors={[
              healthColors.primary.main,
              healthColors.primary.dark,
            ]}
            onPress={handleHospitalPress}
            accessibilityLabel="Continue as hospital"
            title="Hospital"
            subtitle="Admin, Doctor & Employee Access"
          />

          <RoleCard
            icon={UserCircle2}
            gradientColors={[
              healthColors.secondary.main,
              healthColors.secondary.dark,
            ]}
            onPress={handleUserPress}
            accessibilityLabel="Continue as user"
            title="User"
            subtitle="Personal Health & Wellness"
            badge="LIMITED ACCESS"
          />
        </View>

        <View style={styles.footer}>
          <View style={styles.trustBadge}>
            <ShieldCheck
              size={theme.iconSizes.sm}
              color={healthColors.success.main}
            />
            <Text style={styles.footerText}>{t('secure_private_trusted')}</Text>
          </View>
        </View>
      </ScrollView>

      <ModalSheet
        visible={showUserModal}
        onClose={() => setShowUserModal(false)}
        title="Coming Soon"
        maxHeight={0.4}
      >
        <View style={styles.modalContent}>
          <Text style={styles.modalBody}>
            {t('the_user_section_is_currently_')} Please utilize the
            Hospital portal for doctor and admin functions.
          </Text>
          <Button
            variant="primary"
            title="Got it"
            onPress={() => setShowUserModal(false)}
            style={styles.modalButton}
          />
        </View>
      </ModalSheet>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: healthColors.background.primary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "space-between",
  },
  header: {
    paddingTop: spacing.xxl,
    alignItems: "center",
    paddingHorizontal: spacing.xl,
  },
  headerSmall: {
    paddingTop: spacing.md,
  },
  logoWrap: {
    width: 90,
    height: 90,
    borderRadius: theme.borderRadius.xl,
    backgroundColor: theme.colors.text.white,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.lg,
    ...theme.shadows.sm,
  },
  logoWrapSmall: {
    width: 70,
    height: 70,
    marginBottom: spacing.sm,
  },
  logo: {
    width: 64,
    height: 64,
  },
  logoSmall: {
    width: 48,
    height: 48,
  },
  welcomeText: {
    ...textStyles.h4,
    color: healthColors.text.secondary,
    fontWeight: theme.typography.weights.medium,
    letterSpacing: 0.5,
  },
  brandTitle: {
    ...textStyles.h1,
    color: healthColors.primary.main,
    marginTop: -4,
  },
  subtitleWrap: {
    marginTop: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    backgroundColor: healthColors.primary.surface,
    borderRadius: theme.borderRadius.pill,
  },
  subtitle: {
    ...textStyles.bodySmall,
    color: healthColors.primary.main,
    fontWeight: theme.typography.weights.semibold,
  },
  cardsContainer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    gap: spacing.lg,
  },
  cardsContainerSmall: {
    paddingVertical: spacing.sm,
    gap: spacing.md,
  },

  cardGradient: {
    flex: 1,
    padding: spacing.lg,
  },
  cardContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: theme.withOpacity(theme.colors.text.white, 0.25),
    justifyContent: "center",
    alignItems: "center",
    marginRight: spacing.lg,
  },
  cardTextContainer: {
    flex: 1,
  },
  cardLabel: {
    ...textStyles.overline,
    color: theme.withOpacity(theme.colors.text.white, 0.7),
    fontWeight: theme.typography.weights.bold,
    letterSpacing: 1.2,
  },
  cardTitle: {
    ...textStyles.h2,
    color: theme.colors.text.white,
    marginTop: spacing.xs,
  },
  cardDescription: {
    ...textStyles.bodySmall,
    color: theme.withOpacity(theme.colors.text.white, 0.85),
    marginTop: spacing.xs,
  },
  actionIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.withOpacity(theme.colors.text.white, 0.2),
    justifyContent: "center",
    alignItems: "center",
  },
  statusBadge: {
    position: "absolute",
    top: 0,
    right: 0,
    backgroundColor: theme.withOpacity(theme.colors.text.white, 0.2),
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: theme.borderRadius.sm,
  },
  statusText: {
    ...textStyles.overline,
    color: theme.colors.text.white,
    fontWeight: theme.typography.weights.bold,
  },
  footer: {
    alignItems: "center",
    marginTop: spacing.md,
  },
  trustBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: theme.colors.text.white,
    borderRadius: theme.borderRadius.pill,
    ...theme.shadows.xs,
  },
  footerText: {
    ...textStyles.caption,
    color: healthColors.text.tertiary,
    fontWeight: theme.typography.weights.semibold,
  },
  modalContent: {
    paddingBottom: spacing.sm,
  },
  modalBody: {
    ...textStyles.bodyLarge,
    color: healthColors.text.secondary,
    lineHeight: 24,
    textAlign: "center",
  },
  modalButton: {
    marginTop: spacing.lg,
  },
});

export default BoxSelectionScreen;
