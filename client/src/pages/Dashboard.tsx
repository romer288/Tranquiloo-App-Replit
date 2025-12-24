
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Heart, Shield, Users, Zap, BarChart3, Bell, UserRound, FilePen } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { ROUTES } from '@/routes';
import { useLanguage } from '@/context/LanguageContext';

const Dashboard = () => {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const { t } = useLanguage();

  const handleNotifications = () => {
    navigate(ROUTES.notifications);
  };

  const handleSettings = () => {
    navigate(ROUTES.settings);
  };

  const handleProfile = () => {
    // Navigate to user profile/settings
    navigate(ROUTES.settings);
  };
  return (
    <div className="min-h-screen bg-gray-50 pb-16 md:pb-0">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 sm:px-6 lg:px-8 pt-4 pb-2">
        <div className="flex flex-wrap items-center gap-4 justify-between">
          <h1 className="text-xl font-semibold text-gray-900">{t('dashboard.title')}</h1>
          <div className="flex items-center space-x-3">
            <button 
              onClick={handleSettings}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <span className="sr-only">{t('nav.settings')}</span>
              <FilePen className="w-5 h-5" />
            </button>
            <button 
              onClick={handleNotifications}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <span className="sr-only">{t('mobile.title.analytics')}</span>
              <Bell className="w-5 h-5" />
            </button>
            <button
              onClick={handleProfile}
              className="w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center hover:bg-yellow-500 transition-colors"
            >
              <span className="sr-only">Profile</span>
              <UserRound className="w-4 h-4 text-gray-700" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Hero Section */}
        <div className="text-center mb-10">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <Heart className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3 sm:mb-4 leading-tight">
            {t('dashboard.heroTitle')}
          </h1>
          <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto mb-6 sm:mb-8">
            {t('dashboard.heroSubtitle')}
          </p>
          
          <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4">
            <Button asChild className="bg-blue-600 hover:bg-blue-700 px-6 sm:px-8 py-3 w-full sm:w-auto">
              <Link to={ROUTES.chat}>
                <Zap className="w-4 h-4 mr-2" />
                {t('dashboard.startChatting')}
              </Link>
            </Button>
            <Button asChild variant="outline" className="px-6 sm:px-8 py-3 w-full sm:w-auto">
              <Link to={ROUTES.assessment}>
                {t('dashboard.takeAssessment')}
              </Link>
            </Button>
            <Button asChild variant="outline" className="px-6 sm:px-8 py-3 w-full sm:w-auto">
              <Link to={ROUTES.treatmentResources}>
                {t('dashboard.trackTreatment')}
              </Link>
            </Button>
            <Button asChild variant="outline" className="px-6 sm:px-8 py-3 w-full sm:w-auto">
              <Link to={ROUTES.analytics}>
                <BarChart3 className="w-4 h-4 mr-2" />
                {t('dashboard.analytics')}
              </Link>
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mb-12">
          <Card className="p-6 text-center bg-blue-50 border-blue-100">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Shield className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('dashboard.feature.safe')}</h3>
            <p className="text-gray-600 text-sm">
              {t('dashboard.feature.safeDesc')}
            </p>
          </Card>

          <Card className="p-6 text-center bg-green-50 border-green-100">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Users className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('dashboard.feature.support')}</h3>
            <p className="text-gray-600 text-sm">
              {t('dashboard.feature.supportDesc')}
            </p>
          </Card>

          <Card className="p-6 text-center bg-purple-50 border-purple-100">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Heart className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('dashboard.feature.personalized')}</h3>
            <p className="text-gray-600 text-sm">
              {t('dashboard.feature.personalizedDesc')}
            </p>
          </Card>
        </div>

        <div className="text-center text-sm text-gray-500 space-y-3">
          <p className="px-4">© 2025 {t('brand.title')}. {t('dashboard.footer.rights')}</p>
          <div className="flex flex-wrap justify-center gap-4 sm:gap-6">
            <a href="#" className="hover:text-gray-700">{t('dashboard.footer.privacy')}</a>
            <a href="#" className="hover:text-gray-700">{t('dashboard.footer.terms')}</a>
            <a href="#" className="hover:text-gray-700">{t('dashboard.footer.contact')}</a>
          </div>
          <p className="max-w-3xl mx-auto leading-relaxed px-4">
            {t('dashboard.footer.disclaimer')}
          </p>
          <div className="flex flex-col sm:flex-row sm:justify-between items-center gap-2 pt-4 px-4">
            <span>{t('brand.title')}</span>
            <span>{t('dashboard.footer.version')} v1.0.0</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
