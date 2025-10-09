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
} from 'lucide-react';

interface Appointment {
  id: string;
  patientId: string;
  therapistEmail: string;
  scheduledAt: string;
  duration: number;
  notes?: string;
  type: 'video' | 'audio';
  status: 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
  roomId?: string;
  startedAt?: string;
  endedAt?: string;
  recordingUrl?: string;
  transcript?: string;
  actualDuration?: number;
  cancellationReason?: string;
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
                      {apt.type === 'video' ? <Video className="w-3 h-3" /> : <Phone className="w-3 h-3" />}
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
          const canStartCall = isUpcoming && appointment.status === 'scheduled';
          const isRescheduling = rescheduleAppointment === appointment.id;

          return (
            <div
              key={appointment.id}
              className="border-2 rounded-lg p-5 hover:shadow-lg transition-all bg-white"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-lg ${
                    appointment.type === 'video' ? 'bg-blue-100' : 'bg-green-100'
                  }`}>
                    {appointment.type === 'video' ? (
                      <Video className="w-6 h-6 text-blue-600" />
                    ) : (
                      <Phone className="w-6 h-6 text-green-600" />
                    )}
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
