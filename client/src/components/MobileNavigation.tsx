import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  MessageCircle, 
  BarChart3, 
  Stethoscope, 
  Users 
} from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

const MobileNavigation = () => {
  const location = useLocation();
  const { t } = useLanguage();

  const navItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: t('nav.dashboard') },
    { path: '/chat', icon: MessageCircle, label: t('nav.chat') },
    { path: '/analytics', icon: BarChart3, label: t('nav.analytics') },
    { path: '/treatment-resources', icon: Stethoscope, label: t('nav.treatment') },
    { path: '/find-therapist', icon: Users, label: t('mobile.title.therapist') },
  ];

  return (
    <div
      className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 md:hidden"
      style={{
        zIndex: 99999,
        position: 'fixed',
        isolation: 'isolate',
        paddingBottom: 'max(env(safe-area-inset-bottom), 0px)'
      } as React.CSSProperties}
    >
      <nav className="flex justify-around items-center py-1.5 px-1 sm:py-2 sm:px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          
          return (
            <a
              key={item.path}
              href={item.path}
              className={`flex flex-col items-center justify-center p-2 sm:p-3 flex-1 transition-colors touch-manipulation min-h-[56px] sm:min-h-[64px] ${
                isActive
                  ? 'text-blue-600'
                  : 'text-gray-500 active:text-gray-700'
              }`}
              data-testid={`mobile-nav-${item.label.toLowerCase()}`}
              style={{
                zIndex: 10000,
                position: 'relative',
                touchAction: 'manipulation',
                minWidth: '44px',
                WebkitTapHighlightColor: 'transparent'
              }}
              onClick={(e) => {
                e.preventDefault();
                window.location.href = item.path;
              }}
            >
              <Icon className={`w-5 h-5 sm:w-6 sm:h-6 ${isActive ? 'stroke-[2.5]' : ''}`} />
              <span className="text-[10px] sm:text-xs mt-0.5 sm:mt-1 leading-tight text-center whitespace-nowrap overflow-hidden text-ellipsis max-w-full px-0.5">
                {item.label}
              </span>
            </a>
          );
        })}
      </nav>
    </div>
  );
};

export default MobileNavigation;
