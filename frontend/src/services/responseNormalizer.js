const DATA_KEYS = [
  "data",
  "result",
  "results",
  "items",
  "rows",
  "users",
  "doctors",
  "patients",
  "appointments",
  "notifications",
  "events",
  "prescriptions",
  "records",
  "metrics",
];

const isObject = (value) =>
  value && typeof value === "object" && !Array.isArray(value);

const pickPrimaryData = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (!isObject(payload)) return payload;

  for (const key of DATA_KEYS) {
    if (key in payload) {
      return payload[key];
    }
  }

  return payload;
};

const pickPagination = (payload) => {
  if (!isObject(payload)) return null;
  if (isObject(payload.pagination)) return payload.pagination;

  const hasPaginationKeys =
    payload.page !== undefined ||
    payload.limit !== undefined ||
    payload.total !== undefined ||
    payload.totalPages !== undefined;

  if (!hasPaginationKeys) return null;

  return {
    page: payload.page,
    limit: payload.limit,
    total: payload.total,
    totalPages: payload.totalPages,
    cursor: payload.cursor,
    nextCursor: payload.nextCursor,
  };
};

export const normalizeServiceResponse = (payload, options = {}) => {
  const { fallbackData = null } = options;

  if (payload === undefined || payload === null) {
    return {
      success: false,
      message: "Empty response payload",
      data: fallbackData,
      pagination: null,
      meta: null,
    };
  }

  if (Array.isArray(payload)) {
    return {
      success: true,
      message: "Request successful",
      data: payload,
      pagination: null,
      meta: null,
    };
  }

  if (!isObject(payload)) {
    return {
      success: true,
      message: "Request successful",
      data: payload,
      pagination: null,
      meta: null,
    };
  }

  const success =
    typeof payload.success === "boolean"
      ? payload.success
      : payload.status != null
      ? payload.status === "success"
      : !payload.error;

  return {
    success,
    message: payload.message || payload.error || "Request successful",
    data: pickPrimaryData(payload),
    pagination: pickPagination(payload),
    meta: payload.meta || null,
  };
};

export const extractResponseData = (payload, fallback = null) => {
  const normalized = normalizeServiceResponse(payload, {
    fallbackData: fallback,
  });
  return normalized.data ?? fallback;
};

export const extractResponseList = (payload, fallback = []) => {
  const data = extractResponseData(payload, fallback);
  return Array.isArray(data) ? data : fallback;
};
