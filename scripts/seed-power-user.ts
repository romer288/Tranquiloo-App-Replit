import { sqliteDatabase } from "../server/db";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";

const userProfile = {
  email: "alexandra.hughes@example.com",
  password: "PowerAnalytics!2025",
  patientCode: "PAT-POWER-2025",
  firstName: "Alexandra",
  lastName: "Hughes",
  aiCompanion: "vanessa",
  language: "english"
};

const triggerPools = {
  work: ["deadline pressure", "client presentations", "team conflicts"],
  social: ["networking events", "large meetings", "family gatherings"],
  health: ["sleep disruptions", "medical appointments", "long commutes"],
  finance: ["budget reviews", "unexpected expenses", "investment volatility"],
  family: ["parenting demands", "elder care planning", "scheduling conflicts"],
};

const copingPool = [
  "guided breathing",
  "cognitive reframing",
  "progressive muscle relaxation",
  "exposure hierarchy",
  "journaling",
  "evening reflection",
  "walk outside",
  "grounding exercise"
];

const sentiments = ["positive", "neutral", "mixed", "concerned"];

const summarize = (items: string[]) => JSON.stringify(items);

const toDateString = (date: Date) => date.toISOString().split("T")[0];

const weeksBetween = (start: Date, end: Date) => {
  const weeks: Date[] = [];
  let cursor = new Date(start);
  while (cursor <= end) {
    weeks.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 7);
  }
  return weeks;
};

const monthsBetween = (start: Date, end: Date) => {
  const months: Date[] = [];
  const cursor = new Date(start.getFullYear(), start.getMonth(), 1);
  const limit = new Date(end.getFullYear(), end.getMonth(), 1);
  while (cursor <= limit) {
    months.push(new Date(cursor));
    cursor.setMonth(cursor.getMonth() + 1);
  }
  return months;
};

async function seedPowerUser() {
  const now = Date.now();
  const hashedPassword = await bcrypt.hash(userProfile.password, 10);

  const existing = sqliteDatabase
    .prepare("SELECT id FROM profiles WHERE email = ?")
    .get(userProfile.email) as { id: string } | undefined;

  const userId = existing?.id ?? randomUUID();

  // Clean up previous data for this user
  const tablesWithUserId = [
    "chat_messages",
    "chat_sessions",
    "anxiety_analyses",
    "goal_progress",
    "user_goals",
    "intervention_summaries"
  ];

  sqliteDatabase.prepare("BEGIN TRANSACTION").run();
  try {
    for (const table of tablesWithUserId) {
      sqliteDatabase.prepare(`DELETE FROM ${table} WHERE user_id = ?`).run(userId);
    }
    if (existing) {
      sqliteDatabase.prepare("DELETE FROM profiles WHERE id = ?").run(userId);
    }

    // Create profile
    sqliteDatabase
      .prepare(`
        INSERT INTO profiles (
          id, email, first_name, last_name, patient_code, role,
          hashed_password, email_verified, auth_method, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, 'user', ?, 1, 'email', ?, ?)
      `)
      .run(
        userId,
        userProfile.email,
        userProfile.firstName,
        userProfile.lastName,
        userProfile.patientCode,
        hashedPassword,
        now,
        now
      );

    console.log(`✓ Created profile for ${userProfile.email}`);

    // Chat sessions & messages (quarterly snapshots)
    const sessionStmt = sqliteDatabase.prepare(`
      INSERT INTO chat_sessions (id, user_id, title, ai_companion, language, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    const messageStmt = sqliteDatabase.prepare(`
      INSERT INTO chat_messages (id, session_id, user_id, content, sender, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const sessionStart = new Date("2023-01-15T10:00:00Z");
    for (let i = 0; i < 10; i++) {
      const sessionDate = new Date(sessionStart);
      sessionDate.setMonth(sessionDate.getMonth() + i * 3);
      if (sessionDate > new Date("2025-09-29T23:59:59Z")) break;

      const sessionId = randomUUID();
      sessionStmt.run(
        sessionId,
        userId,
        `Quarterly reflection ${i + 1}`,
        userProfile.aiCompanion,
        userProfile.language,
        sessionDate.getTime(),
        sessionDate.getTime()
      );

      const userMessageId = randomUUID();
      const coachMessageId = randomUUID();

      messageStmt.run(
        userMessageId,
        sessionId,
        userId,
        "I've noticed different anxiety patterns this quarter and want to review coping plans.",
        "user",
        sessionDate.getTime()
      );

      messageStmt.run(
        coachMessageId,
        sessionId,
        userId,
        "Let's break down the triggers you've faced and reinforce the interventions that worked best.",
        "ai",
        sessionDate.getTime() + 1000 * 60 * 2
      );
    }

    console.log("✓ Inserted chat sessions and conversations");

    // Anxiety analyses (weekly)
    const startDate = new Date("2023-01-02T09:00:00Z");
    const endDate = new Date("2025-09-29T18:00:00Z");
    const weeklyDates = weeksBetween(startDate, endDate);

    const analysisStmt = sqliteDatabase.prepare(`
      INSERT INTO anxiety_analyses (
        id, user_id, anxiety_level, triggers, sentiment, intervention_needed,
        recommended_techniques, created_at, analysis_source, anxiety_triggers,
        coping_strategies, personalized_response, confidence_score
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'claude', ?, ?, ?, ?)
    `);

    weeklyDates.forEach((date, index) => {
      const triggerCategories = Object.keys(triggerPools);
      const primaryCategory = triggerCategories[index % triggerCategories.length] as keyof typeof triggerPools;
      const secondaryCategory = triggerCategories[(index + 2) % triggerCategories.length] as keyof typeof triggerPools;
      const triggers = [
        triggerPools[primaryCategory][index % triggerPools[primaryCategory].length],
        triggerPools[secondaryCategory][(index * 7) % triggerPools[secondaryCategory].length]
      ];

      const anxietyLevel = 4 + Math.floor((Math.sin(index / 6) + 1) * 3) + (index % 5 === 0 ? 1 : 0);
      const sentiment = sentiments[index % sentiments.length];
      const interventionNeeded = anxietyLevel >= 7 ? 1 : 0;
      const coping = [
        copingPool[(index + 1) % copingPool.length],
        copingPool[(index + 4) % copingPool.length]
      ];

      analysisStmt.run(
        randomUUID(),
        userId,
        Math.min(anxietyLevel, 9),
        triggers.join(", "),
        sentiment,
        interventionNeeded,
        coping.join(", "),
        date.getTime(),
        summarize(triggers),
        summarize(coping),
        `Focus on ${coping[0]} when ${triggers[0]} appears. Track mood after sessions.`,
        (0.72 + Math.random() * 0.2).toFixed(2)
      );
    });

    console.log(`✓ Inserted ${weeklyDates.length} anxiety analyses`);

    // Goals and progress
    const goals = [
      {
        title: "Practice guided mindfulness",
        description: "15 minutes of structured mindfulness every morning",
        category: "mindfulness",
        frequency: "daily",
        start: "2023-01-02",
        end: "2024-12-31",
        targetValue: "15",
        unit: "minutes",
        priority: "high",
        notes: "Building consistent baseline regulation"
      },
      {
        title: "Weekly exposure challenges",
        description: "Gradual exposure to high-anxiety scenarios",
        category: "therapy",
        frequency: "weekly",
        start: "2023-03-01",
        end: "2025-09-29",
        targetValue: "1",
        unit: "sessions",
        priority: "high",
        notes: "Coordinate with therapist after each challenge"
      },
      {
        title: "Cardio routine",
        description: "45 minutes of cardio activity",
        category: "exercise",
        frequency: "weekly",
        start: "2024-01-05",
        end: "2025-09-29",
        targetValue: "3",
        unit: "sessions",
        priority: "medium",
        notes: "Rotate between running, cycling, and yoga"
      }
    ];

    const goalStmt = sqliteDatabase.prepare(`
      INSERT INTO user_goals (
        id, user_id, title, description, category, priority, target_date,
        status, progress, created_at, updated_at, frequency, reminder_enabled,
        target_value, unit, start_date, end_date, is_active, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'active', 0, ?, ?, ?, 0, ?, ?, ?, ?, 1, ?)
    `);

    const progressStmt = sqliteDatabase.prepare(`
      INSERT INTO goal_progress (
        id, goal_id, user_id, note, progress_value, score, recorded_at, notes, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const goalIds: string[] = [];

    goals.forEach((goal) => {
      const goalId = randomUUID();
      goalIds.push(goalId);
      const targetDate = new Date(goal.end).getTime();

      goalStmt.run(
        goalId,
        userId,
        goal.title,
        goal.description,
        goal.category,
        goal.priority,
        targetDate,
        now,
        now,
        goal.frequency,
        goal.targetValue,
        goal.unit,
        goal.start,
        goal.end,
        goal.notes
      );

      const monthlyDates = monthsBetween(new Date(goal.start), new Date(goal.end));
      monthlyDates.forEach((monthDate, idx) => {
        const score = 5 + Math.round(Math.sin((idx + goalIds.length) / 3) * 2 + Math.random() * 2);
        const progressValue = Math.min(100, Math.round((idx / monthlyDates.length) * 100 + Math.random() * 5));
        const recordedAt = toDateString(new Date(monthDate.getFullYear(), monthDate.getMonth(), 18));
        progressStmt.run(
          randomUUID(),
          goalId,
          userId,
          `Monthly check-in for ${goal.title}`,
          progressValue,
          Math.max(1, Math.min(score, 10)),
          recordedAt,
          `Refined plan after feedback on ${recordedAt}`,
          new Date(recordedAt).getTime()
        );
      });
    });

    console.log(`✓ Inserted ${goalIds.length} goals with detailed progress history`);

    // Intervention summaries (monthly rollups)
    const summaryStmt = sqliteDatabase.prepare(`
      INSERT INTO intervention_summaries (
        id, user_id, intervention_type, anxiety_level_before, anxiety_level_after,
        techniques_used, effectiveness_rating, notes, created_at, week_start,
        week_end, total_sessions, average_anxiety_before, average_anxiety_after,
        key_achievements, areas_for_focus, therapist_notes, generated_at,
        conversation_count, key_points, recommendations, limitations
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
      )
    `);

    const summaryMonths = monthsBetween(new Date("2023-01-01"), endDate);
    summaryMonths.forEach((monthDate, idx) => {
      const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
      const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);
      const before = 6 + Math.sin(idx / 5) * 2;
      const after = before - 1.2 + Math.random() * 0.5;

      const keyPoints = [
        `Exposure focus: ${(idx % 3 === 0) ? 'crowded spaces' : (idx % 3 === 1 ? 'difficult conversations' : 'travel scenarios')}`,
        `Mindfulness consistency ${(idx % 4) + 6} days/week`
      ];

      summaryStmt.run(
        randomUUID(),
        userId,
        idx % 2 === 0 ? "cbt" : "mindfulness",
        Math.round(before),
        Math.max(1, Math.round(after)),
        summarize([copingPool[idx % copingPool.length], copingPool[(idx + 3) % copingPool.length]]),
        Math.min(10, 6 + (idx % 5)),
        "Monthly integrated summary",
        monthEnd.getTime(),
        monthStart.getTime(),
        monthEnd.getTime(),
        12 + (idx % 4),
        before.toFixed(1),
        after.toFixed(1),
        summarize(keyPoints),
        summarize(["Increase social exposures", "Maintain sleep hygiene"]),
        "Client demonstrates insight into trigger cycles; continue reinforcing autonomy.",
        Date.now(),
        18 + (idx % 6),
        summarize(keyPoints),
        summarize(["Schedule confidence rehearsal", "Share progress with support network"]),
        summarize(["Watch for burnout", "Avoid excessive workload stacking"])
      );
    });

    console.log(`✓ Inserted ${summaryMonths.length} intervention summaries`);

    sqliteDatabase.prepare("COMMIT").run();
    console.log("\n✅ Power user seeded successfully!\n");
    console.log("Login details:");
    console.log(`  Email:    ${userProfile.email}`);
    console.log(`  Password: ${userProfile.password}`);
    console.log(`  Patient code: ${userProfile.patientCode}`);
  } catch (error) {
    sqliteDatabase.prepare("ROLLBACK").run();
    console.error("❌ Failed to seed power user", error);
    throw error;
  }
}

seedPowerUser();
