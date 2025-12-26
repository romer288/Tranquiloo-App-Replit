import { useState, useEffect, createContext, useContext } from 'react';
import { useToast } from '@/hooks/use-toast';
import { AuthService, AuthUser } from '@/services/authService';
import { safeStorage } from '@/services/safeStorage';
import { useLanguage } from '@/context/LanguageContext';

interface AuthContextType {
  user: AuthUser | null;
  session: AuthUser | null; // For compatibility, we'll use user as session
  loading: boolean;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { t } = useLanguage();

  useEffect(() => {
    // MIGRATE_LEGACY_USER_KEY
    const legacy = localStorage.getItem('user');
    if (legacy && !safeStorage.getItem('auth_user')) { 
      safeStorage.setItem('auth_user', legacy); 
    }

    // Clear any stale auth if not valid JSON
    const maybeAuthUser = safeStorage.getItem('auth_user');
    try {
      if (maybeAuthUser) JSON.parse(maybeAuthUser);
    } catch {
      safeStorage.removeItem('auth_user');
      localStorage.removeItem('user');
    }
    
    // Get initial user from localStorage
    const loadUser = async () => {
      try {
        const currentUser = await AuthService.getCurrentUser();
        console.log('Auth hook loaded user:', currentUser);
        setUser(currentUser);
        setSession(currentUser); // Use user as session for compatibility
        setLoading(false);
      } catch (error) {
        console.error('Error loading user:', error);
        safeStorage.removeItem('auth_user'); // clear corrupted session
        setLoading(false);
      }
    };

    loadUser();
    
    // Add storage event listener to detect user changes from other components
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'auth_user') {
        console.log('Storage change detected, reloading user');
        loadUser();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const refreshUser = async () => {
    try {
      const currentUser = await AuthService.getCurrentUser();
      setUser(currentUser);
      setSession(currentUser);
    } catch (error) {
      console.error('Error refreshing user:', error);
    }
  };

  const signOut = async () => {
    const result = await AuthService.signOut();
    if (result.success) {
      setUser(null);
      setSession(null);
      toast({
        title: t("auth.signedOut"),
        description: t("auth.signOutSuccess"),
      });
    } else if (result.error) {
      toast({
        title: t("auth.signOutError"),
        description: result.error.message,
        variant: "destructive"
      });
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signOut, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
