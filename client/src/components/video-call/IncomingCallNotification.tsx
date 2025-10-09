import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Video, Phone, PhoneOff } from 'lucide-react';

interface IncomingCallNotificationProps {
  callerName: string;
  callType: 'video' | 'audio';
  roomId: string;
  onAccept: (roomId: string) => void;
  onReject: () => void;
}

const IncomingCallNotification: React.FC<IncomingCallNotificationProps> = ({
  callerName,
  callType,
  roomId,
  onAccept,
  onReject,
}) => {
  const [isRinging, setIsRinging] = useState(true);
  const [ringTimer, setRingTimer] = useState(30); // 30 seconds timeout

  useEffect(() => {
    // Auto-reject after 30 seconds
    const timeout = setTimeout(() => {
      onReject();
    }, 30000);

    // Countdown timer
    const interval = setInterval(() => {
      setRingTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
    };
  }, [onReject]);

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <Card className="w-full max-w-md animate-pulse">
        <CardContent className="p-8">
          <div className="text-center space-y-6">
            {/* Caller Icon */}
            <div className="flex justify-center">
              <div className="bg-blue-100 p-6 rounded-full">
                {callType === 'video' ? (
                  <Video className="w-12 h-12 text-blue-600" />
                ) : (
                  <Phone className="w-12 h-12 text-green-600" />
                )}
              </div>
            </div>

            {/* Caller Info */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {callerName}
              </h2>
              <Badge variant="outline" className="mb-2">
                {callType === 'video' ? 'Video Call' : 'Audio Call'}
              </Badge>
              <p className="text-gray-600">Incoming call...</p>
            </div>

            {/* Timer */}
            <div className="text-sm text-gray-500">
              Auto-reject in {ringTimer}s
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 justify-center">
              <Button
                size="lg"
                variant="destructive"
                onClick={onReject}
                className="rounded-full w-16 h-16"
              >
                <PhoneOff className="w-6 h-6" />
              </Button>
              <Button
                size="lg"
                className="rounded-full w-16 h-16 bg-green-600 hover:bg-green-700"
                onClick={() => onAccept(roomId)}
              >
                {callType === 'video' ? (
                  <Video className="w-6 h-6" />
                ) : (
                  <Phone className="w-6 h-6" />
                )}
              </Button>
            </div>

            {/* Button Labels */}
            <div className="flex gap-4 justify-center text-sm text-gray-600">
              <span className="w-16 text-center">Decline</span>
              <span className="w-16 text-center">Accept</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default IncomingCallNotification;
