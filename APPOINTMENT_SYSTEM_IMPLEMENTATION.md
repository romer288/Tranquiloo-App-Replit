# Appointment & Video Call System Implementation Guide

## Overview
This document outlines the complete implementation of the appointment scheduling system integrated with video/audio calling for HIPAA-compliant therapy sessions.

## ✅ Completed Components

### Backend
1. **Database Schema** (`shared/schema.ts` & `server/db.ts`)
   - ✅ `appointments` table created with fields:
     - Patient ID, Therapist Email
     - Scheduled date/time, duration, type (video/audio)
     - Status tracking (scheduled → confirmed → in_progress → completed)
     - Room ID for WebRTC connection
     - Recording URL and transcript storage
     - HIPAA-compliant data storage

2. **API Routes** (`server/routes/appointments.ts`)
   - ✅ POST `/api/appointments/schedule` - Schedule appointment
   - ✅ GET `/api/appointments/patient/:patientId` - Get patient's appointments
   - ✅ GET `/api/appointments/therapist/:therapistEmail` - Get therapist's appointments
   - ✅ PATCH `/api/appointments/:id/status` - Update status
   - ✅ POST `/api/appointments/:id/start-call` - Start call (generates room ID)
   - ✅ POST `/api/appointments/:id/end-call` - End call (save recording/transcript)
   - ✅ DELETE `/api/appointments/:id` - Cancel appointment
   - ✅ GET `/api/appointments/upcoming/:userId/:role` - Get upcoming (next 7 days)

3. **Video Call Infrastructure**
   - ✅ WebRTC signaling server (`server/routes/video-call.ts`)
   - ✅ WebSocket integration in `server/index.ts`
   - ✅ Room-based architecture
   - ✅ STUN servers for NAT traversal

### Frontend Components
1. **Video Call Components** (already created)
   - ✅ `VideoCallInterface.tsx` - Main call interface
   - ✅ `CallInitiator.tsx` - Start call dialog
   - ✅ `IncomingCallNotification.tsx` - Incoming call UI

2. **Integration**
   - ✅ Therapist Dashboard integration
   - ✅ Call controls (video, audio, screen share, end)

## 🔨 Next Steps To Complete

### 1. Create Appointment Scheduling Components

#### A. Patient Dashboard - "Schedule Appointment" Tab

Create `/client/src/components/appointments/ScheduleAppointment.tsx`:
```typescript
- Calendar view showing available slots
- Select therapist from connected therapists
- Choose date and time
- Select appointment type (video or audio)
- Add optional notes
- Duration selector (30min, 45min, 60min, 90min)
- Confirmation dialog
```

#### B. Appointment List Component

Create `/client/src/components/appointments/AppointmentList.tsx`:
```typescript
- Show upcoming appointments
- Past appointments history
- Status indicators (scheduled, confirmed, completed, cancelled)
- "Join Call" button when appointment time arrives
- Cancel/reschedule options
```

#### C. Therapist Appointments Manager

Create `/client/src/components/therapist/AppointmentsManager.tsx`:
```typescript
- Calendar view of all appointments
- Patient name, time, type
- Confirm/cancel options
- "Start Call" button (opens VideoCallInterface)
- View past session recordings & transcripts
```

### 2. Integrate Appointments with Video Calls

#### Modify `VideoCallInterface.tsx`:
```typescript
- Add appointmentId prop
- Auto-start recording when call begins
- Auto-save transcript when call ends
- Update appointment status via API:
  - On call start: status = 'in_progress'
  - On call end: status = 'completed' + save recording/transcript
```

#### Add Recording Functionality:
```typescript
// In VideoCallInterface.tsx
const startRecording = () => {
  const mediaRecorder = new MediaRecorder(combinedStream);
  // Record audio + video
  // Save chunks to blob
  // On call end, upload to secure storage
};
```

### 3. Add to Patient Dashboard

#### Update `/client/src/pages/PatientDashboard.tsx`:
```typescript
- Add new tab: "Appointments"
- Import <ScheduleAppointment />
- Import <AppointmentList />
- Show upcoming appointment reminders
- "Join Call" button when appointment is active
```

### 4. Update Therapist Dashboard

#### Update `/client/src/pages/TherapistDashboard.tsx`:
```typescript
- Replace manual "Start Call" button with appointment-based calling
- Add "Appointments" section showing:
  - Today's appointments
  - Upcoming appointments (next 7 days)
  - "Start Appointment" button (only at scheduled time ±15 min)
```

#### Update Therapist Notes Tab:
```typescript
- Show appointment recordings & transcripts
- Link transcripts to treatment notes
- HIPAA compliance: encrypted storage, access logs
- Auto-populate session notes from transcript
```

### 5. HIPAA Compliance Features

#### A. Secure Recording Storage
```typescript
// Create /server/routes/secure-storage.ts
- Encrypt recordings before storage
- Store in HIPAA-compliant location (AWS S3 HIPAA, Azure HIPAA, etc.)
- Access logging for all playback
- Automatic retention policy (e.g., 7 years)
- Patient consent tracking
```

#### B. Consent Management
```typescript
// Add to appointment creation
- "I consent to this session being recorded" checkbox
- Store consent timestamp
- Show consent status in appointment details
```

#### C. Access Controls
```typescript
- Only patient and their therapist can access recordings
- Audit log for all recording access
- Automatic session timeout
- Encrypted transmission (HTTPS/WSS)
```

### 6. Notification System

#### Email Notifications:
```typescript
// Using existing emailService.ts
- Appointment confirmation (patient & therapist)
- Reminder 24 hours before
- Reminder 1 hour before
- Appointment cancelled/rescheduled
- Recording available notification
```

#### In-App Notifications:
```typescript
- Show banner when appointment is starting soon
- "Join Now" button appears 5 minutes before
- Alert if therapist is waiting
```

### 7. Recording & Transcript Integration

#### Auto-save to Therapist Notes:
```typescript
// When appointment ends:
1. Save recording URL to appointment
2. Generate transcript (already implemented)
3. Auto-create therapist session note:
   - Meeting title: "Appointment - [Date]"
   - Audio URL: from recording
   - Transcript: from speech recognition
   - Link to appointment in database
```

### 8. UI/UX Enhancements

#### Calendar Integration:
```typescript
- Visual calendar showing available slots
- Color coding: available (green), booked (blue), past (gray)
- Drag-and-drop rescheduling
- Therapist availability settings
```

#### Appointment Reminders:
```typescript
- Dashboard widgets showing next appointment
- Countdown timer ("Starts in 2 hours")
- Quick join button
```

## Implementation Order

### Phase 1: Basic Scheduling (Priority 1)
1. Create `ScheduleAppointment.tsx` component
2. Create `AppointmentList.tsx` component
3. Add "Appointments" tab to Patient Dashboard
4. Test scheduling flow

### Phase 2: Therapist Side (Priority 1)
1. Create `AppointmentsManager.tsx`
2. Integrate with Therapist Dashboard
3. Link appointments to video calls
4. Test therapist-patient appointment flow

### Phase 3: Recording & HIPAA (Priority 2)
1. Implement secure recording in `VideoCallInterface`
2. Create secure storage endpoint
3. Add consent management
4. Implement access logging

### Phase 4: Automation (Priority 3)
1. Auto-link recordings to therapist notes
2. Email notifications
3. In-app reminders
4. Calendar sync

### Phase 5: Polish (Priority 4)
1. Calendar view
2. Rescheduling
3. Analytics (appointment history, completion rate)
4. Reports generation

## API Usage Examples

### Schedule an Appointment (Patient)
```javascript
const response = await fetch('/api/appointments/schedule', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    patientId: currentUser.id,
    therapistEmail: selectedTherapist.email,
    appointmentDate: '2025-10-10',
    appointmentTime: '14:00',
    duration: 60,
    type: 'video',
    notes: 'First session'
  })
});
```

### Start Appointment Call (Therapist)
```javascript
// 1. Start the call
const { roomId } = await fetch(`/api/appointments/${appointmentId}/start-call`, {
  method: 'POST'
}).then(r => r.json());

// 2. Open VideoCallInterface with appointmentId
<VideoCallInterface
  roomId={roomId}
  userName={therapistName}
  userRole="therapist"
  appointmentId={appointmentId}
  onEndCall={handleEndCall}
/>
```

### End Call & Save Recording
```javascript
// In VideoCallInterface.tsx, when call ends:
const handleCallEnd = async () => {
  const recordingBlob = await stopRecording();
  const transcript = getFinalTranscript();

  // Upload recording
  const formData = new FormData();
  formData.append('recording', recordingBlob);
  const { recordingUrl } = await fetch('/api/recordings/upload', {
    method: 'POST',
    body: formData
  }).then(r => r.json());

  // Save to appointment
  await fetch(`/api/appointments/${appointmentId}/end-call`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      recordingUrl,
      transcript,
      duration: actualCallDuration
    })
  });
};
```

## Security Considerations

### HIPAA Compliance Checklist:
- [ ] All data encrypted at rest and in transit
- [ ] Access logging for all PHI access
- [ ] Patient consent for recording
- [ ] Secure storage with retention policy
- [ ] BAA (Business Associate Agreement) with cloud provider
- [ ] Regular security audits
- [ ] Data breach notification procedures
- [ ] User authentication & authorization
- [ ] Session timeouts
- [ ] Audit trails

### WebRTC Security:
- ✅ DTLS-SRTP encryption (built into WebRTC)
- ✅ Secure signaling (WSS)
- [ ] TURN server for corporate firewalls (optional)
- [ ] Additional end-to-end encryption layer (optional)

## Testing Checklist

### Functional Testing:
- [ ] Patient can schedule appointment
- [ ] Therapist receives notification
- [ ] Both parties can join call at scheduled time
- [ ] Recording starts/stops automatically
- [ ] Transcript generated correctly
- [ ] Recording saved securely
- [ ] Therapist can access recording & transcript
- [ ] Appointment status updates correctly
- [ ] Cancellation works

### Performance Testing:
- [ ] Video quality acceptable
- [ ] Audio sync issues
- [ ] Recording doesn't lag call
- [ ] Database handles multiple concurrent appointments
- [ ] WebSocket server handles multiple rooms

### Security Testing:
- [ ] Unauthorized users cannot access recordings
- [ ] Encryption verified
- [ ] Access logs working
- [ ] Session timeouts enforced

## Next Immediate Steps (To Get Started):

1. **Run the server** - Database tables will be created automatically
2. **Create ScheduleAppointment.tsx** - Copy structure from existing components
3. **Add Appointments tab to Patient Dashboard**
4. **Test basic scheduling flow**
5. **Then move to therapist side**

The backend infrastructure is complete - now we need the UI components!
