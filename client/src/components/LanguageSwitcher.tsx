import React from 'react';
import { Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/context/LanguageContext';

interface Props {
  size?: 'sm' | 'md';
}

const LanguageSwitcher: React.FC<Props> = ({ size = 'md' }) => {
  const { language, setLanguage, t } = useLanguage();

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'es' : 'en');
  };

  return (
    <Button
      variant="ghost"
      size={size === 'sm' ? 'sm' : 'icon'}
      onClick={toggleLanguage}
      className="flex items-center gap-2"
      data-testid="button-language-switch"
    >
      <Globe className="w-4 h-4" />
      {size === 'sm' && <span className="text-sm">{language === 'en' ? t('lang.spanish') : t('lang.english')}</span>}
    </Button>
  );
};

export default LanguageSwitcher;
