export type PsychosisConfidence = 'low' | 'medium' | 'high';

export interface PsychosisDetectionResult {
  hasIndicators: boolean;
  matches: string[];
  confidence: PsychosisConfidence;
}

const SURVEILLANCE_TERMS = [
  'following me',
  'following us',
  'after me',
  'after us',
  'watching me',
  'watching us',
  'tracking me',
  'tracking us',
  'spying on me',
  'spying on us',
  'bugging me',
  'bugging us'
];

const AGENCY_REGEX = /\b(cia|fbi|nsa|mi6|mossad|agents?|spies|intelligence agency)\b/i;

const DIRECT_KEYWORDS: RegExp[] = [
  /\bhallucinat(?:e|ing|ion|ions)\b/i,
  /\bpsychosis\b/i,
  /\bpsychotic\b/i,
  /\bdelusion(?:s)?\b/i,
  /\bparanoi[ad]\b/i,
  /\bschizophren(?:ia|ic)\b/i
];

const CONTEXT_PATTERNS: RegExp[] = [
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

const WINDOW_SIZE = 4;

const normalizeForWindowSearch = (text: string) =>
  text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s']/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const tokenize = (text: string) =>
  (text ? text.split(' ') : []).filter(Boolean);

const hasSurveillanceAgencyContext = (text: string): boolean => {
  if (!AGENCY_REGEX.test(text)) {
    return false;
  }

  const normalized = normalizeForWindowSearch(text);
  const tokens = tokenize(normalized);
  const agencyIndices = tokens
    .map((token, index) => ({ token, index }))
    .filter(({ token }) => /^(cia|fbi|nsa|mi6|mossad|agent|agents|spy|spies|intelligence|agency)$/.test(token))
    .map(({ index }) => index);

  if (agencyIndices.length === 0) {
    return false;
  }

  const surveillanceTokens = SURVEILLANCE_TERMS.map(term => term.split(' '));

  for (const agencyIndex of agencyIndices) {
    const windowStart = Math.max(0, agencyIndex - WINDOW_SIZE);
    const windowEnd = Math.min(tokens.length, agencyIndex + WINDOW_SIZE + 1);
    const windowTokens = tokens.slice(windowStart, windowEnd);
    const windowText = windowTokens.join(' ');

    for (const termTokens of surveillanceTokens) {
      const phrase = termTokens.join(' ');
      if (windowText.includes(phrase)) {
        return true;
      }
    }
  }

  return false;
};

export const detectPsychosisIndicators = (message: string): PsychosisDetectionResult => {
  const matches: string[] = [];
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
    matches.push('agency+surveillance');
    score += 3;
  }

  const hasIndicators = score >= 3;
  let confidence: PsychosisConfidence = 'low';

  if (!hasIndicators) {
    return { hasIndicators: false, matches: [], confidence: 'low' };
  }

  if (score >= 7) {
    confidence = 'high';
  } else if (score >= 4) {
    confidence = 'medium';
  }

  return {
    hasIndicators,
    matches,
    confidence
  };
};
