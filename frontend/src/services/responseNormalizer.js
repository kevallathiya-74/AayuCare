/**
 * Response normalizer stub replacing missing file
 */
export const normalizeServiceResponse = (data) => data;
export const extractResponseData = (data, fallback) => data?.data ?? data ?? fallback;
