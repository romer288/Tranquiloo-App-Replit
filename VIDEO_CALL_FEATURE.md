# Video Call Feature Documentation

## Overview
The Tranquiloo App now supports **real-time video and audio calls** between therapists and patients using WebRTC technology. This feature enables secure, peer-to-peer communication directly through the web browser.

## Features

### 1. **Video Calls** 📹
- Full HD video calling with camera and microphone
- Real-time video streaming between therapist and patient
- Picture-in-picture display (local video in corner)

### 2. **Audio Calls** 📞
- Audio-only calls (phone call mode)
- Lower bandwidth usage for slower connections
- Same quality audio without video

### 3. **Call Controls**
- **Toggle Video**: Turn camera on/off during call
- **Toggle Audio**: Mute/unmute microphone
- **Screen Share**: Therapists can share their screen (therapist only)
- **End Call**: Terminate the session

### 4. **Connection Status**
- Real-time connection indicators
- "Connected" badge when call is active
- "Connecting..." status during setup

## How It Works

### Technology Stack
- **WebRTC**: Peer-to-peer video/audio streaming
- **WebSocket**: Signaling server for call setup
- **STUN Servers**: Google STUN servers for NAT traversal

### Call Flow

1. **Initiation**:
   - Therapist clicks "Start Call" button
   - Chooses Video or Audio call
   - Unique room ID is generated

2. **Signaling**:
   - WebSocket connection established
   - Offer/Answer exchange via signaling server
   - ICE candidates exchanged for NAT traversal

3. **Connection**:
   - Peer-to-peer WebRTC connection established
   - Media streams (video/audio) flow directly between participants
   - No media data goes through the server

4. **Active Call**:
   - Real-time audio/video communication
   - Control buttons for video, audio, screen share
   - Low latency, high quality

## Requirements

### Internet Connection
- **Both participants must have active internet** (WiFi or cellular data)
- **Minimum recommended bandwidth**:
  - Video calls: 1 Mbps upload/download
  - Audio calls: 100 Kbps upload/download

### Browser Support
- ✅ **Chrome** (recommended)
- ✅ **Firefox**
- ✅ **Safari** (14+)
- ✅ **Edge**
- ❌ Internet Explorer (not supported)

### Permissions Required
- **Camera** access (for video calls)
- **Microphone** access (for all calls)
- **Screen sharing** (optional, for therapists)

## Usage Guide

### For Therapists

1. **Select a patient** from your patient list
2. **Click "Start Call"** button (appears in bottom right)
3. **Choose call type**:
   - Video Call (camera + audio)
   - Audio Call (audio only)
4. **Wait for patient to accept**
5. **During call**:
   - Toggle video on/off
   - Mute/unmute microphone
   - Share your screen (to show resources, documents)
   - End call when finished

### For Patients

1. **Receive incoming call notification** (appears as overlay)
2. **See caller name and call type** (video or audio)
3. **Accept or Decline** the call
4. **Auto-reject after 30 seconds** if no response
5. **During call**:
   - Toggle video on/off
   - Mute/unmute microphone
   - End call when finished

## Security & Privacy

### Data Protection
- **Peer-to-peer encryption**: WebRTC uses DTLS-SRTP encryption
- **No recording**: Calls are not recorded by default
- **Direct connection**: Media streams don't pass through server
- **Secure signaling**: WebSocket connections use WSS (secure)

### Privacy Features
- Camera/microphone can be disabled anytime
- No call history stored
- Participants can leave call anytime

## Troubleshooting

### Call Won't Connect
1. Check internet connection (both participants)
2. Verify browser permissions for camera/microphone
3. Try refreshing the page
4. Use Chrome browser (best compatibility)

### Poor Video Quality
1. Check internet speed (run speed test)
2. Close other bandwidth-heavy apps
3. Switch to audio-only mode
4. Move closer to WiFi router

### No Audio/Video
1. Check browser permissions
2. Make sure camera/mic aren't being used by other apps
3. Try different browser
4. Restart browser/device

### Firewall Issues
- WebRTC uses STUN servers to traverse NAT
- Corporate firewalls may block WebRTC
- Contact IT department if calls fail in office environment

## Technical Details

### Files
- `/client/src/components/video-call/VideoCallInterface.tsx` - Main call interface
- `/client/src/components/video-call/CallInitiator.tsx` - Call initiation dialog
- `/client/src/components/video-call/IncomingCallNotification.tsx` - Incoming call UI
- `/server/routes/video-call.ts` - WebSocket signaling server

### WebSocket Endpoint
- **Development**: `ws://localhost:5000/ws/video-call`
- **Production**: `wss://your-domain.com/ws/video-call`

### STUN Servers Used
- `stun:stun.l.google.com:19302`
- `stun:stun1.l.google.com:19302`

## Future Enhancements

- [ ] Call recording (with consent)
- [ ] Multi-participant calls (group therapy)
- [ ] Chat during calls
- [ ] Virtual backgrounds
- [ ] Call quality indicators
- [ ] TURN server support (for restricted networks)
- [ ] Call history/logs
- [ ] Scheduled calls with calendar integration

## Support

For technical issues or questions about the video call feature:
1. Check browser console for errors
2. Verify WebSocket connection is established
3. Ensure both participants have stable internet
4. Try using Chrome browser for best compatibility

---

**Note**: This feature requires both participants to be online simultaneously with active internet connections. Calls are peer-to-peer and don't consume server bandwidth for media streaming.
