
import { useEffect } from 'react';
import { useRestaurantInfo } from '@/services/restaurantInfoService';
import { useWebThemes, applyTheme, getStoredTheme } from '@/services/themeService';
import { useQueryClient } from '@tanstack/react-query';

export const useTheme = () => {
  const { data: restaurantInfo } = useRestaurantInfo();
  const { data: themes } = useWebThemes();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (restaurantInfo?.theme_id && themes) {
      // Apply the restaurant's selected theme
      const selectedTheme = themes.find(theme => theme.theme_id === restaurantInfo.theme_id);
      if (selectedTheme) {
        applyTheme(selectedTheme);
        return;
      }
    }

    // Fallback to stored theme or default theme
    const storedTheme = getStoredTheme();
    if (storedTheme) {
      applyTheme(storedTheme);
      return;
    }

    // Apply default theme if available
    if (themes) {
      const defaultTheme = themes.find(theme => theme.is_default);
      if (defaultTheme) {
        applyTheme(defaultTheme);
      }
    }
  }, [restaurantInfo, themes]);

  // Listen for restaurant info updates to immediately apply theme changes
  useEffect(() => {
    const unsubscribe = queryClient.getQueryCache().subscribe((event) => {
      if (event?.query?.queryKey?.[0] === 'restaurantInfo' && event.type === 'updated') {
        const updatedRestaurantInfo = event.query.state.data;
        if (updatedRestaurantInfo?.theme_id && themes) {
          const selectedTheme = themes.find(theme => theme.theme_id === updatedRestaurantInfo.theme_id);
          if (selectedTheme) {
            applyTheme(selectedTheme);
          }
        }
      }
    });

    return unsubscribe;
  }, [themes, queryClient]);

  return {
    currentThemeId: restaurantInfo?.theme_id,
    themes,
  };
};
