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
  MapPin,
  Link2,
  ExternalLink,
  Clipboard as ClipboardIcon,
} from 'lucide-react';
import { format } from 'date-fns';

interface Appointment {
  id: string;
  therapistEmail: string;
  scheduledAt: string;
  duration: number;
  type: 'video' | 'audio' | 'in_person';
  status: 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
  notes?: string;
  roomId?: string;
  meetingLink?: string | null;
}

interface AppointmentListProps {
  patientId: string;
  onJoinCall: (roomId: string, appointmentId: string, type: 'video' | 'audio' | 'in_person') => void;
}

const AppointmentList: React.FC<AppointmentListProps> = ({ patientId, onJoinCall }) => {
  const { toast } = useToast();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');

  const getTypeDisplay = (type: Appointment['type']) => {
    switch (type) {
      case 'video':
        return {
          label: 'Video session',
          icon: Video,
          accent: 'text-blue-600',
          badge: 'bg-blue-100 text-blue-800',
        };
      case 'audio':
        return {
          label: 'Audio session',
          icon: Phone,
          accent: 'text-green-600',
          badge: 'bg-green-100 text-green-800',
        };
      default:
        return {
          label: 'In-person session',
          icon: MapPin,
          accent: 'text-amber-600',
          badge: 'bg-amber-100 text-amber-800',
        };
    }
  };

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
    if (appointment.type === 'in_person') {
      toast({
        title: 'In-person session',
        description: 'This appointment is scheduled for an in-person visit. Arrive a few minutes early and bring your recording kit if required.',
      });
      return;
    }

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

  const openMeetingLink = (appointment: Appointment) => {
    if (!appointment.meetingLink) return;
    window.open(appointment.meetingLink, '_blank', 'noopener');
  };

  const copyMeetingLink = async (link: string) => {
    try {
      await navigator.clipboard.writeText(link);
      toast({
        title: 'Link copied',
        description: 'Meeting link copied to clipboard',
      });
    } catch (error) {
      console.error('Failed to copy link:', error);
      toast({
        title: 'Copy failed',
        description: 'Unable to copy meeting link',
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
    return (
      minutesUntil <= 10 &&
      minutesUntil >= -15 &&
      appointment.status !== 'cancelled' &&
      appointment.type !== 'in_person'
    );
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
            const typeInfo = getTypeDisplay(appointment.type);
            const TypeIcon = typeInfo.icon;

            return (
              <Card key={appointment.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6 space-y-4">
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div className="flex-1 space-y-3">
                      <div className="flex flex-wrap items-center gap-3">
                        <TypeIcon className={`w-5 h-5 ${typeInfo.accent}`} />
                        <div>
                          <p className="text-sm font-semibold text-gray-900">
                            {format(scheduledDate, 'EEEE, MMM d • h:mm a')}
                          </p>
                          <p className="text-xs text-gray-500">
                            Duration: {appointment.duration} minutes
                          </p>
                        </div>
                        <Badge className={`${typeInfo.badge} text-xs`}>{typeInfo.label}</Badge>
                        {getStatusBadge(appointment.status)}
                      </div>

                      <div className="flex items-center gap-2 text-sm text-gray-700">
                        <Calendar className="w-4 h-4" />
                        {format(scheduledDate, 'MMMM d, yyyy')}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-700">
                        <Clock className="w-4 h-4" />
                        {format(scheduledDate, 'h:mm a')} ({appointment.duration} minutes)
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-700">
                        <span className="text-xs font-semibold uppercase text-gray-500">Therapist</span>
                        <span>{appointment.therapistEmail}</span>
                      </div>

                      {appointment.meetingLink ? (
                        <div className="flex flex-wrap items-center gap-2 text-sm text-blue-700">
                          <Link2 className="w-4 h-4" />
                          <span className="truncate max-w-[220px] md:max-w-[280px]">
                            {appointment.meetingLink}
                          </span>
                          <Button
                            variant="outline"
                            size="xs"
                            onClick={() => copyMeetingLink(appointment.meetingLink || '')}
                            className="flex items-center gap-1"
                          >
                            <ClipboardIcon className="w-3 h-3" /> Copy
                          </Button>
                          <Button
                            variant="ghost"
                            size="xs"
                            className="text-blue-600 hover:text-blue-700"
                            onClick={() => openMeetingLink(appointment)}
                          >
                            <ExternalLink className="w-3 h-3 mr-1" /> Open
                          </Button>
                        </div>
                      ) : appointment.type === 'in_person' ? (
                        <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-700">
                          <AlertCircle className="w-4 h-4 mt-0.5" />
                          <span>
                            Plan for an on-site session. Bring the portable recorder so the AI summary can still be generated afterward.
                          </span>
                        </div>
                      ) : (
                        <div className="rounded-md border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
                          Your therapist will share the meeting link before the session, or you can join through Tranquiloo below.
                        </div>
                      )}

                      {appointment.notes && (
                        <div className="mt-2 rounded-md bg-gray-50 p-3 text-sm text-gray-700">
                          {appointment.notes}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex min-w-[180px] flex-col gap-2">
                      {appointment.meetingLink && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-blue-200 text-blue-600 hover:bg-blue-50"
                          onClick={() => openMeetingLink(appointment)}
                        >
                          <ExternalLink className="w-4 h-4 mr-2" />
                          Open link
                        </Button>
                      )}

                      {isJoinable && appointment.type !== 'in_person' && (
                        <Button
                          onClick={() => handleJoinAppointment(appointment)}
                          className="bg-green-600 hover:bg-green-700"
                          size="sm"
                        >
                          <Play className="w-4 h-4 mr-2" />
                          Join via Tranquiloo
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
                  {activeTab === 'upcoming' && !isJoinable && appointment.status !== 'cancelled' && appointment.type !== 'in_person' && (
                    <div className="rounded-md border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800">
                      <AlertCircle className="mr-2 inline h-4 w-4" />
                      You can join 10 minutes before your scheduled time.
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
