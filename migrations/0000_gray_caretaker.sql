CREATE TABLE "anxiety_analyses" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"message_id" text,
	"anxiety_level" integer NOT NULL,
	"analysis_source" text DEFAULT 'claude',
	"anxiety_triggers" text,
	"coping_strategies" text,
	"personalized_response" text,
	"confidence_score" numeric(3, 2),
	"created_at" integer
);
--> statement-breakpoint
CREATE TABLE "appointments" (
	"id" text PRIMARY KEY NOT NULL,
	"patient_id" text NOT NULL,
	"therapist_email" text NOT NULL,
	"scheduled_at" text NOT NULL,
	"duration" integer DEFAULT 60,
	"type" text DEFAULT 'video',
	"status" text DEFAULT 'scheduled',
	"room_id" text,
	"started_at" text,
	"ended_at" text,
	"recording_url" text,
	"transcript" text,
	"actual_duration" integer,
	"notes" text,
	"cancellation_reason" text,
	"meeting_link" text,
	"created_at" text,
	"updated_at" text
);
--> statement-breakpoint
CREATE TABLE "chat_messages" (
	"id" text PRIMARY KEY NOT NULL,
	"session_id" text NOT NULL,
	"user_id" text NOT NULL,
	"content" text NOT NULL,
	"sender" text NOT NULL,
	"created_at" integer
);
--> statement-breakpoint
CREATE TABLE "chat_sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"title" text DEFAULT 'New Chat Session',
	"ai_companion" text DEFAULT 'vanessa',
	"language" text DEFAULT 'english',
	"created_at" integer,
	"updated_at" integer
);
--> statement-breakpoint
CREATE TABLE "email_queue" (
	"id" text PRIMARY KEY NOT NULL,
	"to_email" text NOT NULL,
	"from_email" text DEFAULT 'info@tranquiloo-app.com',
	"subject" text NOT NULL,
	"body" text,
	"html_content" text NOT NULL,
	"text_content" text,
	"email_type" text NOT NULL,
	"status" text DEFAULT 'pending',
	"metadata" text,
	"sent_at" integer,
	"created_at" integer
);
--> statement-breakpoint
CREATE TABLE "goal_progress" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"goal_id" text NOT NULL,
	"score" integer NOT NULL,
	"notes" text,
	"recorded_at" text NOT NULL,
	"created_at" integer
);
--> statement-breakpoint
CREATE TABLE "intervention_summaries" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"week_start" text NOT NULL,
	"week_end" text NOT NULL,
	"intervention_type" text DEFAULT 'cbt',
	"conversation_count" integer DEFAULT 0,
	"key_points" text,
	"created_at" integer,
	"updated_at" integer
);
--> statement-breakpoint
CREATE TABLE "profiles" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"first_name" text,
	"last_name" text,
	"avatar_url" text,
	"patient_code" text,
	"role" text DEFAULT 'user',
	"hashed_password" text,
	"email_verified" boolean DEFAULT false,
	"email_verification_token" text,
	"password_reset_token" text,
	"password_reset_expires" integer,
	"auth_method" text DEFAULT 'email',
	"license_number" text,
	"license_state" text,
	"license_grace_deadline" integer,
	"created_at" integer,
	"updated_at" integer,
	CONSTRAINT "profiles_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "therapist_patient_connections" (
	"id" text PRIMARY KEY NOT NULL,
	"patient_id" text NOT NULL,
	"therapist_email" text NOT NULL,
	"patient_email" text NOT NULL,
	"patient_code" text NOT NULL,
	"patient_consent_given" boolean DEFAULT false,
	"therapist_accepted" boolean DEFAULT false,
	"connection_request_date" integer,
	"connection_accepted_date" integer,
	"share_analytics" boolean DEFAULT false,
	"share_reports" boolean DEFAULT false,
	"is_active" boolean DEFAULT true,
	"notes" text,
	"created_at" integer,
	"updated_at" integer
);
--> statement-breakpoint
CREATE TABLE "therapists" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text,
	"phone" text NOT NULL,
	"address" text NOT NULL,
	"city" text NOT NULL,
	"state" text NOT NULL,
	"zip_code" text NOT NULL,
	"licensure" text NOT NULL,
	"specialty" text,
	"insurance" text,
	"practice_type" text,
	"accepting_patients" boolean,
	"accepts_uninsured" boolean,
	"years_of_experience" integer,
	"rating" numeric(3, 2),
	"bio" text,
	"website" text,
	"created_at" integer,
	"updated_at" integer
);
--> statement-breakpoint
CREATE TABLE "treatment_plans" (
	"id" text PRIMARY KEY NOT NULL,
	"patient_id" text NOT NULL,
	"plan" text NOT NULL,
	"created_at" integer,
	"updated_at" integer,
	CONSTRAINT "treatment_plans_patient_id_unique" UNIQUE("patient_id")
);
--> statement-breakpoint
CREATE TABLE "user_goals" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"category" text NOT NULL,
	"frequency" text NOT NULL,
	"target_value" numeric,
	"unit" text,
	"start_date" text NOT NULL,
	"end_date" text,
	"is_active" boolean DEFAULT true,
	"source" text,
	"created_at" integer,
	"updated_at" integer
);
--> statement-breakpoint
CREATE TABLE "user_therapists" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"therapist_name" text NOT NULL,
	"contact_method" text NOT NULL,
	"contact_value" text NOT NULL,
	"notes" text,
	"share_report" boolean DEFAULT true,
	"is_active" boolean DEFAULT true,
	"created_at" integer,
	"updated_at" integer
);
