/**
 * AayuCare - Better Auth Configuration
 * Production-grade authentication with Better Auth
 */

const { betterAuth } = require("better-auth");
const { Pool } = require("pg");
const bcrypt = require("bcryptjs");

// Initialize auth with PostgreSQL
let auth = null;
let authPool = null;

const initAuth = () => {
  if (auth) return auth;

  try {
    // Create PostgreSQL connection pool for Better Auth
    authPool = new Pool({
      host: process.env.POSTGRES_HOST || "localhost",
      port: parseInt(process.env.POSTGRES_PORT, 10) || 5432,
      user: process.env.POSTGRES_USER,
      password: process.env.POSTGRES_PASSWORD,
      database: process.env.POSTGRES_DB,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });

    auth = betterAuth({
      database: authPool,

      secret: process.env.BETTER_AUTH_SECRET || process.env.JWT_SECRET,
      baseURL: process.env.BACKEND_URL || "http://localhost:5000",
      basePath: "/api/auth",

      // Map to existing PostgreSQL users table
      user: {
        modelName: "users", // Use our existing 'users' table name
        fields: {
          emailVerified: "email_verified",
          createdAt: "created_at",
          updatedAt: "updated_at",
        },
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

      // Map session table fields
      session: {
        modelName: "session",
        fields: {
          userId: "user_id",
          expiresAt: "expires_at",
          ipAddress: "ip_address",
          userAgent: "user_agent",
          createdAt: "created_at",
          updatedAt: "updated_at",
        },
        expiresIn: 60 * 60 * 24 * 30, // 30 days
        updateAge: 60 * 60 * 24, // Update every 24 hours
        cookieCache: {
          enabled: true,
          maxAge: 60 * 5, // 5 minutes
        },
      },

      // Map account table fields  
      account: {
        modelName: "account", // Better Auth will create this table
        fields: {
          accountId: "account_id",
          providerId: "provider_id",
          userId: "user_id",
          accessToken: "access_token",
          refreshToken: "refresh_token",
          idToken: "id_token",
          accessTokenExpiresAt: "access_token_expires_at",
          refreshTokenExpiresAt: "refresh_token_expires_at",
          createdAt: "created_at",
          updatedAt: "updated_at",
        },
      },

      emailAndPassword: {
        enabled: true,
        requireEmailVerification: false,
        minPasswordLength: 6,
        maxPasswordLength: 128,
        // Use bcrypt for password hashing (for compatibility with seeded users)
        password: {
          hash: async (password) => {
            return await bcrypt.hash(password, 12);
          },
          verify: async ({ hash, password }) => {
            return await bcrypt.compare(password, hash);
          },
        },
      },

      advanced: {
        cookieSameSite: "none", // Changed from "lax" for mobile app compatibility
        cookieSecure: false, // Disabled for development (allow HTTP)
        useSecureCookies: false, // Disabled for development
        // Allow requests without Origin header (for React Native/Expo mobile apps)
        requireOriginHeader: false,
        // Disable CSRF protection for mobile apps (React Native/Expo)
        disableCSRFCheck: true,
        // Disable subdomain cookies
        crossSubdomainCookies: {
          enabled: false,
        },
      },

      trustedOrigins: [
        process.env.FRONTEND_URL,
        "http://localhost:3000",
        "http://localhost:19006",
        "http://localhost:8081",
        "exp://192.168.137.1:8081",
        "*", // Allow all origins for mobile app
      ].filter(Boolean),
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
