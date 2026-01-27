/**
 * SlideMenu - Reusable Sidebar/Drawer Component
 * Provides consistent slide-in menu across all screens
 * Features: Smooth animation, backdrop dismiss, safe area support
 */

import React, { useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Animated,
  Pressable,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { theme, healthColors } from "../../theme";
import {
  getScreenPadding,
} from "../../utils/responsive";
import Avatar from "./Avatar";

const { width } = Dimensions.get("window");
const MENU_WIDTH = width * 0.8;

/**
 * SlideMenu Component
 * @param {boolean} visible - Controls menu visibility
 * @param {function} onClose - Callback when menu is closed
 * @param {object} user - User object with name, userId, role, avatar
 * @param {array} menuItems - Array of menu items with { icon, label, onPress, danger? }
 * @param {function} onLogout - Logout callback
 * @param {string} appVersion - App version string
 * @param {string} roleLabel - Role label (e.g., "Patient", "Doctor", "Admin")
 */
const SlideMenu = ({
  visible,
  onClose,
  user,
  menuItems = [],
  onLogout,
  appVersion = "1.0.0",
  roleLabel = "User",
}) => {
  const slideAnim = useRef(new Animated.Value(-MENU_WIDTH)).current;

  useEffect(() => {
    if (visible) {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: -MENU_WIDTH,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, slideAnim]);

  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  const handleMenuItemPress = useCallback(
    (onPress) => {
      handleClose();
      // Small delay to allow menu close animation
      setTimeout(() => {
        onPress();
      }, 100);
    },
    [handleClose]
  );

  const handleLogoutPress = useCallback(() => {
    handleClose();
    setTimeout(() => {
      onLogout();
    }, 100);
  }, [handleClose, onLogout]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      <Pressable style={styles.overlay} onPress={handleClose}>
        <Animated.View
          style={[
            styles.menuContainer,
            { transform: [{ translateX: slideAnim }] },
          ]}
        >
          <SafeAreaView
            style={styles.menuSafeArea}
            edges={["top", "bottom", "left"]}
          >
            <Pressable
              style={styles.menuContent}
              onPress={(e) => e.stopPropagation()}
            >
              {/* Menu Header */}
              <LinearGradient
                colors={[healthColors.primary.main, healthColors.primary.dark]}
                style={styles.menuHeader}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={handleClose}
                  accessibilityRole="button"
                  accessibilityLabel="Close menu"
                >
                  <Ionicons name="close" size={24} color={theme.colors.white} />
                </TouchableOpacity>

                <View style={styles.menuUserInfo}>
                  <Avatar
                    name={user?.name || "User"}
                    size={60}
                    source={user?.avatar}
                  />
                  <View style={styles.menuUserDetails}>
                    <Text style={styles.menuUserName} numberOfLines={1}>
                      {user?.name || "User"}
                    </Text>
                    <Text style={styles.menuUserId}>
                      {roleLabel} • {user?.id || "N/A"}
                    </Text>
                  </View>
                </View>
              </LinearGradient>

              {/* Menu Items */}
              <ScrollView
                style={styles.menuScroll}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.menuScrollContent}
              >
                <View style={styles.menuItemsContainer}>
                  {menuItems.map((item, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.menuItem,
                        item.danger && styles.menuItemDanger,
                      ]}
                      onPress={() => handleMenuItemPress(item.onPress)}
                      activeOpacity={0.7}
                    >
                      <Ionicons
                        name={item.icon}
                        size={22}
                        color={
                          item.danger
                            ? healthColors.error.main
                            : healthColors.text.secondary
                        }
                      />
                      <Text
                        style={[
                          styles.menuItemText,
                          item.danger && styles.menuItemTextDanger,
                        ]}
                      >
                        {item.label}
                      </Text>
                      <Ionicons
                        name="chevron-forward"
                        size={18}
                        color={
                          item.danger
                            ? healthColors.error.main
                            : healthColors.text.tertiary
                        }
                      />
                    </TouchableOpacity>
                  ))}

                  {/* Logout Button */}
                  <TouchableOpacity
                    style={[styles.menuItem, styles.menuItemDanger]}
                    onPress={handleLogoutPress}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name="log-out"
                      size={22}
                      color={healthColors.error.main}
                    />
                    <Text
                      style={[styles.menuItemText, styles.menuItemTextDanger]}
                    >
                      Logout
                    </Text>
                    <Ionicons
                      name="chevron-forward"
                      size={18}
                      color={healthColors.error.main}
                    />
                  </TouchableOpacity>
                </View>

                {/* Menu Footer */}
                <View style={styles.menuFooter}>
                  <Text style={styles.menuFooterText}>
                    AayuCare {roleLabel} v{appVersion}
                  </Text>
                  <Text style={styles.menuFooterText}>
                    © {new Date().getFullYear()} AayuCare Hospital
                  </Text>
                </View>
              </ScrollView>
            </Pressable>
          </SafeAreaView>
        </Animated.View>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  menuContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    bottom: 0,
    width: MENU_WIDTH,
    backgroundColor: healthColors.background.card,
    ...theme.shadows.xl,
  },
  menuSafeArea: {
    flex: 1,
  },
  menuContent: {
    flex: 1,
  },
  menuHeader: {
    paddingTop: 16,
    paddingBottom: 24,
    paddingHorizontal: getScreenPadding(),
  },
  closeButton: {
    alignSelf: "flex-end",
    padding: 8,
    marginBottom: 8,
  },
  menuUserInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  menuUserDetails: {
    flex: 1,
  },
  menuUserName: {
    fontSize: 18,
    fontWeight: "700",
    color: theme.colors.white,
    marginBottom: 4,
  },
  menuUserId: {
    fontSize: 13,
    color: "rgba(255, 255, 255, 0.8)",
  },
  menuScroll: {
    flex: 1,
  },
  menuScrollContent: {
    flexGrow: 1,
    justifyContent: "space-between",
  },
  menuItemsContainer: {
    paddingTop: 16,
    paddingHorizontal: getScreenPadding(),
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 12,
    marginBottom: 4,
    borderRadius: 10,
    backgroundColor: healthColors.background.secondary,
    gap: 12,
  },
  menuItemDanger: {
    backgroundColor: healthColors.error.background,
    marginTop: 8,
  },
  menuItemText: {
    flex: 1,
    fontSize: 15,
    fontWeight: "500",
    color: healthColors.text.primary,
  },
  menuItemTextDanger: {
    color: healthColors.error.main,
  },
  menuFooter: {
    alignItems: "center",
    paddingVertical: 20,
    paddingHorizontal: getScreenPadding(),
    borderTopWidth: 1,
    borderTopColor: healthColors.border?.light || healthColors.neutral.gray200,
    marginTop: 16,
  },
  menuFooterText: {
    fontSize: 12,
    color: healthColors.text.tertiary,
    marginBottom: 4,
  },
});

export default SlideMenu;



