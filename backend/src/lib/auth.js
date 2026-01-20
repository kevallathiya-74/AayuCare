/**
 * AayuCare - Better Auth Configuration
 * Production-grade authentication with Better Auth
 */

const { betterAuth } = require("better-auth");
const { mongodbAdapter } = require("better-auth/adapters/mongodb");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

// Initialize auth after MongoDB connection
let auth = null;

const initAuth = () => {
  if (auth) return auth;

  try {
    const db = mongoose.connection.getClient().db("test");

    auth = betterAuth({
      database: mongodbAdapter(db),

      secret: process.env.BETTER_AUTH_SECRET || process.env.JWT_SECRET,
      baseURL: process.env.BACKEND_URL || "http://localhost:5000",
      basePath: "/api/auth",

      emailAndPassword: {
        enabled: true,
        requireEmailVerification: false,
        minPasswordLength: 6,
        maxPasswordLength: 128,
        // Use bcrypt for password hashing (for compatibility with migrated users)
        password: {
          hash: async (password) => {
            return await bcrypt.hash(password, 12);
          },
          verify: async ({ hash, password }) => {
            return await bcrypt.compare(password, hash);
          },
        },
      },

      session: {
        expiresIn: 60 * 60 * 24 * 30, // 30 days
        updateAge: 60 * 60 * 24, // Update every 24 hours
        cookieCache: {
          enabled: true,
          maxAge: 60 * 5, // 5 minutes
        },
      },

      advanced: {
        cookieSameSite: "lax",
        cookieSecure: process.env.NODE_ENV === "production",
        useSecureCookies: process.env.NODE_ENV === "production",
      },

      trustedOrigins: [
        process.env.FRONTEND_URL,
        "http://localhost:3000",
        "http://localhost:19006",
        "exp://192.168.137.1:8081",
      ].filter(Boolean),

      user: {
        additionalFields: {
          userId: {
            type: "string",
            required: false,
            input: true,
          },
          role: {
            type: "string",
            required: false,
            defaultValue: "patient",
            input: true,
          },
          hospitalId: {
            type: "string",
            required: false,
            input: true,
          },
          hospitalName: {
            type: "string",
            required: false,
            input: true,
          },
          phone: {
            type: "string",
            required: false,
            input: true,
          },
          dateOfBirth: {
            type: "date",
            required: false,
            input: true,
          },
          gender: {
            type: "string",
            required: false,
            input: true,
          },
          specialization: {
            type: "string",
            required: false,
            input: true,
          },
          qualification: {
            type: "string",
            required: false,
            input: true,
          },
          experience: {
            type: "number",
            required: false,
            input: true,
          },
          consultationFee: {
            type: "number",
            required: false,
            input: true,
          },
          department: {
            type: "string",
            required: false,
            input: true,
          },
          address: {
            type: "string",
            required: false,
            input: true,
          },
          avatar: {
            type: "string",
            required: false,
            input: true,
          },
          bloodGroup: {
            type: "string",
            required: false,
            input: true,
          },
          isActive: {
            type: "boolean",
            required: false,
            defaultValue: true,
            input: false,
          },
          isVerified: {
            type: "boolean",
            required: false,
            defaultValue: false,
            input: false,
          },
        },
      },
    });

    return auth;
  } catch (error) {
    console.error("Better Auth initialization error:", error);
    throw error;
  }
};

// Export getter function
const getAuth = () => {
  if (!auth) {
    return initAuth();
  }
  return auth;
};

module.exports = { getAuth, initAuth };
