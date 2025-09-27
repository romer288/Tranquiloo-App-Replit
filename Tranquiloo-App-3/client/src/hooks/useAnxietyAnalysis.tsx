
import { useState, useEffect } from 'react';
import { analyzeAnxietyWithClaude, ClaudeAnxietyAnalysis } from '@/utils/claudeAnxietyAnalysis';
import { analyzeFallbackAnxiety } from '@/utils/anxiety/fallbackAnalysis';
import { FallbackAnxietyAnalysis } from '@/utils/anxiety/types';

export const useAnxietyAnalysis = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [anxietyAnalyses, setAnxietyAnalyses] = useState<(ClaudeAnxietyAnalysis | FallbackAnxietyAnalysis)[]>([]);
  const [currentAnxietyAnalysis, setCurrentAnxietyAnalysis] = useState<ClaudeAnxietyAnalysis | FallbackAnxietyAnalysis | null>(null);

  // Load any persisted analyses for analytics graphs
  useEffect(() => {
    try {
      const stored = localStorage.getItem('anxietyAnalyses');
      if (stored) {
        setAnxietyAnalyses(JSON.parse(stored));
      }
    } catch {}
  }, []);

  const analyzeMessage = async (
    message: string,
    conversationHistory: string[]
  ): Promise<ClaudeAnxietyAnalysis | FallbackAnxietyAnalysis> => {
    setIsAnalyzing(true);

    try {
      let anxietyAnalysis: ClaudeAnxietyAnalysis | FallbackAnxietyAnalysis;
      let usingClaude = false;

      try {
        console.log('Attempting Claude analysis for message:', message);
        console.log('Conversation history:', conversationHistory);
        
        anxietyAnalysis = await analyzeAnxietyWithClaude(
          message,
          conversationHistory,
          'user-123'
        );
        
        // If we got here, Claude API call was successful
        usingClaude = true;
        console.log('Analysis successful:', anxietyAnalysis);
        console.log('Personalized response:', anxietyAnalysis.personalizedResponse);
        
      } catch (error) {
        console.log('API failed, using LOCAL fallback analysis:', error);
        anxietyAnalysis = analyzeFallbackAnxiety(message, conversationHistory);
        console.log('LOCAL Fallback analysis completed:', anxietyAnalysis);
        console.log('FALLBACK personalized response:', anxietyAnalysis.personalizedResponse);
      }

      // Add a flag to indicate the source
      (anxietyAnalysis as any).source = usingClaude ? 'claude' : 'fallback';

      setCurrentAnxietyAnalysis(anxietyAnalysis);
      setAnxietyAnalyses(prev => {
        const updated = [...prev, anxietyAnalysis];
        try { localStorage.setItem('anxietyAnalyses', JSON.stringify(updated)); } catch {}
        return updated;
      });

      return anxietyAnalysis;
    } finally {
      setIsAnalyzing(false);
    }
  };

  return {
    isAnalyzing,
    anxietyAnalyses,
    currentAnxietyAnalysis,
    analyzeMessage
  };
};
