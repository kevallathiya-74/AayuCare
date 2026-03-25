/**
 * Navigation helpers for consistent back behavior.
 */

export const handleSmartBack = (navigation, fallbackRoute, params) => {
  if (!navigation) return;

  if (navigation.canGoBack && navigation.canGoBack()) {
    navigation.goBack();
    return;
  }

  if (fallbackRoute) {
    navigation.navigate(fallbackRoute, params);
  }
};

export default {
  handleSmartBack,
};
