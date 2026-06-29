# AayuCare — Design System & UX Standards

The AayuCare design system is a comprehensive visual, structural, and interactive framework engineered to provide a premium, accessible, and high-performance user experience for healthcare environments in India.

---

## 1. Design Philosophy
* **Clinical Trust:** Establish credibility through precise alignments, clean borders, and soft gradients.
* **Calm & Care:** Promote stress-free usage with pleasant color hues, soft lighting (shadow scales), and spacious padding.
* **Efficiency-First:** Streamline complex operations (like prescription creation or patient registration) to minimize clicks and cognitive load.
* **Inclusivity:** Maintain accessibility across device tiers (low-end Android devices) and varying user capabilities.

---

## 2. Brand Identity & Design Tokens

### A. Color System
AayuCare utilizes a premium, healthcare-tailored SaaS color palette:
* **Primary (SaaS Teal):** `#14B8A6` — trust, clinical precision, and healing.
* **Secondary (Sky Blue):** `#0EA5E9` — clarity, care, and digital-first innovation.
* **Neutrals (Slate-based scale):**
  * `gray50`: `#F8FAFC` (app background)
  * `gray100`: `#F1F5F9` (surface alternative)
  * `gray200`: `#E2E8F0` (light border)
  * `gray500`: `#64748B` (secondary text)
  * `gray800`: `#1E293B` (dark primary text)
  * `gray900`: `#0F172A` (clinical background text)
* **Semantics:**
  * `success`: `#22C55E` (confirmed appointments, successful actions)
  * `warning`: `#F59E0B` (pending states, warning notifications)
  * `error`: `#EF4444` (cancelled states, alerts, errors)
  * `info`: `#3B82F6` (informational highlights, billing details)

### B. Typography Scale
Optimized headings and clear bodies for readability under bright or dim lighting conditions:
* **Display Large:** `48px` (headings / metrics highlight)
* **h1:** `32px` (hero page titles)
* **h2:** `28px` (section headers)
* **h3:** `24px` (card headers)
* **bodyLarge:** `16px` (primary body / labels)
* **bodyMedium:** `14px` (secondary body / descriptions)
* **bodySmall:** `12px` (meta details / timestamps)
* **overline:** `10px` (badge labels / uppercase highlights)

### C. Spacing System (8pt Grid)
Consistent spacing scale ensures visual harmony and easier coding:
* `xs`: `4px`
* `sm`: `8px`
* `md`: `16px`
* `lg`: `24px`
* `xl`: `32px`
* `xxl`: `48px`

### D. Radius System
* `xs`: `4px` (small badges)
* `sm`: `8px` (time chips / status indicators)
* `md`: `12px` (buttons / inputs / quick actions)
* `lg`: `16px` (main cards / list wrappers)
* `xl`: `20px` (modals / dropdowns)
* `full`: `9999px` (circular avatars / pill badges)

### E. Elevation & Shadow System (Slate-Based Soft Shadows)
Avoid solid black shadows. Shadows must be soft and colored using `#0F172A`:
* `xs`: `shadowOpacity: 0.04, shadowRadius: 2, elevation: 1`
* `sm`: `shadowOpacity: 0.06, shadowRadius: 3, elevation: 2`
* `md`: `shadowOpacity: 0.08, shadowRadius: 6, elevation: 3` (standard card shadow)
* `lg`: `shadowOpacity: 0.10, shadowRadius: 12, elevation: 5`
* `xl`: `shadowOpacity: 0.14, shadowRadius: 20, elevation: 8`

---

## 3. Accessible Touch Targets
In compliance with WCAG and Android/iOS human interface guidelines, all interactive elements must have a minimum touch target size of **44dp**. If an element is smaller visually (e.g. 24dp icons), a `hitSlop` must be declared to expand the hit target boundaries (e.g. `hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}`).

---

## 4. Indian User Experience Considerations
1. **Multi-Linguistic Support:** AayuCare integrates dynamic language localization (LanguageSelector) for regional languages. Labels must never overlap or break layouts when translated.
2. **Budget Android Optimization:** Low-end screens have poor color reproduction. Ensure high-contrast ratios between text and surfaces (at least 4.5:1).
3. **Data Formatting:** Phone numbers must display as `+91 XXXXX XXXXX`, and currencies must utilize the Indian Rupee symbol (`₹`) formatted according to Indian numbering standards (e.g. `₹1,00,000` instead of `₹100,000`).
4. **Structured Vitals:** Display vitals metrics using standard indicators familiar to Indian patients (e.g. Blood Sugar in mg/dL, Temperature in °F, Weight in kg).
