import React from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import VideoCallInterface from '@/components/video-call/VideoCallInterface';
import { useAuth } from '@/hooks/useAuth';

const VideoCall: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const appointmentId = searchParams.get('appointmentId');

  if (!roomId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Invalid Room</h1>
          <p className="text-gray-400 mb-6">No room ID provided</p>
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Authentication Required</h1>
          <p className="text-gray-400 mb-6">Please log in to join the call</p>
          <button
            onClick={() => navigate('/login')}
            className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-700"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  const userName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email;
  const userRole = user.role === 'therapist' ? 'therapist' : 'patient';

  const handleEndCall = () => {
    // Navigate back to appropriate dashboard
    if (userRole === 'therapist') {
      navigate('/therapist-dashboard');
    } else {
      navigate('/dashboard');
    }
  };

  return (
    <VideoCallInterface
      roomId={roomId}
      userName={userName}
      userRole={userRole}
      appointmentId={appointmentId || undefined}
      onEndCall={handleEndCall}
    />
  );
};

export default VideoCall;
