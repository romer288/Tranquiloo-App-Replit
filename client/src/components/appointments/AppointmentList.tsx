import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  Calendar,
  Clock,
  Video,
  Phone,
  X,
  Play,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { format } from 'date-fns';

interface Appointment {
  id: string;
  therapistEmail: string;
  scheduledAt: string;
  duration: number;
  type: 'video' | 'audio';
  status: 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
  notes?: string;
  roomId?: string;
}

interface AppointmentListProps {
  patientId: string;
  onJoinCall: (roomId: string, appointmentId: string, type: 'video' | 'audio') => void;
}

const AppointmentList: React.FC<AppointmentListProps> = ({ patientId, onJoinCall }) => {
  const { toast } = useToast();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');

  useEffect(() => {
    fetchAppointments();
    // Refresh every minute to update "Join" button availability
    const interval = setInterval(fetchAppointments, 60000);
    return () => clearInterval(interval);
  }, [patientId]);

  const fetchAppointments = async () => {
    try {
      const response = await fetch(`/api/appointments/patient/${patientId}`);
      if (response.ok) {
        const data = await response.json();
        setAppointments(data);
      }
    } catch (error) {
      console.error('Failed to fetch appointments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelAppointment = async (appointmentId: string) => {
    if (!confirm('Are you sure you want to cancel this appointment?')) {
      return;
    }

    try {
      const response = await fetch(`/api/appointments/${appointmentId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'Cancelled by patient' }),
      });

      if (response.ok) {
        toast({
          title: 'Appointment Cancelled',
          description: 'Your appointment has been cancelled',
        });
        fetchAppointments();
      }
    } catch (error) {
      console.error('Failed to cancel appointment:', error);
      toast({
        title: 'Cancellation Failed',
        description: 'Unable to cancel appointment',
        variant: 'destructive',
      });
    }
  };

  const handleJoinAppointment = async (appointment: Appointment) => {
    try {
      // Start the call if not already started
      if (!appointment.roomId) {
        const response = await fetch(`/api/appointments/${appointment.id}/start-call`, {
          method: 'POST',
        });

        if (response.ok) {
          const { roomId } = await response.json();
          onJoinCall(roomId, appointment.id, appointment.type);
        }
      } else {
        onJoinCall(appointment.roomId, appointment.id, appointment.type);
      }
    } catch (error) {
      console.error('Failed to join appointment:', error);
      toast({
        title: 'Join Failed',
        description: 'Unable to join appointment',
        variant: 'destructive',
      });
    }
  };

  const canJoinAppointment = (appointment: Appointment): boolean => {
    const scheduledTime = new Date(appointment.scheduledAt);
    const now = new Date();
    const diff = scheduledTime.getTime() - now.getTime();
    const minutesUntil = diff / 1000 / 60;

    // Can join 10 minutes before to 15 minutes after scheduled time
    return minutesUntil <= 10 && minutesUntil >= -15 && appointment.status !== 'cancelled';
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; label: string; icon: any }> = {
      scheduled: { variant: 'outline', label: 'Scheduled', icon: Calendar },
      confirmed: { variant: 'default', label: 'Confirmed', icon: CheckCircle },
      in_progress: { variant: 'default', label: 'In Progress', icon: Play },
      completed: { variant: 'secondary', label: 'Completed', icon: CheckCircle },
      cancelled: { variant: 'destructive', label: 'Cancelled', icon: X },
    };

    const config = variants[status] || variants.scheduled;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant as any} className="flex items-center gap-1">
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  const now = new Date();
  const upcomingAppointments = appointments.filter(
    (apt) => new Date(apt.scheduledAt) >= now && apt.status !== 'cancelled' && apt.status !== 'completed'
  );
  const pastAppointments = appointments.filter(
    (apt) => new Date(apt.scheduledAt) < now || apt.status === 'completed' || apt.status === 'cancelled'
  );

  const displayAppointments = activeTab === 'upcoming' ? upcomingAppointments : pastAppointments;

  if (loading) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <p className="text-gray-600">Loading appointments...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex gap-2 border-b">
        <button
          onClick={() => setActiveTab('upcoming')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'upcoming'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Upcoming ({upcomingAppointments.length})
        </button>
        <button
          onClick={() => setActiveTab('past')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'past'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Past ({pastAppointments.length})
        </button>
      </div>

      {/* Appointments List */}
      {displayAppointments.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p className="text-gray-600">
              {activeTab === 'upcoming'
                ? 'No upcoming appointments'
                : 'No past appointments'}
            </p>
            <p className="text-sm text-gray-500 mt-2">
              {activeTab === 'upcoming' && 'Schedule your first appointment above'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {displayAppointments.map((appointment) => {
            const scheduledDate = new Date(appointment.scheduledAt);
            const isJoinable = canJoinAppointment(appointment);

            return (
              <Card key={appointment.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        {appointment.type === 'video' ? (
                          <Video className="w-5 h-5 text-blue-600" />
                        ) : (
                          <Phone className="w-5 h-5 text-green-600" />
                        )}
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            {appointment.type === 'video' ? 'Video Session' : 'Audio Session'}
                          </h3>
                          <p className="text-sm text-gray-600">
                            with {appointment.therapistEmail}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-gray-700">
                          <Calendar className="w-4 h-4" />
                          {format(scheduledDate, 'EEEE, MMMM d, yyyy')}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-700">
                          <Clock className="w-4 h-4" />
                          {format(scheduledDate, 'h:mm a')} ({appointment.duration} minutes)
                        </div>
                      </div>

                      {appointment.notes && (
                        <div className="mt-3 p-3 bg-gray-50 rounded-md">
                          <p className="text-sm text-gray-700">{appointment.notes}</p>
                        </div>
                      )}

                      <div className="mt-4">
                        {getStatusBadge(appointment.status)}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2 ml-4">
                      {isJoinable && (
                        <Button
                          onClick={() => handleJoinAppointment(appointment)}
                          className="bg-green-600 hover:bg-green-700"
                          size="sm"
                        >
                          <Play className="w-4 h-4 mr-2" />
                          Join Now
                        </Button>
                      )}

                      {appointment.status === 'scheduled' && activeTab === 'upcoming' && (
                        <Button
                          onClick={() => handleCancelAppointment(appointment.id)}
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:text-red-700"
                        >
                          <X className="w-4 h-4 mr-2" />
                          Cancel
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Join Instructions */}
                  {activeTab === 'upcoming' && !isJoinable && appointment.status !== 'cancelled' && (
                    <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                      <p className="text-sm text-blue-800">
                        <AlertCircle className="w-4 h-4 inline mr-1" />
                        You can join 10 minutes before your scheduled time
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AppointmentList;
