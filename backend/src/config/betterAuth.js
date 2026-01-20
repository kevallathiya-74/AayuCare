const { betterAuth } = require("better-auth");
const { mongodbAdapter } = require("better-auth/adapters/mongodb");
const mongoose = require("mongoose");

/**
 * Better Auth Configuration
 * Healthcare-grade authentication with role-based access control
 */
const auth = betterAuth({
  database: mongodbAdapter(mongoose.connection),

  // Email and password authentication
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false, // Set to true in production with email service
    minPasswordLength: 6,
    maxPasswordLength: 128,
  },

  // Session configuration
  session: {
    expiresIn: 60 * 60 * 24 * 30, // 30 days
    updateAge: 60 * 60 * 24, // Update session every 24 hours
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5, // 5 minutes cache
    },
  },

  // Security settings
  advanced: {
    cookieSameSite: "lax",
    cookieSecure: process.env.NODE_ENV === "production",
    crossSubDomainCookies: {
      enabled: false,
    },
    useSecureCookies: process.env.NODE_ENV === "production",
  },

  // Base URL configuration
  baseURL: process.env.BACKEND_URL || "http://localhost:5000",
  basePath: "/api/auth",

  // Trusted origins for CORS
  trustedOrigins: [
    process.env.FRONTEND_URL,
    "http://localhost:3000",
    "http://localhost:19006",
    "exp://192.168.137.1:8081",
  ].filter(Boolean),

  // Rate limiting
  rateLimit: {
    enabled: true,
    window: 60, // 60 seconds
    max: 100, // 100 requests per window
  },

  // User schema customization for healthcare roles
  user: {
    additionalFields: {
      userId: {
        type: "string",
        required: true,
        unique: true,
        index: true,
      },
      role: {
        type: "string",
        required: true,
        defaultValue: "patient",
        enum: ["admin", "doctor", "patient", "super_admin"],
      },
      hospitalId: {
        type: "string",
        required: false,
        index: true,
      },
      hospitalName: {
        type: "string",
        required: false,
      },
      phone: {
        type: "string",
        required: true,
      },
      // Doctor fields
      specialization: {
        type: "string",
        required: false,
      },
      qualification: {
        type: "string",
        required: false,
      },
      experience: {
        type: "number",
        required: false,
      },
      consultationFee: {
        type: "number",
        required: false,
      },
      // Patient fields
      dateOfBirth: {
        type: "date",
        required: false,
      },
      gender: {
        type: "string",
        required: false,
      },
      bloodGroup: {
        type: "string",
        required: false,
      },
      address: {
        type: "string",
        required: false,
      },
      // Admin fields
      department: {
        type: "string",
        required: false,
      },
      // Common fields
      isActive: {
        type: "boolean",
        defaultValue: true,
      },
      isVerified: {
        type: "boolean",
        defaultValue: false,
      },
      tokenVersion: {
        type: "number",
        defaultValue: 0,
      },
      lastLogin: {
        type: "date",
        required: false,
      },
    },
  },

  // Account management
  account: {
    enabled: true,
    accountLinking: {
      enabled: false, // Disable for security in healthcare
    },
  },
});

module.exports = { auth };
