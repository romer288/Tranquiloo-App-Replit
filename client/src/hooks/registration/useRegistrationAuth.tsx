import { useState } from 'react';

import { useToast } from '@/hooks/use-toast';
import { FormData } from '@/types/registration';
import { validateRegistrationForm } from '@/utils/registrationValidation';
import { AuthService } from '@/services/authService';
import { safeStorage } from '@/services/safeStorage';

export const useRegistrationAuth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleGoogleSignUp = async (role: 'patient' | 'therapist'): Promise<{ success: boolean }> => {
    console.log('Starting Google OAuth via server redirect for role:', role);
    setIsLoading(true);

    try {
      // Store so we can recover intent after redirect
      localStorage.setItem('pending_user_role', role);

      const params = new URLSearchParams({
        role,
        returnUrl: role === 'therapist' ? '/therapist-dashboard' : '/dashboard'
      });

      // Always let the server own the OAuth flow so Google sends the code there
      window.location.href = `/auth/google?${params.toString()}`;

      // The navigation should unload the page, so this return value is never used.
      return { success: true };
    } catch (error) {
      console.error('Google OAuth redirect failed:', error);
      toast({
        title: "Error",
        description: "Failed to start Google sign-in. Please try again.",
        variant: "destructive"
      });
      setIsLoading(false);
      return { success: false };
    }
  };

  const handleEmailSignUp = async (formData: FormData): Promise<{ success: boolean; needsVerification?: boolean; user?: any; error?: any }> => {
    const validation = validateRegistrationForm(formData);
    
    if (!validation.isValid && validation.error) {
      toast({
        title: validation.error.title,
        description: validation.error.description,
        variant: "destructive"
      });
      return { success: false };
    }

    try {
      setIsLoading(true);
      console.log('Attempting email signup...');
      
      const result = await AuthService.signUpWithEmail(
        formData.email,
        formData.password,
        formData.role ?? 'patient',
        formData.firstName,
        formData.lastName
      );
      
      if (result.success) {
        toast({
          title: "Registration Successful",
          description: result.message || "Welcome! Your account is ready.",
        });
        return { success: true, user: result.user };
      } else {
        toast({
          title: "Registration Failed", 
          description: result.error?.message || "Please try again.",
          variant: "destructive"
        });
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('Unexpected error during email registration:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive"
      });
      return { success: false };
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailSignIn = async (email: string, password: string, role: 'patient' | 'therapist' = 'patient'): Promise<{ success: boolean; needsVerification?: boolean }> => {
    try {
      setIsLoading(true);
      console.log('Attempting email signin...', { email, role });
      
      const result = await AuthService.signInWithEmail(email, password);
      console.log('Email signin result:', result);

      if (result.success && result.user) {
        console.log('🎉 AUTHENTICATION SUCCESS! User data received:', result.user);
        
        // Store user data with role
        const userData = { ...result.user, role };
        safeStorage.setItem('auth_user', JSON.stringify(userData));
        safeStorage.setItem('user', JSON.stringify(userData));
        
        console.log('✅ Stored user data to localStorage:', userData);
        
        // Verify storage worked
        const verification = safeStorage.getItem('auth_user');
        console.log('🔍 Storage verification:', verification);
        
        toast({
          title: "Success!",
          description: `Signed in successfully as ${role}`,
        });
        
        setIsLoading(false);
        
        // Immediately redirect to force full page reload and auth context refresh
        console.log('🔄 Redirecting to dashboard...');
        window.location.href = role === 'patient' ? '/dashboard' : '/therapist-dashboard';
        
        return { success: true };
      } else {
        console.error('Email signin failed:', result.error);
        
        // Handle different error cases
        const error = result.error;
        if (error && error.code === 'EMAIL_NOT_VERIFIED') {
          toast({
            title: "Email Not Verified",
            description: "Please check your email and click the verification link to activate your account.",
            variant: "destructive"
          });
        } else {
          toast({
            title: "Sign In Failed",
            description: error?.message || "Please check your credentials and try again.",
            variant: "destructive"
          });
        }
        setIsLoading(false);
        return { success: false, needsVerification: error?.code === 'EMAIL_NOT_VERIFIED' };
      }
    } catch (error) {
      console.error('Unexpected error during email signin:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive"
      });
      setIsLoading(false);
      return { success: false };
    }
  };

  return {
    isLoading,
    handleGoogleSignUp,
    handleEmailSignUp,
    handleEmailSignIn
  };
};
