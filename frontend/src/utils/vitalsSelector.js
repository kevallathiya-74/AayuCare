/**
 * Vitals Selector Utilities
 * Central source of truth for vitals status, risk score calculations, and greeting helpers.
 */

/**
 * Returns the latest metric of a given type from a list of metrics.
 */
export const getLatestMetric = (metrics, type) => {
  if (!metrics || !Array.isArray(metrics) || !metrics.length) return null;
  const filtered = metrics.filter((m) => m.type === type);
  if (!filtered.length) return null;
  return [...filtered].sort(
    (a, b) => new Date(b.timestamp) - new Date(a.timestamp),
  )[0];
};

/**
 * Computes health status and risk score based on patient metrics.
 */
export const computeHealthStatus = (metrics) => {
  const safeMetrics = Array.isArray(metrics) ? metrics : [];
  if (!safeMetrics.length) {
    return { status: "UNKNOWN", riskScore: "N/A" };
  }

  const bp = getLatestMetric(safeMetrics, "bp");
  const sugar = getLatestMetric(safeMetrics, "sugar");
  if (!bp && !sugar) {
    return { status: "UNKNOWN", riskScore: "N/A" };
  }
  let riskScore = 0;

  if (bp?.value) {
    const { systolic, diastolic } = bp.value;
    if (systolic > 140 || diastolic > 90) riskScore += 30;
    else if (systolic > 130 || diastolic > 85) riskScore += 15;
  }

  if (sugar?.value) {
    const val = Number(sugar.value);
    if (val > 140) riskScore += 30;
    else if (val > 110) riskScore += 15;
  }

  if (riskScore < 20) return { status: "HEALTHY", riskScore };
  if (riskScore < 40) return { status: "MONITOR", riskScore };
  return { status: "CONSULT DOCTOR", riskScore };
};
const getTimePeriod = (h) => {
  if (h >= 5 && h < 12) return "morning";
  if (h >= 12 && h < 17) return "afternoon";
  if (h >= 17 && h < 21) return "evening";
  return "night";
};

/**
 * Formats time-based greeting for UI headers.
 */
export const getTimeBasedGreeting = () => {
  const period = getTimePeriod(new Date().getHours());
  switch (period) {
    case "morning": return "Good Morning";
    case "afternoon": return "Good Afternoon";
    case "evening": return "Good Evening";
    default: return "Good Night";
  }
};

/**
 * Formats time-based greeting icon name for UI headers.
 */
export const getGreetingIcon = () => {
  const period = getTimePeriod(new Date().getHours());
  switch (period) {
    case "morning": return "sunny";
    case "afternoon": return "partly-sunny";
    case "evening": return "moon";
    default: return "moon-outline";
  }
};

/**
 * Return normal ranges and color indicators for metric types.
 */
export const getMetricRanges = () => ({
  bp: { min: 90, max: 140, label: "90-140 systolic" },
  sugar: { min: 70, max: 140, label: "70-140 mg/dL" },
  temperature: { min: 97, max: 99, label: "97-99 °F" },
  heartRate: { min: 60, max: 100, label: "60-100 bpm" },
});
