import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import {
  Calendar,
  Clock,
  Video,
  Phone,
  CheckCircle,
  XCircle,
  PlayCircle,
  FileText,
  ChevronLeft,
  ChevronRight,
  Edit,
  Trash2,
  MapPin,
  Link2,
  ExternalLink,
  Clipboard as ClipboardIcon,
} from 'lucide-react';

interface Appointment {
  id: string;
  patientId: string;
  therapistEmail: string;
  scheduledAt: string;
  duration: number;
  notes?: string;
  type: 'video' | 'audio' | 'in_person';
  status: 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
  roomId?: string;
  startedAt?: string;
  endedAt?: string;
  recordingUrl?: string;
  transcript?: string;
  actualDuration?: number;
  cancellationReason?: string;
  meetingLink?: string | null;
  createdAt: string;
  updatedAt?: string;
}

interface Patient {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
}

interface AppointmentsCalendarProps {
  therapistEmail: string;
}

const AppointmentsCalendar: React.FC<AppointmentsCalendarProps> = ({ therapistEmail }) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<Record<string, Patient>>({});
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [rescheduleAppointment, setRescheduleAppointment] = useState<string | null>(null);
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');
  const [formatEditAppointment, setFormatEditAppointment] = useState<string | null>(null);
  const [formatType, setFormatType] = useState<'video' | 'audio' | 'in_person'>('video');
  const [formatLink, setFormatLink] = useState('');

  useEffect(() => {
    loadAppointments();
  }, [therapistEmail]);

  const loadAppointments = async () => {
    try {
      const response = await fetch(`/api/appointments/therapist/${encodeURIComponent(therapistEmail)}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch appointments: ${response.status}`);
      }

      const data = await response.json();
      setAppointments(data);

      // Load patient details for each appointment
      if (data && data.length > 0) {
        const uniquePatientIds = [...new Set(data.map((apt: Appointment) => apt.patientId))];
        const patientPromises = uniquePatientIds.map(async (patientId) => {
          try {
            const res = await fetch(`/api/user/profile/${patientId}`);
            if (res.ok) {
              return await res.json();
            }
          } catch (err) {
            console.error(`Failed to load patient ${patientId}:`, err);
          }
          return null;
        });

        const patientData = await Promise.all(patientPromises);
        const patientMap: Record<string, Patient> = {};
        patientData.forEach((patient) => {
          if (patient) {
            patientMap[patient.id] = patient;
          }
        });
        setPatients(patientMap);

        // Auto-select first appointment date if exists
        if (data.length > 0) {
          const firstApt = data.sort((a: Appointment, b: Appointment) =>
            new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()
          )[0];
          setSelectedDate(new Date(firstApt.scheduledAt));
          setCurrentDate(new Date(firstApt.scheduledAt));
        }
      }
    } catch (error) {
      console.error('Failed to load appointments:', error);
      toast({
        title: 'Error',
        description: 'Failed to load appointments',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStartCall = async (appointmentId: string) => {
    try {
      const response = await fetch(`/api/appointments/${appointmentId}/start-call`, {
        method: 'POST',
      });

      if (response.ok) {
        const data = await response.json();
        toast({
          title: 'Call Started',
          description: 'Opening video call interface...',
        });

        navigate(`/video-call/${data.roomId}?appointmentId=${appointmentId}`);
      }
    } catch (error) {
      console.error('Failed to start call:', error);
      toast({
        title: 'Error',
        description: 'Failed to start call',
        variant: 'destructive',
      });
    }
  };

  const handleCancelAppointment = async (appointmentId: string) => {
    const reason = prompt('Please provide a reason for cancellation:');
    if (!reason) return;

    try {
      const response = await fetch(`/api/appointments/${appointmentId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });

      if (response.ok) {
        toast({
          title: 'Appointment Cancelled',
          description: 'The appointment has been cancelled',
        });
        await loadAppointments();
      }
    } catch (error) {
      console.error('Failed to cancel appointment:', error);
      toast({
        title: 'Error',
        description: 'Failed to cancel appointment',
        variant: 'destructive',
      });
    }
  };

  const handleReschedule = async (appointmentId: string) => {
    if (!newDate || !newTime) {
      toast({
        title: 'Error',
        description: 'Please provide both date and time',
        variant: 'destructive',
      });
      return;
    }

    try {
      const newScheduledAt = new Date(`${newDate}T${newTime}`).toISOString();

      const response = await fetch(`/api/appointments/${appointmentId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'scheduled',
          scheduledAt: newScheduledAt
        }),
      });

      if (response.ok) {
        toast({
          title: 'Appointment Rescheduled',
          description: 'The appointment has been rescheduled successfully',
        });
        setRescheduleAppointment(null);
        setNewDate('');
        setNewTime('');
        await loadAppointments();
      }
    } catch (error) {
      console.error('Failed to reschedule appointment:', error);
      toast({
        title: 'Error',
        description: 'Failed to reschedule appointment',
        variant: 'destructive',
      });
    }
  };

  const handleFormatUpdate = async (appointmentId: string) => {
    try {
      const response = await fetch(`/api/appointments/${appointmentId}/details`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: formatType,
          meetingLink: formatLink,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update appointment');
      }

      toast({
        title: 'Session details updated',
        description: 'Appointment format and link have been saved',
      });
      setFormatEditAppointment(null);
      setFormatLink('');
      await loadAppointments();
    } catch (error) {
      console.error('Failed to update appointment details:', error);
      toast({
        title: 'Update failed',
        description: 'Could not update appointment details',
        variant: 'destructive',
      });
    }
  };

  const handleCopyLink = async (link: string) => {
    try {
      await navigator.clipboard.writeText(link);
      toast({
        title: 'Copied',
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

  // Calendar helper functions
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const getAppointmentsForDate = (date: Date) => {
    return appointments.filter(apt => {
      const aptDate = new Date(apt.scheduledAt);
      return aptDate.getDate() === date.getDate() &&
             aptDate.getMonth() === date.getMonth() &&
             aptDate.getFullYear() === date.getFullYear();
    });
  };

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDate(today);
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
      time: date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      }),
    };
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeDisplay = (type: Appointment['type']) => {
    switch (type) {
      case 'video':
        return { label: 'Video Session', description: 'Will use Tranquiloo video or external meeting link', icon: Video, color: 'text-blue-600' };
      case 'audio':
        return { label: 'Audio Session', description: 'Phone-style call or voice-only meeting', icon: Phone, color: 'text-green-600' };
      default:
        return { label: 'In-Person Session', description: 'Meet at the agreed physical location', icon: MapPin, color: 'text-amber-600' };
    }
  };

  // Render calendar grid
  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const days = [];
    const today = new Date();

    // Empty cells for days before month starts
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="min-h-[120px] p-2 border border-gray-200 bg-gray-50"></div>);
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      const dayAppointments = getAppointmentsForDate(date);
      const isToday = date.toDateString() === today.toDateString();
      const isSelected = selectedDate && date.toDateString() === selectedDate.toDateString();

      days.push(
        <div
          key={day}
          onClick={() => setSelectedDate(date)}
          className={`min-h-[120px] p-2 border cursor-pointer transition-all ${
            isToday ? 'bg-blue-50 border-blue-400 border-2' : 'border-gray-200 hover:bg-gray-50'
          } ${isSelected ? 'ring-2 ring-blue-500 bg-blue-50' : ''}`}
        >
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between mb-2">
              <span className={`text-base font-bold ${isToday ? 'text-blue-600 text-lg' : 'text-gray-700'}`}>
                {day}
              </span>
              {dayAppointments.length > 0 && (
                <span className="text-xs bg-blue-600 text-white rounded-full w-5 h-5 flex items-center justify-center font-semibold">
                  {dayAppointments.length}
                </span>
              )}
            </div>
            <div className="flex-1 space-y-1 overflow-y-auto">
              {dayAppointments.map((apt) => {
                const patient = patients[apt.patientId];
                return (
                  <div
                    key={apt.id}
                    className={`text-xs px-2 py-1 rounded-md truncate font-medium ${
                      apt.status === 'scheduled' ? 'bg-blue-600 text-white' :
                      apt.status === 'completed' ? 'bg-gray-400 text-white' :
                      apt.status === 'cancelled' ? 'bg-red-400 text-white' :
                      'bg-yellow-500 text-white'
                    }`}
                    title={`${new Date(apt.scheduledAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })} - ${patient?.firstName} ${patient?.lastName}`}
                  >
                    <div className="flex items-center gap-1">
                      {apt.type === 'video' ? (
                        <Video className="w-3 h-3" />
                      ) : apt.type === 'audio' ? (
                        <Phone className="w-3 h-3" />
                      ) : (
                        <MapPin className="w-3 h-3" />
                      )}
                      <span>{new Date(apt.scheduledAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}</span>
                    </div>
                    {patient && <div className="truncate">{patient.firstName} {patient.lastName?.charAt(0)}.</div>}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      );
    }

    return days;
  };

  // Render selected date appointments
  const renderSelectedDateAppointments = () => {
    const dayAppointments = getAppointmentsForDate(selectedDate);

    if (dayAppointments.length === 0) {
      return (
        <div className="text-center py-12 text-gray-500">
          <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <p className="text-lg font-medium">No appointments on this day</p>
          <p className="text-sm">Select a different date to view appointments</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <h3 className="font-semibold text-xl text-gray-800 mb-4">
          {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
        </h3>
        {dayAppointments.map((appointment) => {
          const patient = patients[appointment.patientId];
          const { time } = formatDateTime(appointment.scheduledAt);
          const isUpcoming = new Date(appointment.scheduledAt) >= new Date();
          const canStartCall =
            isUpcoming &&
            appointment.status === 'scheduled' &&
            appointment.type !== 'in_person';
          const isRescheduling = rescheduleAppointment === appointment.id;
          const isEditingFormat = formatEditAppointment === appointment.id;
          const typeInfo = getTypeDisplay(appointment.type);
          const typeBg =
            appointment.type === 'video'
              ? 'bg-blue-100'
              : appointment.type === 'audio'
                ? 'bg-green-100'
                : 'bg-amber-100';

          return (
            <div
              key={appointment.id}
              className="border-2 rounded-lg p-5 hover:shadow-lg transition-all bg-white"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-lg ${typeBg}`}>
                    <typeInfo.icon
                      className={`w-6 h-6 ${typeInfo.color}`}
                    />
                  </div>
                  <div>
                    <h4 className="font-bold text-lg text-gray-900">
                      {patient ? `${patient.firstName} ${patient.lastName} Appointment` : 'Patient Appointment'}
                    </h4>
                    {patient && <p className="text-sm text-gray-600">{patient.email}</p>}
                  </div>
                </div>
                <Badge className={`${getStatusColor(appointment.status)} px-3 py-1 text-sm font-semibold`}>
                  {appointment.status.replace('_', ' ').toUpperCase()}
                </Badge>
              </div>

              <div className="space-y-3 mb-4 bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center gap-3 text-gray-700">
                  <Clock className="w-5 h-5 text-gray-500" />
                  <span className="font-semibold text-lg">{time}</span>
                  <span className="text-gray-500">({appointment.duration} minutes)</span>
                </div>
                <div className="flex flex-col gap-2 text-gray-700">
                  <span className="text-sm font-semibold">Session format</span>
                  <div className="text-sm text-gray-600">
                    <p className="font-medium text-gray-800">{typeInfo.label}</p>
                    <p className="text-xs text-gray-500">{typeInfo.description}</p>
                  </div>
                  <Button
                    variant="link"
                    size="sm"
                    className="p-0 h-auto w-fit text-blue-600"
                    onClick={() => {
                      setFormatEditAppointment(appointment.id);
                      setRescheduleAppointment(null);
                      setFormatType(appointment.type);
                      setFormatLink(appointment.meetingLink || '');
                    }}
                  >
                    Edit session format / meeting link
                  </Button>
                  {appointment.meetingLink ? (
                    <div className="flex flex-wrap items-center gap-2 text-sm">
                      <Link2 className="w-4 h-4 text-blue-500" />
                      <span className="truncate max-w-[240px] text-blue-600">
                        {appointment.meetingLink}
                      </span>
                      <Button
                        variant="outline"
                        size="xs"
                        onClick={() => handleCopyLink(appointment.meetingLink || '')}
                        className="flex items-center gap-1"
                      >
                        <ClipboardIcon className="w-3 h-3" /> Copy
                      </Button>
                      <Button
                        variant="ghost"
                        size="xs"
                        className="text-blue-600 hover:text-blue-700"
                        onClick={() => window.open(appointment.meetingLink || '', '_blank', 'noopener')}
                      >
                        <ExternalLink className="w-3 h-3 mr-1" /> Open
                      </Button>
                    </div>
                  ) : appointment.type === 'in_person' ? (
                    <div className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
                      Remember to capture session audio with the in-person recording workflow so summaries remain accurate.
                    </div>
                  ) : (
                    <p className="text-xs text-gray-500">
                      Add a meeting link to use Zoom, Google Meet, or Teams.
                    </p>
                  )}
                </div>
                {appointment.notes && (
                  <div className="flex items-start gap-3 text-gray-700">
                    <FileText className="w-5 h-5 text-gray-500 mt-0.5" />
                    <span className="italic">{appointment.notes}</span>
                  </div>
                )}
              </div>

              {isRescheduling ? (
                <div className="bg-blue-50 p-4 rounded-lg space-y-3">
                  <h5 className="font-semibold text-sm text-gray-700">Reschedule Appointment</h5>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-gray-600 block mb-1">New Date</label>
                      <Input
                        type="date"
                        value={newDate}
                        onChange={(e) => setNewDate(e.target.value)}
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-600 block mb-1">New Time</label>
                      <Input
                        type="time"
                        value={newTime}
                        onChange={(e) => setNewTime(e.target.value)}
                        className="w-full"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleReschedule(appointment.id)}
                      className="bg-blue-600 hover:bg-blue-700"
                      size="sm"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Confirm Reschedule
                    </Button>
                    <Button
                      onClick={() => {
                        setRescheduleAppointment(null);
                        setNewDate('');
                        setNewTime('');
                      }}
                      variant="outline"
                      size="sm"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : isEditingFormat ? (
                <div className="bg-slate-50 border border-slate-200 p-4 rounded-lg space-y-3">
                  <h5 className="font-semibold text-sm text-gray-700">Update session format</h5>
                  <div className="grid gap-3 md:grid-cols-3">
                    {(['video', 'audio', 'in_person'] as Appointment['type'][]).map((option) => {
                      const optionInfo = getTypeDisplay(option);
                      const optionBg =
                        option === 'video'
                          ? 'border-blue-300 bg-blue-50'
                          : option === 'audio'
                            ? 'border-green-300 bg-green-50'
                            : 'border-amber-300 bg-amber-50';
                      const isSelected = formatType === option;
                      return (
                        <button
                          key={option}
                          type="button"
                          onClick={() => {
                            setFormatType(option);
                            if (option === 'in_person') {
                              setFormatLink('');
                            }
                          }}
                          className={`rounded-lg border p-3 text-left transition-colors ${
                            isSelected ? optionBg : 'border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <optionInfo.icon className={`w-4 h-4 mb-2 ${optionInfo.color}`} />
                          <p className="text-sm font-semibold text-slate-800">{optionInfo.label}</p>
                          <p className="text-xs text-slate-600">{optionInfo.description}</p>
                        </button>
                      );
                    })}
                  </div>
                  {formatType !== 'in_person' && (
                    <div>
                      <label className="text-xs text-gray-600 block mb-1">Meeting link</label>
                      <Input
                        placeholder="https://..."
                        value={formatLink}
                        onChange={(e) => setFormatLink(e.target.value)}
                      />
                      <p className="text-[11px] text-gray-500 mt-1">
                        Paste the Zoom, Google Meet, or Teams link therapists and patients should use.
                      </p>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => handleFormatUpdate(appointment.id)}>
                      <CheckCircle className="w-4 h-4 mr-2" /> Save format
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setFormatEditAppointment(null);
                        setFormatLink('');
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex gap-2 flex-wrap">
                  {canStartCall && (
                    <Button
                      onClick={() => handleStartCall(appointment.id)}
                      className="bg-green-600 hover:bg-green-700"
                      size="sm"
                    >
                      <PlayCircle className="w-4 h-4 mr-2" />
                      Start Call
                    </Button>
                  )}
                  {appointment.status === 'scheduled' && (
                    <>
                      <Button
                        onClick={() => {
                          setRescheduleAppointment(appointment.id);
                          setFormatEditAppointment(null);
                          setFormatLink('');
                          const aptDate = new Date(appointment.scheduledAt);
                          setNewDate(aptDate.toISOString().split('T')[0]);
                          setNewTime(aptDate.toTimeString().slice(0, 5));
                        }}
                        variant="outline"
                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        size="sm"
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Reschedule
                      </Button>
                      <Button
                        onClick={() => {
                          setFormatEditAppointment(appointment.id);
                          setRescheduleAppointment(null);
                          setFormatType(appointment.type);
                          setFormatLink(appointment.meetingLink || '');
                        }}
                        variant="outline"
                        className="text-slate-600 hover:text-slate-800 hover:bg-slate-100"
                        size="sm"
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Edit session format
                      </Button>
                      <Button
                        onClick={() => handleCancelAppointment(appointment.id)}
                        variant="outline"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        size="sm"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Cancel
                      </Button>
                    </>
                  )}
                  {appointment.transcript && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        alert(appointment.transcript);
                      }}
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      View Transcript
                    </Button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Loading Appointments...
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
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Calendar View - Takes 2 columns */}
      <div className="lg:col-span-2">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-6 h-6" />
                Appointments Calendar
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {/* Calendar Header */}
            <div className="flex items-center justify-between mb-6">
              <Button variant="outline" size="sm" onClick={previousMonth}>
                <ChevronLeft className="w-5 h-5" />
              </Button>
              <div className="flex items-center gap-4">
                <h2 className="text-2xl font-bold text-gray-800">
                  {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </h2>
                <Button variant="outline" size="sm" onClick={goToToday}>
                  Today
                </Button>
              </div>
              <Button variant="outline" size="sm" onClick={nextMonth}>
                <ChevronRight className="w-5 h-5" />
              </Button>
            </div>

            {/* Day names */}
            <div className="grid grid-cols-7 gap-0 mb-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <div key={day} className="text-center text-sm font-bold text-gray-700 py-3 bg-gray-100">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-0 border">
              {renderCalendar()}
            </div>

            {/* Legend */}
            <div className="flex items-center gap-4 mt-4 text-xs text-gray-600">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-blue-600 rounded"></div>
                <span>Scheduled</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-yellow-500 rounded"></div>
                <span>In Progress</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-gray-400 rounded"></div>
                <span>Completed</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-red-400 rounded"></div>
                <span>Cancelled</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Appointment Details - Takes 1 column */}
      <div className="lg:col-span-1">
        <Card className="sticky top-4">
          <CardHeader>
            <CardTitle className="text-lg">Appointment Details</CardTitle>
          </CardHeader>
          <CardContent className="max-h-[600px] overflow-y-auto">
            {renderSelectedDateAppointments()}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AppointmentsCalendar;
