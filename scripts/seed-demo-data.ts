import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';

type PatientSeed = {
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  patientCode: string;
  anxietyFocus: string;
};

type TherapistSeed = {
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  licenseNumber: string;
  licenseState: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  specialty: string;
  bio: string;
  website: string;
  yearsOfExperience: number;
  rating: string;
};

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY in environment.');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);
const now = Date.now();

const patients: PatientSeed[] = [
  {
    email: 'maya.patel@example.com',
    firstName: 'Maya',
    lastName: 'Patel',
    password: 'CalmPass!123',
    patientCode: 'PT-MAYA-' + Math.random().toString(36).slice(2, 6).toUpperCase(),
    anxietyFocus: 'Social + performance anxiety (presentations, group settings)',
  },
  {
    email: 'javier.cruz@example.com',
    firstName: 'Javier',
    lastName: 'Cruz',
    password: 'Grounded!456',
    patientCode: 'PT-JAVIER-' + Math.random().toString(36).slice(2, 6).toUpperCase(),
    anxietyFocus: 'Panic attacks + generalized worry (physical symptoms)',
  },
  {
    email: 'lila.chen@example.com',
    firstName: 'Lila',
    lastName: 'Chen',
    password: 'SteadyMind!789',
    patientCode: 'PT-LILA-' + Math.random().toString(36).slice(2, 6).toUpperCase(),
    anxietyFocus: 'Health anxiety + rumination (sleep disruption)',
  },
  {
    email: 'noah.williams@example.com',
    firstName: 'Noah',
    lastName: 'Williams',
    password: 'Reset!2024',
    patientCode: 'PT-NOAH-' + Math.random().toString(36).slice(2, 6).toUpperCase(),
    anxietyFocus: 'Trauma-related hypervigilance + nightmares',
  },
];

const therapists: TherapistSeed[] = [
  {
    email: 'elena.kim@example.com',
    firstName: 'Elena',
    lastName: 'Kim',
    password: 'Therapist#1',
    licenseNumber: 'CA-LMFT-112233',
    licenseState: 'CA',
    phone: '415-555-0123',
    address: '250 Mission St Suite 400',
    city: 'San Francisco',
    state: 'CA',
    zipCode: '94105',
    specialty: 'Trauma, EMDR, anxiety disorders',
    bio: 'LMFT focusing on trauma, complex anxiety, and practical skills for nervous system regulation.',
    website: 'https://dr-elenakim.example.com',
    yearsOfExperience: 12,
    rating: '4.9',
  },
  {
    email: 'omar.ali@example.com',
    firstName: 'Omar',
    lastName: 'Ali',
    password: 'Therapist#2',
    licenseNumber: 'NY-LCSW-778899',
    licenseState: 'NY',
    phone: '646-555-0456',
    address: '80 Pine St Floor 12',
    city: 'New York',
    state: 'NY',
    zipCode: '10005',
    specialty: 'CBT for panic, social anxiety, and performance',
    bio: 'LCSW specializing in CBT/ACT for panic, social anxiety, and workplace stress.',
    website: 'https://dr-omarali.example.com',
    yearsOfExperience: 10,
    rating: '4.8',
  },
];

const daysAgo = (d: number) => now - d * 24 * 60 * 60 * 1000;

async function main() {
  // Seed profiles (patients + therapists)
  const profileSeeds = [
    ...patients.map((p) => ({
      id: randomUUID(),
      email: p.email,
      first_name: p.firstName,
      last_name: p.lastName,
      role: 'patient',
      hashed_password: '' as string,
      patient_code: p.patientCode,
      email_verified: true,
      auth_method: 'email',
      created_at: now,
      updated_at: now,
    })),
    ...therapists.map((t) => ({
      id: randomUUID(),
      email: t.email,
      first_name: t.firstName,
      last_name: t.lastName,
      role: 'therapist',
      hashed_password: '' as string,
      patient_code: null,
      email_verified: true,
      auth_method: 'email',
      license_number: t.licenseNumber,
      license_state: t.licenseState,
      created_at: now,
      updated_at: now,
    })),
  ];

  for (const profile of profileSeeds) {
    const plain =
      patients.find((p) => p.email === profile.email)?.password ||
      therapists.find((t) => t.email === profile.email)?.password ||
      'Password123!';
    profile.hashed_password = await bcrypt.hash(plain, 10);
  }

  const { data: profiles, error: profileError } = await supabase
    .from('profiles')
    .upsert(profileSeeds, { onConflict: 'email' })
    .select();

  if (profileError) throw profileError;
  if (!profiles) throw new Error('Profile upsert returned no data');

  const profileByEmail = Object.fromEntries(profiles.map((p) => [p.email, p]));

  // Seed therapists table with richer metadata
  const therapistRows = therapists.map((t) => ({
    id: profileByEmail[t.email].id,
    name: `${t.firstName} ${t.lastName}`,
    email: t.email,
    phone: t.phone,
    address: t.address,
    city: t.city,
    state: t.state,
    zip_code: t.zipCode,
    licensure: t.licenseNumber,
    specialty: t.specialty,
    insurance: 'Aetna, Blue Cross, Cigna',
    practice_type: 'hybrid',
    accepting_patients: true,
    accepts_uninsured: true,
    years_of_experience: t.yearsOfExperience,
    rating: t.rating,
    bio: t.bio,
    website: t.website,
    created_at: now,
    updated_at: now,
  }));

  const { error: therapistError } = await supabase
    .from('therapists')
    .upsert(therapistRows, { onConflict: 'id' });
  if (therapistError) throw therapistError;

  // Anxiety analyses per patient
  const anxietyAnalyses = patients.flatMap((p, idx) => {
    const userId = profileByEmail[p.email].id;
    const themes = [
      {
        triggers: 'Crowded rooms, group introductions, eye contact during presentations',
        strategies: 'Box breathing, scripted openers, 2-minute ground + reframe',
        level: 7,
        confidence: '0.82',
      },
      {
        triggers: 'Heart racing before meetings, fear of judgment, perfectionism',
        strategies: '5-4-3-2-1 sensory, outcome laddering, imperfect reps',
        level: 6,
        confidence: '0.78',
      },
      {
        triggers: 'Sunday scaries, upcoming deadlines, sleep disruption',
        strategies: 'Worry time blocks, sleep wind-down, body scan',
        level: 5,
        confidence: '0.8',
      },
    ];
    return themes.map((t, n) => ({
      id: randomUUID(),
      user_id: userId,
      message_id: null,
      anxiety_level: t.level + (idx % 2),
      analysis_source: 'seed-script',
      anxiety_triggers: t.triggers,
      coping_strategies: t.strategies,
      personalized_response: `Noted pattern: ${p.anxietyFocus}. Prioritize short nervous-system resets, then exposure with safety behaviors reduced by 20%.`,
      confidence_score: t.confidence,
      created_at: daysAgo(10 - n * 2 - idx),
    }));
  });

  const { error: analysisError } = await supabase
    .from('anxiety_analyses')
    .upsert(anxietyAnalyses, { onConflict: 'id' });
  if (analysisError) throw analysisError;

  // Goals + progress
  const userGoals: any[] = [];
  const goalProgressRows: any[] = [];

  patients.forEach((p, i) => {
    const userId = profileByEmail[p.email].id;
    const goalsForUser = [
      {
        id: randomUUID(),
        title: 'Daily grounding practice',
        description: '5-10 minutes of breathing/body scan after lunch',
        category: 'anxiety_regulation',
        frequency: 'daily',
        target_value: 7,
        unit: 'sessions/week',
        start_date: '2025-02-01',
        end_date: '2025-03-01',
        source: 'seed-script',
      },
      {
        id: randomUUID(),
        title: 'Exposure reps',
        description: 'Intentional exposures with reduced safety behaviors',
        category: 'exposure',
        frequency: '3x/week',
        target_value: 3,
        unit: 'exposures/week',
        start_date: '2025-02-01',
        end_date: '2025-03-15',
        source: 'seed-script',
      },
    ];

    goalsForUser.forEach((g, idx) => {
      userGoals.push({
        ...g,
        user_id: userId,
        is_active: true,
        created_at: now - (idx + i) * 1000,
        updated_at: now - (idx + i) * 1000,
      });

      goalProgressRows.push({
        id: randomUUID(),
        user_id: userId,
        goal_id: g.id,
        score: 2 + idx + i,
        notes: 'Logged via seed data',
        recorded_at: new Date(daysAgo(5 + idx)).toISOString(),
        created_at: daysAgo(5 + idx),
      });
    });
  });

  const { error: goalsError } = await supabase
    .from('user_goals')
    .upsert(userGoals, { onConflict: 'id' });
  if (goalsError) throw goalsError;

  const { error: progressError } = await supabase
    .from('goal_progress')
    .upsert(goalProgressRows, { onConflict: 'id' });
  if (progressError) throw progressError;

  // Intervention summaries
  const interventionSummaries = patients.map((p, idx) => {
    const userId = profileByEmail[p.email].id;
    return {
      id: randomUUID(),
      user_id: userId,
      week_start: '2025-02-03',
      week_end: '2025-02-10',
      intervention_type: idx % 2 === 0 ? 'cbt' : 'act',
      conversation_count: 4 + idx,
      key_points: `Exposure hierarchy, grounding, values-driven actions. Focus: ${p.anxietyFocus}.`,
      created_at: now,
      updated_at: now,
    };
  });

  const { error: summariesError } = await supabase
    .from('intervention_summaries')
    .upsert(interventionSummaries, { onConflict: 'id' });
  if (summariesError) throw summariesError;

  // Therapist connections (user_therapists + therapist_patient_connections)
  const userTherapistsRows: any[] = [];
  const therapistConnections: any[] = [];

  patients.forEach((p, idx) => {
    const userId = profileByEmail[p.email].id;
    const therapist = idx % 2 === 0 ? therapists[0] : therapists[1];
    userTherapistsRows.push({
      id: randomUUID(),
      user_id: userId,
      therapist_name: `${therapist.firstName} ${therapist.lastName}`,
      contact_method: 'email',
      contact_value: therapist.email,
      notes: 'Seeded match',
      share_report: true,
      is_active: true,
      created_at: now,
      updated_at: now,
    });

    therapistConnections.push({
      id: randomUUID(),
      patient_id: userId,
      therapist_email: therapist.email,
      patient_email: p.email,
      patient_code: p.patientCode,
      patient_consent_given: true,
      therapist_accepted: true,
      connection_request_date: daysAgo(7),
      connection_accepted_date: daysAgo(6),
      share_analytics: true,
      share_reports: true,
      is_active: true,
      notes: 'Seeded trusted connection',
      created_at: now,
      updated_at: now,
    });
  });

  const { error: userTherapistError } = await supabase
    .from('user_therapists')
    .upsert(userTherapistsRows, { onConflict: 'id' });
  if (userTherapistError) throw userTherapistError;

  const { error: connError } = await supabase
    .from('therapist_patient_connections')
    .upsert(therapistConnections, { onConflict: 'id' });
  if (connError) throw connError;

  // Chat sessions + messages for flavor
  const chatSessions: any[] = [];
  const chatMessages: any[] = [];

  patients.forEach((p, idx) => {
    const userId = profileByEmail[p.email].id;
    const sessionId = randomUUID();
    chatSessions.push({
      id: sessionId,
      user_id: userId,
      title: `Session on ${p.anxietyFocus}`,
      ai_companion: 'vanessa',
      language: 'english',
      created_at: now - idx * 1000,
      updated_at: now - idx * 1000,
    });

    chatMessages.push(
      {
        id: randomUUID(),
        session_id: sessionId,
        user_id: userId,
        content: 'I notice my heart racing before speaking up in meetings.',
        sender: 'user',
        created_at: now - idx * 1000 - 500,
      },
      {
        id: randomUUID(),
        session_id: sessionId,
        user_id: userId,
        content: 'Try a 90-second breath cycle, then state one clear ask to reduce ambiguity.',
        sender: 'ai',
        created_at: now - idx * 1000 - 400,
      },
    );
  });

  const { error: sessionError } = await supabase
    .from('chat_sessions')
    .upsert(chatSessions, { onConflict: 'id' });
  if (sessionError) throw sessionError;

  const { error: messageError } = await supabase
    .from('chat_messages')
    .upsert(chatMessages, { onConflict: 'id' });
  if (messageError) throw messageError;

  console.log('Seed complete.');
  console.log('Test credentials (email / password / patientCode or license):');
  patients.forEach((p) => {
    console.log(`Patient: ${p.email} / ${p.password} / code: ${p.patientCode} / focus: ${p.anxietyFocus}`);
  });
  therapists.forEach((t) => {
    console.log(`Therapist: ${t.email} / ${t.password} / license: ${t.licenseNumber}`);
  });
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
