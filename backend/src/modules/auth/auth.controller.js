const legacyAuthController = require("../../controllers/authController");
const authService = require("./auth.service");

exports.getEmailByUserId = (req, res, next) =>
  legacyAuthController.getEmailByUserId(req, res, next);

exports.getCurrentSession = (req, res, next) =>
  legacyAuthController.getCurrentSession(req, res, next);

exports.getSessionTokenByCredentials = (req, res, next) =>
  legacyAuthController.getSessionTokenByCredentials(req, res, next);

exports.getProfileByEmail = (req, res, next) =>
  legacyAuthController.getProfileByEmail(req, res, next);

exports.getMe = (req, res, next) => legacyAuthController.getMe(req, res, next);

exports.updateProfile = (req, res, next) =>
  legacyAuthController.updateProfile(req, res, next);

exports.changePassword = (req, res, next) =>
  legacyAuthController.changePassword(req, res, next);

exports.updatePushToken = (req, res, next) =>
  legacyAuthController.updatePushToken(req, res, next);

// Migration seam for new logic: module controllers should call module services.
exports.__service = authService;
