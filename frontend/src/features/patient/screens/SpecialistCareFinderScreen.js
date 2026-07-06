/**
 * Specialist Care Finder Screen (Screen 21)
 * Find doctors by specialty with filters and booking
 */

import React, { useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  RefreshControl,
} from "react-native";
import { useSelector } from "react-redux";
import { useQuery } from "@tanstack/react-query";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { User, Star, Banknote, Clock, Building, Video, CheckCircle, ArrowLeft, Search, BriefcaseMedical, Cross, ChevronDown, Calendar } from "lucide-react-native";
import { theme, healthColors } from '@/theme';
import {
  verticalScale,
  getScreenPadding,
} from '@/utils/responsive';
import { ErrorRecovery, NetworkStatusIndicator, SkeletonCardRow, EmptyState } from '@/components/common';
import { parseError } from '@/utils/errorHandler';
import { formatCurrency } from '@/utils/helpers';
import { doctorService } from '@/services';
import { queryKeys } from '@/config/reactQueryConfig';
import { DynamicIcon } from '@/components/common';
import { handleSmartBack } from '@/utils/navigation';
import Routes from '@/navigation/routes';

const isPlainObject = (value) => value !== null && typeof value === "object" && !Array.isArray(value);

const toDisplayText = (value, fallback = "N/A") => {
  if (value == null) return fallback;
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed || fallback;
  }
  if (typeof value === "number") {
    return Number.isFinite(value) ? String(value) : fallback;
  }
  if (Array.isArray(value)) {
    const items = value.map((item) => String(item || "").trim()).filter(Boolean);
    return items.length ? items.join(", ") : fallback;
  }
  if (isPlainObject(value)) {
    const values = Object.values(value)
      .map((item) => String(item || "").trim())
      .filter(Boolean);
    return values.length ? values.join(", ") : fallback;
  }
  return fallback;
};

const getDoctorSpecialtyText = (doctor) =>
  toDisplayText(doctor?.specialization || doctor?.specialty, "General Medicine");

const getDoctorExperienceText = (doctor) => {
  const raw = doctor?.experience;
  if (typeof raw === "number" && Number.isFinite(raw)) {
    return `${raw} years exp`;
  }
  if (typeof raw === "string" && raw.trim()) {
    return raw.toLowerCase().includes("year") ? raw.trim() : `${raw.trim()} years exp`;
  }
  return "Experience unavailable";
};

const getDoctorAvailabilityText = (doctor) => {
  const availability = doctor?.availability;
  if (isPlainObject(availability)) {
    const dayShort = {
      monday: "Mon",
      tuesday: "Tue",
      wednesday: "Wed",
      thursday: "Thu",
      friday: "Fri",
      saturday: "Sat",
      sunday: "Sun",
    };
    const openDays = Object.entries(availability)
      .filter(([, enabled]) => Boolean(enabled))
      .map(([day]) => dayShort[String(day).toLowerCase()] || String(day).slice(0, 3));
    if (!openDays.length) return "Check availability";
    if (openDays.length > 3) {
      return `${openDays.slice(0, 3).join(", ")} +${openDays.length - 3}`;
    }
    return openDays.join(", ");
  }
  return toDisplayText(availability, "Check availability");
};

const SpecialistCareFinderScreen = ({ navigation }) => {
  const { user } = useSelector((state) => state.auth);
  const insets = useSafeAreaInsets();
  const selectedSpecialty = "All";
  const selectedAvailability = "Today";
  const feeRange = [0, 1000];

  const specialties = [
    { id: 1, name: "All", icon: "apps-outline" },
    { id: 2, name: "Cardiology", icon: "heart-outline" },
    { id: 3, name: "Pulmonology", icon: "fitness-outline" },
    { id: 4, name: "Neurology", icon: "bulb-outline" },
    { id: 5, name: "Pediatrics", icon: "happy-outline" },
    { id: 6, name: "Dermatology", icon: "leaf-outline" },
    { id: 7, name: "Orthopedics", icon: "body-outline" },
  ];

  const {
    data: doctors = [],
    isLoading: loading,
    isRefetching,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: queryKeys.doctors.list({
      scope: "specialist-finder",
      selectedSpecialty,
      feeRange,
      hospitalId: user?.hospitalId,
    }),
    enabled: true,
    staleTime: 10 * 60 * 1000,
    queryFn: async () => {
      const filters = {};
      if (selectedSpecialty !== "All") {
        filters.specialization = selectedSpecialty;
      }
      if (user?.hospitalId) {
        filters.hospitalId = user.hospitalId;
      }

      const response = await doctorService.getDoctors(filters);
      let filteredDoctors = response?.data?.doctors || [];

      if (feeRange && feeRange.length === 2) {
        filteredDoctors = filteredDoctors.filter(
          (doc) => doc.consultationFee >= feeRange[0] && doc.consultationFee <= feeRange[1]
        );
      }

      return filteredDoctors;
    },
  });

  const onRefresh = useCallback(async () => {
    await refetch();
  }, [refetch]);

  const handleRetry = () => {
    refetch();
  };

  const renderDoctorCard = (doctor) => (
    <View key={doctor.id} style={styles.doctorCard}>
      <View style={styles.doctorHeader}>
        <View style={styles.doctorAvatar}>
          <User  size={32} color={healthColors.primary.main} />
        </View>
        <View style={styles.doctorInfo}>
          <Text style={styles.doctorName}>{doctor.name}</Text>
          <Text style={styles.doctorSpecialty}>
            {getDoctorSpecialtyText(doctor)} • {getDoctorExperienceText(doctor)}
          </Text>
          <View style={styles.ratingContainer}>
            <Star  size={16} color={theme.colors.warning.main} />
            <Text style={styles.ratingText}>
              {doctor.rating || "N/A"} ({doctor.reviews || 0} reviews)
            </Text>
          </View>
          <View style={styles.doctorDetails}>
            <View style={styles.detailItem}>
              <Banknote
                
                size={14}
                color={healthColors.success.main}
              />
              <Text style={styles.feeText}>
                {formatCurrency(doctor.consultationFee || doctor.fee)}
              </Text>
            </View>
            <View style={styles.detailItem}>
              <Clock
                
                size={14}
                color={healthColors.primary.main}
              />
              <Text style={styles.availabilityText} numberOfLines={1} ellipsizeMode="tail">
                {getDoctorAvailabilityText(doctor)}
              </Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.consultationTypes}>
        <View
          style={[
            styles.consultationType,
            (doctor.availability || doctor.schedule || doctor.hasClinic) &&
              styles.consultationTypeActive,
          ]}
        >
          <Building
            
            size={18}
            color={
              doctor.availability || doctor.schedule || doctor.hasClinic
                ? healthColors.primary.main
                : healthColors.text.disabled
            }
          />
          <Text
            style={[
              styles.consultationTypeText,
              (doctor.availability || doctor.schedule || doctor.hasClinic) &&
                styles.consultationTypeTextActive,
            ]}
          >
            CLINIC
          </Text>
        </View>
        <View
          style={[
            styles.consultationType,
            (doctor.telemedicine || doctor.hasTelemedicine) &&
              styles.consultationTypeActive,
          ]}
        >
          <Video
            
            size={18}
            color={
              doctor.telemedicine || doctor.hasTelemedicine
                ? healthColors.primary.main
                : healthColors.text.disabled
            }
          />
          <Text
            style={[
              styles.consultationTypeText,
              (doctor.telemedicine || doctor.hasTelemedicine) &&
                styles.consultationTypeTextActive,
            ]}
          >
            TELEMEDICINE
          </Text>
          {(doctor.telemedicine || doctor.hasTelemedicine) && (
            <CheckCircle
              
              size={16}
              color={healthColors.success.main}
            />
          )}
        </View>
      </View>

      <View style={styles.doctorActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() =>
            navigation.navigate(Routes.PATIENT.APPOINTMENT_BOOKING, {
              doctorId: doctor.id,
            })
          }
          accessibilityRole="button"
          accessibilityLabel={`Book appointment with ${doctor.name}`}
        >
          <Text style={styles.actionButtonText}>Book Appointment</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.viewProfileButton}
          onPress={() =>
            navigation.navigate(Routes.PATIENT.DOCTOR_PROFILE_VIEW, {
              doctor,
            })
          }
          accessibilityRole="button"
          accessibilityLabel={`View profile for ${doctor.name}`}
        >
          <Text style={styles.viewProfileText}>View Profile</Text>
        </TouchableOpacity>
      </View>
      {/* Fixed: BookAppointment -> AppointmentBooking (correct screen name) */}
      {/* Fixed: DoctorProfile replaced with Alert (screen does not exist) */}
    </View>
  );

  if (isError) {
    return (
      <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
        <StatusBar
          barStyle="dark-content"
          backgroundColor={healthColors.background.primary}
        />
        <NetworkStatusIndicator />
        <ErrorRecovery
          error={parseError(error)}
          onRetry={handleRetry}
          onGoBack={() => handleSmartBack(navigation, "PatientTabs")}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={healthColors.background.primary}
      />
      <NetworkStatusIndicator />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => handleSmartBack(navigation, "PatientTabs")}
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <ArrowLeft
            
            size={24}
            color={healthColors.text.primary}
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Find Specialist</Text>
        <TouchableOpacity
          style={styles.searchButton}
          accessibilityRole="button"
          accessibilityLabel="Search specialists"
        >
          <Search  size={24} color={healthColors.text.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 20) }}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={onRefresh}
            colors={[healthColors.primary.main]}
            tintColor={healthColors.primary.main}
          />
        }
      >
        {/* Title */}
        <View style={styles.titleSection}>
          <BriefcaseMedical
            
            size={20}
            color={healthColors.primary.main}
          />
          <Text style={styles.title}>FIND YOUR SPECIALIST</Text>
        </View>

        {/* Filters */}
        <View style={styles.filtersSection}>
          <View style={styles.filterCard}>
            <View style={styles.filterRow}>
              <View style={styles.filterLabelContainer}>
                <Cross
                  
                  size={18}
                  color={healthColors.primary.main}
                />
                <Text style={styles.filterLabel}>Specialty:</Text>
              </View>
              <TouchableOpacity
                style={styles.filterDropdown}
                accessibilityRole="button"
                accessibilityLabel="Specialty filter"
              >
                <Text style={styles.filterValue}>{selectedSpecialty}</Text>
                <ChevronDown
                  
                  size={20}
                  color={healthColors.text.secondary}
                />
              </TouchableOpacity>
            </View>
            <View style={styles.filterRow}>
              <View style={styles.filterLabelContainer}>
                <Calendar
                  
                  size={18}
                  color={healthColors.primary.main}
                />
                <Text style={styles.filterLabel}>Availability:</Text>
              </View>
              <TouchableOpacity
                style={styles.filterDropdown}
                accessibilityRole="button"
                accessibilityLabel="Availability filter"
              >
                <Text style={styles.filterValue}>{selectedAvailability}</Text>
                <ChevronDown
                  
                  size={20}
                  color={healthColors.text.secondary}
                />
              </TouchableOpacity>
            </View>
            <View style={styles.filterRow}>
              <View style={styles.filterLabelContainer}>
                <Banknote
                  
                  size={18}
                  color={healthColors.primary.main}
                />
                <Text style={styles.filterLabel}>Fee Range:</Text>
              </View>
              <Text style={styles.feeRangeText}>
                {formatCurrency(feeRange[0])} - {formatCurrency(feeRange[1])}
              </Text>
            </View>
          </View>
        </View>

        {/* Specialties Chips */}
        <View style={styles.specialtiesSection}>
          <Text style={styles.sectionTitle}>SPECIALTIES:</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.specialtiesScroll}
          >
            {specialties.map((specialty) => (
              <TouchableOpacity
                key={specialty.id}
                style={styles.specialtyChip}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel={`Filter by ${specialty.name}`}
                accessibilityState={{ selected: selectedSpecialty === specialty.name }}
              >
                <DynamicIcon
                  name={specialty.icon}
                  size={20}
                  color={healthColors.primary.main}
                />
                <Text style={styles.specialtyText}>{specialty.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Doctor List */}
        <View style={styles.doctorsSection}>
          <Text style={styles.sectionTitle}>DOCTOR LIST:</Text>
          {loading ? (
            <View style={styles.loadingContainer}>
              <SkeletonCardRow />
              <SkeletonCardRow />
              <SkeletonCardRow />
            </View>
          ) : doctors.length === 0 ? (
            <EmptyState
              icon="search-outline"
              title="No Specialists Found"
              message="No doctors match your current filters. Try a different specialty or availability."
            />
          ) : (
            <>
              {doctors.map(renderDoctorCard)}
              <View style={styles.doctorCountContainer}>
                <Text style={styles.doctorCountText}>
                  Showing {doctors.length} specialist
                  {doctors.length !== 1 ? "s" : ""}
                </Text>
              </View>
            </>
          )}
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: healthColors.background.secondary,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: getScreenPadding(),
    paddingVertical: 12,
    backgroundColor: theme.colors.white,
    borderBottomWidth: 1,
    borderBottomColor: healthColors.border.light,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: theme.typography.sizes.h5,
    fontWeight: theme.typography.weights.bold,
    color: healthColors.text.primary,
    flex: 1,
    marginLeft: 12,
  },
  searchButton: {
    padding: 4,
  },
  titleSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: getScreenPadding(),
    paddingBottom: 8,
  },
  title: {
    fontSize: theme.typography.sizes.bodyLarge,
    fontWeight: theme.typography.weights.bold,
    color: healthColors.text.primary,
  },
  filtersSection: {
    paddingHorizontal: getScreenPadding(),
    marginBottom: verticalScale(16),
  },
  filterCard: {
    backgroundColor: theme.colors.white,
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: healthColors.border.light,
  },
  filterRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  filterLabelContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  filterLabel: {
    fontSize: theme.typography.sizes.bodyMedium,
    color: healthColors.text.primary,
    fontWeight: theme.typography.weights.medium,
  },
  filterDropdown: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: healthColors.background.secondary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  filterValue: {
    fontSize: theme.typography.sizes.bodyMedium,
    color: healthColors.text.primary,
  },
  feeRangeText: {
    fontSize: theme.typography.sizes.bodyMedium,
    color: healthColors.text.primary,
    fontWeight: theme.typography.weights.semibold,
  },
  specialtiesSection: {
    marginBottom: verticalScale(16),
  },
  sectionTitle: {
    fontSize: theme.typography.sizes.bodyMedium,
    fontWeight: theme.typography.weights.bold,
    color: healthColors.text.primary,
    paddingHorizontal: getScreenPadding(),
    marginBottom: 12,
  },
  specialtiesScroll: {
    paddingHorizontal: getScreenPadding(),
    gap: 8,
  },
  specialtyChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: theme.colors.white,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: healthColors.border.light,
  },
  specialtyText: {
    fontSize: theme.typography.sizes.bodyMedium,
    color: healthColors.text.primary,
    fontWeight: theme.typography.weights.medium,
  },
  doctorsSection: {
    paddingHorizontal: getScreenPadding(),
    marginBottom: verticalScale(16),
  },
  doctorCard: {
    backgroundColor: theme.colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: healthColors.border.light,
  },
  doctorHeader: {
    flexDirection: "row",
    marginBottom: 12,
  },
  doctorAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: theme.withOpacity(healthColors.primary.main, 0.08),
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  doctorInfo: {
    flex: 1,
  },
  doctorName: {
    fontSize: theme.typography.sizes.bodyLarge,
    fontWeight: theme.typography.weights.bold,
    color: healthColors.text.primary,
    marginBottom: 4,
  },
  doctorSpecialty: {
    fontSize: theme.typography.sizes.bodyMedium,
    color: healthColors.text.secondary,
    marginBottom: 6,
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 6,
  },
  ratingText: {
    fontSize: theme.typography.sizes.bodyMedium,
    color: healthColors.text.primary,
  },
  doctorDetails: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    minWidth: 0,
    flexShrink: 1,
  },
  feeText: {
    fontSize: theme.typography.sizes.bodyMedium,
    color: healthColors.text.primary,
    fontWeight: theme.typography.weights.semibold,
  },
  availabilityText: {
    fontSize: theme.typography.sizes.bodyMedium,
    color: healthColors.text.secondary,
    flexShrink: 1,
  },
  consultationTypes: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },
  consultationType: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: healthColors.background.secondary,
    borderWidth: 1,
    borderColor: healthColors.border.light,
  },
  consultationTypeActive: {
    backgroundColor: theme.withOpacity(healthColors.primary.main, 0.06),
    borderColor: healthColors.primary.main,
  },
  consultationTypeText: {
    fontSize: theme.typography.sizes.caption,
    fontWeight: theme.typography.weights.semibold,
    color: healthColors.text.disabled,
  },
  consultationTypeTextActive: {
    color: healthColors.primary.main,
  },
  doctorActions: {
    flexDirection: "row",
    gap: 8,
  },
  actionButton: {
    flex: 1,
    backgroundColor: healthColors.primary.main,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  actionButtonText: {
    fontSize: theme.typography.sizes.bodyMedium,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.white,
  },
  viewProfileButton: {
    flex: 1,
    backgroundColor: healthColors.background.secondary,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    borderWidth: 1,
    borderColor: healthColors.border.light,
  },
  viewProfileText: {
    fontSize: theme.typography.sizes.bodyMedium,
    fontWeight: theme.typography.weights.semibold,
    color: healthColors.text.primary,
  },
  loadingContainer: {
    paddingVertical: 48,
    alignItems: "center",
    justifyContent: "center",
  },

  doctorCountContainer: {
    paddingVertical: 16,
    alignItems: "center",
  },
  doctorCountText: {
    fontSize: theme.typography.sizes.bodyMedium,
    color: healthColors.text.secondary,
    fontWeight: theme.typography.weights.medium,
  },
  bottomSpacer: {
    height: 80,
  },
});

export default SpecialistCareFinderScreen;



