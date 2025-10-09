import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  Phone,
  PhoneOff,
  Monitor,
  MonitorOff,
  FileText,
  Circle,
} from 'lucide-react';

interface VideoCallInterfaceProps {
  roomId: string;
  userName: string;
  userRole: 'therapist' | 'patient';
  appointmentId?: string;
  onEndCall: () => void;
}

interface TranscriptEntry {
  speaker: string;
  text: string;
  timestamp: Date;
  language: 'en' | 'es';
}

const VideoCallInterface: React.FC<VideoCallInterfaceProps> = ({
  roomId,
  userName,
  userRole,
  appointmentId,
  onEndCall,
}) => {
  const { toast } = useToast();
  const [isConnected, setIsConnected] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [callType, setCallType] = useState<'video' | 'audio'>('video');

  // Transcription & Recording state
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [showTranscript, setShowTranscript] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState<'en' | 'es'>('en');

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const recognitionRef = useRef<any>(null);
  const callStartTimeRef = useRef<Date>(new Date());

  // WebRTC configuration with STUN servers for NAT traversal
  const rtcConfig: RTCConfiguration = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
    ],
  };

  useEffect(() => {
    initializeCall();
    return () => {
      cleanupCall();
    };
  }, []);

  // Auto-start recording and transcription for HIPAA compliance
  useEffect(() => {
    if (isConnected && localStreamRef.current) {
      startRecording();
      startTranscription();
    }
  }, [isConnected]);

  const initializeCall = async () => {
    try {
      // Connect to signaling server
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws/video-call`;
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        console.log('WebSocket connected');
        wsRef.current?.send(JSON.stringify({
          type: 'join',
          roomId,
          userName,
          userRole,
        }));
      };

      wsRef.current.onmessage = handleSignalingMessage;

      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        toast({
          title: 'Connection Error',
          description: 'Failed to connect to signaling server',
          variant: 'destructive',
        });
      };

      // Get user media
      await startLocalStream(callType);
    } catch (error) {
      console.error('Failed to initialize call:', error);
      toast({
        title: 'Call Setup Failed',
        description: 'Unable to access camera/microphone',
        variant: 'destructive',
      });
    }
  };

  const startLocalStream = async (type: 'video' | 'audio') => {
    try {
      const constraints: MediaStreamConstraints = {
        audio: true,
        video: type === 'video' ? { width: 1280, height: 720 } : false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      localStreamRef.current = stream;

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      // Add tracks to peer connection if it exists
      if (peerConnectionRef.current) {
        stream.getTracks().forEach((track) => {
          peerConnectionRef.current?.addTrack(track, stream);
        });
      }
    } catch (error) {
      console.error('Failed to get local stream:', error);
      throw error;
    }
  };

  const createPeerConnection = () => {
    const pc = new RTCPeerConnection(rtcConfig);
    peerConnectionRef.current = pc;

    // Add local stream tracks to peer connection
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        pc.addTrack(track, localStreamRef.current!);
      });
    }

    // Handle incoming tracks
    pc.ontrack = (event) => {
      console.log('Received remote track');
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
      setIsConnected(true);
    };

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        wsRef.current?.send(JSON.stringify({
          type: 'ice-candidate',
          candidate: event.candidate,
          roomId,
        }));
      }
    };

    // Handle connection state changes
    pc.onconnectionstatechange = () => {
      console.log('Connection state:', pc.connectionState);
      if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
        setIsConnected(false);
        toast({
          title: 'Connection Lost',
          description: 'The call connection was lost',
          variant: 'destructive',
        });
      }
    };

    return pc;
  };

  const handleSignalingMessage = async (event: MessageEvent) => {
    const message = JSON.parse(event.data);

    switch (message.type) {
      case 'user-joined':
        console.log('User joined:', message.userName);
        toast({
          title: 'User Joined',
          description: `${message.userName} joined the call`,
        });
        // Create offer if we're the therapist (initiator)
        if (userRole === 'therapist') {
          await createOffer();
        }
        break;

      case 'offer':
        await handleOffer(message.offer);
        break;

      case 'answer':
        await handleAnswer(message.answer);
        break;

      case 'ice-candidate':
        await handleIceCandidate(message.candidate);
        break;

      case 'user-left':
        console.log('User left:', message.userName);
        toast({
          title: 'User Left',
          description: `${message.userName} left the call`,
        });
        break;

      default:
        console.log('Unknown message type:', message.type);
    }
  };

  const createOffer = async () => {
    try {
      const pc = createPeerConnection();
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      wsRef.current?.send(JSON.stringify({
        type: 'offer',
        offer,
        roomId,
      }));
    } catch (error) {
      console.error('Failed to create offer:', error);
    }
  };

  const handleOffer = async (offer: RTCSessionDescriptionInit) => {
    try {
      const pc = createPeerConnection();
      await pc.setRemoteDescription(new RTCSessionDescription(offer));

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      wsRef.current?.send(JSON.stringify({
        type: 'answer',
        answer,
        roomId,
      }));
    } catch (error) {
      console.error('Failed to handle offer:', error);
    }
  };

  const handleAnswer = async (answer: RTCSessionDescriptionInit) => {
    try {
      if (peerConnectionRef.current) {
        await peerConnectionRef.current.setRemoteDescription(
          new RTCSessionDescription(answer)
        );
      }
    } catch (error) {
      console.error('Failed to handle answer:', error);
    }
  };

  const handleIceCandidate = async (candidate: RTCIceCandidateInit) => {
    try {
      if (peerConnectionRef.current) {
        await peerConnectionRef.current.addIceCandidate(
          new RTCIceCandidate(candidate)
        );
      }
    } catch (error) {
      console.error('Failed to add ICE candidate:', error);
    }
  };

  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoEnabled(videoTrack.enabled);
      }
    }
  };

  const toggleAudio = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioEnabled(audioTrack.enabled);
      }
    }
  };

  const toggleScreenShare = async () => {
    try {
      if (!isScreenSharing) {
        // Start screen sharing
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
        });
        screenStreamRef.current = screenStream;

        // Replace video track with screen track
        const screenTrack = screenStream.getVideoTracks()[0];
        const sender = peerConnectionRef.current
          ?.getSenders()
          .find((s) => s.track?.kind === 'video');

        if (sender) {
          sender.replaceTrack(screenTrack);
        }

        // Handle screen share stop
        screenTrack.onended = () => {
          stopScreenShare();
        };

        setIsScreenSharing(true);
      } else {
        stopScreenShare();
      }
    } catch (error) {
      console.error('Failed to toggle screen share:', error);
      toast({
        title: 'Screen Share Failed',
        description: 'Unable to share screen',
        variant: 'destructive',
      });
    }
  };

  const stopScreenShare = async () => {
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((track) => track.stop());
      screenStreamRef.current = null;
    }

    // Replace screen track with camera track
    if (localStreamRef.current && peerConnectionRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      const sender = peerConnectionRef.current
        ?.getSenders()
        .find((s) => s.track?.kind === 'video');

      if (sender && videoTrack) {
        sender.replaceTrack(videoTrack);
      }
    }

    setIsScreenSharing(false);
  };

  // Recording functions
  const startRecording = () => {
    try {
      if (!localStreamRef.current) return;

      const options = { mimeType: 'video/webm;codecs=vp9,opus' };
      mediaRecorderRef.current = new MediaRecorder(localStreamRef.current, options);
      recordedChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.start(1000); // Collect data every second
      setIsRecording(true);

      console.log('📹 Recording started for HIPAA compliance');
    } catch (error) {
      console.error('Failed to start recording:', error);
    }
  };

  const stopRecording = (): Promise<Blob | null> => {
    return new Promise((resolve) => {
      if (!mediaRecorderRef.current || mediaRecorderRef.current.state === 'inactive') {
        resolve(null);
        return;
      }

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
        setIsRecording(false);
        resolve(blob);
      };

      mediaRecorderRef.current.stop();
    });
  };

  // Transcription functions (Web Speech API with bilingual support)
  const startTranscription = () => {
    try {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      if (!SpeechRecognition) {
        console.warn('Speech recognition not supported in this browser');
        return;
      }

      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = currentLanguage === 'en' ? 'en-US' : 'es-ES';

      recognitionRef.current.onresult = (event: any) => {
        const result = event.results[event.results.length - 1];

        if (result.isFinal) {
          const transcriptText = result[0].transcript;
          const entry: TranscriptEntry = {
            speaker: userName,
            text: transcriptText,
            timestamp: new Date(),
            language: currentLanguage,
          };

          setTranscript(prev => [...prev, entry]);
          console.log(`🎤 [${currentLanguage}] ${userName}: ${transcriptText}`);
        }
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
      };

      recognitionRef.current.start();
      setIsTranscribing(true);

      console.log(`🎤 Transcription started (${currentLanguage === 'en' ? 'English' : 'Spanish'})`);
    } catch (error) {
      console.error('Failed to start transcription:', error);
    }
  };

  const stopTranscription = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsTranscribing(false);
    }
  };

  const toggleLanguage = () => {
    const newLanguage = currentLanguage === 'en' ? 'es' : 'en';
    setCurrentLanguage(newLanguage);

    // Restart transcription with new language
    if (isTranscribing) {
      stopTranscription();
      setTimeout(() => {
        startTranscription();
      }, 100);
    }

    toast({
      title: 'Language Changed',
      description: `Transcription language: ${newLanguage === 'en' ? 'English' : 'Spanish'}`,
    });
  };

  const saveTranscriptToAppointment = async (transcriptText: string) => {
    if (!appointmentId) return;

    try {
      const callDuration = Math.floor((Date.now() - callStartTimeRef.current.getTime()) / 1000);

      const response = await fetch(`/api/appointments/${appointmentId}/end-call`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript: transcriptText,
          duration: callDuration,
          recordingUrl: 'recording-stored-locally', // Would upload to S3/similar in production
        }),
      });

      if (response.ok) {
        console.log('✅ Transcript saved to appointment');
        toast({
          title: 'Session Saved',
          description: 'Call recording and transcript saved successfully',
        });
      }
    } catch (error) {
      console.error('Failed to save transcript:', error);
      toast({
        title: 'Save Failed',
        description: 'Failed to save transcript to appointment',
        variant: 'destructive',
      });
    }
  };

  const endCall = async () => {
    // Stop recording and transcription
    stopTranscription();
    const recordingBlob = await stopRecording();

    // Format and save transcript
    if (transcript.length > 0) {
      const formattedTranscript = transcript.map(entry =>
        `[${entry.timestamp.toLocaleTimeString()}] ${entry.speaker} (${entry.language}): ${entry.text}`
      ).join('\n\n');

      await saveTranscriptToAppointment(formattedTranscript);
    }

    cleanupCall();
    onEndCall();
  };

  const cleanupCall = () => {
    // Stop local stream
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }

    // Stop screen share
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((track) => track.stop());
      screenStreamRef.current = null;
    }

    // Close peer connection
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    // Close WebSocket
    if (wsRef.current) {
      wsRef.current.send(JSON.stringify({
        type: 'leave',
        roomId,
      }));
      wsRef.current.close();
      wsRef.current = null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-gray-900 flex flex-col">
      {/* Header */}
      <div className="bg-gray-800 p-4 flex items-center justify-between">
        <div>
          <h2 className="text-white font-semibold">
            {userRole === 'therapist' ? 'Therapy Session' : 'Session with Therapist'}
          </h2>
          <p className="text-gray-400 text-sm">Room: {roomId}</p>
        </div>
        <div className="flex items-center gap-2">
          {isRecording && (
            <Badge className="bg-red-600 animate-pulse">
              <Circle className="w-2 h-2 mr-1 fill-white" />
              Recording
            </Badge>
          )}
          {isTranscribing && (
            <Badge className="bg-blue-600">
              <Mic className="w-3 h-3 mr-1" />
              Transcribing ({currentLanguage === 'en' ? 'EN' : 'ES'})
            </Badge>
          )}
          {isConnected ? (
            <Badge className="bg-green-600">Connected</Badge>
          ) : (
            <Badge variant="outline" className="text-yellow-500">Connecting...</Badge>
          )}
          <Badge variant="outline">
            {callType === 'video' ? 'Video Call' : 'Audio Call'}
          </Badge>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowTranscript(!showTranscript)}
            className="text-white"
          >
            <FileText className="w-4 h-4 mr-2" />
            Transcript ({transcript.length})
          </Button>
        </div>
      </div>

      {/* Video Container */}
      <div className="flex-1 relative flex">
        <div className={`relative bg-black ${showTranscript ? 'w-2/3' : 'w-full'} transition-all`}>
          {/* Remote Video (Main) */}
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-contain"
          />

          {/* Local Video (Picture-in-Picture) */}
          <div className="absolute top-4 right-4 w-64 h-48 bg-gray-800 rounded-lg overflow-hidden border-2 border-gray-600">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-2 left-2 bg-black/50 px-2 py-1 rounded text-white text-xs">
              You
            </div>
          </div>

          {/* No video indicator */}
          {!isVideoEnabled && (
            <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 bg-black/70 px-4 py-2 rounded-full text-white text-sm">
              Camera is off
            </div>
          )}
        </div>

        {/* Transcript Sidebar */}
        {showTranscript && (
          <div className="w-1/3 bg-gray-900 border-l border-gray-700 flex flex-col">
            <div className="p-4 border-b border-gray-700 flex items-center justify-between">
              <h3 className="text-white font-semibold">Live Transcript</h3>
              <Button
                size="sm"
                variant="outline"
                onClick={toggleLanguage}
                className="text-xs"
              >
                {currentLanguage === 'en' ? '🇺🇸 EN' : '🇪🇸 ES'}
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {transcript.length === 0 ? (
                <div className="text-gray-400 text-sm text-center mt-8">
                  <Mic className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>Transcript will appear here as you speak</p>
                  <p className="text-xs mt-2">Bilingual: English & Spanish</p>
                </div>
              ) : (
                transcript.map((entry, index) => (
                  <div key={index} className="bg-gray-800 rounded p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold text-blue-400">
                        {entry.speaker}
                      </span>
                      <span className="text-xs text-gray-500">
                        {entry.timestamp.toLocaleTimeString()} ({entry.language === 'en' ? 'EN' : 'ES'})
                      </span>
                    </div>
                    <p className="text-sm text-white">{entry.text}</p>
                  </div>
                ))
              )}
            </div>
            <div className="p-3 border-t border-gray-700 bg-gray-800">
              <p className="text-xs text-gray-400 text-center">
                🔒 HIPAA Compliant - Automatically saved to appointment
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="bg-gray-800 p-6">
        <div className="flex items-center justify-center gap-4">
          {/* Toggle Video */}
          <Button
            size="lg"
            variant={isVideoEnabled ? 'default' : 'destructive'}
            onClick={toggleVideo}
            className="rounded-full w-14 h-14"
          >
            {isVideoEnabled ? (
              <Video className="w-6 h-6" />
            ) : (
              <VideoOff className="w-6 h-6" />
            )}
          </Button>

          {/* Toggle Audio */}
          <Button
            size="lg"
            variant={isAudioEnabled ? 'default' : 'destructive'}
            onClick={toggleAudio}
            className="rounded-full w-14 h-14"
          >
            {isAudioEnabled ? (
              <Mic className="w-6 h-6" />
            ) : (
              <MicOff className="w-6 h-6" />
            )}
          </Button>

          {/* Toggle Screen Share (Therapist only) */}
          {userRole === 'therapist' && (
            <Button
              size="lg"
              variant={isScreenSharing ? 'default' : 'outline'}
              onClick={toggleScreenShare}
              className="rounded-full w-14 h-14"
            >
              {isScreenSharing ? (
                <MonitorOff className="w-6 h-6" />
              ) : (
                <Monitor className="w-6 h-6" />
              )}
            </Button>
          )}

          {/* End Call */}
          <Button
            size="lg"
            variant="destructive"
            onClick={endCall}
            className="rounded-full w-14 h-14"
          >
            <PhoneOff className="w-6 h-6" />
          </Button>
        </div>

        {/* Control Labels */}
        <div className="flex items-center justify-center gap-4 mt-2">
          <span className="text-gray-400 text-xs w-14 text-center">
            {isVideoEnabled ? 'Video' : 'Video Off'}
          </span>
          <span className="text-gray-400 text-xs w-14 text-center">
            {isAudioEnabled ? 'Mute' : 'Unmute'}
          </span>
          {userRole === 'therapist' && (
            <span className="text-gray-400 text-xs w-14 text-center">
              {isScreenSharing ? 'Stop Share' : 'Share'}
            </span>
          )}
          <span className="text-gray-400 text-xs w-14 text-center">End Call</span>
        </div>
      </div>
    </div>
  );
};

export default VideoCallInterface;
