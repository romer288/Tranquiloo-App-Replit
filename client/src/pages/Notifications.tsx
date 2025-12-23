import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bell, AlertTriangle, Heart, CheckCircle, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/context/LanguageContext';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'anxiety' | 'treatment' | 'reminder' | 'achievement';
  priority: 'high' | 'medium' | 'low';
  timestamp: Date;
  read: boolean;
}

const Notifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const { t } = useLanguage();

  useEffect(() => {
    // Mock notifications based on anxiety and treatment levels
    const mockNotifications: Notification[] = [
      {
        id: '1',
        title: t('notifications.type.anxiety'),
        message: t('notifications.msg.anxiety'),
        type: 'anxiety',
        priority: 'high',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        read: false
      },
      {
        id: '2',
        title: t('notifications.type.achievement'),
        message: t('notifications.msg.achievement'),
        type: 'achievement',
        priority: 'medium',
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
        read: false
      },
      {
        id: '3',
        title: t('notifications.type.reminder'),
        message: t('notifications.msg.reminder'),
        type: 'reminder',
        priority: 'medium',
        timestamp: new Date(Date.now() - 48 * 60 * 60 * 1000), // 2 days ago
        read: true
      },
      {
        id: '4',
        title: t('notifications.type.treatment'),
        message: t('notifications.msg.treatment'),
        type: 'treatment',
        priority: 'low',
        timestamp: new Date(Date.now() - 72 * 60 * 60 * 1000), // 3 days ago
        read: true
      }
    ];

    setNotifications(mockNotifications);
  }, []);

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === id ? { ...notif, read: true } : notif
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notif => ({ ...notif, read: true }))
    );
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'anxiety':
        return <AlertTriangle className="w-5 h-5 text-red-500" />;
      case 'treatment':
        return <Heart className="w-5 h-5 text-blue-500" />;
      case 'reminder':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'achievement':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      default:
        return <Bell className="w-5 h-5 text-gray-500" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'border-l-red-500';
      case 'medium':
        return 'border-l-yellow-500';
      case 'low':
        return 'border-l-green-500';
      default:
        return 'border-l-gray-300';
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header - Responsive */}
      <div className="bg-white border-b border-gray-200 px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center space-x-4">
            <Link to="/dashboard" className="text-blue-600 hover:text-blue-700 text-md md:text-lg">
              ← {t('notifications.back')}
            </Link>
            <h1 className="text-xl font-semibold text-gray-900">{t('notifications.title')}</h1>
            {unreadCount > 0 && (
              <span className="bg-red-500 text-white text-xs text-center px-2 py-1 rounded-full">
                {unreadCount} {t('notifications.new')}
              </span>
            )}
          </div>
          {unreadCount > 0 && (
            <Button onClick={markAllAsRead} variant="outline" size="sm" className="w-full sm:w-auto">
              {t('notifications.markAll')}
            </Button>
          )}
        </div>
      </div>

      {/* Content - Responsive Container */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {notifications.length === 0 ? (
          <Card className="p-8 text-center">
            <Bell className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">{t('notifications.emptyTitle')}</h3>
            <p className="text-gray-600">{t('notifications.emptyDesc')}</p>
          </Card>
        ) : (
          <div className="space-y-4">
            {notifications.map((notification) => (
              <Card 
                key={notification.id}
                className={`p-4 sm:p-6 border-l-4 ${getPriorityColor(notification.priority)} ${
                  !notification.read ? 'bg-blue-50' : 'bg-white'
                } transition-shadow hover:shadow-md`}
              >
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 mt-1">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <h3 className={`text-lg font-medium ${
                        !notification.read ? 'text-gray-900' : 'text-gray-700'
                      }`}>
                        {notification.title}
                      </h3>
                      <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 text-sm text-gray-500">
                        <span>
                          {notification.timestamp.toLocaleDateString()} at{' '}
                          {notification.timestamp.toLocaleTimeString([], { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </span>
                        {!notification.read && (
                          <button
                            onClick={() => markAsRead(notification.id)}
                            className="text-blue-600 hover:text-blue-700 font-medium mt-2 sm:mt-0"
                          >
                            {t('notifications.markRead')}
                          </button>
                        )}
                      </div>
                    </div>
                    <p className={`mt-3 text-base ${
                      !notification.read ? 'text-gray-900' : 'text-gray-600'
                    }`}>
                      {notification.message}
                    </p>
                    
                    {/* Action buttons based on notification type - Responsive */}
                    {notification.type === 'anxiety' && (
                      <div className="mt-4 flex flex-col sm:flex-row gap-3">
                        <Button asChild size="sm" variant="outline" className="w-full sm:w-auto">
                          <Link to="/chat">{t('notifications.action.chat')}</Link>
                        </Button>
                        <Button asChild size="sm" variant="outline" className="w-full sm:w-auto">
                          <Link to="/track-anxiety">{t('notifications.action.track')}</Link>
                        </Button>
                      </div>
                    )}
                    
                    {notification.type === 'treatment' && (
                      <div className="mt-4">
                        <Button asChild size="sm" variant="outline" className="w-full sm:w-auto">
                          <Link to="/analytics">{t('notifications.action.progress')}</Link>
                        </Button>
                      </div>
                    )}
                    
                    {notification.type === 'reminder' && (
                      <div className="mt-4">
                        <Button asChild size="sm" variant="outline" className="w-full sm:w-auto">
                          <Link to="/find-therapist">View Therapist Info</Link>
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications;
