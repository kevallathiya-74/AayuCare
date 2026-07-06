# AayuCare UI/UX & Design Standards

**Last Updated**: 2026-07-04
**Framework**: React Native + Expo (SDK 55)
**Styling**: React Native StyleSheet + React Native Paper

## 1. Design Tokens (Strict Enforcement)
Never use hardcoded hex colors or arbitrary spacing values in components. All styling MUST reference the design tokens defined in `src/theme/`.

### Colors (Palette)
- **Primary**: `#14B8A6` (Teal)
- **Secondary**: `#0EA5E9` (Sky Blue)
- **Background**: `#F8FAFC` (Slate 50)
- **Surface**: `#FFFFFF` (White)
- **Success**: `#22C55E`
- **Warning**: `#F59E0B`
- **Error**: `#EF4444`

### Typography & Spacing
- Use `fonts.regular`, `fonts.medium`, `fonts.bold` from the theme.
- Use standardized spacing increments (e.g., `spacing.xs`, `spacing.sm`, `spacing.md` `(16px)`, `spacing.lg`, `spacing.xl`).

## 2. Component Guidelines
- **Functional Components**: All UI components must be functional components using Hooks. No class components.
- **Reusability**: Extract repetitive UI elements (Buttons, Cards, Inputs) into `src/components/common/`.
- **Imports**: Use direct named imports for icons to avoid massive bundle sizes. (e.g., `import { Heart } from 'lucide-react-native'` instead of `import * as Icons`).

## 3. Screen Architecture
- **No Business Logic**: Screens (`src/features/<feature>/screens/`) should ONLY handle UI rendering, navigation, and local UI state.
- **State Management**: Data fetching belongs in TanStack React Query hooks. Global UI state (like auth status) belongs in Redux Toolkit.
- **Error Boundaries**: Every tab and major flow must be wrapped in an Error Boundary to prevent white-screens on crash.

## 4. Accessibility (a11y) & UX
- Minimum tap target size must be **48x48 dp**.
- Text inputs must have proper `keyboardType`, `autoCapitalize`, and `returnKeyType` props configured.
- Avoid blocking the main UI thread. Use `react-native-worklets` and `Reanimated 4` for complex animations.
- Ensure loading states (Spinners, Skeletons) and empty states are present for all data-fetching views.
