import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Video, Phone } from 'lucide-react';

interface CallInitiatorProps {
  recipientName: string;
  recipientId: string;
  onInitiateCall: (callType: 'video' | 'audio', roomId: string) => void;
}

const CallInitiator: React.FC<CallInitiatorProps> = ({
  recipientName,
  recipientId,
  onInitiateCall,
}) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleCall = (callType: 'video' | 'audio') => {
    // Generate a unique room ID
    const roomId = `room-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    onInitiateCall(callType, roomId);
    setIsDialogOpen(false);
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Video className="w-4 h-4" />
          Start Call
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Start a Call</DialogTitle>
          <DialogDescription>
            Choose the type of call you want to make with {recipientName}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 pt-4">
          <Card className="cursor-pointer hover:bg-gray-50 transition-colors">
            <CardContent className="p-6" onClick={() => handleCall('video')}>
              <div className="flex items-center gap-4">
                <div className="bg-blue-100 p-3 rounded-full">
                  <Video className="w-6 h-6 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">Video Call</h3>
                  <p className="text-sm text-gray-600">
                    Start a video call with camera and audio
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:bg-gray-50 transition-colors">
            <CardContent className="p-6" onClick={() => handleCall('audio')}>
              <div className="flex items-center gap-4">
                <div className="bg-green-100 p-3 rounded-full">
                  <Phone className="w-6 h-6 text-green-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">Audio Call</h3>
                  <p className="text-sm text-gray-600">
                    Start an audio-only call (phone call)
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
            <p className="font-medium mb-1">📶 Connection Required</p>
            <p>Both you and {recipientName} need an active internet connection for the call to work.</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CallInitiator;
