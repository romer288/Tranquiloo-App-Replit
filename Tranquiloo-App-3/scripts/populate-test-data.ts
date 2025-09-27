import { sqliteDatabase } from "../server/db";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";

// Helper function to generate dates
const daysAgo = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.getTime();
};

const formatDate = (timestamp: number) => {
  return new Date(timestamp).toISOString().split('T')[0];
};

async function populateTestData() {
  console.log("Starting test data population...");

  const hashedPassword = await bcrypt.hash("password123", 10);
  
  // Create therapist profile first
  const therapistId = randomUUID();
  
  // Insert therapist profile
  sqliteDatabase.prepare(`
    INSERT OR REPLACE INTO profiles (id, email, first_name, last_name, role, hashed_password, email_verified, auth_method, license_number, license_state, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    therapistId,
    "dr.smith@therapy.com",
    "Lisa",
    "Smith",
    "therapist",
    hashedPassword,
    1,
    "email",
    "LPC-12345",
    "California",
    daysAgo(365),
    daysAgo(0)
  );
  
  console.log("✓ Created therapist profile: Dr. Lisa Smith");

  // Create therapist record
  sqliteDatabase.prepare(`
    INSERT OR REPLACE INTO therapists (id, profile_id, specializations, years_of_experience, bio, hourly_rate, is_available, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    randomUUID(),
    therapistId,
    JSON.stringify(["Anxiety Disorders", "Panic Disorder", "PTSD", "CBT"]),
    12,
    "Dr. Lisa Smith specializes in evidence-based treatments for anxiety disorders, with extensive experience in CBT and exposure therapy.",
    "200",
    1,
    daysAgo(365),
    daysAgo(0)
  );
  
  console.log("✓ Created therapist record");

  // Test users data
  const testUsers = [
    {
      id: randomUUID(),
      email: "sarah.johnson@example.com",
      firstName: "Sarah",
      lastName: "Johnson",
      patientCode: "PAT-2024-001",
      anxietyType: "Work anxiety",
      triggers: ["presentations", "deadlines", "performance reviews"],
      companion: "vanessa",
      language: "english"
    },
    {
      id: randomUUID(),
      email: "mike.chen@example.com",
      firstName: "Mike",
      lastName: "Chen",
      patientCode: "PAT-2024-002",
      anxietyType: "Social anxiety",
      triggers: ["meetings", "networking events", "phone calls"],
      companion: "vanessa",
      language: "english"
    },
    {
      id: randomUUID(),
      email: "emma.garcia@example.com",
      firstName: "Emma",
      lastName: "Garcia",
      patientCode: "PAT-2024-003",
      anxietyType: "Caregiver stress",
      triggers: ["family responsibilities", "time management", "self-care"],
      companion: "monica",
      language: "spanish"
    },
    {
      id: randomUUID(),
      email: "james.wilson@example.com",
      firstName: "James",
      lastName: "Wilson",
      patientCode: "PAT-2024-004",
      anxietyType: "Panic disorder",
      triggers: ["crowded spaces", "grocery stores", "driving"],
      companion: "vanessa",
      language: "english"
    }
  ];

  // Create user profiles
  for (const user of testUsers) {
    // Insert user profile
    sqliteDatabase.prepare(`
      INSERT OR REPLACE INTO profiles (id, email, first_name, last_name, patient_code, role, hashed_password, email_verified, auth_method, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      user.id,
      user.email,
      user.firstName,
      user.lastName,
      user.patientCode,
      "user",
      hashedPassword,
      1,
      "email",
      daysAgo(90),
      daysAgo(0)
    );

    console.log(`✓ Created user profile: ${user.firstName} ${user.lastName}`);

    // Create chat sessions for each user
    await createChatSessions(user);
    
    // Create anxiety tracking data
    await createAnxietyData(user);
    
    // Create goals and progress
    await createGoals(user);
    
    // Create intervention summaries
    await createInterventionSummaries(user);
  }

  console.log("\n✅ Test data population complete!");
  console.log("\nTest accounts created:");
  console.log("- Patients: sarah.johnson@example.com, mike.chen@example.com, emma.garcia@example.com, james.wilson@example.com");
  console.log("- Therapist: dr.smith@therapy.com");
  console.log("- All passwords: password123");
}

async function createChatSessions(user: any) {
  const sessions = [];
  
  // Create 3 chat sessions for each user
  for (let i = 0; i < 3; i++) {
    const sessionId = randomUUID();
    const daysOffset = 30 - (i * 10);
    
    sqliteDatabase.prepare(`
      INSERT INTO chat_sessions (id, user_id, title, ai_companion, language, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      sessionId,
      user.id,
      getSessionTitle(user.anxietyType, i),
      user.companion,
      user.language,
      daysAgo(daysOffset),
      daysAgo(daysOffset - 1)
    );
    
    // Create chat messages for each session
    await createChatMessages(sessionId, user, daysOffset);
    
    sessions.push(sessionId);
  }
  
  console.log(`  ✓ Created ${sessions.length} chat sessions`);
  return sessions;
}

function getSessionTitle(anxietyType: string, index: number): string {
  const titles: Record<string, string[]> = {
    "Work anxiety": ["Dealing with presentation stress", "Managing deadline pressure", "Building confidence at work"],
    "Social anxiety": ["Overcoming meeting anxiety", "Building social confidence", "Managing work relationships"],
    "Caregiver stress": ["Finding balance in caregiving", "Self-care strategies", "Managing family stress"],
    "Panic disorder": ["Understanding panic attacks", "Coping with triggers", "Building resilience"]
  };
  
  return titles[anxietyType]?.[index] || "Anxiety management session";
}

async function createChatMessages(sessionId: string, user: any, daysOffset: number) {
  const conversations = getConversationForAnxietyType(user.anxietyType, user.companion);
  
  const stmt = sqliteDatabase.prepare(`
    INSERT INTO chat_messages (id, session_id, user_id, content, sender, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  
  for (let i = 0; i < conversations.length; i++) {
    const message = conversations[i];
    stmt.run(
      randomUUID(),
      sessionId,
      user.id,
      message.content,
      message.sender,
      daysAgo(daysOffset) + (i * 60000) // Each message 1 minute apart
    );
  }
}

function getConversationForAnxietyType(anxietyType: string, companion: string): any[] {
  const conversations: Record<string, any[]> = {
    "Work anxiety": [
      { sender: "user", content: "I have a big presentation tomorrow and I'm really anxious about it." },
      { sender: "ai", content: `I understand how nerve-wracking presentations can be. Let's work through this together. First, tell me what specifically worries you most about tomorrow's presentation?` },
      { sender: "user", content: "I'm afraid I'll forget what to say or that people will judge me if I make a mistake." },
      { sender: "ai", content: `Those are very common concerns, and it's completely normal to feel this way. Let me share a technique that many find helpful: the 5-4-3-2-1 grounding exercise. Would you like to try it together? Also, remember that your audience wants you to succeed - they're on your side.` },
      { sender: "user", content: "Yes, I'd like to try that. I've been practicing my presentation but still feel overwhelmed." },
      { sender: "ai", content: `Great! Let's start with the grounding exercise. Name 5 things you can see right now, 4 things you can touch, 3 things you can hear, 2 things you can smell, and 1 thing you can taste. This will help center you in the present moment. After this, we can practice some positive affirmations for your presentation.` }
    ],
    "Social anxiety": [
      { sender: "user", content: "I have a team meeting in an hour and I'm already feeling anxious." },
      { sender: "ai", content: `I hear you. Team meetings can feel overwhelming when social anxiety kicks in. What aspect of the meeting is causing you the most stress right now?` },
      { sender: "user", content: "I might have to speak up and share my ideas. I'm worried my voice will shake or I'll say something wrong." },
      { sender: "ai", content: `Your feelings are valid, and many people experience this. Here's something that might help: prepare one or two key points you'd like to make and write them down. This gives you something concrete to refer to. Also, try the 'square breathing' technique before the meeting - breathe in for 4, hold for 4, out for 4, hold for 4. Would you like to practice this together?` },
      { sender: "user", content: "Yes, that would help. I'll write down my main points too." },
      { sender: "ai", content: `Excellent! Let's do the breathing exercise together now. Remember, your ideas have value, and your team wants to hear them. Even if your voice shakes a little, that's okay - it shows you care about your work. Most people won't even notice, and if they do, they'll likely empathize rather than judge.` }
    ],
    "Caregiver stress": [
      { sender: "user", content: companion === "monica" ? "Monica, estoy muy estresada cuidando a mi madre y trabajando." : "I'm overwhelmed taking care of my mother and working full-time." },
      { sender: "ai", content: companion === "monica" ? `Emma, entiendo lo difícil que debe ser equilibrar el cuidado de tu madre con el trabajo. No estás sola en esto. ¿Cuál es el mayor desafío que enfrentas ahora mismo?` : `Emma, I can only imagine how challenging it must be to balance caregiving with work. You're doing something incredibly difficult. What's the biggest challenge you're facing right now?` },
      { sender: "user", content: companion === "monica" ? "No tengo tiempo para mí misma. Me siento culpable cuando trato de descansar." : "I never have time for myself. I feel guilty when I try to rest." },
      { sender: "ai", content: companion === "monica" ? `La culpa es muy común entre los cuidadores, pero recuerda: cuidarte a ti misma no es egoísta, es necesario. Si te agotas, no podrás cuidar a tu madre efectivamente. ¿Qué tal si empezamos con solo 10 minutos al día para ti? Puede ser para tomar un té tranquilamente o dar un paseo corto.` : `Caregiver guilt is so common, but remember: taking care of yourself isn't selfish, it's necessary. You can't pour from an empty cup. What if we started with just 10 minutes a day for yourself? It could be as simple as enjoying a cup of tea or taking a short walk.` },
      { sender: "user", content: companion === "monica" ? "10 minutos suena manejable. Pero aún me siento mal." : "10 minutes sounds manageable. But I still feel bad." },
      { sender: "ai", content: companion === "monica" ? `Es un excelente comienzo. Recuerda que al cuidarte, serás una mejor cuidadora para tu madre. Ella también se beneficia cuando tú estás descansada y menos estresada. ¿Podemos programar esos 10 minutos como una cita importante contigo misma?` : `That's a great start. Remember, by taking care of yourself, you'll be a better caregiver for your mother. She benefits when you're rested and less stressed too. Can we schedule those 10 minutes like an important appointment with yourself?` }
    ],
    "Panic disorder": [
      { sender: "user", content: "I had another panic attack at the grocery store yesterday. I had to leave my cart and run out." },
      { sender: "ai", content: `James, I'm so sorry you experienced that. Panic attacks can be incredibly frightening, especially in public places. You did the right thing by removing yourself from the situation when you needed to. How are you feeling now?` },
      { sender: "user", content: "I'm okay now, but I'm scared to go back. What if it happens again?" },
      { sender: "ai", content: `That fear is completely understandable - it's called anticipatory anxiety, and it's very common after a panic attack. Let's work on a plan together. We can start with visualization exercises from the safety of your home, then gradually work up to short trips to less crowded stores. Would you like to learn the AWARE technique for managing panic symptoms?` },
      { sender: "user", content: "Yes, anything that might help. I need to be able to do normal things again." },
      { sender: "ai", content: `You will be able to, James. The AWARE technique stands for: Accept the anxiety, Watch it without judgment, Act normally and continue, Repeat the steps, and Expect the best. Let's practice this together. Also, remember that panic attacks, while extremely uncomfortable, are not dangerous. Your body is just having a false alarm. We'll work on retraining your alarm system together.` }
    ]
  };
  
  return conversations[anxietyType] || [];
}

async function createAnxietyData(user: any) {
  const anxietyLevels = getAnxietyPattern(user.anxietyType);
  const stmt = sqliteDatabase.prepare(`
    INSERT INTO anxiety_analyses (id, user_id, anxiety_level, anxiety_triggers, coping_strategies, personalized_response, analysis_source, confidence_score, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  let count = 0;
  // Create anxiety data for the past 30 days
  for (let day = 30; day >= 0; day -= 2) {
    const level = anxietyLevels[Math.floor(Math.random() * anxietyLevels.length)];
    // Select 1-2 random triggers for this entry
    const selectedTriggers = [];
    const numTriggers = Math.floor(Math.random() * 2) + 1;
    for (let i = 0; i < numTriggers && i < user.triggers.length; i++) {
      const trigger = user.triggers[Math.floor(Math.random() * user.triggers.length)];
      if (!selectedTriggers.includes(trigger)) {
        selectedTriggers.push(trigger);
      }
    }
    
    const strategies = getCopingStrategies(user.anxietyType);
    const selectedStrategies = strategies.slice(0, Math.floor(Math.random() * 2) + 2);
    
    stmt.run(
      randomUUID(),
      user.id,
      level,
      JSON.stringify(selectedTriggers), // anxiety_triggers
      JSON.stringify(selectedStrategies), // coping_strategies
      getPersonalizedResponse(user.anxietyType, level), // personalized_response
      "claude", // analysis_source
      0.85 + (Math.random() * 0.15), // confidence_score between 0.85-1.0
      daysAgo(day)
    );
    count++;
  }
  
  console.log(`  ✓ Created ${count} anxiety tracking entries with triggers and strategies`);
}

function getAnxietyPattern(anxietyType: string): number[] {
  const patterns: Record<string, number[]> = {
    "Work anxiety": [3, 4, 5, 6, 7, 5, 4], // Higher during weekdays
    "Social anxiety": [4, 5, 6, 5, 4, 3, 4], // Moderate to high
    "Caregiver stress": [5, 6, 7, 6, 5, 6, 7], // Consistently high
    "Panic disorder": [3, 4, 8, 3, 4, 9, 3] // Sporadic spikes
  };
  
  return patterns[anxietyType] || [4, 5, 6, 5, 4];
}

function getCopingStrategies(anxietyType: string): string[] {
  const strategies: Record<string, string[]> = {
    "Work anxiety": [
      "Deep breathing exercises before meetings",
      "Time management and prioritization",
      "Preparation and practice",
      "Positive self-talk and affirmations",
      "5-minute meditation breaks",
      "Progressive muscle relaxation"
    ],
    "Social anxiety": [
      "Gradual exposure to social situations",
      "Relaxation techniques before events",
      "Cognitive restructuring exercises",
      "Social skills practice in safe settings",
      "Mindfulness during conversations",
      "Square breathing technique"
    ],
    "Caregiver stress": [
      "Schedule regular respite care",
      "Join caregiver support groups",
      "Daily 10-minute self-care routine",
      "Setting healthy boundaries",
      "Journaling emotional experiences",
      "Asking for help when needed"
    ],
    "Panic disorder": [
      "AWARE technique for panic attacks",
      "5-4-3-2-1 grounding exercises",
      "Progressive muscle relaxation",
      "Gradual exposure therapy",
      "Diaphragmatic breathing",
      "Reality testing techniques"
    ]
  };
  
  return strategies[anxietyType] || ["Deep breathing", "Mindfulness meditation", "Progressive relaxation"];
}

function getPersonalizedResponse(anxietyType: string, level: number): string {
  const responses: Record<string, { low: string; medium: string; high: string }> = {
    "Work anxiety": {
      low: "Great progress! Your anxiety levels are well-managed. Keep practicing those presentation skills.",
      medium: "You're managing work stress moderately well. Consider scheduling short breaks between tasks.",
      high: "I notice your work anxiety is elevated. Let's practice some breathing exercises together."
    },
    "Social anxiety": {
      low: "Wonderful! You're showing increased comfort in social situations. Your practice is paying off.",
      medium: "You're making progress with social interactions. Remember to use your grounding techniques.",
      high: "Social situations are challenging today. Let's work through the SUDS scale together."
    },
    "Caregiver stress": {
      low: "You're balancing caregiving well today. Your self-care routine is making a difference.",
      medium: "Caregiving demands are moderate today. Remember it's okay to take breaks.",
      high: "Caregiving stress is high. It's important to reach out to your support network."
    },
    "Panic disorder": {
      low: "Excellent management of anxiety today. Your coping skills are strong.",
      medium: "Some anxiety present but manageable. Keep using your breathing techniques.",
      high: "Elevated anxiety detected. Remember: this feeling will pass. Use your AWARE technique."
    }
  };
  
  const typeResponses = responses[anxietyType] || responses["Work anxiety"];
  
  if (level <= 3) return typeResponses.low;
  if (level <= 6) return typeResponses.medium;
  return typeResponses.high;
}

async function createGoals(user: any) {
  const userGoals = getGoalsForAnxietyType(user.anxietyType);
  const goalStmt = sqliteDatabase.prepare(`
    INSERT INTO user_goals (id, user_id, title, description, category, priority, target_date, status, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  let goalsCount = 0;
  
  for (const goalData of userGoals) {
    const goalId = randomUUID();
    
    goalStmt.run(
      goalId,
      user.id,
      goalData.title,
      goalData.description,
      goalData.category,
      "medium",
      daysAgo(-30), // 30 days from now
      "active",
      daysAgo(30),
      daysAgo(0)
    );
    
    goalsCount++;
    
    // Create progress for each goal
    await createGoalProgress(goalId, user.id, goalData);
  }
  
  console.log(`  ✓ Created ${goalsCount} goals with progress tracking`);
}

function getGoalsForAnxietyType(anxietyType: string): any[] {
  const goals: Record<string, any[]> = {
    "Work anxiety": [
      {
        title: "Daily Meditation",
        description: "Practice meditation for anxiety management",
        category: "Mental Health",
        progressPattern: [5, 7, 10, 8, 10, 12, 10]
      },
      {
        title: "Presentation Preparation",
        description: "Practice presentations to build confidence",
        category: "Professional Development",
        progressPattern: [1, 1, 2, 1, 2, 2, 2]
      }
    ],
    "Social anxiety": [
      {
        title: "Social Exposure",
        description: "Gradually increase social interactions",
        category: "Exposure Therapy",
        progressPattern: [1, 2, 2, 3, 2, 3, 3]
      },
      {
        title: "Assertiveness Practice",
        description: "Practice assertive communication",
        category: "Communication Skills",
        progressPattern: [0, 1, 1, 0, 1, 1, 1]
      }
    ],
    "Caregiver stress": [
      {
        title: "Self-Care Time",
        description: "Dedicated time for personal well-being",
        category: "Self-Care",
        progressPattern: [10, 15, 20, 15, 25, 30, 20]
      },
      {
        title: "Support Group",
        description: "Attend caregiver support group meetings",
        category: "Social Support",
        progressPattern: [1, 0, 1, 1, 1, 0, 1]
      }
    ],
    "Panic disorder": [
      {
        title: "Breathing Exercises",
        description: "Practice breathing techniques for panic management",
        category: "Coping Skills",
        progressPattern: [2, 3, 3, 2, 3, 3, 3]
      },
      {
        title: "Gradual Exposure",
        description: "Gradually face feared situations",
        category: "Exposure Therapy",
        progressPattern: [0, 1, 1, 2, 1, 2, 2]
      }
    ]
  };
  
  return goals[anxietyType] || [];
}

async function createGoalProgress(goalId: string, userId: string, goalData: any) {
  const progressStmt = sqliteDatabase.prepare(`
    INSERT INTO goal_progress (id, goal_id, user_id, note, progress_value, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  
  // Create progress entries for the past 30 days
  for (let i = 0; i < 7; i++) {
    const daysOffset = 28 - (i * 4); // Weekly progress
    const score = goalData.progressPattern[i];
    
    progressStmt.run(
      randomUUID(),
      goalId,
      userId,
      score >= 2 ? "Great progress today!" : "Keep working towards your goal",
      score,
      daysAgo(daysOffset)
    );
  }
}

async function createInterventionSummaries(user: any) {
  const summaryStmt = sqliteDatabase.prepare(`
    INSERT INTO intervention_summaries (id, user_id, week_start, week_end, intervention_type, conversation_count, key_points, recommendations, limitations, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  let summariesCount = 0;
  
  // Create weekly intervention summaries for the past month
  for (let week = 0; week < 4; week++) {
    const weekStartDate = new Date();
    weekStartDate.setDate(weekStartDate.getDate() - (28 - (week * 7)));
    const weekEndDate = new Date(weekStartDate);
    weekEndDate.setDate(weekEndDate.getDate() + 6);
    
    const weekStart = weekStartDate.toISOString().split('T')[0];
    const weekEnd = weekEndDate.toISOString().split('T')[0];
    
    // Generate conversation count (3-8 conversations per week)
    const conversationCount = 3 + Math.floor(Math.random() * 6);
    
    // Get intervention-specific data
    const interventionData = getInterventionData(user.anxietyType, week);
    
    summaryStmt.run(
      randomUUID(),
      user.id,
      weekStart,
      weekEnd,
      getInterventionType(user.anxietyType),
      conversationCount, // conversation_count
      JSON.stringify(interventionData.keyPoints), // key_points
      JSON.stringify(interventionData.recommendations), // recommendations
      JSON.stringify(interventionData.limitations), // limitations
      daysAgo(28 - (week * 7)),
      daysAgo(28 - (week * 7))
    );
    summariesCount++;
  }
  
  console.log(`  ✓ Created ${summariesCount} intervention summaries with detailed content`);
}

function getInterventionType(anxietyType: string): string {
  const types: Record<string, string> = {
    "Work anxiety": "CBT",
    "Social anxiety": "Exposure Therapy",
    "Caregiver stress": "Supportive Counseling",
    "Panic disorder": "CBT with Exposure"
  };
  
  return types[anxietyType] || "CBT";
}

function getInterventionData(anxietyType: string, week: number): { keyPoints: string[], recommendations: string[], limitations: string[] } {
  const interventionData: Record<string, { keyPoints: string[][], recommendations: string[][], limitations: string[][] }> = {
    "Work anxiety": {
      keyPoints: [
        [
          "Patient identified presentation anxiety as primary trigger",
          "Successfully practiced breathing techniques before meetings",
          "Reported 30% reduction in pre-meeting anxiety levels",
          "Developed personalized preparation checklist"
        ],
        [
          "Time management strategies showing positive results",
          "Implemented Pomodoro technique for deadline management",
          "Anxiety levels decreased from 7/10 to 5/10 during work hours",
          "Better at recognizing early warning signs of stress"
        ],
        [
          "Positive self-talk replacing negative thought patterns",
          "Successfully challenged catastrophic thinking",
          "Confidence in presentations increased significantly",
          "Practicing assertiveness in workplace communications"
        ],
        [
          "Daily meditation practice established (10-15 minutes)",
          "Using grounding techniques during stressful moments",
          "Sleep quality improved with evening relaxation routine",
          "Overall anxiety baseline reduced from 6/10 to 4/10"
        ]
      ],
      recommendations: [
        [
          "Continue daily breathing exercises before high-stress tasks",
          "Schedule regular breaks during intense work periods",
          "Practice presentations in safe environment weekly",
          "Maintain sleep hygiene routine"
        ],
        [
          "Implement weekly planning sessions on Sundays",
          "Use time-blocking for complex projects",
          "Set realistic deadlines with buffer time",
          "Practice saying no to excessive workload"
        ],
        [
          "Keep journal of positive work achievements",
          "Continue cognitive restructuring exercises",
          "Join professional speaking group for practice",
          "Schedule monthly check-ins with supervisor"
        ],
        [
          "Increase meditation to 20 minutes daily",
          "Explore progressive muscle relaxation",
          "Consider workplace wellness programs",
          "Maintain consistent exercise routine"
        ]
      ],
      limitations: [
        [
          "High-pressure deadlines still trigger significant anxiety",
          "Difficulty implementing strategies during crisis situations",
          "Perfectionism tendencies interfering with progress"
        ],
        [
          "Resistance to delegating tasks to colleagues",
          "Procrastination patterns still present for difficult tasks",
          "Weekend work affecting work-life balance"
        ],
        [
          "Self-criticism still occurs after perceived failures",
          "Impostor syndrome affecting confidence intermittently",
          "Avoiding certain leadership opportunities"
        ],
        [
          "Meditation practice inconsistent during busy periods",
          "Physical tension still present during stress",
          "Occasional sleep disruption before important events"
        ]
      ]
    },
    "Social anxiety": {
      keyPoints: [
        [
          "Identified specific social triggers (meetings, phone calls)",
          "Practiced gradual exposure to small group settings",
          "Anxiety in meetings reduced from 8/10 to 6/10",
          "Developed pre-social event coping routine"
        ],
        [
          "Successfully attended two meetings without leaving early",
          "Eye contact duration increased in conversations",
          "Initiated three workplace conversations this week",
          "Used grounding techniques during social interactions"
        ],
        [
          "Conversation skills improving with practice",
          "Less rumination after social interactions",
          "Attended team lunch without excessive anxiety",
          "Positive feedback from colleagues noted"
        ],
        [
          "Completed networking event with preparation strategies",
          "Anxiety anticipation reduced significantly",
          "Building confidence in professional interactions",
          "Social support network expanding gradually"
        ]
      ],
      recommendations: [
        [
          "Continue gradual exposure hierarchy",
          "Practice conversation starters daily",
          "Use square breathing before social events",
          "Reward yourself after social achievements"
        ],
        [
          "Schedule regular one-on-one interactions",
          "Join workplace social committee",
          "Practice assertiveness in safe settings",
          "Continue challenging negative predictions"
        ],
        [
          "Maintain social skills practice log",
          "Explore group therapy or support groups",
          "Set weekly social interaction goals",
          "Practice self-compassion after difficult interactions"
        ],
        [
          "Consider joining professional associations",
          "Continue building on networking successes",
          "Maintain regular therapy sessions",
          "Explore mindfulness-based social anxiety techniques"
        ]
      ],
      limitations: [
        [
          "Large group settings still very challenging",
          "Phone anxiety persists despite practice",
          "Avoidance of spontaneous social situations"
        ],
        [
          "Public speaking remains highly anxiety-provoking",
          "Difficulty maintaining conversations beyond small talk",
          "Physical symptoms (blushing, sweating) still present"
        ],
        [
          "Dating and intimate relationships still avoided",
          "Difficulty accepting social invitations",
          "Perfectionism in social performance"
        ],
        [
          "Networking follow-up remains challenging",
          "Virtual meetings still cause significant anxiety",
          "Recovery time needed after social events"
        ]
      ]
    },
    "Caregiver stress": {
      keyPoints: [
        [
          "Recognized burnout symptoms and need for self-care",
          "Established 10-minute daily personal time",
          "Identified primary stressors in caregiving routine",
          "Connected with local caregiver support resources"
        ],
        [
          "Successfully delegated two caregiving tasks",
          "Joined online caregiver support group",
          "Stress levels decreased after implementing boundaries",
          "Sleep quality improved with evening routine"
        ],
        [
          "Arranged weekly respite care for 3 hours",
          "Practiced saying no to additional responsibilities",
          "Emotional regulation improved with journaling",
          "Family meeting held to discuss care distribution"
        ],
        [
          "Self-care routine now consistent daily practice",
          "Support network actively utilized",
          "Guilt about self-care significantly reduced",
          "Overall well-being scores improved by 40%"
        ]
      ],
      recommendations: [
        [
          "Increase personal time to 20 minutes daily",
          "Explore respite care options in community",
          "Continue support group participation",
          "Practice mindfulness during caregiving tasks"
        ],
        [
          "Schedule regular health check-ups for yourself",
          "Create emergency care backup plan",
          "Maintain boundaries with extended family",
          "Explore caregiver counseling services"
        ],
        [
          "Increase respite care to twice weekly",
          "Join caregiver exercise or wellness class",
          "Document care routine for backup caregivers",
          "Plan monthly activities for personal enjoyment"
        ],
        [
          "Continue building sustainable care routine",
          "Explore long-term care planning options",
          "Maintain regular therapy or counseling",
          "Celebrate caregiving achievements regularly"
        ]
      ],
      limitations: [
        [
          "Guilt still arises when prioritizing self-care",
          "Financial stress affecting care options",
          "Limited family support available"
        ],
        [
          "Difficulty maintaining boundaries consistently",
          "Physical exhaustion affecting mood",
          "Resistance from care recipient to outside help"
        ],
        [
          "Anticipatory grief affecting daily functioning",
          "Work-caregiving balance still challenging",
          "Social isolation from friends persists"
        ],
        [
          "Long-term sustainability concerns remain",
          "Healthcare navigation still overwhelming",
          "Limited time for preventive self-care"
        ]
      ]
    },
    "Panic disorder": {
      keyPoints: [
        [
          "Learned AWARE technique for panic management",
          "Identified early warning signs of panic attacks",
          "Panic frequency reduced from daily to 2-3 times weekly",
          "Successfully used grounding during mild panic episode"
        ],
        [
          "Completed first grocery store visit in weeks",
          "Driving anxiety reduced with gradual exposure",
          "Interoceptive exposure exercises showing progress",
          "Catastrophic thoughts challenged successfully"
        ],
        [
          "Full shopping trip completed without leaving",
          "Panic intensity decreased from 9/10 to 6/10",
          "Recovery time after panic reduced by 50%",
          "Anticipatory anxiety showing improvement"
        ],
        [
          "Significant reduction in panic frequency (weekly)",
          "Returned to most daily activities",
          "Confidence in coping abilities increased",
          "Quality of life scores improved significantly"
        ]
      ],
      recommendations: [
        [
          "Continue daily AWARE technique practice",
          "Maintain exposure hierarchy progression",
          "Practice interoceptive exercises daily",
          "Keep panic diary for pattern recognition"
        ],
        [
          "Increase exposure to avoided situations gradually",
          "Continue challenging catastrophic predictions",
          "Maintain regular cardiovascular exercise",
          "Practice acceptance of anxiety sensations"
        ],
        [
          "Expand comfort zone systematically",
          "Join panic disorder support group",
          "Continue medication compliance if prescribed",
          "Plan for setback management strategies"
        ],
        [
          "Maintain gains through regular practice",
          "Consider reducing safety behaviors gradually",
          "Explore mindfulness-based panic reduction",
          "Plan for long-term maintenance strategies"
        ]
      ],
      limitations: [
        [
          "Crowded spaces still trigger high anxiety",
          "Safety behaviors still relied upon heavily",
          "Nighttime panic attacks persist"
        ],
        [
          "Highway driving remains avoided",
          "Medical appointments cause significant anxiety",
          "Physical symptoms still misinterpreted as danger"
        ],
        [
          "Air travel still completely avoided",
          "Alone time away from home limited",
          "Hypervigilance to body sensations continues"
        ],
        [
          "Occasional setbacks during stress periods",
          "Some situations still require companion",
          "Medication side effects affecting adherence"
        ]
      ]
    }
  };
  
  const data = interventionData[anxietyType];
  if (!data) {
    // Fallback data if anxiety type not found
    return {
      keyPoints: ["Patient engaged in therapeutic interventions", "Showing gradual improvement", "Coping strategies being developed"],
      recommendations: ["Continue current treatment plan", "Practice learned techniques daily", "Maintain regular therapy sessions"],
      limitations: ["Some resistance to change noted", "Consistency in practice needed", "Environmental stressors persist"]
    };
  }
  
  const weekIndex = Math.min(week, data.keyPoints.length - 1);
  return {
    keyPoints: data.keyPoints[weekIndex],
    recommendations: data.recommendations[weekIndex],
    limitations: data.limitations[weekIndex]
  };
}

// Run the population script
populateTestData()
  .then(() => {
    console.log("\n✨ All test data successfully created!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Error populating test data:", error);
    process.exit(1);
  });