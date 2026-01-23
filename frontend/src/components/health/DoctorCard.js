/**
 * AayuCare - DoctorCard Component
 * 
 * Doctor profile card with rating and availability
 * Features: favorite toggle, rating stars, book button
 */

import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { healthColors } from '../../theme/healthColors';
import { textStyles } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import Card from '../common/Card';
import Avatar from '../common/Avatar';
import Button from '../common/Button';

const DoctorCard = ({
    doctorId,
    name,
    avatar,
    specialty,
    experience,
    rating = 0,
    reviewCount = 0,
    availability,
    isFavorite = false,
    onPress,
    onBookPress,
    onFavoriteToggle,
    style,
}) => {
    const [favorite, setFavorite] = useState(isFavorite);
    const heartScale = useRef(new Animated.Value(1)).current;

    const handleFavoritePress = () => {
        Animated.sequence([
            Animated.spring(heartScale, {
                toValue: 1.3,
                useNativeDriver: true,
            }),
            Animated.spring(heartScale, {
                toValue: 1,
                useNativeDriver: true,
            }),
        ]).start();
        setFavorite(!favorite);
        if (onFavoriteToggle) onFavoriteToggle(doctorId, !favorite);
    };

    const renderStars = () => {
        const stars = [];
        for (let i = 1; i <= 5; i++) {
            stars.push(
                <Ionicons
                    key={i}
                    name={i <= rating ? 'star' : 'star-outline'}
                    size={14}
                    color={healthColors.warning.main}
                    style={styles.star}
                />
            );
        }
        return stars;
    };

    return (
        <Card onPress={onPress} elevation="medium" style={[styles.card, style]}>
            <View style={styles.header}>
                <Avatar source={avatar} name={name} size="large" />

                <View style={styles.info}>
                    <Text style={styles.name} numberOfLines={1}>
                        {name}
                    </Text>
                    <Text style={styles.specialty} numberOfLines={1}>
                        {specialty}
                    </Text>

                    <View style={styles.ratingContainer}>
                        <View style={styles.stars}>{renderStars()}</View>
                        <Text style={styles.ratingText}>
                            {rating.toFixed(1)} ({reviewCount})
                        </Text>
                    </View>
                </View>

                <TouchableOpacity
                    onPress={handleFavoritePress}
                    style={styles.favoriteButton}
                >
                    <Animated.View style={{ transform: [{ scale: heartScale }] }}>
                        <Ionicons
                            name={favorite ? 'heart' : 'heart-outline'}
                            size={24}
                            color={favorite ? healthColors.accent.pink : healthColors.text.tertiary}
                        />
                    </Animated.View>
                </TouchableOpacity>
            </View>

            <View style={styles.footer}>
                <View style={styles.experienceContainer}>
                    <Ionicons
                        name="briefcase-outline"
                        size={16}
                        color={healthColors.text.secondary}
                    />
                    <Text style={styles.experienceText}>{experience} years exp.</Text>
                </View>

                {availability && (
                    <View style={styles.availabilityContainer}>
                        <View
                            style={[
                                styles.availabilityDot,
                                { backgroundColor: healthColors.success.main },
                            ]}
                        />
                        <Text style={styles.availabilityText}>{availability}</Text>
                    </View>
                )}
            </View>

            {onBookPress && (
                <Button
                    onPress={onBookPress}
                    variant="primary"
                    size="medium"
                    fullWidth
                    style={styles.bookButton}
                >
                    Book Appointment
                </Button>
            )}
        </Card>
    );
};

const styles = StyleSheet.create({
    card: {
        marginBottom: spacing.md,
    },
    header: {
        flexDirection: 'row',
        marginBottom: spacing.md,
    },
    info: {
        flex: 1,
        marginLeft: spacing.md,
        justifyContent: 'center',
    },
    name: {
        ...textStyles.h4,
        color: healthColors.text.primary,
        marginBottom: 2,
    },
    specialty: {
        ...textStyles.bodyMedium,
        color: healthColors.text.secondary,
        marginBottom: spacing.xs,
    },
    ratingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    stars: {
        flexDirection: 'row',
        marginRight: spacing.xs,
    },
    star: {
        marginRight: 2,
    },
    ratingText: {
        ...textStyles.bodySmall,
        color: healthColors.text.secondary,
    },
    favoriteButton: {
        padding: spacing.xs,
    },
    footer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: spacing.md,
    },
    experienceContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    experienceText: {
        ...textStyles.bodySmall,
        color: healthColors.text.secondary,
        marginLeft: spacing.xs,
    },
    availabilityContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    availabilityDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: spacing.xs,
    },
    availabilityText: {
        ...textStyles.bodySmall,
        color: healthColors.success.main,
        fontWeight: '600',
    },
    bookButton: {
        marginTop: spacing.sm,
    },
});

export default DoctorCard;

