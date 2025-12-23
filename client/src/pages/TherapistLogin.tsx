import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Shield, UserCheck, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { safeStorage } from '@/services/safeStorage';
import { useLanguage } from '@/context/LanguageContext';
import LanguageSwitcher from '@/components/LanguageSwitcher';

const TherapistLogin: React.FC = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    licenseNumber: '',
    specialty: '',
    yearsExperience: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const { t } = useLanguage();

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    
    try {
      // Redirect to Google OAuth with therapist role
      window.location.href = '/auth/google?role=therapist';
    } catch (error) {
      console.error('Google OAuth error:', error);
      alert('Failed to initiate Google sign-in. Please try again.');
      setIsLoading(false);
    }
  };

const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Password confirmation check for sign-up
    if (isSignUp && formData.password !== formData.confirmPassword) {
      alert('Passwords do not match');
      setIsLoading(false);
      return;
    }

    try {
      console.log('Therapist email auth attempt:', { email: formData.email, isSignUp });
      
      const response = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          role: 'therapist',
          isSignIn: !isSignUp, // true for sign-in, false for sign-up
          firstName: formData.firstName,
          lastName: formData.lastName,
          licenseNumber: formData.licenseNumber,
          specialty: formData.specialty,
          yearsExperience: formData.yearsExperience
        })
      });

      const result = await response.json();
      console.log('Therapist auth result:', result);

      if (result.success) {
        if (isSignUp) {
          alert('✅ Therapist account created! Please check your email and click the verification link before signing in.');
          setIsSignUp(false); // Switch to sign-in mode
          return;
        }
        
        // Store user data
        const userData = {
          id: result.user.id,
          email: result.user.email,
          username: result.user.username,
          role: 'therapist',
          authMethod: 'email',
          emailVerified: result.user.emailVerified
        };
        
        safeStorage.setItem('auth_user', JSON.stringify(userData));
        window.dispatchEvent(new StorageEvent('storage', { key: 'auth_user' }));

        
        console.log('Therapist authenticated successfully, redirecting...');
        window.location.href = '/therapist-dashboard';
      } else {
        if (result.error?.code === 'EMAIL_NOT_VERIFIED') {
          window.location.href = `/verify?redirect=${encodeURIComponent('/therapist-dashboard')}`;
        } else if (result.error?.code === 'USER_NOT_FOUND') {
          alert('No therapist account found with this email. Please sign up first by clicking "Don\'t have a professional account? Apply now" below to create your therapist account.');
        } else if (result.error?.code === 'INVALID_CREDENTIALS') {
          alert('Invalid email or password. Please try again.');
        } else {
          alert(result.error?.message || 'Authentication failed. Please try again.');
        }
      }
    } catch (error) {
      console.error('Therapist email auth error:', error);
      alert('Network error. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-emerald-600 rounded-full flex items-center justify-center mb-4">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <div className="flex items-center justify-between">
            <div className="text-left">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                {isSignUp ? t('therapist.title.signup') : t('therapist.title.signin')}
              </h1>
              <p className="text-gray-600">
                {isSignUp 
                  ? t('therapist.subtitle.signup')
                  : t('therapist.subtitle.signin')
                }
              </p>
            </div>
            <LanguageSwitcher size="sm" />
          </div>
        </div>

        <Card className="shadow-lg border-emerald-200">
          <CardHeader className="space-y-1">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <UserCheck className="w-5 h-5 text-emerald-600" />
              <CardTitle className="text-xl">{t('auth.therapistPortal')}</CardTitle>
            </div>
            <CardDescription className="text-center">
              {isSignUp 
                ? t('therapist.subtitle.signup')
                : t('therapist.subtitle.signin')
              }
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {isSignUp && (
              <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-200 mb-4">
                <div className="flex items-start space-x-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-emerald-800">{t('therapist.immediateAccess')}</p>
                    <p className="text-emerald-700">{t('therapist.immediateAccess.desc')}</p>
                  </div>
                </div>
              </div>
            )}

            <Button
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              variant="outline"
              className="w-full border-emerald-200 hover:bg-emerald-50"
              data-testid="button-therapist-google-signin"
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              {isLoading ? `${t('auth.signIn')}...` : t('auth.continueGoogle')}
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator className="w-full" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">{t('auth.orEmail')}</span>
              </div>
            </div>

            <form onSubmit={handleEmailSubmit} className="space-y-4">
              {isSignUp && (
                <>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      placeholder={t('auth.firstName', 'First name')}
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      required
                      data-testid="input-therapist-firstname"
                    />
                    <Input
                      placeholder={t('auth.lastName', 'Last name')}
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      required
                      data-testid="input-therapist-lastname"
                    />
                  </div>
                  
                  <Input
                    placeholder={t('therapist.licenseNumber')}
                    value={formData.licenseNumber}
                    onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
                    required
                    data-testid="input-license-number"
                  />
                  
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      placeholder={t('therapist.specialty')}
                      value={formData.specialty}
                      onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
                      required
                      data-testid="input-specialty"
                    />
                    <Input
                      placeholder={t('therapist.yearsExperience')}
                      type="number"
                      value={formData.yearsExperience}
                      onChange={(e) => setFormData({ ...formData, yearsExperience: e.target.value })}
                      required
                      data-testid="input-experience"
                    />
                  </div>
                </>
              )}
              
              <Input
                type="email"
                placeholder={t('auth.email')}
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                data-testid="input-therapist-email"
              />
              
              <Input
                type="password"
                placeholder={t('auth.password')}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                data-testid="input-therapist-password"
              />
              
              {isSignUp && (
                <Input
                  type="password"
                  placeholder={t('auth.confirmPassword')}
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  required
                  data-testid="input-confirm-password"
                />
              )}
              
              <Button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-700"
                disabled={isLoading}
                data-testid="button-therapist-email-auth"
              >
              {isLoading ? `${t('auth.signIn')}...` : (isSignUp ? t('auth.createAccount') : t('auth.signIn'))}
              </Button>
            </form>
            
            <div className="text-center pt-4">
              <button
                type="button"
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-emerald-600 hover:text-emerald-700 font-medium"
                data-testid="button-toggle-signup"
              >
               {isSignUp
                  ? t('therapist.alreadyHaveAccount', 'Already have a professional account? Sign in')
                  : t('therapist.applyNow')
                }
              </button>
            </div>
            
            <div className="text-center pt-2">
              <Link 
                to="/patient-login" 
                className="inline-flex items-center space-x-2 text-gray-600 hover:text-gray-800 text-sm"
                data-testid="link-patient-login"
              >
                <span>👤</span>
                 <span>{t('main.LookingForPatientSupport','Looking for patient support? Sign in here')}</span>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TherapistLogin;
