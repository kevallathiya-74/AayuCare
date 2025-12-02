/**
 * AayuCare - Avatar Component
 * 
 * Variants: image, initials, icon
 * Sizes: small, medium, large, xlarge
 */

import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import colors from '../../theme/colors';
import { textStyles } from '../../theme/typography';
import { layout } from '../../theme/spacing';

const Avatar = ({
  source,
  name,
  icon,
  size = 'medium', // small, medium, large, xlarge
  variant = 'image', // image, initials, icon
  backgroundColor,
  textColor,
  online = false,
  style,
}) => {
  const getSize = () => {
    return layout.avatar[size] || layout.avatar.medium;
  };

  const getFontSize = () => {
    const sizeValue = getSize();
    return Math.floor(sizeValue * 0.4);
  };

  const getInitials = () => {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };

  const avatarSize = getSize();
  const fontSize = getFontSize();
  const defaultBgColor = backgroundColor || colors.primary.main;
  const defaultTextColor = textColor || colors.neutral.white;

  const renderContent = () => {
    if (variant === 'image' && source) {
      return (
        <Image
          source={source}
          style={[styles.image, { width: avatarSize, height: avatarSize }]}
        />
      );
    }

    if (variant === 'icon' || icon) {
      return (
        <Feather
          name={icon || 'user'}
          size={fontSize}
          color={defaultTextColor}
        />
      );
    }

    // Default to initials
    return (
      <Text style={[styles.initials, { fontSize, color: defaultTextColor }]}>
        {getInitials()}
      </Text>
    );
  };

  return (
    <View style={[styles.container, style]}>
      <View
        style={[
          styles.avatar,
          {
            width: avatarSize,
            height: avatarSize,
            borderRadius: avatarSize / 2,
            backgroundColor: variant === 'image' ? 'transparent' : defaultBgColor,
          },
        ]}
      >
        {renderContent()}
      </View>
      {online && (
        <View
          style={[
            styles.onlineIndicator,
            {
              width: avatarSize * 0.25,
              height: avatarSize * 0.25,
              borderRadius: avatarSize * 0.125,
              borderWidth: avatarSize * 0.04,
            },
          ]}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  avatar: {
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  image: {
    resizeMode: 'cover',
  },
  initials: {
    ...textStyles.bodyMediumBold,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: colors.success.main,
    borderColor: colors.background.primary,
  },
});

export default Avatar;
