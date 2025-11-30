import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

type Language = 'en' | 'es';

type Translations = Record<string, string>;

const translationMap: Record<Language, Translations> = {
  en: {
    'brand.title': 'Anxiety Companion',
    'nav.dashboard': 'Dashboard',
    'nav.chat': 'Chat',
    'nav.chatHistory': 'Chat History',
    'nav.analytics': 'Analytics',
    'nav.appointments': 'My Appointments',
    'nav.treatment': 'Track Outcomes/Treatment',
    'nav.contactTherapist': 'Contact Therapist',
    'nav.settings': 'Settings',
    'nav.help': 'Help',
    'mobile.title.analytics': 'Analytics',
    'mobile.title.chatHistory': 'Chat History',
    'mobile.title.chat': 'Chat',
    'mobile.title.treatment': 'Track Treatment',
    'mobile.title.therapist': 'Find Therapist',
    'mobile.title.settings': 'Settings',
    'mobile.title.help': 'Help',
    'mobile.title.dashboard': 'Tranquiloo',
    'lang.english': 'English',
    'lang.spanish': 'Español',
    'lang.switch': 'Language',
  },
  es: {
    'brand.title': 'Compañero de Ansiedad',
    'nav.dashboard': 'Panel',
    'nav.chat': 'Chat',
    'nav.chatHistory': 'Historial de chat',
    'nav.analytics': 'Analítica',
    'nav.appointments': 'Mis Citas',
    'nav.treatment': 'Seguimiento y Tratamiento',
    'nav.contactTherapist': 'Contactar terapeuta',
    'nav.settings': 'Configuración',
    'nav.help': 'Ayuda',
    'mobile.title.analytics': 'Analítica',
    'mobile.title.chatHistory': 'Historial de chat',
    'mobile.title.chat': 'Chat',
    'mobile.title.treatment': 'Seguimiento',
    'mobile.title.therapist': 'Encontrar terapeuta',
    'mobile.title.settings': 'Configuración',
    'mobile.title.help': 'Ayuda',
    'mobile.title.dashboard': 'Tranquiloo',
    'lang.english': 'English',
    'lang.spanish': 'Español',
    'lang.switch': 'Idioma',
  },
};

interface LanguageContextValue {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, fallback?: string) => string;
}

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: React.ReactNode }) => {
  const [language, setLanguageState] = useState<Language>('en');

  useEffect(() => {
    const saved = localStorage.getItem('app_language') as Language | null;
    if (saved === 'en' || saved === 'es') {
      setLanguageState(saved);
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('app_language', lang);
  };

  const t = useMemo(() => {
    return (key: string, fallback?: string) => {
      const value = translationMap[language]?.[key];
      if (value) return value;
      const defaultVal = translationMap.en[key];
      return defaultVal || fallback || key;
    };
  }, [language]);

  const value = useMemo(() => ({ language, setLanguage, t }), [language, setLanguage, t]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

export const useLanguage = () => {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return ctx;
};
