export type TranslateFn = (key: string, fallback?: string) => string;

const normalize = (raw: string): string =>
  String(raw ?? '')
    .trim()
    .toLowerCase()
    .replace(/[’']/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const INTERVENTION_KEY_BY_NORMALIZED: Record<string, string> = {
  // Existing long-form interventions (already in translation map)
  'practice deep breathing exercises': 'anxietyAnalysis.interventions.deepBreathing',
  'try progressive muscle relaxation': 'anxietyAnalysis.interventions.progressiveMuscle',
  'use grounding techniques 5 4 3 2 1 method': 'anxietyAnalysis.interventions.grounding',
  'consider journaling your thoughts': 'anxietyAnalysis.interventions.journaling',
  'contact crisis hotline immediately': 'anxietyAnalysis.interventions.crisisHotline',
  'reach out to emergency services if needed': 'anxietyAnalysis.interventions.emergencyServices',

  // Common short-form strategies seen in analytics/seed data
  'box breathing': 'anxietyAnalysis.interventions.boxBreathing',
  'scripted openers': 'anxietyAnalysis.interventions.scriptedOpeners',
  '2 minute ground reframe': 'anxietyAnalysis.interventions.twoMinuteGroundReframe',
  '5 4 3 2 1 sensory': 'anxietyAnalysis.interventions.sensory54321',
  sensory: 'anxietyAnalysis.interventions.sensory54321',
  'outcome laddering': 'anxietyAnalysis.interventions.outcomeLaddering',
  'imperfect reps': 'anxietyAnalysis.interventions.imperfectReps',
  'worry time block': 'anxietyAnalysis.interventions.worryTimeBlocks',
  'worry time blocks': 'anxietyAnalysis.interventions.worryTimeBlocks',
  'scheduled worry time': 'anxietyAnalysis.interventions.scheduledWorryTime',
  'sleep wind down': 'anxietyAnalysis.interventions.sleepWindDown',
  'body scan': 'anxietyAnalysis.interventions.bodyScan',
  'thought defusion': 'anxietyAnalysis.interventions.thoughtDefusion',
  'stimulus control': 'anxietyAnalysis.interventions.stimulusControl',
};

export function translateInterventionLabel(raw: string, t: TranslateFn): string {
  if (!raw) return '';
  const key = INTERVENTION_KEY_BY_NORMALIZED[normalize(raw)];
  return key ? t(key, raw) : raw;
}


