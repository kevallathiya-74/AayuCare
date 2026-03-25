#!/usr/bin/env node
"use strict";

/**
 * Method matrix smoke test.
 * Verifies endpoints return sane status codes and never 5xx for basic probes.
 *
 * Usage:
 *   API_BASE_URL=http://localhost:5000 node scripts/e2eMethodMatrix.js
 */

const BASE_URL = (process.env.API_BASE_URL || "http://localhost:5000").replace(/\/$/, "");

const probes = [
  { method: "GET", path: "/health" },
  { method: "GET", path: "/api/patients/search" },
  { method: "POST", path: "/api/auth/login", body: {} },
  { method: "PATCH", path: "/api/auth/login", body: {} },
  { method: "DELETE", path: "/api/notifications/non-existent-id" },
];

const performProbe = async (probe) => {
  const started = Date.now();
  const response = await fetch(`${BASE_URL}${probe.path}`, {
    method: probe.method,
    headers: {
      "Content-Type": "application/json",
    },
    body: probe.body ? JSON.stringify(probe.body) : undefined,
  });

  return {
    status: response.status,
    duration: Date.now() - started,
  };
};

(async () => {
  console.log(`Running method matrix against ${BASE_URL}`);

  let hasFailure = false;

  for (const probe of probes) {
    try {
      const result = await performProbe(probe);
      const isServerError = result.status >= 500;
      const label = isServerError ? "FAIL" : "PASS";

      console.log(
        `${label} | ${probe.method.padEnd(6)} ${probe.path.padEnd(34)} -> ${result.status} (${result.duration}ms)`
      );

      if (isServerError) {
        hasFailure = true;
      }
    } catch (error) {
      hasFailure = true;
      console.log(
        `FAIL | ${probe.method.padEnd(6)} ${probe.path.padEnd(34)} -> request error: ${error.message}`
      );
    }
  }

  if (hasFailure) {
    console.error("Method matrix detected failures.");
    process.exit(1);
  }

  console.log("Method matrix passed.");
})();
