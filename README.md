# AayuCare

Production-grade, SaaS-ready, full-stack healthcare platform with:
- Node.js + Express backend
- PostgreSQL + MongoDB + Redis data architecture
- React Native + Expo mobile frontend
- Better Auth based authentication and role-aware workflows

## Product Vision

AayuCare is built as a multi-role healthcare product for:
- Patients: appointments, records, prescriptions, profile, wellness modules
- Doctors: schedule and patient workflow management
- Admin and hospital operations: users, reports, activities, monitoring

## Repository Structure

- [backend](backend): API server, auth, data access, business logic, scripts
- [frontend](frontend): Expo React Native mobile app
- [docs](docs): architecture and implementation documents

## Tech Stack

### Backend
- Node.js 18+
- Express
- Better Auth
- PostgreSQL via pg
- MongoDB via mongoose and mongodb
- Redis via ioredis
- Validation and security: Joi, express-validator, helmet, express-rate-limit

### Frontend
- React Native 0.81.x
- Expo SDK 54
- Redux Toolkit + React Query
- React Navigation
- Lucide icon system

## Core Architecture

### Data Strategy
- PostgreSQL: transactional source of truth for users, auth/session-linked relational data
- MongoDB: document-oriented healthcare records and flexible domains
- Redis: cache/session acceleration and hot-path optimization

### Security Strategy
- Role-based authorization and hospital scope isolation
- Environment-based secrets and production-safe defaults
- Rate limiting and hardened middleware stack

## Local Development Setup

## Prerequisites
- Node.js 18 or newer
- npm 9 or newer
- PostgreSQL running locally or cloud endpoint
- MongoDB local or Atlas cluster
- Redis local or managed service

## 1) Backend setup

1. Install dependencies:
    cd backend
    npm install

2. Configure environment:
- Copy [backend/.env.example](backend/.env.example) to backend/.env
- Fill all required secrets and URLs

3. Initialize and seed optional local data:
    npm run init:postgres
    npm run seed:db

4. Start backend:
    npm run dev

Backend health endpoints typically run on:
- /api/readyz
- /api/healthz (if enabled in server)

## 2) Frontend setup

1. Install dependencies:
    cd frontend
    npm install

2. Start Expo:
    npm run start

3. Run app:
    npm run android
    npm run ios

## Production and SaaS Readiness

### Required production principles
- Never commit backend/.env
- Keep only placeholders in [backend/.env.example](backend/.env.example)
- Use managed secrets in hosting provider environment settings
- Rotate all credentials that have ever been exposed
- Enforce TLS everywhere (client, API, database, cache)
- Restrict CORS to known frontend domains

### Deployment baseline

Backend deployment is preconfigured via:
- [backend/render.yaml](backend/render.yaml)

Recommended production services:
- API hosting: Render web service (or equivalent)
- PostgreSQL: managed cloud Postgres (Neon or equivalent)
- MongoDB: Atlas cluster
- Redis: Upstash or managed Redis

## Build and Verification Commands

### Backend checks
- Run smoke status checks:
    cd backend
    npm run smoke:status

- Run method matrix checks:
    npm run smoke:methods

- Run API collection tests:
    npm run test:api

### Frontend checks
- Production export:
    cd frontend
    npx expo export --platform android

## Security Checklist Before Go-Live

- Rotate JWT secrets and Better Auth secret
- Set production DATABASE_URL and REDIS_URL securely
- Remove placeholder Twilio and email credentials
- Verify log redaction for sensitive fields
- Confirm rate limits and brute-force protection values

## Contributor Workflow

1. Create feature branch from main
2. Keep commits scoped and descriptive
3. Run backend and frontend validation before opening PR
4. Resolve merge conflicts locally and re-run smoke checks
5. Update docs when behavior or configuration changes

## Important Notes

- This is a healthcare-oriented platform. Treat data handling, auditing, and access control as first-class requirements.
- If any credential appears in source control history, rotate it immediately and replace with secure environment configuration.

## License

Private project. Use according to team and organization policy.
