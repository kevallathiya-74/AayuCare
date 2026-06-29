# AayuCare — System & Folder Architecture

AayuCare uses a modern, modular, feature-based architecture structured to enforce clean separation of concerns, single responsibilities, and high maintainability.

---

## 1. Directory Structure

The project is structured as a monorepo containing a React Native frontend and a Node.js backend:

```text
AayuCare/
├── backend/                  # Express.js Server
│   ├── src/
│   │   ├── config/           # App, Database, Security config
│   │   ├── middleware/       # RBAC, Rate-limiting, validation
│   │   ├── modules/          # Feature domains
│   │   │   ├── auth/         # Login, registration modules
│   │   │   ├── doctor/       # Availability, scheduling, doctor profiles
│   │   │   ├── patient/      # Patient registrations, medical vitals
│   │   │   └── appointment/  # Bookings, status check-ins
│   │   └── server.js
├── frontend/                 # Expo Mobile Application
│   ├── src/
│   │   ├── components/       # Custom shared component library
│   │   │   ├── common/       # Buttons, Cards, Inputs, Badges
│   │   │   ├── layout/       # Headers, DrawerMenu, AppBars
│   │   │   └── ui/           # Skeletons, Modals, SectionHeaders
│   │   ├── config/           # Query client, Sentry setup
│   │   ├── features/         # Feature domains (Screens, state, services)
│   │   │   ├── auth/
│   │   │   ├── hospital/
│   │   │   └── patient/
│   │   ├── navigation/       # React Navigation routes & tabs
│   │   ├── store/            # Redux Toolkit global slices
│   │   ├── theme/            # HealthColors design tokens
│   │   └── utils/            # Formatters, responsive, error handlers
```

---

## 2. Separation of Concerns & Architectural Patterns

AayuCare strictly enforces the **Repository & Service Layer Pattern** to ensure no business or database logic leaks into UI controllers or views:

```
+-----------------------------------+
|            Screen View            |  (Reads Redux slices & React Query hooks)
+-----------------------------------+
                  ↓
+-----------------------------------+
|            Controller             |  (UI state orchestration, handles validations)
+-----------------------------------+
                  ↓
+-----------------------------------+
|           Service Layer           |  (API client logic, local business rules)
+-----------------------------------+
                  ↓
+-----------------------------------+
|         Repository Layer          |  (Queries the database, encapsulates raw SQL)
+-----------------------------------+
                  ↓
+-----------------------------------+
|            PostgreSQL             |  (Primary transactional data source)
+-----------------------------------+
```

### Architectural Rules
* **No Direct DB Access:** UI layers must never invoke raw database commands or access tables directly.
* **No Business Logic in UI:** Screens should only capture user events, pass them to services, and update visuals based on the returned response.
* **DTO Validation:** Validate input structures at every layer boundary using schemas (Joi or Express-validator on backend; local state schemas on frontend).

---

## 3. Frontend Architecture

* **Framework:** React Native with Expo (Development builds).
* **Routing:** React Navigation. Follows a logical flow:
  `Splash` ➡️ `RoleSelection` ➡️ `Hospital Selection` ➡️ `Role-Specific Login` ➡️ `Dashboard Tabs`.
* **State Management:**
  * **Redux Toolkit:** Manages global, persistent client state (User authentication token, user settings, system preferences).
  * **TanStack Query (React Query):** Manages server-state caching, synchronization, mutations, and automatic data refetching.
* **Responsive Layouts:** Utilizes helper utilities in `utils/responsive` to compute sizes dynamically based on device aspect ratios (supporting both standard Android mobile devices and larger tablets).

---

## 4. Backend Architecture

* **Framework:** Node.js with Express.js.
* **Database Driver:** `pg` (PostgreSQL Client) using parameterized queries to protect against SQL injections.
* **Multi-Tenancy:** Isolation achieved via `hospital_id` columns. All queries fetching records (appointments, schedules, doctors) must filter by the current tenant's ID context.
* **Error Handling:** Centralized Express middleware catches errors, normalizes them, logs details server-side (winston logger), and returns user-friendly, sanitized envelopes to the frontend client.
