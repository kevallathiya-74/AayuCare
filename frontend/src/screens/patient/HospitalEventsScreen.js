/**
 * Hospital Events & Camps Screen
 * Blood donation, diabetes screening, vaccination, health workshops
 */

import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { healthColors } from "../../theme/healthColors";
import { indianDesign, createShadow } from "../../theme/indianDesign";
import {
  getScreenPadding,
  scaledFontSize,
  moderateScale,
  verticalScale,
} from "../../utils/responsive";
import NetworkStatusIndicator from "../../components/common/NetworkStatusIndicator";
import ErrorRecovery from "../../components/common/ErrorRecovery";
import { showError, logError } from "../../utils/errorHandler";
import { useNetworkStatus } from "../../utils/offlineHandler";
import { eventService } from "../../services";

const HospitalEventsScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const { isConnected } = useNetworkStatus();
  const [events, setEvents] = useState([]);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      if (!isConnected) {
        showError("No internet connection");
        return;
      }

      setLoading(true);
      setError(null);

      const response = await eventService.getUpcomingEvents({ limit: 20 });
      setEvents(response.data || []);
    } catch (err) {
      const errorMessage = "Failed to load events";
      setError(errorMessage);
      logError(err, { context: "HospitalEventsScreen.fetchEvents" });
      showError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchEvents();
    setRefreshing(false);
  }, []);

  const handleRegister = async (event) => {
    try {
      if (!isConnected) {
        showError("No internet connection. Please check your network.");
        return;
      }

      setLoading(true);
      setError(null);

      await eventService.registerForEvent(event._id);

      alert(`Successfully registered for "${event.title}"!`);
      // Refresh events list to show updated registration count
      await fetchEvents();
    } catch (err) {
      logError(err, {
        context: "HospitalEventsScreen.handleRegister",
        eventId: event._id,
      });
      const errorMsg =
        err.response?.data?.message || "Failed to register for event";
      setError(errorMsg);
      showError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    setError(null);
    fetchEvents();
  };

  if (error) {
    return (
      <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
        <NetworkStatusIndicator />
        <ErrorRecovery
          error={error}
          onRetry={handleRetry}
          onDismiss={() => setError(null)}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <NetworkStatusIndicator />
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={healthColors.primary.main} />
        </View>
      )}
      {/* Header */}
      <LinearGradient
        colors={["#FF6F00", "#E65100"]}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Ionicons name="business-outline" size={32} color="#FFF" />
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>Hospital Events</Text>
            <Text style={styles.headerSubtitle}>Health camps & workshops</Text>
          </View>
        </View>
        <TouchableOpacity onPress={() => {}}>
          <Ionicons name="notifications" size={24} color="#FFF" />
        </TouchableOpacity>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: Math.max(insets.bottom, 20) },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[healthColors.primary.main]}
            tintColor={healthColors.primary.main}
          />
        }
      >
        {/* Notification Banner */}
        <View style={styles.notificationBanner}>
          <View style={styles.notificationContent}>
            <Ionicons name="notifications-circle" size={24} color="#FF9800" />
            <View style={styles.notificationText}>
              <Text style={styles.notificationTitle}>Enable Notifications</Text>
              <Text style={styles.notificationSubtitle}>
                Get alerts for new events and reminders
              </Text>
            </View>
          </View>
          <TouchableOpacity style={styles.enableButton}>
            <Text style={styles.enableButtonText}>Enable</Text>
          </TouchableOpacity>
        </View>

        {/* Upcoming Events */}
        <View style={styles.sectionTitleContainer}>
          <Ionicons
            name="calendar-outline"
            size={20}
            color={healthColors.primary.main}
          />
          <Text style={styles.sectionTitle}>
            UPCOMING EVENTS ({events.length})
          </Text>
        </View>

        {loading && !refreshing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={healthColors.primary.main} />
            <Text style={styles.loadingText}>Loading events...</Text>
          </View>
        ) : events.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons
              name="calendar-outline"
              size={64}
              color={healthColors.text.disabled}
            />
            <Text style={styles.emptyStateTitle}>No Upcoming Events</Text>
            <Text style={styles.emptyStateText}>
              Check back later for new health camps and workshops.
            </Text>
          </View>
        ) : (
          events.map((event, index) => {
            const eventDate = new Date(event.date);
            const formattedDate = eventDate.toLocaleDateString("en-US", {
              day: "numeric",
              month: "short",
              year: "numeric",
            });
            const spotsRemaining =
              event.spotsRemaining ||
              event.availableSpots - event.registeredCount;

            return (
              <View key={event._id} style={styles.eventCard}>
                {/* Event Header */}
                <View style={styles.eventHeader}>
                  <View
                    style={[
                      styles.eventIconContainer,
                      { backgroundColor: event.color + "20" },
                    ]}
                  >
                    <Ionicons name={event.icon} size={28} color={event.color} />
                  </View>
                  <View style={styles.eventHeaderText}>
                    <Text style={styles.eventTitle}>{event.title}</Text>
                    <View style={styles.eventDateRow}>
                      <Ionicons
                        name="calendar"
                        size={14}
                        color={healthColors.text.tertiary}
                      />
                      <Text style={styles.eventDate}>{formattedDate}</Text>
                    </View>
                  </View>
                </View>

                {/* Event Details */}
                <View style={styles.eventDetails}>
                  <View style={styles.eventDetailRow}>
                    <Ionicons name="time" size={16} color={event.color} />
                    <Text style={styles.eventDetailText}>
                      {event.startTime} - {event.endTime}
                    </Text>
                  </View>
                  <View style={styles.eventDetailRow}>
                    <Ionicons name="location" size={16} color={event.color} />
                    <Text style={styles.eventDetailText}>{event.venue}</Text>
                  </View>
                </View>

                {/* Event Description */}
                <Text style={styles.eventDescription}>{event.description}</Text>

                {/* Spots Available */}
                <View style={styles.spotsContainer}>
                  <View style={styles.spotsInfo}>
                    <Ionicons name="people" size={18} color={event.color} />
                    <Text style={styles.spotsText}>
                      {spotsRemaining > 0
                        ? `${spotsRemaining} spots available`
                        : "Event full"}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.registerButton}
                    onPress={() => handleRegister(event)}
                    disabled={spotsRemaining === 0 || loading}
                  >
                    <LinearGradient
                      colors={[event.color, event.color + "DD"]}
                      style={styles.registerGradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                    >
                      <Text style={styles.registerButtonText}>
                        Register Now
                      </Text>
                      <Ionicons name="arrow-forward" size={16} color="#FFF" />
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}

        {/* Past Events */}
        <View style={styles.pastEventsSection}>
          <View style={styles.sectionTitleContainer}>
            <Ionicons
              name="book-outline"
              size={20}
              color={healthColors.primary.main}
            />
            <Text style={styles.sectionTitle}>PAST EVENTS</Text>
          </View>
          <TouchableOpacity style={styles.viewPastButton}>
            <Text style={styles.viewPastText}>View All Past Events</Text>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={healthColors.text.tertiary}
            />
          </TouchableOpacity>
        </View>

        {/* Feedback Section */}
        <View style={styles.feedbackCard}>
          <View style={styles.feedbackTitleContainer}>
            <Ionicons
              name="chatbubble-ellipses-outline"
              size={20}
              color={healthColors.primary.main}
            />
            <Text style={styles.feedbackTitle}>Share Your Feedback</Text>
          </View>
          <Text style={styles.feedbackText}>
            Help us improve by sharing your experience at our events
          </Text>
          <TouchableOpacity style={styles.feedbackButton}>
            <LinearGradient
              colors={["#7E57C2", "#5E35B1"]}
              style={styles.feedbackGradient}
            >
              <Ionicons name="chatbubbles" size={20} color="#FFF" />
              <Text style={styles.feedbackButtonText}>Submit Feedback</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: healthColors.background.primary,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: getScreenPadding(),
    paddingTop: verticalScale(20),
    paddingBottom: verticalScale(30),
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: indianDesign.spacing.md,
    flex: 1,
    marginLeft: indianDesign.spacing.md,
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: scaledFontSize(20),
    fontWeight: indianDesign.fontWeight.bold,
    color: "#FFF",
  },
  headerSubtitle: {
    fontSize: scaledFontSize(13),
    color: "rgba(255, 255, 255, 0.9)",
  },
  content: {
    padding: getScreenPadding(),
  },
  notificationBanner: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: indianDesign.spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: indianDesign.spacing.xl,
    borderWidth: 2,
    borderColor: healthColors.border.light,
  },
  notificationContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: indianDesign.spacing.md,
    flex: 1,
  },
  notificationText: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: scaledFontSize(14),
    fontWeight: indianDesign.fontWeight.semibold,
    color: healthColors.text.primary,
    marginBottom: 2,
  },
  notificationSubtitle: {
    fontSize: scaledFontSize(12),
    color: healthColors.text.secondary,
  },
  enableButton: {
    backgroundColor: healthColors.warning.main,
    paddingHorizontal: indianDesign.spacing.md,
    paddingVertical: indianDesign.spacing.xs,
    borderRadius: indianDesign.borderRadius.small,
  },
  enableButtonText: {
    fontSize: scaledFontSize(12),
    fontWeight: indianDesign.fontWeight.semibold,
    color: "#FFF",
  },
  sectionTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(8),
    marginBottom: indianDesign.spacing.md,
  },
  sectionTitle: {
    fontSize: scaledFontSize(16),
    fontWeight: indianDesign.fontWeight.bold,
    color: healthColors.text.primary,
  },
  eventCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: indianDesign.spacing.lg,
    marginBottom: indianDesign.spacing.lg,
    borderWidth: 2,
    borderColor: healthColors.border.light,
  },
  eventHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: indianDesign.spacing.md,
  },
  eventIconContainer: {
    width: moderateScale(56),
    height: moderateScale(56),
    borderRadius: moderateScale(28),
    justifyContent: "center",
    alignItems: "center",
    marginRight: indianDesign.spacing.md,
  },
  eventHeaderText: {
    flex: 1,
  },
  eventTitle: {
    fontSize: scaledFontSize(16),
    fontWeight: indianDesign.fontWeight.bold,
    color: healthColors.text.primary,
    marginBottom: 4,
  },
  eventDateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: indianDesign.spacing.xs,
  },
  eventDate: {
    fontSize: scaledFontSize(13),
    color: healthColors.text.tertiary,
  },
  eventDetails: {
    marginBottom: indianDesign.spacing.md,
  },
  eventDetailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: indianDesign.spacing.sm,
    marginBottom: indianDesign.spacing.xs,
  },
  eventDetailText: {
    fontSize: scaledFontSize(13),
    color: healthColors.text.secondary,
  },
  eventDescription: {
    fontSize: scaledFontSize(13),
    color: healthColors.text.secondary,
    lineHeight: 20,
    marginBottom: indianDesign.spacing.md,
  },
  spotsContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: indianDesign.spacing.md,
    borderTopWidth: 1,
    borderTopColor: healthColors.border.light,
  },
  spotsInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: indianDesign.spacing.xs,
  },
  spotsText: {
    fontSize: scaledFontSize(13),
    fontWeight: indianDesign.fontWeight.medium,
    color: healthColors.text.secondary,
  },
  registerButton: {
    borderRadius: indianDesign.borderRadius.small,
    overflow: "hidden",
  },
  registerGradient: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: indianDesign.spacing.md,
    paddingVertical: indianDesign.spacing.sm,
    gap: indianDesign.spacing.xs,
  },
  registerButtonText: {
    fontSize: scaledFontSize(13),
    fontWeight: indianDesign.fontWeight.semibold,
    color: "#FFF",
  },
  pastEventsSection: {
    marginTop: indianDesign.spacing.xl,
    marginBottom: indianDesign.spacing.lg,
  },
  viewPastButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: indianDesign.spacing.md,
    borderWidth: 2,
    borderColor: healthColors.border.light,
  },
  viewPastText: {
    fontSize: scaledFontSize(14),
    fontWeight: indianDesign.fontWeight.medium,
    color: healthColors.text.primary,
    marginRight: indianDesign.spacing.xs,
  },
  feedbackCard: {
    backgroundColor: healthColors.primary.light,
    borderRadius: 16,
    padding: indianDesign.spacing.lg,
    marginTop: indianDesign.spacing.lg,
    alignItems: "center",
  },
  feedbackTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(8),
    marginBottom: indianDesign.spacing.xs,
  },
  feedbackTitle: {
    fontSize: scaledFontSize(16),
    fontWeight: indianDesign.fontWeight.bold,
    color: healthColors.text.primary,
  },
  feedbackText: {
    fontSize: scaledFontSize(13),
    color: healthColors.text.secondary,
    textAlign: "center",
    marginBottom: indianDesign.spacing.md,
  },
  feedbackButton: {
    borderRadius: indianDesign.borderRadius.medium,
    overflow: "hidden",
  },
  feedbackGradient: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: indianDesign.spacing.lg,
    paddingVertical: indianDesign.spacing.sm,
    gap: indianDesign.spacing.sm,
  },
  feedbackButtonText: {
    fontSize: scaledFontSize(14),
    fontWeight: indianDesign.fontWeight.semibold,
    color: "#FFF",
  },
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  loadingContainer: {
    paddingVertical: moderateScale(48),
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    fontSize: scaledFontSize(14),
    color: healthColors.text.secondary,
    marginTop: moderateScale(12),
  },
  emptyState: {
    paddingVertical: moderateScale(48),
    alignItems: "center",
    justifyContent: "center",
  },
  emptyStateTitle: {
    fontSize: scaledFontSize(18),
    fontWeight: "600",
    color: healthColors.text.primary,
    marginTop: moderateScale(16),
    marginBottom: moderateScale(8),
  },
  emptyStateText: {
    fontSize: scaledFontSize(14),
    color: healthColors.text.secondary,
    textAlign: "center",
    paddingHorizontal: getScreenPadding(),
  },
});

export default HospitalEventsScreen;
