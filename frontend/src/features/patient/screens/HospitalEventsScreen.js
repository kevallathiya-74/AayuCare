/**
 * Hospital Events & Camps Screen
 * Blood donation, diabetes screening, vaccination, health workshops
 * Redesigned to match app UI/UX with end-to-end data connectivity
 */

import React, { useState, useCallback, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
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
  ScrollView,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import {
  Clock,
  MapPin,
  Users,
  Info,
  ArrowRight,
  ArrowLeft,
  RefreshCw,
  AlertCircle,
} from "lucide-react-native";
import { theme, healthColors } from "@/theme";
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { queryKeys } from "@/config/reactQueryConfig";
import { getScreenPadding } from "@/utils/responsive";

import { logError, parseError } from "@/utils/errorHandler";
import logger from "@/utils/logger";
import { eventService } from "@/services";
import { convertTo12Hour, getStatusColor } from "@/utils/helpers";
import { SkeletonCardRow, EmptyState } from "@/components/common";
import { DynamicIcon } from "@/components/common";
import { handleSmartBack } from "@/utils/navigation";
import { useTranslation } from 'react-i18next';

const PAGE_SIZE = 15;

const HospitalEventsScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const { user } = useAuth((state) => state.auth);
  const queryClient = useQueryClient();
  const [registeredEventIds, setRegisteredEventIds] = useState(new Set());
  const [registeringId, setRegisteringId] = useState(null);
  const [filter, setFilter] = useState("all");
  const insets = useSafeAreaInsets();

  const {
    data,
    isLoading: loading,
    isError,
    error,
    refetch,
    isRefetching,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: queryKeys.events.infinite({ scope: "hospital-events" }),
    staleTime: 2 * 60 * 1000,
    initialPageParam: 0,
    queryFn: async ({ pageParam = 0 }) => {
      const response = await eventService.getUpcomingEvents({
        limit: PAGE_SIZE,
        page: Math.floor(pageParam / PAGE_SIZE) + 1,
      });
      const eventData = response?.data || response || [];
      const eventsArray = Array.isArray(eventData) ? eventData : [];
      logger.debug("HospitalEventsScreen", "Events count", eventsArray.length);
      return {
        items: eventsArray,
        total: Number(response?.total || response?.pagination?.total || 0),
      };
    },
    getNextPageParam: (lastPage, allPages) => {
      const loaded = allPages.reduce(
        (sum, page) => sum + (page?.items?.length || 0),
        0
      );
      if (lastPage?.total > 0) {
        return loaded < lastPage.total ? loaded : undefined;
      }
      return (lastPage?.items?.length || 0) >= PAGE_SIZE ? loaded : undefined;
    },
  });

  const registerMutation = useMutation({
    mutationFn: (eventId) => eventService.registerForEvent(eventId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.events.all });
    },
  });

  const cancelMutation = useMutation({
    mutationFn: (eventId) => eventService.cancelRegistration(eventId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.events.all });
    },
  });

  const events = useMemo(
    () => (data?.pages || []).flatMap((page) => page?.items || []),
    [data]
  );

  const onRefresh = useCallback(async () => {
    await refetch();
  }, [refetch]);

  const onLoadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

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
                setRegisteringId(event.id);
                await registerMutation.mutateAsync(event.id);
                setRegisteredEventIds((prev) => new Set([...prev, event.id]));
                Alert.alert(
                  "Success",
                  `Successfully registered for "${event.title}"!`
                );
                await refetch();
              } catch (err) {
                const errorMsg = parseError(err);
                logError(err, {
                  context: "HospitalEventsScreen.handleRegister",
                  eventId: event.id,
                });
                Alert.alert("Error", errorMsg);
              } finally {
                setRegisteringId(null);
              }
            },
          },
        ]
      );
    },
    [registerMutation, refetch]
  );

  const handleCancelRegistration = useCallback(
    async (event) => {
      Alert.alert(
        "Cancel Registration",
        `Are you sure you want to cancel your registration for "${event.title}"?`,
        [
          { text: "Keep Registration", style: "cancel" },
          {
            text: "Cancel Registration",
            style: "destructive",
            onPress: async () => {
              try {
                setRegisteringId(event.id);
                await cancelMutation.mutateAsync(event.id);
                setRegisteredEventIds((prev) => {
                  const next = new Set(prev);
                  next.delete(event.id);
                  return next;
                });
                Alert.alert(
                  "Done",
                  `Registration cancelled for "${event.title}".`
                );
                await refetch();
              } catch (err) {
                const msg = parseError(err);
                logError(err, {
                  context: "HospitalEventsScreen.handleCancelRegistration",
                  eventId: event.id,
                });
                Alert.alert("Error", msg);
              } finally {
                setRegisteringId(null);
              }
            },
          },
        ]
      );
    },
    [cancelMutation, refetch]
  );

  const getEventIcon = (type) => {
    const icons = {
      "blood-donation": "water",
      screening: "fitness",
      vaccination: "medical",
      workshop: "book-open",
      camp: "tent-2",
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

  const normalizeEventStatus = useCallback((event) => {
    const rawStatus = String(
      event?.status || event?.eventStatus || ""
    ).toLowerCase();

    if (
      ["upcoming", "scheduled", "planned", "open", "published"].includes(
        rawStatus
      )
    ) {
      return "upcoming";
    }
    if (
      ["ongoing", "in_progress", "live", "running", "active"].includes(
        rawStatus
      )
    ) {
      return "ongoing";
    }
    if (
      ["completed", "closed", "cancelled", "canceled", "ended"].includes(
        rawStatus
      )
    ) {
      return "completed";
    }

    const eventDate = event?.date ? new Date(event.date) : null;
    if (eventDate && !Number.isNaN(eventDate.getTime())) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const normalizedEventDate = new Date(eventDate);
      normalizedEventDate.setHours(0, 0, 0, 0);

      if (normalizedEventDate.getTime() > today.getTime()) return "upcoming";
      if (normalizedEventDate.getTime() < today.getTime()) return "completed";
      return "ongoing";
    }

    return "upcoming";
  }, []);

  const normalizedEvents = useMemo(
    () =>
      (Array.isArray(events) ? events : []).map((event) => ({
        ...event,
        _uiStatus: normalizeEventStatus(event),
      })),
    [events, normalizeEventStatus]
  );

  const filteredEvents = normalizedEvents.filter((event) => {
    if (filter === "all") return true;
    return event._uiStatus === filter;
  });

  const filterOptions = useMemo(() => {
    const upcomingCount = normalizedEvents.filter(
      (event) => event._uiStatus === "upcoming"
    ).length;
    const ongoingCount = normalizedEvents.filter(
      (event) => event._uiStatus === "ongoing"
    ).length;

    return [
      { key: "all", label: "All", count: normalizedEvents.length },
      { key: "upcoming", label: "Upcoming", count: upcomingCount },
      { key: "ongoing", label: "Ongoing", count: ongoingCount },
    ];
  }, [normalizedEvents]);

  const renderEventCard = ({ item: event }) => {
    const eventDate = new Date(event.date);
    const formattedDate = eventDate.toLocaleDateString("en-US", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
    const spotsRemaining = event.availableSpots - (event.registeredCount || 0);
    const eventColor = getEventColor(event.type);
    const statusColor = getStatusColor(event._uiStatus);

    return (
      <View style={styles.eventCard}>
        {/* Status Badge */}
        <View
          style={[styles.statusBadge, { backgroundColor: statusColor + "20" }]}
        >
          <Text style={[styles.statusText, { color: statusColor }]}>
            {event._uiStatus?.toUpperCase() || "UPCOMING"}
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
            <DynamicIcon
              name={getEventIcon(event.type)}
              size={32}
              color={eventColor}
            />
          </View>
          <View style={styles.eventHeaderText}>
            <Text style={styles.eventTitle}>{event.title}</Text>
            <View style={styles.eventMetaRow}>
              <DynamicIcon
                name="calendar-outline"
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
            <Clock size={18} color={eventColor} />
            <Text style={styles.eventDetailText}>
              {convertTo12Hour(event.startTime)} -{" "}
              {convertTo12Hour(event.endTime)}
            </Text>
          </View>
          <View style={styles.eventDetailRow}>
            <MapPin size={18} color={eventColor} />
            <Text style={styles.eventDetailText}>{event.venue}</Text>
          </View>
          <View style={styles.eventDetailRow}>
            <Users size={18} color={eventColor} />
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
                `${event.title}\n\nType: ${
                  event.type || "General"
                }\nDate: ${formattedDate}\nTime: ${convertTo12Hour(
                  event.startTime
                )} - ${convertTo12Hour(event.endTime)}\nVenue: ${
                  event.venue || "TBD"
                }\nOrganizer: ${
                  event.organizer || "Hospital Admin"
                }\nAvailable Spots: ${
                  spotsRemaining > 0 ? spotsRemaining : 0
                }\n\n${
                  event.description || "No additional description available."
                }`
              )
            }
            accessibilityRole="button"
            accessibilityLabel={`View details for ${event.title}`}
          >
            <Info size={20} color={healthColors.primary.main} />
            <Text style={styles.detailsButtonText}>{t('details')}</Text>
          </TouchableOpacity>

          {registeredEventIds.has(event.id) ? (
            <TouchableOpacity
              style={styles.registerButton}
              onPress={() => handleCancelRegistration(event)}
              disabled={registeringId === event.id}
              accessibilityRole="button"
              accessibilityLabel={`Cancel registration for ${event.title}`}
              accessibilityState={{ disabled: registeringId === event.id }}
            >
              <LinearGradient
                colors={[
                  healthColors.error.main,
                  healthColors.error.dark ?? healthColors.error.main + "DD",
                ]}
                style={styles.registerGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={styles.registerButtonText}>
                  {registeringId === event.id
                    ? "Cancelling..."
                    : "Cancel Registration"}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[
                styles.registerButton,
                spotsRemaining <= 0 && styles.registerButtonDisabled,
              ]}
              onPress={() => handleRegister(event)}
              disabled={registeringId === event.id || spotsRemaining <= 0}
              accessibilityRole="button"
              accessibilityLabel={
                spotsRemaining > 0
                  ? `Register for ${event.title}`
                  : `${event.title} is full`
              }
              accessibilityState={{
                disabled: registeringId === event.id || spotsRemaining <= 0,
              }}
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
                  <ArrowRight size={16} color={theme.colors.white} />
                )}
              </LinearGradient>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  const renderHeader = () => (
    <View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
        style={styles.filterScroll}
      >
        {filterOptions.map((option) => {
          const active = filter === option.key;
          return (
            <TouchableOpacity
              key={option.key}
              onPress={() => setFilter(option.key)}
              style={[styles.filterChip, active && styles.filterChipActive]}
              activeOpacity={0.75}
              accessibilityRole="button"
              accessibilityLabel={`Filter ${option.label} events`}
              accessibilityState={{ selected: active }}
            >
              <Text
                style={[
                  styles.filterChipText,
                  active && styles.filterChipTextActive,
                ]}
              >
                {option.label} ({option.count})
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <View style={styles.countContainer}>
        <Text style={styles.countText}>{filteredEvents.length} Events</Text>
      </View>
    </View>
  );

  const renderEmpty = () => (
    <EmptyState
      icon="calendar-outline"
      title={
        filter === "all"
          ? "No Events Found"
          : `No ${filter.charAt(0).toUpperCase() + filter.slice(1)} Events`
      }
      message={
        filter === "all"
          ? "No events are available at the moment."
          : `No ${filter} events right now. You can switch to All events.`
      }
      actionLabel={filter !== "all" ? "Show All" : undefined}
      onActionPress={filter !== "all" ? () => setFilter("all") : undefined}
    />
  );

  return (
    <SafeAreaView style={styles.container} edges={["left", "right", "bottom"]}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={healthColors.background.primary}
      />

      {/* Header */}
      <View
        style={[styles.header, { paddingTop: insets.top + theme.spacing.xs }]}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() =>
            handleSmartBack(
              navigation,
              user?.role === "admin" ? "AdminTabs" : "PatientTabs"
            )
          }
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <ArrowLeft size={24} color={healthColors.text.primary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>{t('hospital_events')}pital Events</Text>
          <Text style={styles.headerSubtitle}>{t('health_camps_workshops')} & workshops</Text>
        </View>
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={onRefresh}
          disabled={isRefetching}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Refresh events"
          accessibilityState={{ disabled: isRefetching }}
        >
          {isRefetching ? (
            <ActivityIndicator size="small" color={healthColors.text.primary} />
          ) : (
            <RefreshCw size={24} color={healthColors.text.primary} />
          )}
        </TouchableOpacity>
      </View>

      {/* Events List */}
      {loading && !isRefetching ? (
        <View style={styles.loadingListWrapper}>
          {[1, 2, 3, 4].map((i) => (
            <SkeletonCardRow key={i} />
          ))}
        </View>
      ) : isError ? (
        <View style={styles.errorContainer}>
          <AlertCircle size={64} color={healthColors.error.main} />
          <Text style={styles.errorTitle}>{t('failed_to_load_events')}</Text>
          <Text style={styles.errorText}>{parseError(error)}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={refetch}
            accessibilityRole="button"
            accessibilityLabel="Retry loading events"
          >
            <Text style={styles.retryButtonText}>{t('try_again')}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredEvents}
          renderItem={renderEventCard}
          keyExtractor={(item) => item.id}
          onEndReached={onLoadMore}
          onEndReachedThreshold={0.3}
          removeClippedSubviews={true}
          maxToRenderPerBatch={10}
          windowSize={10}
          initialNumToRender={10}
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={renderEmpty}
          contentContainerStyle={[
            styles.listContent,
            filteredEvents.length === 0 && styles.flexGrow,
            { paddingBottom: Math.max(insets.bottom, 20) },
          ]}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={onRefresh}
              colors={[healthColors.primary.main]}
              tintColor={healthColors.primary.main}
            />
          }
          ListFooterComponent={
            isFetchingNextPage ? (
              <View style={styles.footerLoader}>
                <ActivityIndicator
                  size="small"
                  color={healthColors.primary.main}
                />
              </View>
            ) : null
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
    paddingHorizontal: getScreenPadding(),
    paddingBottom: theme.spacing.md,
    backgroundColor: healthColors.background.card,
    borderBottomWidth: 1,
    borderBottomColor: healthColors.border.light,
  },
  backButton: {
    width: theme.touchTargets.md,
    height: theme.touchTargets.md,
    borderRadius: theme.borderRadius.full,
    backgroundColor: healthColors.transparent,
    justifyContent: "center",
    alignItems: "center",
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: theme.typography.sizes.h6,
    fontWeight: theme.typography.weights.bold,
    color: healthColors.text.primary,
  },
  headerSubtitle: {
    fontSize: theme.typography.sizes.caption,
    color: healthColors.text.secondary,
    marginTop: 2,
  },
  refreshButton: {
    width: theme.touchTargets.md,
    height: theme.touchTargets.md,
    borderRadius: theme.borderRadius.full,
    backgroundColor: healthColors.transparent,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingListWrapper: {
    padding: theme.spacing.md,
    gap: theme.spacing.sm + theme.spacing.xs,
  },
  flexGrow: { flexGrow: 1 },
  filterScroll: {
    marginTop: theme.spacing.sm,
  },
  filterRow: {
    paddingHorizontal: getScreenPadding(),
    gap: theme.spacing.sm,
    alignItems: "center",
    paddingBottom: theme.spacing.xs,
  },
  filterChip: {
    borderWidth: 1,
    borderColor: healthColors.border.light,
    backgroundColor: healthColors.background.card,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  filterChipActive: {
    backgroundColor: healthColors.primary.main,
    borderColor: healthColors.primary.main,
  },
  filterChipText: {
    fontSize: theme.typography.sizes.bodySmall,
    color: healthColors.text.secondary,
    fontWeight: theme.typography.weights.semibold,
  },
  filterChipTextActive: {
    color: theme.colors.white,
  },

  countContainer: {
    paddingHorizontal: getScreenPadding(),
    paddingTop: theme.spacing.xs,
    paddingBottom: theme.spacing.sm,
  },
  countText: {
    fontSize: theme.typography.sizes.bodyMedium,
    fontWeight: theme.typography.weights.semibold,
    color: healthColors.text.primary,
  },
  listContent: {
    paddingHorizontal: getScreenPadding(),
    paddingTop: theme.spacing.xs,
  },
  footerLoader: {
    paddingVertical: theme.spacing.md,
    alignItems: "center",
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
    fontSize: theme.typography.sizes.overline,
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
    fontSize: theme.typography.sizes.bodyLarge,
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
    fontSize: theme.typography.sizes.bodyMedium,
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
    fontSize: theme.typography.sizes.bodyMedium,
    color: healthColors.text.secondary,
    flex: 1,
  },
  eventDescription: {
    fontSize: theme.typography.sizes.bodyMedium,
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
    backgroundColor: theme.withOpacity(healthColors.primary.main, 0.08),
  },
  detailsButtonText: {
    fontSize: theme.typography.sizes.bodyMedium,
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
    fontSize: theme.typography.sizes.bodyMedium,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.white,
  },

  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: 60,
  },
  errorTitle: {
    fontSize: theme.typography.sizes.h5,
    fontWeight: theme.typography.weights.bold,
    color: healthColors.text.primary,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.xs,
  },
  errorText: {
    fontSize: theme.typography.sizes.bodyMedium,
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
    fontSize: theme.typography.sizes.bodyMedium,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.white,
  },
});

export default HospitalEventsScreen;
