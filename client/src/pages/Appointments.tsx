import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/routes';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Calendar } from 'lucide-react';
import ScheduleAppointment from '@/components/appointments/ScheduleAppointment';
import AppointmentList from '@/components/appointments/AppointmentList';
import VideoCallInterface from '@/components/video-call/VideoCallInterface';
import { useLanguage } from '@/context/LanguageContext';

const Appointments = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [refreshKey, setRefreshKey] = useState(0);
  const { t } = useLanguage();

  // Video call state
  const [isInCall, setIsInCall] = useState(false);
  const [callRoomId, setCallRoomId] = useState('');
  const [appointmentId, setAppointmentId] = useState('');
  const [callType, setCallType] = useState<'video' | 'audio' | 'in_person'>('video');

  const handleScheduled = () => {
    // Refresh the appointment list
    setRefreshKey(prev => prev + 1);
  };

  const handleJoinCall = (roomId: string, aptId: string, type: 'video' | 'audio' | 'in_person') => {
    setCallRoomId(roomId);
    setAppointmentId(aptId);
    setCallType(type);
    setIsInCall(true);
  };

  const handleEndCall = async () => {
    // End call and save any recording/transcript
    // This will be handled in the VideoCallInterface component
    setIsInCall(false);
    setCallRoomId('');
    setAppointmentId('');

    // Refresh appointments to show completed status
    setRefreshKey(prev => prev + 1);
  };

  if (!user?.id) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p>Please log in to view appointments</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-8 py-4">
        <div className="flex items-center justify-between max-w-6xl mx-auto">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(ROUTES.dashboard)}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t('appointments.back')}
            </Button>
            <div>
              <h1 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <Calendar className="w-6 h-6" />
                {t('appointments.title')}
              </h1>
              <p className="text-sm text-gray-600">{t('appointments.subtitle')}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-8 py-8">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Schedule New Appointment */}
          <div>
            <ScheduleAppointment
              patientId={user.id}
              onScheduled={handleScheduled}
            />
          </div>

          {/* Appointment List */}
          <div>
            <AppointmentList
              key={refreshKey}
              patientId={user.id}
              onJoinCall={handleJoinCall}
            />
          </div>
        </div>
      </div>

      {/* Video Call Interface (Full Screen Overlay) */}
      {isInCall && callRoomId && (
        <VideoCallInterface
          roomId={callRoomId}
          userName={user.username || user.email || 'Patient'}
          userRole="patient"
          onEndCall={handleEndCall}
        />
      )}
    </div>
  );
};

export default Appointments;
