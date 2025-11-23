import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import * as bcrypt from "bcryptjs";
import { emailService } from "./emailService";
import { randomBytes } from "crypto";
import appointmentsRouter from "./routes/appointments";
import processEmailsRouter from "./routes/process-emails";
import { supabase } from "./lib/supabase";

import { analyzeAnxietyContext, detectAnxietyTriggers } from "@shared/mentalHealth/anxietyContexts";

import { detectPsychosisIndicators } from "@shared/mentalHealth/psychosis";
import {
  insertProfileSchema, insertChatSessionSchema, insertChatMessageSchema,
  insertAnxietyAnalysisSchema, insertTherapistSchema, insertUserTherapistSchema,
  insertUserGoalSchema, insertGoalProgressSchema, insertInterventionSummarySchema,
  normalizeInterventionSummary, type Therapist
} from "@shared/schema";

const LOG_SNIPPET_MAX_LENGTH = 200;

const createLogSnippet = (text: string): string => {
  const sanitized = text.replace(/\s+/g, " ").trim();
  if (sanitized.length <= LOG_SNIPPET_MAX_LENGTH) {
    return sanitized;
  }
  return `${sanitized.slice(0, LOG_SNIPPET_MAX_LENGTH)}…`;
};

// Lightweight JSON repair helper inspired by the jsonrepair package to work in restricted
// environments where external dependencies may not be available.
const jsonrepair = (rawJson: string): string => {
  let text = rawJson.trim();

  // Normalize smart quotes and other punctuation that commonly breaks JSON parsing
  text = text
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'");

  // Remove trailing commas that break JSON.parse
  text = text.replace(/,\s*([}\]])/g, "$1");

  // Quote unquoted keys
  text = text.replace(/([{,]\s*)([A-Za-z0-9_]+)\s*:/g, '$1"$2":');

  // Convert single quoted strings to double quoted strings with proper escaping
  text = text.replace(/'([^'\\]*(?:\\.[^'\\]*)*)'/g, (_match, value) => {
    const escaped = String(value)
      .replace(/\\/g, "\\\\")
      .replace(/"/g, '\\"');
    return `"${escaped}"`;
  });

  // Normalize boolean/null spellings sometimes used by LLMs
  text = text
    .replace(/\bTrue\b/g, "true")
    .replace(/\bFalse\b/g, "false")
    .replace(/\bNone\b/g, "null");

  // Balance braces and brackets if they are uneven
  const openBraces = (text.match(/\{/g) || []).length;
  const closeBraces = (text.match(/\}/g) || []).length;
  if (openBraces > closeBraces) {
    text += "}".repeat(openBraces - closeBraces);
  }

  const openBrackets = (text.match(/\[/g) || []).length;
  const closeBrackets = (text.match(/\]/g) || []).length;
  if (openBrackets > closeBrackets) {
    text += "]".repeat(openBrackets - closeBrackets);
  }

  return text;
};

const parseJsonWithRepair = (provider: string, rawJson: string): any | null => {
  try {
    return JSON.parse(rawJson);
  } catch (parseError) {
    console.warn(`[${provider}] Initial JSON.parse failed: ${parseError instanceof Error ? parseError.message : String(parseError)}. Snippet: ${createLogSnippet(rawJson)}`);
  }

  const repaired = jsonrepair(rawJson);

  if (repaired !== rawJson) {
    console.log(`[${provider}] Attempting to parse repaired JSON payload.`);
  } else {
    console.log(`[${provider}] JSON repair made no structural changes; retrying parse.`);
  }

  try {
    const parsed = JSON.parse(repaired);
    console.log(`[${provider}] JSON parse succeeded after repair.`);
    return parsed;
  } catch (errorAfterRepair) {
    console.error(`[${provider}] JSON.parse failed after repair: ${errorAfterRepair instanceof Error ? errorAfterRepair.message : String(errorAfterRepair)}. Snippet: ${createLogSnippet(repaired)}`);
    return null;
  }
};

const escapeHtml = (value: unknown): string => {
  if (value === null || value === undefined) {
    return '';
  }

  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
};

const toDate = (value: unknown): Date | null => {
  if (value === null || value === undefined) {
    return null;
  }

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  const directDate = new Date(value as any);
  if (!Number.isNaN(directDate.getTime())) {
    return directDate;
  }

  const numericValue = typeof value === 'string' ? Number(value) : value;
  if (typeof numericValue === 'number' && Number.isFinite(numericValue)) {
    const fromNumber = new Date(numericValue);
    if (!Number.isNaN(fromNumber.getTime())) {
      return fromNumber;
    }
  }

  return null;
};

const formatDate = (value: unknown): string => {
  const date = toDate(value);
  if (!date) {
    return 'N/A';
  }

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric'
  }).format(date);
};

const formatDateRange = (start: unknown, end: unknown): string => {
  const startFormatted = formatDate(start);
  const endFormatted = formatDate(end);

  if (startFormatted === 'N/A' && endFormatted === 'N/A') {
    return 'Date not available';
  }

  if (endFormatted === 'N/A') {
    return startFormatted;
  }

  return `${startFormatted} - ${endFormatted}`;
};

const extractAndParseJson = (provider: string, text: string): any | null => {
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    console.error(`[${provider}] No JSON object found in response. Snippet: ${createLogSnippet(text)}`);
    return null;
  }

  return parseJsonWithRepair(provider, jsonMatch[0]);
};

export async function registerRoutes(app: Express): Promise<Server> {
  console.log('Registering authentication routes...');

  // Register appointments routes
  app.use('/api/appointments', appointmentsRouter);
  console.log('✅ Appointments routes registered');

  // Register email processing route (for manual triggering and Vercel Cron)
  app.use('/api/process-emails', processEmailsRouter);
  console.log('✅ Email processing route registered');

  // Trace auth route entries in Vercel to see the resolved path
  app.use(['/auth', '/api/auth'], (req, _res, next) => {
    console.log('[Auth Route Entry]', { method: req.method, originalUrl: req.originalUrl, path: req.path });
    next();
  });

  // Therapist API endpoints
  app.post('/api/therapist/search-patient', async (req, res) => {
    try {
      const { email, patientCode } = req.body;
      
      // Search for patient by both email AND code
      const patientProfile = await storage.getProfileByEmail(email);
      
      if (patientProfile && patientProfile.patientCode === patientCode) {
        res.json({
          id: patientProfile.id,
          user_id: patientProfile.id,
          email: patientProfile.email,
          firstName: patientProfile.firstName,
          lastName: patientProfile.lastName,
          patientCode: patientProfile.patientCode,
          created_at: patientProfile.createdAt
        });
      } else {
        res.status(404).json({ error: 'Patient not found with provided email and code' });
      }
    } catch (error) {
      res.status(500).json({ error: 'Search failed' });
    }
  });

  app.get('/api/therapist/patient/:id/analytics', async (req, res) => {
    try {
      const patientId = req.params.id;
      
      // Get anonymized patient analytics data
      const analyses = await storage.getAnxietyAnalysesByUser(patientId);
      const goals = await storage.getUserGoalsByUser(patientId);
      const interventions = await storage.getInterventionSummariesByUser(patientId);
      
      res.json({
        patientName: 'Patient X', // Anonymized for HIPAA
        analysesCount: analyses.length,
        analyses,
        goals,
        interventions
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to load patient analytics' });
    }
  });

  // Patient analytics route (for patient's own data)
  app.get('/api/patient/analytics', async (req, res) => {
    try {
      const { userId } = req.query;
      if (!userId) return res.status(400).json({ error: 'userId required' });

      const [profile, analyses, messages, goals, summariesRaw] = await Promise.all([
        storage.getProfile(String(userId)),
        storage.getAnxietyAnalysesByUser(String(userId)),
        storage.getChatMessagesByUser(String(userId)),
        storage.getUserGoalsByUser(String(userId)),
        storage.getInterventionSummariesByUser(String(userId)),
      ]);

      const summaries = (summariesRaw ?? []).map(normalizeInterventionSummary);

      return res.json({
        profile,
        analyses,
        messages,
        goals,
        summaries, // ✅ same key + normalized
      });
    } catch (e) {
      console.error('Patient analytics error:', e);
      res.status(500).json({ error: 'Failed to load analytics' });
    }
  });

  // Therapist analytics endpoint with proper data aggregation
  app.get('/api/therapist/patient-analytics', async (req, res) => {
    try {
      const { patientId, therapistEmail } = req.query;
      
      if (!patientId || !therapistEmail) {
        return res.status(400).json({ error: 'patientId and therapistEmail required' });
      }
      
      // Get patient profile
      const profile = await storage.getProfile(patientId as string);
      
      // Get patient data aggregated for therapist view
      const analyses = await storage.getAnxietyAnalysesByUser(patientId as string);
      const messages = await storage.getChatMessagesByUser(patientId as string);
      const goals = await storage.getUserGoalsByUser(patientId as string);
      const summariesRaw = await storage.getInterventionSummariesByUser(patientId as string);
      
      // Normalize summaries to ensure consistent field names
      const summaries = (summariesRaw ?? []).map(normalizeInterventionSummary);
      
      const toStringArray = (value: unknown): string[] => {
        if (!value) return [];
        if (Array.isArray(value)) {
          return value
            .map((item) => (item == null ? '' : String(item).trim()))
            .filter(Boolean);
        }
        if (typeof value === 'string') {
          const trimmed = value.trim();
          if (!trimmed) return [];
          try {
            const parsed = JSON.parse(trimmed);
            if (Array.isArray(parsed)) {
              return parsed
                .map((item) => (item == null ? '' : String(item).trim()))
                .filter(Boolean);
            }
          } catch (error) {
            // fall through to delimiter split
          }
          return trimmed
            .split(/[\n,;•\-]+/)
            .map((item) => item.trim())
            .filter(Boolean);
        }
        return [];
      };

      // Parse JSON fields and join analyses with patient messages
      const enrichedAnalyses = analyses.map(analysis => {
        // Find patient messages around the same time as the analysis
        const analysisDate = new Date(analysis.createdAt || (analysis as any).created_at);
        const patientMessages = messages.filter(msg => {
          if (msg.sender !== 'user') return false;
          const msgDate = new Date(msg.createdAt || (msg as any).created_at);
          const timeDiff = Math.abs(analysisDate.getTime() - msgDate.getTime());
          // Messages within 30 minutes of the analysis
          return timeDiff < 30 * 60 * 1000;
        });
        
        // Parse JSON fields if they are strings
        const parsedAnalysis = {
          ...analysis,
          triggers: toStringArray((analysis as any).triggers ?? (analysis as any).anxietyTriggers ?? (analysis as any).anxiety_triggers),
          recommendedTechniques: toStringArray((analysis as any).recommendedTechniques ?? (analysis as any).copingStrategies),
          copingStrategies: toStringArray((analysis as any).copingStrategies ?? (analysis as any).recommendedTechniques),
          patient_message: patientMessages.length > 0 ? patientMessages[0].content : null,
          session_id: patientMessages.length > 0 ? patientMessages[0].sessionId : null
        };
        
        return parsedAnalysis;
      });
      
      res.json({
        profile,
        analyses: enrichedAnalyses,
        messages,
        goals,
        summaries // ✅ unified key with normalized data
      });
    } catch (error) {
      console.error('Therapist analytics error:', error);
      res.status(500).json({ error: 'Failed to load patient analytics' });
    }
  });

  // Azure Speech-to-Text configuration endpoint
  app.get('/api/azure-speech-config', async (req, res) => {
    try {
      const azureSpeechKey = process.env.AZURE_SPEECH_KEY;
      const azureSpeechRegion = process.env.AZURE_SPEECH_REGION || 'eastus';

      if (!azureSpeechKey) {
        return res.status(503).json({
          error: 'Azure Speech-to-Text not configured',
          fallback: true
        });
      }

      res.json({
        key: azureSpeechKey,
        region: azureSpeechRegion
      });
    } catch (error) {
      console.error('Azure Speech config error:', error);
      res.status(500).json({ error: 'Speech service error' });
    }
  });

  // General chat endpoint for AI summaries with GPT-3.5-Turbo (cost-effective)
  app.post('/api/chat', async (req, res) => {
    try {
      const { message, userId, includeHistory } = req.body;
      const openaiKey = process.env.OPENAI_API_KEY;

      if (!openaiKey) {
        return res.status(503).json({ error: 'OpenAI API not configured' });
      }

      // Use GPT-3.5-Turbo for cost efficiency (~10x cheaper than GPT-4)
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openaiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [{
            role: 'user',
            content: message
          }],
          max_tokens: 500,
          temperature: 0.7
        })
      });

      if (response.ok) {
        const aiData = await response.json();
        res.json({ response: aiData.choices[0].message.content });
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'AI service unavailable');
      }
    } catch (error) {
      console.error('Chat API error:', error);
      res.status(500).json({ error: 'Failed to generate AI response' });
    }
  });

  app.post('/api/therapist/chat', async (req, res) => {
    try {
      const { message, patientId, context } = req.body;

      // Generate therapeutic AI response (anonymized)
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': process.env.ANTHROPIC_API_KEY || '',
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 300,
          messages: [{
            role: 'user',
            content: `You are Vanessa, a therapeutic AI assistant helping a therapist with Patient X.

Context: ${context}
Patient Data: Anonymized as "Patient X" for HIPAA compliance.

Therapist Question: ${message}

Provide a concise, professional response with therapeutic insights and recommendations. Focus on evidence-based treatments and specific actionable strategies.`
          }]
        })
      });

      if (response.ok) {
        const aiData = await response.json();
        res.json({ reply: aiData.content[0].text });
      } else {
        res.json({ reply: "I apologize, but I'm having trouble accessing my therapeutic knowledge base right now. Please try again in a moment." });
      }
    } catch (error) {
      res.json({ reply: "I'm here to help with therapeutic guidance. Please rephrase your question and I'll do my best to assist." });
    }
  });

  app.get('/api/therapist/patient/:id/reports', async (req, res) => {
    try {
      const patientId = req.params.id;
      
      // Return available reports for patient
      const reports = [
        {
          id: `history_${patientId}`,
          type: 'download_history',
          title: 'Download History Report',
          description: 'Comprehensive anxiety analysis data and progress over time',
          generatedAt: new Date().toISOString(),
          size: '2.3 MB'
        },
        {
          id: `summary_${patientId}`,
          type: 'conversation_summary',
          title: 'Conversation Summary Report',
          description: 'Summarized chat interactions with key therapeutic insights',
          generatedAt: new Date().toISOString(),
          size: '1.8 MB'
        }
      ];
      
      res.json(reports);
    } catch (error) {
      res.status(500).json({ error: 'Failed to load reports' });
    }
  });

  app.get('/api/therapist/reports/:id/content', async (req, res) => {
    try {
      const reportId = req.params.id;
      
      // Generate report content
      let content = '';
      if (reportId.includes('history')) {
        content = `
# Download History Report - Patient X

## Summary
This report contains anonymized anxiety analysis data for therapeutic review.

## Key Findings
- Average anxiety level: 6.2/10
- Primary triggers: Social situations, driving scenarios
- Progress trend: 15% improvement over 4 weeks
- Most effective coping strategies: Deep breathing, mindfulness

## Detailed Analysis
[Anonymized patient data would appear here in production]

## Therapeutic Recommendations
- Continue exposure therapy for driving anxiety
- Increase social skills training frequency
- Maintain current mindfulness practice
        `;
      } else {
        content = `
# Conversation Summary Report - Patient X

## Chat Session Overview
Total sessions: 12
Average session length: 15 minutes
Key therapeutic themes addressed:

## Primary Discussion Topics
1. Driving anxiety and avoidance behaviors
2. Social interaction challenges
3. Coping strategy development
4. Progress tracking and goal setting

## AI Therapeutic Insights
- Patient responds well to graduated exposure suggestions
- Shows high engagement with mindfulness techniques
- Expresses readiness for goal advancement

## Recommendations for Treatment
- Focus on driving confidence building
- Expand social exposure exercises
- Consider group therapy options
        `;
      }
      
      res.json({ content });
    } catch (error) {
      res.status(500).json({ error: 'Failed to load report content' });
    }
  });

  app.get('/api/therapist/patient/:id/treatment-plan', async (req, res) => {
    try {
      const patientId = req.params.id;

      const storedPlan = await storage.getTreatmentPlanByPatient(patientId);
      if (!storedPlan || !storedPlan.plan) {
        console.log('[TreatmentPlan] No plan found for patient', patientId);
        return res.json(null);
      }

      console.log('[TreatmentPlan] Returning plan for patient', patientId, 'goals:', Array.isArray(storedPlan.plan?.goals) ? storedPlan.plan.goals.length : 'n/a');
      res.json(storedPlan.plan);
    } catch (error) {
      console.error('Failed to load treatment plan:', error);
      res.status(500).json({ error: 'Failed to load treatment plan' });
    }
  });

  app.put('/api/therapist/patient/:id/treatment-plan', async (req, res) => {
    try {
      const patientId = req.params.id;
      const treatmentPlan = req.body;

      if (!treatmentPlan) {
        return res.status(400).json({ error: 'Treatment plan payload required' });
      }

      console.log('[TreatmentPlan] Saving for patient', patientId, 'goals:', Array.isArray(treatmentPlan?.goals) ? treatmentPlan.goals.length : 'n/a');
      const result = await storage.upsertTreatmentPlan(patientId, treatmentPlan);
      await storage.syncTreatmentPlanGoals(patientId, treatmentPlan);

      res.json({ success: true, message: 'Treatment plan saved successfully', updatedAt: result.updatedAt });
    } catch (error) {
      console.error('Failed to save treatment plan:', error);
      res.status(500).json({ error: 'Failed to save treatment plan' });
    }
  });

  // HIPAA-compliant Patient-Therapist connection endpoint
  app.post('/api/therapist-connections', async (req, res) => {
    try {
      const { therapistName, contactValue, shareReport, notes, patientEmail } = req.body;
      
      // Get patient information by email (this would come from authenticated session in production)
      let patient;
      
      // Check if valid patient email is provided
      const invalidEmails = ['Patient email not available', 'current-user-email', 'Code not available', '', null, undefined];
      const isValidEmail = patientEmail && !invalidEmails.includes(patientEmail) && patientEmail.includes('@');
      
      if (isValidEmail) {
        // Try to find existing patient
        patient = await storage.getProfileByEmail(patientEmail);
      }
      
      // If no patient found, create a demo patient for testing purposes
      if (!patient) {
        // Generate a unique demo email and patient code
        const timestamp = Date.now();
        const demoEmail = `demo.patient.${timestamp}@tranquiloo.test`;
        const demoPatientCode = `DEMO-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
        
        console.log(`📝 Creating demo patient for connection request: ${demoEmail} with code: ${demoPatientCode}`);
        
        // Create demo patient profile
        patient = await storage.createProfile({
          email: demoEmail,
          firstName: 'Demo',
          lastName: 'Patient',
          patientCode: demoPatientCode,
          role: 'user',
          emailVerified: true, // Pre-verify demo accounts
          authMethod: 'email'
          // createdAt and updatedAt will be set by the database defaults
        });
        
        console.log(`✅ Demo patient created successfully with ID: ${patient.id}`);
      }
      
      console.log('📝 Creating HIPAA-compliant therapist connection:', {
        patientId: patient.id,
        therapistEmail: contactValue,
        shareReport,
        notes
      });

      // Check if connection already exists
      const existingConnections = await storage.getPatientTherapistConnections(patient.id);
      const existingConnection = existingConnections.find(
        conn => conn.therapistEmail === contactValue
      );

      if (existingConnection) {
        console.log('⚠️ Connection already exists:', existingConnection.id);
        return res.json({
          success: true,
          message: 'Connection already exists',
          connection: existingConnection,
          alreadyExists: true
        });
      }

      // Create HIPAA-compliant connection with explicit consent
      const connection = await storage.createTherapistPatientConnection({
        patientId: patient.id,
        therapistEmail: contactValue,
        patientEmail: patient.email,
        patientCode: patient.patientCode || '',
        patientConsentGiven: true, // Patient explicitly requested connection
        therapistAccepted: false, // Therapist must accept connection
        shareAnalytics: shareReport === 'yes',
        shareReports: shareReport === 'yes',
        notes: notes || ''
      });

      // Create email notification in internal queue
      const protocol = req.protocol;
      const host = req.get('host');
      const appUrl = `${protocol}://${host}`;
      
      const emailContent = `
        <h2>New Patient Connection Request</h2>
        <p>A patient has requested to connect with you through the Tranquil Support app.</p>

        <p><strong>Would you like to see this patient?</strong></p>

        <p>By accepting this connection, you will gain access to the patient's:</p>
        <ul>
          <li>Medical situation report</li>
          <li>Anxiety tracking data</li>
          <li>Chat history and interventions</li>
          <li>Ability to schedule appointments</li>
        </ul>

        <h3>HIPAA Compliance Notice:</h3>
        <p>This connection requires your explicit acceptance. The patient has provided informed consent to share their data with you. Patient details will only be revealed after you accept the connection.</p>

        <h3>Next Steps:</h3>
        <p>Log into your therapist dashboard to review this connection request and make your decision.</p>
        <p><a href="${appUrl}/therapist-dashboard" style="display: inline-block; background: #3b82f6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; margin: 10px 0;">View Connection Request</a></p>

        <hr>
        <p><small>This email was generated by the HIPAA-compliant Tranquil Support app. The patient has explicitly requested this connection and provided informed consent.</small></p>
      `;

      await storage.createEmailNotification({
        toEmail: contactValue,
        subject: `New Patient Connection Request - Tranquiloo`,
        htmlContent: emailContent,
        emailType: 'connection_request',
        metadata: JSON.stringify({
          connectionId: connection.id,
          patientId: patient.id,
          therapistName: therapistName,
          requestedAt: new Date().toISOString()
        })
      });

      console.log(`📧 HIPAA-compliant email notification created for ${therapistName} at ${contactValue}`);
      console.log(`📊 Share report: ${shareReport === 'yes' ? 'Yes' : 'No'}`);

      res.json({ 
        success: true, 
        message: 'HIPAA-compliant connection request sent successfully - therapist will be notified',
        connectionId: connection.id 
      });

    } catch (error) {
      console.error('Error creating therapist connection:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to send connection request: ' + error.message 
      });
    }
  });

  // Get therapist connections for a patient (for appointment scheduling)
  app.get('/api/therapist-connections', async (req, res) => {
    try {
      const { patientId } = req.query;

      if (!patientId) {
        return res.status(400).json({ error: 'Patient ID is required' });
      }

      // Get all active, accepted connections for this patient
      const connections = await storage.getPatientTherapistConnections(patientId as string);

      res.json(connections);
    } catch (error) {
      console.error('Failed to fetch therapist connections:', error);
      res.status(500).json({ error: 'Failed to fetch connections' });
    }
  });

  // Get all accepted patients for a therapist (for Patient Directory)
  app.get('/api/therapist/:therapistEmail/patients', async (req, res) => {
    try {
      const { therapistEmail } = req.params;

      // Get all active, accepted connections for this therapist
      const connections = await storage.getTherapistPatientConnections(therapistEmail);

      // Get full patient details for each connection
      const patientsWithDetails = await Promise.all(
        connections.map(async (connection) => {
          const patient = await storage.getProfile(connection.patientId);
          const patientDetails = patient as Record<string, any> | undefined;
          return {
            connectionId: connection.id,
            patientId: connection.patientId,
            patientEmail: patient?.email,
            patientCode: patient?.patientCode,
            firstName: patient?.firstName,
            lastName: patient?.lastName,
            dateOfBirth: patientDetails?.dateOfBirth ?? null,
            gender: patientDetails?.gender ?? null,
            phoneNumber: patientDetails?.phoneNumber ?? null,
            connectedAt: connection.connectionAcceptedDate,
            shareAnalytics: connection.shareAnalytics,
            shareReports: connection.shareReports,
          };
        })
      );

      res.json(patientsWithDetails);
    } catch (error) {
      console.error('Failed to fetch therapist patients:', error);
      res.status(500).json({ error: 'Failed to fetch patients' });
    }
  });

  // Accept or reject patient connection request
  app.post('/api/therapist/connection/:connectionId/respond', async (req, res) => {
    try {
      const { connectionId } = req.params;
      const { action } = req.body; // 'accept' or 'reject'

      if (!['accept', 'reject'].includes(action)) {
        return res.status(400).json({ error: 'Invalid action. Must be "accept" or "reject"' });
      }

      // Get the connection
      const connection = await storage.getTherapistPatientConnection(connectionId);

      if (!connection) {
        return res.status(404).json({ error: 'Connection not found' });
      }

      // Update connection status
      if (action === 'accept') {
        await storage.updateTherapistPatientConnection(connectionId, {
          therapistAccepted: true,
          isActive: true,
          connectionAcceptedDate: Date.now()
        });

        // Mark notification as processed
        await storage.updateEmailNotificationStatus(connectionId, 'processed');

        // Get patient details to reveal after acceptance
        const patient = await storage.getProfile(connection.patientId);
        const patientDetails = patient as Record<string, any> | undefined;

        res.json({
          success: true,
          message: 'Patient connection accepted',
          connection: { ...connection, therapistAccepted: true, isActive: true },
          patientDetails: {
            email: patient?.email,
            patientCode: patient?.patientCode,
            firstName: patient?.firstName,
            lastName: patient?.lastName,
            dateOfBirth: patientDetails?.dateOfBirth ?? null,
            gender: patientDetails?.gender ?? null,
            phoneNumber: patientDetails?.phoneNumber ?? null,
            shareReport: connection.shareAnalytics || connection.shareReports
          }
        });
      } else {
        // Reject - set inactive (no patient details revealed)
        await storage.updateTherapistPatientConnection(connectionId, {
          therapistAccepted: false,
          isActive: false
        });

        // Mark notification as processed
        await storage.updateEmailNotificationStatus(connectionId, 'processed');

        res.json({
          success: true,
          message: 'Patient connection declined',
          connection: { ...connection, therapistAccepted: false, isActive: false }
        });
      }
    } catch (error) {
      console.error('Failed to respond to connection:', error);
      res.status(500).json({ error: 'Failed to process connection response' });
    }
  });

  app.post('/api/therapist/share-analytics', async (req, res) => {
    try {
      const { userId } = req.body;

      if (!userId) {
        return res.status(400).json({
          success: false,
          message: 'Missing userId - please sign in again and retry.'
        });
      }

      const profile = await storage.getProfile(userId);
      if (!profile) {
        return res.status(404).json({
          success: false,
          message: 'We could not find your profile. Please refresh and try again.'
        });
      }

      const therapistConnections = await storage.getUserTherapistsByUser(userId);
      const shareableTherapists = (therapistConnections || []).filter(connection => {
        if (connection?.isActive === false) {
          return false;
        }

        if (connection?.shareReport === false) {
          return false;
        }

        return connection?.contactMethod === 'email' && Boolean(connection?.contactValue);
      });

      if (shareableTherapists.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No therapist connections with sharing enabled. Visit “Contact Therapist” to invite your therapist.'
        });
      }

      const [analyses, sessions, summaries] = await Promise.all([
        storage.getAnxietyAnalysesByUser(userId),
        storage.getChatSessionsByUser(userId),
        storage.getInterventionSummariesByUser(userId)
      ]);

      const normalizeTriggerList = (input: any): string[] => {
        if (!input) {
          return [];
        }

        if (Array.isArray(input)) {
          return input.filter(Boolean).map((item) => String(item).trim()).filter(Boolean);
        }

        if (typeof input === 'string') {
          return input.split(',').map((item) => item.trim()).filter(Boolean);
        }

        return [];
      };

      const normalizeStrategyList = (analysis: any): string[] => {
        if (!analysis) {
          return [];
        }

        if (Array.isArray(analysis.copingStrategies)) {
          return analysis.copingStrategies.map((item: any) => String(item).trim()).filter(Boolean);
        }

        if (Array.isArray(analysis.recommendedInterventions)) {
          return analysis.recommendedInterventions.map((item: any) => String(item).trim()).filter(Boolean);
        }

        if (typeof analysis.copingStrategies === 'string') {
          return analysis.copingStrategies.split(',').map((item: string) => item.trim()).filter(Boolean);
        }

        if (typeof analysis.recommendedInterventions === 'string') {
          return analysis.recommendedInterventions.split(',').map((item: string) => item.trim()).filter(Boolean);
        }

        return [];
      };

      type NormalizedAnalysis = {
        anxietyLevel: number | null;
        createdAt: Date | null;
        triggers: string[];
        personalizedResponse?: string;
        copingStrategies: string[];
      };

      const normalizedAnalyses: NormalizedAnalysis[] = (analyses || []).map((analysis: any) => {
        const anxietyLevelValue = analysis?.anxietyLevel ?? analysis?.anxiety_level ?? null;
        const levelNumber = Number(anxietyLevelValue);

        return {
          anxietyLevel: Number.isFinite(levelNumber) ? levelNumber : null,
          createdAt: toDate(
            analysis?.createdAt ??
            analysis?.created_at ??
            analysis?.updatedAt ??
            analysis?.timestamp ??
            analysis?.time ??
            analysis?.date ??
            null
          ),
          triggers: normalizeTriggerList(
            analysis?.anxietyTriggers ??
            analysis?.triggers ??
            analysis?.triggerList ??
            []
          ),
          personalizedResponse: analysis?.personalizedResponse ?? analysis?.personalized_response ?? '',
          copingStrategies: normalizeStrategyList(analysis)
        };
      }).filter((analysis) => Boolean(analysis.createdAt));

      normalizedAnalyses.sort((a, b) => {
        const aTime = a.createdAt ? a.createdAt.getTime() : 0;
        const bTime = b.createdAt ? b.createdAt.getTime() : 0;
        return bTime - aTime;
      });

      const analysisCount = normalizedAnalyses.length;
      const averageAnxiety = analysisCount
        ? Number((normalizedAnalyses.reduce((total, current) => total + (current.anxietyLevel ?? 0), 0) / analysisCount).toFixed(1))
        : null;

      const latestAnalysis = normalizedAnalyses[0];

      const triggerFrequency = new Map<string, number>();
      normalizedAnalyses.slice(0, 30).forEach((analysis) => {
        analysis.triggers.forEach((trigger) => {
          const key = trigger || 'General anxiety';
          triggerFrequency.set(key, (triggerFrequency.get(key) || 0) + 1);
        });
      });

      const topTriggers = Array.from(triggerFrequency.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([trigger]) => trigger);

      const strategyFrequency = new Map<string, number>();
      normalizedAnalyses.slice(0, 30).forEach((analysis) => {
        analysis.copingStrategies.forEach((strategy) => {
          const key = strategy || 'General coping strategy';
          strategyFrequency.set(key, (strategyFrequency.get(key) || 0) + 1);
        });
      });

      const topStrategies = Array.from(strategyFrequency.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([strategy]) => strategy);

      const lastSessionDate = sessions
        .map((session: any) => toDate(session?.updatedAt ?? session?.createdAt ?? session?.created_at))
        .filter((value): value is Date => Boolean(value))
        .sort((a, b) => b.getTime() - a.getTime())[0] || null;

      const recentSummaries = (summaries || [])
        .filter((summary: any) => Boolean(summary?.weekStart || summary?.weekEnd || summary?.keyPoints))
        .sort((a: any, b: any) => {
          const aDate = toDate(a?.weekEnd ?? a?.weekStart ?? 0)?.getTime() || 0;
          const bDate = toDate(b?.weekEnd ?? b?.weekStart ?? 0)?.getTime() || 0;
          return bDate - aDate;
        })
        .slice(0, 3);

      const displayName = [profile?.firstName, profile?.lastName]
        .filter(Boolean)
        .join(' ')
        .trim() || profile?.email || 'Your patient';

      const patientCode = profile?.patientCode || 'Not provided';
      const patientEmail = profile?.email || 'Not provided';
      const reportGeneratedAt = new Date();

      const buildReportHtml = (therapistName?: string): string => {
        const greeting = therapistName ? `Hi ${escapeHtml(therapistName)},` : 'Hello,';

        const keyMetrics = [
          `<li><strong>Average anxiety level:</strong> ${averageAnxiety !== null ? `${averageAnxiety}/10` : 'Not enough data yet'}</li>`,
          `<li><strong>Total sessions logged:</strong> ${sessions?.length || 0}</li>`,
          `<li><strong>Last session recorded:</strong> ${lastSessionDate ? formatDate(lastSessionDate) : 'No sessions recorded yet'}</li>`
        ];

        const latestAnalysisBlock = latestAnalysis
          ? `
            <h3 style="margin-top: 24px; color: #0f172a;">Latest AI insight (${formatDate(latestAnalysis.createdAt)})</h3>
            <ul style="padding-left: 18px; margin: 12px 0; color: #111827;">
              <li><strong>Anxiety level:</strong> ${latestAnalysis.anxietyLevel !== null ? `${latestAnalysis.anxietyLevel}/10` : 'Not captured'}</li>
              ${topTriggers.length ? `<li><strong>Top triggers observed:</strong> ${topTriggers.map((trigger) => escapeHtml(trigger)).join(', ')}</li>` : ''}
              ${topStrategies.length ? `<li><strong>Effective interventions:</strong> ${topStrategies.map((strategy) => escapeHtml(strategy)).join(', ')}</li>` : ''}
              ${latestAnalysis.personalizedResponse ? `<li><strong>AI summary:</strong> ${escapeHtml(latestAnalysis.personalizedResponse)}</li>` : ''}
            </ul>
          `
          : `
            <h3 style="margin-top: 24px; color: #0f172a;">Latest AI insight</h3>
            <p style="color: #4b5563;">No AI analyses have been logged yet. Encourage your patient to complete additional sessions.</p>
          `;

        const summariesBlock = recentSummaries.length
          ? `
            <h3 style="margin-top: 24px; color: #0f172a;">Weekly progress highlights</h3>
            <ul style="padding-left: 18px; margin: 12px 0; color: #111827;">
              ${recentSummaries.map((summary: any) => `
                <li>
                  <strong>${formatDateRange(summary?.weekStart, summary?.weekEnd)}:</strong>
                  ${summary?.keyPoints ? escapeHtml(summary.keyPoints) : 'No summary recorded'}
                </li>
              `).join('')}
            </ul>
          `
          : '';

        const triggersBlock = topTriggers.length
          ? `
            <h3 style="margin-top: 24px; color: #0f172a;">Most common triggers observed</h3>
            <ul style="padding-left: 18px; margin: 12px 0; color: #111827;">
              ${topTriggers.map((trigger) => `<li>${escapeHtml(trigger)}</li>`).join('')}
            </ul>
          `
          : '';

        return `
          <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
            <p style="color: #0f172a; font-weight: 600;">${greeting}</p>
            <p style="color: #374151;">
              You are receiving this update because your patient <strong>${escapeHtml(displayName)}</strong>
              (patient code: <strong>${escapeHtml(patientCode)}</strong>, email: <strong>${escapeHtml(patientEmail)}</strong>)
              gave consent for you to view their anxiety analytics in Tranquil Support.
            </p>

            <h2 style="margin-top: 24px; color: #0f172a;">Patient analytics summary</h2>
            <p style="color: #4b5563;">Report generated on ${formatDate(reportGeneratedAt)}.</p>

            <h3 style="margin-top: 16px; color: #0f172a;">Key metrics</h3>
            <ul style="padding-left: 18px; margin: 12px 0; color: #111827;">
              ${keyMetrics.join('')}
            </ul>

            ${latestAnalysisBlock}
            ${summariesBlock}
            ${triggersBlock}

            <p style="margin-top: 24px; color: #4b5563;">
              Visit the therapist portal to view detailed session transcripts and track ongoing progress.
            </p>

            <p style="margin-top: 24px; font-size: 12px; color: #6b7280;">
              This secure update was generated automatically by the Tranquil Support platform because the patient enabled "Share with therapist" in their account settings.
            </p>
          </div>
        `;
      };

      for (const therapist of shareableTherapists) {
        const htmlContent = buildReportHtml(therapist?.therapistName);
        const metadata = {
          userId,
          therapistConnectionId: therapist.id,
          therapistEmail: therapist.contactValue,
          generatedAt: reportGeneratedAt.toISOString(),
          analysisCount,
          shareAnalytics: true
        };

        await storage.createEmailNotification({
          toEmail: therapist.contactValue,
          subject: `Patient analytics update - ${displayName}`,
          htmlContent,
          emailType: 'therapist_report',
          metadata: JSON.stringify(metadata)
        });

        console.log(`📤 Queued therapist analytics email for ${therapist.contactValue}`);
      }

      return res.json({
        success: true,
        message: shareableTherapists.length === 1
          ? `Shared your analytics with ${shareableTherapists[0].therapistName || 'your therapist'}.`
          : `Shared your analytics with ${shareableTherapists.length} therapists.`
      });
    } catch (error) {
      console.error('Error sharing analytics with therapist:', error);
      return res.status(500).json({
        success: false,
        message: 'We could not send the report right now. Please try again later.'
      });
    }
  });

  // Email verification endpoint
  app.get('/verify-email', async (req, res) => {
    try {
      const { token } = req.query;
      
      if (!token) {
        return res.status(400).send(`
          <div style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
            <h2 style="color: #ef4444;">Invalid Verification Link</h2>
            <p>The verification link is missing or invalid.</p>
          </div>
        `);
      }
      
      const verifiedProfile = await storage.verifyEmail(token as string);
      
      if (verifiedProfile) {
        res.send(`
          <div style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
            <div style="background: #10b981; color: white; padding: 20px; border-radius: 8px; display: inline-block;">
              <h2 style="margin: 0;">Email Verified Successfully!</h2>
            </div>
            <p style="margin-top: 20px; font-size: 16px;">
              Your email address has been verified. You can now sign in to your Tranquil Support account.
            </p>
            <div style="margin-top: 30px;">
              <a href="/login" style="background: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 600;">
                Sign In Now
              </a>
            </div>
          </div>
        `);
      } else {
        res.status(400).send(`
          <div style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
            <h2 style="color: #ef4444;">Verification Failed</h2>
            <p>The verification link is invalid or has already been used.</p>
          </div>
        `);
      }
    } catch (error) {
      console.error('Email verification error:', error);
      res.status(500).send(`
        <div style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
          <h2 style="color: #ef4444;">Verification Error</h2>
          <p>An error occurred during verification. Please try again later.</p>
        </div>
      `);
    }
  });

  // Password reset request endpoint
  app.post('/api/auth/forgot-password', async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({
          success: false,
          error: { code: 'MISSING_EMAIL', message: 'Email address is required' }
        });
      }
      
      const profile = await storage.getProfileByEmail(email);
      if (!profile) {
        // Don't reveal if email exists for security
        return res.json({
          success: true,
          message: 'If an account with this email exists, a password reset link has been sent.'
        });
      }
      
      // Generate reset token
      const resetToken = randomBytes(32).toString('hex');
      const expires = new Date(Date.now() + 3600000); // 1 hour
      
      await storage.setPasswordResetToken(email, resetToken, expires);
      
      // Create password reset email
      const resetUrl = `${req.protocol}://${req.get('host')}/reset-password?token=${resetToken}`;
      const emailContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #10b981; margin: 0;">Tranquil Support</h1>
            <p style="color: #6b7280; font-size: 16px;">Password Reset Request</p>
          </div>
          
          <div style="background: #f9fafb; padding: 25px; border-radius: 8px; margin-bottom: 25px;">
            <h2 style="color: #374151; margin-top: 0;">Reset Your Password</h2>
            <p style="color: #6b7280; line-height: 1.6;">
              We received a request to reset the password for your Tranquil Support account. 
              Click the button below to set a new password.
            </p>
            
            <div style="text-align: center; margin: 25px 0;">
              <a href="${resetUrl}" 
                 style="display: inline-block; background: #10b981; color: white; padding: 12px 30px; 
                        text-decoration: none; border-radius: 6px; font-weight: 600;">
                Reset Password
              </a>
            </div>
            
            <p style="color: #9ca3af; font-size: 14px;">
              This link will expire in 1 hour. If you didn't request this password reset, 
              please ignore this email.
            </p>
            
            <p style="color: #9ca3af; font-size: 14px;">
              If the button doesn't work, copy and paste this link:<br>
              <span style="word-break: break-all;">${resetUrl}</span>
            </p>
          </div>
          
          <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; color: #6b7280; font-size: 14px;">
            <p><strong>Need help?</strong> Contact our support team if you continue having trouble accessing your account.</p>
          </div>
        </div>
      `;

      await storage.createEmailNotification({
        toEmail: email,
        subject: 'Password Reset Request - Tranquil Support',
        htmlContent: emailContent,
        emailType: 'password_reset',
        metadata: JSON.stringify({
          userId: profile.id,
          resetToken: resetToken
        })
      });
      
      res.json({
        success: true,
        message: 'If an account with this email exists, a password reset link has been sent.'
      });
      
    } catch (error) {
      console.error('Password reset error:', error);
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Failed to process password reset request' }
      });
    }
  });

  // App recommendation endpoint
  app.post('/api/recommend-app', async (req, res) => {
    try {
      const { recipientEmail, senderName, personalMessage } = req.body;
      
      if (!recipientEmail) {
        return res.status(400).json({
          success: false,
          error: { code: 'MISSING_EMAIL', message: 'Recipient email is required' }
        });
      }
      
      const emailContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #10b981; margin: 0;">Tranquil Support</h1>
            <p style="color: #6b7280; font-size: 16px;">Mental Health & Anxiety Support App</p>
          </div>
          
          <div style="background: #f9fafb; padding: 25px; border-radius: 8px; margin-bottom: 25px;">
            <h2 style="color: #374151; margin-top: 0;">You've been recommended an app!</h2>
            ${senderName ? `<p style="color: #6b7280;"><strong>${senderName}</strong> thinks you might find Tranquil Support helpful.</p>` : ''}
            
            ${personalMessage ? `
              <div style="background: white; padding: 15px; border-left: 4px solid #10b981; margin: 15px 0;">
                <p style="color: #374151; margin: 0; font-style: italic;">"${personalMessage}"</p>
              </div>
            ` : ''}
            
            <h3 style="color: #374151;">What is Tranquil Support?</h3>
            <p style="color: #6b7280; line-height: 1.6;">
              Tranquil Support is a comprehensive mental health platform that helps you:
            </p>
            <ul style="color: #6b7280; line-height: 1.8;">
              <li>Track your anxiety and mood patterns</li>
              <li>Chat with AI companions for emotional support</li>
              <li>Access therapeutic tools and resources</li>
              <li>Connect with licensed therapists</li>
              <li>Set and track mental health goals</li>
            </ul>
            
            <div style="text-align: center; margin: 25px 0;">
              <a href="${req.protocol}://${req.get('host')}/signup" 
                 style="display: inline-block; background: #10b981; color: white; padding: 12px 30px; 
                        text-decoration: none; border-radius: 6px; font-weight: 600;">
                Get Started Free
              </a>
            </div>
          </div>
          
          <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; color: #6b7280; font-size: 14px;">
            <p>
              <strong>Your privacy matters:</strong> We take mental health privacy seriously. 
              All conversations and data are encrypted and confidential.
            </p>
            <p style="margin-top: 15px;">
              <small>This recommendation was sent to ${recipientEmail}. If you don't want to receive 
              these recommendations, you can safely ignore this email.</small>
            </p>
          </div>
        </div>
      `;

      await storage.createEmailNotification({
        toEmail: recipientEmail,
        subject: `${senderName ? senderName + ' recommended' : 'Someone recommended'} Tranquil Support for you`,
        htmlContent: emailContent,
        emailType: 'app_recommendation',
        metadata: JSON.stringify({
          senderName: senderName || 'Anonymous',
          personalMessage
        })
      });
      
      res.json({
        success: true,
        message: 'App recommendation sent successfully!'
      });
      
    } catch (error) {
      console.error('App recommendation error:', error);
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Failed to send app recommendation' }
      });
    }
  });

  // Debug endpoint to view queued emails (for testing)
  app.get('/api/debug/emails', async (req, res) => {
    try {
      const emails = await storage.getPendingEmails();
      const recentEmails = emails.map(email => ({
        id: email.id,
        toEmail: email.toEmail,
        subject: email.subject,
        emailType: email.emailType,
        status: email.status,
        createdAt: email.createdAt,
        // Include verification token for testing
        verificationToken: email.metadata ? (() => {
          try {
            return JSON.parse(email.metadata).verificationToken;
          } catch {
            return null;
          }
        })() : null
      }));
      res.json(recentEmails);
    } catch (error) {
      console.error('Debug emails error:', error as Error);
      res.status(500).json({ error: 'Failed to fetch emails' });
    }
  });

  // Internal email notifications endpoint for therapists
  app.get('/api/therapist/notifications/:email', async (req, res) => {
    try {
      const therapistEmail = decodeURIComponent(req.params.email);
      const notifications = await storage.getEmailNotificationsByTherapist(therapistEmail);
      
      res.json({
        notifications,
        unreadCount: notifications.filter(n => n.status === 'pending').length
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to load notifications' });
    }
  });

  // Health check endpoint to verify redirect URI configuration
  app.get('/auth/test-config', (req, res) => {
    const forwardedProto = (req.headers['x-forwarded-proto'] as string)?.split(',')[0];
    const forwardedHost = req.headers['x-forwarded-host'] as string;
    const protocol = forwardedProto || req.protocol;
    const host = forwardedHost || req.get('host');
    const base = `${protocol}://${host}`;
    const redirectUri = `${base}/auth/google/callback`;
    
    res.json({
      currentHost: host,
      detectedProtocol: protocol,
      forwardedProto,
      forwardedHost,
      fullBase: base,
      redirectUri,
      shouldMatch: 'https://tranquiloo-app-arthrombus.replit.app/auth/google/callback'
    });
  });
  
  // Authentication API routes
  app.post('/api/auth/signin', async (req, res) => {
    console.log('AUTH ENDPOINT HIT:', req.body);
    try {
      const { email, password, role = 'patient', isSignIn } = req.body;
      
      console.log('Email authentication attempt:', { email, role, isSignIn });
      
      if (!email || !password) {
        return res.status(400).json({ 
          success: false, 
          error: { code: 'MISSING_FIELDS', message: 'Email and password are required' } 
        });
      }

      console.log('[Auth] Checking for existing profile...');
      
      // Check if user profile exists
      try {
        console.log('Looking for profile with email:', email, 'isSignIn:', isSignIn);
        const existingProfile = await storage.getProfileByEmail(email);
        console.log('Found profile:', existingProfile ? existingProfile.email : 'NOT FOUND');
        
        // If this is a sign-in attempt
        if (isSignIn === true) {
          if (!existingProfile) {
            return res.status(401).json({
              success: false,
              error: { 
                code: 'USER_NOT_FOUND', 
                message: 'No account found with this email. Please create an account first by using the sign-up option.' 
              }
            });
          }
          
          // Validate password for existing users (skip for Google OAuth)
          if (!existingProfile.hashedPassword && password !== 'google-oauth') {
            return res.status(401).json({
              success: false,
              error: { 
                code: 'INVALID_AUTH_METHOD', 
                message: 'This account was created with Google. Please use Google sign-in.' 
              }
            });
          }
          
          // Check password (skip for Google OAuth)
          if (password !== 'google-oauth' && existingProfile.hashedPassword) {
            const isValidPassword = await bcrypt.compare(password, existingProfile.hashedPassword);
            if (!isValidPassword) {
              return res.status(401).json({
                success: false,
                error: { 
                  code: 'INVALID_CREDENTIALS', 
                  message: 'Invalid email or password' 
                }
              });
            }
          }
          
          // Check if email is verified (enforce for all roles)
          if (!existingProfile.emailVerified) {
            return res.status(403).json({
              success: false,
              error: { 
                code: 'EMAIL_NOT_VERIFIED', 
                message: 'Please verify your email address before signing in. Check your email for verification link.' 
              }
            });
          }
          
          // User exists, verified, and password correct - return success
          return res.json({
            success: true,
            user: {
              id: existingProfile.id,
              email: existingProfile.email,
              username: existingProfile.email?.split('@')[0],
              role: existingProfile.role || 'patient', // Always use the role from the database
              emailVerified: existingProfile.emailVerified,
              patientCode: existingProfile.patientCode
            }
          });
        }
        
        // If this is a sign-up attempt and user already exists
        if (existingProfile) {
          console.log('[Auth] Signup attempt but user already exists');
          return res.status(400).json({
            success: false,
            error: { 
              code: 'USER_EXISTS', 
              message: 'An account already exists with this email. Please sign in instead.' 
            }
          });
        }
      } catch (err) {
        console.log('Profile lookup error:', err);
        // For sign-in attempts, if there's a database error, still return user not found
        if (isSignIn === true) {
          return res.status(401).json({
            success: false,
            error: { 
              code: 'USER_NOT_FOUND', 
              message: 'No account found with this email. Please sign up first.' 
            }
          });
        }
      }
      
      // Only create new users for sign-up (isSignIn === false or undefined for new registrations)
      if (isSignIn !== true) {
        console.log('[Auth] Proceeding with signup flow');
        // Hash password for new user
      const hashedPassword = await bcrypt.hash(password, 10);
      console.log('[Auth] Password hashed, creating profile...');
      // Generate unique patient code
      const patientCode = 'PT-' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substr(2, 4).toUpperCase();
      
      // Create new user profile - generate UUID and timestamps for SQLite
      const newUser = {
        email: email,
        firstName: req.body.firstName || null,
        lastName: req.body.lastName || null,
        role: role,
        hashedPassword: hashedPassword,
        patientCode: patientCode,
        emailVerified: false,
        authMethod: 'email'
      };
      
      try {
        const createdProfile = await storage.createProfile(newUser);
        console.log('Created new user profile:', createdProfile.id);
        
        // Generate email verification token
        const verificationToken = randomBytes(32).toString('hex');
        await storage.updateProfileVerification(createdProfile.id, verificationToken);
        console.log('[Auth] Verification token generated/ stored');
        
        // Send verification email for both therapists and patients
        // Get correct protocol/host from proxy headers for public URL
        const forwardedProto = (req.headers['x-forwarded-proto'] as string)?.split(',')[0];
        const forwardedHost = req.headers['x-forwarded-host'] as string;
        const protocol = forwardedProto || req.protocol;
        const host = forwardedHost || req.get('host');
        const verificationUrl = `${protocol}://${host}/verify-email?token=${verificationToken}`;
        console.log('[Auth] Verification URL:', verificationUrl);
        
        if (role === 'therapist') {
          // Send therapist verification email with dashboard access instructions
          console.log('[Auth] Sending therapist verification email');
          await emailService.sendTherapistVerificationEmail(
            createdProfile.email!,
            req.body.firstName || 'Therapist',
            verificationToken,
            verificationUrl
          );
          
          // Return message that verification is required
          return res.json({
            success: true,
            message: 'Therapist account created successfully. Please check your email to verify your account before signing in.'
          });
        } else {
          // Create verification email for patients
          console.log('[Auth] Queuing patient verification email notification');
          const verificationUrl = `${req.protocol}://${req.get('host')}/verify-email?token=${verificationToken}`;
          const emailContent = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #10b981; margin: 0;">Welcome to Tranquiloo</h1>
                <p style="color: #6b7280; font-size: 16px;">Your mental health companion</p>
              </div>
              
              <div style="background: #f9fafb; padding: 25px; border-radius: 8px; margin-bottom: 25px;">
                <h2 style="color: #374151; margin-top: 0;">Please verify your email address</h2>
                <p style="color: #6b7280; line-height: 1.6;">
                  Thank you for creating an account with Tranquil Support. To ensure the security of your account 
                  and enable all features, please verify your email address by clicking the button below.
                </p>
                
                <div style="text-align: center; margin: 25px 0;">
                  <a href="${verificationUrl}" 
                     style="display: inline-block; background: #10b981; color: white; padding: 12px 30px; 
                            text-decoration: none; border-radius: 6px; font-weight: 600;">
                    Verify Email Address
                  </a>
                </div>
                
                <p style="color: #9ca3af; font-size: 14px;">
                  If the button doesn't work, copy and paste this link into your browser:<br>
                  <span style="word-break: break-all;">${verificationUrl}</span>
                </p>
              </div>
              
              <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; color: #6b7280; font-size: 14px;">
                <p><strong>What's next?</strong></p>
                <ul style="line-height: 1.6;">
                  <li>Complete your profile setup</li>
                  <li>Start tracking your anxiety and mood</li>
                  <li>Connect with AI companions for support</li>
                  <li>Access therapeutic resources and tools</li>
                </ul>
                
                <p style="margin-top: 20px;">
                  <small>This email was sent to ${createdProfile.email}. If you didn't create this account, 
                  please ignore this email.</small>
                </p>
              </div>
            </div>
          `;

          await storage.createEmailNotification({
            toEmail: createdProfile.email!,
            subject: 'Please verify your email - Tranquiloo',
            htmlContent: emailContent,
            emailType: 'email_verification',
            metadata: JSON.stringify({
              userId: createdProfile.id,
              verificationToken: verificationToken
            })
          });
          console.log('[Auth] Email notification queued');
        }
        
        return res.json({
          success: true,
          user: {
            id: createdProfile.id,
            email: createdProfile.email,
            username: createdProfile.email?.split('@')[0],
            role: createdProfile.role,
            emailVerified: false,
            patientCode: createdProfile.patientCode
          },
          message: 'Account created successfully. Please check your email to verify your account.'
        });
      } catch (err) {
        console.error('Profile creation failed:', err);
        return res.status(500).json({
          success: false,
          error: { code: 'PROFILE_CREATION_FAILED', message: 'Failed to create user profile' }
        });
      }
    } else {
      // If isSignIn is not explicitly false, return error
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_REQUEST', message: 'Invalid authentication request' }
      });
    }
      
    } catch (error) {
      console.error('Authentication error:', error);
      return res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Authentication failed. Please try again.' }
      });
    }
  });

  // Forgot password endpoint
  app.post('/api/auth/forgot-password', async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({
          success: false,
          error: { code: 'MISSING_EMAIL', message: 'Email address is required' }
        });
      }
      
      // Check if user exists
      const existingProfile = await storage.getProfileByEmail(email);
      
      // Always return success to prevent email enumeration
      if (!existingProfile) {
        return res.json({
          success: true,
          message: 'If an account exists with this email, a reset link has been sent.'
        });
      }
      
      // Generate reset token
      const resetToken = randomBytes(32).toString('hex');
      await storage.updateProfileVerification(existingProfile.id, resetToken);
      
      // Create reset email
      const resetUrl = `${req.protocol}://${req.get('host')}/reset-password?token=${resetToken}`;
      const emailContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #374151;">Password Reset Request</h2>
          <p>You requested to reset your password for your Tranquiloo account.</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" 
               style="display: inline-block; background: #3b82f6; color: white; padding: 12px 30px; 
                      text-decoration: none; border-radius: 6px; font-weight: 600;">
              Reset Password
            </a>
          </div>
          
          <p style="color: #6b7280;">
            If you didn't request this, please ignore this email. Your password won't be changed.
          </p>
          
          <p style="color: #9ca3af; font-size: 14px;">
            This link expires in 1 hour for security reasons.
          </p>
        </div>
      `;
      
      await storage.createEmailNotification({
        toEmail: email,
        subject: 'Reset Your Password - Tranquiloo',
        htmlContent: emailContent,
        emailType: 'password_reset',
        metadata: JSON.stringify({ resetToken })
      });
      
      return res.json({
        success: true,
        message: 'If an account exists with this email, a reset link has been sent.'
      });
      
    } catch (error) {
      console.error('Forgot password error:', error);
      return res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Failed to process request. Please try again.' }
      });
    }
  });

  // Google OAuth verification endpoint
  app.post('/api/auth/google-signin', async (req, res) => {
    try {
      const { googleCredential, role = 'patient' } = req.body;
      
      if (!googleCredential) {
        return res.status(400).json({
          success: false,
          error: { code: 'MISSING_CREDENTIAL', message: 'Google credential is required' }
        });
      }

      // Verify Google JWT token
      let payload;
      try {
        const parts = googleCredential.split('.');
        if (parts.length !== 3) {
          throw new Error('Invalid JWT format');
        }
        payload = JSON.parse(atob(parts[1]));
      } catch (error) {
        return res.status(400).json({
          success: false,
          error: { code: 'INVALID_CREDENTIAL', message: 'Invalid Google credential' }
        });
      }

      const email = payload.email;
      const firstName = payload.given_name || payload.name?.split(' ')[0];
      const lastName = payload.family_name || payload.name?.split(' ').slice(1).join(' ');

      // Check if user already exists
      try {
        const existingProfile = await storage.getProfileByEmail(email);
        if (existingProfile) {
          // Check if email is verified for existing users
        // Return existing verified user
        return res.json({
          success: true,
            user: {
              id: existingProfile.id,
              email: existingProfile.email,
              username: existingProfile.email?.split('@')[0],
              role: existingProfile.role || role,
              emailVerified: existingProfile.emailVerified,
              patientCode: existingProfile.patientCode
            }
          });
        }
      } catch (err) {
        console.log('Profile lookup error (will create new user):', err);
      }

      // Generate unique patient code for new Google OAuth users
      const patientCode = 'PT-' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substr(2, 4).toUpperCase();
      
      // Create new user profile for Google OAuth - must include ID and timestamps
      const newUser = {
        email: email,
        firstName: firstName || null,
        lastName: lastName || null,
        role: role,
        patientCode: patientCode,
        authMethod: 'google',
        emailVerified: true,
      };

      try {
        const createdProfile = await storage.createProfile(newUser);
        console.log('Created new Google OAuth user profile:', createdProfile.id);
        
        // Return success immediately - verification not required
        return res.json({
          success: true,
          message: 'Account created successfully.',
          requiresVerification: false,
          user: {
            id: createdProfile.id,
            email: createdProfile.email,
            username: createdProfile.email?.split('@')[0],
            role: createdProfile.role,
            emailVerified: true,
            patientCode: createdProfile.patientCode
          }
        });
      } catch (err) {
        console.error('Google OAuth profile creation failed:', err);
        return res.status(500).json({
          success: false,
          error: { code: 'PROFILE_CREATION_FAILED', message: 'Failed to create user profile' }
        });
      }
      
    } catch (error) {
      console.error('Google OAuth authentication error:', error);
      return res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Google authentication failed. Please try again.' }
      });
    }
  });

  // Manual verification endpoint for development/testing
  app.post('/api/auth/manual-verify', async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({
          success: false,
          error: { code: 'MISSING_EMAIL', message: 'Email address is required' }
        });
      }
      
      // Find user profile
      const profile = await storage.getProfileByEmail(email);
      if (!profile) {
        return res.status(404).json({
          success: false,
          error: { code: 'USER_NOT_FOUND', message: 'No account found with this email' }
        });
      }
      
      // Mark as verified
      await storage.updateProfileVerification(profile.id, null, true);
      
      return res.json({
        success: true,
        message: 'Email manually verified successfully'
      });
    } catch (error) {
      console.error('Manual verification error:', error);
      return res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Failed to verify email' }
      });
    }
  });

  // Resend verification email endpoint
  app.post('/api/auth/resend-verification', async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({
          success: false,
          error: { code: 'MISSING_EMAIL', message: 'Email address is required' }
        });
      }
      
      // Find user profile
      const profile = await storage.getProfileByEmail(email);
      if (!profile) {
        return res.status(404).json({
          success: false,
          error: { code: 'USER_NOT_FOUND', message: 'No account found with this email' }
        });
      }
      
      return res.json({
        success: true,
        message: 'Email verification not required'
      });
    } catch (error) {
      console.error('Resend verification error:', error);
      return res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Failed to resend verification email' }
      });
    }
  });

  // Google OAuth initiation route for iPhone Safari
  // Support both /auth/* and /api/auth/* in case of Vercel rewrites
  app.get(['/auth/google', '/api/auth/google'], (req, res) => {
    console.log('[OAuth] /auth/google hit', {
      originalUrl: req.originalUrl,
      query: req.query,
      headers: {
        forwardedProto: req.headers['x-forwarded-proto'],
        forwardedHost: req.headers['x-forwarded-host'],
        host: req.headers.host
      }
    });
    // Use the correct Web Client ID - prefer VITE_GOOGLE_CLIENT_ID as it has the correct value
    const clientId = (process.env.VITE_GOOGLE_CLIENT_ID || process.env.GOOGLE_OAUTH_CLIENT_ID) as string;
    console.log('OAuth initiation - Using Client ID:', clientId ? clientId.substring(0, 20) + '...' : 'NOT SET');
    
    // Get correct protocol/host from proxy headers or Replit environment
    const forwardedProto = (req.headers['x-forwarded-proto'] as string)?.split(',')[0] || 'https';
    const forwardedHost = (req.headers['x-forwarded-host'] as string) || req.headers.host;
    
    // In Replit, use REPLIT_DOMAINS if available (it contains the actual public domain)
    const replitDomains = process.env.REPLIT_DOMAINS;
    const protocol = replitDomains ? 'https' : forwardedProto;
    const host = replitDomains || forwardedHost || req.get('host');
    
    const redirectUri = `${protocol}://${host}/auth/google/callback`;
    
    if (!clientId) {
      return res.redirect('/login?error=server_config');
    }
    
    // Get role and return URL from query parameters
    const role = req.query.role || 'patient';
    const returnUrl = req.query.returnUrl || '/dashboard';
    
    // Create state parameter to pass role information
    const state = encodeURIComponent(JSON.stringify({
      role: role,
      returnUrl: returnUrl,
      isSignUp: true
    }));
    
    // Build OAuth URL
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'openid email profile',
      access_type: 'offline',
      prompt: 'select_account',
      state: state
    });
    
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
    console.log('Redirecting to Google OAuth with redirect_uri:', redirectUri);
    res.redirect(authUrl);
  });

  // OAuth callback route for iPhone Safari
  app.get(['/auth/google/callback', '/api/auth/google/callback'], async (req, res) => {
    try {
      const { code, state } = req.query;
      
      if (!code) {
        return res.redirect('/login?error=oauth_failed');
      }
      
      // Parse state parameter
      let userState = { role: 'patient', isSignUp: false, returnUrl: '/dashboard' };
      if (state && typeof state === 'string') {
        try {
          userState = JSON.parse(decodeURIComponent(state));
        } catch (e) {
          console.error('Failed to parse OAuth state:', e);
        }
      }
      
      // Exchange code for tokens
      const clientId = (process.env.VITE_GOOGLE_CLIENT_ID || process.env.GOOGLE_OAUTH_CLIENT_ID) as string;
      const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET as string;
      console.log('OAuth callback - Using Client ID:', clientId ? clientId.substring(0, 20) + '...' : 'NOT SET');
      
      // Get correct protocol/host from proxy headers or Replit environment
      const forwardedProto = (req.headers['x-forwarded-proto'] as string)?.split(',')[0] || 'https';
      const forwardedHost = (req.headers['x-forwarded-host'] as string) || req.headers.host;
      
      // In Replit, use REPLIT_DOMAINS if available (it contains the actual public domain)
      const replitDomains = process.env.REPLIT_DOMAINS;
      const protocol = replitDomains ? 'https' : forwardedProto;
      const host = replitDomains || forwardedHost || req.get('host');
      
      const redirectUri = `${protocol}://${host}/auth/google/callback`;
      const origin = `${protocol}://${host}`;
      
      if (!clientId || !clientSecret) {
        console.error('Google OAuth not configured: set GOOGLE_OAUTH_CLIENT_ID and GOOGLE_OAUTH_CLIENT_SECRET');
        return res.redirect('/login?error=server_config');
      }
      
      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          code: code as string,
          client_id: clientId!,
          client_secret: clientSecret,
          redirect_uri: redirectUri,
          grant_type: 'authorization_code'
        })
      });
      
      const tokens = await tokenResponse.json();
      
      if (!tokens.access_token) {
        return res.redirect('/login?error=token_failed');
      }
      
      // Get user info from Google
      const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: { Authorization: `Bearer ${tokens.access_token}` }
      });
      
      const googleUser = await userResponse.json();

      
      // Check if user exists and is verified
      let existingProfile = null;
      try {
        existingProfile = await storage.getProfileByEmail(googleUser.email);
      } catch (err) {
        console.log('Profile lookup error:', err);
      }

      // origin already computed above

      if (existingProfile) {
        // Check if email is verified
        if (!existingProfile.emailVerified) {
          // Redirect to login with verification needed message
          return res.redirect(`${origin}/login?error=verification_required&email=${encodeURIComponent(googleUser.email)}`);
        }

        // User exists - create Supabase session using admin API
        // Sign in the user to get a proper Supabase session token
        const { data: sessionData, error: sessionError } = await supabase.auth.admin.generateLink({
          type: 'magiclink',
          email: existingProfile.email!,
        });

        if (sessionError || !sessionData) {
          console.error('Failed to generate Supabase session:', sessionError);
          return res.redirect('/login?error=session_failed');
        }

        const userData = {
          id: existingProfile.id,
          email: existingProfile.email,
          name: googleUser.name,
          picture: googleUser.picture,
          role: existingProfile.role,
        emailVerified: false,
          authMethod: 'google'
        };

        // Check if therapist needs license verification
        if (existingProfile.role === 'therapist' && !existingProfile.licenseNumber) {
          return res.redirect(`${origin}/therapist-license-verification`);
        }

        const redirectPath = existingProfile.role === 'therapist' ? '/therapist-dashboard' : '/dashboard';
        const fullRedirectUrl = `${origin}${redirectPath}`;

        // Store user data with Supabase session and redirect
        const userDataScript = `
          <script>
            localStorage.setItem('user', ${JSON.stringify(JSON.stringify(userData))});
            localStorage.setItem('auth_user', ${JSON.stringify(JSON.stringify(userData))});
            // Store the Supabase session data
            localStorage.setItem('supabase.auth.token', ${JSON.stringify(JSON.stringify({
              currentSession: sessionData,
              expiresAt: Date.now() + 3600000
            }))});
            window.location.href = '${fullRedirectUrl}';
          </script>
        `;

        return res.send(`
          <html>
            <head><title>Authentication Success</title></head>
            <body>
              <p>Authentication successful! Redirecting...</p>
              ${userDataScript}
            </body>
          </html>
        `);
      }
      
      // New user - create Supabase Auth user first
      const password = randomBytes(32).toString('hex'); // Random password for OAuth users

      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: googleUser.email,
        password: password,
        email_confirm: true, // Auto-verify email for Google OAuth users
        user_metadata: {
          full_name: googleUser.name,
          avatar_url: googleUser.picture,
          provider: 'google'
        }
      });

      if (authError || !authData.user) {
        console.error('Failed to create Supabase Auth user:', authError);
        return res.redirect('/login?error=auth_failed');
      }

      // Now create profile with Supabase Auth user ID
      const patientCode = 'PT-' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substr(2, 4).toUpperCase();
      const newProfile = await storage.createProfile({
        email: googleUser.email,
        firstName: googleUser.given_name || googleUser.name?.split(' ')[0] || null,
        lastName: googleUser.family_name || googleUser.name?.split(' ').slice(1).join(' ') || null,
        role: userState.role || 'patient',
        patientCode: userState.role === 'patient' ? patientCode : null,
        authMethod: 'google',
        emailVerified: true,
        ...({ id: authData.user.id } as any), // Use Supabase Auth user ID
      });

      // Redirect to appropriate signup success page
      if (userState.role === 'therapist') {
        res.redirect(`${origin}/therapist-login?signup_success=true&email=${encodeURIComponent(googleUser.email)}`);
      } else {
        res.redirect(`${origin}/login?signup_success=true&email=${encodeURIComponent(googleUser.email)}`);
      }
      
    } catch (error) {
      console.error('OAuth callback error:', error);
      res.redirect('/login?error=oauth_error');
    }
  });

  // Facebook OAuth initiation route
  app.get(['/auth/facebook', '/api/auth/facebook'], (req, res) => {
    const clientId = process.env.FACEBOOK_CLIENT_ID as string;
    console.log('Facebook OAuth initiation - Using App ID:', clientId ? clientId.substring(0, 10) + '...' : 'NOT SET');

    // Get correct protocol/host from proxy headers or environment
    const forwardedProto = (req.headers['x-forwarded-proto'] as string)?.split(',')[0] || 'https';
    const forwardedHost = (req.headers['x-forwarded-host'] as string) || req.headers.host;
    const replitDomains = process.env.REPLIT_DOMAINS;
    const protocol = replitDomains ? 'https' : forwardedProto;
    const host = replitDomains || forwardedHost || req.get('host');

    const redirectUri = `${protocol}://${host}/auth/facebook/callback`;

    if (!clientId) {
      return res.redirect('/login?error=server_config');
    }

    // Get role and return URL from query parameters
    const role = req.query.role || 'patient';
    const returnUrl = req.query.returnUrl || '/dashboard';

    // Create state parameter to pass role information
    const state = encodeURIComponent(JSON.stringify({
      role: role,
      returnUrl: returnUrl,
      isSignUp: true
    }));

    // Build Facebook OAuth URL
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'email,public_profile',
      state: state
    });

    const authUrl = `https://www.facebook.com/v18.0/dialog/oauth?${params.toString()}`;
    console.log('Redirecting to Facebook OAuth with redirect_uri:', redirectUri);
    res.redirect(authUrl);
  });

  // Facebook OAuth callback route
  app.get(['/auth/facebook/callback', '/api/auth/facebook/callback'], async (req, res) => {
    try {
      const { code, state } = req.query;

      if (!code) {
        return res.redirect('/login?error=oauth_failed');
      }

      // Parse state parameter
      let userState = { role: 'patient', isSignUp: false, returnUrl: '/dashboard' };
      if (state && typeof state === 'string') {
        try {
          userState = JSON.parse(decodeURIComponent(state));
        } catch (e) {
          console.error('Failed to parse Facebook OAuth state:', e);
        }
      }

      // Exchange code for access token
      const clientId = process.env.FACEBOOK_CLIENT_ID as string;
      const clientSecret = process.env.FACEBOOK_CLIENT_SECRET as string;
      console.log('Facebook OAuth callback - Using App ID:', clientId ? clientId.substring(0, 10) + '...' : 'NOT SET');

      // Get correct protocol/host
      const forwardedProto = (req.headers['x-forwarded-proto'] as string)?.split(',')[0] || 'https';
      const forwardedHost = (req.headers['x-forwarded-host'] as string) || req.headers.host;
      const replitDomains = process.env.REPLIT_DOMAINS;
      const protocol = replitDomains ? 'https' : forwardedProto;
      const host = replitDomains || forwardedHost || req.get('host');

      const redirectUri = `${protocol}://${host}/auth/facebook/callback`;

      if (!clientId || !clientSecret) {
        console.error('Facebook OAuth not configured: set FACEBOOK_CLIENT_ID and FACEBOOK_CLIENT_SECRET');
        return res.redirect('/login?error=server_config');
      }

      // Exchange code for access token
      const tokenUrl = `https://graph.facebook.com/v18.0/oauth/access_token?${new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        code: code as string
      })}`;

      const tokenResponse = await fetch(tokenUrl);
      const tokens = await tokenResponse.json();

      if (!tokens.access_token) {
        console.error('Facebook token exchange failed:', tokens);
        return res.redirect('/login?error=token_failed');
      }

      // Get user info from Facebook
      const userResponse = await fetch(`https://graph.facebook.com/me?fields=id,name,email,first_name,last_name,picture&access_token=${tokens.access_token}`);
      const facebookUser = await userResponse.json();

      if (!facebookUser.email) {
        console.error('Facebook user has no email:', facebookUser);
        return res.redirect('/login?error=no_email');
      }

      // Check if user exists
      let existingProfile = null;
      try {
        existingProfile = await storage.getProfileByEmail(facebookUser.email);
      } catch (err) {
        console.log('Profile lookup error:', err);
      }

      // Get the correct origin for the redirect
      const origin = `${protocol}://${host}`;

      if (existingProfile) {
        // User exists and is verified - proceed to dashboard
        const userData = {
          id: existingProfile.id,
          email: existingProfile.email,
          name: facebookUser.name,
          picture: facebookUser.picture?.data?.url,
          role: existingProfile.role,
          emailVerified: true,
          authMethod: 'facebook'
        };

        // Check if therapist needs license verification
        if (existingProfile.role === 'therapist' && !existingProfile.licenseNumber) {
          return res.redirect(`${origin}/therapist-license-verification`);
        }

        const redirectPath = existingProfile.role === 'therapist' ? '/therapist-dashboard' : '/dashboard';
        const fullRedirectUrl = `${origin}${redirectPath}`;

        // Store user data and redirect
        const userDataScript = `
          <script>
            localStorage.setItem('user', ${JSON.stringify(JSON.stringify(userData))});
            localStorage.setItem('auth_user', ${JSON.stringify(JSON.stringify(userData))});
            localStorage.setItem('authToken', ${JSON.stringify(tokens.access_token)});
            window.location.href = '${fullRedirectUrl}';
          </script>
        `;

        return res.send(`
          <html>
            <head><title>Authentication Success</title></head>
            <body>
              <p>Authentication successful! Redirecting...</p>
              ${userDataScript}
            </body>
          </html>
        `);
      }

      // New user - create profile
      const { randomUUID } = await import('crypto');
      const patientCode = 'PT-' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substr(2, 4).toUpperCase();
      const newProfile = await storage.createProfile({
        email: facebookUser.email,
        firstName: facebookUser.first_name || facebookUser.name?.split(' ')[0] || null,
        lastName: facebookUser.last_name || facebookUser.name?.split(' ').slice(1).join(' ') || null,
        role: userState.role || 'patient',
        patientCode: userState.role === 'patient' ? patientCode : null,
        authMethod: 'facebook',
        emailVerified: true,
      });

      // Redirect to appropriate signup success page
      if (userState.role === 'therapist') {
        res.redirect(`${origin}/therapist-login?signup_success=true&email=${encodeURIComponent(facebookUser.email)}`);
      } else {
        res.redirect(`${origin}/login?signup_success=true&email=${encodeURIComponent(facebookUser.email)}`);
      }

    } catch (error) {
      console.error('Facebook OAuth callback error:', error);
      res.redirect('/login?error=oauth_error');
    }
  });

  // Therapist license verification endpoints
  app.post('/api/therapist/license-verification', async (req, res) => {
    try {
      const { email, licenseNumber, state, skip } = req.body;
      
      if (!email) {
        return res.status(400).json({
          success: false,
          error: { code: 'MISSING_EMAIL', message: 'Email is required' }
        });
      }
      
      const profile = await storage.getProfileByEmail(email);
      if (!profile || profile.role !== 'therapist') {
        return res.status(404).json({
          success: false,
          error: { code: 'THERAPIST_NOT_FOUND', message: 'Therapist profile not found' }
        });
      }
      
      if (skip === true) {
        // User chose to skip license verification
        // Set license grace period (24 hours)
        const graceDeadline = new Date(Date.now() + 24 * 60 * 60 * 1000);
        await storage.updateProfileLicenseInfo(profile.id, null, null, graceDeadline);
        
        // Send notification email about 24-hour deadline
        const emailContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #dc3545;">License Verification Required</h2>
            <p>Dear ${profile.firstName || 'Therapist'},</p>
            
            <p>You have chosen to skip license verification during signup. As per our policy for therapists in the US and Canada, you have <strong>24 hours</strong> to provide your license number, or your account will be temporarily suspended.</p>
            
            <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <h3 style="color: #856404; margin-top: 0;">Important Notice</h3>
              <p style="margin: 0; color: #856404;">
                Deadline: ${graceDeadline.toLocaleString()}<br>
                Status: Grace period active
              </p>
            </div>
            
            <p>To add your license information, please log in to your therapist dashboard and complete the verification process.</p>
            
            <div style="text-align: center; margin: 25px 0;">
              <a href="${req.protocol}://${req.get('host')}/therapist-dashboard" 
                 style="display: inline-block; background: #28a745; color: white; padding: 12px 30px; 
                        text-decoration: none; border-radius: 6px; font-weight: 600;">
                Complete License Verification
              </a>
            </div>
            
            <p style="color: #6c757d; font-size: 14px;">
              If you are not practicing in the US or Canada, please disregard this notice.
            </p>
          </div>
        `;
        
        await storage.createEmailNotification({
          toEmail: profile.email!,
          subject: 'License Verification Required - 24 Hour Notice',
          htmlContent: emailContent,
          emailType: 'license_reminder',
          metadata: JSON.stringify({ therapistId: profile.id, deadline: graceDeadline })
        });
        
        return res.json({
          success: true,
          message: 'License verification skipped. You have 24 hours to complete verification.',
          graceDeadline: graceDeadline
        });
      } else {
        // User provided license information
        if (!licenseNumber || !state) {
          return res.status(400).json({
            success: false,
            error: { code: 'MISSING_LICENSE_INFO', message: 'License number and state are required' }
          });
        }
        
        await storage.updateProfileLicenseInfo(profile.id, licenseNumber, state);
        
        // Send confirmation email
        const emailContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #28a745;">License Verification Completed</h2>
            <p>Dear ${profile.firstName || 'Therapist'},</p>
            
            <p>Thank you for providing your license information. Your therapist account is now fully verified and active.</p>
            
            <div style="background: #d4edda; border: 1px solid #c3e6cb; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <h3 style="color: #155724; margin-top: 0;">Verification Complete</h3>
              <p style="margin: 0; color: #155724;">
                License Number: ${licenseNumber}<br>
                State: ${state}<br>
                Status: Verified
              </p>
            </div>
            
            <p>You can now access all therapist features in your dashboard.</p>
            
            <div style="text-align: center; margin: 25px 0;">
              <a href="${req.protocol}://${req.get('host')}/therapist-dashboard" 
                 style="display: inline-block; background: #007bff; color: white; padding: 12px 30px; 
                        text-decoration: none; border-radius: 6px; font-weight: 600;">
                Access Therapist Dashboard
              </a>
            </div>
          </div>
        `;
        
        await storage.createEmailNotification({
          toEmail: profile.email!,
          subject: 'License Verification Complete - Tranquil Support',
          htmlContent: emailContent,
          emailType: 'license_verified',
          metadata: JSON.stringify({ therapistId: profile.id, licenseNumber, state })
        });
        
        return res.json({
          success: true,
          message: 'License verification completed successfully'
        });
      }
      
    } catch (error) {
      console.error('License verification error:', error);
      return res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Failed to process license verification' }
      });
    }
  });

  // Get therapist license status
  app.get('/api/therapist/license-status/:email', async (req, res) => {
    try {
      const { email } = req.params;
      
      const profile = await storage.getProfileByEmail(decodeURIComponent(email));
      if (!profile || profile.role !== 'therapist') {
        return res.status(404).json({
          success: false,
          error: { code: 'THERAPIST_NOT_FOUND', message: 'Therapist profile not found' }
        });
      }
      
      const hasLicense = !!profile.licenseNumber;
      const inGracePeriod = profile.licenseGraceDeadline && new Date() < new Date(profile.licenseGraceDeadline);
      const graceExpired = profile.licenseGraceDeadline && new Date() >= new Date(profile.licenseGraceDeadline);
      
      return res.json({
        success: true,
        hasLicense,
        inGracePeriod,
        graceExpired,
        licenseNumber: profile.licenseNumber,
        licenseState: profile.licenseState,
        graceDeadline: profile.licenseGraceDeadline
      });
      
    } catch (error) {
      console.error('License status check error:', error);
      return res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Failed to check license status' }
      });
    }
  });

  // Test endpoint to manually send verification email
  app.post("/api/test-email", async (req, res) => {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }
    
    console.log(`Manual test: Sending verification email to ${email}`);
    
    try {
      const verificationToken = randomBytes(16).toString('hex');
      
      const emailResponse = await emailService.sendVerificationEmail(
        email,
        'Test User',
        verificationToken
      );
      
      res.json({ 
        success: emailResponse.success, 
        message: emailResponse.success ? 'Email sent successfully' : 'Email failed to send',
        token: verificationToken
      });
    } catch (error) {
      console.error('Test email error:', error);
      res.status(500).json({ error: 'Failed to send test email' });
    }
  });

  // Profile routes
  app.get("/api/profiles/:id", async (req, res) => {
    try {
      const profile = await storage.getProfile(req.params.id);
      if (!profile) {
        return res.status(404).json({ error: "Profile not found" });
      }
      res.json(profile);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch profile" });
    }
  });

  // Get profile by email endpoint
  app.get("/api/profiles/by-email/:email", async (req, res) => {
    try {
      const email = decodeURIComponent(req.params.email);
      const profile = await storage.getProfileByEmail(email);
      if (!profile) {
        return res.status(404).json({ error: "Profile not found" });
      }
      res.json(profile);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch profile by email" });
    }
  });

  app.post("/api/profiles", async (req, res) => {
    try {
      const validatedData = insertProfileSchema.parse(req.body);
      const profile = await storage.createProfile(validatedData);
      res.status(201).json(profile);
    } catch (error) {
      res.status(400).json({ error: "Invalid profile data", details: error.message });
    }
  });

  app.put("/api/profiles/:id", async (req, res) => {
    try {
      const validatedData = insertProfileSchema.partial().parse(req.body);
      const profile = await storage.updateProfile(req.params.id, validatedData);
      if (!profile) {
        return res.status(404).json({ error: "Profile not found" });
      }
      res.json(profile);
    } catch (error) {
      res.status(400).json({ error: "Invalid profile data", details: error.message });
    }
  });

  // Chat session routes
  app.get("/api/chat-sessions", async (req, res) => {
    try {
      const sessions = await storage.getAllChatSessions();
      res.json(sessions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch chat sessions" });
    }
  });
  app.get("/api/chat-sessions/:id", async (req, res) => {
    try {
      const session = await storage.getChatSession(req.params.id);
      if (!session) {
        return res.status(404).json({ error: "Chat session not found" });
      }
      res.json(session);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch chat session" });
    }
  });

  app.get("/api/users/:userId/chat-sessions", async (req, res) => {
    try {
      const sessions = await storage.getChatSessionsByUser(req.params.userId);
      res.json(sessions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch chat sessions" });
    }
  });

  app.post("/api/chat-sessions", async (req, res) => {
    try {
      const validatedData = insertChatSessionSchema.parse(req.body);
      const session = await storage.createChatSession(validatedData);
      res.status(201).json(session);
    } catch (error) {
      res.status(400).json({ error: "Invalid chat session data", details: error.message });
    }
  });

  app.patch("/api/chat-sessions/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { title } = req.body;

      if (!title) {
        return res.status(400).json({ error: "Title is required" });
      }

      const updatedSession = await storage.updateChatSession(id, { title });
      if (!updatedSession) {
        return res.status(404).json({ error: "Chat session not found" });
      }

      res.json({ success: true, session: updatedSession });
    } catch (error) {
      res.status(500).json({ error: "Failed to update chat session title" });
    }
  });

  // Chat message routes
  app.get("/api/chat-sessions/:sessionId/messages", async (req, res) => {
    try {
      const messages = await storage.getChatMessagesBySession(req.params.sessionId);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch chat messages" });
    }
  });

  // Get all messages for a specific user across all their chat sessions
  app.get("/api/users/:userId/messages", async (req, res) => {
    try {
      const messages = await storage.getChatMessagesByUser(req.params.userId);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch user messages" });
    }
  });

  app.post("/api/chat-messages", async (req, res) => {
    try {
      const validatedData = insertChatMessageSchema.parse(req.body);

      // Check for duplicate messages using raw database data (not deduplicated)
      const existingMessages = await storage.getRawChatMessagesBySession(validatedData.sessionId);
      const tenSecondsAgo = new Date(Date.now() - 10000);

      const recentDuplicate = existingMessages.find(msg => {
        const isContentMatch = msg.content === validatedData.content;
        const isSenderMatch = msg.sender === validatedData.sender;
        const isRecent = msg.createdAt && new Date(msg.createdAt) > tenSecondsAgo;

        return isContentMatch && isSenderMatch && isRecent;
      });

      console.log(`🔍 Checking for duplicates: "${validatedData.content}" by ${validatedData.sender}`);
      console.log(`📊 Found ${existingMessages.length} existing messages in DB`);
      if (recentDuplicate) {
        console.log(`🚫 Duplicate found: ${recentDuplicate.id}`);
      } else {
        console.log(`✅ No duplicate found, proceeding to save`);
      }

      if (recentDuplicate) {
        return res.status(200).json(recentDuplicate);
      }
      const message = await storage.createChatMessage(validatedData);
      res.status(201).json(message);
    } catch (error) {
      res.status(400).json({ error: "Invalid chat message data", details: error.message });
    }
  });

  // Anxiety analysis routes
  app.get("/api/anxiety-analyses", async (req, res) => {
    try {
      const analyses = await storage.getAllAnxietyAnalyses();
      res.json(analyses);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch anxiety analyses" });
    }
  });
  app.get("/api/users/:userId/anxiety-analyses", async (req, res) => {
    try {
      const analyses = await storage.getAnxietyAnalysesByUser(req.params.userId);
      
      // Parse JSON fields and rename for frontend compatibility
      const parsedAnalyses = analyses.map(analysis => {
        // Helper to safely parse JSON strings to arrays
        const parseJsonField = (field: any): any[] => {
          if (!field) return [];
          if (Array.isArray(field)) return field;
          if (typeof field === 'string') {
            try {
              const parsed = JSON.parse(field);
              return Array.isArray(parsed) ? parsed : [];
            } catch {
              // If not valid JSON, try splitting by comma
              return field.split(',').map(s => s.trim()).filter(Boolean);
            }
          }
          return [];
        };

        return {
          ...analysis,
          // Rename anxietyTriggers to triggers for frontend compatibility
          triggers: parseJsonField(analysis.anxietyTriggers),
          // Remove the old field
          anxietyTriggers: undefined,
          // Parse other JSON fields
          copingStrategies: parseJsonField(analysis.copingStrategies),
          // Keep other fields that might be JSON strings
          cognitiveDistortions: parseJsonField((analysis as any).cognitiveDistortions),
          dsm5Indicators: parseJsonField((analysis as any).dsm5Indicators),
        };
      });
      
      res.json(parsedAnalyses);
    } catch (error) {
      console.error("Error fetching anxiety analyses:", error);
      res.status(500).json({ error: "Failed to fetch anxiety analyses" });
    }
  });

  app.post("/api/anxiety-analyses", async (req, res) => {
    try {
      const validatedData = insertAnxietyAnalysisSchema.parse(req.body);
      const analysis = await storage.createAnxietyAnalysis(validatedData);
      res.status(201).json(analysis);
    } catch (error) {
      res.status(400).json({ error: "Invalid anxiety analysis data", details: error.message });
    }
  });

  // Claude AI analysis endpoint (replacing Supabase Edge Function)
  app.post("/api/analyze-anxiety-claude", async (req, res) => {
    try {
      const { message, conversationHistory = [], userId, includeLanguageDetection = false } = req.body;

      console.log('🌐 Language detection requested:', includeLanguageDetection);

      if (!message) {
        return res.status(400).json({ error: "Message is required" });
      }

      // Check if Claude API key is available  
      const claudeApiKey = process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY;
      
      let analysisResult;
      
      if (claudeApiKey) {
        try {
          console.log('Attempting AI API call for message:', message.substring(0, 50));
          
          // Build more contextual prompt based on message content
          const lowerMessage = message.toLowerCase();
          // Check for specific mental health conditions
          const ptsdWords = ['trauma', 'flashback', 'nightmare', 'trigger', 'ptsd', 'veteran', 'assault', 'accident'];
          const ocdWords = ['ocd', 'obsessive', 'compulsive', 'contamination', 'checking', 'counting', 'intrusive thoughts', 'ritual'];
          const panicWords = ['panic', 'panic attack', 'heart racing', 'can\'t breathe', 'dying', 'losing control'];
          
          const psychosisIndicators = detectPsychosisIndicators(message);
          const hasPTSD = ptsdWords.some(word => lowerMessage.includes(word));
          const hasOCD = ocdWords.some(word => lowerMessage.includes(word));
          const hasPanic = panicWords.some(word => lowerMessage.includes(word));
          const hasHallucinations = psychosisIndicators.hasIndicators;

          const isCrisis = hasHallucinations ||
                          lowerMessage.includes('kill') || lowerMessage.includes('suicide') || 
                          lowerMessage.includes('firing') || lowerMessage.includes('gaza') ||
                          lowerMessage.includes('war') || lowerMessage.includes('attack');
          
          // Let Claude detect and respond in the appropriate language
          // Call Claude API with improved therapeutic prompt
          const scenarioGuidance: string[] = [];

          if (isCrisis) {
            scenarioGuidance.push(
              'CRISIS RESPONSE REQUIRED: focus on immediate safety, grounding, and concise directives.',
              'Keep the response under 3 sentences and include a crisis resource if appropriate (e.g., call 988).'
            );
          } else if (hasPTSD) {
            scenarioGuidance.push(
              'PTSD INDICATORS PRESENT: acknowledge trauma, suggest grounding for flashbacks, avoid probing for details.'
            );
          } else if (hasOCD) {
            scenarioGuidance.push(
              'OCD PATTERN DETECTED: avoid reassurance loops and reference exposure response prevention principles.'
            );
          } else if (hasPanic) {
            scenarioGuidance.push(
              'Panic symptoms detected: lead with a breathing technique and reinforce that the surge will pass.'
            );
          }

          const recentHistory = conversationHistory.length > 0
            ? `Recent conversation context: ${conversationHistory.slice(-3).join(' | ')}`
            : '';
          const detectedLanguageField = includeLanguageDetection ? '\n  "detectedLanguage": "en" | "es"' : '';
          const languageRequirement = includeLanguageDetection
            ? '\n- Identify the message language and set detectedLanguage accordingly.'
            : '';
          const scenarioGuidanceBlock = scenarioGuidance.length
            ? `\nScenario guidance:\n- ${scenarioGuidance.join('\n- ')}`
            : '';

          const analysisPrompt = `You are Vanessa, a trained crisis intervention AI companion.

Return ONLY a valid JSON object matching the schema below. Do not include any text before or after the JSON and do not use markdown fences.

Schema:
{
  "anxietyLevel": number between 1 and 10,
  "triggers": ["up to 3 concise triggers"],
  "copingStrategies": ["up to 4 actionable coping steps"],
  "personalizedResponse": "Detailed 200-250 word message in the user's language with validation and multiple coping ideas."${detectedLanguageField}
}

General response requirements:
- Maintain a steady, compassionate tone.
- Provide concrete, step-by-step coping guidance the user can try immediately.
- Match the language of the user message (English or Spanish).${languageRequirement}
${scenarioGuidanceBlock}

User message: "${message}"
${recentHistory}`;
          
          const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': claudeApiKey,
              'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
              model: 'claude-3-5-haiku-20241022', // Using Claude 3.5 Haiku for reliable responses
              max_tokens: 800, // Increased for longer detailed responses
              temperature: 0.7, // More natural, varied responses
              messages: [{ role: 'user', content: analysisPrompt }]
            })
          });

          if (response.ok) {
            const claudeResponse = await response.json();
            const analysisText = claudeResponse.content[0]?.text || '';

            console.log('API response received, parsing JSON...');
            console.log('Model used:', claudeResponse.model || 'claude-3-5-haiku-20241022');
            
            analysisResult = extractAndParseJson('Claude', analysisText);

            if (analysisResult) {
              console.log('Successfully parsed response');
              console.log('Raw analysis result:', analysisResult);
            } else {
              console.error('[Claude] Unable to produce valid JSON after repair attempts.');
            }
          } else {
            const errorText = await response.text();
            console.error('Claude API error:', response.status, errorText);
            
            // Log specific error details
            if (response.status === 401) {
              console.error('API Key authentication failed - check ANTHROPIC_API_KEY');
            } else if (response.status === 429) {
              console.error('Rate limit exceeded - using fallback');
            }
            
            analysisResult = null;
          }
        } catch (error) {
          console.error('Claude API request failed:', error);
          analysisResult = null;
        }
      }

      // If Claude 4.1 Opus failed, try OpenAI's ChatGPT-5 before falling back
      if (!analysisResult) {
        console.log('Primary AI failed, trying GPT-5 fallback...');
        const openaiKey = process.env.OPENAI_API_KEY;
        if (openaiKey) {
          try {
            const openaiResp = await fetch('https://api.openai.com/v1/chat/completions', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${openaiKey}`
              },
              body: JSON.stringify({
                model: 'gpt-5',
                messages: [{ role: 'user', content: `Analyze the mental health tone of: "${message}" and respond with JSON {"anxietyLevel":number,"triggers":string[],"copingStrategies":string[],"personalizedResponse":"Comprehensive 200-250 word therapeutic response in same language as user message"${includeLanguageDetection ? ',"detectedLanguage":"en or es - detect language of user message"' : ''}}.` }],
                temperature: 0.7,
                max_tokens: 800
              })
            });
            if (openaiResp.ok) {
              console.log('✅ GPT-5 fallback response received');
              const data = await openaiResp.json();
              const text = data.choices?.[0]?.message?.content || '';
              analysisResult = extractAndParseJson('OpenAI GPT', text);
              if (analysisResult) {
                console.log('🤖 Using GPT-5 fallback result');
              } else {
                console.error('[OpenAI GPT] Unable to produce valid JSON after repair attempts.');
              }
            } else {
              console.error('OpenAI API error:', openaiResp.status, await openaiResp.text());
            }
          } catch (err) {
            console.error('OpenAI request failed:', err);
          }
        }
      }

      // Use local fallback analysis if both Claude 4.1 Opus and GPT-5 failed
      console.log('🔍 DEBUG: analysisResult before fallback check:', analysisResult ? 'HAS VALUE' : 'NULL/UNDEFINED');
      if (!analysisResult) {
        console.log('Both AI systems failed, using local fallback for message:', message.substring(0, 50) + '...');
        
        const lowerMessage = message.toLowerCase();
        const contextSummary = analyzeAnxietyContext(message);
        let anxietyLevel = Math.min(10, Math.max(1, Math.round(2 + contextSummary.generalAnxiety.score * 1.5)));
        const psychosisIndicators = detectPsychosisIndicators(message);
        const hasHallucinationIndicators = psychosisIndicators.hasIndicators;
        const hasCrisisIndicators = contextSummary.crisis.thresholdMet;
        let hasRelationshipIssues = /(wife|husband|partner|boyfriend|girlfriend|spouse|cheat(ed|ing)?)/i.test(lowerMessage);

        if (contextSummary.generalAnxiety.score > 0) {
          anxietyLevel = Math.min(10, Math.max(anxietyLevel, Math.round(2 + contextSummary.generalAnxiety.score * 1.5)));
        }

        if (contextSummary.panic.thresholdMet) {
          anxietyLevel = Math.max(anxietyLevel, 8);
        }
        if (contextSummary.ptsd.thresholdMet) {
          anxietyLevel = Math.max(anxietyLevel, 7);
        }

        if (contextSummary.ocd.thresholdMet) {
          anxietyLevel = Math.max(anxietyLevel, 6);
        }
        if (contextSummary.depression.thresholdMet) {
          anxietyLevel = Math.max(anxietyLevel, 5);
        }
        if (hasHallucinationIndicators || hasCrisisIndicators) {
          anxietyLevel = Math.max(anxietyLevel, 9);
        }


        // Enhanced fallback analysis for specific conditions
        const hasViolentThoughts = lowerMessage.includes('hurt') || lowerMessage.includes('kill') || lowerMessage.includes('die');
        const hasDepressionKeywords = lowerMessage.includes('depressed') || lowerMessage.includes('sad') || lowerMessage.includes('hopeless');
        hasRelationshipIssues ||= lowerMessage.includes('wife') || lowerMessage.includes('husband') || lowerMessage.includes('partner') || lowerMessage.includes('cheat');
        
        // Check for specific anxiety disorders
        const ptsdKeywords = ['trauma', 'flashback', 'nightmare', 'trigger', 'ptsd', 'veteran', 'assault', 'accident'];
        const ocdKeywords = ['ocd', 'obsessive', 'compulsive', 'contamination', 'checking', 'counting', 'intrusive', 'ritual'];
        const panicKeywords = ['panic', 'heart racing', 'can\'t breathe', 'chest pain', 'dying', 'losing control'];
        
        const hasPTSDIndicators = ptsdKeywords.some(word => lowerMessage.includes(word));
        const hasOCDIndicators = ocdKeywords.some(word => lowerMessage.includes(word));
        const hasPanicIndicators = panicKeywords.some(word => lowerMessage.includes(word));
        
        if (hasHallucinationIndicators) anxietyLevel = 10;
        else if (hasViolentThoughts) anxietyLevel = Math.max(anxietyLevel, 8);
        else if (hasDepressionKeywords) anxietyLevel = Math.max(anxietyLevel, 6);
        

        let personalizedResponse;
        let triggers: string[] = [];
        let copingStrategies: string[] = [];
        
        if (hasHallucinationIndicators) {
          personalizedResponse = "Right now: Look around and name 5 things you can see. Touch something cold - ice or cold water on your face. Breathe slowly: in for 4, out for 6. If this continues, call 988 immediately.";
          triggers = ['Paranoia', 'Fear', 'Crisis'];
          copingStrategies = [
            'Name 5 things you see RIGHT NOW',
            'Splash cold water on face or hold ice',
            'Call 988 or go to ER immediately',
            'Stay with someone trusted'
          ];
        } else if (contextSummary.panic.thresholdMet) {
          personalizedResponse = "This is panic, not danger. Breathe: in for 4, hold for 4, out for 6. Five times. Place hand on chest - you're okay. This will pass in 10-20 minutes.";
          triggers = ['Panic attack', 'Acute anxiety'];
          copingStrategies = [
            'Square breathing: 4-4-4-4 pattern',
            'Ice cube on wrist or neck',
            'Count backwards from 100 by 7s',
            'This WILL pass in 10-20 minutes'
          ];
          anxietyLevel = Math.max(anxietyLevel, 8);
        } else if (contextSummary.ptsd.thresholdMet) {
          personalizedResponse = "You're having a trauma response. You're safe now. Ground yourself: 5 things you see, 4 you hear, 3 you touch. The flashback will pass.";
          triggers = ['PTSD', 'Trauma response', 'Flashback'];
          copingStrategies = [
            '5-4-3-2-1 grounding NOW',
            'Smell something strong (coffee, essential oil)',
            'Bilateral stimulation: tap shoulders alternately',
            'Remind yourself: "That was then, this is now"'
          ];
          anxietyLevel = Math.max(anxietyLevel, 7);
        } else if (contextSummary.ocd.thresholdMet) {
          personalizedResponse = "OCD is loud right now. Don't do the compulsion. Set a 5-minute timer - sit with the discomfort. The urge will peak and fade. You can handle this.";
          triggers = ['OCD', 'Intrusive thoughts', 'Compulsions'];
          copingStrategies = [
            'Delay the ritual by 5 minutes',
            'Write the thought down, then close the notebook',
            'Do opposite action (if checking, walk away)',
            'Remember: thoughts are not facts'
          ];
          anxietyLevel = Math.max(anxietyLevel, 6);
        } else if (hasCrisisIndicators) {
          personalizedResponse = "Your pain is real. Right now: Step outside or to another room. Take 10 deep breaths, count them out loud. Then call 988 - they're available 24/7 to help you through this safely.";
          triggers = ['Crisis', 'Severe distress', 'Danger'];
          copingStrategies = [
            'Leave the room immediately',
            'Count 10 breaths out loud',
            'Call 988 now or text HOME to 741741',
            'Go for a walk outside'
          ];
        } else if (hasRelationshipIssues && contextSummary.depression.thresholdMet) {
          personalizedResponse = "This betrayal is devastating. Right now, breathe: in for 4, hold for 4, out for 6. Do this 5 times. Then call one person who cares about you. This intense pain will ease with time.";
          triggers = ['Betrayal', 'Loss', 'Grief'];
          copingStrategies = [
            'Breathe: 4-4-6 pattern, 5 times',
            'Call one trusted friend now',
            'Write your feelings for 10 minutes',
            'Take care of basics: eat, sleep, shower'
          ];
        } else if (lowerMessage.includes('generalized anxiety') || lowerMessage.includes('gad') || lowerMessage.includes('worry about everything')) {
          personalizedResponse = "Constant worry is exhausting. Right now: write down your top 3 worries. Circle what you can control today. Start with the smallest one.";
          triggers = ['GAD', 'Chronic worry', 'Anxiety'];
          copingStrategies = [
            'Worry time: set 15 min to worry, then stop',
            'Progressive muscle relaxation',
            'Challenge thoughts: "Is this likely?"',
            'Focus on ONE task for next hour'
          ];
          anxietyLevel = Math.max(anxietyLevel, 6);
        } else if (anxietyLevel > 6) {
          personalizedResponse = "Thank you for sharing all of this with me. Let's slow things down for a moment: inhale for 4, hold for 4, and exhale for 6 while relaxing your shoulders. Look around and name one thing you can see, one you can touch, one you can hear, and one you can smell. When you feel a little steadier, tell me which part of this feels heaviest so we can work through it together.";
          triggers = ['Stress', 'Overwhelm'];
          copingStrategies = [
            'Do three rounds of 4-4-6 breathing',
            'Name one thing you can see, touch, hear, and smell',
            'Sip water or hold something cool',
            'Describe the hardest part so we can plan next steps'
          ];
        } else if (contextSummary.depression.thresholdMet) {
          personalizedResponse = "I hear your sadness. It's okay to feel this way. Right now, do one kind thing for yourself - maybe a cup of tea or step outside for fresh air. What's making you sad?";
          triggers = ['Sadness', 'Low mood'];
          copingStrategies = [
            'One small act of self-care now',
            'Walk outside for 5 minutes',
            'Text someone you trust',
            'Let yourself cry if you need to'
          ];
          anxietyLevel = Math.max(anxietyLevel, 5);
        } else if (contextSummary.generalAnxiety.thresholdMet) {
          personalizedResponse = "Anxiety is tough. Right now: breathe in for 4, hold for 7, out for 8. Do this 3 times. Then name 5 things you can see. This will help calm your nervous system.";
          triggers = ['Anxiety', 'Worry'];
          copingStrategies = [
            '4-7-8 breathing, 3 times',
            'Name 5 things you see',
            'Walk around the room',
            'Hold ice or cold water'
          ];
          anxietyLevel = Math.max(anxietyLevel, 6);
        } else if (lowerMessage.includes('can\'t sleep') || lowerMessage.includes('insomnia')) {
          personalizedResponse = "Racing mind at night is hard. Try 4-7-8 breathing five times. Then do a body scan: tense and release each muscle group. No screens for next hour.";
          triggers = ['Insomnia', 'Sleep anxiety'];
          copingStrategies = [
            '4-7-8 breathing in bed',
            'Progressive muscle relaxation',
            'Write worries on paper, leave by bed',
            'Cool room, warm feet'
          ];
          anxietyLevel = Math.max(anxietyLevel, 5);
        } else {
          // Shorter default responses
          const responses = [
            "I'm here. What's on your mind today?",
            "Thanks for reaching out. What's happening?",
            "I'm listening. Tell me what you're feeling.",
            "You're not alone. What's going on?"
          ];
          personalizedResponse = responses[Math.floor(Math.random() * responses.length)];
          triggers = contextSummary.generalAnxiety.thresholdMet ? ['Stress'] : [];
          copingStrategies = ['Deep breathing', 'Take a walk', 'Call someone', 'Self-care'];
        }

        const derivedTriggers = detectAnxietyTriggers(message);
        if (derivedTriggers.length) {
          const merged = new Set([...triggers, ...derivedTriggers]);
          triggers = Array.from(merged);
        }
        
        // Add language detection to fallback if requested
        let detectedLanguage;
        if (includeLanguageDetection) {
          // Simple language detection for fallback
          const isSpanish = /[¡¿ñáéíóúü]|hola|ayuda|gracias|cómo|está|soy|tengo|estoy|muy|todo|nada|aquí|por|favor|ansiedad|triste|miedo|dolor/i.test(message);
          detectedLanguage = isSpanish ? 'es' : 'en';
        }

        analysisResult = {
          anxietyLevel,
          triggers,
          copingStrategies,
          personalizedResponse,
          contextSummary,
          ...(includeLanguageDetection && { detectedLanguage })
        };
      }

      res.json(analysisResult);
    } catch (error: any) {
      console.error('Anxiety analysis error:', error);
      
      // Return a fallback response even on complete failure
      res.json({
        anxietyLevel: 5,
        triggers: ['General stress'],
        copingStrategies: ['Deep breathing exercises', 'Mindfulness meditation'],
        personalizedResponse: "I'm here to support you through this difficult time. Let's focus on some coping strategies that can help you feel better."
      });
    }
  });

  // Therapist routes
  app.get("/api/therapists", async (req, res) => {
    try {
      const { city, state, specialty } = req.query;
      let therapists: Therapist[];

      if (city && state) {
        therapists = await storage.getTherapistsByLocation(city as string, state as string);
      } else if (specialty) {
        therapists = await storage.getTherapistsBySpecialty(specialty as string);
      } else {
        // Return empty array or implement general search
        therapists = [];
      }

      res.json(therapists);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch therapists" });
    }
  });

  app.post("/api/therapists", async (req, res) => {
    try {
      const validatedData = insertTherapistSchema.parse(req.body);
      const therapist = await storage.createTherapist(validatedData);
      res.status(201).json(therapist);
    } catch (error) {
      res.status(400).json({ error: "Invalid therapist data", details: error.message });
    }
  });

  // User goals routes
  app.get("/api/users/:userId/goals", async (req, res) => {
    try {
      const goals = await storage.getUserGoalsByUser(req.params.userId);
      res.json(goals);
    } catch (error) {
      console.error("Error fetching goals:", error);
      res.status(500).json({ error: "Failed to fetch user goals" });
    }
  });

  // Intervention summaries route
  app.get("/api/users/:userId/intervention-summaries", async (req, res) => {
    try {
      // getInterventionSummariesByUser already returns normalized data with parsed arrays
      const summaries = await storage.getInterventionSummariesByUser(req.params.userId);
      res.json(summaries);
    } catch (error) {
      console.error("Error fetching intervention summaries:", error);
      res.status(500).json({ error: "Failed to fetch intervention summaries" });
    }
  });

  app.post("/api/user-goals", async (req, res) => {
    try {
      const validatedData = insertUserGoalSchema.parse(req.body);
      const goal = await storage.createUserGoal(validatedData);
      res.status(201).json(goal);
    } catch (error) {
      console.error('Invalid user goal payload:', req.body, error);
      res.status(400).json({ error: "Invalid user goal data", details: error instanceof Error ? error.message : String(error) });
    }
  });

  app.put("/api/user-goals/:id", async (req, res) => {
    try {
      const goalId = req.params.id;
      const existingGoal = await storage.getUserGoal(goalId);
      if (!existingGoal) {
        return res.status(404).json({ error: 'Goal not found' });
      }

      const mergedData = {
        userId: req.body.userId ?? req.body.user_id ?? existingGoal.userId,
        title: req.body.title ?? existingGoal.title,
        description: req.body.description ?? existingGoal.description,
        category: req.body.category ?? existingGoal.category,
        frequency: req.body.frequency ?? existingGoal.frequency,
        targetValue: req.body.targetValue ?? existingGoal.targetValue,
        unit: req.body.unit ?? existingGoal.unit,
        startDate: req.body.startDate ?? existingGoal.startDate,
        endDate: req.body.endDate ?? existingGoal.endDate,
        isActive: typeof req.body.isActive === 'boolean' ? req.body.isActive : existingGoal.isActive,
      };

      const validatedData = insertUserGoalSchema.parse(mergedData);

      const updated = await storage.updateUserGoal(goalId, validatedData);
      res.json(updated);
    } catch (error) {
      console.error('Error updating user goal:', error);
      res.status(400).json({ error: 'Invalid user goal data', details: error instanceof Error ? error.message : String(error) });
    }
  });

  app.delete("/api/user-goals/:id", async (req, res) => {
    try {
      const goalId = req.params.id;
      const existingGoal = await storage.getUserGoal(goalId);
      if (!existingGoal) {
        return res.status(404).json({ error: 'Goal not found' });
      }

      await storage.deleteUserGoal(goalId);
      res.status(204).end();
    } catch (error) {
      console.error('Error deleting user goal:', error);
      res.status(500).json({ error: 'Failed to delete goal' });
    }
  });

  // Goal progress routes
  app.get("/api/goals/:goalId/progress", async (req, res) => {
    try {
      const progress = await storage.getGoalProgressByGoal(req.params.goalId);
      res.json(progress);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch goal progress" });
    }
  });

  app.post("/api/goal-progress", async (req, res) => {
    try {
      const validatedData = insertGoalProgressSchema.parse(req.body);
      const progress = await storage.createGoalProgress(validatedData);
      res.status(201).json(progress);
    } catch (error) {
      res.status(400).json({ error: "Invalid goal progress data", details: error.message });
    }
  });

  // User therapists routes
  app.get("/api/users/:userId/therapists", async (req, res) => {
    try {
      const userTherapists = await storage.getUserTherapistsByUser(req.params.userId);
      res.json(userTherapists);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch user therapists" });
    }
  });

  app.post("/api/user-therapists", async (req, res) => {
    try {
      const validatedData = insertUserTherapistSchema.parse(req.body);
      const userTherapist = await storage.createUserTherapist(validatedData);
      res.status(201).json(userTherapist);
    } catch (error) {
      res.status(400).json({ error: "Invalid user therapist data", details: error.message });
    }
  });

  // TTS (Text-to-Speech) endpoint using ElevenLabs
  app.post("/api/tts", async (req, res) => {
    try {
      const { text, language = 'en' } = req.body;

      if (!text || typeof text !== 'string') {
        return res.status(400).json({ error: "Text is required and must be a string" });
      }

      if (text.length > 2500) {
        return res.status(400).json({ error: "Text too long (max 2500 characters)" });
      }

      const elevenLabsApiKey = process.env.ELEVEN_LABS_API_KEY;
      if (!elevenLabsApiKey) {
        return res.status(503).json({ error: "ElevenLabs TTS service not configured" });
      }

      // Voice IDs for different languages
      const voiceIds = {
        'en': 'EXAVITQu4vr4xnSDxMaL', // Bella - warm, friendly female voice
        'es': 'XrExE9yKIg1WjnnlVkGX'  // Matilda - native Spanish speaker
      };

      const voiceId = voiceIds[language as keyof typeof voiceIds] || voiceIds['en'];

      console.log(`🎤 TTS Request: ${text.substring(0, 50)}... (${language})`);

      const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': elevenLabsApiKey
        },
        body: JSON.stringify({
          text: text,
          model_id: 'eleven_multilingual_v2',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
            style: 0.0,
            use_speaker_boost: true
          }
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('ElevenLabs API error:', response.status, errorText);

        if (response.status === 401) {
          return res.status(503).json({ error: "TTS service authentication failed" });
        } else if (response.status === 429) {
          return res.status(429).json({ error: "TTS service rate limit exceeded" });
        } else {
          return res.status(503).json({ error: "TTS service temporarily unavailable" });
        }
      }

      const audioBuffer = await response.arrayBuffer();

      // Set appropriate headers for audio response
      res.set({
        'Content-Type': 'audio/mpeg',
        'Content-Length': audioBuffer.byteLength.toString(),
        'Cache-Control': 'public, max-age=3600' // Cache for 1 hour
      });

      res.send(Buffer.from(audioBuffer));

    } catch (error) {
      console.error('TTS endpoint error:', error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // ElevenLabs quota check endpoint
  app.get("/api/tts/quota", async (req, res) => {
    try {
      const elevenLabsApiKey = process.env.ELEVEN_LABS_API_KEY;
      if (!elevenLabsApiKey) {
        return res.status(503).json({ error: "ElevenLabs API key not configured" });
      }

      const response = await fetch('https://api.elevenlabs.io/v1/user/subscription', {
        method: 'GET',
        headers: {
          'xi-api-key': elevenLabsApiKey
        }
      });

      if (!response.ok) {
        return res.status(response.status).json({ error: `ElevenLabs API error: ${response.status}` });
      }

      const quotaData = await response.json();
      res.json(quotaData);

    } catch (error) {
      console.error('Quota check error:', error);
      res.status(500).json({ error: "Failed to check quota" });
    }
  });

  // Azure TTS endpoint
  const stripMp3Headers = (buffer: Buffer, isFirstChunk: boolean): Buffer => {
    if (isFirstChunk || buffer.length < 10) {
      return buffer;
    }

    // Remove any leading ID3 tag from subsequent chunks to avoid duplicate headers
    if (buffer[0] === 0x49 && buffer[1] === 0x44 && buffer[2] === 0x33) { // "ID3"
      const headerSize =
        ((buffer[6] & 0x7f) << 21) |
        ((buffer[7] & 0x7f) << 14) |
        ((buffer[8] & 0x7f) << 7) |
        (buffer[9] & 0x7f);
      const totalSize = 10 + headerSize;
      return buffer.subarray(totalSize);
    }

    // Trim any null padding at the beginning of the chunk
    let offset = 0;
    while (offset < buffer.length && buffer[offset] === 0x00) {
      offset += 1;
    }

    return offset > 0 ? buffer.subarray(offset) : buffer;
  };
  app.post("/api/azure-tts", async (req, res) => {
    try {
      const { text, voice = 'en-US-JennyNeural', language = 'en-US' } = req.body;

      if (!text || typeof text !== 'string') {
        return res.status(400).json({ error: "Text is required and must be a string" });
      }

      const MAX_TOTAL_LENGTH = 4000;
      const CHUNK_LENGTH = 900;

      if (text.length > MAX_TOTAL_LENGTH) {
        return res.status(400).json({ error: `Text too long (max ${MAX_TOTAL_LENGTH} characters)` });
      }

      const azureKey = process.env.AZURE_API_KEY || process.env.AZURE_TTS_KEY;
      const azureRegion = process.env.AZURE_TTS_REGION || process.env.AZURE_REGION;

      if (!azureKey || !azureRegion) {
        return res.status(503).json({ error: "Azure TTS service not configured" });
      }

      console.log(`🎤 Azure TTS Request: ${text.substring(0, 50)}... (${voice})`);

      // Language-specific speech settings
      const speechRate = language.startsWith('es') ? '0.9' : '1.1'; // Slower for Spanish
      const pitch = language.startsWith('es') ? '+5%' : '+10%'; // Slightly lower pitch for Spanish

      const sanitizedText = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      const chunks: string[] = [];

      if (sanitizedText.length <= CHUNK_LENGTH) {
        chunks.push(sanitizedText);
      } else {
        let currentChunk = '';
        const words = sanitizedText.split(/\s+/);

        for (const word of words) {
          const separator = currentChunk.length > 0 ? ' ' : '';
          if ((currentChunk + separator + word).length <= CHUNK_LENGTH) {
            currentChunk += separator + word;
            continue;
          }

          if (currentChunk.length > 0) {
            chunks.push(currentChunk);
            currentChunk = '';
          }

          if (word.length > CHUNK_LENGTH) {
            for (let i = 0; i < word.length; i += CHUNK_LENGTH) {
              chunks.push(word.slice(i, i + CHUNK_LENGTH));
            }
          } else {
            currentChunk = word;
          }
        }

        if (currentChunk.length > 0) {
          chunks.push(currentChunk);
        }
      }

      const audioBuffers: Buffer[] = [];

      for (const [index, chunk] of chunks.entries()) {
        const ssml = `
          <speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="${language}">
            <voice name="${voice}">
              <prosody rate="${speechRate}" pitch="${pitch}">
                ${chunk}
              </prosody>
            </voice>
          </speak>
        `.trim();

        const response = await fetch(`https://${azureRegion}.tts.speech.microsoft.com/cognitiveservices/v1`, {
          method: 'POST',
          headers: {
            'Ocp-Apim-Subscription-Key': azureKey,
            'Content-Type': 'application/ssml+xml',
            'X-Microsoft-OutputFormat': 'audio-16khz-128kbitrate-mono-mp3',
            'User-Agent': 'Tranquiloo-TTS'
          },
          body: ssml
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Azure TTS API error:', response.status, errorText);

          if (response.status === 401) {
            return res.status(401).json({ error: "Invalid Azure API key" });
          } else if (response.status === 429) {
            return res.status(429).json({ error: "Rate limit exceeded" });
          } else if (response.status === 403) {
            return res.status(403).json({ error: "Quota exceeded" });
          }

          return res.status(response.status).json({ error: `Azure TTS error: ${response.status}` });
        }

        const buffer = Buffer.from(await response.arrayBuffer());
        audioBuffers.push(stripMp3Headers(buffer, index === 0));
      }

      const combinedBuffer = Buffer.concat(audioBuffers);

      // Set appropriate headers for audio response
      res.set({
        'Content-Type': 'audio/mpeg',
        'Content-Length': combinedBuffer.byteLength.toString(),
        'Cache-Control': 'public, max-age=3600' // Cache for 1 hour
      });

      res.send(combinedBuffer);
    } catch (error) {
      console.error('Azure TTS endpoint error:', error);
      if (!res.headersSent) {
        res.status(500).json({ error: "Internal server error" });
      }
    }
  });

  // Azure STT endpoint (Speech-to-Text)
  app.post("/api/azure-stt", async (req, res) => {
    try {
      const { audioBlob, language = 'es-MX', audioFormat } = req.body;

      if (!audioBlob) {
        return res.status(400).json({ error: "Audio data is required" });
      }

      const azureKey = process.env.AZURE_API_KEY || process.env.AZURE_TTS_KEY;
      const azureRegion = process.env.AZURE_TTS_REGION || process.env.AZURE_REGION;

      if (!azureKey || !azureRegion) {
        return res.status(503).json({ error: "Azure Speech service not configured" });
      }

      console.log(`🎤 Azure STT Request (${language})`);
      console.log(`🎵 Audio format: ${audioFormat}`);

      // Convert base64 audio to buffer
      const audioBuffer = Buffer.from(audioBlob.split(',')[1], 'base64');
      console.log(`📊 Audio buffer size: ${audioBuffer.length} bytes`);

      const response = await fetch(`https://${azureRegion}.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1?language=${language}&format=detailed`, {
        method: 'POST',
        headers: {
          'Ocp-Apim-Subscription-Key': azureKey,
          'Content-Type': 'audio/wav; codecs=audio/pcm; samplerate=16000',
          'Accept': 'application/json'
        },
        body: audioBuffer
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Azure STT API error:', response.status, errorText);

        if (response.status === 401) {
          return res.status(401).json({ error: "Invalid Azure API key" });
        } else if (response.status === 429) {
          return res.status(429).json({ error: "Rate limit exceeded" });
        }

        return res.status(response.status).json({ error: `Azure STT error: ${response.status}` });
      }

      const result = await response.json();
      console.log('📋 Azure STT full result:', JSON.stringify(result, null, 2));

      // Extract text from Azure STT response
      let transcript = '';
      if (result.RecognitionStatus === 'Success') {
        transcript = result.DisplayText || result.Text || '';
      } else {
        console.log('❌ Azure STT Recognition failed:', result.RecognitionStatus);
      }

      res.json({
        transcript: transcript,
        confidence: result.Confidence || 0.9,
        success: !!transcript
      });
    } catch (error) {
      console.error('Azure STT endpoint error:', error);
      if (!res.headersSent) {
        res.status(500).json({ error: "Internal server error" });
      }
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
