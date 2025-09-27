import { strict as assert } from 'assert';
import {
  analyzeAnxietyContext,
  detectAnxietyTriggers,
  detectCognitivePatterns
} from './anxietyContexts';

const assertCondition = (
  condition: boolean,
  message: string
) => {
  if (!condition) {
    throw new Error(message);
  }
};

// Ritual mention without compulsive context should not trigger OCD
{
  const context = analyzeAnxietyContext(
    'I light a candle as a relaxing ritual before bed and it helps me unwind.'
  );
  assertCondition(!context.ocd.thresholdMet, 'Ritual without compulsion should not flag OCD');
}

// OCD context should require compulsive phrasing
{
  const context = analyzeAnxietyContext(
    "My OCD is awful tonight. I can't stop checking the locks and repeating the ritual until it feels right."
  );
  assertCondition(context.ocd.thresholdMet, 'Compulsive ritual should trigger OCD context');
}

// Panic context recognition
{
  const context = analyzeAnxietyContext(
    "I think I'm having a panic attack—my heart is racing and I can't breathe."
  );
  assertCondition(context.panic.thresholdMet, 'Panic attack cues should trigger panic context');
}

// Positive sentiment
{
  const context = analyzeAnxietyContext(
    'I am feeling calm and not anxious anymore after my therapy session.'
  );
  assertCondition(context.positive.thresholdMet, 'Calm statement should register as positive');
}

// Trigger detection with work context
{
  const triggers = detectAnxietyTriggers('My boss keeps piling on deadlines at work and I am overwhelmed.');
  assertCondition(triggers.includes('work'), 'Work trigger should be detected');
}

// Cognitive distortion detection
{
  const distortions = detectCognitivePatterns('Everything is ruined and it will always be this way.');
  assertCondition(distortions.includes('All-or-nothing thinking'), 'All-or-nothing thinking should be detected');
}

console.log('All anxiety context tests passed.');
