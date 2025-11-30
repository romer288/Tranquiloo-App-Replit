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
    'nav.share': 'Share App',
    'nav.logout': 'Log Out',
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
    // Auth common
    'auth.backHome': 'Back to home',
    'auth.welcomeBack': 'Welcome Back',
    'auth.createAccount': 'Create Account',
    'auth.resetPassword': 'Reset Password',
    'auth.createJourney': 'Create your account to start your journey',
    'auth.resetInstructions': 'Enter your email to reset your password',
    'auth.continueGoogle': 'Continue with Google',
    'auth.email': 'Email address',
    'auth.password': 'Password',
    'auth.confirmPassword': 'Confirm password',
    'auth.signIn': 'Sign In',
    'auth.signUp': 'Sign Up',
    'auth.createAccountCta': "Don't have an account? Sign up",
    'auth.orEmail': 'Or continue with email',
    'auth.therapistPortal': 'Therapist Portal',
    'auth.areTherapist': 'Are you a therapist? Click here',
    'auth.noAccount': "Don't have an account?",
    'auth.forgotPassword': 'Forgot your password?',
    'auth.patientJourney': 'Sign in to continue your journey',
    'auth.therapistJourney': 'Sign in to access your professional dashboard',
    'auth.googleDisclaimer': 'We are working toward HIPAA readiness; please avoid sharing PHI.',
    // Therapist auth
    'therapist.title.signin': 'Professional Portal',
    'therapist.title.signup': 'Join Our Professional Network',
    'therapist.subtitle.signin': 'Sign in to access your patient management dashboard',
    'therapist.subtitle.signup': 'Create your professional account to start connecting with patients',
    'therapist.immediateAccess': 'Immediate Access',
    'therapist.immediateAccess.desc': 'You can start using the therapist dashboard right away while we verify your license in the background',
    'therapist.licenseNumber': 'License number',
    'therapist.specialty': 'Specialty',
    'therapist.yearsExperience': 'Years of experience',
    'therapist.applyNow': "Don't have a professional account? Apply now",
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
    // Auth common
    'auth.backHome': 'Volver al inicio',
    'auth.welcomeBack': 'Bienvenido de nuevo',
    'auth.createAccount': 'Crear cuenta',
    'auth.resetPassword': 'Restablecer contraseña',
    'auth.createJourney': 'Crea tu cuenta para comenzar tu viaje',
    'auth.resetInstructions': 'Ingresa tu correo para restablecer tu contraseña',
    'auth.continueGoogle': 'Continuar con Google',
    'auth.email': 'Correo electrónico',
    'auth.password': 'Contraseña',
    'auth.confirmPassword': 'Confirmar contraseña',
    'auth.signIn': 'Iniciar sesión',
    'auth.signUp': 'Registrarse',
    'auth.createAccountCta': '¿No tienes cuenta? Regístrate',
    'auth.orEmail': 'O continúa con email',
    'auth.therapistPortal': 'Portal de terapeutas',
    'auth.areTherapist': '¿Eres terapeuta? Haz clic aquí',
    'auth.noAccount': '¿No tienes cuenta?',
    'auth.forgotPassword': '¿Olvidaste tu contraseña?',
    'auth.patientJourney': 'Inicia sesión para continuar tu camino',
    'auth.therapistJourney': 'Inicia sesión para acceder a tu panel profesional',
    'auth.googleDisclaimer': 'Estamos trabajando hacia el cumplimiento HIPAA; evita compartir PHI.',
    // Therapist auth
    'therapist.title.signin': 'Portal profesional',
    'therapist.title.signup': 'Únete a nuestra red profesional',
    'therapist.subtitle.signin': 'Inicia sesión para acceder a tu panel profesional',
    'therapist.subtitle.signup': 'Crea tu cuenta profesional para conectar con pacientes',
    'therapist.immediateAccess': 'Acceso inmediato',
    'therapist.immediateAccess.desc': 'Puedes usar el panel mientras verificamos tu licencia en segundo plano',
    'therapist.licenseNumber': 'Número de licencia',
    'therapist.specialty': 'Especialidad',
    'therapist.yearsExperience': 'Años de experiencia',
    'therapist.applyNow': '¿No tienes cuenta profesional? Solicítala aquí',
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
