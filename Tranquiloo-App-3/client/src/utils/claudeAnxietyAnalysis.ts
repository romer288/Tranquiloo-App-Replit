
// Claude anxiety analysis utility - migrated to use new API endpoints

export interface ClaudeAnxietyAnalysis {
  anxietyLevel: number;
  gad7Score: number;
  beckAnxietyCategories: string[];
  dsm5Indicators: string[];
  triggers: string[];
  cognitiveDistortions: string[];
  recommendedInterventions: string[];
  therapyApproach: 'CBT' | 'DBT' | 'Mindfulness' | 'Trauma-Informed' | 'Supportive';
  crisisRiskLevel: 'low' | 'moderate' | 'high' | 'critical';
  sentiment: 'positive' | 'neutral' | 'negative' | 'crisis';
  escalationDetected: boolean;
  personalizedResponse: string;
  detectedLanguage?: 'en' | 'es';
  createdAt?: string;
  created_at?: string;
}

interface ClaudeApiResponse {
  success: boolean;
  error?: string;
  analysis?: ClaudeAnxietyAnalysis;
}

export const analyzeAnxietyWithClaude = async (
  message: string,
  conversationHistory: string[] = [],
  userId?: string
): Promise<ClaudeAnxietyAnalysis> => {
  console.log('Starting analysis for message:', message);
  console.log('Conversation history:', conversationHistory);

  try {
    if (!userId) {
      throw new Error('User ID is required for anxiety analysis');
    }

    console.log('Calling anxiety analysis API endpoint');
    
    const response = await fetch('/api/analyze-anxiety-claude', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        conversationHistory,
        userId,
        includeLanguageDetection: true
      })
    });

    if (!response.ok) {
      throw new Error(`API call failed: ${response.status}`);
    }

    const data = await response.json();

    console.log('API response data:', data);
    console.log('Raw detectedLanguage from server:', data.detectedLanguage);

    if (!data) {
      console.log('No data received from API');
      throw new Error('No data received from API');
    }

    // Check if it's an error response
    if (data.error) {
      console.log('API returned error:', data.error);
      throw new Error(`API error: ${data.error}`);
    }

    // The server now returns the analysis directly, not wrapped in success/analysis
    // Convert server response to expected format
    const analysis: ClaudeAnxietyAnalysis = {
      anxietyLevel: data.anxietyLevel || 5,
      gad7Score: Math.max(0, Math.min(21, data.anxietyLevel * 2.1)), // Convert 1-10 to GAD-7 scale
      beckAnxietyCategories: data.triggers || [],
      dsm5Indicators: data.triggers || [],
      triggers: data.triggers || [],
      cognitiveDistortions: ['Catastrophizing', 'All-or-nothing thinking'],
      recommendedInterventions: data.copingStrategies || [],
      therapyApproach: data.anxietyLevel > 7 ? 'CBT' : 'Supportive',
      crisisRiskLevel: data.anxietyLevel > 8 ? 'high' : data.anxietyLevel > 6 ? 'moderate' : 'low',
      sentiment: data.anxietyLevel > 7 ? 'negative' : data.anxietyLevel > 4 ? 'neutral' : 'positive',
      escalationDetected: data.anxietyLevel > 8,
      personalizedResponse: data.personalizedResponse || 'I\'m here to support you through this.',
      detectedLanguage: data.detectedLanguage || undefined
    };
    
    // Validate that we got a proper response
    if (!analysis.personalizedResponse || analysis.personalizedResponse.length < 10) {
      console.log('Invalid or empty personalized response');
      throw new Error('Invalid response');
    }

    console.log('Analysis successful:', analysis);
    console.log('Personalized response:', analysis.personalizedResponse);
    console.log('Detected language:', analysis.detectedLanguage);
    
    return analysis;

  } catch (error) {
    console.log('API completely failed:', error);

    // Re-throw the error so the calling code knows to use fallback
    throw new Error('API unavailable');
  }
};

export const getGAD7Description = (score: number): string => {
  if (score >= 15) return 'Severe';
  if (score >= 10) return 'Moderate';
  if (score >= 5) return 'Mild';
  return 'Minimal';
};

export const getCrisisRiskColor = (level: string): string => {
  switch (level) {
    case 'critical': return 'text-red-800';
    case 'high': return 'text-red-600';
    case 'moderate': return 'text-orange-600';
    default: return 'text-green-600';
  }
};

export const getTherapyApproachDescription = (approach: string): string => {
  switch (approach) {
    case 'CBT': return 'Cognitive Behavioral Therapy focuses on identifying and changing negative thought patterns';
    case 'DBT': return 'Dialectical Behavior Therapy helps with emotional regulation and distress tolerance';
    case 'Mindfulness': return 'Mindfulness-based approaches focus on present-moment awareness';
    case 'Trauma-Informed': return 'Trauma-informed care addresses the impact of traumatic experiences';
    default: return 'Supportive therapy provides emotional support and validation';
  }
};
