var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// shared/schema.ts
var schema_exports = {};
__export(schema_exports, {
  anxietyAnalyses: () => anxietyAnalyses,
  appointments: () => appointments,
  chatMessages: () => chatMessages,
  chatSessions: () => chatSessions,
  emailQueue: () => emailQueue,
  goalProgress: () => goalProgress,
  insertAnxietyAnalysisSchema: () => insertAnxietyAnalysisSchema,
  insertAppointmentSchema: () => insertAppointmentSchema,
  insertChatMessageSchema: () => insertChatMessageSchema,
  insertChatSessionSchema: () => insertChatSessionSchema,
  insertGoalProgressSchema: () => insertGoalProgressSchema,
  insertInterventionSummarySchema: () => insertInterventionSummarySchema,
  insertProfileSchema: () => insertProfileSchema,
  insertTherapistPatientConnectionSchema: () => insertTherapistPatientConnectionSchema,
  insertTherapistSchema: () => insertTherapistSchema,
  insertUserGoalSchema: () => insertUserGoalSchema,
  insertUserTherapistSchema: () => insertUserTherapistSchema,
  interventionSummaries: () => interventionSummaries,
  normalizeInterventionSummary: () => normalizeInterventionSummary,
  profiles: () => profiles,
  therapistPatientConnections: () => therapistPatientConnections,
  therapists: () => therapists,
  treatmentPlans: () => treatmentPlans,
  userGoals: () => userGoals,
  userTherapists: () => userTherapists
});
import { sqliteTable as pgTable, text, integer } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
var uuid, timestamp, boolean, numeric, profiles, chatSessions, chatMessages, anxietyAnalyses, therapists, userTherapists, therapistPatientConnections, userGoals, goalProgress, interventionSummaries, treatmentPlans, appointments, emailQueue, insertProfileSchema, insertChatSessionSchema, insertChatMessageSchema, insertAnxietyAnalysisSchema, insertTherapistSchema, insertUserTherapistSchema, insertUserGoalSchema, insertTherapistPatientConnectionSchema, insertGoalProgressSchema, insertAppointmentSchema, insertInterventionSummarySchema, normalizeInterventionSummary;
var init_schema = __esm({
  "shared/schema.ts"() {
    "use strict";
    uuid = (name) => text(name);
    timestamp = (name) => integer(name);
    boolean = (name) => integer(name, { mode: "boolean" });
    numeric = (name, opts) => text(name);
    profiles = pgTable("profiles", {
      id: uuid("id").primaryKey(),
      email: text("email").unique().notNull(),
      firstName: text("first_name"),
      lastName: text("last_name"),
      avatarUrl: text("avatar_url"),
      patientCode: text("patient_code"),
      role: text("role").default("user"),
      hashedPassword: text("hashed_password"),
      // Added for password authentication
      emailVerified: boolean("email_verified").default(false),
      emailVerificationToken: text("email_verification_token"),
      passwordResetToken: text("password_reset_token"),
      passwordResetExpires: timestamp("password_reset_expires"),
      authMethod: text("auth_method").default("email"),
      // 'email' or 'google'
      licenseNumber: text("license_number"),
      // For therapists
      licenseState: text("license_state"),
      // For therapists
      licenseGraceDeadline: timestamp("license_grace_deadline"),
      // 24-hour grace period
      createdAt: timestamp("created_at"),
      updatedAt: timestamp("updated_at")
    });
    chatSessions = pgTable("chat_sessions", {
      id: uuid("id").primaryKey(),
      userId: text("user_id").notNull(),
      // Changed from uuid to text for user compatibility
      title: text("title").default("New Chat Session"),
      aiCompanion: text("ai_companion").default("vanessa"),
      language: text("language").default("english"),
      createdAt: timestamp("created_at"),
      updatedAt: timestamp("updated_at")
    });
    chatMessages = pgTable("chat_messages", {
      id: uuid("id").primaryKey(),
      sessionId: uuid("session_id").notNull(),
      userId: text("user_id").notNull(),
      // Changed from uuid to text for user compatibility
      content: text("content").notNull(),
      sender: text("sender").notNull(),
      // 'user' or 'ai'
      createdAt: timestamp("created_at")
    });
    anxietyAnalyses = pgTable("anxiety_analyses", {
      id: uuid("id").primaryKey(),
      userId: text("user_id").notNull(),
      // Changed from uuid to text for user compatibility
      messageId: uuid("message_id"),
      anxietyLevel: integer("anxiety_level").notNull(),
      analysisSource: text("analysis_source").default("claude"),
      anxietyTriggers: text("anxiety_triggers"),
      copingStrategies: text("coping_strategies"),
      personalizedResponse: text("personalized_response"),
      confidenceScore: numeric("confidence_score", { precision: 3, scale: 2 }),
      createdAt: timestamp("created_at")
    });
    therapists = pgTable("therapists", {
      id: uuid("id").primaryKey(),
      name: text("name").notNull(),
      email: text("email"),
      phone: text("phone").notNull(),
      address: text("address").notNull(),
      city: text("city").notNull(),
      state: text("state").notNull(),
      zipCode: text("zip_code").notNull(),
      licensure: text("licensure").notNull(),
      specialty: text("specialty"),
      insurance: text("insurance"),
      practiceType: text("practice_type"),
      acceptingPatients: boolean("accepting_patients"),
      acceptsUninsured: boolean("accepts_uninsured"),
      yearsOfExperience: integer("years_of_experience"),
      rating: numeric("rating", { precision: 3, scale: 2 }),
      bio: text("bio"),
      website: text("website"),
      createdAt: timestamp("created_at"),
      updatedAt: timestamp("updated_at")
    });
    userTherapists = pgTable("user_therapists", {
      id: uuid("id").primaryKey(),
      userId: text("user_id").notNull(),
      // Changed from uuid to text for user compatibility
      therapistName: text("therapist_name").notNull(),
      contactMethod: text("contact_method").notNull(),
      contactValue: text("contact_value").notNull(),
      notes: text("notes"),
      shareReport: boolean("share_report").default(true),
      isActive: boolean("is_active").default(true),
      createdAt: timestamp("created_at"),
      updatedAt: timestamp("updated_at")
    });
    therapistPatientConnections = pgTable("therapist_patient_connections", {
      id: uuid("id").primaryKey(),
      patientId: uuid("patient_id").notNull(),
      therapistEmail: text("therapist_email").notNull(),
      patientEmail: text("patient_email").notNull(),
      patientCode: text("patient_code").notNull(),
      patientConsentGiven: boolean("patient_consent_given").default(false),
      therapistAccepted: boolean("therapist_accepted").default(false),
      connectionRequestDate: timestamp("connection_request_date"),
      connectionAcceptedDate: timestamp("connection_accepted_date"),
      shareAnalytics: boolean("share_analytics").default(false),
      shareReports: boolean("share_reports").default(false),
      isActive: boolean("is_active").default(true),
      notes: text("notes"),
      createdAt: timestamp("created_at"),
      updatedAt: timestamp("updated_at")
    });
    userGoals = pgTable("user_goals", {
      id: uuid("id").primaryKey(),
      userId: text("user_id").notNull(),
      // Changed from uuid to text for user compatibility
      title: text("title").notNull(),
      description: text("description"),
      category: text("category").notNull(),
      frequency: text("frequency").notNull(),
      targetValue: numeric("target_value"),
      unit: text("unit"),
      startDate: text("start_date").notNull(),
      endDate: text("end_date"),
      isActive: boolean("is_active").default(true),
      source: text("source"),
      createdAt: timestamp("created_at"),
      updatedAt: timestamp("updated_at")
    });
    goalProgress = pgTable("goal_progress", {
      id: uuid("id").primaryKey(),
      userId: text("user_id").notNull(),
      // Changed from uuid to text for user compatibility
      goalId: uuid("goal_id").notNull(),
      score: integer("score").notNull(),
      notes: text("notes"),
      recordedAt: text("recorded_at").notNull(),
      createdAt: timestamp("created_at")
    });
    interventionSummaries = pgTable("intervention_summaries", {
      id: uuid("id").primaryKey(),
      userId: text("user_id").notNull(),
      // Changed from uuid to text for user compatibility
      weekStart: text("week_start").notNull(),
      weekEnd: text("week_end").notNull(),
      interventionType: text("intervention_type").default("cbt"),
      conversationCount: integer("conversation_count").default(0),
      keyPoints: text("key_points"),
      createdAt: timestamp("created_at"),
      updatedAt: timestamp("updated_at")
    });
    treatmentPlans = pgTable("treatment_plans", {
      id: uuid("id").primaryKey(),
      patientId: text("patient_id").notNull().unique(),
      plan: text("plan").notNull(),
      createdAt: timestamp("created_at"),
      updatedAt: timestamp("updated_at")
    });
    appointments = pgTable("appointments", {
      id: uuid("id").primaryKey(),
      patientId: text("patient_id").notNull(),
      therapistEmail: text("therapist_email").notNull(),
      scheduledAt: text("scheduled_at").notNull(),
      // ISO date string
      duration: integer("duration").default(60),
      // minutes
      type: text("type").default("video"),
      // 'video', 'audio', or 'in_person'
      status: text("status").default("scheduled"),
      // 'scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled'
      roomId: text("room_id"),
      // WebRTC room ID for the call
      startedAt: text("started_at"),
      // When call actually started
      endedAt: text("ended_at"),
      // When call ended
      recordingUrl: text("recording_url"),
      // URL to stored recording (HIPAA compliant)
      transcript: text("transcript"),
      // Full transcript of the session
      actualDuration: integer("actual_duration"),
      // Actual call duration in minutes
      notes: text("notes"),
      // Patient's notes about the appointment
      cancellationReason: text("cancellation_reason"),
      meetingLink: text("meeting_link"),
      // Optional external meeting link (Zoom, Google Meet, etc.)
      createdAt: text("created_at"),
      updatedAt: text("updated_at")
    });
    emailQueue = pgTable("email_queue", {
      id: uuid("id").primaryKey(),
      toEmail: text("to_email").notNull(),
      fromEmail: text("from_email").default("info@tranquiloo-app.com"),
      subject: text("subject").notNull(),
      body: text("body"),
      // Add body field for email content
      htmlContent: text("html_content").notNull(),
      textContent: text("text_content"),
      emailType: text("email_type").notNull(),
      // 'email_verification', 'password_reset', 'connection_request', 'app_recommendation', etc.
      status: text("status").default("pending"),
      // 'pending', 'sent', 'failed'
      metadata: text("metadata"),
      // JSON string for additional data
      sentAt: timestamp("sent_at"),
      createdAt: timestamp("created_at")
    });
    insertProfileSchema = createInsertSchema(profiles).omit({
      id: true,
      createdAt: true,
      updatedAt: true
    });
    insertChatSessionSchema = createInsertSchema(chatSessions).omit({
      id: true,
      createdAt: true,
      updatedAt: true
    });
    insertChatMessageSchema = createInsertSchema(chatMessages).omit({
      id: true,
      createdAt: true
    });
    insertAnxietyAnalysisSchema = createInsertSchema(anxietyAnalyses).omit({
      id: true,
      createdAt: true
    });
    insertTherapistSchema = createInsertSchema(therapists).omit({
      id: true,
      createdAt: true,
      updatedAt: true
    });
    insertUserTherapistSchema = createInsertSchema(userTherapists).omit({
      id: true,
      createdAt: true,
      updatedAt: true
    });
    insertUserGoalSchema = createInsertSchema(userGoals).omit({
      id: true,
      createdAt: true,
      updatedAt: true
    });
    insertTherapistPatientConnectionSchema = createInsertSchema(therapistPatientConnections).omit({
      id: true,
      createdAt: true,
      updatedAt: true
    });
    insertGoalProgressSchema = createInsertSchema(goalProgress).omit({
      id: true,
      createdAt: true
    });
    insertAppointmentSchema = createInsertSchema(appointments).omit({
      id: true,
      createdAt: true,
      updatedAt: true
    });
    insertInterventionSummarySchema = createInsertSchema(interventionSummaries).omit({
      id: true,
      createdAt: true,
      updatedAt: true
    });
    normalizeInterventionSummary = (s) => {
      const toArray = (v) => {
        if (Array.isArray(v)) return v.filter(Boolean).map(String);
        if (typeof v === "string" && v.trim().length) {
          try {
            const parsed = JSON.parse(v);
            if (Array.isArray(parsed)) {
              return parsed.filter(Boolean).map(String);
            }
          } catch {
          }
          if (v.startsWith("{") && v.endsWith("}")) {
            return v.slice(1, -1).split('","').map((t) => t.replace(/^"|"$/g, "").trim()).filter(Boolean);
          }
          return v.split(",").map((t) => t.trim()).filter(Boolean);
        }
        return [];
      };
      const id = String(
        s.id ?? `${s.userId ?? s.user_id ?? "u"}-${s.weekStart ?? s.week_start ?? Date.now()}`
      );
      const week_start = s.weekStart ?? s.week_start ?? s.week ?? // some backends use week
      (/* @__PURE__ */ new Date()).toISOString();
      const week_end = s.weekEnd ?? s.week_end ?? week_start;
      const intervention_type = String(
        s.interventionType ?? s.intervention_type ?? s.type ?? "unknown"
      ).replace(/[\s-]+/g, "_").toLowerCase();
      const conversation_count = Number(s.conversationCount ?? s.conversation_count ?? 0);
      return {
        id,
        user_id: String(s.user_id ?? s.userId ?? "unknown"),
        week_start,
        week_end,
        intervention_type,
        conversation_count,
        key_points: toArray(s.key_points ?? s.keyPoints),
        recommendations: toArray(s.recommendations),
        limitations: toArray(s.limitations ?? s.limitation_points),
        created_at: s.created_at ?? s.createdAt
      };
    };
  }
});

// server/db.ts
import dotenv from "dotenv";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
var connectionString, client, db2;
var init_db = __esm({
  "server/db.ts"() {
    "use strict";
    init_schema();
    dotenv.config();
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
    connectionString = process.env.DATABASE_URL || `postgresql://postgres.przforeyoxweawyfrxws:${process.env.SUPABASE_DB_PASSWORD}@aws-0-us-east-1.pooler.supabase.com:6543/postgres`;
    console.log("[DB] Connecting to Supabase PostgreSQL...");
    client = postgres(connectionString, {
      prepare: false,
      ssl: false
    });
    db2 = drizzle(client, { schema: schema_exports });
  }
});

// server/storage.ts
import { eq, and, desc, gt, sql } from "drizzle-orm";
import { randomUUID } from "crypto";
var logTreatmentPlanDebug, TREATMENT_PLAN_GOAL_SOURCE, DatabaseStorage, storage;
var init_storage = __esm({
  "server/storage.ts"() {
    "use strict";
    init_schema();
    init_db();
    logTreatmentPlanDebug = (...args) => {
      console.log("[TreatmentPlan::Storage]", ...args);
    };
    TREATMENT_PLAN_GOAL_SOURCE = "treatment-plan";
    DatabaseStorage = class {
      // Profile management
      async getProfile(id) {
        const result = await db2.select().from(profiles).where(eq(profiles.id, id)).limit(1);
        return result[0];
      }
      async getProfileByEmail(email) {
        const result = await db2.select().from(profiles).where(eq(profiles.email, email)).limit(1);
        return result[0];
      }
      async createProfile(profile) {
        const now = Date.now();
        const profileRecord = {
          ...profile,
          id: profile.id ?? randomUUID(),
          createdAt: profile.createdAt ?? now,
          updatedAt: profile.updatedAt ?? now
        };
        await db2.insert(profiles).values(profileRecord);
        const result = await db2.select().from(profiles).where(eq(profiles.email, profile.email)).limit(1);
        return result[0];
      }
      async updateProfile(id, profile) {
        await db2.update(profiles).set({
          ...profile,
          updatedAt: Date.now()
        }).where(eq(profiles.id, id));
        const result = await db2.select().from(profiles).where(eq(profiles.id, id)).limit(1);
        return result[0];
      }
      // Chat sessions
      async getChatSession(id) {
        const result = await db2.select().from(chatSessions).where(eq(chatSessions.id, id)).limit(1);
        return result[0];
      }
      async getChatSessionsByUser(userId) {
        return await db2.select().from(chatSessions).where(eq(chatSessions.userId, userId));
      }
      async getAllChatSessions() {
        return await db2.select().from(chatSessions).orderBy(desc(chatSessions.updatedAt));
      }
      async createChatSession(session) {
        const now = Date.now();
        const sessionId = session?.id ?? randomUUID();
        await db2.insert(chatSessions).values({
          ...session,
          id: sessionId,
          createdAt: session?.createdAt ?? now,
          updatedAt: session?.updatedAt ?? now
        });
        const result = await db2.select().from(chatSessions).where(eq(chatSessions.id, sessionId)).limit(1);
        return result[0];
      }
      async updateChatSession(id, session) {
        await db2.update(chatSessions).set({
          ...session,
          updatedAt: Date.now()
        }).where(eq(chatSessions.id, id));
        const result = await db2.select().from(chatSessions).where(eq(chatSessions.id, id)).limit(1);
        return result[0];
      }
      // Chat messages
      async getChatMessage(id) {
        const result = await db2.select().from(chatMessages).where(eq(chatMessages.id, id)).limit(1);
        return result[0];
      }
      async getChatMessagesBySession(sessionId) {
        const messages = await db2.select().from(chatMessages).where(eq(chatMessages.sessionId, sessionId)).orderBy(chatMessages.createdAt);
        const uniqueMessages = messages.filter((msg, index, arr) => {
          const duplicateIndex = arr.findIndex(
            (m) => m.content === msg.content && m.sender === msg.sender && m.sessionId === msg.sessionId
          );
          return duplicateIndex === index;
        });
        return uniqueMessages;
      }
      // Get raw messages without deduplication for duplicate checking
      async getRawChatMessagesBySession(sessionId) {
        return await db2.select().from(chatMessages).where(eq(chatMessages.sessionId, sessionId)).orderBy(chatMessages.createdAt);
      }
      async getChatMessagesByUser(userId) {
        const result = await db2.select({
          id: chatMessages.id,
          sessionId: chatMessages.sessionId,
          userId: chatMessages.userId,
          content: chatMessages.content,
          sender: chatMessages.sender,
          createdAt: chatMessages.createdAt
        }).from(chatMessages).innerJoin(chatSessions, eq(chatMessages.sessionId, chatSessions.id)).where(eq(chatSessions.userId, userId)).orderBy(chatMessages.createdAt);
        return result;
      }
      async createChatMessage(message) {
        const messageId = message?.id ?? randomUUID();
        const createdAt = message?.createdAt ?? Date.now();
        await db2.insert(chatMessages).values({
          ...message,
          id: messageId,
          createdAt
        });
        const result = await db2.select().from(chatMessages).where(eq(chatMessages.id, messageId)).limit(1);
        return result[0];
      }
      // Anxiety analyses
      async getAnxietyAnalysis(id) {
        const result = await db2.select().from(anxietyAnalyses).where(eq(anxietyAnalyses.id, id)).limit(1);
        return result[0];
      }
      async getAnxietyAnalysesByUser(userId) {
        return await db2.select().from(anxietyAnalyses).where(eq(anxietyAnalyses.userId, userId));
      }
      async getAllAnxietyAnalyses() {
        return await db2.select().from(anxietyAnalyses).orderBy(desc(anxietyAnalyses.createdAt));
      }
      async createAnxietyAnalysis(analysis) {
        const analysisId = analysis?.id ?? randomUUID();
        const createdAt = analysis?.createdAt ?? Date.now();
        await db2.insert(anxietyAnalyses).values({
          ...analysis,
          id: analysisId,
          createdAt
        });
        const result = await db2.select().from(anxietyAnalyses).where(eq(anxietyAnalyses.id, analysisId)).limit(1);
        return result[0];
      }
      // Therapists
      async getTherapist(id) {
        const result = await db2.select().from(therapists).where(eq(therapists.id, id)).limit(1);
        return result[0];
      }
      async getTherapistsByLocation(city, state) {
        return await db2.select().from(therapists).where(
          and(eq(therapists.city, city), eq(therapists.state, state))
        );
      }
      async getTherapistsBySpecialty(specialty) {
        return await db2.select().from(therapists);
      }
      async createTherapist(therapist) {
        const now = Date.now();
        const result = await db2.insert(therapists).values({
          ...therapist,
          id: therapist?.id ?? randomUUID(),
          createdAt: therapist?.createdAt ?? now,
          updatedAt: therapist?.updatedAt ?? now
        }).returning();
        return result[0];
      }
      async updateTherapist(id, therapist) {
        const result = await db2.update(therapists).set({
          ...therapist,
          updatedAt: Date.now()
        }).where(eq(therapists.id, id)).returning();
        return result[0];
      }
      // User therapists
      async getUserTherapistsByUser(userId) {
        return await db2.select().from(userTherapists).where(eq(userTherapists.userId, userId));
      }
      async createUserTherapist(userTherapist) {
        const now = Date.now();
        const result = await db2.insert(userTherapists).values({
          ...userTherapist,
          id: userTherapist?.id ?? randomUUID(),
          createdAt: userTherapist?.createdAt ?? now,
          updatedAt: userTherapist?.updatedAt ?? now
        }).returning();
        return result[0];
      }
      async updateUserTherapist(id, userTherapist) {
        const result = await db2.update(userTherapists).set({
          ...userTherapist,
          updatedAt: Date.now()
        }).where(eq(userTherapists.id, id)).returning();
        return result[0];
      }
      // User goals
      async getUserGoal(id) {
        const result = await db2.select().from(userGoals).where(eq(userGoals.id, id)).limit(1);
        return result[0];
      }
      async getUserGoalsByUser(userId) {
        const goals = await db2.select().from(userGoals).where(eq(userGoals.userId, userId));
        for (const goal of goals) {
          if (!goal.id) {
            const generatedId = randomUUID();
            await db2.update(userGoals).set({ id: generatedId, updatedAt: Date.now() }).where(
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
      async createUserGoal(goal) {
        const now = Date.now();
        const goalId = goal?.id ?? randomUUID();
        const result = await db2.insert(userGoals).values({
          ...goal,
          id: goalId,
          createdAt: goal?.createdAt ?? now,
          updatedAt: goal?.updatedAt ?? now
        }).returning();
        return result[0];
      }
      async updateUserGoal(id, goal) {
        const result = await db2.update(userGoals).set({
          ...goal,
          updatedAt: Date.now()
        }).where(eq(userGoals.id, id)).returning();
        return result[0];
      }
      async deleteUserGoal(id) {
        await db2.delete(userGoals).where(eq(userGoals.id, id));
      }
      // Goal progress
      async getGoalProgressByGoal(goalId) {
        return await db2.select().from(goalProgress).where(eq(goalProgress.goalId, goalId));
      }
      async createGoalProgress(progress) {
        const result = await db2.insert(goalProgress).values({
          ...progress,
          id: progress?.id ?? randomUUID(),
          createdAt: progress?.createdAt ?? Date.now()
        }).returning();
        return result[0];
      }
      // Intervention summaries
      async getInterventionSummariesByUser(userId) {
        const raw = await db2.select().from(interventionSummaries).where(eq(interventionSummaries.userId, userId));
        const { normalizeInterventionSummary: normalizeInterventionSummary2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
        return raw.map(normalizeInterventionSummary2);
      }
      async createInterventionSummary(summary) {
        const now = Date.now();
        const result = await db2.insert(interventionSummaries).values({
          ...summary,
          id: summary?.id ?? randomUUID(),
          createdAt: summary?.createdAt ?? now,
          updatedAt: summary?.updatedAt ?? now
        }).returning();
        return result[0];
      }
      async updateInterventionSummary(id, summary) {
        const result = await db2.update(interventionSummaries).set({
          ...summary,
          updatedAt: Date.now()
        }).where(eq(interventionSummaries.id, id)).returning();
        return result[0];
      }
      async getTreatmentPlanByPatient(patientId) {
        logTreatmentPlanDebug("Fetching treatment plan for patient", patientId);
        const result = await db2.select().from(treatmentPlans).where(eq(treatmentPlans.patientId, patientId)).limit(1);
        const row = result[0];
        if (!row) {
          logTreatmentPlanDebug("No plan found for patient", patientId);
          return void 0;
        }
        let parsedPlan = null;
        try {
          parsedPlan = row.plan ? JSON.parse(row.plan) : null;
        } catch (error) {
          console.error("Failed to parse treatment plan JSON for patient", patientId, error);
        }
        logTreatmentPlanDebug("Loaded plan for patient", patientId, "goals:", Array.isArray(parsedPlan?.goals) ? parsedPlan.goals.length : "n/a", "sessionNotes:", Array.isArray(parsedPlan?.sessionNotes) ? parsedPlan.sessionNotes.length : "n/a");
        return {
          plan: parsedPlan,
          updatedAt: row.updatedAt ?? row.createdAt ?? Date.now()
        };
      }
      async upsertTreatmentPlan(patientId, plan) {
        const planJson = JSON.stringify(plan);
        const timestamp2 = Date.now();
        logTreatmentPlanDebug("Saving plan for patient", patientId, "goals:", Array.isArray(plan?.goals) ? plan.goals.length : "n/a", "sessionNotes:", Array.isArray(plan?.sessionNotes) ? plan.sessionNotes.length : "n/a");
        const existing = await db2.select().from(treatmentPlans).where(eq(treatmentPlans.patientId, patientId)).limit(1);
        if (existing[0]) {
          await db2.update(treatmentPlans).set({ plan: planJson, updatedAt: timestamp2 }).where(eq(treatmentPlans.patientId, patientId));
          logTreatmentPlanDebug("Updated existing plan for patient", patientId);
        } else {
          await db2.insert(treatmentPlans).values({ id: randomUUID(), patientId, plan: planJson, createdAt: timestamp2, updatedAt: timestamp2 });
          logTreatmentPlanDebug("Inserted new plan for patient", patientId);
        }
        return { plan, updatedAt: timestamp2 };
      }
      async syncTreatmentPlanGoals(patientId, plan) {
        const goalsArray = Array.isArray(plan?.goals) ? plan.goals : [];
        const timestamp2 = Date.now();
        await db2.delete(userGoals).where(
          and(eq(userGoals.userId, patientId), eq(userGoals.source, TREATMENT_PLAN_GOAL_SOURCE))
        );
        for (const goal of goalsArray) {
          const goalId = goal?.id ?? randomUUID();
          const title = goal?.title ?? "Therapy Goal";
          const description = goal?.description ?? "";
          const category = (goal?.category ?? "treatment").toString();
          const priority = goal?.priority ?? "medium";
          const frequency = (goal?.frequency ?? "weekly").toString();
          const notes = goal?.therapistNotes ?? "";
          const milestones = Array.isArray(goal?.milestones) ? JSON.stringify(goal.milestones) : JSON.stringify([]);
          const baseTargetValue = goal?.targetValue ?? goal?.target_value;
          const targetValue = baseTargetValue !== void 0 && baseTargetValue !== null ? String(baseTargetValue) : "";
          const unit = goal?.unit ?? "";
          const startDate = goal?.startDate ?? new Date(timestamp2).toISOString().split("T")[0];
          const endDate = goal?.targetDate ?? goal?.endDate ?? null;
          await db2.insert(userGoals).values({
            id: goalId,
            userId: patientId,
            title,
            description,
            category,
            priority,
            status: "active",
            createdAt: timestamp2,
            updatedAt: timestamp2,
            frequency,
            notes,
            milestones,
            targetValue,
            unit,
            startDate,
            endDate,
            isActive: true,
            source: TREATMENT_PLAN_GOAL_SOURCE
          });
        }
        logTreatmentPlanDebug("Synced treatment goals to user_goals for patient", patientId, "count:", goalsArray.length);
      }
      // Therapist connections
      async createTherapistConnection(connection) {
        const result = await db2.insert(userTherapists).values({
          userId: connection.userId,
          therapistName: connection.therapistName,
          contactMethod: "email",
          // Default to email since contactValue appears to be email
          contactValue: connection.contactValue,
          notes: connection.notes,
          shareReport: connection.shareReport,
          id: randomUUID(),
          createdAt: Date.now(),
          updatedAt: Date.now()
        }).returning();
        return result[0];
      }
      // HIPAA-compliant connection management
      async createTherapistPatientConnection(connection) {
        const connectionId = connection?.id ?? randomUUID();
        const now = Date.now();
        await db2.insert(therapistPatientConnections).values({
          ...connection,
          id: connectionId,
          connectionRequestDate: connection?.connectionRequestDate ?? now,
          createdAt: connection?.createdAt ?? now,
          updatedAt: connection?.updatedAt ?? now
        });
        const result = await db2.select().from(therapistPatientConnections).where(eq(therapistPatientConnections.id, connectionId)).limit(1);
        return result[0];
      }
      async getTherapistPatientConnections(therapistEmail) {
        return await db2.select().from(therapistPatientConnections).where(and(
          eq(therapistPatientConnections.therapistEmail, therapistEmail),
          eq(therapistPatientConnections.isActive, true),
          eq(therapistPatientConnections.patientConsentGiven, true),
          eq(therapistPatientConnections.therapistAccepted, true)
        ));
      }
      async getPatientTherapistConnections(patientId) {
        return await db2.select().from(therapistPatientConnections).where(and(
          eq(therapistPatientConnections.patientId, patientId),
          eq(therapistPatientConnections.isActive, true),
          eq(therapistPatientConnections.patientConsentGiven, true),
          eq(therapistPatientConnections.therapistAccepted, true)
        ));
      }
      async acceptTherapistConnection(connectionId, therapistEmail) {
        await db2.update(therapistPatientConnections).set({
          therapistAccepted: true,
          connectionAcceptedDate: Date.now(),
          updatedAt: Date.now()
        }).where(and(
          eq(therapistPatientConnections.id, connectionId),
          eq(therapistPatientConnections.therapistEmail, therapistEmail)
        ));
        const result = await db2.select().from(therapistPatientConnections).where(eq(therapistPatientConnections.id, connectionId)).limit(1);
        return result[0];
      }
      async getTherapistPatientConnection(connectionId) {
        const result = await db2.select().from(therapistPatientConnections).where(eq(therapistPatientConnections.id, connectionId)).limit(1);
        return result[0];
      }
      async updateTherapistPatientConnection(connectionId, updates) {
        await db2.update(therapistPatientConnections).set({
          ...updates,
          updatedAt: Date.now()
        }).where(eq(therapistPatientConnections.id, connectionId));
      }
      // Email queue
      async createEmailNotification(email) {
        const emailId = randomUUID();
        await db2.insert(emailQueue).values({
          id: emailId,
          toEmail: email.toEmail,
          fromEmail: "info@tranquiloo-app.com",
          // Use verified sender
          subject: email.subject,
          body: email.htmlContent,
          // Add body field for SQLite
          htmlContent: email.htmlContent,
          textContent: email.htmlContent.replace(/<[^>]*>/g, ""),
          // Strip HTML for text version
          emailType: email.emailType,
          metadata: email.metadata || null,
          createdAt: Date.now()
        });
        const result = await db2.select().from(emailQueue).where(eq(emailQueue.id, emailId)).limit(1);
        return result[0];
      }
      async getEmailNotificationsByTherapist(therapistEmail) {
        return await db2.select().from(emailQueue).where(and(
          eq(emailQueue.toEmail, therapistEmail),
          eq(emailQueue.status, "sent")
        )).orderBy(desc(emailQueue.createdAt));
      }
      async updateEmailNotificationStatus(connectionId, status) {
        await db2.update(emailQueue).set({ status }).where(sql`json_extract(metadata, '$.connectionId') = ${connectionId}`);
      }
      // Email verification methods
      async updateProfileVerification(id, token, verified) {
        const updateData = {
          emailVerificationToken: token,
          updatedAt: Date.now()
        };
        if (verified !== void 0) {
          updateData.emailVerified = verified;
        }
        await db2.update(profiles).set(updateData).where(eq(profiles.id, id));
        const result = await db2.select().from(profiles).where(eq(profiles.id, id)).limit(1);
        return result[0];
      }
      async verifyEmail(token) {
        const profileToVerify = await db2.select().from(profiles).where(eq(profiles.emailVerificationToken, token)).limit(1);
        if (!profileToVerify[0]) {
          return void 0;
        }
        await db2.update(profiles).set({
          emailVerified: true,
          emailVerificationToken: null,
          updatedAt: Date.now()
        }).where(eq(profiles.id, profileToVerify[0].id));
        const result = await db2.select().from(profiles).where(eq(profiles.id, profileToVerify[0].id)).limit(1);
        return result[0];
      }
      async createEmailVerification(email, token) {
        await db2.update(profiles).set({
          emailVerificationToken: token,
          updatedAt: Date.now()
        }).where(eq(profiles.email, email));
      }
      async verifyEmailByAddress(email) {
        const result = await db2.update(profiles).set({
          emailVerified: true,
          emailVerificationToken: null,
          updatedAt: Date.now()
        }).where(eq(profiles.email, email)).returning();
        return result[0];
      }
      async setPasswordResetToken(email, token, expires) {
        const result = await db2.update(profiles).set({
          passwordResetToken: token,
          passwordResetExpires: expires.getTime(),
          updatedAt: Date.now()
        }).where(eq(profiles.email, email)).returning();
        return result[0];
      }
      async resetPassword(token, newPassword) {
        const now = Date.now();
        const existing = await db2.select().from(profiles).where(and(eq(profiles.passwordResetToken, token), gt(profiles.passwordResetExpires, now))).limit(1);
        const profile = existing[0];
        if (!profile) return void 0;
        const bcrypt2 = await import("bcryptjs");
        const hashedPassword = await bcrypt2.hash(newPassword, 10);
        const result = await db2.update(profiles).set({
          hashedPassword,
          passwordResetToken: null,
          passwordResetExpires: null,
          updatedAt: Date.now()
        }).where(eq(profiles.id, profile.id)).returning();
        return result[0];
      }
      // License management
      async updateProfileLicenseInfo(id, licenseNumber, licenseState, graceDeadline) {
        await db2.update(profiles).set({
          licenseNumber,
          licenseState,
          licenseGraceDeadline: graceDeadline ? graceDeadline.getTime() : null,
          updatedAt: Date.now()
        }).where(eq(profiles.id, id));
      }
      // Email queue management methods
      async getPendingEmails() {
        return await db2.select().from(emailQueue).where(eq(emailQueue.status, "pending")).orderBy(emailQueue.createdAt);
      }
      async updateEmailStatus(emailId, status) {
        await db2.update(emailQueue).set({
          status,
          sentAt: status === "sent" ? Date.now() : null
        }).where(eq(emailQueue.id, emailId));
      }
    };
    storage = new DatabaseStorage();
  }
});

// server/emailService.ts
var emailService_exports = {};
__export(emailService_exports, {
  emailService: () => emailService
});
import { MailService } from "@sendgrid/mail";
var EmailService, emailService;
var init_emailService = __esm({
  "server/emailService.ts"() {
    "use strict";
    init_storage();
    EmailService = class {
      constructor() {
        if (!process.env.SENDGRID_API_KEY) {
          console.warn("\u26A0\uFE0F SENDGRID_API_KEY not found - emails will be logged to console instead of sent");
          this.mailService = null;
          return;
        }
        if (!process.env.SENDGRID_API_KEY.startsWith("SG.")) {
          console.error('\u26A0\uFE0F SendGrid API key should start with "SG." - current key starts with:', process.env.SENDGRID_API_KEY.substring(0, 3));
          console.log("To get correct SendGrid API key:");
          console.log("1. Go to https://app.sendgrid.com/settings/api_keys");
          console.log("2. Create API Key \u2192 Restricted Access");
          console.log('3. Enable only "Mail Send" permission');
          console.log('4. The key will start with "SG." followed by long string');
          this.mailService = null;
          return;
        }
        this.mailService = new MailService();
        this.mailService.setApiKey(process.env.SENDGRID_API_KEY);
        console.log("\u2705 SendGrid API key configured successfully");
      }
      async sendEmail(email) {
        if (!this.mailService) {
          console.log("\n\u{1F4E7} EMAIL WOULD BE SENT:");
          console.log("To:", email.to);
          console.log("From:", email.from);
          console.log("Subject:", email.subject);
          console.log("HTML Content:", email.html?.substring(0, 200) + "...");
          console.log("\u2705 Email simulated successfully (SendGrid not configured)\n");
          return true;
        }
        try {
          console.log("Sending email with HTML length:", email.html?.length);
          if (!email.html && !email.text) {
            console.error("\u274C No content to send in email (both html and text are empty)");
            return false;
          }
          await this.mailService.send({
            to: email.to,
            from: email.from,
            subject: email.subject,
            text: email.text || "Please enable HTML to view this email.",
            html: email.html || email.text || ""
          });
          console.log("\u2705 Real email sent via SendGrid to:", email.to);
          return true;
        } catch (error) {
          console.error("SendGrid email error:", error.response?.body || error.message);
          if (error.code === 401) {
            console.error('\u274C Unauthorized: Check your SendGrid API key. It should start with "SG." and have proper permissions');
          }
          const errorBody = error.response?.body;
          if (errorBody?.errors?.[0]?.field === "from") {
            console.error("\u274C URGENT: SINGLE SENDER VERIFICATION REQUIRED");
            console.error("   Domain authentication is NOT enough!");
            console.error("   Go to SendGrid \u2192 Settings \u2192 Sender Authentication \u2192 Single Sender Verification");
            console.error("   Add and verify your personal email address (like Gmail)");
            console.error("   This is different from domain authentication - you need BOTH");
            console.error("   Current from address that failed:", email.from);
          }
          return false;
        }
      }
      async processEmailQueue() {
        try {
          const pendingEmails = await storage.getPendingEmails();
          for (const email of pendingEmails) {
            console.log(`Processing email: ${email.emailType} to ${email.toEmail}`);
            let cleanHtml = email.htmlContent;
            if (cleanHtml) {
              cleanHtml = cleanHtml.replace(/""/g, '"');
              if (cleanHtml.startsWith('"') && cleanHtml.endsWith('"')) {
                cleanHtml = cleanHtml.slice(1, -1);
              }
              cleanHtml = cleanHtml.trim();
              console.log("Cleaning HTML - before length:", email.htmlContent?.length, "after:", cleanHtml?.length);
            }
            const success = await this.sendEmail({
              to: email.toEmail,
              from: email.fromEmail || "info@tranquiloo-app.com",
              subject: email.subject,
              html: cleanHtml,
              text: email.textContent || ""
            });
            await storage.updateEmailStatus(email.id, success ? "sent" : "failed");
            if (success) {
              console.log(`\u2705 Email sent successfully to ${email.toEmail}`);
            } else {
              console.error(`\u274C Failed to send email to ${email.toEmail}`);
            }
          }
        } catch (error) {
          console.error("Error processing email queue:", error);
        }
      }
      // Process emails every 30 seconds
      startEmailProcessor() {
        setInterval(() => {
          this.processEmailQueue();
        }, 3e4);
        this.processEmailQueue();
      }
      // Send verification email for patients
      async sendVerificationEmail(email, firstName, token) {
        try {
          const host = process.env.REPLIT_DOMAINS || process.env.REPLIT_DEV_DOMAIN || "localhost:5000";
          const protocol = host.includes("replit.dev") ? "https" : "http";
          console.log("Email verification URL will use:", protocol + "://" + host);
          const verificationUrl = `${protocol}://${host}/verify-email?token=${token}`;
          const subject = "Please verify your email - Tranquil Support";
          const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #10b981; margin: 0;">Welcome to Tranquil Support</h1>
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
              <small>This email was sent to ${email}. If you didn't create this account, 
              please ignore this email.</small>
            </p>
          </div>
        </div>
      `;
          const text2 = `Welcome to Tranquil Support!
      
Please verify your email address to complete your account setup.

Click this link to verify: ${verificationUrl}

What's next:
- Complete your profile setup
- Start tracking your anxiety and mood
- Connect with AI companions for support
- Access therapeutic resources and tools

This email was sent to ${email}. If you didn't create this account, please ignore this email.`;
          await storage.createEmailNotification({
            toEmail: email,
            emailType: "email_verification",
            subject,
            htmlContent: html,
            metadata: JSON.stringify({ firstName, verificationToken: token })
          });
          return { success: true };
        } catch (error) {
          console.error("Error creating verification email:", error);
          return { success: false };
        }
      }
      // Send welcome email to therapists with license verification notice
      async sendTherapistVerificationEmail(email, firstName, token, verificationUrl) {
        try {
          const subject = "Verify Your Therapist Account - Tranquiloo";
          const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #059669; margin: 0;">Welcome to Tranquiloo, ${firstName}!</h1>
            <p style="color: #6b7280; font-size: 16px;">Your professional mental health platform</p>
          </div>
          
          <div style="background: #f0fdf4; padding: 25px; border-radius: 8px; margin-bottom: 25px; border-left: 4px solid #059669;">
            <h2 style="color: #065f46; margin-top: 0;">Please verify your email address</h2>
            <p style="color: #065f46; line-height: 1.6;">
              Thank you for joining our professional network. To ensure the security of your therapist account 
              and enable access to patient data, please verify your email address by clicking the button below.
            </p>
            
            <div style="text-align: center; margin: 25px 0;">
              <a href="${verificationUrl}" 
                 style="display: inline-block; background: #059669; color: white; padding: 12px 30px; 
                        text-decoration: none; border-radius: 6px; font-weight: 600;">
                Verify Email & Access Dashboard
              </a>
            </div>
            
            <p style="color: #065f46; font-size: 14px;">
              If the button doesn't work, copy and paste this link into your browser:<br>
              <span style="word-break: break-all; background: #ecfdf5; padding: 2px 4px; border-radius: 3px;">${verificationUrl}</span>
            </p>
          </div>
          
          <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
            <h3 style="color: #374151; margin-top: 0;">After verification, you can:</h3>
            <ul style="color: #6b7280; line-height: 1.6;">
              <li>Access your professional therapist dashboard</li>
              <li>Connect with patients using their patient codes</li>
              <li>View HIPAA-compliant patient analytics and reports</li>
              <li>Create and manage treatment plans</li>
              <li>Manage your practice and patient connections</li>
            </ul>
            
            <div style="background: #dbeafe; padding: 15px; border-radius: 6px; margin-top: 15px;">
              <p style="margin: 0; color: #1e40af; font-size: 14px;">
                <strong>Professional License Verification:</strong> We'll verify your license in the background after account activation. 
                You'll have full access while we complete this process.
              </p>
            </div>
          </div>
          
          <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; color: #6b7280; font-size: 12px;">
            <p>This email was sent to ${email}. If you didn't create this account, please contact support immediately.</p>
            <p>For questions about therapist accounts, reach out to our professional support team.</p>
          </div>
        </div>
      `;
          const text2 = `Welcome to Tranquiloo, ${firstName}!

Please verify your therapist account email address.

Thank you for joining our professional network. To ensure the security of your therapist account and enable access to patient data, please verify your email address.

Verification link: ${verificationUrl}

After verification, you can:
- Access your professional therapist dashboard
- Connect with patients using their patient codes
- View HIPAA-compliant patient analytics and reports
- Create and manage treatment plans
- Manage your practice and patient connections

Professional License Verification: We'll verify your license in the background after account activation. You'll have full access while we complete this process.

This email was sent to ${email}. If you didn't create this account, please contact support immediately.`;
          await storage.createEmailNotification({
            toEmail: email,
            emailType: "therapist_welcome",
            subject,
            htmlContent: html,
            metadata: JSON.stringify({ firstName, token })
          });
          return { success: true };
        } catch (error) {
          console.error("Error creating therapist welcome email:", error);
          return { success: false };
        }
      }
      async sendTherapistWelcomeEmail(email, firstName, token) {
        const verificationUrl = `${process.env.REPLIT_URL || "http://localhost:5000"}/verify-email?token=${token}`;
        const subject = "Welcome to Tranquiloo - Verify your email";
        const html = `<p>Hello ${firstName},</p><p>Please verify your therapist account by clicking <a href="${verificationUrl}">here</a>.</p>`;
        const success = await this.sendEmail({
          to: email,
          from: "info@tranquiloo-app.com",
          subject,
          html
        });
        return { success };
      }
    };
    emailService = new EmailService();
  }
});

// api/index.ts
import serverless from "serverless-http";

// server/index.ts
import dotenv2 from "dotenv";
import cors from "cors";

// server/routes/chat.ts
import { Router } from "express";
import Database from "better-sqlite3";
var router = Router();
var db = new Database("database.sqlite", { fileMustExist: false });
router.get("/history", (req, res) => {
  try {
    db.prepare(`
      CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT,
        content TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `).run();
    const rows = db.prepare(`
      SELECT id, user_id, content, created_at
      FROM messages
      ORDER BY created_at DESC
      LIMIT 100
    `).all();
    res.json({ items: rows });
  } catch (e) {
    console.error("GET /chat/history error:", e);
    res.status(500).json({ error: "failed_to_fetch_history" });
  }
});
var chat_default = router;

// server/routes/ai-chat.ts
import express from "express";

// server/services/ragSystem.ts
import { ChatOpenAI as ChatOpenAI2 } from "@langchain/openai";
import { HumanMessage as HumanMessage2, AIMessage, SystemMessage as SystemMessage2 } from "@langchain/core/messages";

// server/lib/supabase.ts
import { createClient } from "@supabase/supabase-js";
var supabaseUrl = process.env.SUPABASE_URL || "";
var supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || "";
if (!supabaseUrl || !supabaseServiceKey) {
  console.warn("\u26A0\uFE0F  Supabase credentials not found. Database features will not work.");
  console.warn("   Please add SUPABASE_URL and SUPABASE_SERVICE_KEY to your .env file");
}
var supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});
function isSupabaseConfigured() {
  return Boolean(supabaseUrl && supabaseServiceKey);
}

// server/services/enhancedSemanticSearch.ts
import { OpenAI } from "openai";
var openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || ""
});
async function generateEmbedding(text2) {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY not configured");
  }
  const response = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: text2
  });
  return response.data[0].embedding;
}
function expandQuery(userMessage) {
  const queries = [userMessage];
  const lowerMessage = userMessage.toLowerCase();
  if (lowerMessage.match(/anxious|anxiety|worry|worried|nervous|panic/)) {
    queries.push("anxiety disorder treatment cognitive behavioral therapy");
    queries.push("generalized anxiety disorder GAD intervention");
    if (lowerMessage.includes("panic")) {
      queries.push("panic disorder panic attacks treatment");
    }
    if (lowerMessage.match(/social|people|public/)) {
      queries.push("social anxiety disorder social phobia treatment");
    }
  }
  if (lowerMessage.match(/depress|sad|hopeless|unmotivated|low mood/)) {
    queries.push("major depressive disorder treatment");
    queries.push("depression cognitive behavioral therapy");
    queries.push("behavioral activation depression intervention");
  }
  if (lowerMessage.match(/sleep|insomnia|tired|exhausted|can't sleep/)) {
    queries.push("insomnia cognitive behavioral therapy CBT-I");
    queries.push("sleep disorder treatment sleep hygiene");
    queries.push("anxiety related insomnia intervention");
  }
  if (lowerMessage.match(/trauma|ptsd|flashback|nightmare|abuse/)) {
    queries.push("post-traumatic stress disorder PTSD treatment");
    queries.push("trauma focused cognitive behavioral therapy");
    queries.push("prolonged exposure therapy");
  }
  if (lowerMessage.match(/ocd|obsess|compuls|intrusive thought|ritual/)) {
    queries.push("obsessive compulsive disorder OCD treatment");
    queries.push("exposure response prevention ERP");
  }
  if (lowerMessage.match(/eating|anorexia|bulimia|binge|food|weight/)) {
    queries.push("eating disorder treatment cognitive behavioral therapy");
    queries.push("anorexia nervosa bulimia intervention");
  }
  if (lowerMessage.match(/stress|overwhelm|cope|coping|burnout/)) {
    queries.push("stress management intervention");
    queries.push("mindfulness based stress reduction");
    queries.push("coping strategies psychological intervention");
  }
  return [...new Set(queries)];
}
function calculateKeywordScore(paper, userMessage) {
  const keywords = userMessage.toLowerCase().split(/\s+/).filter((word) => word.length > 3);
  const paperText = `${paper.title} ${paper.content} ${paper.summary}`.toLowerCase();
  let matchCount = 0;
  for (const keyword of keywords) {
    if (paperText.includes(keyword)) {
      matchCount++;
    }
  }
  return keywords.length > 0 ? matchCount / keywords.length : 0;
}
function extractCitationCount(paper) {
  const match = paper.content.match(/CITATION COUNT:\s*(\d+)/i);
  return match ? parseInt(match[1]) : 0;
}
function calculateQualityScore(paper, similarity, keywordScore) {
  const citations = extractCitationCount(paper);
  const year = paper.year || 2e3;
  const citationScore = Math.min(Math.log(citations + 1) / Math.log(5e3), 1);
  const recencyScore = year >= 2020 ? 1 : year >= 2015 ? 0.7 : year >= 2010 ? 0.4 : 0.2;
  let articleTypeScore = 0.5;
  const content = paper.content.toLowerCase();
  if (content.includes("meta-analysis")) articleTypeScore = 1;
  else if (content.includes("systematic review")) articleTypeScore = 0.9;
  else if (content.includes("randomized controlled trial") || content.includes("rct")) articleTypeScore = 0.8;
  else if (content.includes("review")) articleTypeScore = 0.6;
  const qualityScore = 0.4 * similarity + // Semantic match (40%)
  0.2 * keywordScore + // Exact keyword match (20%)
  0.2 * citationScore + // Citation count (20%)
  0.1 * recencyScore + // Recency (10%)
  0.1 * articleTypeScore;
  return qualityScore;
}
async function enhancedSearchResearchPapers(userMessage, options = {}) {
  if (!isSupabaseConfigured()) {
    console.warn("[RAG] Supabase not configured");
    return [];
  }
  const { maxPapers = 5, minThreshold = 0.2, topicFilter } = options;
  console.log(`[RAG] Enhanced search for: "${userMessage.substring(0, 50)}..."`);
  const expandedQueries = expandQuery(userMessage);
  console.log(`[RAG] Expanded to ${expandedQueries.length} queries`);
  const allPapers = /* @__PURE__ */ new Map();
  for (const query of expandedQueries) {
    try {
      const queryEmbedding = await generateEmbedding(query);
      const { data, error } = await supabase.rpc("search_research_papers", {
        query_embedding: queryEmbedding,
        match_threshold: minThreshold,
        match_count: 10
        // Get more than needed for re-ranking
      });
      if (error) {
        console.error("[RAG] Search error:", error.message);
        continue;
      }
      data?.forEach((paper) => {
        if (!allPapers.has(paper.id)) {
          allPapers.set(paper.id, {
            id: paper.id,
            title: paper.title,
            authors: paper.authors,
            year: paper.year,
            topic: paper.topic,
            content: paper.content,
            summary: paper.summary,
            source_url: paper.source_url,
            similarity: paper.similarity
          });
        } else {
          const existing = allPapers.get(paper.id);
          if (paper.similarity > existing.similarity) {
            allPapers.set(paper.id, {
              ...existing,
              similarity: paper.similarity
            });
          }
        }
      });
    } catch (error) {
      console.error(`[RAG] Error searching query "${query}":`, error.message);
    }
  }
  let results = Array.from(allPapers.values());
  console.log(`[RAG] Found ${results.length} unique papers before filtering`);
  if (topicFilter && results.length > 0) {
    results = results.filter(
      (paper) => paper.topic?.toLowerCase().includes(topicFilter.toLowerCase())
    );
    console.log(`[RAG] ${results.length} papers after topic filter "${topicFilter}"`);
  }
  results.forEach((paper) => {
    const keywordScore = calculateKeywordScore(paper, userMessage);
    const qualityScore = calculateQualityScore(
      paper,
      paper.similarity || 0,
      keywordScore
    );
    paper.qualityScore = qualityScore;
  });
  results.sort((a, b) => (b.qualityScore || 0) - (a.qualityScore || 0));
  const finalResults = results.slice(0, maxPapers);
  console.log(`[RAG] Returning ${finalResults.length} top papers after re-ranking`);
  finalResults.forEach((paper, i) => {
    console.log(`  ${i + 1}. [${(paper.qualityScore * 100).toFixed(1)}%] ${paper.title.substring(0, 50)}...`);
  });
  return finalResults;
}
async function getEnhancedResearchContext(userMessage, maxPapers = 3) {
  try {
    const papers = await enhancedSearchResearchPapers(userMessage, {
      maxPapers,
      minThreshold: 0.2
    });
    if (papers.length === 0) {
      console.log("[RAG] No relevant papers found");
      return "";
    }
    const context = papers.map((paper, index) => {
      const citation = paper.authors && paper.year ? `${paper.authors} (${paper.year})` : paper.title;
      const citationCount = extractCitationCount(paper);
      return `
[Research Paper ${index + 1}]
Title: ${paper.title}
Citation: ${citation}
Evidence Quality: ${citationCount} citations | ${paper.topic || "General"}
Relevance Score: ${((paper.qualityScore || 0) * 100).toFixed(0)}%

${paper.summary || paper.content.substring(0, 500)}...

${paper.source_url ? `Source: ${paper.source_url}` : ""}
      `.trim();
    }).join("\n\n---\n\n");
    return `
The following research papers are relevant to the user's question:

${context}

Please reference these papers in your response when appropriate, using citations like "(Author, Year)" or "According to research on [topic]...".
    `.trim();
  } catch (error) {
    console.error("[RAG] Error getting research context:", error.message);
    return "";
  }
}

// server/services/crisisDetection.ts
import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
var chatModel = new ChatOpenAI({
  modelName: "gpt-4o-mini",
  temperature: 0.3,
  // Lower temperature for more consistent crisis assessment
  openAIApiKey: process.env.OPENAI_API_KEY || ""
});
var CSSRS_QUESTIONS = [
  {
    id: 1,
    question: "Have you had thoughts of killing yourself?",
    category: "ideation",
    weight: "moderate"
  },
  {
    id: 2,
    question: "Do you feel the world would be better without you?",
    category: "ideation",
    weight: "moderate"
  },
  {
    id: 3,
    question: "Have you thought about how you might end your life?",
    category: "method",
    weight: "high"
  },
  {
    id: 4,
    question: "Do you have a specific plan to end your life?",
    category: "plan",
    weight: "high"
  },
  {
    id: 5,
    question: "Do you have access to means to harm yourself (e.g., pills, weapons)?",
    category: "means",
    weight: "imminent"
  },
  {
    id: 6,
    question: "Do you intend to act on these thoughts?",
    category: "intent",
    weight: "imminent"
  }
];
async function detectCrisisContext(message) {
  const systemPrompt = `You are a crisis detection system for a mental health wellness app.

Your job is to analyze user messages for suicide risk indicators using clinical expertise.

IMPORTANT CONTEXT CONSIDERATIONS:
- Distinguish between casual expressions ("kill this headache") and genuine distress
- Detect passive ideation ("I wish I wasn't here") vs active ideation ("I want to die")
- Recognize euphemisms: "ending it", "not being here anymore", "going to sleep forever"
- Catch indirect language: "everyone would be better off", "no reason to live"
- Consider misspellings, coded language, and cultural differences

RISK LEVELS:
- none: No indicators detected
- low: Vague distress, no specific ideation ("I can't take this anymore")
- moderate: Passive ideation, no plan/intent ("I wish I was dead")
- high: Active ideation with method/plan ("I've thought about pills")
- imminent: Intent + means + plan ("I have pills and I'm going to take them tonight")

Respond ONLY with valid JSON:
{
  "riskLevel": "none" | "low" | "moderate" | "high" | "imminent",
  "requiresScreening": boolean,
  "reasoning": "brief clinical reasoning",
  "detectedIndicators": ["specific phrases that raised concern"]
}

If riskLevel is "moderate" or higher, set requiresScreening to true.
`;
  try {
    const response = await chatModel.invoke([
      new SystemMessage(systemPrompt),
      new HumanMessage(`Analyze this message for crisis indicators:

"${message}"`)
    ], {
      response_format: { type: "json_object" }
    });
    const assessment = JSON.parse(response.content.toString());
    console.log(`[CRISIS] Risk assessment: ${assessment.riskLevel} - ${assessment.reasoning}`);
    return assessment;
  } catch (error) {
    console.error("[CRISIS] Error in AI assessment:", error.message);
    return fallbackKeywordDetection(message);
  }
}
function fallbackKeywordDetection(message) {
  const lowerMessage = message.toLowerCase();
  const imminentKeywords = [
    "going to kill myself",
    "going to end my life",
    "tonight",
    "goodbye forever",
    "final message"
  ];
  const highRiskKeywords = [
    "suicide",
    "kill myself",
    "end my life",
    "want to die",
    "take my life",
    "have a plan"
  ];
  const moderateKeywords = [
    "wish i was dead",
    "better off dead",
    "no reason to live",
    "can't go on",
    "ending it",
    "not worth living"
  ];
  const detectedIndicators = [];
  if (imminentKeywords.some((kw) => lowerMessage.includes(kw))) {
    imminentKeywords.forEach((kw) => {
      if (lowerMessage.includes(kw)) detectedIndicators.push(kw);
    });
    return {
      riskLevel: "imminent",
      requiresScreening: true,
      reasoning: "Imminent risk keywords detected - immediate intervention needed",
      detectedIndicators
    };
  }
  if (highRiskKeywords.some((kw) => lowerMessage.includes(kw))) {
    highRiskKeywords.forEach((kw) => {
      if (lowerMessage.includes(kw)) detectedIndicators.push(kw);
    });
    return {
      riskLevel: "high",
      requiresScreening: true,
      reasoning: "Active suicidal ideation keywords detected",
      detectedIndicators
    };
  }
  if (moderateKeywords.some((kw) => lowerMessage.includes(kw))) {
    moderateKeywords.forEach((kw) => {
      if (lowerMessage.includes(kw)) detectedIndicators.push(kw);
    });
    return {
      riskLevel: "moderate",
      requiresScreening: true,
      reasoning: "Passive ideation or hopelessness detected",
      detectedIndicators
    };
  }
  return {
    riskLevel: "none",
    requiresScreening: false,
    reasoning: "No crisis indicators detected",
    detectedIndicators: []
  };
}
function generateCrisisResponse(assessment, cssrsResults) {
  if (cssrsResults) {
    return `
I'm very concerned about your safety based on your responses.

${cssrsResults.recommendation}

**IMMEDIATE RESOURCES:**
\u{1F198} **Call 988** - Suicide & Crisis Lifeline (24/7, free, confidential)
\u{1F4F1} **Text HOME to 741741** - Crisis Text Line
\u{1F6A8} **Call 911** - For immediate emergency

You don't have to face this alone. Professional help is available right now.

**Note:** I'm an AI wellness companion, not equipped for crisis situations. Please reach out to one of these services immediately.
    `.trim();
  }
  switch (assessment.riskLevel) {
    case "imminent":
      return `
I'm extremely concerned about what you're sharing. This is a crisis situation.

**CALL 911 NOW** or go to your nearest emergency room.

\u{1F198} **Call 988** - Suicide & Crisis Lifeline
\u{1F4F1} **Text HOME to 741741** - Crisis Text Line

If you're not safe right now, please call one of these numbers immediately. They have trained counselors available 24/7.

You don't have to face this alone. Help is available right now.
      `.trim();
    case "high":
    case "moderate":
      return `I'm concerned about your safety. Before we continue, I need to ask you a few quick questions to make sure you're okay. Please answer honestly - this helps me understand how best to support you.`;
    case "low":
      return `I hear that you're going through a difficult time. While I'm here to support you, if you're having thoughts of harming yourself, please reach out to:

\u{1F198} **988 - Suicide & Crisis Lifeline**
\u{1F4F1} **Text HOME to 741741 - Crisis Text Line**

Would you like to talk about what's troubling you?`;
    default:
      return "";
  }
}
function getNextCSSRSQuestion(previousResponses) {
  const nextQuestionNumber = previousResponses.length + 1;
  if (nextQuestionNumber > CSSRS_QUESTIONS.length) {
    return null;
  }
  const question = CSSRS_QUESTIONS[nextQuestionNumber - 1];
  return `${question.question} (Please answer yes or no)`;
}

// server/services/ragSystem.ts
var OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";
var chatModel2 = new ChatOpenAI2({
  modelName: "gpt-4o-mini",
  temperature: 0.7,
  openAIApiKey: OPENAI_API_KEY,
  streaming: true
});
var SYSTEM_PROMPT = `You are a compassionate wellness companion for Tranquiloo, NOT a therapist or medical professional.

CRITICAL SAFETY RULES:
1. If user mentions suicide, self-harm, or crisis \u2192 IMMEDIATELY respond: "I'm concerned about your safety. Please call 988 (Suicide & Crisis Lifeline) or text HOME to 741741 right now. If this is an emergency, call 911."
2. NEVER diagnose mental health conditions (no "you have depression/anxiety/PTSD")
3. NEVER prescribe treatments, medications, or therapy techniques
4. ALWAYS recommend professional help for serious concerns
5. Frame suggestions as "research suggests" or "studies show", not "you should"
6. You are NOT HIPAA compliant - remind users not to share sensitive medical info

YOUR ROLE:
- Supportive listener and wellness companion
- Share evidence-based coping strategies from research papers
- Help users reflect on their feelings and experiences
- Encourage healthy habits (sleep, exercise, social connection)
- Validate emotions while maintaining professional boundaries

WHEN TO CITE RESEARCH:
- When sharing coping strategies, cite the research paper
- Use format: "According to [Author, Year]..." or "Research from [Institution] suggests..."
- If no research is provided, use general wellness knowledge

TONE:
- Warm, empathetic, but not overly emotional
- Professional but approachable
- Honest about limitations ("I'm an AI, not a therapist")
- Encouraging and hopeful

Remember: You're a wellness tool, not therapy. Always prioritize user safety.`;
async function getConversationSummary(conversationId, userId) {
  const { data, error } = await supabase.from("conversation_summaries").select("summary, key_topics").eq("conversation_id", conversationId).order("created_at", { ascending: false }).limit(1).single();
  if (error || !data) return null;
  const topics = data.key_topics?.join(", ") || "general wellness";
  return `Previous conversation context: ${data.summary}
Key topics: ${topics}`;
}
async function createConversationSummary(conversationId, userId, messages) {
  if (messages.length < 10) return;
  const messagesToSummarize = messages.slice(-10);
  const messageText = messagesToSummarize.map((m) => `${m.role === "user" ? "User" : "AI"}: ${m.content}`).join("\n");
  const summaryPrompt = `Summarize the following conversation in 3-4 sentences, focusing on main themes and user's emotional state:

${messageText}

Summary:`;
  const summaryResponse = await chatModel2.invoke([
    new HumanMessage2(summaryPrompt)
  ]);
  const summary = summaryResponse.content.toString();
  const topics = extractKeyTopics(messageText);
  await supabase.from("conversation_summaries").insert({
    conversation_id: conversationId,
    user_id: userId,
    summary,
    message_count: messages.length,
    key_topics: topics
  });
}
function extractKeyTopics(text2) {
  const topicKeywords = {
    anxiety: ["anxiety", "anxious", "worry", "panic", "nervous", "fear"],
    depression: ["depression", "depressed", "sad", "hopeless", "unmotivated"],
    stress: ["stress", "stressed", "overwhelmed", "pressure", "burnout"],
    sleep: ["sleep", "insomnia", "tired", "exhausted", "rest"],
    relationships: ["relationship", "partner", "family", "friend", "conflict"],
    work: ["work", "job", "career", "colleague", "boss"],
    coping: ["coping", "manage", "deal with", "handle", "strategy"],
    mindfulness: ["mindfulness", "meditation", "breathing", "grounding"]
  };
  const lowerText = text2.toLowerCase();
  const topics = [];
  for (const [topic, keywords] of Object.entries(topicKeywords)) {
    if (keywords.some((keyword) => lowerText.includes(keyword))) {
      topics.push(topic);
    }
  }
  return topics.length > 0 ? topics : ["general"];
}
async function getAIResponse(userMessage, conversationId, userId, conversationHistory = []) {
  console.log("[RAG] Performing crisis assessment...");
  const crisisAssessment = await detectCrisisContext(userMessage);
  if (crisisAssessment.requiresScreening) {
    console.log(`[RAG] Crisis screening required - Risk level: ${crisisAssessment.riskLevel}`);
    const crisisResponse = generateCrisisResponse(crisisAssessment);
    return {
      response: crisisResponse,
      researchUsed: [],
      shouldAlert: true,
      crisisData: {
        riskLevel: crisisAssessment.riskLevel,
        requiresScreening: true,
        nextQuestion: getNextCSSRSQuestion([]),
        // Start C-SSRS if moderate+
        detectedIndicators: crisisAssessment.detectedIndicators
      }
    };
  }
  const researchContext = await getEnhancedResearchContext(userMessage, 3);
  const conversationSummary = await getConversationSummary(conversationId, userId);
  const messages = [
    new SystemMessage2(SYSTEM_PROMPT)
  ];
  if (conversationSummary) {
    messages.push(new SystemMessage2(conversationSummary));
  }
  const recentHistory = conversationHistory.slice(-5);
  for (const msg of recentHistory) {
    if (msg.role === "user") {
      messages.push(new HumanMessage2(msg.content));
    } else {
      messages.push(new AIMessage(msg.content));
    }
  }
  if (researchContext) {
    messages.push(new SystemMessage2(researchContext));
  }
  messages.push(new HumanMessage2(userMessage));
  const response = await chatModel2.invoke(messages);
  const aiResponse = response.content.toString();
  const researchUsed = extractCitedResearch(researchContext);
  const totalMessages = conversationHistory.length + 2;
  if (totalMessages % 10 === 0) {
    await createConversationSummary(
      conversationId,
      userId,
      [...conversationHistory, { role: "user", content: userMessage }, { role: "assistant", content: aiResponse }]
    );
  }
  return {
    response: aiResponse,
    researchUsed,
    shouldAlert: false
  };
}
async function streamAIResponse(userMessage, conversationId, userId, conversationHistory = [], onChunk) {
  const isCrisis = detectCrisis(userMessage);
  if (isCrisis) {
    const crisisResponse = {
      response: `I'm very concerned about what you're sharing. Please reach out for immediate help:

\u{1F198} **Call 988** - Suicide & Crisis Lifeline (US)
\u{1F4F1} **Text HOME to 741741** - Crisis Text Line
\u{1F6A8} **Call 911** - For emergencies`,
      researchUsed: [],
      shouldAlert: true
    };
    onChunk(crisisResponse.response);
    return crisisResponse;
  }
  const researchContext = await getResearchContext(userMessage, 3);
  const conversationSummary = await getConversationSummary(conversationId, userId);
  const messages = [
    new SystemMessage2(SYSTEM_PROMPT)
  ];
  if (conversationSummary) {
    messages.push(new SystemMessage2(conversationSummary));
  }
  const recentHistory = conversationHistory.slice(-5);
  for (const msg of recentHistory) {
    if (msg.role === "user") {
      messages.push(new HumanMessage2(msg.content));
    } else {
      messages.push(new AIMessage(msg.content));
    }
  }
  if (researchContext) {
    messages.push(new SystemMessage2(researchContext));
  }
  messages.push(new HumanMessage2(userMessage));
  let fullResponse = "";
  const stream = await chatModel2.stream(messages);
  for await (const chunk of stream) {
    const content = chunk.content.toString();
    fullResponse += content;
    onChunk(content);
  }
  const researchUsed = extractCitedResearch(researchContext);
  const totalMessages = conversationHistory.length + 2;
  if (totalMessages % 10 === 0) {
    await createConversationSummary(
      conversationId,
      userId,
      [...conversationHistory, { role: "user", content: userMessage }, { role: "assistant", content: fullResponse }]
    );
  }
  return {
    response: fullResponse,
    researchUsed,
    shouldAlert: false
  };
}
function extractCitedResearch(researchContext) {
  if (!researchContext) return [];
  const papers = [];
  const titleRegex = /Title: (.+)/g;
  let match;
  while ((match = titleRegex.exec(researchContext)) !== null) {
    papers.push(match[1]);
  }
  return papers;
}

// server/routes/ai-chat.ts
var router2 = express.Router();
router2.post("/message", async (req, res) => {
  try {
    const { message, conversationId, userId, history } = req.body;
    if (!message || !conversationId || !userId) {
      return res.status(400).json({
        error: "Missing required fields: message, conversationId, userId"
      });
    }
    const result = await getAIResponse(message, conversationId, userId, history || []);
    await supabase.from("chat_messages").insert({
      session_id: conversationId,
      user_id: userId,
      content: message,
      sender: "user"
    });
    await supabase.from("chat_messages").insert({
      session_id: conversationId,
      user_id: userId,
      content: result.response,
      sender: "ai"
    });
    res.json({
      response: result.response,
      researchUsed: result.researchUsed,
      shouldAlert: result.shouldAlert
    });
  } catch (error) {
    console.error("Error in AI chat:", error);
    res.status(500).json({
      error: "Failed to get AI response",
      details: error.message
    });
  }
});
router2.post("/stream", async (req, res) => {
  try {
    const { message, conversationId, userId, history } = req.body;
    if (!message || !conversationId || !userId) {
      return res.status(400).json({
        error: "Missing required fields: message, conversationId, userId"
      });
    }
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    let fullResponse = "";
    const result = await streamAIResponse(
      message,
      conversationId,
      userId,
      history || [],
      (chunk) => {
        fullResponse += chunk;
        res.write(`data: ${JSON.stringify({ chunk, type: "content" })}

`);
      }
    );
    res.write(`data: ${JSON.stringify({
      type: "done",
      researchUsed: result.researchUsed,
      shouldAlert: result.shouldAlert
    })}

`);
    res.end();
    await supabase.from("chat_messages").insert([
      {
        session_id: conversationId,
        user_id: userId,
        content: message,
        sender: "user"
      },
      {
        session_id: conversationId,
        user_id: userId,
        content: fullResponse,
        sender: "ai"
      }
    ]);
  } catch (error) {
    console.error("Error in AI chat stream:", error);
    res.write(`data: ${JSON.stringify({
      type: "error",
      error: "Failed to get AI response"
    })}

`);
    res.end();
  }
});
router2.get("/history/:conversationId", async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { limit = 50 } = req.query;
    const { data, error } = await supabase.from("chat_messages").select("*").eq("session_id", conversationId).order("created_at", { ascending: true }).limit(Number(limit));
    if (error) throw error;
    res.json({ messages: data || [] });
  } catch (error) {
    console.error("Error fetching chat history:", error);
    res.status(500).json({ error: "Failed to fetch chat history" });
  }
});
router2.post("/new-conversation", async (req, res) => {
  try {
    const { userId, title } = req.body;
    if (!userId) {
      return res.status(400).json({ error: "userId is required" });
    }
    const { data, error } = await supabase.from("chat_sessions").insert({
      user_id: userId,
      title: title || "New Conversation"
    }).select().single();
    if (error) throw error;
    res.json({ conversation: data });
  } catch (error) {
    console.error("Error creating conversation:", error);
    res.status(500).json({ error: "Failed to create conversation" });
  }
});
router2.get("/conversations/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const { data, error } = await supabase.from("chat_sessions").select("*").eq("user_id", userId).order("updated_at", { ascending: false });
    if (error) throw error;
    res.json({ conversations: data || [] });
  } catch (error) {
    console.error("Error fetching conversations:", error);
    res.status(500).json({ error: "Failed to fetch conversations" });
  }
});
var ai_chat_default = router2;

// server/routes/wellness.ts
import express2 from "express";
var router3 = express2.Router();
router3.post("/track", async (req, res) => {
  try {
    const {
      userId,
      moodScore,
      energyLevel,
      heartRateFeeling,
      sleepQuality,
      stressLevel,
      notes
    } = req.body;
    if (!userId) {
      return res.status(400).json({ error: "userId is required" });
    }
    const { data, error } = await supabase.from("wellness_tracking").insert({
      user_id: userId,
      mood_score: moodScore,
      energy_level: energyLevel,
      heart_rate_feeling: heartRateFeeling,
      sleep_quality: sleepQuality,
      stress_level: stressLevel,
      notes: notes || null
    }).select().single();
    if (error) throw error;
    res.json({ entry: data });
  } catch (error) {
    console.error("Error tracking wellness:", error);
    res.status(500).json({
      error: "Failed to save wellness entry",
      details: error.message
    });
  }
});
router3.get("/history/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const { days = 30, limit = 100 } = req.query;
    const daysAgo = /* @__PURE__ */ new Date();
    daysAgo.setDate(daysAgo.getDate() - Number(days));
    const { data, error } = await supabase.from("wellness_tracking").select("*").eq("user_id", userId).gte("created_at", daysAgo.toISOString()).order("created_at", { ascending: false }).limit(Number(limit));
    if (error) throw error;
    res.json({ entries: data || [] });
  } catch (error) {
    console.error("Error fetching wellness history:", error);
    res.status(500).json({ error: "Failed to fetch wellness history" });
  }
});
router3.get("/trends/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const { days = 30 } = req.query;
    const { data, error } = await supabase.rpc("get_wellness_trends", {
      p_user_id: userId,
      days_back: Number(days)
    });
    if (error) throw error;
    res.json({ trends: data || [] });
  } catch (error) {
    console.error("Error fetching wellness trends:", error);
    res.status(500).json({ error: "Failed to fetch wellness trends" });
  }
});
router3.get("/summary/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const { days = 7 } = req.query;
    const daysAgo = /* @__PURE__ */ new Date();
    daysAgo.setDate(daysAgo.getDate() - Number(days));
    const { data, error } = await supabase.from("wellness_tracking").select("mood_score, energy_level, stress_level, sleep_quality").eq("user_id", userId).gte("created_at", daysAgo.toISOString());
    if (error) throw error;
    if (!data || data.length === 0) {
      return res.json({
        summary: {
          avgMood: null,
          avgStress: null,
          avgSleep: null,
          entryCount: 0,
          daysTracked: 0
        }
      });
    }
    const avgMood = data.reduce((sum, e) => sum + (e.mood_score || 0), 0) / data.length;
    const avgStress = data.reduce((sum, e) => sum + (e.stress_level || 0), 0) / data.length;
    const avgSleep = data.reduce((sum, e) => sum + (e.sleep_quality || 0), 0) / data.length;
    const uniqueDays = new Set(data.map((e) => e.created_at?.split("T")[0])).size;
    res.json({
      summary: {
        avgMood: avgMood.toFixed(1),
        avgStress: avgStress.toFixed(1),
        avgSleep: avgSleep.toFixed(1),
        entryCount: data.length,
        daysTracked: uniqueDays
      }
    });
  } catch (error) {
    console.error("Error fetching wellness summary:", error);
    res.status(500).json({ error: "Failed to fetch wellness summary" });
  }
});
router3.delete("/:entryId", async (req, res) => {
  try {
    const { entryId } = req.params;
    const { error } = await supabase.from("wellness_tracking").delete().eq("id", entryId);
    if (error) throw error;
    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting wellness entry:", error);
    res.status(500).json({ error: "Failed to delete wellness entry" });
  }
});
var wellness_default = router3;

// server/index.ts
import express4 from "express";

// server/routes.ts
init_storage();
init_emailService();
import { createServer } from "http";
import * as bcrypt from "bcryptjs";
import { randomBytes } from "crypto";

// server/routes/appointments.ts
init_db();
init_schema();
init_storage();
import { Router as Router2 } from "express";
import { eq as eq2, and as and2, gte, lte } from "drizzle-orm";
import { randomUUID as randomUUID2 } from "crypto";
var router4 = Router2();
router4.post("/schedule", async (req, res) => {
  try {
    const {
      patientId,
      therapistEmail,
      appointmentDate,
      appointmentTime,
      duration = 60,
      // default 60 minutes
      notes,
      type = "video",
      // 'video', 'audio', or 'in_person'
      meetingLink
    } = req.body;
    if (!patientId || !therapistEmail || !appointmentDate || !appointmentTime) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    if (!["video", "audio", "in_person"].includes(type)) {
      return res.status(400).json({ error: "Invalid appointment type" });
    }
    const scheduledDateTime = (/* @__PURE__ */ new Date(`${appointmentDate}T${appointmentTime}`)).toISOString();
    const appointmentId = randomUUID2();
    const [appointment] = await db2.insert(appointments).values({
      id: appointmentId,
      patientId,
      therapistEmail,
      scheduledAt: scheduledDateTime,
      duration,
      notes,
      type,
      meetingLink: meetingLink?.trim() || null,
      status: "scheduled",
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    }).returning();
    const patient = await storage.getProfile(patientId);
    const appointmentDateTime = new Date(scheduledDateTime);
    const formattedDate = appointmentDateTime.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric"
    });
    const formattedTime = appointmentDateTime.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true
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
        <p><strong>Type:</strong> ${type === "video" ? "Video Call" : type === "audio" ? "Audio Call" : "In-Person Session"}</p>
        ${meetingLink ? `<p><strong>Meeting Link:</strong> ${meetingLink}</p>` : ""}
        ${notes ? `<p><strong>Notes:</strong> ${notes}</p>` : ""}
      </div>

      <p><strong>This appointment will be automatically recorded and transcribed for HIPAA compliance.</strong></p>

      <p>You can join the call from your therapist dashboard when the appointment time arrives.</p>
    `;
    await storage.createEmailNotification({
      toEmail: therapistEmail,
      subject: `New Appointment: ${formattedDate} at ${formattedTime}`,
      htmlContent: emailContent,
      emailType: "appointment_scheduled",
      metadata: JSON.stringify({
        appointmentId: appointment.id,
        patientId,
        patientName: `${patient?.firstName} ${patient?.lastName}`,
        scheduledAt: scheduledDateTime,
        type,
        duration
      })
    });
    res.json({ success: true, appointment });
  } catch (error) {
    console.error("Failed to create appointment:", error);
    res.status(500).json({ error: "Failed to schedule appointment" });
  }
});
router4.get("/patient/:patientId", async (req, res) => {
  try {
    const { patientId } = req.params;
    const patientAppointments = await db2.select().from(appointments).where(eq2(appointments.patientId, patientId)).orderBy(appointments.scheduledAt);
    res.json(patientAppointments);
  } catch (error) {
    console.error("Failed to fetch patient appointments:", error);
    res.status(500).json({ error: "Failed to fetch appointments" });
  }
});
router4.get("/therapist/:therapistEmail", async (req, res) => {
  try {
    const { therapistEmail } = req.params;
    const therapistAppointments = await db2.select().from(appointments).where(eq2(appointments.therapistEmail, therapistEmail)).orderBy(appointments.scheduledAt);
    res.json(therapistAppointments);
  } catch (error) {
    console.error("Failed to fetch therapist appointments:", error);
    res.status(500).json({ error: "Failed to fetch appointments" });
  }
});
router4.patch("/:appointmentId/status", async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const { status, scheduledAt } = req.body;
    if (!["scheduled", "confirmed", "in_progress", "completed", "cancelled"].includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }
    const updateData = {
      status,
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    if (scheduledAt) {
      updateData.scheduledAt = scheduledAt;
    }
    const [updated] = await db2.update(appointments).set(updateData).where(eq2(appointments.id, appointmentId)).returning();
    res.json({ success: true, appointment: updated });
  } catch (error) {
    console.error("Failed to update appointment:", error);
    res.status(500).json({ error: "Failed to update appointment" });
  }
});
router4.post("/:appointmentId/start-call", async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const roomId = `appt-${appointmentId}-${Date.now()}`;
    const [updated] = await db2.update(appointments).set({
      status: "in_progress",
      roomId,
      startedAt: (/* @__PURE__ */ new Date()).toISOString(),
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    }).where(eq2(appointments.id, appointmentId)).returning();
    res.json({ success: true, roomId, appointment: updated });
  } catch (error) {
    console.error("Failed to start call:", error);
    res.status(500).json({ error: "Failed to start call" });
  }
});
router4.post("/:appointmentId/end-call", async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const { recordingUrl, transcript, duration } = req.body;
    const [updated] = await db2.update(appointments).set({
      status: "completed",
      endedAt: (/* @__PURE__ */ new Date()).toISOString(),
      recordingUrl,
      transcript,
      actualDuration: duration,
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    }).where(eq2(appointments.id, appointmentId)).returning();
    res.json({ success: true, appointment: updated });
  } catch (error) {
    console.error("Failed to end call:", error);
    res.status(500).json({ error: "Failed to end call" });
  }
});
router4.delete("/:appointmentId", async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const { reason } = req.body;
    const [updated] = await db2.update(appointments).set({
      status: "cancelled",
      cancellationReason: reason,
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    }).where(eq2(appointments.id, appointmentId)).returning();
    res.json({ success: true, appointment: updated });
  } catch (error) {
    console.error("Failed to cancel appointment:", error);
    res.status(500).json({ error: "Failed to cancel appointment" });
  }
});
router4.patch("/:appointmentId/details", async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const { type, meetingLink, notes } = req.body;
    const updateData = {
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    if (typeof type !== "undefined") {
      if (!["video", "audio", "in_person"].includes(type)) {
        return res.status(400).json({ error: "Invalid appointment type" });
      }
      updateData.type = type;
    }
    if (typeof meetingLink !== "undefined") {
      const trimmed = typeof meetingLink === "string" ? meetingLink.trim() : "";
      updateData.meetingLink = trimmed ? trimmed : null;
    }
    if (typeof notes !== "undefined") {
      updateData.notes = notes;
    }
    const [updated] = await db2.update(appointments).set(updateData).where(eq2(appointments.id, appointmentId)).returning();
    res.json({ success: true, appointment: updated });
  } catch (error) {
    console.error("Failed to update appointment details:", error);
    res.status(500).json({ error: "Failed to update appointment details" });
  }
});
router4.get("/upcoming/:userId/:role", async (req, res) => {
  try {
    const { userId, role } = req.params;
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1e3).toISOString();
    let upcomingAppointments;
    if (role === "patient") {
      upcomingAppointments = await db2.select().from(appointments).where(
        and2(
          eq2(appointments.patientId, userId),
          gte(appointments.scheduledAt, now),
          lte(appointments.scheduledAt, nextWeek)
        )
      ).orderBy(appointments.scheduledAt);
    } else {
      upcomingAppointments = await db2.select().from(appointments).where(
        and2(
          eq2(appointments.therapistEmail, userId),
          gte(appointments.scheduledAt, now),
          lte(appointments.scheduledAt, nextWeek)
        )
      ).orderBy(appointments.scheduledAt);
    }
    res.json(upcomingAppointments);
  } catch (error) {
    console.error("Failed to fetch upcoming appointments:", error);
    res.status(500).json({ error: "Failed to fetch upcoming appointments" });
  }
});
var appointments_default = router4;

// shared/mentalHealth/anxietyContexts.ts
var computeConfidence = (score, threshold) => {
  if (score >= threshold + 3) {
    return "high";
  }
  if (score >= threshold + 1) {
    return "medium";
  }
  return score >= threshold ? "low" : "low";
};
var evaluatePatterns = (text2, patterns, threshold) => {
  const matches = [];
  let score = 0;
  for (const pattern of patterns) {
    if (pattern.regex.test(text2)) {
      score += pattern.weight;
      matches.push(pattern.description);
    }
  }
  const thresholdMet = score >= threshold;
  return {
    score,
    matches,
    thresholdMet,
    confidence: computeConfidence(score, threshold)
  };
};
var createBidirectionalPattern = (first, second, description, weight = 3, window = 80) => {
  return [
    {
      regex: new RegExp(`${first.source}.{0,${window}}${second.source}`, first.flags.replace("g", "")),
      weight,
      description
    },
    {
      regex: new RegExp(`${second.source}.{0,${window}}${first.source}`, second.flags.replace("g", "")),
      weight,
      description
    }
  ];
};
var GENERAL_ANXIETY_PATTERNS = [
  { regex: /\banxious\b/i, weight: 3, description: "Explicit anxiety mention" },
  { regex: /\banxiety (?:attack|attacks)\b/i, weight: 4, description: "Anxiety attack described" },
  { regex: /\bpanic wave\b/i, weight: 3, description: "Describes wave of panic" },
  { regex: /\bconstant (?:worry|fear)\b/i, weight: 3, description: "Constant worry described" },
  { regex: /\bcan't (?:stop|seem to stop) (?:worrying|thinking)\b/i, weight: 3, description: "Cannot stop worrying" },
  { regex: /\boverwhelmed\b/i, weight: 2, description: "Feeling overwhelmed" },
  { regex: /\bnervous\b/i, weight: 2, description: "Feeling nervous" },
  { regex: /\brestless\b/i, weight: 2, description: "Restlessness described" },
  { regex: /\bstress(ed|ing)?\b/i, weight: 2, description: "Stress described" },
  { regex: /\bworried\b/i, weight: 3, description: "Worry described" }
];
var PANIC_PATTERNS = [
  { regex: /\bpanic attack(s)?\b/i, weight: 4, description: "Panic attack mentioned" },
  { regex: /\bheart (?:is )?(?:racing|pounding)\b/i, weight: 3, description: "Heart racing" },
  { regex: /\bcan'?t breathe\b/i, weight: 3, description: "Difficulty breathing" },
  { regex: /\bchest (?:pain|tight)\b/i, weight: 2, description: "Chest pain/tightness" },
  { regex: /\bfeel like i'm (?:dying|going to die)\b/i, weight: 3, description: "Feeling like dying" },
  { regex: /\blosing control\b/i, weight: 2, description: "Losing control sensation" },
  { regex: /\bdissociating\b/i, weight: 2, description: "Dissociation mentioned" }
];
var PTSD_PATTERNS = [
  { regex: /\bflashback(s)?\b/i, weight: 4, description: "Flashback described" },
  { regex: /\bnightmares?\b/i, weight: 2, description: "Trauma nightmares" },
  { regex: /\bptsd\b/i, weight: 3, description: "PTSD mentioned" },
  { regex: /\btrauma\b/i, weight: 2, description: "Trauma mentioned" },
  { regex: /\btrigger(?:ed|ing)?\b/i, weight: 3, description: "Triggered response" },
  { regex: /\bhypervigilant\b/i, weight: 3, description: "Hypervigilance mentioned" }
];
var OCD_PATTERNS = [
  { regex: /\bocd\b/i, weight: 3, description: "OCD explicitly mentioned" },
  { regex: /\b(compulsion|compulsive|compulsions)\b/i, weight: 3, description: "Compulsion described" },
  { regex: /\bintrusive thoughts?\b/i, weight: 3, description: "Intrusive thoughts described" },
  ...createBidirectionalPattern(/(?:can't|cannot|can\'t) stop/i, /(?:checking|washing|cleaning|counting|rituals?)/i, "Compulsion urge with ritual"),
  ...createBidirectionalPattern(/(?:urge|need) to/i, /(?:check|wash|clean|count|repeat)/i, "Compulsive urge linked to behavior"),
  {
    regex: /(?:ritual|checking|washing|counting|cleaning|repeating).{0,80}(?:makes me feel better|reduces anxiety)/i,
    weight: 2,
    description: "Ritual linked to anxiety relief"
  }
];
var DEPRESSION_PATTERNS = [
  { regex: /\bdepress(ed|ion)\b/i, weight: 3, description: "Depression mentioned" },
  { regex: /\bhopeless\b/i, weight: 3, description: "Hopelessness described" },
  { regex: /\bworthless\b/i, weight: 3, description: "Worthlessness described" },
  { regex: /\bempty inside\b/i, weight: 3, description: "Emptiness described" },
  { regex: /\bcan't get out of bed\b/i, weight: 4, description: "Low motivation described" },
  { regex: /\bno motivation\b/i, weight: 3, description: "No motivation" },
  { regex: /\bnothing (?:matters|feels good)\b/i, weight: 3, description: "Anhedonia described" }
];
var CRISIS_PATTERNS = [
  { regex: /\bhurt myself\b/i, weight: 4, description: "Self-harm intent" },
  { regex: /\bkill myself\b/i, weight: 5, description: "Explicit suicide intent" },
  { regex: /\bend my life\b/i, weight: 5, description: "Intent to end life" },
  { regex: /\btake my life\b/i, weight: 5, description: "Intent to take life" },
  { regex: /\bsuicidal thoughts?\b/i, weight: 4, description: "Suicidal thoughts" },
  { regex: /\bcan't go on\b/i, weight: 3, description: "Expressed inability to continue" },
  { regex: /\bno reason to live\b/i, weight: 4, description: "Loss of will to live" }
];
var POSITIVE_PATTERNS = [
  { regex: /\bfeeling (?:calm|better|good|okay now)\b/i, weight: 3, description: "Positive feeling reported" },
  { regex: /\bnot anxious anymore\b/i, weight: 3, description: "Anxiety relief reported" },
  { regex: /\bmanaging (?:well|better)\b/i, weight: 2, description: "Managing feelings" },
  { regex: /\bfinding peace\b/i, weight: 2, description: "Sense of peace" }
];
var normalizeMessage = (message) => message.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9\s']/g, " ").replace(/\s+/g, " ").trim();
var analyzeAnxietyContext = (message) => {
  const normalized = normalizeMessage(message);
  const generalAnxiety = evaluatePatterns(normalized, GENERAL_ANXIETY_PATTERNS, 2);
  const panic = evaluatePatterns(normalized, PANIC_PATTERNS, 4);
  const ptsd = evaluatePatterns(normalized, PTSD_PATTERNS, 4);
  const ocd = evaluatePatterns(normalized, OCD_PATTERNS, 5);
  const depression = evaluatePatterns(normalized, DEPRESSION_PATTERNS, 3);
  const crisis = evaluatePatterns(normalized, CRISIS_PATTERNS, 4);
  const positive = evaluatePatterns(normalized, POSITIVE_PATTERNS, 3);
  return {
    generalAnxiety,
    panic,
    ptsd,
    ocd,
    depression,
    crisis,
    positive
  };
};
var TRIGGER_PATTERNS = {
  driving_anxiety: [/\bdriv(?:ing|e)\b/i, /\btraffic\b/i, /\bintersection\b/i, /\bhighway\b/i],
  work: [/\bwork\b/i, /\bjob\b/i, /\bboss\b/i, /\boffice\b/i, /\bmeeting\b/i, /\bdeadline\b/i],
  social: [/\bsocial\b/i, /\bcrowd\b/i, /\bpublic speaking\b/i, /\bparty\b/i, /\bbeing around people\b/i],
  health: [/\bdoctor\b/i, /\bhospital\b/i, /\bmedical\b/i, /\bsymptom\b/i, /\bdiagnos/i, /\bhealth\b/i],
  financial: [/\bmoney\b/i, /\bbills?\b/i, /\bdebt\b/i, /\brent\b/i, /\bpaycheck\b/i, /\bsavings\b/i],
  relationships: [/\brelationship\b/i, /\bpartner\b/i, /\bhusband\b/i, /\bwife\b/i, /\bboyfriend\b/i, /\bgirlfriend\b/i, /\bmarriage\b/i, /\bdivorce\b/i, /\bbreak ?up\b/i, /\bcheat(?:ed|ing)?\b/i],
  performance: [/\btest\b/i, /\bexam\b/i, /\binterview\b/i, /\bgrades?\b/i, /\baudition\b/i, /\bperformance review\b/i],
  future_uncertainty: [/\bfuture\b/i, /\buncertain\b/i, /\bdon't know what to do\b/i, /\bno idea what comes next\b/i, /\bplan\b/i, /\bdecision\b/i]
};
var detectAnxietyTriggers = (message) => {
  const normalized = normalizeMessage(message);
  const triggers = [];
  for (const [trigger, patterns] of Object.entries(TRIGGER_PATTERNS)) {
    if (patterns.some((pattern) => pattern.test(normalized))) {
      triggers.push(trigger);
    }
  }
  return triggers;
};

// shared/mentalHealth/psychosis.ts
var SURVEILLANCE_TERMS = [
  "following me",
  "following us",
  "after me",
  "after us",
  "watching me",
  "watching us",
  "tracking me",
  "tracking us",
  "spying on me",
  "spying on us",
  "bugging me",
  "bugging us"
];
var AGENCY_REGEX = /\b(cia|fbi|nsa|mi6|mossad|agents?|spies|intelligence agency)\b/i;
var DIRECT_KEYWORDS = [
  /\bhallucinat(?:e|ing|ion|ions)\b/i,
  /\bpsychosis\b/i,
  /\bpsychotic\b/i,
  /\bdelusion(?:s)?\b/i,
  /\bparanoi[ad]\b/i,
  /\bschizophren(?:ia|ic)\b/i
];
var CONTEXT_PATTERNS = [
  /hearing\s+(?:voices?|things|whispers|someone)\b/i,
  /voices?\s+(?:in\s+my\s+head|talking\s+to\s+me|telling\s+me)\b/i,
  /seeing\s+(?:things?|people|shadows|figures|creatures)\s+(?:that\s+)?(?:aren't|are not|isn't|is not|nobody else is|no one else is|others aren't)\s+(?:seeing|there)/i,
  /seeing\s+(?:things?|people|shadows|figures|creatures)\s+(?:no\s+one\s+else|nobody\s+else|others)\s+(?:can|does)/i,
  /(?:someone|people|they|he|she)\s+(?:following|chasing|watching|stalking|hunting)\s+(?:me|us)/i,
  /feel\s+like\s+(?:someone|they|people)\s+(?:are\s+)?(?:watching|following|after)\s+(?:me|us)/i,
  /objects?\s+(?:moving|shifting|breathing|melting)\s+on\s+their\s+own/i,
  /things\s+(?:that\s+)?(?:aren't|are not|isn't|is not)\s+real\b/i,
  /(?:shadows|figures)\s+that\s+(?:aren't|are not)\s+there/i,
  /(?:people|voices)\s+others\s+can't\s+hear/i
];
var WINDOW_SIZE = 4;
var normalizeForWindowSearch = (text2) => text2.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9\s']/g, " ").replace(/\s+/g, " ").trim();
var tokenize = (text2) => (text2 ? text2.split(" ") : []).filter(Boolean);
var hasSurveillanceAgencyContext = (text2) => {
  if (!AGENCY_REGEX.test(text2)) {
    return false;
  }
  const normalized = normalizeForWindowSearch(text2);
  const tokens = tokenize(normalized);
  const agencyIndices = tokens.map((token, index) => ({ token, index })).filter(({ token }) => /^(cia|fbi|nsa|mi6|mossad|agent|agents|spy|spies|intelligence|agency)$/.test(token)).map(({ index }) => index);
  if (agencyIndices.length === 0) {
    return false;
  }
  const surveillanceTokens = SURVEILLANCE_TERMS.map((term) => term.split(" "));
  for (const agencyIndex of agencyIndices) {
    const windowStart = Math.max(0, agencyIndex - WINDOW_SIZE);
    const windowEnd = Math.min(tokens.length, agencyIndex + WINDOW_SIZE + 1);
    const windowTokens = tokens.slice(windowStart, windowEnd);
    const windowText = windowTokens.join(" ");
    for (const termTokens of surveillanceTokens) {
      const phrase = termTokens.join(" ");
      if (windowText.includes(phrase)) {
        return true;
      }
    }
  }
  return false;
};
var detectPsychosisIndicators = (message) => {
  const matches = [];
  let score = 0;
  for (const pattern of DIRECT_KEYWORDS) {
    if (pattern.test(message)) {
      matches.push(pattern.source);
      score += 3;
    }
  }
  for (const pattern of CONTEXT_PATTERNS) {
    if (pattern.test(message)) {
      matches.push(pattern.source);
      score += 2;
    }
  }
  if (hasSurveillanceAgencyContext(message)) {
    matches.push("agency+surveillance");
    score += 3;
  }
  const hasIndicators = score >= 3;
  let confidence = "low";
  if (!hasIndicators) {
    return { hasIndicators: false, matches: [], confidence: "low" };
  }
  if (score >= 7) {
    confidence = "high";
  } else if (score >= 4) {
    confidence = "medium";
  }
  return {
    hasIndicators,
    matches,
    confidence
  };
};

// server/routes.ts
init_schema();
var LOG_SNIPPET_MAX_LENGTH = 200;
var createLogSnippet = (text2) => {
  const sanitized = text2.replace(/\s+/g, " ").trim();
  if (sanitized.length <= LOG_SNIPPET_MAX_LENGTH) {
    return sanitized;
  }
  return `${sanitized.slice(0, LOG_SNIPPET_MAX_LENGTH)}\u2026`;
};
var jsonrepair = (rawJson) => {
  let text2 = rawJson.trim();
  text2 = text2.replace(/[“”]/g, '"').replace(/[‘’]/g, "'");
  text2 = text2.replace(/,\s*([}\]])/g, "$1");
  text2 = text2.replace(/([{,]\s*)([A-Za-z0-9_]+)\s*:/g, '$1"$2":');
  text2 = text2.replace(/'([^'\\]*(?:\\.[^'\\]*)*)'/g, (_match, value) => {
    const escaped = String(value).replace(/\\/g, "\\\\").replace(/"/g, '\\"');
    return `"${escaped}"`;
  });
  text2 = text2.replace(/\bTrue\b/g, "true").replace(/\bFalse\b/g, "false").replace(/\bNone\b/g, "null");
  const openBraces = (text2.match(/\{/g) || []).length;
  const closeBraces = (text2.match(/\}/g) || []).length;
  if (openBraces > closeBraces) {
    text2 += "}".repeat(openBraces - closeBraces);
  }
  const openBrackets = (text2.match(/\[/g) || []).length;
  const closeBrackets = (text2.match(/\]/g) || []).length;
  if (openBrackets > closeBrackets) {
    text2 += "]".repeat(openBrackets - closeBrackets);
  }
  return text2;
};
var parseJsonWithRepair = (provider, rawJson) => {
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
var escapeHtml = (value) => {
  if (value === null || value === void 0) {
    return "";
  }
  return String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
};
var toDate = (value) => {
  if (value === null || value === void 0) {
    return null;
  }
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }
  const directDate = new Date(value);
  if (!Number.isNaN(directDate.getTime())) {
    return directDate;
  }
  const numericValue = typeof value === "string" ? Number(value) : value;
  if (typeof numericValue === "number" && Number.isFinite(numericValue)) {
    const fromNumber = new Date(numericValue);
    if (!Number.isNaN(fromNumber.getTime())) {
      return fromNumber;
    }
  }
  return null;
};
var formatDate = (value) => {
  const date = toDate(value);
  if (!date) {
    return "N/A";
  }
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric"
  }).format(date);
};
var formatDateRange = (start, end) => {
  const startFormatted = formatDate(start);
  const endFormatted = formatDate(end);
  if (startFormatted === "N/A" && endFormatted === "N/A") {
    return "Date not available";
  }
  if (endFormatted === "N/A") {
    return startFormatted;
  }
  return `${startFormatted} - ${endFormatted}`;
};
var extractAndParseJson = (provider, text2) => {
  const jsonMatch = text2.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    console.error(`[${provider}] No JSON object found in response. Snippet: ${createLogSnippet(text2)}`);
    return null;
  }
  return parseJsonWithRepair(provider, jsonMatch[0]);
};
async function registerRoutes(app2) {
  console.log("Registering authentication routes...");
  app2.use("/api/appointments", appointments_default);
  console.log("\u2705 Appointments routes registered");
  app2.post("/api/therapist/search-patient", async (req, res) => {
    try {
      const { email, patientCode } = req.body;
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
        res.status(404).json({ error: "Patient not found with provided email and code" });
      }
    } catch (error) {
      res.status(500).json({ error: "Search failed" });
    }
  });
  app2.get("/api/therapist/patient/:id/analytics", async (req, res) => {
    try {
      const patientId = req.params.id;
      const analyses = await storage.getAnxietyAnalysesByUser(patientId);
      const goals = await storage.getUserGoalsByUser(patientId);
      const interventions = await storage.getInterventionSummariesByUser(patientId);
      res.json({
        patientName: "Patient X",
        // Anonymized for HIPAA
        analysesCount: analyses.length,
        analyses,
        goals,
        interventions
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to load patient analytics" });
    }
  });
  app2.get("/api/patient/analytics", async (req, res) => {
    try {
      const { userId } = req.query;
      if (!userId) return res.status(400).json({ error: "userId required" });
      const [profile, analyses, messages, goals, summariesRaw] = await Promise.all([
        storage.getProfile(String(userId)),
        storage.getAnxietyAnalysesByUser(String(userId)),
        storage.getChatMessagesByUser(String(userId)),
        storage.getUserGoalsByUser(String(userId)),
        storage.getInterventionSummariesByUser(String(userId))
      ]);
      const summaries = (summariesRaw ?? []).map(normalizeInterventionSummary);
      return res.json({
        profile,
        analyses,
        messages,
        goals,
        summaries
        // ✅ same key + normalized
      });
    } catch (e) {
      console.error("Patient analytics error:", e);
      res.status(500).json({ error: "Failed to load analytics" });
    }
  });
  app2.get("/api/therapist/patient-analytics", async (req, res) => {
    try {
      const { patientId, therapistEmail } = req.query;
      if (!patientId || !therapistEmail) {
        return res.status(400).json({ error: "patientId and therapistEmail required" });
      }
      const profile = await storage.getProfile(patientId);
      const analyses = await storage.getAnxietyAnalysesByUser(patientId);
      const messages = await storage.getChatMessagesByUser(patientId);
      const goals = await storage.getUserGoalsByUser(patientId);
      const summariesRaw = await storage.getInterventionSummariesByUser(patientId);
      const summaries = (summariesRaw ?? []).map(normalizeInterventionSummary);
      const toStringArray = (value) => {
        if (!value) return [];
        if (Array.isArray(value)) {
          return value.map((item) => item == null ? "" : String(item).trim()).filter(Boolean);
        }
        if (typeof value === "string") {
          const trimmed = value.trim();
          if (!trimmed) return [];
          try {
            const parsed = JSON.parse(trimmed);
            if (Array.isArray(parsed)) {
              return parsed.map((item) => item == null ? "" : String(item).trim()).filter(Boolean);
            }
          } catch (error) {
          }
          return trimmed.split(/[\n,;•\-]+/).map((item) => item.trim()).filter(Boolean);
        }
        return [];
      };
      const enrichedAnalyses = analyses.map((analysis) => {
        const analysisDate = new Date(analysis.createdAt || analysis.created_at);
        const patientMessages = messages.filter((msg) => {
          if (msg.sender !== "user") return false;
          const msgDate = new Date(msg.createdAt || msg.created_at);
          const timeDiff = Math.abs(analysisDate.getTime() - msgDate.getTime());
          return timeDiff < 30 * 60 * 1e3;
        });
        const parsedAnalysis = {
          ...analysis,
          triggers: toStringArray(analysis.triggers ?? analysis.anxietyTriggers ?? analysis.anxiety_triggers),
          recommendedTechniques: toStringArray(analysis.recommendedTechniques ?? analysis.copingStrategies),
          copingStrategies: toStringArray(analysis.copingStrategies ?? analysis.recommendedTechniques),
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
        summaries
        // ✅ unified key with normalized data
      });
    } catch (error) {
      console.error("Therapist analytics error:", error);
      res.status(500).json({ error: "Failed to load patient analytics" });
    }
  });
  app2.get("/api/azure-speech-config", async (req, res) => {
    try {
      const azureSpeechKey = process.env.AZURE_SPEECH_KEY;
      const azureSpeechRegion = process.env.AZURE_SPEECH_REGION || "eastus";
      if (!azureSpeechKey) {
        return res.status(503).json({
          error: "Azure Speech-to-Text not configured",
          fallback: true
        });
      }
      res.json({
        key: azureSpeechKey,
        region: azureSpeechRegion
      });
    } catch (error) {
      console.error("Azure Speech config error:", error);
      res.status(500).json({ error: "Speech service error" });
    }
  });
  app2.post("/api/chat", async (req, res) => {
    try {
      const { message, userId, includeHistory } = req.body;
      const openaiKey = process.env.OPENAI_API_KEY;
      if (!openaiKey) {
        return res.status(503).json({ error: "OpenAI API not configured" });
      }
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${openaiKey}`
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
          messages: [{
            role: "user",
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
        throw new Error(errorData.error?.message || "AI service unavailable");
      }
    } catch (error) {
      console.error("Chat API error:", error);
      res.status(500).json({ error: "Failed to generate AI response" });
    }
  });
  app2.post("/api/therapist/chat", async (req, res) => {
    try {
      const { message, patientId, context } = req.body;
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": process.env.ANTHROPIC_API_KEY || "",
          "anthropic-version": "2023-06-01"
        },
        body: JSON.stringify({
          model: "claude-3-5-sonnet-20241022",
          max_tokens: 300,
          messages: [{
            role: "user",
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
  app2.get("/api/therapist/patient/:id/reports", async (req, res) => {
    try {
      const patientId = req.params.id;
      const reports = [
        {
          id: `history_${patientId}`,
          type: "download_history",
          title: "Download History Report",
          description: "Comprehensive anxiety analysis data and progress over time",
          generatedAt: (/* @__PURE__ */ new Date()).toISOString(),
          size: "2.3 MB"
        },
        {
          id: `summary_${patientId}`,
          type: "conversation_summary",
          title: "Conversation Summary Report",
          description: "Summarized chat interactions with key therapeutic insights",
          generatedAt: (/* @__PURE__ */ new Date()).toISOString(),
          size: "1.8 MB"
        }
      ];
      res.json(reports);
    } catch (error) {
      res.status(500).json({ error: "Failed to load reports" });
    }
  });
  app2.get("/api/therapist/reports/:id/content", async (req, res) => {
    try {
      const reportId = req.params.id;
      let content = "";
      if (reportId.includes("history")) {
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
      res.status(500).json({ error: "Failed to load report content" });
    }
  });
  app2.get("/api/therapist/patient/:id/treatment-plan", async (req, res) => {
    try {
      const patientId = req.params.id;
      const storedPlan = await storage.getTreatmentPlanByPatient(patientId);
      if (!storedPlan || !storedPlan.plan) {
        console.log("[TreatmentPlan] No plan found for patient", patientId);
        return res.json(null);
      }
      console.log("[TreatmentPlan] Returning plan for patient", patientId, "goals:", Array.isArray(storedPlan.plan?.goals) ? storedPlan.plan.goals.length : "n/a");
      res.json(storedPlan.plan);
    } catch (error) {
      console.error("Failed to load treatment plan:", error);
      res.status(500).json({ error: "Failed to load treatment plan" });
    }
  });
  app2.put("/api/therapist/patient/:id/treatment-plan", async (req, res) => {
    try {
      const patientId = req.params.id;
      const treatmentPlan = req.body;
      if (!treatmentPlan) {
        return res.status(400).json({ error: "Treatment plan payload required" });
      }
      console.log("[TreatmentPlan] Saving for patient", patientId, "goals:", Array.isArray(treatmentPlan?.goals) ? treatmentPlan.goals.length : "n/a");
      const result = await storage.upsertTreatmentPlan(patientId, treatmentPlan);
      await storage.syncTreatmentPlanGoals(patientId, treatmentPlan);
      res.json({ success: true, message: "Treatment plan saved successfully", updatedAt: result.updatedAt });
    } catch (error) {
      console.error("Failed to save treatment plan:", error);
      res.status(500).json({ error: "Failed to save treatment plan" });
    }
  });
  app2.post("/api/therapist-connections", async (req, res) => {
    try {
      const { therapistName, contactValue, shareReport, notes, patientEmail } = req.body;
      let patient;
      const invalidEmails = ["Patient email not available", "current-user-email", "Code not available", "", null, void 0];
      const isValidEmail = patientEmail && !invalidEmails.includes(patientEmail) && patientEmail.includes("@");
      if (isValidEmail) {
        patient = await storage.getProfileByEmail(patientEmail);
      }
      if (!patient) {
        const timestamp2 = Date.now();
        const demoEmail = `demo.patient.${timestamp2}@tranquiloo.test`;
        const demoPatientCode = `DEMO-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
        console.log(`\u{1F4DD} Creating demo patient for connection request: ${demoEmail} with code: ${demoPatientCode}`);
        patient = await storage.createProfile({
          email: demoEmail,
          firstName: "Demo",
          lastName: "Patient",
          patientCode: demoPatientCode,
          role: "user",
          emailVerified: true,
          // Pre-verify demo accounts
          authMethod: "email"
          // createdAt and updatedAt will be set by the database defaults
        });
        console.log(`\u2705 Demo patient created successfully with ID: ${patient.id}`);
      }
      console.log("\u{1F4DD} Creating HIPAA-compliant therapist connection:", {
        patientId: patient.id,
        therapistEmail: contactValue,
        shareReport,
        notes
      });
      const existingConnections = await storage.getPatientTherapistConnections(patient.id);
      const existingConnection = existingConnections.find(
        (conn) => conn.therapistEmail === contactValue
      );
      if (existingConnection) {
        console.log("\u26A0\uFE0F Connection already exists:", existingConnection.id);
        return res.json({
          success: true,
          message: "Connection already exists",
          connection: existingConnection,
          alreadyExists: true
        });
      }
      const connection = await storage.createTherapistPatientConnection({
        patientId: patient.id,
        therapistEmail: contactValue,
        patientEmail: patient.email,
        patientCode: patient.patientCode || "",
        patientConsentGiven: true,
        // Patient explicitly requested connection
        therapistAccepted: false,
        // Therapist must accept connection
        shareAnalytics: shareReport === "yes",
        shareReports: shareReport === "yes",
        notes: notes || ""
      });
      const protocol = req.protocol;
      const host = req.get("host");
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
        emailType: "connection_request",
        metadata: JSON.stringify({
          connectionId: connection.id,
          patientId: patient.id,
          therapistName,
          requestedAt: (/* @__PURE__ */ new Date()).toISOString()
        })
      });
      console.log(`\u{1F4E7} HIPAA-compliant email notification created for ${therapistName} at ${contactValue}`);
      console.log(`\u{1F4CA} Share report: ${shareReport === "yes" ? "Yes" : "No"}`);
      res.json({
        success: true,
        message: "HIPAA-compliant connection request sent successfully - therapist will be notified",
        connectionId: connection.id
      });
    } catch (error) {
      console.error("Error creating therapist connection:", error);
      res.status(500).json({
        success: false,
        error: "Failed to send connection request: " + error.message
      });
    }
  });
  app2.get("/api/therapist-connections", async (req, res) => {
    try {
      const { patientId } = req.query;
      if (!patientId) {
        return res.status(400).json({ error: "Patient ID is required" });
      }
      const connections = await storage.getPatientTherapistConnections(patientId);
      res.json(connections);
    } catch (error) {
      console.error("Failed to fetch therapist connections:", error);
      res.status(500).json({ error: "Failed to fetch connections" });
    }
  });
  app2.get("/api/therapist/:therapistEmail/patients", async (req, res) => {
    try {
      const { therapistEmail } = req.params;
      const connections = await storage.getTherapistPatientConnections(therapistEmail);
      const patientsWithDetails = await Promise.all(
        connections.map(async (connection) => {
          const patient = await storage.getProfile(connection.patientId);
          const patientDetails = patient;
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
            shareReports: connection.shareReports
          };
        })
      );
      res.json(patientsWithDetails);
    } catch (error) {
      console.error("Failed to fetch therapist patients:", error);
      res.status(500).json({ error: "Failed to fetch patients" });
    }
  });
  app2.post("/api/therapist/connection/:connectionId/respond", async (req, res) => {
    try {
      const { connectionId } = req.params;
      const { action } = req.body;
      if (!["accept", "reject"].includes(action)) {
        return res.status(400).json({ error: 'Invalid action. Must be "accept" or "reject"' });
      }
      const connection = await storage.getTherapistPatientConnection(connectionId);
      if (!connection) {
        return res.status(404).json({ error: "Connection not found" });
      }
      if (action === "accept") {
        await storage.updateTherapistPatientConnection(connectionId, {
          therapistAccepted: true,
          isActive: true,
          connectionAcceptedDate: Date.now()
        });
        await storage.updateEmailNotificationStatus(connectionId, "processed");
        const patient = await storage.getProfile(connection.patientId);
        const patientDetails = patient;
        res.json({
          success: true,
          message: "Patient connection accepted",
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
        await storage.updateTherapistPatientConnection(connectionId, {
          therapistAccepted: false,
          isActive: false
        });
        await storage.updateEmailNotificationStatus(connectionId, "processed");
        res.json({
          success: true,
          message: "Patient connection declined",
          connection: { ...connection, therapistAccepted: false, isActive: false }
        });
      }
    } catch (error) {
      console.error("Failed to respond to connection:", error);
      res.status(500).json({ error: "Failed to process connection response" });
    }
  });
  app2.post("/api/therapist/share-analytics", async (req, res) => {
    try {
      const { userId } = req.body;
      if (!userId) {
        return res.status(400).json({
          success: false,
          message: "Missing userId - please sign in again and retry."
        });
      }
      const profile = await storage.getProfile(userId);
      if (!profile) {
        return res.status(404).json({
          success: false,
          message: "We could not find your profile. Please refresh and try again."
        });
      }
      const therapistConnections = await storage.getUserTherapistsByUser(userId);
      const shareableTherapists = (therapistConnections || []).filter((connection) => {
        if (connection?.isActive === false) {
          return false;
        }
        if (connection?.shareReport === false) {
          return false;
        }
        return connection?.contactMethod === "email" && Boolean(connection?.contactValue);
      });
      if (shareableTherapists.length === 0) {
        return res.status(400).json({
          success: false,
          message: "No therapist connections with sharing enabled. Visit \u201CContact Therapist\u201D to invite your therapist."
        });
      }
      const [analyses, sessions, summaries] = await Promise.all([
        storage.getAnxietyAnalysesByUser(userId),
        storage.getChatSessionsByUser(userId),
        storage.getInterventionSummariesByUser(userId)
      ]);
      const normalizeTriggerList = (input) => {
        if (!input) {
          return [];
        }
        if (Array.isArray(input)) {
          return input.filter(Boolean).map((item) => String(item).trim()).filter(Boolean);
        }
        if (typeof input === "string") {
          return input.split(",").map((item) => item.trim()).filter(Boolean);
        }
        return [];
      };
      const normalizeStrategyList = (analysis) => {
        if (!analysis) {
          return [];
        }
        if (Array.isArray(analysis.copingStrategies)) {
          return analysis.copingStrategies.map((item) => String(item).trim()).filter(Boolean);
        }
        if (Array.isArray(analysis.recommendedInterventions)) {
          return analysis.recommendedInterventions.map((item) => String(item).trim()).filter(Boolean);
        }
        if (typeof analysis.copingStrategies === "string") {
          return analysis.copingStrategies.split(",").map((item) => item.trim()).filter(Boolean);
        }
        if (typeof analysis.recommendedInterventions === "string") {
          return analysis.recommendedInterventions.split(",").map((item) => item.trim()).filter(Boolean);
        }
        return [];
      };
      const normalizedAnalyses = (analyses || []).map((analysis) => {
        const anxietyLevelValue = analysis?.anxietyLevel ?? analysis?.anxiety_level ?? null;
        const levelNumber = Number(anxietyLevelValue);
        return {
          anxietyLevel: Number.isFinite(levelNumber) ? levelNumber : null,
          createdAt: toDate(
            analysis?.createdAt ?? analysis?.created_at ?? analysis?.updatedAt ?? analysis?.timestamp ?? analysis?.time ?? analysis?.date ?? null
          ),
          triggers: normalizeTriggerList(
            analysis?.anxietyTriggers ?? analysis?.triggers ?? analysis?.triggerList ?? []
          ),
          personalizedResponse: analysis?.personalizedResponse ?? analysis?.personalized_response ?? "",
          copingStrategies: normalizeStrategyList(analysis)
        };
      }).filter((analysis) => Boolean(analysis.createdAt));
      normalizedAnalyses.sort((a, b) => {
        const aTime = a.createdAt ? a.createdAt.getTime() : 0;
        const bTime = b.createdAt ? b.createdAt.getTime() : 0;
        return bTime - aTime;
      });
      const analysisCount = normalizedAnalyses.length;
      const averageAnxiety = analysisCount ? Number((normalizedAnalyses.reduce((total, current) => total + (current.anxietyLevel ?? 0), 0) / analysisCount).toFixed(1)) : null;
      const latestAnalysis = normalizedAnalyses[0];
      const triggerFrequency = /* @__PURE__ */ new Map();
      normalizedAnalyses.slice(0, 30).forEach((analysis) => {
        analysis.triggers.forEach((trigger) => {
          const key = trigger || "General anxiety";
          triggerFrequency.set(key, (triggerFrequency.get(key) || 0) + 1);
        });
      });
      const topTriggers = Array.from(triggerFrequency.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([trigger]) => trigger);
      const strategyFrequency = /* @__PURE__ */ new Map();
      normalizedAnalyses.slice(0, 30).forEach((analysis) => {
        analysis.copingStrategies.forEach((strategy) => {
          const key = strategy || "General coping strategy";
          strategyFrequency.set(key, (strategyFrequency.get(key) || 0) + 1);
        });
      });
      const topStrategies = Array.from(strategyFrequency.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([strategy]) => strategy);
      const lastSessionDate = sessions.map((session) => toDate(session?.updatedAt ?? session?.createdAt ?? session?.created_at)).filter((value) => Boolean(value)).sort((a, b) => b.getTime() - a.getTime())[0] || null;
      const recentSummaries = (summaries || []).filter((summary) => Boolean(summary?.weekStart || summary?.weekEnd || summary?.keyPoints)).sort((a, b) => {
        const aDate = toDate(a?.weekEnd ?? a?.weekStart ?? 0)?.getTime() || 0;
        const bDate = toDate(b?.weekEnd ?? b?.weekStart ?? 0)?.getTime() || 0;
        return bDate - aDate;
      }).slice(0, 3);
      const displayName = [profile?.firstName, profile?.lastName].filter(Boolean).join(" ").trim() || profile?.email || "Your patient";
      const patientCode = profile?.patientCode || "Not provided";
      const patientEmail = profile?.email || "Not provided";
      const reportGeneratedAt = /* @__PURE__ */ new Date();
      const buildReportHtml = (therapistName) => {
        const greeting = therapistName ? `Hi ${escapeHtml(therapistName)},` : "Hello,";
        const keyMetrics = [
          `<li><strong>Average anxiety level:</strong> ${averageAnxiety !== null ? `${averageAnxiety}/10` : "Not enough data yet"}</li>`,
          `<li><strong>Total sessions logged:</strong> ${sessions?.length || 0}</li>`,
          `<li><strong>Last session recorded:</strong> ${lastSessionDate ? formatDate(lastSessionDate) : "No sessions recorded yet"}</li>`
        ];
        const latestAnalysisBlock = latestAnalysis ? `
            <h3 style="margin-top: 24px; color: #0f172a;">Latest AI insight (${formatDate(latestAnalysis.createdAt)})</h3>
            <ul style="padding-left: 18px; margin: 12px 0; color: #111827;">
              <li><strong>Anxiety level:</strong> ${latestAnalysis.anxietyLevel !== null ? `${latestAnalysis.anxietyLevel}/10` : "Not captured"}</li>
              ${topTriggers.length ? `<li><strong>Top triggers observed:</strong> ${topTriggers.map((trigger) => escapeHtml(trigger)).join(", ")}</li>` : ""}
              ${topStrategies.length ? `<li><strong>Effective interventions:</strong> ${topStrategies.map((strategy) => escapeHtml(strategy)).join(", ")}</li>` : ""}
              ${latestAnalysis.personalizedResponse ? `<li><strong>AI summary:</strong> ${escapeHtml(latestAnalysis.personalizedResponse)}</li>` : ""}
            </ul>
          ` : `
            <h3 style="margin-top: 24px; color: #0f172a;">Latest AI insight</h3>
            <p style="color: #4b5563;">No AI analyses have been logged yet. Encourage your patient to complete additional sessions.</p>
          `;
        const summariesBlock = recentSummaries.length ? `
            <h3 style="margin-top: 24px; color: #0f172a;">Weekly progress highlights</h3>
            <ul style="padding-left: 18px; margin: 12px 0; color: #111827;">
              ${recentSummaries.map((summary) => `
                <li>
                  <strong>${formatDateRange(summary?.weekStart, summary?.weekEnd)}:</strong>
                  ${summary?.keyPoints ? escapeHtml(summary.keyPoints) : "No summary recorded"}
                </li>
              `).join("")}
            </ul>
          ` : "";
        const triggersBlock = topTriggers.length ? `
            <h3 style="margin-top: 24px; color: #0f172a;">Most common triggers observed</h3>
            <ul style="padding-left: 18px; margin: 12px 0; color: #111827;">
              ${topTriggers.map((trigger) => `<li>${escapeHtml(trigger)}</li>`).join("")}
            </ul>
          ` : "";
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
              ${keyMetrics.join("")}
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
          emailType: "therapist_report",
          metadata: JSON.stringify(metadata)
        });
        console.log(`\u{1F4E4} Queued therapist analytics email for ${therapist.contactValue}`);
      }
      return res.json({
        success: true,
        message: shareableTherapists.length === 1 ? `Shared your analytics with ${shareableTherapists[0].therapistName || "your therapist"}.` : `Shared your analytics with ${shareableTherapists.length} therapists.`
      });
    } catch (error) {
      console.error("Error sharing analytics with therapist:", error);
      return res.status(500).json({
        success: false,
        message: "We could not send the report right now. Please try again later."
      });
    }
  });
  app2.get("/verify-email", async (req, res) => {
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
      const verifiedProfile = await storage.verifyEmail(token);
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
      console.error("Email verification error:", error);
      res.status(500).send(`
        <div style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
          <h2 style="color: #ef4444;">Verification Error</h2>
          <p>An error occurred during verification. Please try again later.</p>
        </div>
      `);
    }
  });
  app2.post("/api/auth/forgot-password", async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({
          success: false,
          error: { code: "MISSING_EMAIL", message: "Email address is required" }
        });
      }
      const profile = await storage.getProfileByEmail(email);
      if (!profile) {
        return res.json({
          success: true,
          message: "If an account with this email exists, a password reset link has been sent."
        });
      }
      const resetToken = randomBytes(32).toString("hex");
      const expires = new Date(Date.now() + 36e5);
      await storage.setPasswordResetToken(email, resetToken, expires);
      const resetUrl = `${req.protocol}://${req.get("host")}/reset-password?token=${resetToken}`;
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
        subject: "Password Reset Request - Tranquil Support",
        htmlContent: emailContent,
        emailType: "password_reset",
        metadata: JSON.stringify({
          userId: profile.id,
          resetToken
        })
      });
      res.json({
        success: true,
        message: "If an account with this email exists, a password reset link has been sent."
      });
    } catch (error) {
      console.error("Password reset error:", error);
      res.status(500).json({
        success: false,
        error: { code: "SERVER_ERROR", message: "Failed to process password reset request" }
      });
    }
  });
  app2.post("/api/recommend-app", async (req, res) => {
    try {
      const { recipientEmail, senderName, personalMessage } = req.body;
      if (!recipientEmail) {
        return res.status(400).json({
          success: false,
          error: { code: "MISSING_EMAIL", message: "Recipient email is required" }
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
            ${senderName ? `<p style="color: #6b7280;"><strong>${senderName}</strong> thinks you might find Tranquil Support helpful.</p>` : ""}
            
            ${personalMessage ? `
              <div style="background: white; padding: 15px; border-left: 4px solid #10b981; margin: 15px 0;">
                <p style="color: #374151; margin: 0; font-style: italic;">"${personalMessage}"</p>
              </div>
            ` : ""}
            
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
              <a href="${req.protocol}://${req.get("host")}/signup" 
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
        subject: `${senderName ? senderName + " recommended" : "Someone recommended"} Tranquil Support for you`,
        htmlContent: emailContent,
        emailType: "app_recommendation",
        metadata: JSON.stringify({
          senderName: senderName || "Anonymous",
          personalMessage
        })
      });
      res.json({
        success: true,
        message: "App recommendation sent successfully!"
      });
    } catch (error) {
      console.error("App recommendation error:", error);
      res.status(500).json({
        success: false,
        error: { code: "SERVER_ERROR", message: "Failed to send app recommendation" }
      });
    }
  });
  app2.get("/api/debug/emails", async (req, res) => {
    try {
      const emails = await storage.getPendingEmails();
      const recentEmails = emails.map((email) => ({
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
      console.error("Debug emails error:", error);
      res.status(500).json({ error: "Failed to fetch emails" });
    }
  });
  app2.get("/api/therapist/notifications/:email", async (req, res) => {
    try {
      const therapistEmail = decodeURIComponent(req.params.email);
      const notifications = await storage.getEmailNotificationsByTherapist(therapistEmail);
      res.json({
        notifications,
        unreadCount: notifications.filter((n) => n.status === "pending").length
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to load notifications" });
    }
  });
  app2.get("/auth/test-config", (req, res) => {
    const forwardedProto = req.headers["x-forwarded-proto"]?.split(",")[0];
    const forwardedHost = req.headers["x-forwarded-host"];
    const protocol = forwardedProto || req.protocol;
    const host = forwardedHost || req.get("host");
    const base = `${protocol}://${host}`;
    const redirectUri = `${base}/auth/google/callback`;
    res.json({
      currentHost: host,
      detectedProtocol: protocol,
      forwardedProto,
      forwardedHost,
      fullBase: base,
      redirectUri,
      shouldMatch: "https://tranquiloo-app-arthrombus.replit.app/auth/google/callback"
    });
  });
  app2.post("/api/auth/signin", async (req, res) => {
    console.log("AUTH ENDPOINT HIT:", req.body);
    try {
      const { email, password, role = "patient", isSignIn } = req.body;
      console.log("Email authentication attempt:", { email, role, isSignIn });
      if (!email || !password) {
        return res.status(400).json({
          success: false,
          error: { code: "MISSING_FIELDS", message: "Email and password are required" }
        });
      }
      try {
        console.log("Looking for profile with email:", email, "isSignIn:", isSignIn);
        const existingProfile = await storage.getProfileByEmail(email);
        console.log("Found profile:", existingProfile ? existingProfile.email : "NOT FOUND");
        if (isSignIn === true) {
          if (!existingProfile) {
            return res.status(401).json({
              success: false,
              error: {
                code: "USER_NOT_FOUND",
                message: "No account found with this email. Please create an account first by using the sign-up option."
              }
            });
          }
          if (!existingProfile.hashedPassword && password !== "google-oauth") {
            return res.status(401).json({
              success: false,
              error: {
                code: "INVALID_AUTH_METHOD",
                message: "This account was created with Google. Please use Google sign-in."
              }
            });
          }
          if (password !== "google-oauth" && existingProfile.hashedPassword) {
            const isValidPassword = await bcrypt.compare(password, existingProfile.hashedPassword);
            if (!isValidPassword) {
              return res.status(401).json({
                success: false,
                error: {
                  code: "INVALID_CREDENTIALS",
                  message: "Invalid email or password"
                }
              });
            }
          }
          if (!existingProfile.emailVerified) {
            return res.status(403).json({
              success: false,
              error: {
                code: "EMAIL_NOT_VERIFIED",
                message: "Please verify your email address before signing in. Check your email for verification link."
              }
            });
          }
          return res.json({
            success: true,
            user: {
              id: existingProfile.id,
              email: existingProfile.email,
              username: existingProfile.email?.split("@")[0],
              role: existingProfile.role || "patient",
              // Always use the role from the database
              emailVerified: existingProfile.emailVerified,
              patientCode: existingProfile.patientCode
            }
          });
        }
        if (existingProfile) {
          return res.status(400).json({
            success: false,
            error: {
              code: "USER_EXISTS",
              message: "An account already exists with this email. Please sign in instead."
            }
          });
        }
      } catch (err) {
        console.log("Profile lookup error:", err);
        if (isSignIn === true) {
          return res.status(401).json({
            success: false,
            error: {
              code: "USER_NOT_FOUND",
              message: "No account found with this email. Please sign up first."
            }
          });
        }
      }
      if (isSignIn !== true) {
        const hashedPassword = await bcrypt.hash(password, 10);
        const patientCode = "PT-" + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substr(2, 4).toUpperCase();
        const newUser = {
          email,
          firstName: req.body.firstName || null,
          lastName: req.body.lastName || null,
          role,
          hashedPassword,
          patientCode,
          emailVerified: false,
          authMethod: "email"
        };
        try {
          const createdProfile = await storage.createProfile(newUser);
          console.log("Created new user profile:", createdProfile.id);
          const verificationToken = randomBytes(32).toString("hex");
          await storage.updateProfileVerification(createdProfile.id, verificationToken);
          const forwardedProto = req.headers["x-forwarded-proto"]?.split(",")[0];
          const forwardedHost = req.headers["x-forwarded-host"];
          const protocol = forwardedProto || req.protocol;
          const host = forwardedHost || req.get("host");
          const verificationUrl = `${protocol}://${host}/verify-email?token=${verificationToken}`;
          if (role === "therapist") {
            await emailService.sendTherapistVerificationEmail(
              createdProfile.email,
              req.body.firstName || "Therapist",
              verificationToken,
              verificationUrl
            );
            return res.json({
              success: true,
              message: "Therapist account created successfully. Please check your email to verify your account before signing in."
            });
          } else {
            const verificationUrl2 = `${req.protocol}://${req.get("host")}/verify-email?token=${verificationToken}`;
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
                  <a href="${verificationUrl2}" 
                     style="display: inline-block; background: #10b981; color: white; padding: 12px 30px; 
                            text-decoration: none; border-radius: 6px; font-weight: 600;">
                    Verify Email Address
                  </a>
                </div>
                
                <p style="color: #9ca3af; font-size: 14px;">
                  If the button doesn't work, copy and paste this link into your browser:<br>
                  <span style="word-break: break-all;">${verificationUrl2}</span>
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
              toEmail: createdProfile.email,
              subject: "Please verify your email - Tranquiloo",
              htmlContent: emailContent,
              emailType: "email_verification",
              metadata: JSON.stringify({
                userId: createdProfile.id,
                verificationToken
              })
            });
          }
          return res.json({
            success: true,
            user: {
              id: createdProfile.id,
              email: createdProfile.email,
              username: createdProfile.email?.split("@")[0],
              role: createdProfile.role,
              emailVerified: false,
              patientCode: createdProfile.patientCode
            },
            message: "Account created successfully. Please check your email to verify your account."
          });
        } catch (err) {
          console.error("Profile creation failed:", err);
          return res.status(500).json({
            success: false,
            error: { code: "PROFILE_CREATION_FAILED", message: "Failed to create user profile" }
          });
        }
      } else {
        return res.status(400).json({
          success: false,
          error: { code: "INVALID_REQUEST", message: "Invalid authentication request" }
        });
      }
    } catch (error) {
      console.error("Authentication error:", error);
      return res.status(500).json({
        success: false,
        error: { code: "SERVER_ERROR", message: "Authentication failed. Please try again." }
      });
    }
  });
  app2.post("/api/auth/forgot-password", async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({
          success: false,
          error: { code: "MISSING_EMAIL", message: "Email address is required" }
        });
      }
      const existingProfile = await storage.getProfileByEmail(email);
      if (!existingProfile) {
        return res.json({
          success: true,
          message: "If an account exists with this email, a reset link has been sent."
        });
      }
      const resetToken = randomBytes(32).toString("hex");
      await storage.updateProfileVerification(existingProfile.id, resetToken);
      const resetUrl = `${req.protocol}://${req.get("host")}/reset-password?token=${resetToken}`;
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
        subject: "Reset Your Password - Tranquiloo",
        htmlContent: emailContent,
        emailType: "password_reset",
        metadata: JSON.stringify({ resetToken })
      });
      return res.json({
        success: true,
        message: "If an account exists with this email, a reset link has been sent."
      });
    } catch (error) {
      console.error("Forgot password error:", error);
      return res.status(500).json({
        success: false,
        error: { code: "SERVER_ERROR", message: "Failed to process request. Please try again." }
      });
    }
  });
  app2.post("/api/auth/google-signin", async (req, res) => {
    try {
      const { googleCredential, role = "patient" } = req.body;
      if (!googleCredential) {
        return res.status(400).json({
          success: false,
          error: { code: "MISSING_CREDENTIAL", message: "Google credential is required" }
        });
      }
      let payload;
      try {
        const parts = googleCredential.split(".");
        if (parts.length !== 3) {
          throw new Error("Invalid JWT format");
        }
        payload = JSON.parse(atob(parts[1]));
      } catch (error) {
        return res.status(400).json({
          success: false,
          error: { code: "INVALID_CREDENTIAL", message: "Invalid Google credential" }
        });
      }
      const email = payload.email;
      const firstName = payload.given_name || payload.name?.split(" ")[0];
      const lastName = payload.family_name || payload.name?.split(" ").slice(1).join(" ");
      try {
        const existingProfile = await storage.getProfileByEmail(email);
        if (existingProfile) {
          if (!existingProfile.emailVerified) {
            return res.status(403).json({
              success: false,
              error: {
                code: "EMAIL_NOT_VERIFIED",
                message: "Please verify your email address before signing in. Check your email for verification link."
              }
            });
          }
          return res.json({
            success: true,
            user: {
              id: existingProfile.id,
              email: existingProfile.email,
              username: existingProfile.email?.split("@")[0],
              role: existingProfile.role || role,
              emailVerified: existingProfile.emailVerified,
              patientCode: existingProfile.patientCode
            }
          });
        }
      } catch (err) {
        console.log("Profile lookup error (will create new user):", err);
      }
      const patientCode = "PT-" + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substr(2, 4).toUpperCase();
      const newUser = {
        email,
        firstName: firstName || null,
        lastName: lastName || null,
        role,
        patientCode,
        authMethod: "google",
        emailVerified: false
      };
      try {
        const createdProfile = await storage.createProfile(newUser);
        console.log("Created new Google OAuth user profile:", createdProfile.id);
        const verificationToken = randomBytes(32).toString("hex");
        await storage.updateProfileVerification(createdProfile.id, verificationToken);
        if (role === "therapist") {
          const emailResponse = await emailService.sendTherapistWelcomeEmail(
            createdProfile.email,
            createdProfile.firstName || "Therapist",
            verificationToken
          );
          if (emailResponse.success) {
            console.log("Therapist verification email sent to:", createdProfile.email);
          }
        } else {
          const emailResponse = await emailService.sendVerificationEmail(
            createdProfile.email,
            createdProfile.firstName || "User",
            verificationToken
          );
          if (emailResponse.success) {
            console.log("Patient verification email sent to:", createdProfile.email);
          }
        }
        return res.json({
          success: true,
          message: "Account created! Please check your email to verify your account.",
          requiresVerification: true,
          user: {
            id: createdProfile.id,
            email: createdProfile.email,
            username: createdProfile.email?.split("@")[0],
            role: createdProfile.role,
            emailVerified: false,
            // Google OAuth users still need to verify
            patientCode: createdProfile.patientCode
          }
        });
      } catch (err) {
        console.error("Google OAuth profile creation failed:", err);
        return res.status(500).json({
          success: false,
          error: { code: "PROFILE_CREATION_FAILED", message: "Failed to create user profile" }
        });
      }
    } catch (error) {
      console.error("Google OAuth authentication error:", error);
      return res.status(500).json({
        success: false,
        error: { code: "SERVER_ERROR", message: "Google authentication failed. Please try again." }
      });
    }
  });
  app2.post("/api/auth/manual-verify", async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({
          success: false,
          error: { code: "MISSING_EMAIL", message: "Email address is required" }
        });
      }
      const profile = await storage.getProfileByEmail(email);
      if (!profile) {
        return res.status(404).json({
          success: false,
          error: { code: "USER_NOT_FOUND", message: "No account found with this email" }
        });
      }
      await storage.updateProfileVerification(profile.id, null, true);
      return res.json({
        success: true,
        message: "Email manually verified successfully"
      });
    } catch (error) {
      console.error("Manual verification error:", error);
      return res.status(500).json({
        success: false,
        error: { code: "SERVER_ERROR", message: "Failed to verify email" }
      });
    }
  });
  app2.post("/api/auth/resend-verification", async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({
          success: false,
          error: { code: "MISSING_EMAIL", message: "Email address is required" }
        });
      }
      const profile = await storage.getProfileByEmail(email);
      if (!profile) {
        return res.status(404).json({
          success: false,
          error: { code: "USER_NOT_FOUND", message: "No account found with this email" }
        });
      }
      if (profile.emailVerified) {
        return res.json({
          success: true,
          message: "Email is already verified"
        });
      }
      const verificationToken = randomBytes(32).toString("hex");
      await storage.updateProfileVerification(profile.id, verificationToken);
      const forwardedProto = req.headers["x-forwarded-proto"]?.split(",")[0];
      const forwardedHost = req.headers["x-forwarded-host"];
      const protocol = forwardedProto || req.protocol;
      const host = forwardedHost || req.get("host");
      const verificationUrl = `${protocol}://${host}/verify-email?token=${verificationToken}`;
      if (profile.role === "therapist") {
        await emailService.sendTherapistVerificationEmail(
          profile.email,
          profile.firstName || "Therapist",
          verificationToken,
          verificationUrl
        );
      } else {
        await emailService.sendVerificationEmail(
          profile.email,
          profile.firstName || "User",
          verificationToken
        );
      }
      return res.json({
        success: true,
        message: "Verification email sent successfully"
      });
    } catch (error) {
      console.error("Resend verification error:", error);
      return res.status(500).json({
        success: false,
        error: { code: "SERVER_ERROR", message: "Failed to resend verification email" }
      });
    }
  });
  app2.get("/auth/google", (req, res) => {
    const clientId = process.env.VITE_GOOGLE_CLIENT_ID || process.env.GOOGLE_OAUTH_CLIENT_ID;
    console.log("OAuth initiation - Using Client ID:", clientId ? clientId.substring(0, 20) + "..." : "NOT SET");
    const forwardedProto = req.headers["x-forwarded-proto"]?.split(",")[0] || "https";
    const forwardedHost = req.headers["x-forwarded-host"] || req.headers.host;
    const replitDomains = process.env.REPLIT_DOMAINS;
    const protocol = replitDomains ? "https" : forwardedProto;
    const host = replitDomains || forwardedHost || req.get("host");
    const redirectUri = `${protocol}://${host}/auth/google/callback`;
    if (!clientId) {
      return res.redirect("/login?error=server_config");
    }
    const role = req.query.role || "patient";
    const returnUrl = req.query.returnUrl || "/dashboard";
    const state = encodeURIComponent(JSON.stringify({
      role,
      returnUrl,
      isSignUp: true
    }));
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: "openid email profile",
      access_type: "offline",
      prompt: "select_account",
      state
    });
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
    console.log("Redirecting to Google OAuth with redirect_uri:", redirectUri);
    res.redirect(authUrl);
  });
  app2.get("/auth/google/callback", async (req, res) => {
    try {
      const { code, state } = req.query;
      if (!code) {
        return res.redirect("/login?error=oauth_failed");
      }
      let userState = { role: "patient", isSignUp: false, returnUrl: "/dashboard" };
      if (state && typeof state === "string") {
        try {
          userState = JSON.parse(decodeURIComponent(state));
        } catch (e) {
          console.error("Failed to parse OAuth state:", e);
        }
      }
      const clientId = process.env.VITE_GOOGLE_CLIENT_ID || process.env.GOOGLE_OAUTH_CLIENT_ID;
      const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
      console.log("OAuth callback - Using Client ID:", clientId ? clientId.substring(0, 20) + "..." : "NOT SET");
      const forwardedProto = req.headers["x-forwarded-proto"]?.split(",")[0] || "https";
      const forwardedHost = req.headers["x-forwarded-host"] || req.headers.host;
      const replitDomains = process.env.REPLIT_DOMAINS;
      const protocol = replitDomains ? "https" : forwardedProto;
      const host = replitDomains || forwardedHost || req.get("host");
      const redirectUri = `${protocol}://${host}/auth/google/callback`;
      if (!clientId || !clientSecret) {
        console.error("Google OAuth not configured: set GOOGLE_OAUTH_CLIENT_ID and GOOGLE_OAUTH_CLIENT_SECRET");
        return res.redirect("/login?error=server_config");
      }
      const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          code,
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirectUri,
          grant_type: "authorization_code"
        })
      });
      const tokens = await tokenResponse.json();
      if (!tokens.access_token) {
        return res.redirect("/login?error=token_failed");
      }
      const userResponse = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
        headers: { Authorization: `Bearer ${tokens.access_token}` }
      });
      const googleUser = await userResponse.json();
      let existingProfile = null;
      try {
        existingProfile = await storage.getProfileByEmail(googleUser.email);
      } catch (err) {
        console.log("Profile lookup error:", err);
      }
      const origin = `${protocol}://${host}`;
      if (existingProfile) {
        if (!existingProfile.emailVerified) {
          return res.redirect(`${origin}/login?error=verification_required&email=${encodeURIComponent(googleUser.email)}`);
        }
        const userData = {
          id: existingProfile.id,
          email: existingProfile.email,
          name: googleUser.name,
          picture: googleUser.picture,
          role: existingProfile.role,
          emailVerified: true,
          authMethod: "google"
        };
        if (existingProfile.role === "therapist" && !existingProfile.licenseNumber) {
          return res.redirect(`${origin}/therapist-license-verification`);
        }
        const redirectPath = existingProfile.role === "therapist" ? "/therapist-dashboard" : "/dashboard";
        const fullRedirectUrl = `${origin}${redirectPath}`;
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
      const { randomUUID: randomUUID3 } = await import("crypto");
      const patientCode = "PT-" + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substr(2, 4).toUpperCase();
      const nowMs = Date.now();
      const newProfile = await storage.createProfile({
        email: googleUser.email,
        firstName: googleUser.given_name || googleUser.name?.split(" ")[0] || null,
        lastName: googleUser.family_name || googleUser.name?.split(" ").slice(1).join(" ") || null,
        role: userState.role || "patient",
        patientCode: userState.role === "patient" ? patientCode : null,
        authMethod: "google",
        emailVerified: false
      });
      const verificationToken = randomBytes(32).toString("hex");
      await storage.updateProfileVerification(newProfile.id, verificationToken);
      const verificationUrl = `${protocol}://${host}/verify-email?token=${verificationToken}`;
      if (userState.role === "therapist") {
        await emailService.sendTherapistVerificationEmail(
          newProfile.email,
          newProfile.firstName || "Therapist",
          verificationToken,
          verificationUrl
        );
      } else {
        await emailService.sendVerificationEmail(
          newProfile.email,
          newProfile.firstName || "User",
          verificationToken
        );
      }
      if (userState.role === "therapist") {
        res.redirect(`${origin}/therapist-login?signup_success=true&email=${encodeURIComponent(googleUser.email)}`);
      } else {
        res.redirect(`${origin}/login?signup_success=true&email=${encodeURIComponent(googleUser.email)}`);
      }
    } catch (error) {
      console.error("OAuth callback error:", error);
      res.redirect("/login?error=oauth_error");
    }
  });
  app2.post("/api/therapist/license-verification", async (req, res) => {
    try {
      const { email, licenseNumber, state, skip } = req.body;
      if (!email) {
        return res.status(400).json({
          success: false,
          error: { code: "MISSING_EMAIL", message: "Email is required" }
        });
      }
      const profile = await storage.getProfileByEmail(email);
      if (!profile || profile.role !== "therapist") {
        return res.status(404).json({
          success: false,
          error: { code: "THERAPIST_NOT_FOUND", message: "Therapist profile not found" }
        });
      }
      if (skip === true) {
        const graceDeadline = new Date(Date.now() + 24 * 60 * 60 * 1e3);
        await storage.updateProfileLicenseInfo(profile.id, null, null, graceDeadline);
        const emailContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #dc3545;">License Verification Required</h2>
            <p>Dear ${profile.firstName || "Therapist"},</p>
            
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
              <a href="${req.protocol}://${req.get("host")}/therapist-dashboard" 
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
          toEmail: profile.email,
          subject: "License Verification Required - 24 Hour Notice",
          htmlContent: emailContent,
          emailType: "license_reminder",
          metadata: JSON.stringify({ therapistId: profile.id, deadline: graceDeadline })
        });
        return res.json({
          success: true,
          message: "License verification skipped. You have 24 hours to complete verification.",
          graceDeadline
        });
      } else {
        if (!licenseNumber || !state) {
          return res.status(400).json({
            success: false,
            error: { code: "MISSING_LICENSE_INFO", message: "License number and state are required" }
          });
        }
        await storage.updateProfileLicenseInfo(profile.id, licenseNumber, state);
        const emailContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #28a745;">License Verification Completed</h2>
            <p>Dear ${profile.firstName || "Therapist"},</p>
            
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
              <a href="${req.protocol}://${req.get("host")}/therapist-dashboard" 
                 style="display: inline-block; background: #007bff; color: white; padding: 12px 30px; 
                        text-decoration: none; border-radius: 6px; font-weight: 600;">
                Access Therapist Dashboard
              </a>
            </div>
          </div>
        `;
        await storage.createEmailNotification({
          toEmail: profile.email,
          subject: "License Verification Complete - Tranquil Support",
          htmlContent: emailContent,
          emailType: "license_verified",
          metadata: JSON.stringify({ therapistId: profile.id, licenseNumber, state })
        });
        return res.json({
          success: true,
          message: "License verification completed successfully"
        });
      }
    } catch (error) {
      console.error("License verification error:", error);
      return res.status(500).json({
        success: false,
        error: { code: "SERVER_ERROR", message: "Failed to process license verification" }
      });
    }
  });
  app2.get("/api/therapist/license-status/:email", async (req, res) => {
    try {
      const { email } = req.params;
      const profile = await storage.getProfileByEmail(decodeURIComponent(email));
      if (!profile || profile.role !== "therapist") {
        return res.status(404).json({
          success: false,
          error: { code: "THERAPIST_NOT_FOUND", message: "Therapist profile not found" }
        });
      }
      const hasLicense = !!profile.licenseNumber;
      const inGracePeriod = profile.licenseGraceDeadline && /* @__PURE__ */ new Date() < new Date(profile.licenseGraceDeadline);
      const graceExpired = profile.licenseGraceDeadline && /* @__PURE__ */ new Date() >= new Date(profile.licenseGraceDeadline);
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
      console.error("License status check error:", error);
      return res.status(500).json({
        success: false,
        error: { code: "SERVER_ERROR", message: "Failed to check license status" }
      });
    }
  });
  app2.post("/api/test-email", async (req, res) => {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }
    console.log(`Manual test: Sending verification email to ${email}`);
    try {
      const verificationToken = randomBytes(16).toString("hex");
      const emailResponse = await emailService.sendVerificationEmail(
        email,
        "Test User",
        verificationToken
      );
      res.json({
        success: emailResponse.success,
        message: emailResponse.success ? "Email sent successfully" : "Email failed to send",
        token: verificationToken
      });
    } catch (error) {
      console.error("Test email error:", error);
      res.status(500).json({ error: "Failed to send test email" });
    }
  });
  app2.get("/api/profiles/:id", async (req, res) => {
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
  app2.get("/api/profiles/by-email/:email", async (req, res) => {
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
  app2.post("/api/profiles", async (req, res) => {
    try {
      const validatedData = insertProfileSchema.parse(req.body);
      const profile = await storage.createProfile(validatedData);
      res.status(201).json(profile);
    } catch (error) {
      res.status(400).json({ error: "Invalid profile data", details: error.message });
    }
  });
  app2.put("/api/profiles/:id", async (req, res) => {
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
  app2.get("/api/chat-sessions", async (req, res) => {
    try {
      const sessions = await storage.getAllChatSessions();
      res.json(sessions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch chat sessions" });
    }
  });
  app2.get("/api/chat-sessions/:id", async (req, res) => {
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
  app2.get("/api/users/:userId/chat-sessions", async (req, res) => {
    try {
      const sessions = await storage.getChatSessionsByUser(req.params.userId);
      res.json(sessions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch chat sessions" });
    }
  });
  app2.post("/api/chat-sessions", async (req, res) => {
    try {
      const validatedData = insertChatSessionSchema.parse(req.body);
      const session = await storage.createChatSession(validatedData);
      res.status(201).json(session);
    } catch (error) {
      res.status(400).json({ error: "Invalid chat session data", details: error.message });
    }
  });
  app2.patch("/api/chat-sessions/:id", async (req, res) => {
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
  app2.get("/api/chat-sessions/:sessionId/messages", async (req, res) => {
    try {
      const messages = await storage.getChatMessagesBySession(req.params.sessionId);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch chat messages" });
    }
  });
  app2.get("/api/users/:userId/messages", async (req, res) => {
    try {
      const messages = await storage.getChatMessagesByUser(req.params.userId);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch user messages" });
    }
  });
  app2.post("/api/chat-messages", async (req, res) => {
    try {
      const validatedData = insertChatMessageSchema.parse(req.body);
      const existingMessages = await storage.getRawChatMessagesBySession(validatedData.sessionId);
      const tenSecondsAgo = new Date(Date.now() - 1e4);
      const recentDuplicate = existingMessages.find((msg) => {
        const isContentMatch = msg.content === validatedData.content;
        const isSenderMatch = msg.sender === validatedData.sender;
        const isRecent = msg.createdAt && new Date(msg.createdAt) > tenSecondsAgo;
        return isContentMatch && isSenderMatch && isRecent;
      });
      console.log(`\u{1F50D} Checking for duplicates: "${validatedData.content}" by ${validatedData.sender}`);
      console.log(`\u{1F4CA} Found ${existingMessages.length} existing messages in DB`);
      if (recentDuplicate) {
        console.log(`\u{1F6AB} Duplicate found: ${recentDuplicate.id}`);
      } else {
        console.log(`\u2705 No duplicate found, proceeding to save`);
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
  app2.get("/api/anxiety-analyses", async (req, res) => {
    try {
      const analyses = await storage.getAllAnxietyAnalyses();
      res.json(analyses);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch anxiety analyses" });
    }
  });
  app2.get("/api/users/:userId/anxiety-analyses", async (req, res) => {
    try {
      const analyses = await storage.getAnxietyAnalysesByUser(req.params.userId);
      const parsedAnalyses = analyses.map((analysis) => {
        const parseJsonField = (field) => {
          if (!field) return [];
          if (Array.isArray(field)) return field;
          if (typeof field === "string") {
            try {
              const parsed = JSON.parse(field);
              return Array.isArray(parsed) ? parsed : [];
            } catch {
              return field.split(",").map((s) => s.trim()).filter(Boolean);
            }
          }
          return [];
        };
        return {
          ...analysis,
          // Rename anxietyTriggers to triggers for frontend compatibility
          triggers: parseJsonField(analysis.anxietyTriggers),
          // Remove the old field
          anxietyTriggers: void 0,
          // Parse other JSON fields
          copingStrategies: parseJsonField(analysis.copingStrategies),
          // Keep other fields that might be JSON strings
          cognitiveDistortions: parseJsonField(analysis.cognitiveDistortions),
          dsm5Indicators: parseJsonField(analysis.dsm5Indicators)
        };
      });
      res.json(parsedAnalyses);
    } catch (error) {
      console.error("Error fetching anxiety analyses:", error);
      res.status(500).json({ error: "Failed to fetch anxiety analyses" });
    }
  });
  app2.post("/api/anxiety-analyses", async (req, res) => {
    try {
      const validatedData = insertAnxietyAnalysisSchema.parse(req.body);
      const analysis = await storage.createAnxietyAnalysis(validatedData);
      res.status(201).json(analysis);
    } catch (error) {
      res.status(400).json({ error: "Invalid anxiety analysis data", details: error.message });
    }
  });
  app2.post("/api/analyze-anxiety-claude", async (req, res) => {
    try {
      const { message, conversationHistory = [], userId, includeLanguageDetection = false } = req.body;
      console.log("\u{1F310} Language detection requested:", includeLanguageDetection);
      if (!message) {
        return res.status(400).json({ error: "Message is required" });
      }
      const claudeApiKey = process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY;
      let analysisResult;
      if (claudeApiKey) {
        try {
          console.log("Attempting AI API call for message:", message.substring(0, 50));
          const lowerMessage = message.toLowerCase();
          const ptsdWords = ["trauma", "flashback", "nightmare", "trigger", "ptsd", "veteran", "assault", "accident"];
          const ocdWords = ["ocd", "obsessive", "compulsive", "contamination", "checking", "counting", "intrusive thoughts", "ritual"];
          const panicWords = ["panic", "panic attack", "heart racing", "can't breathe", "dying", "losing control"];
          const psychosisIndicators = detectPsychosisIndicators(message);
          const hasPTSD = ptsdWords.some((word) => lowerMessage.includes(word));
          const hasOCD = ocdWords.some((word) => lowerMessage.includes(word));
          const hasPanic = panicWords.some((word) => lowerMessage.includes(word));
          const hasHallucinations = psychosisIndicators.hasIndicators;
          const isCrisis = hasHallucinations || lowerMessage.includes("kill") || lowerMessage.includes("suicide") || lowerMessage.includes("firing") || lowerMessage.includes("gaza") || lowerMessage.includes("war") || lowerMessage.includes("attack");
          const scenarioGuidance = [];
          if (isCrisis) {
            scenarioGuidance.push(
              "CRISIS RESPONSE REQUIRED: focus on immediate safety, grounding, and concise directives.",
              "Keep the response under 3 sentences and include a crisis resource if appropriate (e.g., call 988)."
            );
          } else if (hasPTSD) {
            scenarioGuidance.push(
              "PTSD INDICATORS PRESENT: acknowledge trauma, suggest grounding for flashbacks, avoid probing for details."
            );
          } else if (hasOCD) {
            scenarioGuidance.push(
              "OCD PATTERN DETECTED: avoid reassurance loops and reference exposure response prevention principles."
            );
          } else if (hasPanic) {
            scenarioGuidance.push(
              "Panic symptoms detected: lead with a breathing technique and reinforce that the surge will pass."
            );
          }
          const recentHistory = conversationHistory.length > 0 ? `Recent conversation context: ${conversationHistory.slice(-3).join(" | ")}` : "";
          const detectedLanguageField = includeLanguageDetection ? '\n  "detectedLanguage": "en" | "es"' : "";
          const languageRequirement = includeLanguageDetection ? "\n- Identify the message language and set detectedLanguage accordingly." : "";
          const scenarioGuidanceBlock = scenarioGuidance.length ? `
Scenario guidance:
- ${scenarioGuidance.join("\n- ")}` : "";
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
          const response = await fetch("https://api.anthropic.com/v1/messages", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-api-key": claudeApiKey,
              "anthropic-version": "2023-06-01"
            },
            body: JSON.stringify({
              model: "claude-3-5-haiku-20241022",
              // Using Claude 3.5 Haiku for reliable responses
              max_tokens: 800,
              // Increased for longer detailed responses
              temperature: 0.7,
              // More natural, varied responses
              messages: [{ role: "user", content: analysisPrompt }]
            })
          });
          if (response.ok) {
            const claudeResponse = await response.json();
            const analysisText = claudeResponse.content[0]?.text || "";
            console.log("API response received, parsing JSON...");
            console.log("Model used:", claudeResponse.model || "claude-3-5-haiku-20241022");
            analysisResult = extractAndParseJson("Claude", analysisText);
            if (analysisResult) {
              console.log("Successfully parsed response");
              console.log("Raw analysis result:", analysisResult);
            } else {
              console.error("[Claude] Unable to produce valid JSON after repair attempts.");
            }
          } else {
            const errorText = await response.text();
            console.error("Claude API error:", response.status, errorText);
            if (response.status === 401) {
              console.error("API Key authentication failed - check ANTHROPIC_API_KEY");
            } else if (response.status === 429) {
              console.error("Rate limit exceeded - using fallback");
            }
            analysisResult = null;
          }
        } catch (error) {
          console.error("Claude API request failed:", error);
          analysisResult = null;
        }
      }
      if (!analysisResult) {
        console.log("Primary AI failed, trying GPT-5 fallback...");
        const openaiKey = process.env.OPENAI_API_KEY;
        if (openaiKey) {
          try {
            const openaiResp = await fetch("https://api.openai.com/v1/chat/completions", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${openaiKey}`
              },
              body: JSON.stringify({
                model: "gpt-5",
                messages: [{ role: "user", content: `Analyze the mental health tone of: "${message}" and respond with JSON {"anxietyLevel":number,"triggers":string[],"copingStrategies":string[],"personalizedResponse":"Comprehensive 200-250 word therapeutic response in same language as user message"${includeLanguageDetection ? ',"detectedLanguage":"en or es - detect language of user message"' : ""}}.` }],
                temperature: 0.7,
                max_tokens: 800
              })
            });
            if (openaiResp.ok) {
              console.log("\u2705 GPT-5 fallback response received");
              const data = await openaiResp.json();
              const text2 = data.choices?.[0]?.message?.content || "";
              analysisResult = extractAndParseJson("OpenAI GPT", text2);
              if (analysisResult) {
                console.log("\u{1F916} Using GPT-5 fallback result");
              } else {
                console.error("[OpenAI GPT] Unable to produce valid JSON after repair attempts.");
              }
            } else {
              console.error("OpenAI API error:", openaiResp.status, await openaiResp.text());
            }
          } catch (err) {
            console.error("OpenAI request failed:", err);
          }
        }
      }
      console.log("\u{1F50D} DEBUG: analysisResult before fallback check:", analysisResult ? "HAS VALUE" : "NULL/UNDEFINED");
      if (!analysisResult) {
        console.log("Both AI systems failed, using local fallback for message:", message.substring(0, 50) + "...");
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
        const hasViolentThoughts = lowerMessage.includes("hurt") || lowerMessage.includes("kill") || lowerMessage.includes("die");
        const hasDepressionKeywords = lowerMessage.includes("depressed") || lowerMessage.includes("sad") || lowerMessage.includes("hopeless");
        hasRelationshipIssues ||= lowerMessage.includes("wife") || lowerMessage.includes("husband") || lowerMessage.includes("partner") || lowerMessage.includes("cheat");
        const ptsdKeywords = ["trauma", "flashback", "nightmare", "trigger", "ptsd", "veteran", "assault", "accident"];
        const ocdKeywords = ["ocd", "obsessive", "compulsive", "contamination", "checking", "counting", "intrusive", "ritual"];
        const panicKeywords = ["panic", "heart racing", "can't breathe", "chest pain", "dying", "losing control"];
        const hasPTSDIndicators = ptsdKeywords.some((word) => lowerMessage.includes(word));
        const hasOCDIndicators = ocdKeywords.some((word) => lowerMessage.includes(word));
        const hasPanicIndicators = panicKeywords.some((word) => lowerMessage.includes(word));
        if (hasHallucinationIndicators) anxietyLevel = 10;
        else if (hasViolentThoughts) anxietyLevel = Math.max(anxietyLevel, 8);
        else if (hasDepressionKeywords) anxietyLevel = Math.max(anxietyLevel, 6);
        let personalizedResponse;
        let triggers = [];
        let copingStrategies = [];
        if (hasHallucinationIndicators) {
          personalizedResponse = "Right now: Look around and name 5 things you can see. Touch something cold - ice or cold water on your face. Breathe slowly: in for 4, out for 6. If this continues, call 988 immediately.";
          triggers = ["Paranoia", "Fear", "Crisis"];
          copingStrategies = [
            "Name 5 things you see RIGHT NOW",
            "Splash cold water on face or hold ice",
            "Call 988 or go to ER immediately",
            "Stay with someone trusted"
          ];
        } else if (contextSummary.panic.thresholdMet) {
          personalizedResponse = "This is panic, not danger. Breathe: in for 4, hold for 4, out for 6. Five times. Place hand on chest - you're okay. This will pass in 10-20 minutes.";
          triggers = ["Panic attack", "Acute anxiety"];
          copingStrategies = [
            "Square breathing: 4-4-4-4 pattern",
            "Ice cube on wrist or neck",
            "Count backwards from 100 by 7s",
            "This WILL pass in 10-20 minutes"
          ];
          anxietyLevel = Math.max(anxietyLevel, 8);
        } else if (contextSummary.ptsd.thresholdMet) {
          personalizedResponse = "You're having a trauma response. You're safe now. Ground yourself: 5 things you see, 4 you hear, 3 you touch. The flashback will pass.";
          triggers = ["PTSD", "Trauma response", "Flashback"];
          copingStrategies = [
            "5-4-3-2-1 grounding NOW",
            "Smell something strong (coffee, essential oil)",
            "Bilateral stimulation: tap shoulders alternately",
            'Remind yourself: "That was then, this is now"'
          ];
          anxietyLevel = Math.max(anxietyLevel, 7);
        } else if (contextSummary.ocd.thresholdMet) {
          personalizedResponse = "OCD is loud right now. Don't do the compulsion. Set a 5-minute timer - sit with the discomfort. The urge will peak and fade. You can handle this.";
          triggers = ["OCD", "Intrusive thoughts", "Compulsions"];
          copingStrategies = [
            "Delay the ritual by 5 minutes",
            "Write the thought down, then close the notebook",
            "Do opposite action (if checking, walk away)",
            "Remember: thoughts are not facts"
          ];
          anxietyLevel = Math.max(anxietyLevel, 6);
        } else if (hasCrisisIndicators) {
          personalizedResponse = "Your pain is real. Right now: Step outside or to another room. Take 10 deep breaths, count them out loud. Then call 988 - they're available 24/7 to help you through this safely.";
          triggers = ["Crisis", "Severe distress", "Danger"];
          copingStrategies = [
            "Leave the room immediately",
            "Count 10 breaths out loud",
            "Call 988 now or text HOME to 741741",
            "Go for a walk outside"
          ];
        } else if (hasRelationshipIssues && contextSummary.depression.thresholdMet) {
          personalizedResponse = "This betrayal is devastating. Right now, breathe: in for 4, hold for 4, out for 6. Do this 5 times. Then call one person who cares about you. This intense pain will ease with time.";
          triggers = ["Betrayal", "Loss", "Grief"];
          copingStrategies = [
            "Breathe: 4-4-6 pattern, 5 times",
            "Call one trusted friend now",
            "Write your feelings for 10 minutes",
            "Take care of basics: eat, sleep, shower"
          ];
        } else if (lowerMessage.includes("generalized anxiety") || lowerMessage.includes("gad") || lowerMessage.includes("worry about everything")) {
          personalizedResponse = "Constant worry is exhausting. Right now: write down your top 3 worries. Circle what you can control today. Start with the smallest one.";
          triggers = ["GAD", "Chronic worry", "Anxiety"];
          copingStrategies = [
            "Worry time: set 15 min to worry, then stop",
            "Progressive muscle relaxation",
            'Challenge thoughts: "Is this likely?"',
            "Focus on ONE task for next hour"
          ];
          anxietyLevel = Math.max(anxietyLevel, 6);
        } else if (anxietyLevel > 6) {
          personalizedResponse = "Thank you for sharing all of this with me. Let's slow things down for a moment: inhale for 4, hold for 4, and exhale for 6 while relaxing your shoulders. Look around and name one thing you can see, one you can touch, one you can hear, and one you can smell. When you feel a little steadier, tell me which part of this feels heaviest so we can work through it together.";
          triggers = ["Stress", "Overwhelm"];
          copingStrategies = [
            "Do three rounds of 4-4-6 breathing",
            "Name one thing you can see, touch, hear, and smell",
            "Sip water or hold something cool",
            "Describe the hardest part so we can plan next steps"
          ];
        } else if (contextSummary.depression.thresholdMet) {
          personalizedResponse = "I hear your sadness. It's okay to feel this way. Right now, do one kind thing for yourself - maybe a cup of tea or step outside for fresh air. What's making you sad?";
          triggers = ["Sadness", "Low mood"];
          copingStrategies = [
            "One small act of self-care now",
            "Walk outside for 5 minutes",
            "Text someone you trust",
            "Let yourself cry if you need to"
          ];
          anxietyLevel = Math.max(anxietyLevel, 5);
        } else if (contextSummary.generalAnxiety.thresholdMet) {
          personalizedResponse = "Anxiety is tough. Right now: breathe in for 4, hold for 7, out for 8. Do this 3 times. Then name 5 things you can see. This will help calm your nervous system.";
          triggers = ["Anxiety", "Worry"];
          copingStrategies = [
            "4-7-8 breathing, 3 times",
            "Name 5 things you see",
            "Walk around the room",
            "Hold ice or cold water"
          ];
          anxietyLevel = Math.max(anxietyLevel, 6);
        } else if (lowerMessage.includes("can't sleep") || lowerMessage.includes("insomnia")) {
          personalizedResponse = "Racing mind at night is hard. Try 4-7-8 breathing five times. Then do a body scan: tense and release each muscle group. No screens for next hour.";
          triggers = ["Insomnia", "Sleep anxiety"];
          copingStrategies = [
            "4-7-8 breathing in bed",
            "Progressive muscle relaxation",
            "Write worries on paper, leave by bed",
            "Cool room, warm feet"
          ];
          anxietyLevel = Math.max(anxietyLevel, 5);
        } else {
          const responses = [
            "I'm here. What's on your mind today?",
            "Thanks for reaching out. What's happening?",
            "I'm listening. Tell me what you're feeling.",
            "You're not alone. What's going on?"
          ];
          personalizedResponse = responses[Math.floor(Math.random() * responses.length)];
          triggers = contextSummary.generalAnxiety.thresholdMet ? ["Stress"] : [];
          copingStrategies = ["Deep breathing", "Take a walk", "Call someone", "Self-care"];
        }
        const derivedTriggers = detectAnxietyTriggers(message);
        if (derivedTriggers.length) {
          const merged = /* @__PURE__ */ new Set([...triggers, ...derivedTriggers]);
          triggers = Array.from(merged);
        }
        let detectedLanguage;
        if (includeLanguageDetection) {
          const isSpanish = /[¡¿ñáéíóúü]|hola|ayuda|gracias|cómo|está|soy|tengo|estoy|muy|todo|nada|aquí|por|favor|ansiedad|triste|miedo|dolor/i.test(message);
          detectedLanguage = isSpanish ? "es" : "en";
        }
        analysisResult = {
          anxietyLevel,
          triggers,
          copingStrategies,
          personalizedResponse,
          contextSummary,
          ...includeLanguageDetection && { detectedLanguage }
        };
      }
      res.json(analysisResult);
    } catch (error) {
      console.error("Anxiety analysis error:", error);
      res.json({
        anxietyLevel: 5,
        triggers: ["General stress"],
        copingStrategies: ["Deep breathing exercises", "Mindfulness meditation"],
        personalizedResponse: "I'm here to support you through this difficult time. Let's focus on some coping strategies that can help you feel better."
      });
    }
  });
  app2.get("/api/therapists", async (req, res) => {
    try {
      const { city, state, specialty } = req.query;
      let therapists2;
      if (city && state) {
        therapists2 = await storage.getTherapistsByLocation(city, state);
      } else if (specialty) {
        therapists2 = await storage.getTherapistsBySpecialty(specialty);
      } else {
        therapists2 = [];
      }
      res.json(therapists2);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch therapists" });
    }
  });
  app2.post("/api/therapists", async (req, res) => {
    try {
      const validatedData = insertTherapistSchema.parse(req.body);
      const therapist = await storage.createTherapist(validatedData);
      res.status(201).json(therapist);
    } catch (error) {
      res.status(400).json({ error: "Invalid therapist data", details: error.message });
    }
  });
  app2.get("/api/users/:userId/goals", async (req, res) => {
    try {
      const goals = await storage.getUserGoalsByUser(req.params.userId);
      res.json(goals);
    } catch (error) {
      console.error("Error fetching goals:", error);
      res.status(500).json({ error: "Failed to fetch user goals" });
    }
  });
  app2.get("/api/users/:userId/intervention-summaries", async (req, res) => {
    try {
      const summaries = await storage.getInterventionSummariesByUser(req.params.userId);
      res.json(summaries);
    } catch (error) {
      console.error("Error fetching intervention summaries:", error);
      res.status(500).json({ error: "Failed to fetch intervention summaries" });
    }
  });
  app2.post("/api/user-goals", async (req, res) => {
    try {
      const validatedData = insertUserGoalSchema.parse(req.body);
      const goal = await storage.createUserGoal(validatedData);
      res.status(201).json(goal);
    } catch (error) {
      console.error("Invalid user goal payload:", req.body, error);
      res.status(400).json({ error: "Invalid user goal data", details: error instanceof Error ? error.message : String(error) });
    }
  });
  app2.put("/api/user-goals/:id", async (req, res) => {
    try {
      const goalId = req.params.id;
      const existingGoal = await storage.getUserGoal(goalId);
      if (!existingGoal) {
        return res.status(404).json({ error: "Goal not found" });
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
        isActive: typeof req.body.isActive === "boolean" ? req.body.isActive : existingGoal.isActive
      };
      const validatedData = insertUserGoalSchema.parse(mergedData);
      const updated = await storage.updateUserGoal(goalId, validatedData);
      res.json(updated);
    } catch (error) {
      console.error("Error updating user goal:", error);
      res.status(400).json({ error: "Invalid user goal data", details: error instanceof Error ? error.message : String(error) });
    }
  });
  app2.delete("/api/user-goals/:id", async (req, res) => {
    try {
      const goalId = req.params.id;
      const existingGoal = await storage.getUserGoal(goalId);
      if (!existingGoal) {
        return res.status(404).json({ error: "Goal not found" });
      }
      await storage.deleteUserGoal(goalId);
      res.status(204).end();
    } catch (error) {
      console.error("Error deleting user goal:", error);
      res.status(500).json({ error: "Failed to delete goal" });
    }
  });
  app2.get("/api/goals/:goalId/progress", async (req, res) => {
    try {
      const progress = await storage.getGoalProgressByGoal(req.params.goalId);
      res.json(progress);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch goal progress" });
    }
  });
  app2.post("/api/goal-progress", async (req, res) => {
    try {
      const validatedData = insertGoalProgressSchema.parse(req.body);
      const progress = await storage.createGoalProgress(validatedData);
      res.status(201).json(progress);
    } catch (error) {
      res.status(400).json({ error: "Invalid goal progress data", details: error.message });
    }
  });
  app2.get("/api/users/:userId/therapists", async (req, res) => {
    try {
      const userTherapists2 = await storage.getUserTherapistsByUser(req.params.userId);
      res.json(userTherapists2);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch user therapists" });
    }
  });
  app2.post("/api/user-therapists", async (req, res) => {
    try {
      const validatedData = insertUserTherapistSchema.parse(req.body);
      const userTherapist = await storage.createUserTherapist(validatedData);
      res.status(201).json(userTherapist);
    } catch (error) {
      res.status(400).json({ error: "Invalid user therapist data", details: error.message });
    }
  });
  app2.post("/api/tts", async (req, res) => {
    try {
      const { text: text2, language = "en" } = req.body;
      if (!text2 || typeof text2 !== "string") {
        return res.status(400).json({ error: "Text is required and must be a string" });
      }
      if (text2.length > 2500) {
        return res.status(400).json({ error: "Text too long (max 2500 characters)" });
      }
      const elevenLabsApiKey = process.env.ELEVEN_LABS_API_KEY;
      if (!elevenLabsApiKey) {
        return res.status(503).json({ error: "ElevenLabs TTS service not configured" });
      }
      const voiceIds = {
        "en": "EXAVITQu4vr4xnSDxMaL",
        // Bella - warm, friendly female voice
        "es": "XrExE9yKIg1WjnnlVkGX"
        // Matilda - native Spanish speaker
      };
      const voiceId = voiceIds[language] || voiceIds["en"];
      console.log(`\u{1F3A4} TTS Request: ${text2.substring(0, 50)}... (${language})`);
      const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
        method: "POST",
        headers: {
          "Accept": "audio/mpeg",
          "Content-Type": "application/json",
          "xi-api-key": elevenLabsApiKey
        },
        body: JSON.stringify({
          text: text2,
          model_id: "eleven_multilingual_v2",
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
            style: 0,
            use_speaker_boost: true
          }
        })
      });
      if (!response.ok) {
        const errorText = await response.text();
        console.error("ElevenLabs API error:", response.status, errorText);
        if (response.status === 401) {
          return res.status(503).json({ error: "TTS service authentication failed" });
        } else if (response.status === 429) {
          return res.status(429).json({ error: "TTS service rate limit exceeded" });
        } else {
          return res.status(503).json({ error: "TTS service temporarily unavailable" });
        }
      }
      const audioBuffer = await response.arrayBuffer();
      res.set({
        "Content-Type": "audio/mpeg",
        "Content-Length": audioBuffer.byteLength.toString(),
        "Cache-Control": "public, max-age=3600"
        // Cache for 1 hour
      });
      res.send(Buffer.from(audioBuffer));
    } catch (error) {
      console.error("TTS endpoint error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  app2.get("/api/tts/quota", async (req, res) => {
    try {
      const elevenLabsApiKey = process.env.ELEVEN_LABS_API_KEY;
      if (!elevenLabsApiKey) {
        return res.status(503).json({ error: "ElevenLabs API key not configured" });
      }
      const response = await fetch("https://api.elevenlabs.io/v1/user/subscription", {
        method: "GET",
        headers: {
          "xi-api-key": elevenLabsApiKey
        }
      });
      if (!response.ok) {
        return res.status(response.status).json({ error: `ElevenLabs API error: ${response.status}` });
      }
      const quotaData = await response.json();
      res.json(quotaData);
    } catch (error) {
      console.error("Quota check error:", error);
      res.status(500).json({ error: "Failed to check quota" });
    }
  });
  const stripMp3Headers = (buffer, isFirstChunk) => {
    if (isFirstChunk || buffer.length < 10) {
      return buffer;
    }
    if (buffer[0] === 73 && buffer[1] === 68 && buffer[2] === 51) {
      const headerSize = (buffer[6] & 127) << 21 | (buffer[7] & 127) << 14 | (buffer[8] & 127) << 7 | buffer[9] & 127;
      const totalSize = 10 + headerSize;
      return buffer.subarray(totalSize);
    }
    let offset = 0;
    while (offset < buffer.length && buffer[offset] === 0) {
      offset += 1;
    }
    return offset > 0 ? buffer.subarray(offset) : buffer;
  };
  app2.post("/api/azure-tts", async (req, res) => {
    try {
      const { text: text2, voice = "en-US-JennyNeural", language = "en-US" } = req.body;
      if (!text2 || typeof text2 !== "string") {
        return res.status(400).json({ error: "Text is required and must be a string" });
      }
      const MAX_TOTAL_LENGTH = 4e3;
      const CHUNK_LENGTH = 900;
      if (text2.length > MAX_TOTAL_LENGTH) {
        return res.status(400).json({ error: `Text too long (max ${MAX_TOTAL_LENGTH} characters)` });
      }
      const azureKey = process.env.AZURE_API_KEY || process.env.AZURE_TTS_KEY;
      const azureRegion = process.env.AZURE_TTS_REGION || process.env.AZURE_REGION;
      if (!azureKey || !azureRegion) {
        return res.status(503).json({ error: "Azure TTS service not configured" });
      }
      console.log(`\u{1F3A4} Azure TTS Request: ${text2.substring(0, 50)}... (${voice})`);
      const speechRate = language.startsWith("es") ? "0.9" : "1.1";
      const pitch = language.startsWith("es") ? "+5%" : "+10%";
      const sanitizedText = text2.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
      const chunks = [];
      if (sanitizedText.length <= CHUNK_LENGTH) {
        chunks.push(sanitizedText);
      } else {
        let currentChunk = "";
        const words = sanitizedText.split(/\s+/);
        for (const word of words) {
          const separator = currentChunk.length > 0 ? " " : "";
          if ((currentChunk + separator + word).length <= CHUNK_LENGTH) {
            currentChunk += separator + word;
            continue;
          }
          if (currentChunk.length > 0) {
            chunks.push(currentChunk);
            currentChunk = "";
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
      const audioBuffers = [];
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
          method: "POST",
          headers: {
            "Ocp-Apim-Subscription-Key": azureKey,
            "Content-Type": "application/ssml+xml",
            "X-Microsoft-OutputFormat": "audio-16khz-128kbitrate-mono-mp3",
            "User-Agent": "Tranquiloo-TTS"
          },
          body: ssml
        });
        if (!response.ok) {
          const errorText = await response.text();
          console.error("Azure TTS API error:", response.status, errorText);
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
      res.set({
        "Content-Type": "audio/mpeg",
        "Content-Length": combinedBuffer.byteLength.toString(),
        "Cache-Control": "public, max-age=3600"
        // Cache for 1 hour
      });
      res.send(combinedBuffer);
    } catch (error) {
      console.error("Azure TTS endpoint error:", error);
      if (!res.headersSent) {
        res.status(500).json({ error: "Internal server error" });
      }
    }
  });
  app2.post("/api/azure-stt", async (req, res) => {
    try {
      const { audioBlob, language = "es-MX", audioFormat } = req.body;
      if (!audioBlob) {
        return res.status(400).json({ error: "Audio data is required" });
      }
      const azureKey = process.env.AZURE_API_KEY || process.env.AZURE_TTS_KEY;
      const azureRegion = process.env.AZURE_TTS_REGION || process.env.AZURE_REGION;
      if (!azureKey || !azureRegion) {
        return res.status(503).json({ error: "Azure Speech service not configured" });
      }
      console.log(`\u{1F3A4} Azure STT Request (${language})`);
      console.log(`\u{1F3B5} Audio format: ${audioFormat}`);
      const audioBuffer = Buffer.from(audioBlob.split(",")[1], "base64");
      console.log(`\u{1F4CA} Audio buffer size: ${audioBuffer.length} bytes`);
      const response = await fetch(`https://${azureRegion}.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1?language=${language}&format=detailed`, {
        method: "POST",
        headers: {
          "Ocp-Apim-Subscription-Key": azureKey,
          "Content-Type": "audio/wav; codecs=audio/pcm; samplerate=16000",
          "Accept": "application/json"
        },
        body: audioBuffer
      });
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Azure STT API error:", response.status, errorText);
        if (response.status === 401) {
          return res.status(401).json({ error: "Invalid Azure API key" });
        } else if (response.status === 429) {
          return res.status(429).json({ error: "Rate limit exceeded" });
        }
        return res.status(response.status).json({ error: `Azure STT error: ${response.status}` });
      }
      const result = await response.json();
      console.log("\u{1F4CB} Azure STT full result:", JSON.stringify(result, null, 2));
      let transcript = "";
      if (result.RecognitionStatus === "Success") {
        transcript = result.DisplayText || result.Text || "";
      } else {
        console.log("\u274C Azure STT Recognition failed:", result.RecognitionStatus);
      }
      res.json({
        transcript,
        confidence: result.Confidence || 0.9,
        success: !!transcript
      });
    } catch (error) {
      console.error("Azure STT endpoint error:", error);
      if (!res.headersSent) {
        res.status(500).json({ error: "Internal server error" });
      }
    }
  });
  const httpServer = createServer(app2);
  return httpServer;
}

// server/vite.ts
import express3 from "express";
import fs from "fs";
import path2 from "path";
import { fileURLToPath as fileURLToPath2 } from "url";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
var __dirname = path.dirname(fileURLToPath(import.meta.url));
var vite_config_default = defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...process.env.NODE_ENV !== "production" && process.env.REPL_ID !== void 0 ? [
      await import("@replit/vite-plugin-cartographer").then(
        (m) => m.cartographer()
      )
    ] : []
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "client", "src"),
      "@shared": path.resolve(__dirname, "shared"),
      "@assets": path.resolve(__dirname, "attached_assets")
    }
  },
  root: path.resolve(__dirname, "client"),
  server: {
    hmr: {
      protocol: "ws",
      host: "localhost",
      port: Number(process.env.PORT ?? 5e3)
    },
    proxy: {
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true,
        secure: false
      },
      "/ws": {
        target: "http://localhost:5000",
        ws: true,
        changeOrigin: true
      }
    }
  },
  build: {
    outDir: path.resolve(__dirname, "dist/public"),
    emptyOutDir: true
  }
});

// server/vite.ts
import { nanoid } from "nanoid";
var __dirname2 = path2.dirname(fileURLToPath2(import.meta.url));
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path2.resolve(
        __dirname2,
        "..",
        "client",
        "index.html"
      );
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path2.resolve(__dirname2, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express3.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path2.resolve(distPath, "index.html"));
  });
}

// server/index.ts
import { WebSocketServer as WebSocketServer2 } from "ws";

// server/routes/video-call.ts
import { WebSocket } from "ws";
var VideoCallSignalingServer = class {
  constructor() {
    this.participants = /* @__PURE__ */ new Map();
    this.rooms = /* @__PURE__ */ new Map();
  }
  handleConnection(ws, req) {
    console.log("New WebSocket connection for video call");
    ws.on("message", (data) => {
      try {
        const message = JSON.parse(data.toString());
        this.handleMessage(ws, message);
      } catch (error) {
        console.error("Failed to parse message:", error);
      }
    });
    ws.on("close", () => {
      this.handleDisconnect(ws);
    });
    ws.on("error", (error) => {
      console.error("WebSocket error:", error);
    });
  }
  handleMessage(ws, message) {
    switch (message.type) {
      case "join":
        this.handleJoin(ws, message);
        break;
      case "offer":
        this.handleOffer(ws, message);
        break;
      case "answer":
        this.handleAnswer(ws, message);
        break;
      case "ice-candidate":
        this.handleIceCandidate(ws, message);
        break;
      case "leave":
        this.handleLeave(ws, message);
        break;
      default:
        console.log("Unknown message type:", message.type);
    }
  }
  handleJoin(ws, message) {
    const { roomId, userName, userRole } = message;
    this.participants.set(ws, { ws, roomId, userName, userRole });
    if (!this.rooms.has(roomId)) {
      this.rooms.set(roomId, /* @__PURE__ */ new Set());
    }
    this.rooms.get(roomId).add(ws);
    console.log(`${userName} (${userRole}) joined room ${roomId}`);
    this.broadcastToRoom(roomId, ws, {
      type: "user-joined",
      userName,
      userRole
    });
    const room = this.rooms.get(roomId);
    if (room) {
      const existingParticipants = Array.from(room).filter((participant) => participant !== ws).map((participant) => {
        const info = this.participants.get(participant);
        return {
          userName: info?.userName,
          userRole: info?.userRole
        };
      });
      this.send(ws, {
        type: "existing-participants",
        participants: existingParticipants
      });
    }
  }
  handleOffer(ws, message) {
    const { roomId, offer } = message;
    console.log(`Forwarding offer in room ${roomId}`);
    this.broadcastToRoom(roomId, ws, {
      type: "offer",
      offer
    });
  }
  handleAnswer(ws, message) {
    const { roomId, answer } = message;
    console.log(`Forwarding answer in room ${roomId}`);
    this.broadcastToRoom(roomId, ws, {
      type: "answer",
      answer
    });
  }
  handleIceCandidate(ws, message) {
    const { roomId, candidate } = message;
    this.broadcastToRoom(roomId, ws, {
      type: "ice-candidate",
      candidate
    });
  }
  handleLeave(ws, message) {
    const { roomId } = message;
    const participant = this.participants.get(ws);
    if (participant) {
      console.log(`${participant.userName} left room ${roomId}`);
      this.broadcastToRoom(roomId, ws, {
        type: "user-left",
        userName: participant.userName,
        userRole: participant.userRole
      });
    }
    this.removeFromRoom(ws, roomId);
  }
  handleDisconnect(ws) {
    const participant = this.participants.get(ws);
    if (participant) {
      const { roomId, userName, userRole } = participant;
      console.log(`${userName} disconnected from room ${roomId}`);
      this.broadcastToRoom(roomId, ws, {
        type: "user-left",
        userName,
        userRole
      });
      this.removeFromRoom(ws, roomId);
    }
    this.participants.delete(ws);
  }
  removeFromRoom(ws, roomId) {
    const room = this.rooms.get(roomId);
    if (room) {
      room.delete(ws);
      if (room.size === 0) {
        this.rooms.delete(roomId);
        console.log(`Room ${roomId} is now empty and deleted`);
      }
    }
  }
  broadcastToRoom(roomId, sender, message) {
    const room = this.rooms.get(roomId);
    if (room) {
      room.forEach((ws) => {
        if (ws !== sender && ws.readyState === WebSocket.OPEN) {
          this.send(ws, message);
        }
      });
    }
  }
  send(ws, message) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }
};
var videoCallSignaling = new VideoCallSignalingServer();

// server/index.ts
dotenv2.config();
var app = express4();
app.use(cors({
  origin: ["http://localhost:5173", "http://localhost:4173"],
  credentials: true
}));
app.set("trust proxy", true);
app.use(express4.json({ limit: "10mb" }));
app.use(express4.urlencoded({ extended: false }));
app.use("/api/chat", chat_default);
app.use("/api/ai-chat", ai_chat_default);
app.use("/api/wellness", wellness_default);
app.use((req, res, next) => {
  const start = Date.now();
  const path3 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path3.startsWith("/api")) {
      const logLine = `${req.method} ${path3} ${res.statusCode} in ${duration}ms`;
      log(logLine);
    }
  });
  next();
});
(async () => {
  const server = await registerRoutes(app);
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    console.error("Unhandled error:", err);
  });
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const wss = new WebSocketServer2({
    noServer: true
    // Don't attach automatically, we'll handle upgrades manually
  });
  server.on("upgrade", (request, socket, head) => {
    const pathname = new URL(request.url || "", "http://localhost").pathname;
    if (pathname === "/ws/video-call") {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit("connection", ws, request);
      });
    }
  });
  wss.on("connection", (ws, req) => {
    videoCallSignaling.handleConnection(ws, req);
  });
  console.log("\u{1F4F9} Video call WebSocket server initialized on /ws/video-call");
  if (process.env.NODE_ENV !== "production" || process.env.RUNNING_LOCALLY === "true") {
    const port = process.env.PORT || 5e3;
    server.listen({
      port,
      host: "0.0.0.0",
      reusePort: true
    }, () => {
      log(`serving on port ${port}`);
      Promise.resolve().then(() => (init_emailService(), emailService_exports)).then(({ emailService: emailService2 }) => {
        emailService2.startEmailProcessor();
        console.log("\u2709\uFE0F Email service started - processing queue every 30 seconds");
      }).catch((err) => {
        console.error("Failed to start email service:", err);
      });
    });
  }
})();
var server_default = app;

// api/index.ts
var handler = serverless(server_default);
var index_default = async (req, res) => {
  return handler(req, res);
};
export {
  index_default as default
};
