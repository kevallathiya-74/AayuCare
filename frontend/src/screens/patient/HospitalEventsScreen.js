/**
 * Hospital Events & Camps Screen
 * Blood donation, diabetes screening, vaccination, health workshops
 * Redesigned to match app UI/UX with end-to-end data connectivity
 */

import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  StatusBar,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { theme, healthColors } from "../../theme";
import {
  verticalScale,
} from "../../utils/responsive";
import { showError, logError } from "../../utils/errorHandler";
import { eventService } from "../../services";

const HospitalEventsScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [events, setEvents] = useState([]);
  const [filter, setFilter] = useState("all");
  const insets = useSafeAreaInsets();

  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await eventService.getUpcomingEvents({ limit: 50 });
      console.log("[HospitalEvents] Response:", response);

      const eventData = response?.data || response || [];
      const eventsArray = Array.isArray(eventData) ? eventData : [];

      console.log("[HospitalEvents] Events count:", eventsArray.length);
      setEvents(eventsArray);
    } catch (err) {
      const errorMessage =
        err.response?.data?.message || "Failed to load events";
      setError(errorMessage);
      logError(err, { context: "HospitalEventsScreen.fetchEvents" });
      showError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchEvents();
    setRefreshing(false);
  }, [fetchEvents]);

  const handleRegister = useCallback(
    async (event) => {
      const spotsRemaining =
        event.availableSpots - (event.registeredCount || 0);

      if (spotsRemaining <= 0) {
        Alert.alert("Event Full", "Sorry, this event is fully booked.");
        return;
      }

      Alert.alert(
        "Register for Event",
        `Do you want to register for "${event.title}"?\n\nSpots remaining: ${spotsRemaining}`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Register",
            onPress: async () => {
              try {
                setLoading(true);
                await eventService.registerForEvent(event._id);
                Alert.alert(
                  "Success",
                  `Successfully registered for "${event.title}"!`
                );
                await fetchEvents();
              } catch (err) {
                const errorMsg =
                  err.response?.data?.message || "Failed to register for event";
                logError(err, {
                  context: "HospitalEventsScreen.handleRegister",
                  eventId: event._id,
                });
                Alert.alert("Error", errorMsg);
              } finally {
                setLoading(false);
              }
            },
          },
        ]
      );
    },
    [fetchEvents]
  );

  const getEventIcon = (type) => {
    const icons = {
      "blood-donation": "water",
      screening: "fitness",
      vaccination: "medical",
      workshop: "school",
      camp: "business",
      "health-checkup": "heart",
    };
    return icons[type] || "calendar";
  };

  const getEventColor = (type) => {
    const colors = {
      "blood-donation": healthColors.error.main,
      screening: healthColors.info.main,
      vaccination: healthColors.success.main,
      workshop: healthColors.warning.main,
      camp: healthColors.primary.main,
      "health-checkup": healthColors.accent.coral,
    };
    return colors[type] || healthColors.primary.main;
  };

  const getStatusColor = (status) => {
    const colors = {
      upcoming: healthColors.info.main,
      ongoing: healthColors.success.main,
      completed: healthColors.text.disabled,
      cancelled: healthColors.error.main,
    };
    return colors[status] || healthColors.primary.main;
  };

  const filteredEvents = events.filter((event) => {
    if (filter === "all") return true;
    return event.status === filter;
  });

  const renderEventCard = ({ item: event }) => {
    const eventDate = new Date(event.date);
    const formattedDate = eventDate.toLocaleDateString("en-US", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
    const spotsRemaining = event.availableSpots - (event.registeredCount || 0);
    const eventColor = getEventColor(event.type);
    const statusColor = getStatusColor(event.status);

    return (
      <View style={styles.eventCard}>
        {/* Status Badge */}
        <View
          style={[styles.statusBadge, { backgroundColor: statusColor + "20" }]}
        >
          <Text style={[styles.statusText, { color: statusColor }]}>
            {event.status?.toUpperCase() || "UPCOMING"}
          </Text>
        </View>

        {/* Event Header */}
        <View style={styles.eventHeader}>
          <View
            style={[
              styles.eventIconContainer,
              { backgroundColor: eventColor + "20" },
            ]}
          >
            <Ionicons
              name={getEventIcon(event.type)}
              size={32}
              color={eventColor}
            />
          </View>
          <View style={styles.eventHeaderText}>
            <Text style={styles.eventTitle}>{event.title}</Text>
            <View style={styles.eventMetaRow}>
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
            <Ionicons name="time-outline" size={18} color={eventColor} />
            <Text style={styles.eventDetailText}>
              {event.startTime} - {event.endTime}
            </Text>
          </View>
          <View style={styles.eventDetailRow}>
            <Ionicons name="location-outline" size={18} color={eventColor} />
            <Text style={styles.eventDetailText}>{event.venue}</Text>
          </View>
          <View style={styles.eventDetailRow}>
            <Ionicons name="people-outline" size={18} color={eventColor} />
            <Text style={styles.eventDetailText}>
              {spotsRemaining > 0
                ? `${spotsRemaining} spots available`
                : "Event full"}
            </Text>
          </View>
        </View>

        {/* Event Description */}
        {event.description && (
          <Text style={styles.eventDescription} numberOfLines={2}>
            {event.description}
          </Text>
        )}

        {/* Action Buttons */}
        <View style={styles.eventActions}>
          <TouchableOpacity
            style={styles.detailsButton}
            onPress={() =>
              Alert.alert(
                "Event Details",
                `Full details for "${event.title}" coming soon!`
              )
            }
          >
            <Ionicons
              name="information-circle-outline"
              size={20}
              color={healthColors.primary.main}
            />
            <Text style={styles.detailsButtonText}>Details</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.registerButton,
              spotsRemaining <= 0 && styles.registerButtonDisabled,
            ]}
            onPress={() => handleRegister(event)}
            disabled={loading || spotsRemaining <= 0}
          >
            <LinearGradient
              colors={
                spotsRemaining > 0
                  ? [eventColor, eventColor + "DD"]
                  : [healthColors.text.disabled, healthColors.text.disabled]
              }
              style={styles.registerGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.registerButtonText}>
                {spotsRemaining > 0 ? "Register" : "Full"}
              </Text>
              {spotsRemaining > 0 && (
                <Ionicons name="arrow-forward" size={16} color={theme.colors.white} />
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderHeader = () => (
    <View>
      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        {["all", "upcoming", "ongoing"].map((filterOption) => (
          <TouchableOpacity
            key={filterOption}
            style={[
              styles.filterTab,
              filter === filterOption && styles.filterTabActive,
            ]}
            onPress={() => setFilter(filterOption)}
          >
            <Text
              style={[
                styles.filterTabText,
                filter === filterOption && styles.filterTabTextActive,
              ]}
            >
              {filterOption.charAt(0).toUpperCase() + filterOption.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Event Count */}
      <View style={styles.countContainer}>
        <Text style={styles.countText}>{filteredEvents.length} Events</Text>
      </View>
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyState}>
      <Ionicons
        name="calendar-outline"
        size={80}
        color={healthColors.text.disabled}
      />
      <Text style={styles.emptyTitle}>No Events Found</Text>
      <Text style={styles.emptyText}>
        {filter === "all"
          ? "No events available at the moment."
          : `No ${filter} events at the moment.`}
      </Text>
      {filter !== "all" && (
        <TouchableOpacity
          style={styles.resetFilterButton}
          onPress={() => setFilter("all")}
        >
          <Text style={styles.resetFilterText}>Show All Events</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={healthColors.background.primary}
      />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Ionicons
            name="arrow-back"
            size={24}
            color={healthColors.text.primary}
          />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Hospital Events</Text>
          <Text style={styles.headerSubtitle}>Health camps & workshops</Text>
        </View>
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={onRefresh}
          disabled={refreshing}
          activeOpacity={0.7}
        >
          {refreshing ? (
            <ActivityIndicator size="small" color={healthColors.primary.main} />
          ) : (
            <Ionicons
              name="refresh"
              size={24}
              color={healthColors.primary.main}
            />
          )}
        </TouchableOpacity>
      </View>

      {/* Events List */}
      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={healthColors.primary.main} />
          <Text style={styles.loadingText}>Loading events...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Ionicons
            name="alert-circle-outline"
            size={64}
            color={healthColors.error.main}
          />
          <Text style={styles.errorTitle}>Failed to Load Events</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchEvents}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredEvents}
          renderItem={renderEventCard}
          keyExtractor={(item) => item._id}
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={renderEmpty}
          contentContainerStyle={[
            styles.listContent,
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
          showsVerticalScrollIndicator={false}
        />
      )}
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
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    backgroundColor: healthColors.background.card,
    ...theme.shadows.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: healthColors.background.tertiary,
    justifyContent: "center",
    alignItems: "center",
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: theme.typography.sizes.xl,
    fontWeight: theme.typography.weights.bold,
    color: healthColors.text.primary,
  },
  headerSubtitle: {
    fontSize: theme.typography.sizes.xs,
    color: healthColors.text.secondary,
    marginTop: 2,
  },
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: healthColors.primary.main + "15",
    justifyContent: "center",
    alignItems: "center",
  },
  filterContainer: {
    flexDirection: "row",
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  filterTab: {
    flex: 1,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.small,
    backgroundColor: healthColors.background.card,
    alignItems: "center",
    borderWidth: 1,
    borderColor: healthColors.border.light,
  },
  filterTabActive: {
    backgroundColor: healthColors.primary.main,
    borderColor: healthColors.primary.main,
  },
  filterTabText: {
    fontSize: 13,
    fontWeight: theme.typography.weights.medium,
    color: healthColors.text.secondary,
  },
  filterTabTextActive: {
    color: theme.colors.white,
    fontWeight: theme.typography.weights.bold,
  },
  countContainer: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
  countText: {
    fontSize: 14,
    fontWeight: theme.typography.weights.semibold,
    color: healthColors.text.secondary,
  },
  listContent: {
    paddingHorizontal: theme.spacing.lg,
  },
  eventCard: {
    backgroundColor: healthColors.background.card,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    ...theme.shadows.md,
    borderWidth: 1,
    borderColor: healthColors.border.light,
  },
  statusBadge: {
    position: "absolute",
    top: theme.spacing.md,
    right: theme.spacing.md,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.small,
  },
  statusText: {
    fontSize: 10,
    fontWeight: theme.typography.weights.bold,
    letterSpacing: 0.5,
  },
  eventHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: theme.spacing.md,
  },
  eventIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    marginRight: theme.spacing.md,
  },
  eventHeaderText: {
    flex: 1,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: theme.typography.weights.bold,
    color: healthColors.text.primary,
    marginBottom: 6,
  },
  eventMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  eventDate: {
    fontSize: 13,
    color: healthColors.text.tertiary,
  },
  eventDetails: {
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.md,
  },
  eventDetailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
  },
  eventDetailText: {
    fontSize: 13,
    color: healthColors.text.secondary,
    flex: 1,
  },
  eventDescription: {
    fontSize: 13,
    color: healthColors.text.secondary,
    lineHeight: 20,
    marginBottom: theme.spacing.md,
  },
  eventActions: {
    flexDirection: "row",
    gap: theme.spacing.sm,
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: healthColors.border.light,
  },
  detailsButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.small,
    backgroundColor: healthColors.primary.main + "15",
  },
  detailsButtonText: {
    fontSize: 14,
    fontWeight: theme.typography.weights.semibold,
    color: healthColors.primary.main,
  },
  registerButton: {
    flex: 1.5,
    borderRadius: theme.borderRadius.small,
    overflow: "hidden",
  },
  registerButtonDisabled: {
    opacity: 0.6,
  },
  registerGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: theme.spacing.sm,
    gap: 6,
  },
  registerButtonText: {
    fontSize: 14,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.white,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  loadingText: {
    fontSize: 14,
    color: healthColors.text.secondary,
    marginTop: 12,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: 60,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: theme.typography.weights.bold,
    color: healthColors.text.primary,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.xs,
  },
  errorText: {
    fontSize: 14,
    color: healthColors.text.secondary,
    textAlign: "center",
    marginBottom: theme.spacing.lg,
  },
  retryButton: {
    backgroundColor: healthColors.primary.main,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.small,
  },
  retryButtonText: {
    fontSize: 14,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.white,
  },
  emptyState: {
    paddingVertical: 60,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: theme.spacing.xl,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: theme.typography.weights.bold,
    color: healthColors.text.primary,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.xs,
  },
  emptyText: {
    fontSize: 14,
    color: healthColors.text.secondary,
    textAlign: "center",
    lineHeight: 20,
  },
  resetFilterButton: {
    marginTop: theme.spacing.lg,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.sm,
    backgroundColor: healthColors.primary.main,
    borderRadius: theme.borderRadius.small,
  },
  resetFilterText: {
    fontSize: 14,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.white,
  },
});

export default HospitalEventsScreen;



