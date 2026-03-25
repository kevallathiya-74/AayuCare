const DEFAULT_ERROR_CODE = "INTERNAL_SERVER_ERROR";

const buildMeta = (req, extraMeta = {}) => ({
  timestamp: new Date().toISOString(),
  requestId: req?.requestId || null,
  ...extraMeta,
});

const sendSuccess = (res, req, data = {}, message = "Request successful", statusCode = 200, meta = {}) => {
  return res.status(statusCode).json({
    success: true,
    status: "success",
    message,
    data,
    meta: buildMeta(req, meta),
  });
};

const sendPaginated = (
  res,
  req,
  data = [],
  pagination = {},
  message = "Request successful",
  statusCode = 200,
  meta = {}
) => {
  return res.status(statusCode).json({
    success: true,
    status: "success",
    message,
    data,
    pagination,
    meta: buildMeta(req, meta),
  });
};

const sendError = (
  res,
  req,
  message = "Something went wrong",
  statusCode = 500,
  code = DEFAULT_ERROR_CODE,
  errors = []
) => {
  return res.status(statusCode).json({
    success: false,
    status: "error",
    message,
    code,
    errors: Array.isArray(errors) ? errors : [],
    meta: buildMeta(req),
  });
};

module.exports = {
  sendSuccess,
  sendPaginated,
  sendError,
};
