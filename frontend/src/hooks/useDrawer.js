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

import { useState, useCallback } from "react";

export const useDrawer = () => {
  const [menuVisible, setMenuVisible] = useState(false);
  const openMenu = useCallback(() => setMenuVisible(true), []);
  const closeMenu = useCallback(() => setMenuVisible(false), []);

  return { menuVisible, openMenu, closeMenu };
};

export default useDrawer;
