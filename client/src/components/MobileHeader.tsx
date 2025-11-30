import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ChevronLeft, Menu, Bell, User } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/context/LanguageContext';
import LanguageSwitcher from './LanguageSwitcher';

const MobileHeader = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut } = useAuth();
  const { t } = useLanguage();

  const getPageTitle = () => {
    const path = location.pathname;
    if (path.includes('analytics')) return t('mobile.title.analytics');
    if (path.includes('chat-history')) return t('mobile.title.chatHistory');
    if (path.includes('chat')) return t('mobile.title.chat');
    if (path.includes('treatment')) return t('mobile.title.treatment');
    if (path.includes('therapist')) return t('mobile.title.therapist');
    if (path.includes('settings')) return t('mobile.title.settings');
    if (path.includes('help')) return t('mobile.title.help');
    if (path.includes('dashboard')) return t('mobile.title.dashboard');
    return t('mobile.title.dashboard');
  };

  const showBackButton = location.pathname !== '/dashboard';

  return (
    <div className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-[300] pointer-events-auto md:hidden">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center">
          {showBackButton ? (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              className="mr-2"
              data-testid="mobile-back-button"
            >
              <ChevronLeft className="w-6 h-6" />
            </Button>
          ) : (
            <div className="w-10" />
          )}
          <h1 className="text-lg font-semibold">{getPageTitle()}</h1>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              window.location.href = '/notifications';
            }}
            className="touch-manipulation"
            data-testid="mobile-notifications"
          >
            <Bell className="w-5 h-5" />
          </Button>

          <LanguageSwitcher size="sm" />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" data-testid="mobile-menu">
                <User className="w-5 h-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 z-[500] bg-white border shadow-lg" sideOffset={8}>
              <DropdownMenuItem asChild>
                <button
                  onClick={() => {
                    window.location.href = '/settings';
                  }}
                  className="w-full text-left"
                >
                  {t('nav.settings')}
                </button>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <button
                  onClick={() => {
                    window.location.href = '/help';
                  }}
                  className="w-full text-left"
                >
                  {t('nav.help')}
                </button>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <button
                  onClick={() => {
                    window.location.href = '/chat-history';
                  }}
                  className="w-full text-left"
                >
                  {t('nav.chatHistory')}
                </button>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onSelect={signOut}
                className="text-red-600"
              >
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
};

export default MobileHeader;
