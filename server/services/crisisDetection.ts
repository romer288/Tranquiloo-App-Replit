import { ChatOpenAI } from '@langchain/openai';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';

const chatModel = new ChatOpenAI({
  modelName: 'gpt-4o-mini',
  temperature: 0.3, // Lower temperature for more consistent crisis assessment
  openAIApiKey: process.env.OPENAI_API_KEY || '',
});

export interface CrisisAssessment {
  riskLevel: 'none' | 'low' | 'moderate' | 'high' | 'imminent';
  requiresScreening: boolean;
  reasoning: string;
  detectedIndicators: string[];
}

export interface CSSRSResponse {
  question: string;
  answer?: 'yes' | 'no';
  questionNumber: number;
}

/**
 * Columbia Suicide Severity Rating Scale (C-SSRS) - Screening Questions
 * Clinical standard for suicide risk assessment
 */
export const CSSRS_QUESTIONS = [
  {
    id: 1,
    question: "Have you had thoughts of killing yourself?",
    category: "ideation",
    weight: "moderate"
  },
  {
    id: 2,
    question: "Do you feel the world would be better without you?",
    category: "ideation",
    weight: "moderate"
  },
  {
    id: 3,
    question: "Have you thought about how you might end your life?",
    category: "method",
    weight: "high"
  },
  {
    id: 4,
    question: "Do you have a specific plan to end your life?",
    category: "plan",
    weight: "high"
  },
  {
    id: 5,
    question: "Do you have access to means to harm yourself (e.g., pills, weapons)?",
    category: "means",
    weight: "imminent"
  },
  {
    id: 6,
    question: "Do you intend to act on these thoughts?",
    category: "intent",
    weight: "imminent"
  }
] as const;

/**
 * AI-powered context detection for potential crisis indicators
 * Uses GPT-4o Mini to understand nuance, context, and indirect language
 */
export async function detectCrisisContext(message: string): Promise<CrisisAssessment> {
  const systemPrompt = `You are a crisis detection system for a mental health wellness app.

Your job is to analyze user messages for suicide risk indicators using clinical expertise.

IMPORTANT CONTEXT CONSIDERATIONS:
- Distinguish between casual expressions ("kill this headache") and genuine distress
- Detect passive ideation ("I wish I wasn't here") vs active ideation ("I want to die")
- Recognize euphemisms: "ending it", "not being here anymore", "going to sleep forever"
- Catch indirect language: "everyone would be better off", "no reason to live"
- Consider misspellings, coded language, and cultural differences

RISK LEVELS:
- none: No indicators detected
- low: Vague distress, no specific ideation ("I can't take this anymore")
- moderate: Passive ideation, no plan/intent ("I wish I was dead")
- high: Active ideation with method/plan ("I've thought about pills")
- imminent: Intent + means + plan ("I have pills and I'm going to take them tonight")

Respond ONLY with valid JSON:
{
  "riskLevel": "none" | "low" | "moderate" | "high" | "imminent",
  "requiresScreening": boolean,
  "reasoning": "brief clinical reasoning",
  "detectedIndicators": ["specific phrases that raised concern"]
}

If riskLevel is "moderate" or higher, set requiresScreening to true.
`;

  try {
    const response = await chatModel.invoke([
      new SystemMessage(systemPrompt),
      new HumanMessage(`Analyze this message for crisis indicators:\n\n"${message}"`)
    ], {
      response_format: { type: 'json_object' }
    });

    const assessment = JSON.parse(response.content.toString()) as CrisisAssessment;

    console.log(`[CRISIS] Risk assessment: ${assessment.riskLevel} - ${assessment.reasoning}`);

    return assessment;

  } catch (error: any) {
    console.error('[CRISIS] Error in AI assessment:', error.message);

    // Fallback to keyword detection if AI fails
    return fallbackKeywordDetection(message);
  }
}

/**
 * Fallback keyword-based detection (used if AI fails)
 */
function fallbackKeywordDetection(message: string): CrisisAssessment {
  const lowerMessage = message.toLowerCase();

  // Imminent risk keywords
  const imminentKeywords = [
    'going to kill myself',
    'going to end my life',
    'tonight',
    'goodbye forever',
    'final message'
  ];

  // High risk keywords
  const highRiskKeywords = [
    'suicide',
    'kill myself',
    'end my life',
    'want to die',
    'take my life',
    'have a plan'
  ];

  // Moderate risk keywords
  const moderateKeywords = [
    'wish i was dead',
    'better off dead',
    'no reason to live',
    'can\'t go on',
    'ending it',
    'not worth living'
  ];

  const detectedIndicators: string[] = [];

  if (imminentKeywords.some(kw => lowerMessage.includes(kw))) {
    imminentKeywords.forEach(kw => {
      if (lowerMessage.includes(kw)) detectedIndicators.push(kw);
    });
    return {
      riskLevel: 'imminent',
      requiresScreening: true,
      reasoning: 'Imminent risk keywords detected - immediate intervention needed',
      detectedIndicators
    };
  }

  if (highRiskKeywords.some(kw => lowerMessage.includes(kw))) {
    highRiskKeywords.forEach(kw => {
      if (lowerMessage.includes(kw)) detectedIndicators.push(kw);
    });
    return {
      riskLevel: 'high',
      requiresScreening: true,
      reasoning: 'Active suicidal ideation keywords detected',
      detectedIndicators
    };
  }

  if (moderateKeywords.some(kw => lowerMessage.includes(kw))) {
    moderateKeywords.forEach(kw => {
      if (lowerMessage.includes(kw)) detectedIndicators.push(kw);
    });
    return {
      riskLevel: 'moderate',
      requiresScreening: true,
      reasoning: 'Passive ideation or hopelessness detected',
      detectedIndicators
    };
  }

  return {
    riskLevel: 'none',
    requiresScreening: false,
    reasoning: 'No crisis indicators detected',
    detectedIndicators: []
  };
}

/**
 * Assess C-SSRS screening responses to determine final risk level
 */
export function assessCSSRSResponses(responses: CSSRSResponse[]): {
  finalRiskLevel: 'low' | 'moderate' | 'high' | 'imminent';
  recommendation: string;
  shouldAlert: boolean;
} {
  // Count yes answers by category
  const yesAnswers = responses.filter(r => r.answer === 'yes');
  const questionNumbers = yesAnswers.map(r => r.questionNumber);

  // Check for imminent risk (questions 5 or 6)
  if (questionNumbers.includes(5) || questionNumbers.includes(6)) {
    return {
      finalRiskLevel: 'imminent',
      recommendation: 'IMMEDIATE CRISIS INTERVENTION REQUIRED. Call 911 or go to nearest emergency room.',
      shouldAlert: true
    };
  }

  // Check for high risk (questions 3 or 4)
  if (questionNumbers.includes(3) || questionNumbers.includes(4)) {
    return {
      finalRiskLevel: 'high',
      recommendation: 'HIGH RISK. Call 988 Suicide & Crisis Lifeline immediately. Do not wait.',
      shouldAlert: true
    };
  }

  // Check for moderate risk (questions 1 or 2)
  if (questionNumbers.includes(1) || questionNumbers.includes(2)) {
    return {
      finalRiskLevel: 'moderate',
      recommendation: 'MODERATE RISK. Please call 988 or text HOME to 741741 to speak with a trained counselor.',
      shouldAlert: true
    };
  }

  // All no answers
  return {
    finalRiskLevel: 'low',
    recommendation: 'Continue monitoring. Reach out to a mental health professional if feelings worsen.',
    shouldAlert: false
  };
}

/**
 * Generate crisis response based on risk level
 */
export function generateCrisisResponse(
  assessment: CrisisAssessment,
  cssrsResults?: ReturnType<typeof assessCSSRSResponses>
): string {
  // If C-SSRS completed, use those results
  if (cssrsResults) {
    return `
I'm very concerned about your safety based on your responses.

${cssrsResults.recommendation}

**IMMEDIATE RESOURCES:**
🆘 **Call 988** - Suicide & Crisis Lifeline (24/7, free, confidential)
📱 **Text HOME to 741741** - Crisis Text Line
🚨 **Call 911** - For immediate emergency

You don't have to face this alone. Professional help is available right now.

**Note:** I'm an AI wellness companion, not equipped for crisis situations. Please reach out to one of these services immediately.
    `.trim();
  }

  // Generate response based on initial assessment
  switch (assessment.riskLevel) {
    case 'imminent':
      return `
I'm extremely concerned about what you're sharing. This is a crisis situation.

**CALL 911 NOW** or go to your nearest emergency room.

🆘 **Call 988** - Suicide & Crisis Lifeline
📱 **Text HOME to 741741** - Crisis Text Line

If you're not safe right now, please call one of these numbers immediately. They have trained counselors available 24/7.

You don't have to face this alone. Help is available right now.
      `.trim();

    case 'high':
    case 'moderate':
      return `I'm concerned about your safety. Before we continue, I need to ask you a few quick questions to make sure you're okay. Please answer honestly - this helps me understand how best to support you.`;

    case 'low':
      return `I hear that you're going through a difficult time. While I'm here to support you, if you're having thoughts of harming yourself, please reach out to:

🆘 **988 - Suicide & Crisis Lifeline**
📱 **Text HOME to 741741 - Crisis Text Line**

Would you like to talk about what's troubling you?`;

    default:
      return '';
  }
}

/**
 * Get next C-SSRS question to ask
 */
export function getNextCSSRSQuestion(previousResponses: CSSRSResponse[]): string | null {
  const nextQuestionNumber = previousResponses.length + 1;

  if (nextQuestionNumber > CSSRS_QUESTIONS.length) {
    return null; // All questions answered
  }

  const question = CSSRS_QUESTIONS[nextQuestionNumber - 1];
  return `${question.question} (Please answer yes or no)`;
}
