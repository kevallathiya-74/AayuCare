import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Image, Text, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withDelay,
  withRepeat,
  Easing,
} from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

const SplashScreen = ({ navigation }) => {
  // Animation values
  const logoOpacity = useSharedValue(0);
  const logoScale = useSharedValue(0.8);
  const taglineOpacity = useSharedValue(0);
  const pulseScale = useSharedValue(1);
  const glowOpacity = useSharedValue(0);

  useEffect(() => {
    // Logo fade-in and scale animation
    logoOpacity.value = withTiming(1, {
      duration: 1000,
      easing: Easing.out(Easing.cubic),
    });

    logoScale.value = withTiming(1, {
      duration: 1000,
      easing: Easing.out(Easing.back(1.2)),
    });

    // Glow effect
    glowOpacity.value = withDelay(
      300,
      withSequence(
        withTiming(0.8, { duration: 800 }),
        withTiming(0.4, { duration: 800 })
      )
    );

    // Tagline fade-in after logo
    taglineOpacity.value = withDelay(
      600,
      withTiming(1, {
        duration: 800,
        easing: Easing.out(Easing.cubic),
      })
    );

    // Pulse effect (one time)
    pulseScale.value = withDelay(
      1000,
      withSequence(
        withTiming(1.15, { duration: 600, easing: Easing.out(Easing.cubic) }),
        withTiming(1, { duration: 600, easing: Easing.out(Easing.cubic) })
      )
    );

    // Navigate to Box Selection after 2.5 seconds
    const timer = setTimeout(() => {
      navigation.replace('BoxSelection');
    }, 2800);

    return () => clearTimeout(timer);
  }, []);

  const logoAnimatedStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value }],
  }));

  const taglineAnimatedStyle = useAnimatedStyle(() => ({
    opacity: taglineOpacity.value,
  }));

  const pulseAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  const glowAnimatedStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  return (
    <View style={styles.container}>
      {/* Animated Gradient Background */}
      <LinearGradient
        colors={['#4DD0E1', '#4FC3F7', '#81D4FA']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <View style={styles.content}>
          {/* Pulse/Ripple Container */}
          <Animated.View style={[styles.pulseContainer, pulseAnimatedStyle]}>
            {/* Glow/Halo Effect */}
            <Animated.View style={[styles.glow, glowAnimatedStyle]} />

            {/* Logo */}
            <Animated.View style={[styles.logoContainer, logoAnimatedStyle]}>
              <Image
                source={require('../../../assets/images/aayucare-logo.png')}
                style={styles.logo}
                resizeMode="contain"
              />
            </Animated.View>
          </Animated.View>

          {/* Tagline */}
          <Animated.Text style={[styles.tagline, taglineAnimatedStyle]}>
            One App. Every Health Need.
          </Animated.Text>
        </View>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pulseContainer: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  glow: {
    position: 'absolute',
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: '#FFFFFF',
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 40,
    elevation: 20,
  },
  logoContainer: {
    width: 180,
    height: 180,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  logo: {
    width: '100%',
    height: '100%',
  },
  tagline: {
    marginTop: 30,
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: 0.5,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
});

export default SplashScreen;
