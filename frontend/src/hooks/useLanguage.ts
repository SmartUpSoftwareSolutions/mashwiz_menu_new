
import { useState, useEffect, createContext, useContext, ReactNode, createElement } from 'react';

type Language = 'en' | 'ar';

interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => void;
}

const defaultValue: LanguageContextType = {
  language: 'en',
  setLanguage: () => {}
};

export const LanguageContext = createContext<LanguageContextType>(defaultValue);

export const useLanguageProvider = () => {
  const [language, setLanguage] = useState<Language>(() => {
    const savedLanguage = localStorage.getItem('language') as Language;
    return savedLanguage || 'en';
  });

  useEffect(() => {
    localStorage.setItem('language', language);
    document.documentElement.lang = language;
    
    // Update the dir attribute on the html element
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
  }, [language]);

  return { language, setLanguage };
};

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const value = useLanguageProvider();
  return createElement(LanguageContext.Provider, { value }, children);
};

export const useLanguage = () => useContext(LanguageContext);
