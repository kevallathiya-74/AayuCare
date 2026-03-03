/**
 * AayuCare - useDrawer Hook
 *
 * Encapsulates the slide-in side drawer animation used across
 * Patient, Doctor, and Admin dashboards.
 *
 * Returns:
 *   menuVisible  — boolean state
 *   openMenu()   — opens drawer with slide animation
 *   closeMenu()  — closes drawer with slide animation
 *   slideAnim    — Animated.Value for translateX (-drawerWidth → 0)
 *   drawerWidth  — computed drawer width (80% of screen)
 */

import { useRef, useState, useEffect, useCallback } from "react";
import { Animated, Dimensions } from "react-native";

const DRAWER_FRACTION = 0.8;
const OPEN_DURATION = 280;
const CLOSE_DURATION = 220;

export const useDrawer = () => {
  const screenWidth = Dimensions.get("window").width;
  const drawerWidth = screenWidth * DRAWER_FRACTION;

  const [menuVisible, setMenuVisible] = useState(false);
  const slideAnim = useRef(new Animated.Value(-drawerWidth)).current;

  useEffect(() => {
    if (menuVisible) {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: OPEN_DURATION,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: -drawerWidth,
        duration: CLOSE_DURATION,
        useNativeDriver: true,
      }).start();
    }
  }, [menuVisible, slideAnim, drawerWidth]);

  const openMenu = useCallback(() => setMenuVisible(true), []);
  const closeMenu = useCallback(() => setMenuVisible(false), []);

  return { menuVisible, openMenu, closeMenu, slideAnim, drawerWidth };
};

export default useDrawer;
