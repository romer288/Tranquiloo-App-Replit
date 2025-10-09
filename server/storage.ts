import { 
  profiles, chatSessions, chatMessages, anxietyAnalyses, therapists, 
  userTherapists, userGoals, goalProgress, interventionSummaries, emailQueue,
  therapistPatientConnections,
  treatmentPlans,
  type Profile, type InsertProfile, type ChatSession, type InsertChatSession,
  type ChatMessage, type InsertChatMessage, type AnxietyAnalysis, type InsertAnxietyAnalysis,
  type Therapist, type InsertTherapist, type UserTherapist, type InsertUserTherapist,
  type UserGoal, type InsertUserGoal, type GoalProgress, type InsertGoalProgress,
  type InterventionSummary, type InsertInterventionSummary,
  type TherapistPatientConnection, type InsertTherapistPatientConnection,
  type NormalizedInterventionSummary
} from "@shared/schema";
import { db, sqliteDatabase } from "./db";
import { eq, and, desc, gt, sql } from "drizzle-orm";
import { randomUUID } from 'crypto';

const ensureTreatmentPlanTable = () => {
  try {
    sqliteDatabase.prepare('SELECT 1 FROM treatment_plans LIMIT 1').get();
  } catch (error: any) {
    if (error?.message?.includes('no such table')) {
      sqliteDatabase.exec(`
        CREATE TABLE IF NOT EXISTS treatment_plans (
          id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
          patient_id TEXT UNIQUE NOT NULL,
          plan TEXT NOT NULL,
          created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000),
          updated_at INTEGER DEFAULT (strftime('%s', 'now') * 1000)
        );
      `);
    } else {
      throw error;
    }
  }
};

const ensureUserGoalsSourceColumn = () => {
  try {
    const columns = sqliteDatabase.prepare('PRAGMA table_info(user_goals);').all() as { name: string }[];
    const hasSource = columns.some((column) => column.name === 'source');
    if (!hasSource) {
      sqliteDatabase.exec('ALTER TABLE user_goals ADD COLUMN source TEXT;');
    }
  } catch (error) {
    console.error('Failed to ensure user_goals.source column:', error);
    throw error;
  }
};

const logTreatmentPlanDebug = (...args: unknown[]) => {
  console.log('[TreatmentPlan::Storage]', ...args);
};

const TREATMENT_PLAN_GOAL_SOURCE = 'treatment-plan';

export interface IStorage {
  // Profile management
  getProfile(id: string): Promise<Profile | undefined>;
  getProfileByEmail(email: string): Promise<Profile | undefined>;
  createProfile(profile: InsertProfile): Promise<Profile>;
  updateProfile(id: string, profile: Partial<InsertProfile>): Promise<Profile | undefined>;

  // Chat sessions
  getChatSession(id: string): Promise<ChatSession | undefined>;
  getChatSessionsByUser(userId: string): Promise<ChatSession[]>;
  getAllChatSessions(): Promise<ChatSession[]>;
  createChatSession(session: InsertChatSession): Promise<ChatSession>;
  updateChatSession(id: string, session: Partial<InsertChatSession>): Promise<ChatSession | undefined>;

  // Chat messages
  getChatMessage(id: string): Promise<ChatMessage | undefined>;
  getChatMessagesBySession(sessionId: string): Promise<ChatMessage[]>;
  getRawChatMessagesBySession(sessionId: string): Promise<ChatMessage[]>;
  getChatMessagesByUser(userId: string): Promise<ChatMessage[]>;
  createChatMessage(message: InsertChatMessage): Promise<ChatMessage>;

  // Anxiety analyses
  getAnxietyAnalysis(id: string): Promise<AnxietyAnalysis | undefined>;
  getAnxietyAnalysesByUser(userId: string): Promise<AnxietyAnalysis[]>;
  getAllAnxietyAnalyses(): Promise<AnxietyAnalysis[]>;
  createAnxietyAnalysis(analysis: InsertAnxietyAnalysis): Promise<AnxietyAnalysis>;

  // Therapists
  getTherapist(id: string): Promise<Therapist | undefined>;
  getTherapistsByLocation(city: string, state: string): Promise<Therapist[]>;
  getTherapistsBySpecialty(specialty: string): Promise<Therapist[]>;
  createTherapist(therapist: InsertTherapist): Promise<Therapist>;
  updateTherapist(id: string, therapist: Partial<InsertTherapist>): Promise<Therapist | undefined>;

  // User therapists
  getUserTherapistsByUser(userId: string): Promise<UserTherapist[]>;
  createUserTherapist(userTherapist: InsertUserTherapist): Promise<UserTherapist>;
  updateUserTherapist(id: string, userTherapist: Partial<InsertUserTherapist>): Promise<UserTherapist | undefined>;

  // User goals
  getUserGoal(id: string): Promise<UserGoal | undefined>;
  getUserGoalsByUser(userId: string): Promise<UserGoal[]>;
  createUserGoal(goal: InsertUserGoal): Promise<UserGoal>;
  updateUserGoal(id: string, goal: Partial<InsertUserGoal>): Promise<UserGoal | undefined>;
  deleteUserGoal(id: string): Promise<void>;

  // Goal progress
  getGoalProgressByGoal(goalId: string): Promise<GoalProgress[]>;
  createGoalProgress(progress: InsertGoalProgress): Promise<GoalProgress>;

  // Intervention summaries
  getInterventionSummariesByUser(userId: string): Promise<NormalizedInterventionSummary[]>;
  createInterventionSummary(summary: InsertInterventionSummary): Promise<InterventionSummary>;
  updateInterventionSummary(id: string, summary: Partial<InsertInterventionSummary>): Promise<InterventionSummary | undefined>;

  // Treatment plan sync
  syncTreatmentPlanGoals(patientId: string, plan: any): Promise<void>;

  // Treatment plans
  getTreatmentPlanByPatient(patientId: string): Promise<{ plan: any; updatedAt: number } | undefined>;
  upsertTreatmentPlan(patientId: string, plan: any): Promise<{ plan: any; updatedAt: number }>;

  // Therapist connections
  createTherapistConnection(connection: { userId: string; therapistName: string; contactValue: string; notes: string; shareReport: boolean }): Promise<UserTherapist>;

  // Email queue
  createEmailNotification(email: { toEmail: string; subject: string; htmlContent: string; emailType: string; metadata?: string }): Promise<any>;
  getEmailNotificationsByTherapist(therapistEmail: string): Promise<any[]>;
  
  // Email verification
  createEmailVerification(email: string, token: string): Promise<void>;
  
  // License management
  updateProfileLicenseInfo(id: string, licenseNumber?: string | null, licenseState?: string | null, graceDeadline?: Date | null): Promise<void>;
  updateProfileVerification(id: string, token: string | null, verified?: boolean): Promise<Profile | undefined>;
  verifyEmail(token: string): Promise<Profile | undefined>;
  verifyEmailByAddress(email: string): Promise<Profile | undefined>;
  getPendingEmails(): Promise<any[]>;
  updateEmailStatus(emailId: string, status: string): Promise<void>;
  setPasswordResetToken(email: string, token: string, expires: Date): Promise<Profile | undefined>;
  resetPassword(token: string, newPassword: string): Promise<Profile | undefined>;
  
  // Email queue management
  getPendingEmails(): Promise<any[]>;
  updateEmailStatus(emailId: string, status: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // Profile management
  async getProfile(id: string): Promise<Profile | undefined> {
    const result = await db.select().from(profiles).where(eq(profiles.id, id)).limit(1);
    return result[0];
  }

  async getProfileByEmail(email: string): Promise<Profile | undefined> {
    const result = await db.select().from(profiles).where(eq(profiles.email, email)).limit(1);
    return result[0];
  }

  async createProfile(profile: InsertProfile): Promise<Profile> {
    // SQLite doesn't support returning() the same way as PostgreSQL
    // Insert the profile first
    await db.insert(profiles).values(profile);
    // Then fetch it back by email (which is unique)
    const result = await db.select().from(profiles).where(eq(profiles.email, profile.email)).limit(1);
    return result[0];
  }

  async updateProfile(id: string, profile: Partial<InsertProfile>): Promise<Profile | undefined> {
    await db.update(profiles).set({
      ...profile,
      updatedAt: Date.now()
    }).where(eq(profiles.id, id));
    const result = await db.select().from(profiles).where(eq(profiles.id, id)).limit(1);
    return result[0];
  }

  // Chat sessions
  async getChatSession(id: string): Promise<ChatSession | undefined> {
    const result = await db.select().from(chatSessions).where(eq(chatSessions.id, id)).limit(1);
    return result[0];
  }

  async getChatSessionsByUser(userId: string): Promise<ChatSession[]> {
    return await db.select().from(chatSessions).where(eq(chatSessions.userId, userId));
  }

  async getAllChatSessions(): Promise<ChatSession[]> {
    return await db.select().from(chatSessions).orderBy(desc(chatSessions.updatedAt));
  }

  async createChatSession(session: InsertChatSession): Promise<ChatSession> {
    const sessionId = session.id || randomUUID();
    await db.insert(chatSessions).values({...session, id: sessionId});
    const result = await db.select().from(chatSessions).where(eq(chatSessions.id, sessionId)).limit(1);
    return result[0];
  }

  async updateChatSession(id: string, session: Partial<InsertChatSession>): Promise<ChatSession | undefined> {
    await db.update(chatSessions).set({
      ...session,
      updatedAt: Date.now()
    }).where(eq(chatSessions.id, id));
    const result = await db.select().from(chatSessions).where(eq(chatSessions.id, id)).limit(1);
    return result[0];
  }

  // Chat messages
  async getChatMessage(id: string): Promise<ChatMessage | undefined> {
    const result = await db.select().from(chatMessages).where(eq(chatMessages.id, id)).limit(1);
    return result[0];
  }

  async getChatMessagesBySession(sessionId: string): Promise<ChatMessage[]> {
    const messages = await db.select().from(chatMessages).where(eq(chatMessages.sessionId, sessionId)).orderBy(chatMessages.createdAt);

    // Remove duplicates at database level by content, sender, and sessionId
    // More aggressive deduplication to catch existing duplicates
    const uniqueMessages = messages.filter((msg, index, arr) => {
      const duplicateIndex = arr.findIndex(m =>
        m.content === msg.content &&
        m.sender === msg.sender &&
        m.sessionId === msg.sessionId
      );

      // Keep the first occurrence (earliest by index)
      return duplicateIndex === index;
    });

    return uniqueMessages;
  }

  // Get raw messages without deduplication for duplicate checking
  async getRawChatMessagesBySession(sessionId: string): Promise<ChatMessage[]> {
    return await db.select().from(chatMessages).where(eq(chatMessages.sessionId, sessionId)).orderBy(chatMessages.createdAt);
  }

  async getChatMessagesByUser(userId: string): Promise<ChatMessage[]> {
    // Join with chat_sessions to get all messages for a user across all sessions
    const result = await db
      .select({
        id: chatMessages.id,
        sessionId: chatMessages.sessionId,
        userId: chatMessages.userId,
        content: chatMessages.content,
        sender: chatMessages.sender,
        createdAt: chatMessages.createdAt
      })
      .from(chatMessages)
      .innerJoin(chatSessions, eq(chatMessages.sessionId, chatSessions.id))
      .where(eq(chatSessions.userId, userId))
      .orderBy(chatMessages.createdAt);
    
    return result;
  }

  async createChatMessage(message: InsertChatMessage): Promise<ChatMessage> {
    const messageId = message.id || randomUUID();
    await db.insert(chatMessages).values({...message, id: messageId});
    const result = await db.select().from(chatMessages).where(eq(chatMessages.id, messageId)).limit(1);
    return result[0];
  }

  // Anxiety analyses
  async getAnxietyAnalysis(id: string): Promise<AnxietyAnalysis | undefined> {
    const result = await db.select().from(anxietyAnalyses).where(eq(anxietyAnalyses.id, id)).limit(1);
    return result[0];
  }

  async getAnxietyAnalysesByUser(userId: string): Promise<AnxietyAnalysis[]> {
    return await db.select().from(anxietyAnalyses).where(eq(anxietyAnalyses.userId, userId));
  }

  async getAllAnxietyAnalyses(): Promise<AnxietyAnalysis[]> {
    return await db.select().from(anxietyAnalyses).orderBy(desc(anxietyAnalyses.createdAt));
  }

  async createAnxietyAnalysis(analysis: InsertAnxietyAnalysis): Promise<AnxietyAnalysis> {
    const analysisId = analysis.id || randomUUID();
    await db.insert(anxietyAnalyses).values({...analysis, id: analysisId});
    const result = await db.select().from(anxietyAnalyses).where(eq(anxietyAnalyses.id, analysisId)).limit(1);
    return result[0];
  }

  // Therapists
  async getTherapist(id: string): Promise<Therapist | undefined> {
    const result = await db.select().from(therapists).where(eq(therapists.id, id)).limit(1);
    return result[0];
  }

  async getTherapistsByLocation(city: string, state: string): Promise<Therapist[]> {
    return await db.select().from(therapists).where(
      and(eq(therapists.city, city), eq(therapists.state, state))
    );
  }

  async getTherapistsBySpecialty(specialty: string): Promise<Therapist[]> {
    return await db.select().from(therapists);  // TODO: Implement array contains search
  }

  async createTherapist(therapist: InsertTherapist): Promise<Therapist> {
    const result = await db.insert(therapists).values(therapist).returning();
    return result[0];
  }

  async updateTherapist(id: string, therapist: Partial<InsertTherapist>): Promise<Therapist | undefined> {
    const result = await db.update(therapists).set({
      ...therapist,
      updatedAt: Date.now()
    }).where(eq(therapists.id, id)).returning();
    return result[0];
  }

  // User therapists
  async getUserTherapistsByUser(userId: string): Promise<UserTherapist[]> {
    return await db.select().from(userTherapists).where(eq(userTherapists.userId, userId));
  }

  async createUserTherapist(userTherapist: InsertUserTherapist): Promise<UserTherapist> {
    const result = await db.insert(userTherapists).values(userTherapist).returning();
    return result[0];
  }

  async updateUserTherapist(id: string, userTherapist: Partial<InsertUserTherapist>): Promise<UserTherapist | undefined> {
    const result = await db.update(userTherapists).set({
      ...userTherapist,
      updatedAt: Date.now()
    }).where(eq(userTherapists.id, id)).returning();
    return result[0];
  }

  // User goals
  async getUserGoal(id: string): Promise<UserGoal | undefined> {
    ensureUserGoalsSourceColumn();
    const result = await db.select().from(userGoals).where(eq(userGoals.id, id)).limit(1);
    return result[0];
  }

  async getUserGoalsByUser(userId: string): Promise<UserGoal[]> {
    ensureUserGoalsSourceColumn();
    const goals = await db.select().from(userGoals).where(eq(userGoals.userId, userId));

    // Backfill missing IDs for legacy rows created before UUID support
    for (const goal of goals) {
      if (!goal.id) {
        const generatedId = randomUUID();
        await db
          .update(userGoals)
          .set({ id: generatedId, updatedAt: Date.now() })
          .where(
            and(
              eq(userGoals.userId, goal.userId),
              eq(userGoals.title, goal.title),
              eq(userGoals.startDate, goal.startDate)
            )
          );
        goal.id = generatedId;
      }
    }

    return goals;
  }

  async createUserGoal(goal: InsertUserGoal): Promise<UserGoal> {
    ensureUserGoalsSourceColumn();
    const goalId = (goal as any).id || randomUUID();
    const result = await db.insert(userGoals).values({
      ...goal,
      id: goalId,
      createdAt: goal.createdAt ?? Date.now(),
      updatedAt: goal.updatedAt ?? Date.now()
    }).returning();
    return result[0];
  }

  async updateUserGoal(id: string, goal: Partial<InsertUserGoal>): Promise<UserGoal | undefined> {
    ensureUserGoalsSourceColumn();
    const result = await db.update(userGoals).set({
      ...goal,
      updatedAt: Date.now()
    }).where(eq(userGoals.id, id)).returning();
    return result[0];
  }

  async deleteUserGoal(id: string): Promise<void> {
    ensureUserGoalsSourceColumn();
    await db.delete(userGoals).where(eq(userGoals.id, id));
  }

  // Goal progress
  async getGoalProgressByGoal(goalId: string): Promise<GoalProgress[]> {
    return await db.select().from(goalProgress).where(eq(goalProgress.goalId, goalId));
  }

  async createGoalProgress(progress: InsertGoalProgress): Promise<GoalProgress> {
    const result = await db.insert(goalProgress).values(progress).returning();
    return result[0];
  }

  // Intervention summaries
  async getInterventionSummariesByUser(userId: string): Promise<NormalizedInterventionSummary[]> {
    const raw = await db
      .select()
      .from(interventionSummaries)
      .where(eq(interventionSummaries.userId, userId));

    const { normalizeInterventionSummary } = await import('@shared/schema');
    return raw.map(normalizeInterventionSummary);
  }

  async createInterventionSummary(summary: InsertInterventionSummary): Promise<InterventionSummary> {
    const result = await db.insert(interventionSummaries).values(summary).returning();
    return result[0];
  }

  async updateInterventionSummary(id: string, summary: Partial<InsertInterventionSummary>): Promise<InterventionSummary | undefined> {
    const result = await db.update(interventionSummaries).set({
      ...summary,
      updatedAt: Date.now()
    }).where(eq(interventionSummaries.id, id)).returning();
    return result[0];
  }

  async getTreatmentPlanByPatient(patientId: string): Promise<{ plan: any; updatedAt: number } | undefined> {
    ensureTreatmentPlanTable();
    logTreatmentPlanDebug('Fetching treatment plan for patient', patientId);
    const row = sqliteDatabase
      .prepare(
        'SELECT plan, updated_at AS updatedAt, created_at AS createdAt FROM treatment_plans WHERE patient_id = ? LIMIT 1'
      )
      .get(patientId) as { plan: string; updatedAt?: number; createdAt?: number } | undefined;

    if (!row) {
      logTreatmentPlanDebug('No plan found for patient', patientId);
      return undefined;
    }

    let parsedPlan: any = null;
    try {
      parsedPlan = row.plan ? JSON.parse(row.plan) : null;
    } catch (error) {
      console.error('Failed to parse treatment plan JSON for patient', patientId, error);
    }

    logTreatmentPlanDebug('Loaded plan for patient', patientId, 'goals:', Array.isArray(parsedPlan?.goals) ? parsedPlan.goals.length : 'n/a', 'sessionNotes:', Array.isArray(parsedPlan?.sessionNotes) ? parsedPlan.sessionNotes.length : 'n/a');
    return {
      plan: parsedPlan,
      updatedAt: row.updatedAt ?? row.createdAt ?? Date.now()
    };
  }

  async upsertTreatmentPlan(patientId: string, plan: any): Promise<{ plan: any; updatedAt: number }> {
    ensureTreatmentPlanTable();
    const planJson = JSON.stringify(plan);
    const timestamp = Date.now();

    logTreatmentPlanDebug('Saving plan for patient', patientId, 'goals:', Array.isArray(plan?.goals) ? plan.goals.length : 'n/a', 'sessionNotes:', Array.isArray(plan?.sessionNotes) ? plan.sessionNotes.length : 'n/a');

    const existing = sqliteDatabase
      .prepare('SELECT id FROM treatment_plans WHERE patient_id = ? LIMIT 1')
      .get(patientId) as { id: string } | undefined;

    if (existing?.id) {
      sqliteDatabase
        .prepare('UPDATE treatment_plans SET plan = ?, updated_at = ? WHERE patient_id = ?')
        .run(planJson, timestamp, patientId);
      logTreatmentPlanDebug('Updated existing plan for patient', patientId);
    } else {
      sqliteDatabase
        .prepare('INSERT INTO treatment_plans (id, patient_id, plan, created_at, updated_at) VALUES (?, ?, ?, ?, ?)')
        .run(randomUUID(), patientId, planJson, timestamp, timestamp);
      logTreatmentPlanDebug('Inserted new plan for patient', patientId);
    }

    return { plan, updatedAt: timestamp };
  }

  async syncTreatmentPlanGoals(patientId: string, plan: any): Promise<void> {
    ensureUserGoalsSourceColumn();

    const goalsArray = Array.isArray(plan?.goals) ? plan.goals : [];
    const timestamp = Date.now();

    const deleteStmt = sqliteDatabase.prepare('DELETE FROM user_goals WHERE user_id = ? AND source = ?');
    const insertStmt = sqliteDatabase.prepare(
      `INSERT INTO user_goals (
        id,
        user_id,
        title,
        description,
        category,
        priority,
        status,
        created_at,
        updated_at,
        frequency,
        notes,
        milestones,
        target_value,
        unit,
        start_date,
        end_date,
        is_active,
        source
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );

    const runSync = sqliteDatabase.transaction(() => {
      deleteStmt.run(patientId, TREATMENT_PLAN_GOAL_SOURCE);

      goalsArray.forEach((goal: any) => {
        const goalId = goal?.id ?? randomUUID();
        const title = goal?.title ?? 'Therapy Goal';
        const description = goal?.description ?? '';
        const category = (goal?.category ?? 'treatment').toString();
        const priority = goal?.priority ?? 'medium';
        const frequency = (goal?.frequency ?? 'weekly').toString();
        const notes = goal?.therapistNotes ?? '';
        const milestones = Array.isArray(goal?.milestones) ? JSON.stringify(goal.milestones) : JSON.stringify([]);
        const baseTargetValue = goal?.targetValue ?? goal?.target_value;
        const targetValue = baseTargetValue !== undefined && baseTargetValue !== null ? String(baseTargetValue) : '';
        const unit = goal?.unit ?? '';
        const startDate = goal?.startDate ?? new Date(timestamp).toISOString().split('T')[0];
        const endDate = goal?.targetDate ?? goal?.endDate ?? null;

        insertStmt.run(
          goalId,
          patientId,
          title,
          description,
          category,
          priority,
          'active',
          timestamp,
          timestamp,
          frequency,
          notes,
          milestones,
          targetValue,
          unit,
          startDate,
          endDate,
          1,
          TREATMENT_PLAN_GOAL_SOURCE
        );
      });
    });

    runSync();
    logTreatmentPlanDebug('Synced treatment goals to user_goals for patient', patientId, 'count:', goalsArray.length);
  }

  // Therapist connections
  async createTherapistConnection(connection: { userId: string; therapistName: string; contactValue: string; notes: string; shareReport: boolean }): Promise<UserTherapist> {
    const result = await db.insert(userTherapists).values({
      userId: connection.userId,
      therapistName: connection.therapistName,
      contactMethod: 'email', // Default to email since contactValue appears to be email
      contactValue: connection.contactValue,
      notes: connection.notes,
      shareReport: connection.shareReport
    }).returning();
    return result[0];
  }

  // HIPAA-compliant connection management
  async createTherapistPatientConnection(connection: InsertTherapistPatientConnection): Promise<TherapistPatientConnection> {
    const connectionId = connection.id || randomUUID();
    await db.insert(therapistPatientConnections).values({
      ...connection,
      id: connectionId,
      connectionRequestDate: connection.connectionRequestDate || Date.now(),
      createdAt: connection.createdAt || Date.now(),
      updatedAt: connection.updatedAt || Date.now()
    });
    const result = await db.select().from(therapistPatientConnections).where(eq(therapistPatientConnections.id, connectionId)).limit(1);
    return result[0];
  }

  async getTherapistPatientConnections(therapistEmail: string): Promise<TherapistPatientConnection[]> {
    return await db
      .select()
      .from(therapistPatientConnections)
      .where(and(
        eq(therapistPatientConnections.therapistEmail, therapistEmail),
        eq(therapistPatientConnections.isActive, true),
        eq(therapistPatientConnections.patientConsentGiven, true),
        eq(therapistPatientConnections.therapistAccepted, true)
      ));
  }

  async getPatientTherapistConnections(patientId: string): Promise<TherapistPatientConnection[]> {
    return await db
      .select()
      .from(therapistPatientConnections)
      .where(and(
        eq(therapistPatientConnections.patientId, patientId),
        eq(therapistPatientConnections.isActive, true),
        eq(therapistPatientConnections.patientConsentGiven, true),
        eq(therapistPatientConnections.therapistAccepted, true)
      ));
  }

  async acceptTherapistConnection(connectionId: string, therapistEmail: string): Promise<TherapistPatientConnection | undefined> {
    await db
      .update(therapistPatientConnections)
      .set({
        therapistAccepted: true,
        connectionAcceptedDate: Date.now(),
        updatedAt: Date.now()
      })
      .where(and(
        eq(therapistPatientConnections.id, connectionId),
        eq(therapistPatientConnections.therapistEmail, therapistEmail)
      ));

    const result = await db.select().from(therapistPatientConnections)
      .where(eq(therapistPatientConnections.id, connectionId))
      .limit(1);

    return result[0];
  }

  async getTherapistPatientConnection(connectionId: string): Promise<TherapistPatientConnection | undefined> {
    const result = await db
      .select()
      .from(therapistPatientConnections)
      .where(eq(therapistPatientConnections.id, connectionId))
      .limit(1);
    return result[0];
  }

  async updateTherapistPatientConnection(connectionId: string, updates: Partial<TherapistPatientConnection>): Promise<void> {
    await db
      .update(therapistPatientConnections)
      .set({
        ...updates,
        updatedAt: Date.now()
      })
      .where(eq(therapistPatientConnections.id, connectionId));
  }

  // Email queue
  async createEmailNotification(email: { toEmail: string; subject: string; htmlContent: string; emailType: string; metadata?: string }): Promise<any> {
    const emailId = randomUUID();
    await db.insert(emailQueue).values({
      id: emailId,
      toEmail: email.toEmail,
      fromEmail: 'info@tranquiloo-app.com', // Use verified sender
      subject: email.subject,
      body: email.htmlContent, // Add body field for SQLite
      htmlContent: email.htmlContent,
      textContent: email.htmlContent.replace(/<[^>]*>/g, ''), // Strip HTML for text version
      emailType: email.emailType,
      metadata: email.metadata || null,
      createdAt: Date.now()
    });
    const result = await db.select().from(emailQueue).where(eq(emailQueue.id, emailId)).limit(1);
    return result[0];
  }

  async getEmailNotificationsByTherapist(therapistEmail: string): Promise<any[]> {
    // Only return notifications that are 'sent' (not processed/deleted)
    return await db.select().from(emailQueue)
      .where(and(
        eq(emailQueue.toEmail, therapistEmail),
        eq(emailQueue.status, 'sent')
      ))
      .orderBy(desc(emailQueue.createdAt));
  }

  async updateEmailNotificationStatus(connectionId: string, status: string): Promise<void> {
    // Update all notifications for this connection
    await db.update(emailQueue)
      .set({ status, updatedAt: Date.now() })
      .where(sql`json_extract(metadata, '$.connectionId') = ${connectionId}`);
  }

  // Email verification methods
  async updateProfileVerification(id: string, token: string | null, verified?: boolean): Promise<Profile | undefined> {
    const updateData: any = {
      emailVerificationToken: token,
      updatedAt: Date.now()
    };
    
    if (verified !== undefined) {
      updateData.emailVerified = verified;
    }
    
    await db.update(profiles).set(updateData).where(eq(profiles.id, id));
    const result = await db.select().from(profiles).where(eq(profiles.id, id)).limit(1);
    return result[0];
  }

  async verifyEmail(token: string): Promise<Profile | undefined> {
    // First find the profile with the matching token
    const profileToVerify = await db.select().from(profiles).where(eq(profiles.emailVerificationToken, token)).limit(1);
    if (!profileToVerify[0]) {
      return undefined;
    }
    
    // Update the profile to mark as verified and clear the token
    await db.update(profiles).set({
      emailVerified: true,
      emailVerificationToken: null,
      updatedAt: Date.now()
    }).where(eq(profiles.id, profileToVerify[0].id));
    
    // Return the updated profile by ID
    const result = await db.select().from(profiles).where(eq(profiles.id, profileToVerify[0].id)).limit(1);
    return result[0];
  }

  async createEmailVerification(email: string, token: string): Promise<void> {
    await db.update(profiles).set({
      emailVerificationToken: token,
      updatedAt: Date.now()
    }).where(eq(profiles.email, email));
  }

  async verifyEmailByAddress(email: string): Promise<Profile | undefined> {
    const result = await db.update(profiles).set({
      emailVerified: true,
      emailVerificationToken: null,
      updatedAt: Date.now()
    }).where(eq(profiles.email, email)).returning();
    return result[0];
  }

  async setPasswordResetToken(email: string, token: string, expires: Date): Promise<Profile | undefined> {
    const result = await db.update(profiles).set({
      passwordResetToken: token,
      passwordResetExpires: expires,
      updatedAt: Date.now()
    }).where(eq(profiles.email, email)).returning();
    return result[0];
  }

  async resetPassword(token: string, newPassword: string): Promise<Profile | undefined> {
    // Ensure token is valid and not expired
    const now = Date.now();
    const existing = await db
      .select()
      .from(profiles)
      .where(and(eq(profiles.passwordResetToken, token), gt(profiles.passwordResetExpires, now)))
      .limit(1);

    const profile = existing[0];
    if (!profile) return undefined;

    // Hash the new password before storing
    const bcrypt = await import('bcryptjs');
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const result = await db
      .update(profiles)
      .set({
        hashedPassword,
        passwordResetToken: null,
        passwordResetExpires: null,
        updatedAt: Date.now(),
      })
      .where(eq(profiles.id, profile.id))
      .returning();
    return result[0];
  }

  // License management
  async updateProfileLicenseInfo(id: string, licenseNumber?: string | null, licenseState?: string | null, graceDeadline?: Date | null): Promise<void> {
    await db.update(profiles).set({
      licenseNumber: licenseNumber,
      licenseState: licenseState,
      licenseGraceDeadline: graceDeadline,
      updatedAt: Date.now()
    }).where(eq(profiles.id, id));
  }

  // Email queue management methods
  async getPendingEmails(): Promise<any[]> {
    return await db.select().from(emailQueue)
      .where(eq(emailQueue.status, 'pending'))
      .orderBy(emailQueue.createdAt);
  }

  async updateEmailStatus(emailId: string, status: string): Promise<void> {
    await db.update(emailQueue).set({
      status: status,
      sentAt: status === 'sent' ? Date.now() : null
    }).where(eq(emailQueue.id, emailId));
  }
}

export const storage = new DatabaseStorage();
