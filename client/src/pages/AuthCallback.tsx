import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '@/services/authService';

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = async () => {
      // The server-side OAuth callback at /auth/google/callback handles everything:
      // 1. Exchanges the OAuth code for tokens
      // 2. Gets user info from Google
      // 3. Creates/updates user profile in database
      // 4. Sends HTML with a script that sets localStorage and redirects
      //
      // This component only exists to show a loading state while the server
      // processes the callback. The server will send HTML that redirects automatically.
      //
      // If we're here, it means either:
      // - The server is processing the callback (wait for redirect)
      // - There was an error (check URL params)

      const urlParams = new URLSearchParams(window.location.search);
      const error = urlParams.get('error');
      const signupSuccess = urlParams.get('signup_success');

      if (error) {
        console.error('OAuth error:', error);
        navigate(`/login?error=${error}`);
        return;
      }

      if (signupSuccess) {
        console.log('Signup successful, check email for verification');
        navigate(`/login?signup_success=true&email=${urlParams.get('email')}`);
        return;
      }

      // If no error and no success redirect, the server is still processing
      // The server will send HTML with redirect script, so just wait
      console.log('OAuth callback in progress, waiting for server redirect...');
    };

    handleCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-indigo-900">
      <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          Completing Sign In...
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Please wait while we complete your authentication.
        </p>
      </div>
    </div>
  );
}