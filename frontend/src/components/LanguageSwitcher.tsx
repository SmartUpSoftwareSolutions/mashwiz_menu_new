
import React from 'react';
import { useLanguage } from '@/hooks/useLanguage';
import { useTranslation } from '@/hooks/useTranslation';
import { Button } from '@/components/ui/button';
import { Globe } from 'lucide-react';

interface LanguageSwitcherProps {
  variant?: "default" | "outline" | "secondary" | "ghost" | "link" | "destructive";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
}

const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({
  variant = "outline",
  size = "sm",
  className = "flex items-center gap-1 bg-white"
}) => {
  const { language, setLanguage } = useLanguage();
  const { t } = useTranslation();
  
  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'ar' : 'en');
  };
  
  // return (
  //   <Button 
  //     variant={variant}
  //     size={size}
  //     onClick={toggleLanguage}
  //     className={className}
  //   >
  //     <Globe size={16} className={language === 'ar' ? 'ml-1' : 'mr-1'} />
  //     <span>{language === 'en' ? t('languageAr') : t('languageEn')}</span>
  //   </Button>
  // );
  return null;

};

export default LanguageSwitcher;
