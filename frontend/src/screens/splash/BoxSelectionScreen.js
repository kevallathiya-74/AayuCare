import React from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

const BoxSelectionScreen = ({ navigation }) => {
  const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

  const handleSelection = (userType) => {
    // Store user type selection (you can use AsyncStorage or Redux here)
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
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Welcome to AayuCare</Text>
        <Text style={styles.subtitle}>Choose how you'd like to continue</Text>
      </View>

      {/* Selection Boxes */}
      <View style={styles.boxContainer}>
        <SelectionBox
          title="Hospital"
          subtitle="Healthcare providers & facilities"
          icon="hospital-building"
          iconType="MaterialCommunityIcons"
          gradientColors={['#66BB6A', '#43A047']}
          onPress={() => handleSelection('hospital')}
        />

        <SelectionBox
          title="User"
          subtitle="Patients & health seekers"
          icon="user"
          iconType="Feather"
          gradientColors={['#4FC3F7', '#29B6F6']}
          onPress={() => handleSelection('user')}
        />
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>Your health, simplified</Text>
      </View>
    </LinearGradient>
  );
};

const SelectionBox = ({ title, subtitle, icon, iconType, gradientColors, onPress }) => {
  const scale = useSharedValue(1);
  const shadowOpacity = useSharedValue(0.15);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    shadowOpacity: shadowOpacity.value,
  }));

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
  header: {
    marginTop: height * 0.12,
    marginBottom: 40,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1A237E',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '400',
    color: '#546E7A',
    letterSpacing: 0.2,
  },
  boxContainer: {
    flex: 1,
    justifyContent: 'center',
    gap: 24,
    paddingBottom: 60,
  },
  boxWrapper: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
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
  },
  footerText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#78909C',
    letterSpacing: 0.3,
  },
});

export default BoxSelectionScreen;
