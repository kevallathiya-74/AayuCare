/**
 * AayuCare - Custom Font Loader
 *
 * Loads Poppins (headings) and Inter (body) via expo-font.
 * Gracefully falls back to system fonts if assets are unavailable.
 *
 * To activate custom fonts:
 *  1. Place TTF files in frontend/assets/fonts/
 *  2. Uncomment the font map below
 */

import { useCallback, useEffect, useState } from "react";
import * as Font from "expo-font";
import * as SplashScreen from "expo-splash-screen";

// Keep the native splash visible while fonts load
SplashScreen.preventAutoHideAsync().catch(() => {
  // Already hidden — ignore the error (happens in dev reloads)
});

export const useFonts = () => {
  const [fontsLoaded, setFontsLoaded] = useState(false);

  useEffect(() => {
    const loadFonts = async () => {
      try {
        /**
         * Uncomment and add font files under assets/fonts/ to enable:
         *
         * await Font.loadAsync({
         *   "Poppins-Regular":    require("../../assets/fonts/Poppins-Regular.ttf"),
         *   "Poppins-Medium":     require("../../assets/fonts/Poppins-Medium.ttf"),
         *   "Poppins-SemiBold":   require("../../assets/fonts/Poppins-SemiBold.ttf"),
         *   "Poppins-Bold":       require("../../assets/fonts/Poppins-Bold.ttf"),
         *   "Inter-Regular":      require("../../assets/fonts/Inter-Regular.ttf"),
         *   "Inter-Medium":       require("../../assets/fonts/Inter-Medium.ttf"),
         *   "Inter-SemiBold":     require("../../assets/fonts/Inter-SemiBold.ttf"),
         *   "Inter-Bold":         require("../../assets/fonts/Inter-Bold.ttf"),
         * });
         */

        // When only system fonts are in use, mark as loaded immediately
        setFontsLoaded(true);
      } catch (error) {
        if (__DEV__) {
          console.warn("[useFonts] Font loading error — using system fonts:", error.message);
        }
        // Fall back to system fonts; never block the UI
        setFontsLoaded(true);
      }
    };

    loadFonts();
  }, []);

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded) {
      await SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded]);

  return { fontsLoaded, onLayoutRootView };
};

export default useFonts;
