import { useState, useCallback, useMemo } from "react";

export default function useAppointmentFilters(appointments = []) {
  const [selectedFilter, setSelectedFilter] = useState("today");
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);

  const normalizeStatus = useCallback(
    (status) =>
      String(status || "")
        .toLowerCase()
        .trim()
        .replace(/-/g, "_")
        .replace(/\s+/g, "_"),
    [],
  );

  const handleFilterChange = useCallback(
    (filterKey) => {
      if (filterKey === selectedFilter) return;
      setSelectedFilter(filterKey);
      setStatusFilter("all");
      setSearchQuery("");
    },
    [selectedFilter],
  );

  const handleStatusFilterChange = useCallback((key) => {
    setStatusFilter(key);
  }, []);

  const filteredAppointments = useMemo(() => {
    let list = appointments;

    // Status sub-filter
    if (statusFilter !== "all") {
      list = list.filter((apt) => {
        const s = normalizeStatus(apt.status);
        return s === statusFilter;
      });
    }

    // Search by patient name, reason, or status
    if (searchQuery.trim().length > 0) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter(
        (apt) =>
          (apt.patientName || "").toLowerCase().includes(q) ||
          (apt.reasonForVisit || apt.reason || "").toLowerCase().includes(q) ||
          (apt.timeSlot || apt.time || "").toLowerCase().includes(q) ||
          normalizeStatus(apt.status).includes(q),
      );
    }

    return list;
  }, [appointments, normalizeStatus, statusFilter, searchQuery]);

  return {
    selectedFilter,
    statusFilter,
    searchQuery,
    setSearchQuery,
    showSearch,
    setShowSearch,
    filteredAppointments,
    handleFilterChange,
    handleStatusFilterChange,
    normalizeStatus,
  };
}
