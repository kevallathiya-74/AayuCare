exports.sendSuccess = (res, statusCode, message, data = null) => {
  return res.status(statusCode).json({
    success: true,
    ...(message && { message }),
    ...(data && { data }),
  });
};

exports.sendError = (res, statusCode, message, code = "ERROR") => {
  return res.status(statusCode).json({
    success: false,
    message,
    code,
  });
};
