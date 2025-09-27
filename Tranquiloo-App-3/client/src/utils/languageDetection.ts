const accentPattern = /[ñáéíóúü¿¡]/i;

const removeDiacritics = (word: string): string =>
  word
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z]/gi, '')
    .toLowerCase();

const getNormalizedWords = (text: string): string[] => {
  const lowerText = text.toLowerCase();
  const rawMatches = lowerText.match(/[a-záéíóúüñ]+/g);

  if (!rawMatches || rawMatches.length === 0) {
    return [];
  }

  const normalized = rawMatches.map(removeDiacritics).filter(Boolean);
  const multiCharacterWords = normalized.filter((_, index) => rawMatches[index].length > 1);

  return multiCharacterWords.length > 0 ? multiCharacterWords : normalized;
};

const englishLoanwordsWithAccents = new Set([
  'cafe',
  'cafes',
  'fiance',
  'fiances',
  'fiancee',
  'fiancees',
  'resume',
  'resumes',
  'naive',
  'naives',
  'facade',
  'facades',
  'cliche',
  'cliches',
  'touche',
  'touches',
  'protege',
  'proteges',
  'saute',
  'sautes',
  'entree',
  'entrees',
  'matinee',
  'matinees',
  'souffle',
  'souffles',
  'soiree',
  'soirees',
  'deja',
  'decor',
  'decors',
  'eclair',
  'eclairs',
  'role',
  'roles',
  'blase',
  'blases',
  'expose',
  'exposes',
  'creme',
  'cremes',
  'brulee',
  'brulees',
  'fete',
  'fetes',
  'melee',
  'melees',
  'coupe',
  'coupes',
]);

const DEFAULT_MIN_WORD_COUNT = 4;
const DEFAULT_CONFIDENCE_THRESHOLD = 0.62;
const MIN_CONFIDENCE_GAP = 0.12;

const EXACT_SPANISH_TOKENS = new Set(['spanish', 'espanol', 'español']);
const EXACT_ENGLISH_TOKENS = new Set(['english', 'ingles', 'inglés']);

const SPANISH_INTENT_PATTERNS = [
  /\b(?:quiero|deseo|prefiero|necesito)\s+(?:hablar|que\s+hablemos|comunicarnos)\s+en\s+espa(?:ñ|n)ol\b/i,
  /\b(?:hablar|hablemos|sigamos)\s+en\s+espa(?:ñ|n)ol\b/i,
  /\b(?:i\s*(?:want|would\s+like|prefer|need)\s*(?:to)?\s*(?:speak|talk)\s*(?:in)?\s*spanish)\b/i,
  /\b(?:can|could|let'?s)\s*(?:we)?\s*(?:speak|talk)\s*(?:in)?\s*spanish\b/i,
  /\bspanish\s+please\b/i,
  /\bespa(?:ñ|n)ol\s+por\s+favor\b/i,
  /\b(?:cambiar|cambia|switch)\s+(?:a|al|to)\s+espa(?:ñ|n)ol\b/i,
];

const ENGLISH_INTENT_PATTERNS = [
  /\b(?:quiero|deseo|prefiero|necesito)\s+(?:hablar|que\s+hablemos|comunicarnos)\s+en\s+ingl[eé]s\b/i,
  /\b(?:hablar|hablemos|sigamos)\s+en\s+ingl[eé]s\b/i,
  /\b(?:i\s*(?:want|would\s+like|prefer|need)\s*(?:to)?\s*(?:speak|talk)\s*(?:in)?\s*english)\b/i,
  /\b(?:can|could|let'?s)\s*(?:we)?\s*(?:speak|talk)\s*(?:in)?\s*english\b/i,
  /\benglish\s+please\b/i,
  /\bingl[eé]s\s+por\s+favor\b/i,
  /\b(?:cambiar|cambia|switch)\s+(?:a|al|to)\s+ingl[eé]s\b/i,
];

type SupportedLanguage = 'en' | 'es';

type DetectionReason = 'explicit-intent' | 'accent' | 'library' | 'fallback';

interface DetectLanguageOptions {
  fallbackLanguage?: SupportedLanguage;
  confidenceThreshold?: number;
  minWordCountForDetection?: number;
}

interface LanguageDetectionDetails {
  language: SupportedLanguage;
  confidence: number;
  reason: DetectionReason;
  wordCount: number;
  rawScores: Record<SupportedLanguage, number>;
}


type LanguageModel = {
  counts: Map<string, number>;
  totalCount: number;
};

type LanguageProfile = Map<string, number>;


const sanitizeForProfile = (text: string): string =>
  text
    .toLowerCase()
    .replace(/[^a-záéíóúüñ]+/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();


const buildModel = (sample: string): LanguageModel => {
  const sanitized = sanitizeForProfile(sample).replace(/\s+/g, '');
  const counts: Map<string, number> = new Map();

  if (sanitized.length < 3) {
    return { counts, totalCount: 0 };
  }

  for (let index = 0; index < sanitized.length - 2; index += 1) {
    const trigram = sanitized.slice(index, index + 3);
    if (trigram.includes(' ')) {
      continue;
    }
    counts.set(trigram, (counts.get(trigram) ?? 0) + 1);
  }

  const totalCount = Array.from(counts.values()).reduce((sum, value) => sum + value, 0);
  return { counts, totalCount };
};

const englishCorpus = `
People often describe their thoughts, plans, and emotions in detailed English paragraphs.
In everyday conversations we talk about family, relationships, therapy sessions, achievements, fears, and the desire to feel calmer.
Supportive statements such as "you are doing your best" or "we can work through this together" appear frequently in the chats we analyze.
When people ask for help they may explain what happened in the past, what is happening now, and what they hope will improve in the future.
This corpus intentionally covers greetings, worries about anxiety, and practical next steps expressed in English.
`;

const spanishCorpus = `
Muchas personas describen sus emociones, planes y dificultades usando párrafos completos en español.
En conversaciones cotidianas hablamos de la familia, las relaciones, las sesiones de terapia, los logros, los miedos y el deseo de sentirnos más tranquilos.
Las frases de apoyo como "estás haciendo lo mejor posible" o "podemos trabajar en esto juntos" aparecen con frecuencia en los chats que analizamos.
Cuando alguien pide ayuda puede explicar lo que ocurrió en el pasado, lo que sucede ahora y lo que espera mejorar en el futuro.
Este corpus cubre saludos, preocupaciones sobre la ansiedad y próximos pasos prácticos expresados en español.
`;

const languageModels: Record<SupportedLanguage, LanguageModel> = {
  en: buildModel(englishCorpus),
  es: buildModel(spanishCorpus),
};

const languages: SupportedLanguage[] = ['en', 'es'];

const languageVocabulary = new Set<string>([
  ...languageModels.en.counts.keys(),
  ...languageModels.es.counts.keys(),
]);

const VOCABULARY_SIZE = languageVocabulary.size || 1;
const SMOOTHING_ALPHA = 0.001;

const computeTrigramFrequencies = (text: string): Map<string, number> | null => {
  const sanitized = sanitizeForProfile(text).replace(/\s+/g, '');
  if (sanitized.length < 12) {
    return null;
  }

  const frequencies: Map<string, number> = new Map();

  for (let index = 0; index < sanitized.length - 2; index += 1) {
    const trigram = sanitized.slice(index, index + 3);
    if (trigram.includes(' ')) {
      continue;
    }
    frequencies.set(trigram, (frequencies.get(trigram) ?? 0) + 1);
  }

  if (frequencies.size === 0) {
    return null;
  }

  return frequencies;
};

const buildProfile = (sample: string): LanguageProfile => {
  const sanitized = sanitizeForProfile(sample).replace(/\s+/g, '');
  const profile: LanguageProfile = new Map();

  if (sanitized.length < 3) {
    return profile;
  }

  for (let i = 0; i < sanitized.length - 2; i += 1) {
    const trigram = sanitized.slice(i, i + 3);
    if (trigram.includes(' ')) {
      continue;
    }
    profile.set(trigram, (profile.get(trigram) ?? 0) + 1);
  }

  const total = Array.from(profile.values()).reduce((sum, count) => sum + count, 0);
  if (total === 0) {
    return profile;
  }

  profile.forEach((value, key) => {
    profile.set(key, value / total);
  });

  return profile;
};

const languageProfiles: Record<SupportedLanguage, LanguageProfile> = {
  en: buildProfile(englishCorpus),
  es: buildProfile(spanishCorpus),
};

const computeProfileForText = (text: string): LanguageProfile | null => {
  const sanitized = sanitizeForProfile(text).replace(/\s+/g, '');
  if (sanitized.length < 12) {
    return null;
  }

  const profile: LanguageProfile = new Map();
  for (let i = 0; i < sanitized.length - 2; i += 1) {
    const trigram = sanitized.slice(i, i + 3);
    if (trigram.includes(' ')) {
      continue;
    }
    profile.set(trigram, (profile.get(trigram) ?? 0) + 1);
  }

  const total = Array.from(profile.values()).reduce((sum, count) => sum + count, 0);
  if (total === 0) {
    return null;
  }

  profile.forEach((value, key) => {
    profile.set(key, value / total);
  });

  return profile;
};

const computeDistance = (a: LanguageProfile, b: LanguageProfile): number => {
  const keys = new Set([...a.keys(), ...b.keys()]);
  let distance = 0;

  keys.forEach(key => {
    const diff = (a.get(key) ?? 0) - (b.get(key) ?? 0);
    distance += diff * diff;
  });

  return Math.sqrt(distance);

};

const scoreLanguageLikelihoods = (
  text: string,
): Record<SupportedLanguage, number> | null => {

  const trigramFrequencies = computeTrigramFrequencies(text);
  if (!trigramFrequencies) {
    return null;
  }

  const logScores: Record<SupportedLanguage, number> = { en: 0, es: 0 };

  languages.forEach(language => {
    const model = languageModels[language];

    let logProbability = 0;
    trigramFrequencies.forEach((frequency, trigram) => {
      const trigramCount = model.counts.get(trigram) ?? 0;
      const probability =
        (trigramCount + SMOOTHING_ALPHA) /
        (model.totalCount + SMOOTHING_ALPHA * VOCABULARY_SIZE);

      logProbability += frequency * Math.log(probability);
    });

    logScores[language] = logProbability;
  });

  const maxScore = Math.max(logScores.en, logScores.es);
  const expScores: Record<SupportedLanguage, number> = {
    en: Math.exp(logScores.en - maxScore),
    es: Math.exp(logScores.es - maxScore),
  };

  const denominator = expScores.en + expScores.es;
  if (!Number.isFinite(denominator) || denominator === 0) {
    return null;
  }

  return {
    en: expScores.en / denominator,
    es: expScores.es / denominator,
  };
};

const hasNonLoanwordAccents = (text: string): boolean => {
  if (!accentPattern.test(text)) {
    return false;
  }


  const wordsWithAccents = text
    .split(/[^a-záéíóúüñ¿¡]+/i)
    .filter(Boolean)
    .filter(word => accentPattern.test(word));

  return wordsWithAccents.some(word => {
    const normalizedWord = removeDiacritics(word);
    if (!normalizedWord) {
      return false;
    }

    if (englishLoanwordsWithAccents.has(normalizedWord)) {
      return false;
    }

    if (
      normalizedWord.endsWith('s') &&
      englishLoanwordsWithAccents.has(normalizedWord.slice(0, -1))
    ) {
      return false;
    }

    return true;
  });
};

const detectExplicitIntent = (text: string): SupportedLanguage | null => {
  const simplified = text.toLowerCase().replace(/\s+/g, ' ').trim();
  const normalized = removeDiacritics(simplified.replace(/[^a-záéíóúüñ ]/gi, ' ')).replace(/\s+/g, ' ').trim();

  if (normalized && !normalized.includes(' ') && EXACT_SPANISH_TOKENS.has(normalized)) {
    return 'es';
  }

  if (normalized && !normalized.includes(' ') && EXACT_ENGLISH_TOKENS.has(normalized)) {
    return 'en';
  }

  if (SPANISH_INTENT_PATTERNS.some(pattern => pattern.test(simplified))) {
    return 'es';
  }

  if (SPANISH_INTENT_PATTERNS.some(pattern => pattern.test(normalized))) {
    return 'es';
  }

  if (ENGLISH_INTENT_PATTERNS.some(pattern => pattern.test(simplified))) {
    return 'en';
  }

  if (ENGLISH_INTENT_PATTERNS.some(pattern => pattern.test(normalized))) {
    return 'en';
  }

  return null;
};

const analyzeLanguage = (
  text: string,
  options: DetectLanguageOptions = {},
): LanguageDetectionDetails => {
  const fallbackLanguage: SupportedLanguage = options.fallbackLanguage ?? 'en';
  const confidenceThreshold = options.confidenceThreshold ?? DEFAULT_CONFIDENCE_THRESHOLD;
  const minWordCount = options.minWordCountForDetection ?? DEFAULT_MIN_WORD_COUNT;

  const trimmed = text.trim();
  const normalizedWords = getNormalizedWords(trimmed);
  const wordCount = normalizedWords.length;

  if (!trimmed) {
    return {
      language: fallbackLanguage,
      confidence: 0,
      reason: 'fallback',
      wordCount,
      rawScores: { en: 0, es: 0 },
    };
  }

  const explicitIntent = detectExplicitIntent(trimmed);
  if (explicitIntent) {
    return {
      language: explicitIntent,
      confidence: 1,
      reason: 'explicit-intent',
      wordCount,
      rawScores: { en: explicitIntent === 'en' ? 1 : 0, es: explicitIntent === 'es' ? 1 : 0 },
    };
  }

  if (hasNonLoanwordAccents(trimmed)) {
    return {
      language: 'es',
      confidence: 1,
      reason: 'accent',
      wordCount,
      rawScores: { en: 0, es: 1 },
    };
  }

  if (wordCount === 0) {
    return {
      language: fallbackLanguage,
      confidence: 0,
      reason: 'fallback',
      wordCount,
      rawScores: { en: 0, es: 0 },
    };
  }

  if (wordCount <= minWordCount) {
    return {
      language: fallbackLanguage,
      confidence: 0,
      reason: 'fallback',
      wordCount,
      rawScores: { en: 0, es: 0 },
    };
  }

  const scores = scoreLanguageLikelihoods(trimmed);
  if (!scores) {
    return {
      language: fallbackLanguage,
      confidence: 0,
      reason: 'fallback',
      wordCount,
      rawScores: { en: 0, es: 0 },
    };
  }

  const topLanguage: SupportedLanguage = scores.en >= scores.es ? 'en' : 'es';
  const otherLanguage: SupportedLanguage = topLanguage === 'en' ? 'es' : 'en';
  const topConfidence = scores[topLanguage];
  const confidenceGap = topConfidence - scores[otherLanguage];

  if (topConfidence < confidenceThreshold || confidenceGap < MIN_CONFIDENCE_GAP) {
    return {
      language: fallbackLanguage,
      confidence: topConfidence,
      reason: 'fallback',
      wordCount,
      rawScores: scores,
    };

  }

  return {
    language: topLanguage,
    confidence: topConfidence,
    reason: 'library',
    wordCount,
    rawScores: scores,
  };
};

export const detectLanguage = (
  text: string,
  options: DetectLanguageOptions = {},
): SupportedLanguage => analyzeLanguage(text, options).language;

export const validateLanguageConsistency = (
  previousLanguage: SupportedLanguage,
  currentText: string,
): SupportedLanguage => {
  const analysis = analyzeLanguage(currentText, {
    fallbackLanguage: previousLanguage,
  });

  if (analysis.language === previousLanguage) {
    return previousLanguage;
  }

  if (analysis.reason === 'explicit-intent' || analysis.reason === 'accent') {
    return analysis.language;
  }

  if (analysis.reason === 'library') {
    return analysis.language;
  }

  return previousLanguage;
};
