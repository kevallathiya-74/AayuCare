#!/usr/bin/env node
"use strict";

/**
 * Lightweight API smoke test for status code validation.
 *
 * Usage:
 *   API_BASE_URL=http://localhost:5000 node scripts/smokeStatusCodes.js
 */

const BASE_URL = (process.env.API_BASE_URL || "http://localhost:5000").replace(/\/$/, "");

const checks = [
  {
    name: "Health endpoint",
    method: "GET",
    path: "/health",
    expected: [200],
  },
  {
    name: "Not-found endpoint",
    method: "GET",
    path: "/__smoke_not_found__",
    expected: [404],
  },
  {
    name: "Auth login validation",
    method: "POST",
    path: "/api/auth/login",
    body: {},
    expected: [400, 401, 422],
  },
];

const now = () => new Date().toISOString();

const request = async (item) => {
  const start = Date.now();
  const res = await fetch(`${BASE_URL}${item.path}`, {
    method: item.method,
    headers: {
      "Content-Type": "application/json",
    },
    body: item.body ? JSON.stringify(item.body) : undefined,
  });
  const duration = Date.now() - start;
  return { status: res.status, duration };
};

(async () => {
  console.log(`[${now()}] Running status smoke checks against ${BASE_URL}`);

  let hardFailure = false;

  for (const check of checks) {
    try {
      const { status, duration } = await request(check);
      const ok = check.expected.includes(status);
      const label = ok ? "PASS" : "FAIL";

      console.log(
        `${label} | ${check.method.padEnd(6)} ${check.path.padEnd(28)} -> ${status} (${duration}ms)`
      );

      if (!ok) {
        hardFailure = true;
      }
    } catch (error) {
      hardFailure = true;
      console.log(
        `FAIL | ${check.method.padEnd(6)} ${check.path.padEnd(28)} -> request error: ${error.message}`
      );
    }
  }

  if (hardFailure) {
    console.error("Status smoke checks failed.");
    process.exit(1);
  }

  console.log("Status smoke checks passed.");
})();
