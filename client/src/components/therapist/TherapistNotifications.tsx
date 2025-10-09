import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Bell, Mail, CheckCircle, Clock, Check, X } from 'lucide-react';

interface EmailNotification {
  id: string;
  toEmail: string;
  fromEmail: string;
  subject: string;
  htmlContent: string;
  emailType: string;
  status: string;
  metadata: string;
  createdAt: string;
}

interface TherapistNotificationsProps {
  therapistEmail: string;
}

const TherapistNotifications: React.FC<TherapistNotificationsProps> = ({ therapistEmail }) => {
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<EmailNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [processingConnection, setProcessingConnection] = useState<string | null>(null);
  const [acceptedPatients, setAcceptedPatients] = useState<Record<string, any>>({});

  useEffect(() => {
    loadNotifications();
  }, [therapistEmail]);

  const loadNotifications = async () => {
    try {
      const response = await fetch(`/api/therapist/notifications/${encodeURIComponent(therapistEmail)}`);
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications);
        setUnreadCount(data.unreadCount);
      }
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const parseMetadata = (metadata: string | null) => {
    if (!metadata) return {};
    try {
      return JSON.parse(metadata);
    } catch {
      return {};
    }
  };

  const handleConnectionResponse = async (connectionId: string, action: 'accept' | 'reject') => {
    setProcessingConnection(connectionId);

    try {
      const response = await fetch(`/api/therapist/connection/${connectionId}/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });

      if (response.ok) {
        const data = await response.json();

        if (action === 'accept' && data.patientDetails) {
          // Store patient details in state to display in the notification
          setAcceptedPatients(prev => ({
            ...prev,
            [connectionId]: data.patientDetails
          }));

          toast({
            title: 'Connection Accepted ✓',
            description: 'Patient details are now visible in the notification',
          });
        } else {
          toast({
            title: action === 'accept' ? 'Connection Accepted' : 'Connection Declined',
            description: action === 'accept'
              ? 'You can now view this patient\'s data and schedule appointments'
              : 'The connection request has been declined',
          });
        }

        // Reload notifications
        await loadNotifications();
      } else if (response.status === 404) {
        // Connection no longer exists - silently remove the notification
        toast({
          title: 'Notification Removed',
          description: 'This connection request is no longer valid',
        });
        await loadNotifications();
      } else {
        throw new Error('Failed to process connection');
      }
    } catch (error) {
      console.error('Failed to respond to connection:', error);
      toast({
        title: 'Error',
        description: 'Failed to process connection request',
        variant: 'destructive',
      });
    } finally {
      setProcessingConnection(null);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Loading Notifications...
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="w-5 h-5" />
          Notifications
          {unreadCount > 0 && (
            <Badge variant="destructive">{unreadCount} new</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {notifications.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Mail className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>No notifications yet</p>
            <p className="text-sm">Patient connection requests will appear here</p>
          </div>
        ) : (
          <div className="space-y-4">
            {notifications.map((notification) => {
              const metadata = parseMetadata(notification.metadata);
              return (
                <div
                  key={notification.id}
                  className={`border rounded-lg p-4 ${
                    notification.status === 'pending' ? 'bg-blue-50 border-blue-200' : 'bg-gray-50'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {notification.status === 'pending' ? (
                        <Clock className="w-4 h-4 text-blue-600" />
                      ) : (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      )}
                      <h4 className="font-medium">{notification.subject}</h4>
                    </div>
                    <Badge 
                      variant={notification.status === 'pending' ? 'default' : 'secondary'}
                    >
                      {notification.status}
                    </Badge>
                  </div>
                  
                  {notification.emailType === 'connection_request' && metadata.connectionId && (
                    <>
                      {acceptedPatients[metadata.connectionId] ? (
                        // Show patient details after acceptance
                        <div className="bg-green-50 border border-green-200 rounded p-4 mt-3">
                          <h5 className="font-semibold text-green-900 mb-3 flex items-center gap-2">
                            <CheckCircle className="w-5 h-5" />
                            Patient Information
                          </h5>
                          <div className="space-y-2 text-sm">
                            <div className="flex items-start gap-2">
                              <span className="font-medium text-gray-700 min-w-[100px]">Name:</span>
                              <span className="text-gray-900 font-semibold">
                                {acceptedPatients[metadata.connectionId].firstName} {acceptedPatients[metadata.connectionId].lastName}
                              </span>
                            </div>
                            <div className="flex items-start gap-2">
                              <span className="font-medium text-gray-700 min-w-[100px]">Email:</span>
                              <span className="text-gray-900">{acceptedPatients[metadata.connectionId].email}</span>
                            </div>
                            <div className="flex items-start gap-2">
                              <span className="font-medium text-gray-700 min-w-[100px]">Patient Code:</span>
                              <code className="bg-gray-100 px-2 py-1 rounded text-gray-900 font-mono">
                                {acceptedPatients[metadata.connectionId].patientCode}
                              </code>
                            </div>
                            {acceptedPatients[metadata.connectionId].gender && (
                              <div className="flex items-start gap-2">
                                <span className="font-medium text-gray-700 min-w-[100px]">Gender:</span>
                                <span className="text-gray-900">{acceptedPatients[metadata.connectionId].gender}</span>
                              </div>
                            )}
                            {acceptedPatients[metadata.connectionId].dateOfBirth && (
                              <div className="flex items-start gap-2">
                                <span className="font-medium text-gray-700 min-w-[100px]">Age:</span>
                                <span className="text-gray-900">
                                  {Math.floor((Date.now() - new Date(acceptedPatients[metadata.connectionId].dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))} years
                                </span>
                              </div>
                            )}
                            {acceptedPatients[metadata.connectionId].phoneNumber && (
                              <div className="flex items-start gap-2">
                                <span className="font-medium text-gray-700 min-w-[100px]">Phone:</span>
                                <span className="text-gray-900">{acceptedPatients[metadata.connectionId].phoneNumber}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      ) : notification.status === 'sent' ? (
                        // Show minimal info with accept/reject buttons for pending requests
                        <>
                          <div className="bg-blue-50 border border-blue-200 rounded p-4 mt-3">
                            <p className="text-sm text-gray-700 mb-3">
                              <strong>Would you like to see this patient?</strong>
                            </p>
                            <p className="text-sm text-gray-600 mb-2">
                              By accepting, you will gain access to their medical reports, anxiety tracking data, and chat history.
                            </p>
                            <p className="text-xs text-gray-500">
                              Patient details will be revealed after you accept the connection.
                            </p>
                          </div>

                          <div className="flex gap-2 mt-4">
                            <Button
                              onClick={() => handleConnectionResponse(metadata.connectionId, 'accept')}
                              disabled={processingConnection === metadata.connectionId}
                              className="flex-1 bg-green-600 hover:bg-green-700"
                              size="sm"
                            >
                              <Check className="w-4 h-4 mr-2" />
                              {processingConnection === metadata.connectionId ? 'Processing...' : 'Accept Patient'}
                            </Button>
                            <Button
                              onClick={() => handleConnectionResponse(metadata.connectionId, 'reject')}
                              disabled={processingConnection === metadata.connectionId}
                              variant="outline"
                              className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                              size="sm"
                            >
                              <X className="w-4 h-4 mr-2" />
                              {processingConnection === metadata.connectionId ? 'Processing...' : 'Decline'}
                            </Button>
                          </div>
                        </>
                      ) : (
                        // Show full details for accepted/rejected connections
                        <div className="text-sm text-gray-600 mb-3">
                          <div dangerouslySetInnerHTML={{ __html: notification.htmlContent }} />
                        </div>
                      )}
                    </>
                  )}

                  <div className="text-xs text-gray-400 mt-3">
                    {formatDate(notification.createdAt)}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TherapistNotifications;