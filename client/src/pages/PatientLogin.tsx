import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
// Google OAuth types
declare global {
  interface Window {
    google: {
      accounts: {
        id: {
          initialize: (config: any) => void;
          prompt: () => void;
          renderButton: (element: HTMLElement, config: any) => void;
        };
      };
    };
  }
}
import { Heart, Users, Shield, Mail, ArrowLeft, CheckCircle, Info } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { ROUTES } from '@/routes';
import SuccessMessage from '@/components/ui/success-message';
import { safeStorage } from '@/services/safeStorage';
import { useLanguage } from '@/context/LanguageContext';
import LanguageSwitcher from '@/components/LanguageSwitcher';

const PatientLogin: React.FC = () => {
  const navigate = useNavigate();
  const [activeView, setActiveView] = useState<'signin' | 'signup' | 'forgot'>('signin');
  const [oauthMessage, setOauthMessage] = useState<string>('');
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'patient', // Default to patient
    // Therapist-specific fields
    licenseNumber: '',
    specialty: '',
    yearsExperience: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [successEmail, setSuccessEmail] = useState('');
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSubmitted, setForgotSubmitted] = useState(false);
  const [forgotError, setForgotError] = useState('');
  const [signInError, setSignInError] = useState('');
  const { t, language } = useLanguage();
  
  // Check URL params for OAuth messages
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    
    if (params.get('signup_success') === 'true') {
      const email = params.get('email');
      setSuccessEmail(email || '');
      setShowSuccessMessage(true);
      // Clean up URL
      window.history.replaceState({}, document.title, '/login');
    }
    
    // No verification flow anymore
  }, []);

  const handleGoogleSignIn = async (isSignUp: boolean) => {
    setIsLoading(true);
    
    // Always use server-side OAuth for better reliability
    const role = isSignUp ? formData.role : 'patient';
    const returnUrl = role === 'therapist' ? '/therapist-dashboard' : '/dashboard';
    
    console.log('Redirecting to server-side OAuth with role:', role);
    window.location.href = `/auth/google?role=${role}&returnUrl=${encodeURIComponent(returnUrl)}`;
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setSignInError('');

    try {
      console.log('Signing in with:', formData.email);
      const response = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          isSignIn: true // Explicitly tell backend this is sign-in
        })
      });

      const result = await response.json();
      console.log('Sign in response:', response.status, result);
      
      if (result.error && result.error.code === 'EMAIL_NOT_VERIFIED') {
        navigate('/verify?redirect=/dashboard');
        return;
      }

      if (result.success) {
        // Check if email verification is required
        if (result.user && !result.user.emailVerified) {
          setSignInError(t('auth.verifyEmailFirst'));
        } else {
          // Store user data and redirect
          safeStorage.setItem('auth_user', JSON.stringify(result.user));
          window.dispatchEvent(new StorageEvent('storage', { key: 'auth_user' }));
          const redirectUrl = result.user.role === 'therapist' ? ROUTES.therapistDashboard : ROUTES.dashboard;
          navigate(redirectUrl, { replace: true });
        }
      } else {
        console.log('Sign in failed:', result.error);
        setSignInError(result.error?.message || t('auth.invalidCredentials'));
      }
    } catch (error) {
      console.error('Sign in error:', error);
      setSignInError(t('auth.networkError'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    if (formData.password !== formData.confirmPassword) {
      alert(t('auth.passwordMismatch'));
      setIsLoading(false);
      return;
    }

    try {
      // Call backend authentication API
      const signInResponse = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          role: formData.role,
          firstName: formData.firstName,
          lastName: formData.lastName,
          isSignIn: false // Explicitly tell backend this is sign-up
        })
      });

      const signInResult = await signInResponse.json();

      if (signInResult.success) {
        // Check if this is a new account that needs verification
        if (signInResult.message && signInResult.message.includes('verify')) {
          const redirectUrl = formData.role === 'therapist' ? ROUTES.therapistDashboard : ROUTES.dashboard;
          console.log('Verification bypass, redirecting to:', redirectUrl);
          navigate(redirectUrl, { replace: true });
          setIsLoading(false);
          return;
        }
        
        const userData = {
          id: signInResult.user.id,
          email: signInResult.user.email,
          username: signInResult.user.username,
          role: signInResult.user.role,
          authMethod: 'email',
          emailVerified: signInResult.user.emailVerified
        };
        
        safeStorage.setItem('auth_user', JSON.stringify(userData));
        window.dispatchEvent(new StorageEvent('storage', { key: 'auth_user' }));
        
        // Redirect based on role
        const redirectUrl = userData.role === 'therapist' ? ROUTES.therapistDashboard : ROUTES.dashboard;
        console.log('Authentication successful, redirecting to:', redirectUrl);
        navigate(redirectUrl, { replace: true });
      } else {
        alert(signInResult.error?.message || t('auth.invalidCredentials'));
      }
    } catch (error) {
      console.error('Email auth error:', error);
      alert(t('auth.networkError'));
    } finally {
      setIsLoading(false);
    }
  };

  // Handle forgot password submission
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setForgotError('');

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail })
      });

      const result = await response.json();

      if (result.success) {
        setForgotSubmitted(true);
      } else {
        setForgotError(result.error?.message || t('auth.networkError'));
      }
    } catch (err) {
      setForgotError(t('auth.networkError'));
    } finally {
      setIsLoading(false);
    }
  };

  // Show success message after account creation
  if (showSuccessMessage) {
    return (
      <SuccessMessage 
        email={successEmail} 
        onBack={() => setShowSuccessMessage(false)} 
      />
    );
  }

  // Forgot password success screen
  if (forgotSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl font-bold">{t('auth.checkEmail')}</CardTitle>
            <CardDescription>
              {t('auth.resetEmailSent').replace('{email}', forgotEmail || t('auth.email'))}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Alert>
                <Mail className="w-4 h-4" />
                <AlertDescription>
                  {t('auth.resetEmailBody')}
                </AlertDescription>
              </Alert>
              
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => {
                  setForgotSubmitted(false);
                  setForgotEmail('');
                  setActiveView('signin');
                }}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                {t('auth.backToSignIn')}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mb-4">
            <Heart className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {t('brand.appName')}
          </h1>
          <p className="text-gray-600">
            {t('auth.tagline')}
          </p>
        </div>

        <Card className="shadow-lg">
          {/* Sign In View */}
          {activeView === 'signin' && (
              <CardContent className="space-y-4 pt-4">
                <div className="flex items-center justify-between">
                  <div className="text-left">
                    <h2 className="text-lg font-semibold">{t('auth.welcomeBack')}</h2>
                    <p className="text-sm text-gray-600">{t('auth.patientJourney')}</p>
                  </div>
                  <LanguageSwitcher size="sm" />
                </div>

                {/* Google Sign In */}
                <div id="google-signin-container" className="w-full">
                  <Button
                    onClick={() => handleGoogleSignIn(false)}
                    disabled={isLoading}
                    variant="outline"
                    className="w-full"
                    data-testid="button-google-signin"
                  >
                    <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    {isLoading ? `${t('auth.signIn')}...` : t('auth.continueGoogle')}
                  </Button>
                </div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <Separator className="w-full" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-2 text-muted-foreground">{t('auth.orEmail')}</span>
                  </div>
                </div>

                {signInError && (
                  <Alert variant="destructive">
                    <AlertDescription>{signInError}</AlertDescription>
                  </Alert>
                )}

                <form onSubmit={handleSignIn} className="space-y-4">
                  <Input
                    type="email"
                    placeholder={t('auth.email')}
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    data-testid="input-signin-email"
                  />
                  
                  <Input
                    type="password"
                    placeholder={t('auth.password')}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                    data-testid="input-signin-password"
                  />

                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={isLoading}
                    data-testid="button-signin-submit"
                  >
                    {isLoading ? `${t('auth.signIn')}...` : t('auth.signIn')}
                  </Button>
                </form>

                <div className="text-center pt-2">
                  <p className="text-sm text-gray-600">
                    {t('auth.createAccountCta')}{' '}
                    <button
                      onClick={() => setActiveView('signup')}
                      className="text-blue-600 hover:underline"
                    >
                      {t('auth.signUp')}
                    </button>
                  </p>
                  <button
                    onClick={() => setActiveView('forgot')}
                    className="text-sm text-blue-600 hover:underline mt-2 block"
                  >
                    {t('auth.forgotPassword')}
                  </button>
                </div>
              </CardContent>
          )}

          {/* Sign Up View */}
          {activeView === 'signup' && (
              <CardContent className="space-y-4 pt-4">
                <div className="text-center">
                  <h2 className="text-lg font-semibold">{t('auth.createAccount')}</h2>
                  <p className="text-sm text-gray-600">{t('auth.communityTagline')}</p>
                </div>

                {/* Role Selection */}
                <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
                  <h3 className="text-sm font-medium text-gray-900 text-center">{t('auth.roleQuestion')}</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      type="button"
                      variant={formData.role === 'patient' ? 'default' : 'outline'}
                      className="flex flex-col items-center p-4 h-auto"
                      onClick={() => setFormData({ ...formData, role: 'patient' })}
                      data-testid="button-select-patient"
                    >
                      <Heart className="w-5 h-5 mb-1" />
                      <span className="text-sm">{t('auth.patientRole')}</span>
                    </Button>
                    <Button
                      type="button"
                      variant={formData.role === 'therapist' ? 'default' : 'outline'}
                      className="flex flex-col items-center p-4 h-auto"
                      onClick={() => setFormData({ ...formData, role: 'therapist' })}
                      data-testid="button-select-therapist"
                    >
                      <Shield className="w-5 h-5 mb-1" />
                      <span className="text-sm">{t('auth.therapistRole')}</span>
                    </Button>
                  </div>
                </div>

                {/* Google Sign Up */}
                <Button
                  onClick={() => handleGoogleSignIn(true)}
                  disabled={isLoading}
                  variant="outline"
                  className="w-full"
                  data-testid="button-google-signup"
                >
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  {isLoading ? `${t('auth.signUp')}...` : t('auth.continueGoogle')}
                </Button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <Separator className="w-full" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-2 text-muted-foreground">{t('auth.orEmail')}</span>
                  </div>
                </div>

                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      placeholder={t('auth.firstName', 'First name')}
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      required
                      data-testid="input-firstname"
                    />
                    <Input
                      placeholder={t('auth.lastName', 'Last name')}
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      required
                      data-testid="input-lastname"
                    />
                  </div>

                  <Input
                    type="email"
                    placeholder={t('auth.email')}
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    data-testid="input-signup-email"
                  />
                  
                  <Input
                    type="password"
                    placeholder={t('auth.password')}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                    minLength={8}
                    data-testid="input-signup-password"
                  />
                  
                  <Input
                    type="password"
                    placeholder={t('auth.confirmPassword')}
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    required
                    minLength={8}
                    data-testid="input-confirm-password"
                  />

                  {formData.role === 'therapist' && (
                    <Alert>
                      <Info className="w-4 h-4" />
                      <AlertDescription>
                        {t('therapist.immediateAccess.desc')}
                      </AlertDescription>
                    </Alert>
                  )}

                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={isLoading}
                    data-testid="button-signup-submit"
                  >
                    {isLoading ? `${t('auth.createAccount')}...` : t('auth.createAccount')}
                  </Button>
                </form>

                <div className="text-center pt-2">
                  <p className="text-sm text-gray-600">
                    {t('auth.haveAccount', 'Already have an account?')}{' '}
                    <button
                      onClick={() => setActiveView('signin')}
                      className="text-blue-600 hover:underline"
                    >
                      {t('auth.signIn')}
                    </button>
                  </p>
                  <button
                    onClick={() => setActiveView('forgot')}
                    className="text-sm text-blue-600 hover:underline mt-2 block"
                  >
                    {t('auth.forgotPassword')}
                  </button>
                </div>
              </CardContent>
          )}

          {/* Forgot Password View */}
          {activeView === 'forgot' && (
              <CardContent className="space-y-4 pt-4">
                <div className="text-center">
                  <h2 className="text-lg font-semibold">{t('auth.resetPassword')}</h2>
                  <p className="text-sm text-gray-600">{t('auth.resetSubtitle')}</p>
                </div>

                {forgotError && (
                  <Alert variant="destructive">
                    <AlertDescription>{forgotError}</AlertDescription>
                  </Alert>
                )}

                <form onSubmit={handleForgotPassword} className="space-y-4">
                  <div className="space-y-2">
                    <label htmlFor="forgot-email" className="text-sm font-medium">
                      {t('auth.emailLabel')}
                    </label>
                    <Input
                      id="forgot-email"
                      type="email"
                      placeholder={t('auth.emailPlaceholder')}
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      required
                      data-testid="input-forgot-email"
                    />
                    <p className="text-xs text-gray-500">
                      {t('auth.emailHint')}
                    </p>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={isLoading}
                    data-testid="button-send-reset"
                  >
                    {isLoading ? t('auth.sending') : t('auth.sendReset')}
                  </Button>
                </form>

                <div className="text-center pt-2">
                  <p className="text-sm text-gray-600">
                    {t('auth.rememberPassword')}{' '}
                    <button
                      onClick={() => setActiveView('signin')}
                      className="text-blue-600 hover:underline"
                    >
                      {t('auth.signIn')}
                    </button>
                  </p>
                </div>
              </CardContent>
          )}
        </Card>

        <div className="mt-6 text-center">
          <Link to="/therapist-login" className="text-sm text-gray-600 hover:text-gray-900 underline">
            {t('auth.areTherapist')}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PatientLogin;
