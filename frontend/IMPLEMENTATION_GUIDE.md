# AayuCare UI/UX Implementation Guide

## 🎨 **Phase 1 Complete: Foundation & Architecture**

This document outlines the comprehensive UI/UX implementation for AayuCare, an Indian-focused healthcare mobile application built with React Native.

---

## ✅ **What Has Been Implemented**

### 1. **Design System Foundation** ✨

#### **Color Palette** (`src/theme/colors.js`)
- **Primary Colors**: Calm, trustworthy blue (#4A90E2) for medical apps
- **Secondary Colors**: Health-focused greens (#4CAF50) for wellness
- **Semantic Colors**: Success, error, warning, info with WCAG AA compliance
- **Healthcare-Specific**: Dedicated colors for heart rate, BP, temperature, glucose, etc.
- **Indian-Friendly**: Soft backgrounds, subtle gradients, no loud saturation
- **Accessibility**: High contrast ratios, readable on budget Android screens

#### **Typography** (`src/theme/typography.js`)
- **Headings**: Poppins SemiBold (friendly, modern, trustworthy)
- **Body Text**: Inter Regular (highly legible on all screens)
- **Numbers**: Inter Medium (clear distinction for health metrics)
- **Font Sizes**: Mobile-optimized (12px-32px range)
- **Line Heights**: 1.5x for body text (optimal readability)
- **Pre-configured Styles**: h1-h6, body variants, labels, captions

#### **Spacing & Layout** (`src/theme/spacing.js`)
- **8px Grid System**: Consistent spacing throughout app
- **Component Spacing**: Pre-defined padding/margin for cards, forms, buttons
- **Touch Targets**: Minimum 48dp (accessibility compliant)
- **Safe Areas**: iOS notch and home indicator support
- **Responsive**: Breakpoints for tablets

#### **Theme Integration** (`src/theme/theme.js`)
- **React Native Paper**: Full theme customization
- **Shadows**: Platform-specific elevation styles
- **Borders**: Rounded corners (8px, 12px, 16px, 24px)
- **Opacity Values**: For disabled states, overlays
- **Z-Index Layers**: Modal, tooltip, dropdown ordering
- **Common Styles**: Reusable layout patterns

---

### 2. **State Management** 🔄

#### **Redux Toolkit** (`src/store/`)
- **Store Configuration**: Central Redux store with slices
- **Auth Slice**: Login, register, logout, user persistence
- **Appointment Slice**: CRUD operations for appointments
- **Health Slice**: Health records, vitals, prescriptions

#### **React Query Integration**
- Client configured with retry logic
- 5-minute stale time for cached data
- Ready for server state management

---

### 3. **API Services** 🌐

#### **Axios Instance** (`src/services/api.js`)
- **Base URL**: Auto-switches dev/production
- **30-second timeout**
- **Request Interceptor**: Auto-attaches JWT tokens
- **Response Interceptor**: Handles token refresh, 401 errors
- **Error Handling**: Comprehensive error responses

#### **Auth Service** (`src/services/auth.service.js`)
- Register, login, logout
- OTP send/verify
- Password reset/change
- Secure token storage (expo-secure-store)
- User data persistence

---

### 4. **Navigation Architecture** 🧭

#### **Three-Layer Navigation**

**1. App Navigator** (`src/navigation/AppNavigator.js`)
- Root navigation container
- Conditional rendering (Auth vs Main app)
- Deep linking configured (`aayucare://`)
- Loading state while checking auth

**2. Auth Navigator** (`src/navigation/AuthNavigator.js`)
- Onboarding → Login → Register → OTP → Password Reset
- Stack navigation with slide transitions
- Gesture controls

**3. Tab Navigator** (`src/navigation/TabNavigator.js`)
- Bottom tabs: Home, Appointments, Health, Profile
- Feather icons (minimal, professional look)
- Active/inactive states with color transitions
- iOS/Android specific styling

#### **Stack Screens**
- Doctor List & Profile
- Book/View Appointments
- Add/View Health Records
- Track Vitals
- Settings & Edit Profile

---

### 5. **Utility Functions** 🛠️

#### **Helpers** (`src/utils/helpers.js`)
- **Indian Formatting**: Rupee (₹), phone numbers (+91 XXXXX XXXXX)
- **Validation**: Phone, email, Aadhaar
- **Date/Time**: DD/MM/YYYY, 12-hour format, relative time
- **Health Utilities**: BMI/BP/heart rate categories with colors
- **String Utilities**: Capitalize, truncate, get initials
- **Debounce/Throttle**: Performance optimization

#### **Validators** (`src/utils/validators.js`)
- **Yup Schemas**: Pre-built validation for all forms
- **Auth**: Login, register, OTP, password reset
- **Profile**: Update profile, health details
- **Appointments**: Book appointment
- **Health Records**: Add records, track vitals
- **Indian-Specific**: Aadhaar, pincode validation

#### **Constants** (`src/utils/constants.js`)
- **API Config**: Base URLs, timeouts
- **Storage Keys**: Secure storage identifiers
- **Dropdowns**: Gender, blood groups, specializations
- **Appointment Status**: Pending, confirmed, cancelled
- **Time Slots**: 9 AM - 8 PM with 30-min intervals
- **Languages**: English, Hindi, Tamil, Telugu, etc.
- **Indian States**: Complete list for forms
- **FAQ Data**: Pre-populated help content

---

### 6. **Screen Structure** 📱

#### **Auth Screens**
- ✅ **Onboarding**: 3-slide carousel with skip/next
- 🔲 **Login**: Phone/email + password (placeholder)
- 🔲 **Register**: Multi-step form (placeholder)
- 🔲 **OTP**: 6-digit verification (placeholder)
- 🔲 **Password Reset**: Email/phone recovery (placeholder)

#### **Main Screens**
- 🔲 **Home**: Dashboard with quick stats (placeholder)
- 🔲 **Appointments**: List + book new (placeholder)
- 🔲 **Health Records**: Timeline view (placeholder)
- 🔲 **Profile**: User info + settings (placeholder)

#### **Additional Screens**
- 🔲 **Doctor List/Profile** (placeholder)
- 🔲 **Book/View Appointments** (placeholder)
- 🔲 **Add/View Health Records** (placeholder)
- 🔲 **Track Vitals** (placeholder)
- 🔲 **Settings/Edit Profile** (placeholder)

**Legend**: ✅ Fully implemented | 🔲 Placeholder (structure ready)

---

## 📦 **Installed Dependencies**

### **Core**
- `react@18.3.1`, `react-native@0.76.5`
- `expo@^54.0.25` (SDK 54)

### **Navigation**
- `@react-navigation/native@^6.1.9`
- `@react-navigation/native-stack@^6.9.17`
- `@react-navigation/bottom-tabs@^6.5.11`
- `react-native-screens@^3.29.0`
- `react-native-safe-area-context@^4.8.2`

### **UI Library**
- `react-native-paper@^5.11.6` (Material Design 3)
- `@expo/vector-icons@^15.0.3`
- `react-native-vector-icons@^10.0.3`

### **Animation**
- `react-native-reanimated@^3.6.1` (Worklet-based animations)
- `react-native-gesture-handler@^2.14.1` (Touch gestures)
- `@shopify/react-native-skia@^1.3.13` (Advanced graphics)

### **State Management**
- `@reduxjs/toolkit@^2.0.1` (Redux with less boilerplate)
- `react-redux@^9.0.4`
- `@tanstack/react-query@^5.14.2` (Server state)

### **Forms & Validation**
- `react-hook-form@^7.49.2` (Performant forms)
- `yup@^1.3.3` (Schema validation)

### **Data & API**
- `axios@^1.6.2` (HTTP client)
- `date-fns@^3.0.6` (Date utilities)

### **Storage**
- `expo-secure-store@~13.0.2` (Encrypted storage for tokens)
- `@react-native-async-storage/async-storage@^1.21.0` (App preferences)

### **Expo Modules**
- `expo-camera@~15.0.16`
- `expo-image-picker@~15.0.7`
- `expo-notifications@~0.28.19`
- `expo-linear-gradient@~15.0.7`
- `expo-font@~14.0.9`

### **Charts & Visualization**
- `react-native-chart-kit@^6.12.0`
- `react-native-svg@^14.1.0`

---

## 🗂️ **Project Structure**

```
frontend/
├── App.js                         # Main entry (Redux + Paper + Navigation)
├── babel.config.js                # Babel config (Reanimated plugin)
├── package.json                   # Dependencies
├── app.json                       # Expo config
│
├── src/
│   ├── theme/
│   │   ├── colors.js              # Color palette (Indian-friendly)
│   │   ├── typography.js          # Font system (Poppins, Inter, Lato)
│   │   ├── spacing.js             # 8px grid + layout constants
│   │   └── theme.js               # Main theme (Paper + custom)
│   │
│   ├── utils/
│   │   ├── constants.js           # App constants (API, dropdown data)
│   │   ├── helpers.js             # Utility functions (formatting, validation)
│   │   └── validators.js          # Yup schemas for forms
│   │
│   ├── services/
│   │   ├── api.js                 # Axios instance (interceptors)
│   │   └── auth.service.js        # Auth API calls
│   │
│   ├── store/
│   │   ├── store.js               # Redux store
│   │   └── slices/
│   │       ├── authSlice.js       # Auth state
│   │       ├── appointmentSlice.js # Appointment state
│   │       └── healthSlice.js     # Health records state
│   │
│   ├── navigation/
│   │   ├── AppNavigator.js        # Root navigator (deep linking)
│   │   ├── AuthNavigator.js       # Auth flow navigation
│   │   └── TabNavigator.js        # Bottom tabs (Home, Appointments, etc.)
│   │
│   ├── screens/
│   │   ├── auth/
│   │   │   └── OnboardingScreen.js # 3-slide intro (✅ implemented)
│   │   └── PlaceholderScreens.js   # All other screens (🔲 placeholders)
│   │
│   └── components/                 # (To be created in Phase 2)
│       └── common/                 # Reusable UI components
│
└── assets/                         # (To be added)
    ├── fonts/                      # Poppins, Inter, Lato (download needed)
    └── images/                     # Icons, illustrations
```

---

## 🎯 **Next Steps (Phase 2)**

### **Priority 1: Reusable Components** 🧩
Create `src/components/common/`:

1. **Button.js**
   - Primary, secondary, outline variants
   - Loading states with spinner
   - Gradient backgrounds
   - Haptic feedback on press
   - Icon support

2. **Card.js**
   - Elevated shadow
   - Rounded corners
   - Press animations (Reanimated)
   - Swipeable actions

3. **Input.js**
   - Floating labels
   - Validation states (error, success)
   - Icon prefix/suffix
   - Password visibility toggle
   - Phone number formatter

4. **Avatar.js**
   - Image, initials, icon variants
   - Sizes: small (32), medium (48), large (64)
   - Online status indicator

5. **Badge.js**
   - Status badges (pending, confirmed, etc.)
   - Count badges (notifications)
   - Colors from theme

6. **BottomSheet.js**
   - Gesture-based sheet (Gesture Handler)
   - Snap points
   - Backdrop with dismiss

7. **SkeletonLoader.js**
   - Animated loading placeholders
   - Card, list, text variants

---

### **Priority 2: Implement Core Screens** 📱

#### **Auth Flow** (Replace placeholders)
1. **LoginScreen.js**
   - Phone/email input
   - Password with show/hide
   - Remember me checkbox
   - OTP login option
   - Social auth buttons (Google, Apple)
   - Forgot password link

2. **RegisterScreen.js**
   - Multi-step form (3 steps)
   - Step 1: Basic info (name, phone, email)
   - Step 2: Password + confirm
   - Step 3: Health details (DOB, gender, blood group)
   - Progress indicator
   - Terms & conditions checkbox

3. **OTPScreen.js**
   - 6-digit OTP input (auto-focus)
   - Resend timer (60 seconds)
   - Auto-verify on 6 digits

#### **Home Screen** (Dashboard)
- Welcome message with user name
- Quick stats cards (upcoming appointments, health records)
- Health vitals summary (latest BP, heart rate)
- Recent appointments section
- "Find Doctors" CTA button
- "Quick Actions" (book appointment, add record)

#### **Appointments Screen**
- Tab view: Upcoming, Past, Cancelled
- Appointment cards with doctor info, date/time, status
- Pull-to-refresh
- Filter by specialization, date range
- "Book New Appointment" FAB

#### **Health Records Screen**
- Timeline view (grouped by month)
- Record cards (prescription, test report, vaccination)
- Filter by type
- Search functionality
- "Add Record" FAB

#### **Profile Screen**
- User avatar with edit button
- Name, email, phone display
- Quick links:
  - Edit Profile
  - Health Details
  - Settings
  - Help & Support
  - Privacy Policy
  - Logout

---

### **Priority 3: Advanced Features** 🚀

1. **Animations with Reanimated 3**
   - Card press feedback (scale down slightly)
   - List item slide-in on scroll
   - Bottom sheet gestures
   - Skeleton loaders with shimmer
   - Tab bar icon animations

2. **Charts with Skia**
   - Blood pressure trend (line chart)
   - Heart rate over time (area chart)
   - Weight tracking (bar chart)
   - Health score (radial gauge)
   - Smooth gradients and animations

3. **Accessibility**
   - Screen reader labels (`accessibilityLabel`)
   - Minimum touch targets (48dp)
   - High contrast mode support
   - Font scaling support (`allowFontScaling`)
   - Focus indicators for keyboard navigation

4. **Indian UX Patterns**
   - Rupee (₹) symbol formatting
   - 12-hour time format
   - DD/MM/YYYY date format
   - Hindi translations (react-i18next)
   - Festive theme option (Diwali colors)

---

## 📝 **Design Principles Applied**

### **Visual Hierarchy**
- Large headings (24-32px) for screens
- Medium body text (14-16px) for readability
- Small captions (10-12px) for metadata
- Color contrast for importance (primary blue for CTAs)

### **Spacing**
- Generous whitespace (16-24px between sections)
- 8px grid system for consistency
- No cramped layouts (Indian users prefer breathing room)

### **Color Usage**
- **Primary Blue**: Trust, medical professionalism
- **Green**: Health, success, wellness
- **Orange**: Warnings, highlights
- **Red**: Errors, emergencies (used sparingly)
- **Gray Scale**: Neutral backgrounds, text hierarchy

### **Interactive States**
- **Default**: Normal state
- **Hover**: Slight opacity change (0.96)
- **Pressed**: Scale down (0.95) + darker color
- **Disabled**: 38% opacity, gray color
- **Loading**: Spinner with disabled state

### **Platform-Native Patterns**
- **iOS**: Large titles, swipe gestures, bottom sheets
- **Android**: FABs, snackbars, material ripple
- **Both**: Bottom navigation, cards, consistent spacing

---

## 🎨 **Typography Recommendations**

### **Download & Install Fonts**

1. **Poppins** (Headings)
   - Download: [Google Fonts - Poppins](https://fonts.google.com/specimen/Poppins)
   - Weights needed: Regular (400), Medium (500), SemiBold (600), Bold (700)
   - Place in: `assets/fonts/`

2. **Inter** (Body & Numbers)
   - Download: [Google Fonts - Inter](https://fonts.google.com/specimen/Inter)
   - Weights needed: Regular (400), Medium (500), SemiBold (600), Bold (700)
   - Place in: `assets/fonts/`

3. **Lato** (Fallback)
   - Download: [Google Fonts - Lato](https://fonts.google.com/specimen/Lato)
   - Weights needed: Regular (400), Bold (700)
   - Place in: `assets/fonts/`

### **Font Loading** (Add to App.js)
```javascript
import * as Font from 'expo-font';
import { fontsToLoad } from './src/theme/typography';

// In App component:
const [fontsLoaded] = Font.useFonts(fontsToLoad);

if (!fontsLoaded) {
  return <AppLoading />;
}
```

---

## 🚀 **Running the App**

### **1. Start Metro Bundler**
```powershell
cd d:\AayuCare1\frontend
npm start
```

### **2. Run on Android**
```powershell
npm run android
```

### **3. Run on iOS** (Mac only)
```powershell
npm run ios
```

### **4. Run on Web**
```powershell
npm run web
```

### **5. Clear Cache** (if issues)
```powershell
npm run start:clear
```

---

## 🐛 **Known Issues & Solutions**

### **Issue**: Metro bundler errors after installing new packages
**Solution**: Clear cache
```powershell
npx expo start --clear
```

### **Issue**: Reanimated not working
**Solution**: Ensure `react-native-reanimated/plugin` is LAST in babel.config.js

### **Issue**: Navigation not rendering
**Solution**: Check if all screen imports are correct in navigators

### **Issue**: Fonts not loading
**Solution**: Download font files, place in `assets/fonts/`, uncomment font loading in typography.js

---

## 📚 **Resources & Documentation**

- **React Native Paper**: https://callstack.github.io/react-native-paper/
- **React Navigation**: https://reactnavigation.org/docs/getting-started
- **Reanimated 3**: https://docs.swmansion.com/react-native-reanimated/
- **React Native Skia**: https://shopify.github.io/react-native-skia/
- **Redux Toolkit**: https://redux-toolkit.js.org/
- **React Query**: https://tanstack.com/query/latest
- **React Hook Form**: https://react-hook-form.com/
- **Yup**: https://github.com/jquense/yup

---

## 🎉 **What You've Achieved**

✅ **Professional design system** (colors, typography, spacing)  
✅ **Complete navigation architecture** (auth + main app flows)  
✅ **State management** (Redux Toolkit + React Query)  
✅ **API services** (Axios with interceptors, auth service)  
✅ **Form validation** (Yup schemas for all forms)  
✅ **Indian-specific utilities** (Rupee formatting, phone validation, Aadhaar)  
✅ **Accessibility foundations** (WCAG AA colors, touch targets)  
✅ **Modern tech stack** (Reanimated, Skia, Paper, React 18)  

🔲 **Next**: Implement reusable components + core screens  
🔲 **Future**: Add animations, charts, advanced features  

---

## 💡 **Pro Tips**

1. **Use theme constants**: Always import from `theme/` instead of hardcoding
2. **Consistent spacing**: Use `spacing.md`, `spacing.lg` from theme
3. **Accessibility first**: Add `accessibilityLabel` to all interactive elements
4. **Test on real devices**: Budget Android phones for Indian market
5. **Performance**: Use `React.memo`, `useMemo`, `useCallback` for lists
6. **Error handling**: Always show user-friendly messages (not raw API errors)
7. **Loading states**: Never leave users hanging (show spinners)
8. **Offline support**: Consider caching with React Query

---

**Created by**: GitHub Copilot  
**Date**: December 2, 2025  
**Version**: 1.0.0  
**Tech Stack**: React Native (Expo), TypeScript-ready, Production-grade architecture

---

**Smooth as ghee, fast as a bullet train, pleasant to the Indian eye!** 🚀🇮🇳
