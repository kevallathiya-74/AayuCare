# AayuCare — UI/UX Rules & Guidelines

To ensure a premium, unified visual experience and a friction-free healthcare journey for Indian doctors, administrators, and patients, all components and screens must follow these rules.

---

## 1. UI Philosophy & Theme Tokens
AayuCare represents professional, premium clinical SaaS. Avoid generic templates, childish illustrations, or plain flat tables.
* **Core Palette:** 
  * Primary: SaaS Teal (`#14B8A6`)
  * Secondary: Sky Blue (`#0EA5E9`)
  * Neutral: Slate-based scale (`#F8FAFC`, `#0F172A`)
  * Success: `#22C55E`, Warning: `#F59E0B`, Error: `#EF4444`
* **Border Radii:** Standardize on `borderRadius: 12` for buttons/inputs, `borderRadius: 16` for main cards, and `borderRadius: 20` for modals.
* **Shadows:** Use soft, tinted shadows (`#0F172A` color, low opacity). Avoid black elevation.

---

## 2. Component Standards

### A. Buttons
* Always use `Button` from `@/components/common`.
* **States:** Ensure standard styling for active, focused, disabled, and loading states.
* **Feedback:** Use spring-based press animations to provide clean tactile interactions.

### B. Custom Inputs
* Labels must be floating or placed clearly above the input fields.
* **Focused State:** Must display a subtle focus glow (`focusGlow` color) to make keyboard navigation intuitive.
* **Validation:** Provide distinct validation colors (Teal for success, Red for error) accompanied by helpful, accessible text messages.

### C. Cards
* Group related clinical information in elevated cards (`Card` component).
* Keep cards spaced out using theme spacing tokens (`spacing.md` or `spacing.lg`).

---

## 3. Screen State Patterns

### A. Loading States
* Never show an empty white screen while waiting for data.
* **Skeleton Loaders:** Use `SkeletonLoader` to render placeholder structures that align with the page's actual visual components.
* For quick transactions or blocking actions, overlay a transparent blurred loading state (`LoadingOverlay`).

### B. Empty States
* When lists are empty (e.g. no appointments today), use the `EmptyState` component.
* Always present a clear title, a friendly explanation, a representative Lucide icon, and a primary call-to-action button (e.g. "Register Patient", "Book Slot").

### C. Error States
* Catch exceptions gracefully using `ErrorBoundary`.
* Render friendly message states (`ErrorRecovery` component) explaining what went wrong and displaying a "Retry" or "Go Back" action button.

---

## 4. Navigation & Flow Guidelines
* **Role Gating:** Login must route strictly to role-specific dashboard stacks.
* **Back Operations:** Implement safe back handlers that verify unsaved changes inside forms before discarding states.
* **Drawer Navigation:** Side drawers must be slide-animated, clean, and organized into logical system settings sections.

---

## 5. Indian Healthcare UX Guidelines
* **UPI-Ready Billing:** Always present clear payment breakdowns with quick options matching standard Indian patterns.
* **Aadhaar Format:** Style Aadhaar input numbers in structured four-digit groups: `XXXX XXXX XXXX` for readability.
* **Rupee Symbol:** Use the correct `₹` symbol instead of `Rs.` or `INR`.
* **Multi-Language Support:** All copy must be localized. Never hardcode strings in screen templates; pull from localized resources.
