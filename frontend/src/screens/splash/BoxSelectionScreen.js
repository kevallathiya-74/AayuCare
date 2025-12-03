import React, { useEffect } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Dimensions, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { createShadow } from '../../utils/platformStyles';

const { width, height } = Dimensions.get('window');

const BoxSelectionScreen = ({ navigation }) => {
  const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);
  
  // Entrance animations
  const headerOpacity = useSharedValue(0);
  const headerTranslateY = useSharedValue(-20);
  const box1Opacity = useSharedValue(0);
  const box1TranslateX = useSharedValue(-50);
  const box2Opacity = useSharedValue(0);
  const box2TranslateX = useSharedValue(50);
  const footerOpacity = useSharedValue(0);

  useEffect(() => {
    // Stagger entrance animations
    headerOpacity.value = withTiming(1, { duration: 600, easing: Easing.out(Easing.cubic) });
    headerTranslateY.value = withTiming(0, { duration: 600, easing: Easing.out(Easing.cubic) });

    box1Opacity.value = withDelay(200, withTiming(1, { duration: 600 }));
    box1TranslateX.value = withDelay(200, withSpring(0, { damping: 20, stiffness: 100 }));

    box2Opacity.value = withDelay(400, withTiming(1, { duration: 600 }));
    box2TranslateX.value = withDelay(400, withSpring(0, { damping: 20, stiffness: 100 }));

    footerOpacity.value = withDelay(600, withTiming(1, { duration: 600 }));
  }, []);

  const headerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
    transform: [{ translateY: headerTranslateY.value }],
  }));

  const box1AnimatedStyle = useAnimatedStyle(() => ({
    opacity: box1Opacity.value,
    transform: [{ translateX: box1TranslateX.value }],
  }));

  const box2AnimatedStyle = useAnimatedStyle(() => ({
    opacity: box2Opacity.value,
    transform: [{ translateX: box2TranslateX.value }],
  }));

  const footerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: footerOpacity.value,
  }));

  const handleSelection = (userType) => {
    console.log('User selected:', userType);
    
    // Navigate to appropriate login screen
    if (userType === 'hospital') {
      navigation.navigate('HospitalLogin');
    } else {
      navigation.navigate('UserLogin');
    }
  };

  return (
    <LinearGradient
      colors={['#E3F2FD', '#FFFFFF', '#F5F5F5']}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={styles.container}
    >
      {/* Logo/Brand Section */}
      <Animated.View style={[styles.logoSection, headerAnimatedStyle]}>
        <View style={styles.logoCircle}>
          <Feather name="heart" size={36} color="#4A90E2" />
        </View>
      </Animated.View>

      {/* Header */}
      <Animated.View style={[styles.header, headerAnimatedStyle]}>
        <Text style={styles.title}>Welcome to AayuCare</Text>
        <Text style={styles.subtitle}>Choose how you'd like to continue</Text>
      </Animated.View>

      {/* Selection Boxes */}
      <View style={styles.boxContainer}>
        <Animated.View style={box1AnimatedStyle}>
          <SelectionBox
            title="Hospital"
            subtitle="Healthcare providers & facilities"
            icon="hospital-building"
            iconType="MaterialCommunityIcons"
            gradientColors={['#66BB6A', '#43A047']}
            onPress={() => handleSelection('hospital')}
          />
        </Animated.View>

        <Animated.View style={box2AnimatedStyle}>
          <SelectionBox
            title="User"
            subtitle="Patients & health seekers"
            icon="user"
            iconType="Feather"
            gradientColors={['#4FC3F7', '#29B6F6']}
            onPress={() => handleSelection('user')}
          />
        </Animated.View>
      </View>

      {/* Footer */}
      <Animated.View style={[styles.footer, footerAnimatedStyle]}>
        <Feather name="shield" size={16} color="#78909C" />
        <Text style={styles.footerText}>Secure • Private • Trusted</Text>
      </Animated.View>
    </LinearGradient>
  );
};

const SelectionBox = ({ title, subtitle, icon, iconType, gradientColors, onPress }) => {
  const scale = useSharedValue(1);
  const shadowOpacity = useSharedValue(0.15);

  const animatedStyle = useAnimatedStyle(() => {
    if (Platform.OS === 'web') {
      return {
        transform: [{ scale: scale.value }],
        boxShadow: `0px 8px 16px rgba(0, 0, 0, ${shadowOpacity.value})`,
      };
    }
    return {
      transform: [{ scale: scale.value }],
      shadowOpacity: shadowOpacity.value,
    };
  });

  const handlePressIn = () => {
    scale.value = withSpring(0.95, {
      damping: 15,
      stiffness: 300,
    });
    shadowOpacity.value = withTiming(0.25, { duration: 150 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, {
      damping: 15,
      stiffness: 300,
    });
    shadowOpacity.value = withTiming(0.15, { duration: 150 });
  };

  const IconComponent = iconType === 'MaterialCommunityIcons' ? MaterialCommunityIcons : Feather;

  return (
    <Animated.View style={[styles.boxWrapper, animatedStyle]}>
      <TouchableOpacity
        activeOpacity={0.9}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={onPress}
        style={styles.touchable}
      >
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.box}
        >
          {/* Icon Container */}
          <View style={styles.iconContainer}>
            <View style={styles.iconCircle}>
              <IconComponent name={icon} size={40} color="#FFFFFF" />
            </View>
          </View>

          {/* Text Content */}
          <View style={styles.textContent}>
            <Text style={styles.boxTitle}>{title}</Text>
            <Text style={styles.boxSubtitle}>{subtitle}</Text>
          </View>

          {/* Arrow Indicator */}
          <View style={styles.arrowContainer}>
            <Feather name="chevron-right" size={28} color="rgba(255,255,255,0.9)" />
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  logoSection: {
    marginTop: height * 0.08,
    alignItems: 'center',
    marginBottom: 20,
  },
  logoCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(74, 144, 226, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(74, 144, 226, 0.2)',
  },
  header: {
    marginBottom: 40,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1A237E',
    marginBottom: 8,
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '400',
    color: '#546E7A',
    letterSpacing: 0.2,
    textAlign: 'center',
  },
  boxContainer: {
    flex: 1,
    justifyContent: 'center',
    gap: 24,
    paddingBottom: 60,
  },
  boxWrapper: {
    ...createShadow({
      color: '#000',
      offset: { width: 0, height: 8 },
      opacity: 0.15,
      radius: 16,
      elevation: 8,
    }),
    borderRadius: 20,
  },
  touchable: {
    borderRadius: 20,
  },
  box: {
    height: 160,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  iconContainer: {
    marginRight: 20,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  textContent: {
    flex: 1,
  },
  boxTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  boxSubtitle: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.95)',
    letterSpacing: 0.3,
  },
  arrowContainer: {
    marginLeft: 12,
  },
  footer: {
    paddingBottom: 40,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  footerText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#78909C',
    letterSpacing: 0.3,
  },
});

export default BoxSelectionScreen;
