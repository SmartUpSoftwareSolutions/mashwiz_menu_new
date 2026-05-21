
import { useCallback } from 'react';
import { logButtonClick } from '@/services/buttonClickService';

export const useButtonClickLogger = () => {
  const logClick = useCallback(async (buttonName: string, userId?: string) => {
    await logButtonClick(buttonName, userId);
  }, []);

  // Enhanced button click handler that automatically logs and then executes the original handler
  const withLogging = useCallback((buttonName: string, originalHandler?: () => void, userId?: string) => {
    return async () => {
      await logClick(buttonName, userId);
      if (originalHandler) {
        originalHandler();
      }
    };
  }, [logClick]);

  return {
    logClick,
    withLogging,
  };
};
