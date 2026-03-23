/**
 * AayuCare - Custom Font Loader
 *
 * Loads Poppins (headings) and Inter (body) via @expo-google-fonts.
 *
 * To activate custom fonts:
 *  1. Package installation: expo-font @expo-google-fonts/poppins @expo-google-fonts/inter
 */

import { useCallback } from "react";
import * as SplashScreen from "expo-splash-screen";
import {
  useFonts as useExpoFonts,
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
} from "@expo-google-fonts/poppins";
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from "@expo-google-fonts/inter";

// Keep the native splash visible while fonts load
SplashScreen.preventAutoHideAsync().catch(() => {
  // Already hidden — ignore the error (happens in dev reloads)
});

export const useFonts = () => {
  const [fontsLoaded, fontError] = useExpoFonts({
    "Poppins-Regular": Poppins_400Regular,
    "Poppins-Medium": Poppins_500Medium,
    "Poppins-SemiBold": Poppins_600SemiBold,
    "Poppins-Bold": Poppins_700Bold,
    "Inter-Regular": Inter_400Regular,
    "Inter-Medium": Inter_500Medium,
    "Inter-SemiBold": Inter_600SemiBold,
    "Inter-Bold": Inter_700Bold,
  });

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded || fontError) {
      await SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded, fontError]);

  return { fontsLoaded, onLayoutRootView };
};

export default useFonts;
