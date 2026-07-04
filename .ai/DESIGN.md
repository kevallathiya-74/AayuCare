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

**Primary palette (Teal):**
| Token | Hex | Usage |
|-------|-----|-------|
| `primary[50]` | `#F0FDFA` | Light surface tint |
| `primary[100]` | `#CCFBF1` | |
| `primary[200]` | `#99F6E4` | |
| `primary[300]` | `#5EEAD4` | Light accent / `light` |
| `primary[400]` | `#2DD4BF` | |
| `primary.main` | `#14B8A6` | Primary buttons, links, active states |
| `primary[600]` | `#0D9488` | |
| `primary.dark` | `#0F9488` | Gradient endpoint, dark accents |
| `primary[700]` | `#0F766E` | Pressed states |
| `primary[800]` | `#115E59` | |
| `primary[900]` | `#134E4A` | |
| `primary.gradient` | `['#14B8A6', '#0EA5E9']` | Brand gradient |
| `primary.surface` | `#F0FDFA` | Card/row background |

**Secondary palette (Sky Blue):**
| Token | Hex | Usage |
|-------|-----|-------|
| `secondary[50]`–`[900]` | Per Tailwind sky scale | Gradient partner, info badges |
| `secondary.main` | `#0EA5E9` | Secondary actions |
| `secondary.dark` | `#0284C7` | Gradient endpoint |

**Semantic colors:**
| Token | Hex | Usage |
|-------|-----|-------|
| `success.main` | `#22C55E` | Confirmed, completed, positive |
| `success.dark` | `#16A34A` | Pressed state |
| `warning.main` | `#F59E0B` | Pending, caution |
| `warning.dark` | `#D97706` | Pressed state |
| `error.main` | `#EF4444` | Cancelled, errors |
| `error.dark` | `#DC2626` | Pressed state, emergency gradient |
| `info.main` | `#3B82F6` | Informational |
| `info.dark` | `#2563EB` | Pressed state |

**Neutral (Slate-based):**
| Token | Hex | Usage |
|-------|-----|-------|
| `gray[50]` | `#F8FAFC` | App background |
| `gray[100]` | `#F1F5F9` | Surface alternative |
| `gray[200]` | `#E2E8F0` | Light border, dividers |
| `gray[300]` | `#CBD5E1` | Subtle border |
| `gray[400]` | `#94A3B8` | Placeholder |
| `gray[500]` | `#64748B` | Secondary text |
| `gray[600]` | `#475569` | Tertiary text |
| `gray[700]` | `#334155` | Body text |
| `gray[800]` | `#1E293B` | Dark primary text |
| `gray[900]` | `#0F172A` | Clinical headings |

**Background tokens:**
| Token | Value | Usage |
|-------|-------|-------|
| `background.primary` | `#F8FAFC` | Main app background |
| `background.surface` | `#FFFFFF` | Card/sheet surface |
| `background.overlay` | `rgba(15,23,42,0.5)` | Modal scrims (USE THIS — never hardcode `rgba(0,0,0,0.5)`) |
| `background.dark` | `#0F172A` | Dark mode base |

**Text tokens:**
| Token | Value |
|-------|-------|
| `text.primary` | `#1E293B` |
| `text.secondary` | `#64748B` |
| `text.inverse` | `#FFFFFF` |
| `text.white` | `#FFFFFF` |

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

**Font weights:** `regular (400)`, `medium (500)`, `semibold (600)`, `bold (700)`

### C. Spacing System (8pt Grid)
Consistent spacing scale ensures visual harmony and easier coding:
* `xxs`: `2px`
* `xs`: `4px`
* `sm`: `8px`
* `md`: `16px`
* `lg`: `24px`
* `xl`: `32px`
* `xxl`: `48px`
* `xxxl`: `64px`

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

### F. Animation Tokens
All animations use **Reanimated 4 + Worklets**:
- **Press feedback:** `withSpring(0.96, { damping: 15, stiffness: 300 })` — buttons scale to 0.96 on press
- **Fade in:** `withTiming(1, { duration: 300 })` — screen content entrance
- **Slide up:** `withTiming(0, { duration: 350 })` — modal/sheet entrance (translateY)
- **Skeleton pulse:** `withRepeat(withTiming(0.4, { duration: 1000 }), -1, true)` — shimmer effect
- **Transition type:** Prefer `transform`, `opacity` — avoid animating `width`, `height`, or `layout`

---

## 3. Theme Architecture

Theme lives in `frontend/src/theme/`:
```
theme/
├── healthColors.js    # 314 lines — all color tokens
├── spacing.js         # 192 lines — spacing, radius, shadow, lineHeight
├── typography.js      # ~150 lines — font sizes, weights, families
└── index.js           # 11537 bytes — barrel export, useTheme hook, ThemeProvider
```

**Usage pattern:**
```javascript
import { useTheme } from '@/theme';
const theme = useTheme();
// Access: healthColors.primary.main, spacing.md, typography.h2
```

**Critical rule:** Never import `healthColors` directly. Always use `useTheme()` for dynamic theme access. For static styles where hooks aren't available, import from `@/theme/healthColors` (but prefer the hook).

---

## 4. Common Components (27 files in `frontend/src/components/common/`)

| Component | Purpose | Key Props |
|-----------|---------|-----------|
| `Button` | Standard button | `variant: primary|secondary|ghost`, `loading`, `disabled` |
| `Card` | Surface container | `elevation: xs|sm|md|lg`, `onPress` |
| `Input` | Text input | `label`, `error`, `focusGlow`, `leftIcon` |
| `Badge` | Status indicator | `variant: success|warning|error|info|primary` |
| `Avatar` | User portrait | `size: sm|md|lg`, `source`, `fallback` |
| `EmptyState` | Empty list state | `icon`, `title`, `message`, `actionLabel`, `onAction` |
| `LoadingOverlay` | Blocking loader | `message`, `transparent` |
| `ErrorBoundary` | Error boundary | `fallback` |
| `ErrorRecovery` | Recovery UI | `message`, `onRetry`, `onGoBack` |
| `NetworkStatusIndicator` | Connectivity | Auto-detects offline/online |
| `SearchField` | Search input | `onChangeText`, `placeholder` |
| `Tabs` | Tab navigation | `tabs[]`, `activeTab`, `onChange` |
| `ListItem` | Standard row | `title`, `subtitle`, `leftIcon`, `rightIcon`, `onPress` |
| `ProgressBar` | Progress | `progress: 0–1`, `variant` |
| `FilterComponents` | Filters | Chips, dropdowns, date range |
| `LanguageSelector` | Lang picker | `languages[]`, `selected`, `onChange` |
| `CustomIcons` | Icon wrapper | `name`, `size`, `gradient` |
| `DynamicIcon` | Theme-aware | Auto-dark-mode icon |
| `ChatComposer` | Message input | `onSend`, `placeholder` |
| `AITagline` | AI label | `text`, `icon` |
| `CompactActionCard` | Compressed card | `icon`, `title`, `subtitle`, `onPress` |

---

## 5. Accessible Touch Targets
In compliance with WCAG and Android/iOS human interface guidelines, all interactive elements must have a minimum touch target size of **44dp**. If an element is smaller visually (e.g. 24dp icons), a `hitSlop` must be declared to expand the hit target boundaries (e.g. `hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}`).

---

## 6. Modal & Overlay Standards

### Modal Backdrop
```javascript
// ✅ CORRECT — always use theme token
style={{
  backgroundColor: healthColors.background.overlay,
  // ← NEVER use rgba(0,0,0,0.5) directly
}}
```

### Glassmorphism
```javascript
// ✅ CORRECT — for glass-like button backgrounds
theme.withOpacity(healthColors.text.white, 0.16)
```

---

## 7. Coding Standards for UI
1. **Zero hardcoded hex values** — every color must come from `healthColors` or `theme` tokens
2. **Zero inline styles** — all styles in `StyleSheet.create()`
3. **Modal overlays** — always use `healthColors.background.overlay`
4. **rgba transparency** — always use `theme.withOpacity(token, alpha)`
5. **Gradient endpoints** — use `primary.main` to `primary.dark` for brand gradients

---

## 8. Indian User Experience Considerations
1. **Multi-Linguistic Support:** AayuCare integrates dynamic language localization (LanguageSelector) for regional languages. Labels must never overlap or break layouts when translated.
2. **Budget Android Optimization:** Low-end screens have poor color reproduction. Ensure high-contrast ratios between text and surfaces (at least 4.5:1).
3. **Data Formatting:** Phone numbers must display as `+91 XXXXX XXXXX`, and currencies must utilize the Indian Rupee symbol (`₹`) formatted according to Indian numbering standards (e.g. `₹1,00,000` instead of `₹100,000`).
4. **Structured Vitals:** Display vitals metrics using standard indicators familiar to Indian patients (e.g. Blood Sugar in mg/dL, Temperature in °F, Weight in kg).
