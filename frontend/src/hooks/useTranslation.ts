
import { useCallback } from 'react';
import { useLanguage } from './useLanguage';
import { translations } from '@/translations';

export const useTranslation = () => {
  const { language } = useLanguage();

  const t = useCallback((key: string): string => {
    if (translations[language] && translations[language][key]) {
      return translations[language][key];
    }
    
    // Fallback to English if translation is missing
    if (translations['en'] && translations['en'][key]) {
      return translations['en'][key];
    }
    
    // Return the key if no translation is found
    return key;
  }, [language]);

  return { t };
};
