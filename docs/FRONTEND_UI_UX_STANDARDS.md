# AayuCare Frontend UI UX Standards

Version: 4.1
Last Updated: 2026-03-25
Scope: Mobile UI and UX standards for iOS and Android

## 1. UX Vision

The product experience must be:
- trustworthy and clinically clear
- responsive and low-friction
- consistent across iOS and Android

Avoid visual noise and decorative clutter in healthcare-critical flows.

## 2. Design Token Enforcement

All UI must consume centralized tokens for:
- color
- typography
- spacing
- radius
- elevation

Rules:
- no hardcoded hex values in feature screens
- no random spacing values outside spacing scale

## 3. Spacing and Layout System

Use 8-point based spacing scale:
- 4, 8, 12, 16, 20, 24, 32

Defaults:
- screen horizontal padding: 16
- card padding: 16
- section gap: 24
- row/card vertical gap: 12

## 4. Typography Hierarchy

- screen title: 20 bold
- section title: 18 semibold
- card title: 16 medium
- body: 14 regular
- caption/meta: 12 regular

Rules:
- keep hierarchy consistent across modules
- avoid excessive bold usage

## 5. Core Component Standards

### 5.1 Cards
- clear hierarchy and grouping
- readable data density
- no overcrowded content blocks

### 5.2 Buttons
- height 44 to 48
- distinct primary/secondary appearance
- visible disabled and loading states

### 5.3 Status indicators
- semantic colors only
- consistent shape and paddings
- text contrast must remain accessible

## 6. Required Screen States

Every data-driven screen must implement:
- loading (prefer skeleton rows/cards)
- empty (clear title/message, optional action)
- error (safe message with retry)
- success

No blank render states in production.

## 7. Accessibility Requirements

- minimum touch target: 44x44
- semantic accessibility labels/hints on critical controls
- support dynamic type/text scaling
- maintain readable contrast in all themes

## 8. Navigation and Interaction

- consistent header behavior and back affordance
- safe fallback navigation for deep links and edge routes
- no navigation traps
- subtle transitions only; avoid distracting motion

## 9. Cross-Platform Behavior Rules

- verify keyboard avoiding and form interaction parity on iOS and Android
- use platform-appropriate date/time picker behavior
- validate gesture/back behavior under nested navigators

## 10. Performance UX Standards

- preload high-traffic routes for faster first open
- prefetch critical query data after auth when appropriate
- optimize FlatList with pagination and rendering props
- avoid full-screen blocking spinners for large list loads

## 11. UI Definition of Done

A screen is complete only when:
- token-compliant visual system is used
- all required states are implemented
- accessibility checks pass
- interaction parity is verified on iOS and Android
- perceived performance is acceptable on median test devices

## 12. SaaS Mobile Production Gate

Release approval for mobile surfaces requires:
- Evidence of iOS and Android parity for navigation, keyboard, form submission, and loading/error states.
- API integration checks aligned to backend verification outputs.
- Server-state behavior aligned with current React Query guidance validated via `mcp_context7_get-library-docs`.

Cross-layer SaaS compliance checklist is documented in:
- `SAAS_PRODUCTION_RULES_AND_REGULATIONS.md`
