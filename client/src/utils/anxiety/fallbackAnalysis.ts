
import { detectPsychosisIndicators } from '@shared/mentalHealth/psychosis';

import { analyzeAnxietyContext, detectTriggers, detectCognitiveDistortions, KEYWORDS } from './keywordDetection';

import { FallbackAnxietyAnalysis } from './types';
import { generatePersonalizedResponse } from './responseGenerator';
import { 
  generateRecommendedInterventions, 
  generateBeckAnxietyCategories, 
  generateDsm5Indicators, 
  determineTherapyApproach,
  determineCrisisRiskLevel 
} from './analysisUtils';

export const analyzeFallbackAnxiety = (
  message: string,
  conversationHistory: string[]
): FallbackAnxietyAnalysis => {
  const lowerMessage = message.toLowerCase().trim();
  const psychosisIndicators = detectPsychosisIndicators(message);

  const contextSummary = analyzeAnxietyContext(message);

  console.log('🧭 FALLBACK: Context summary', contextSummary);


  console.log('🔍 FALLBACK: Analyzing message:', message);
  console.log('📝 FALLBACK: Message lowercase:', lowerMessage);

  let anxietyLevel = Math.min(10, Math.max(1, Math.round(2 + contextSummary.generalAnxiety.score * 1.5)));
  let gad7Score = Math.min(21, contextSummary.generalAnxiety.score * 3);
  let emotions: string[] = [];
  let crisisRiskLevel: 'low' | 'moderate' | 'high' | 'critical' = 'low';
  let sentiment: 'positive' | 'neutral' | 'negative' | 'crisis' = 'neutral';

  // PRIORITY 1: Check for explicit "NOT anxious" or "I'm okay" statements
  const notAnxiousIndicators = [
    'not anxious', 'not worried', 'not scared', 'not nervous',
    'i am okay', "i'm okay", 'i am fine', "i'm fine",
    'feeling better', 'feeling good', 'feeling okay',
    'no anxiety', 'not feeling anxious'
  ];

  const isExplicitlyNotAnxious = notAnxiousIndicators.some(indicator =>
    lowerMessage.includes(indicator)
  );

  if (isExplicitlyNotAnxious) {
    console.log('✅ FALLBACK: Detected EXPLICIT "NOT anxious" or "okay" message');
    anxietyLevel = 1;
    gad7Score = 0;
    sentiment = 'positive';
    emotions.push('calm', 'okay');

  } else if (psychosisIndicators.hasIndicators) {
    console.log('🧠 FALLBACK: Detected HALLUCINATION/PSYCHOTIC context via pattern match:', psychosisIndicators.matches);
    crisisRiskLevel = 'high';
    anxietyLevel = 9;
    gad7Score = Math.max(gad7Score, 15);
    sentiment = 'crisis';
    emotions.push('confusion', 'distress', 'fear');


  } else if (contextSummary.crisis.thresholdMet) {
    console.log('🚨 FALLBACK: Detected CRISIS context via phrase patterns:', contextSummary.crisis.matches);

  } else if (KEYWORDS.crisisKeywords.some(keyword => lowerMessage.includes(keyword))) {
    // PRIORITY 3: Check for crisis indicators
    console.log('🚨 FALLBACK: Detected CRISIS message');

    crisisRiskLevel = 'critical';
    anxietyLevel = Math.max(anxietyLevel, 9);
    gad7Score = Math.max(gad7Score, 18);
    sentiment = 'crisis';
    emotions.push('despair', 'hopelessness');



  } else if (KEYWORDS.anxietyKeywords.some(keyword => lowerMessage.includes(keyword))) {
    // PRIORITY 3: Check for anxiety indicators
    console.log('😰 FALLBACK: Detected ANXIETY message');
    anxietyLevel = 6;
    gad7Score = 10;
    emotions.push('anxiety');
    sentiment = 'negative';

  } else if (KEYWORDS.depressionKeywords.some(keyword => lowerMessage.includes(keyword))) {
    // PRIORITY 4: Check for depression indicators
    console.log('😢 FALLBACK: Detected DEPRESSION message');
    anxietyLevel = 4;
    gad7Score = 6;
    emotions.push('sadness');
    sentiment = 'negative';

  } else if (KEYWORDS.positiveKeywords.some(keyword => lowerMessage.includes(keyword))) {
    // PRIORITY 5: Check for positive indicators
    console.log('😊 FALLBACK: Detected POSITIVE message');
    anxietyLevel = 1;
    gad7Score = 0;
    sentiment = 'positive';
    emotions.push('positive');

  } else {
    if (contextSummary.generalAnxiety.thresholdMet) {
      console.log('😰 FALLBACK: Detected GENERAL ANXIETY context');
      emotions.push('anxiety');
      sentiment = 'negative';
      anxietyLevel = Math.max(anxietyLevel, 6);
      gad7Score = Math.max(gad7Score, 10);
    }

    if (contextSummary.panic.thresholdMet) {
      console.log('💓 FALLBACK: Detected PANIC context');
      emotions.push('panic');
      anxietyLevel = Math.max(anxietyLevel, 8);
      gad7Score = Math.max(gad7Score, 14);
    }

    if (contextSummary.depression.thresholdMet) {
      console.log('😢 FALLBACK: Detected DEPRESSIVE context');
      emotions.push('sadness');
      sentiment = 'negative';
      anxietyLevel = Math.max(anxietyLevel, 5);
      gad7Score = Math.max(gad7Score, 8);
    }

    if (!contextSummary.generalAnxiety.thresholdMet && !contextSummary.depression.thresholdMet && !contextSummary.panic.thresholdMet) {
      if (contextSummary.positive.thresholdMet) {
        console.log('😊 FALLBACK: Detected POSITIVE context');
        anxietyLevel = Math.min(anxietyLevel, 2);
        gad7Score = Math.min(gad7Score, 2);
        sentiment = 'positive';
        emotions.push('positive');
      } else {
        console.log('😐 FALLBACK: No strong indicators detected - defaulting to neutral');
        sentiment = 'neutral';
        if (emotions.length === 0) {
          emotions.push('neutral');
        }
      }
    }
  }
  const triggers = detectTriggers(message);
  const cognitiveDistortions = detectCognitiveDistortions(message);
  const hasCrisisSignals = contextSummary.crisis.thresholdMet || psychosisIndicators.hasIndicators;
  const hasCrisisKeywords = KEYWORDS.crisisKeywords.some(keyword => lowerMessage.includes(keyword));
  crisisRiskLevel = determineCrisisRiskLevel(anxietyLevel, hasCrisisSignals || hasCrisisKeywords);

  const therapyApproach = determineTherapyApproach(cognitiveDistortions, crisisRiskLevel, emotions, triggers);

  const analysis = {
    anxietyLevel,
    gad7Score,
    triggers,
    emotions,
    cognitiveDistortions,
    crisisRiskLevel,
    sentiment,
    therapyApproach,
    contextSummary
  };

  console.log('📊 FALLBACK: Final analysis:', analysis);
  
  const recommendedInterventions = generateRecommendedInterventions(crisisRiskLevel);
  const beckAnxietyCategories = generateBeckAnxietyCategories(emotions, lowerMessage);
  const dsm5Indicators = generateDsm5Indicators(anxietyLevel, triggers);
  const personalizedResponse = generatePersonalizedResponse(message, analysis);
  
  console.log('📝 FALLBACK: Generated response:', personalizedResponse);
  
  return {
    anxietyLevel,
    gad7Score,
    beckAnxietyCategories,
    dsm5Indicators,
    triggers,
    emotions,
    cognitiveDistortions,
    recommendedInterventions,
    therapyApproach,
    crisisRiskLevel,
    sentiment,
    escalationDetected: anxietyLevel > 7,
    contextSummary,
    personalizedResponse
  };
};
