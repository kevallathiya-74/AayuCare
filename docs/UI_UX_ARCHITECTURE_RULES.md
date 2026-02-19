# 🎨 AayuCare - Global UI/UX Architecture Rules
Version: 1.0
Scope: Entire Mobile Application (React Native - Expo)
Target: Production-Level Healthcare Application

---

# 1️⃣ CORE DESIGN PRINCIPLES

## 1.1 Healthcare-Grade UI

The app must feel:
- Clean
- Trustworthy
- Professional
- Calm
- Clinical but modern

Avoid:
- Loud colors
- Heavy gradients
- Cartoonish icons
- Excessive shadows

---

# 2️⃣ DESIGN SYSTEM STRUCTURE

All UI must use centralized design tokens.

Required files:

src/theme/

Never hardcode:
- Colors
- Font sizes
- Spacing
- Border radius

---

# 3️⃣ COLOR SYSTEM

## 3.1 Brand Color Rules

- Primary: Used for buttons, active states
- Secondary: Accent elements
- Success: Confirmed / Ready
- Warning: Pending / Attention
- Danger: Critical / Cancelled
- Neutral: Background, borders, inactive

Status Colors:
- Pending → Warning (Orange)
- Preparing → Info (Blue)
- Ready → Success (Green)
- Dispensed → Neutral or Success-muted

No inline hex codes allowed in components.

---

# 4️⃣ SPACING SYSTEM (8-Point Grid)

All layout spacing must follow:

4px
8px
12px
16px
20px
24px
32px

Rules:
- Screen padding: 16px
- Card padding: 16px
- Vertical gap between cards: 12px
- Section spacing: 24px

No random margins.

---

# 5️⃣ TYPOGRAPHY SYSTEM

Hierarchy must be consistent:

- Screen Title → 20px Bold
- Section Title → 18px SemiBold
- Card Title → 16px Medium
- Body Text → 14px Regular
- Caption → 12px Regular (Muted)

Avoid:
- Mixing too many font weights
- Overusing bold text

---

# 6️⃣ COMPONENT DESIGN RULES

## 6.1 Cards

- Border radius: 12px
- Soft shadow
- Padding: 16px
- Clear hierarchy
- No overcrowding

## 6.2 Buttons

- Height: 44–48px
- Border radius: 8–12px
- Clear primary/secondary distinction
- Disabled state visible

## 6.3 Status Badges

- Small rounded pill
- Clear color contrast
- Consistent padding
- No outline-only for active status

---

# 7️⃣ EMPTY STATE DESIGN

Empty state must include:

- Relevant icon
- Clear title
- Short description
- Optional action button

Avoid:
- Excessive vertical empty space
- Overly large icons

---

# 8️⃣ LIST & DATA DENSITY

Healthcare apps require information clarity.

Rules:
- Avoid oversized UI elements.
- Show meaningful data first.
- Group related information.
- Use dividers subtly.
- No decorative clutter.

---

# 9️⃣ RESPONSIVE RULES

App must support:

- Small Android phones
- Large Android phones
- iPhones
- Tablets (basic support)

Rules:
- Use flex layout properly.
- Avoid fixed heights.
- Avoid absolute positioning.
- Test with large font scaling.

---

# 🔟 NAVIGATION CONSISTENCY

- Header height consistent.
- Back button always left.
- Action icon always right.
- Titles centered.
- Bottom navigation icons aligned and balanced.

---

# 1️⃣1️⃣ ACCESSIBILITY RULES

- Minimum touch target: 44px
- Proper contrast ratio
- Avoid light grey text on white
- Support dynamic text scaling

---

# 1️⃣2️⃣ LOADING & ERROR STATES

Every data screen must handle:

- Loading state
- Error state
- Empty state
- Success state

Never leave blank screens.

---

# 1️⃣3️⃣ ANIMATION RULES

- Subtle transitions only.
- Avoid heavy motion.
- Use for:
  - Screen transitions
  - Status change feedback
  - Pull-to-refresh

No unnecessary animations.

---

# 1️⃣4️⃣ CONSISTENCY RULE

Before merging any new screen:

Checklist:
- Uses theme file
- Uses spacing system
- Uses typography hierarchy
- No hardcoded colors
- Status badge follows rules
- Empty state implemented
- Works on small device

---

# 🚫 STRICTLY FORBIDDEN

- Inline color values
- Random margins
- Overlapping UI
- Unaligned icons
- Inconsistent badge styles
- Mixed shadow styles
- UI copied without theme alignment

---

# 🎯 FINAL GOAL

AayuCare UI must feel:

- Medical-grade
- Clean
- Structured
- Scalable
- Consistent across all modules
- Production-level quality
