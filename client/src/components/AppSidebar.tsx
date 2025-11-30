
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import { MessageCircle, Heart, BarChart3, Users, Stethoscope, Settings, HelpCircle, LayoutDashboard, LogOut, Share, History, Calendar } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/context/LanguageContext';
import LanguageSwitcher from './LanguageSwitcher';

const navigationItems = [
  {
    title: 'nav.dashboard',
    url: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'nav.chat',
    url: '/chat',
    icon: MessageCircle,
  },
  {
    title: 'nav.chatHistory',
    url: '/chat-history',
    icon: History,
  },
  {
    title: 'nav.analytics',
    url: '/analytics',
    icon: BarChart3,
  },
  {
    title: 'nav.appointments',
    url: '/appointments',
    icon: Calendar,
  },
  {
    title: 'nav.treatment',
    url: '/treatment-resources',
    icon: Stethoscope,
  },
  {
    title: 'nav.contactTherapist',
    url: '/contact-therapist',
    icon: Users,
  },
  {
    title: 'nav.settings',
    url: '/settings',
    icon: Settings,
  },
  {
    title: 'nav.help',
    url: '/help',
    icon: HelpCircle,
  },
];

export function AppSidebar() {
  const location = useLocation();
  const { signOut } = useAuth();
  const { toast } = useToast();
  const { t } = useLanguage();

  const handleLogout = async () => {
    await signOut();
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Anxiety Companion',
          text: 'Check out this amazing mental health companion app!',
          url: window.location.origin,
        });
      } catch (error) {
        // Fallback to clipboard
        await navigator.clipboard.writeText(window.location.origin);
        toast({
          title: "Link copied!",
          description: "App link has been copied to clipboard.",
        });
      }
    } else {
      // Fallback to clipboard
      await navigator.clipboard.writeText(window.location.origin);
      toast({
        title: "Link copied!",
        description: "App link has been copied to clipboard.",
      });
    }
  };

  return (
    <Sidebar className="border-r border-gray-200 hidden md:flex">
      <SidebarContent className="bg-white">
        <ContextMenu>
          <ContextMenuTrigger asChild>
            <div className="p-6 border-b border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Heart className="w-4 h-4 text-blue-600" />
                </div>
                <span className="font-semibold text-gray-900">{t('brand.title')}</span>
              </div>
            </div>
          </ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuItem onClick={handleShare} className="flex items-center space-x-2">
              <Share className="w-4 h-4" />
              <span>Share App</span>
            </ContextMenuItem>
            <ContextMenuItem onClick={handleLogout} className="flex items-center space-x-2 text-red-600">
              <LogOut className="w-4 h-4" />
              <span>Log Out</span>
            </ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>

        <div className="px-4 py-3 border-b border-gray-200">
          <LanguageSwitcher size="sm" />
        </div>
        
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1 p-4">
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <Link 
                    to={item.url} 
                    className={`w-full justify-start px-3 py-2 rounded-lg transition-colors flex items-center space-x-3 ${
                      location.pathname === item.url
                        ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                    data-testid={`nav-link-${item.title.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
                    onClick={(e) => {
                      e.preventDefault();
                      console.log('Navigation clicked:', item.url);
                      // Force immediate navigation
                      window.location.href = item.url;
                    }}
                  >
                    <item.icon className="w-5 h-5" />
                    <span className="font-medium">{t(item.title, item.title)}</span>
                  </Link>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
