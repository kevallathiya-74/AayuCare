# AGENTS.md

# AayuCare AI Agent Instructions

## Project Overview

AayuCare is an AI-powered healthcare SaaS platform that connects:

- Hospitals
- Doctors
- Patients

Current Development Phase:

- Hospital Module ONLY

Do not implement or modify the User Module unless explicitly requested.

---

# Project Documentation

Always read these files before making any changes:

.ai/

- PRODUCT.md
- DESIGN.md
- ARCHITECTURE.md
- DATABASE.md
- SECURITY.md
- UI_UX_RULES.md

Also load every available project skill from:

.agents/skills/

These documents define the project's architecture, standards, workflows, and design language.

---

# Technology Stack

## Frontend

- React Native
- Expo Development Build
- TypeScript
- React Navigation
- Redux Toolkit
- TanStack Query

## Backend

- Node.js
- Express.js

## Database

- PostgreSQL ONLY

## Future Technologies

- Prisma
- Socket.IO
- Twilio
- OpenAI

---

# Build & Development

Install dependencies:

```bash
npm install
```

Frontend:

```bash
cd frontend
npm start
```

Backend:

```bash
cd backend
npm run dev
```

Run linting before finishing work.

Run type checking before finishing work.

Run tests if available.

---

# AI Execution Workflow

Before writing or modifying code:

1. Read AGENTS.md.
2. Read every file inside `.ai/`.
3. Load all project skills from `.agents/skills/`.
4. Understand the existing implementation.
5. Create a short implementation plan.
6. Make incremental changes.
7. Validate changes.
8. Summarize completed work.

Never skip project analysis.

---

# Architecture Rules

Always follow:

- Feature-based Architecture
- Repository Pattern
- Service Layer Pattern
- DTO Validation
- RBAC Authorization
- Centralized Error Handling
- Separation of Concerns
- Single Responsibility Principle

Never:

- Put business logic inside UI screens.
- Put SQL queries inside controllers.
- Access the database directly from UI code.

Required flow:

```
Screen
↓

Controller

↓

Service

↓

Repository

↓

PostgreSQL
```

---

# Database Rules

Single source of truth:

- PostgreSQL

Forbidden:

- MongoDB
- Mongoose
- Redis
- Mixed databases

If MongoDB code is found:

1. Mark it for migration.
2. Recommend a PostgreSQL equivalent.
3. Do not create new MongoDB code.

---

# Current Refactor Objectives

Highest priority:

1. Remove MongoDB completely.
2. Remove Redis completely.
3. Migrate everything to PostgreSQL.
4. Remove duplicate services.
5. Remove duplicate repositories.
6. Remove hardcoded data.
7. Remove startup seed logic.
8. Remove production mock data.
9. Simplify navigation.
10. Improve scalability.

---

# Hospital Module Scope

## Admin

- Doctor Management
- Patient Management
- Appointment Management
- Reports
- Analytics
- Settings

## Doctor

- Appointments
- Prescriptions
- Patient Records
- Reports

## Patient

- Appointments
- Reports
- Prescriptions
- Profile

Hospital Module is the only active development target.

---

# Frontend Standards

Goals:

- Premium SaaS UI
- Healthcare-first UX
- Indian User Friendly
- Accessibility First
- Mobile First
- Responsive
- Fast

Avoid:

- Generic AI layouts
- Overcrowded screens
- Deep nesting
- Hardcoded colors
- Duplicate components

Design Tokens:

Primary: #14B8A6

Secondary: #0EA5E9

Background: #F8FAFC

Surface: #FFFFFF

Success: #22C55E

Warning: #F59E0B

Error: #EF4444

---

# Navigation Rules

Preferred flow:

Splash

↓

Role Selection

↓

Hospital

↓

Admin Login

Doctor Login

Patient Login

↓

Dashboard

Avoid duplicated navigators.

Avoid unnecessary nesting.

---

# Security Rules

Always:

- Validate input.
- Sanitize user data.
- Use parameterized queries.
- Encrypt sensitive data.
- Protect PHI.
- Protect medical records.

Never:

- Log secrets.
- Log tokens.
- Expose internal errors.
- Store plaintext passwords.

---

# Code Generation Rules

Generate:

- Production-ready code
- Modular code
- Maintainable code
- Reusable code
- Scalable code
- Typed code
- Validated code

Never generate:

- Placeholder implementations
- TODO business logic
- Fake production APIs
- Mock production data

---

# Code Review Rules

Before completing work:

Review:

- Architecture
- Performance
- Security
- Scalability
- Maintainability
- Readability

Remove:

- Dead code
- Duplicate logic
- Unused imports
- Unused dependencies
- Large components
- Large functions

---

# Definition of Done

A task is complete only when:

- Project conventions are followed.
- No new technical debt is introduced.
- No duplicate code exists.
- No hardcoded production values exist.
- Code builds successfully.
- Type checking passes.
- Linting passes.
- Existing functionality remains intact.
- The solution is production-ready.

---

# Project Goal

Build a scalable healthcare SaaS platform suitable for:

- Google Play Store
- Apple App Store
- Hospital Deployment
- Multi-hospital Scalability

Prioritize:

Quality > Maintainability > Scalability > Performance > Speed