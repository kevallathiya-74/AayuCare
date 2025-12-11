/**
 * Premium Box Selection Screen
 * Vibrant, beautiful design with enhanced colors
 * Optimized for Indian users
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Dimensions,
  Image,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { healthColors } from '../../theme/healthColors';
import { indianDesign } from '../../theme/indianDesign';
import { createShadow, createTextShadow } from '../../utils/platformStyles';

// Verify imports loaded correctly
if (!healthColors || !indianDesign) {
  console.error('[BoxSelectionScreen] ═══════════════════════════════════');
  console.error('[BoxSelectionScreen] Missing theme imports!');
  console.error('[BoxSelectionScreen] healthColors:', !!healthColors);
  console.error('[BoxSelectionScreen] indianDesign:', !!indianDesign);
  console.error('[BoxSelectionScreen] ═══════════════════════════════════');
}

const { width } = Dimensions.get('window');

const BoxSelectionScreen = ({ navigation }) => {
  console.log('[BoxSelectionScreen] Rendering...');
  console.log('[BoxSelectionScreen] Navigation available:', !!navigation);

  const handleHospitalPress = () => {
    try {
      console.log('[BoxSelectionScreen] Hospital button pressed');
      navigation.navigate('HospitalLogin');
    } catch (error) {
      console.error('[BoxSelectionScreen] Navigation error:', error);
    }
  };

  const handleUserPress = () => {
    // Coming soon - User section not available yet
    alert('🚧 User Section Coming Soon!\n\nThis feature is currently under development. Please use the Hospital login for now.');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header with Logo */}
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <Image
            source={require('../../../assets/images/aayucare-logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>
        <Text style={styles.title}>Continue as</Text>
        <Text style={styles.subtitle}>Choose your role to get started</Text>
      </View>

      {/* Selection Cards */}
      <View style={styles.cardsContainer}>
        {/* Hospital Card - Professional Teal + Navy */}
        <TouchableOpacity
          style={styles.card}
          onPress={handleHospitalPress}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={healthColors.hospital.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.cardGradient}
          >
            {/* Icon Circle */}
            <View style={styles.iconCircle}>
              <Ionicons
                name="business"
                size={44}
                color="#FFFFFF"
              />
            </View>

            {/* Card Content */}
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>Hospital</Text>
              <Text style={styles.cardSubtitle}>
                Admin, Doctor & Patient Access
              </Text>
            </View>

            {/* Arrow */}
            <View style={styles.arrowCircle}>
              <Ionicons
                name="arrow-forward"
                size={26}
                color="#FFFFFF"
              />
            </View>

            {/* Decorative Elements */}
            <View style={styles.decorCircle1} />
            <View style={styles.decorCircle2} />
          </LinearGradient>
        </TouchableOpacity>

        {/* Spacer between cards */}
        <View style={styles.cardSpacer} />

        {/* User Card - Sky Wellness Blue */}
        <TouchableOpacity
          style={[styles.card, styles.disabledCard]}
          onPress={handleUserPress}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={healthColors.secondary.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.cardGradient}
          >
            {/* Coming Soon Badge */}
            <View style={styles.comingSoonBadge}>
              <Text style={styles.comingSoonText}>Coming Soon</Text>
            </View>

            {/* Icon Circle */}
            <View style={styles.iconCircle}>
              <Ionicons
                name="person"
                size={44}
                color="#FFFFFF"
              />
            </View>

            {/* Card Content */}
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>User</Text>
              <Text style={styles.cardSubtitle}>
                General Health Services
              </Text>
            </View>

            {/* Decorative Elements */}
            <View style={styles.decorCircle1} />
            <View style={styles.decorCircle2} />
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <View style={styles.footerDot} />
        <View style={styles.footerSpacer} />
        <Text style={styles.footerText}>
          Secure • Private • Trusted
        </Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: healthColors.background.primary,
  },
  header: {
    paddingTop: Platform.OS === 'web' ? indianDesign.spacing.xxxl + 20 : indianDesign.spacing.xxxl + 20,
    paddingHorizontal: indianDesign.spacing.xl,
    marginBottom: indianDesign.spacing.xxl,
    alignItems: 'center',
  },
  logoContainer: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: healthColors.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: indianDesign.spacing.lg,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    ...createShadow({
      color: '#000',
      offset: { width: 0, height: 4 },
      opacity: 0.08,
      radius: 12,
      elevation: 4,
    }),
  },
  logo: {
    width: 65,
    height: 65,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#2C3E50',
    marginBottom: indianDesign.spacing.xs,
  },
  subtitle: {
    fontSize: indianDesign.fontSize.medium,
    color: '#7F8C8D',
    fontWeight: '500',
  },
  cardsContainer: {
    flex: 1,
    paddingHorizontal: indianDesign.spacing.xl,
    justifyContent: 'center',
    paddingBottom: indianDesign.spacing.xxxl,
  },
  cardSpacer: {
    height: indianDesign.spacing.lg,
  },
  card: {
    height: 190,
    borderRadius: 20,
    overflow: 'hidden',
    ...createShadow({
      color: '#000',
      offset: { width: 0, height: 8 },
      opacity: 0.12,
      radius: 20,
      elevation: 8,
    }),
  },
  disabledCard: {
    opacity: 0.92,
  },
  cardGradient: {
    flex: 1,
    padding: indianDesign.spacing.xl,
    justifyContent: 'center',
    position: 'relative',
  },
  iconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: indianDesign.spacing.md,
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: healthColors.white,
    marginBottom: 4,
    ...createTextShadow({
      color: 'rgba(0, 0, 0, 0.15)',
      offset: { width: 0, height: 2 },
      radius: 8,
    }),
  },
  cardSubtitle: {
    fontSize: 16,
    color: healthColors.white,
    opacity: 0.98,
    fontWeight: '500',
    ...createTextShadow({
      color: 'rgba(0, 0, 0, 0.1)',
      offset: { width: 0, height: 1 },
      radius: 4,
    }),
  },
  arrowCircle: {
    position: 'absolute',
    bottom: indianDesign.spacing.xl,
    right: indianDesign.spacing.xl,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  comingSoonBadge: {
    position: 'absolute',
    top: indianDesign.spacing.lg,
    right: indianDesign.spacing.lg,
    backgroundColor: healthColors.warning.main,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    ...createShadow({
      color: '#000',
      offset: { width: 0, height: 3 },
      opacity: 0.2,
      radius: 8,
      elevation: 5,
    }),
  },
  comingSoonText: {
    fontSize: 13,
    fontWeight: '700',
    color: healthColors.white,
  },
  decorCircle1: {
    position: 'absolute',
    top: -40,
    right: -40,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  decorCircle2: {
    position: 'absolute',
    bottom: -30,
    left: -30,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: indianDesign.spacing.xl,
  },
  footerSpacer: {
    width: indianDesign.spacing.sm,
  },
  footerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: healthColors.success.main,
  },
  footerText: {
    fontSize: 14,
    color: '#95A5A6',
    fontWeight: '500',
  },
});

export default BoxSelectionScreen;
