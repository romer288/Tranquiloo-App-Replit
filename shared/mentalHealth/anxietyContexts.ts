export type ContextConfidence = 'low' | 'medium' | 'high';

export interface ConditionSummary {
  score: number;
  matches: string[];
  thresholdMet: boolean;
  confidence: ContextConfidence;
}

export interface AnxietyContextSummary {
  generalAnxiety: ConditionSummary;
  panic: ConditionSummary;
  ptsd: ConditionSummary;
  ocd: ConditionSummary;
  depression: ConditionSummary;
  crisis: ConditionSummary;
  positive: ConditionSummary;
}

interface PatternDefinition {
  regex: RegExp;
  weight: number;
  description: string;
}

const computeConfidence = (score: number, threshold: number): ContextConfidence => {
  if (score >= threshold + 3) {
    return 'high';
  }
  if (score >= threshold + 1) {
    return 'medium';
  }
  return score >= threshold ? 'low' : 'low';
};

const evaluatePatterns = (
  text: string,
  patterns: PatternDefinition[],
  threshold: number
): ConditionSummary => {
  const matches: string[] = [];
  let score = 0;

  for (const pattern of patterns) {
    if (pattern.regex.test(text)) {
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

const createBidirectionalPattern = (
  first: RegExp,
  second: RegExp,
  description: string,
  weight = 3,
  window = 80
): PatternDefinition[] => {
  return [
    {
      regex: new RegExp(`${first.source}.{0,${window}}${second.source}`, first.flags.replace('g', '')),
      weight,
      description
    },
    {
      regex: new RegExp(`${second.source}.{0,${window}}${first.source}`, second.flags.replace('g', '')),
      weight,
      description
    }
  ];
};

const GENERAL_ANXIETY_PATTERNS: PatternDefinition[] = [
  { regex: /\banxious\b/i, weight: 3, description: 'Explicit anxiety mention' },
  { regex: /\banxiety (?:attack|attacks)\b/i, weight: 4, description: 'Anxiety attack described' },
  { regex: /\bpanic wave\b/i, weight: 3, description: 'Describes wave of panic' },
  { regex: /\bconstant (?:worry|fear)\b/i, weight: 3, description: 'Constant worry described' },
  { regex: /\bcan't (?:stop|seem to stop) (?:worrying|thinking)\b/i, weight: 3, description: 'Cannot stop worrying' },
  { regex: /\boverwhelmed\b/i, weight: 2, description: 'Feeling overwhelmed' },
  { regex: /\bnervous\b/i, weight: 2, description: 'Feeling nervous' },
  { regex: /\brestless\b/i, weight: 2, description: 'Restlessness described' },
  { regex: /\bstress(ed|ing)?\b/i, weight: 2, description: 'Stress described' },
  { regex: /\bworried\b/i, weight: 3, description: 'Worry described' }
];

const PANIC_PATTERNS: PatternDefinition[] = [
  { regex: /\bpanic attack(s)?\b/i, weight: 4, description: 'Panic attack mentioned' },
  { regex: /\bheart (?:is )?(?:racing|pounding)\b/i, weight: 3, description: 'Heart racing' },
  { regex: /\bcan'?t breathe\b/i, weight: 3, description: 'Difficulty breathing' },
  { regex: /\bchest (?:pain|tight)\b/i, weight: 2, description: 'Chest pain/tightness' },
  { regex: /\bfeel like i'm (?:dying|going to die)\b/i, weight: 3, description: 'Feeling like dying' },
  { regex: /\blosing control\b/i, weight: 2, description: 'Losing control sensation' },
  { regex: /\bdissociating\b/i, weight: 2, description: 'Dissociation mentioned' }
];

const PTSD_PATTERNS: PatternDefinition[] = [
  { regex: /\bflashback(s)?\b/i, weight: 4, description: 'Flashback described' },
  { regex: /\bnightmares?\b/i, weight: 2, description: 'Trauma nightmares' },
  { regex: /\bptsd\b/i, weight: 3, description: 'PTSD mentioned' },
  { regex: /\btrauma\b/i, weight: 2, description: 'Trauma mentioned' },
  { regex: /\btrigger(?:ed|ing)?\b/i, weight: 3, description: 'Triggered response' },
  { regex: /\bhypervigilant\b/i, weight: 3, description: 'Hypervigilance mentioned' }
];

const OCD_PATTERNS: PatternDefinition[] = [
  { regex: /\bocd\b/i, weight: 3, description: 'OCD explicitly mentioned' },
  { regex: /\b(compulsion|compulsive|compulsions)\b/i, weight: 3, description: 'Compulsion described' },
  { regex: /\bintrusive thoughts?\b/i, weight: 3, description: 'Intrusive thoughts described' },
  ...createBidirectionalPattern(/(?:can't|cannot|can\'t) stop/i, /(?:checking|washing|cleaning|counting|rituals?)/i, 'Compulsion urge with ritual'),
  ...createBidirectionalPattern(/(?:urge|need) to/i, /(?:check|wash|clean|count|repeat)/i, 'Compulsive urge linked to behavior'),
  {
    regex: /(?:ritual|checking|washing|counting|cleaning|repeating).{0,80}(?:makes me feel better|reduces anxiety)/i,
    weight: 2,
    description: 'Ritual linked to anxiety relief'
  }
];

const DEPRESSION_PATTERNS: PatternDefinition[] = [
  { regex: /\bdepress(ed|ion)\b/i, weight: 3, description: 'Depression mentioned' },
  { regex: /\bhopeless\b/i, weight: 3, description: 'Hopelessness described' },
  { regex: /\bworthless\b/i, weight: 3, description: 'Worthlessness described' },
  { regex: /\bempty inside\b/i, weight: 3, description: 'Emptiness described' },
  { regex: /\bcan't get out of bed\b/i, weight: 4, description: 'Low motivation described' },
  { regex: /\bno motivation\b/i, weight: 3, description: 'No motivation' },
  { regex: /\bnothing (?:matters|feels good)\b/i, weight: 3, description: 'Anhedonia described' }
];

const CRISIS_PATTERNS: PatternDefinition[] = [
  { regex: /\bhurt myself\b/i, weight: 4, description: 'Self-harm intent' },
  { regex: /\bkill myself\b/i, weight: 5, description: 'Explicit suicide intent' },
  { regex: /\bend my life\b/i, weight: 5, description: 'Intent to end life' },
  { regex: /\btake my life\b/i, weight: 5, description: 'Intent to take life' },
  { regex: /\bsuicidal thoughts?\b/i, weight: 4, description: 'Suicidal thoughts' },
  { regex: /\bcan't go on\b/i, weight: 3, description: 'Expressed inability to continue' },
  { regex: /\bno reason to live\b/i, weight: 4, description: 'Loss of will to live' }
];

const POSITIVE_PATTERNS: PatternDefinition[] = [
  { regex: /\bfeeling (?:calm|better|good|okay now)\b/i, weight: 3, description: 'Positive feeling reported' },
  { regex: /\bnot anxious anymore\b/i, weight: 3, description: 'Anxiety relief reported' },
  { regex: /\bmanaging (?:well|better)\b/i, weight: 2, description: 'Managing feelings' },
  { regex: /\bfinding peace\b/i, weight: 2, description: 'Sense of peace' }
];

const normalizeMessage = (message: string): string =>
  message
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s']/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

export const analyzeAnxietyContext = (message: string): AnxietyContextSummary => {
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

const TRIGGER_PATTERNS: Record<string, RegExp[]> = {
  driving_anxiety: [/\bdriv(?:ing|e)\b/i, /\btraffic\b/i, /\bintersection\b/i, /\bhighway\b/i],
  work: [/\bwork\b/i, /\bjob\b/i, /\bboss\b/i, /\boffice\b/i, /\bmeeting\b/i, /\bdeadline\b/i],
  social: [/\bsocial\b/i, /\bcrowd\b/i, /\bpublic speaking\b/i, /\bparty\b/i, /\bbeing around people\b/i],
  health: [/\bdoctor\b/i, /\bhospital\b/i, /\bmedical\b/i, /\bsymptom\b/i, /\bdiagnos/i, /\bhealth\b/i],
  financial: [/\bmoney\b/i, /\bbills?\b/i, /\bdebt\b/i, /\brent\b/i, /\bpaycheck\b/i, /\bsavings\b/i],
  relationships: [/\brelationship\b/i, /\bpartner\b/i, /\bhusband\b/i, /\bwife\b/i, /\bboyfriend\b/i, /\bgirlfriend\b/i, /\bmarriage\b/i, /\bdivorce\b/i, /\bbreak ?up\b/i, /\bcheat(?:ed|ing)?\b/i],
  performance: [/\btest\b/i, /\bexam\b/i, /\binterview\b/i, /\bgrades?\b/i, /\baudition\b/i, /\bperformance review\b/i],
  future_uncertainty: [/\bfuture\b/i, /\buncertain\b/i, /\bdon't know what to do\b/i, /\bno idea what comes next\b/i, /\bplan\b/i, /\bdecision\b/i]
};

export const detectAnxietyTriggers = (message: string): string[] => {
  const normalized = normalizeMessage(message);
  const triggers: string[] = [];

  for (const [trigger, patterns] of Object.entries(TRIGGER_PATTERNS)) {
    if (patterns.some(pattern => pattern.test(normalized))) {
      triggers.push(trigger);
    }
  }

  return triggers;
};

export const detectCognitivePatterns = (message: string): string[] => {
  const normalized = normalizeMessage(message);
  const distortions: string[] = [];

  if (/(always|never|everyone|nobody)\b/.test(normalized)) {
    distortions.push('All-or-nothing thinking');
  }

  if (/should\b|must\b|have to\b/.test(normalized)) {
    distortions.push('Should statements');
  }

  if (/(worst case|disaster|catastroph|awful|terrible|ruined)/.test(normalized)) {
    distortions.push('Catastrophizing');
  }

  return distortions;
};
