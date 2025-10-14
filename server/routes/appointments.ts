import { Router, Request, Response } from 'express';
import { db } from '../db';
import { appointments } from '@shared/schema';
import { eq, and, gte, lte } from 'drizzle-orm';
import { storage } from '../storage';
import { randomUUID } from 'crypto';

const router = Router();

// Create appointment (patient schedules)
router.post('/schedule', async (req: Request, res: Response) => {
  try {
    const {
      patientId,
      therapistEmail,
      appointmentDate,
      appointmentTime,
      duration = 60, // default 60 minutes
      notes,
      type = 'video', // 'video', 'audio', or 'in_person'
      meetingLink,
    } = req.body;

    if (!patientId || !therapistEmail || !appointmentDate || !appointmentTime) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (!['video', 'audio', 'in_person'].includes(type)) {
      return res.status(400).json({ error: 'Invalid appointment type' });
    }

    // Combine date and time into ISO string
    const scheduledDateTime = new Date(`${appointmentDate}T${appointmentTime}`).toISOString();

    const appointmentId = randomUUID();

    const [appointment] = await db.insert(appointments).values({
      id: appointmentId,
      patientId,
      therapistEmail,
      scheduledAt: scheduledDateTime,
      duration,
      notes,
      type,
      meetingLink: meetingLink?.trim() || null,
      status: 'scheduled',
      createdAt: new Date().toISOString(),
    }).returning();

    // Get patient details for notification
    const patient = await storage.getProfile(patientId);

    // Send email notification to therapist
    const appointmentDateTime = new Date(scheduledDateTime);
    const formattedDate = appointmentDateTime.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    const formattedTime = appointmentDateTime.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });

    const emailContent = `
      <h2>New Appointment Scheduled</h2>
      <p>A patient has scheduled an appointment with you.</p>

      <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin-top: 0;">Appointment Details</h3>
        <p><strong>Patient:</strong> ${patient?.firstName} ${patient?.lastName}</p>
        <p><strong>Patient Email:</strong> ${patient?.email}</p>
        <p><strong>Date:</strong> ${formattedDate}</p>
        <p><strong>Time:</strong> ${formattedTime}</p>
        <p><strong>Duration:</strong> ${duration} minutes</p>
        <p><strong>Type:</strong> ${
          type === 'video'
            ? 'Video Call'
            : type === 'audio'
              ? 'Audio Call'
              : 'In-Person Session'
        }</p>
        ${meetingLink ? `<p><strong>Meeting Link:</strong> ${meetingLink}</p>` : ''}
        ${notes ? `<p><strong>Notes:</strong> ${notes}</p>` : ''}
      </div>

      <p><strong>This appointment will be automatically recorded and transcribed for HIPAA compliance.</strong></p>

      <p>You can join the call from your therapist dashboard when the appointment time arrives.</p>
    `;

    await storage.createEmailNotification({
      toEmail: therapistEmail,
      subject: `New Appointment: ${formattedDate} at ${formattedTime}`,
      htmlContent: emailContent,
      emailType: 'appointment_scheduled',
      metadata: JSON.stringify({
        appointmentId: appointment.id,
        patientId,
        patientName: `${patient?.firstName} ${patient?.lastName}`,
        scheduledAt: scheduledDateTime,
        type,
        duration,
      }),
    });

    res.json({ success: true, appointment });
  } catch (error) {
    console.error('Failed to create appointment:', error);
    res.status(500).json({ error: 'Failed to schedule appointment' });
  }
});

// Get appointments for patient
router.get('/patient/:patientId', async (req: Request, res: Response) => {
  try {
    const { patientId } = req.params;
    const patientAppointments = await db
      .select()
      .from(appointments)
      .where(eq(appointments.patientId, patientId))
      .orderBy(appointments.scheduledAt);

    res.json(patientAppointments);
  } catch (error) {
    console.error('Failed to fetch patient appointments:', error);
    res.status(500).json({ error: 'Failed to fetch appointments' });
  }
});

// Get appointments for therapist
router.get('/therapist/:therapistEmail', async (req: Request, res: Response) => {
  try {
    const { therapistEmail } = req.params;
    const therapistAppointments = await db
      .select()
      .from(appointments)
      .where(eq(appointments.therapistEmail, therapistEmail))
      .orderBy(appointments.scheduledAt);

    res.json(therapistAppointments);
  } catch (error) {
    console.error('Failed to fetch therapist appointments:', error);
    res.status(500).json({ error: 'Failed to fetch appointments' });
  }
});

// Update appointment status
router.patch('/:appointmentId/status', async (req: Request, res: Response) => {
  try {
    const { appointmentId } = req.params;
    const { status } = req.body;

    if (!['scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const [updated] = await db
      .update(appointments)
      .set({ status, updatedAt: new Date().toISOString() })
      .where(eq(appointments.id, appointmentId))
      .returning();

    res.json({ success: true, appointment: updated });
  } catch (error) {
    console.error('Failed to update appointment:', error);
    res.status(500).json({ error: 'Failed to update appointment' });
  }
});

// Start call for appointment (generates room ID)
router.post('/:appointmentId/start-call', async (req: Request, res: Response) => {
  try {
    const { appointmentId } = req.params;

    // Generate unique room ID
    const roomId = `appt-${appointmentId}-${Date.now()}`;

    const [updated] = await db
      .update(appointments)
      .set({
        status: 'in_progress',
        roomId,
        startedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .where(eq(appointments.id, appointmentId))
      .returning();

    res.json({ success: true, roomId, appointment: updated });
  } catch (error) {
    console.error('Failed to start call:', error);
    res.status(500).json({ error: 'Failed to start call' });
  }
});

// End call and save recording data
router.post('/:appointmentId/end-call', async (req: Request, res: Response) => {
  try {
    const { appointmentId } = req.params;
    const { recordingUrl, transcript, duration } = req.body;

    const [updated] = await db
      .update(appointments)
      .set({
        status: 'completed',
        endedAt: new Date().toISOString(),
        recordingUrl,
        transcript,
        actualDuration: duration,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(appointments.id, appointmentId))
      .returning();

    res.json({ success: true, appointment: updated });
  } catch (error) {
    console.error('Failed to end call:', error);
    res.status(500).json({ error: 'Failed to end call' });
  }
});

// Cancel appointment
router.delete('/:appointmentId', async (req: Request, res: Response) => {
  try {
    const { appointmentId } = req.params;
    const { reason } = req.body;

    const [updated] = await db
      .update(appointments)
      .set({
        status: 'cancelled',
        cancellationReason: reason,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(appointments.id, appointmentId))
      .returning();

    res.json({ success: true, appointment: updated });
  } catch (error) {
    console.error('Failed to cancel appointment:', error);
    res.status(500).json({ error: 'Failed to cancel appointment' });
  }
});

// Update appointment details (meeting link, type, notes)
router.patch('/:appointmentId/details', async (req: Request, res: Response) => {
  try {
    const { appointmentId } = req.params;
    const { type, meetingLink, notes } = req.body as {
      type?: string;
      meetingLink?: string | null;
      notes?: string | null;
    };

    const updateData: Record<string, any> = {
      updatedAt: new Date().toISOString(),
    };

    if (typeof type !== 'undefined') {
      if (!['video', 'audio', 'in_person'].includes(type)) {
        return res.status(400).json({ error: 'Invalid appointment type' });
      }
      updateData.type = type;
    }

    if (typeof meetingLink !== 'undefined') {
      const trimmed = typeof meetingLink === 'string' ? meetingLink.trim() : '';
      updateData.meetingLink = trimmed ? trimmed : null;
    }

    if (typeof notes !== 'undefined') {
      updateData.notes = notes;
    }

    const [updated] = await db
      .update(appointments)
      .set(updateData)
      .where(eq(appointments.id, appointmentId))
      .returning();

    res.json({ success: true, appointment: updated });
  } catch (error) {
    console.error('Failed to update appointment details:', error);
    res.status(500).json({ error: 'Failed to update appointment details' });
  }
});

// Get upcoming appointments (next 7 days)
router.get('/upcoming/:userId/:role', async (req: Request, res: Response) => {
  try {
    const { userId, role } = req.params; // role: 'patient' or 'therapist'
    const now = new Date().toISOString();
    const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    let upcomingAppointments;
    if (role === 'patient') {
      upcomingAppointments = await db
        .select()
        .from(appointments)
        .where(
          and(
            eq(appointments.patientId, userId),
            gte(appointments.scheduledAt, now),
            lte(appointments.scheduledAt, nextWeek)
          )
        )
        .orderBy(appointments.scheduledAt);
    } else {
      upcomingAppointments = await db
        .select()
        .from(appointments)
        .where(
          and(
            eq(appointments.therapistEmail, userId),
            gte(appointments.scheduledAt, now),
            lte(appointments.scheduledAt, nextWeek)
          )
        )
        .orderBy(appointments.scheduledAt);
    }

    res.json(upcomingAppointments);
  } catch (error) {
    console.error('Failed to fetch upcoming appointments:', error);
    res.status(500).json({ error: 'Failed to fetch upcoming appointments' });
  }
});

export default router;
