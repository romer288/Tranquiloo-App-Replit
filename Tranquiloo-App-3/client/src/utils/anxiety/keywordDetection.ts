import {
  analyzeAnxietyContext,
  detectAnxietyTriggers,
  detectCognitivePatterns,
} from '@shared/mentalHealth/anxietyContexts';

import { AnalysisKeywords } from './types';

export { analyzeAnxietyContext };

export const KEYWORDS: AnalysisKeywords = {
  anxietyKeywords: ['anxious', 'worried', 'scared', 'panic', 'stress', 'nervous', 'fear'],
  depressionKeywords: ['sad', 'depressed', 'hopeless', 'tired', 'empty', 'worthless'],
  crisisKeywords: ['hurt myself', 'end it', 'suicide', 'kill myself', 'die', 'not worth living', 'want to commit suicide'],
  positiveKeywords: ['okay', 'good', 'better', 'fine', 'great', 'happy', 'calm', 'peaceful', 'not anxious', 'not worried'],
  negativeKeywords: ['not anxious', 'not worried', 'not scared', "i'm okay", "i am okay", 'feeling better', 'feeling good'],
};

// Enhanced trigger mapping for better categorization
const triggerMappings = {
  // Driving-related triggers
  driving_anxiety: ['driving', 'drive', 'car', 'vehicle', 'intersection', 'traffic', 'road', 'highway', 'freeway', 'lane', 'parking', 'crash', 'accident', 'collision'],
  work: ['work', 'job', 'office', 'boss', 'colleague', 'career', 'workplace', 'employment', 'meeting', 'deadline'],
  social: ['social', 'people', 'friends', 'party', 'gathering', 'conversation', 'public', 'crowd', 'speaking', 'presentation'],
  health: ['health', 'sick', 'pain', 'doctor', 'hospital', 'illness', 'disease', 'symptom', 'medical', 'therapy'],
  financial: ['money', 'financial', 'debt', 'bills', 'budget', 'income', 'expenses', 'payment', 'loan', 'mortgage'],
  relationships: ['relationship', 'partner', 'spouse', 'divorce', 'breakup', 'dating', 'marriage', 'family', 'conflict'],
  performance: ['test', 'exam', 'performance', 'evaluation', 'assessment', 'interview', 'competition', 'failure', 'success'],
  future_uncertainty: ['future', 'unknown', 'uncertain', 'change', 'decision', 'choice', 'plan', 'tomorrow', 'later'],
};

export const detectTriggers = (message: string): string[] => {
  const normalized = message.toLowerCase();
  const triggers = new Set<string>(detectAnxietyTriggers(message));

  Object.entries(triggerMappings).forEach(([triggerType, keywords]) => {
    if (keywords.some(keyword => normalized.includes(keyword))) {
      triggers.add(triggerType);
    }
  });

  return Array.from(triggers);
};

export const detectCognitiveDistortions = (message: string): string[] => {
  const normalized = message.toLowerCase();
  const distortions = new Set<string>(detectCognitivePatterns(message));

  if (normalized.includes('always') || normalized.includes('never') || normalized.includes('everything')) {
    distortions.add('All-or-nothing thinking');
  }
  if (normalized.includes('should') || normalized.includes('must') || normalized.includes('have to')) {
    distortions.add('Should statements');
  }
  if (normalized.includes('worst') || normalized.includes('terrible') || normalized.includes('awful')) {
    distortions.add('Catastrophizing');
  }

  return Array.from(distortions);
};
