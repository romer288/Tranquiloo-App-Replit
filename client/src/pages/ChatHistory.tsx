
import { parseDateSafe, formatDate, formatDateTime } from "../utils/date";
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Calendar, MessageSquare, Clock, Brain, History } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/context/LanguageContext';
interface ChatSession {
  id: string;
  userId: string;
  aiCompanion: 'vanessa' | 'monica';
  title?: string;
  sessionSummary?: string;
  anxietyLevel?: number;
  createdAt?: string | number;
  updatedAt?: string | number;
}

interface ChatMessage {
  id: string;
  sessionId: string;
  content: string;
  sender: 'user' | 'assistant';
  createdAt?: string | number;
}

interface AnxietyAnalysis {
  id: string;
  anxietyLevel: number;
  anxietyTriggers: string[];
  copingStrategies: string[];
  personalizedResponse: string;
  analysisSource: string;
  createdAt?: string | number;
}

const ChatHistory = () => {
  const { user } = useAuth();
  const { t } = useLanguage();

  // Translation mapping for coping strategies from API
  const translateCopingStrategy = (strategy: string) => {
    const strategyMappings: Record<string, string> = {
      "Box breathing": "anxietyAnalysis.interventions.boxBreathing",
      "scripted openers": "anxietyAnalysis.interventions.scriptedOpeners",
      "2-minute ground + reframe": "anxietyAnalysis.interventions.twoMinuteGroundReframe",
      "5-4-3-2-1 sensory": "anxietyAnalysis.interventions.sensory54321",
      "outcome laddering": "anxietyAnalysis.interventions.outcomeLaddering",
      "imperfect reps": "anxietyAnalysis.interventions.imperfectReps",
      "Worry time blocks": "anxietyAnalysis.interventions.worryTimeBlocks",
      "sleep wind-down": "anxietyAnalysis.interventions.sleepWindDown",
      "body scan": "anxietyAnalysis.interventions.bodyScan",
      "Scheduled worry time": "anxietyAnalysis.interventions.scheduledWorryTime",
      "thought defusion": "anxietyAnalysis.interventions.thoughtDefusion",
      "stimulus control": "anxietyAnalysis.interventions.stimulusControl",
    };

    const translationKey = strategyMappings[strategy];
    return translationKey ? t(translationKey) : strategy;
  };

  // Translation mapping for anxiety triggers from API
  const translateAnxietyTrigger = (trigger: string) => {
    // For now, return the trigger as-is since we don't have specific trigger translations
    // This can be expanded if trigger translations are added to LanguageContext
    return trigger;
  };

  // Translation mapping for personalized responses from API
  const translatePersonalizedResponse = (response: string) => {
    // For personalized responses, we handle common patterns that appear in AI-generated content
    let translatedResponse = response;

    // Replace common patterns that appear in responses
    const patternMappings: Record<string, string> = {
      "Social + performance anxiety": "Ansiedad social y de rendimiento",
      "Prioritize short nervous-system resets": "Priorizar restablecimientos cortos del sistema nervioso",
      "exposure with safety behaviors reduced by 20%": "exposición con comportamientos de seguridad reducidos en un 20%",
      "presentations, group settings": "presentaciones, entornos grupales",
      "then exposure with safety behaviors reduced by 20%": "luego exposición con comportamientos de seguridad reducidos en un 20%",
    };

    Object.entries(patternMappings).forEach(([english, translated]) => {
      translatedResponse = translatedResponse.replace(new RegExp(english, 'g'), translated);
    });

    return translatedResponse;
  };

  const { data: sessionsData = [], isLoading: sessionsLoading, error: sessionsError } = useQuery({
    queryKey: [`/api/users/${user?.id}/chat-sessions`],
    queryFn: async () => {
      const response = await fetch(`/api/users/${user?.id}/chat-sessions`);
      if (!response.ok) {
        throw new Error('Failed to fetch chat sessions');
      }
      return response.json();
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  const { data: analysesData = [], error: analysesError } = useQuery({
    queryKey: [`/api/users/${user?.id}/anxiety-analyses`],
    queryFn: async () => {
      const response = await fetch(`/api/users/${user?.id}/anxiety-analyses`);
      if (!response.ok) {
        throw new Error('Failed to fetch anxiety analyses');
      }
      return response.json();
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  // Sessions and analyses are already filtered by user ID from the API
  const sessions = Array.isArray(sessionsData)
    ? sessionsData.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    : [];
  const recentAnalyses = Array.isArray(analysesData)
    ? analysesData.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    : [];

  const getAnxietyLevelColor = (level: number) => {
    if (level <= 3) return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
    if (level <= 6) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
    return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
  };

  const getAnxietyLevelText = (level: number) => {
    if (level <= 3) return t('chatHistory.low');
    if (level <= 6) return t('chatHistory.moderate');
    return t('chatHistory.high');
  };

  if (sessionsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 px-4 space-y-6" data-testid="chat-history-container">
      <div className="flex items-center space-x-2">
        <History className="h-6 w-6 text-primary" />
        <h1 className="text-3xl font-bold" data-testid="text-page-title">{t('chatHistory.title')}</h1>
      </div>
      <p className="text-muted-foreground" data-testid="text-page-description">
        {t('chatHistory.subtitle')}
      </p>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Chat Sessions History */}
        <Card data-testid="card-chat-sessions">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <MessageSquare className="h-5 w-5" />
              <span>{t('chatHistory.recentConversations')}</span>
            </CardTitle>
            <CardDescription>
              {t('chatHistory.sessionsDesc')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-96">
              {sessions.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground" data-testid="text-no-sessions">
          <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>{t('chatHistory.noSessions')}</p>
          <p className="text-sm">{t('chatHistory.noSessionsDesc')}</p>
        </div>
      ) : (
                <div className="space-y-4">
                  {sessions.map((session: ChatSession) => (
                    <div key={session.id} className="border rounded-lg p-4 space-y-2" data-testid={`card-session-${session.id}`}>
                      {/* Main title - show actual conversation title or fallback */}
                      <h3 className="font-medium text-lg" data-testid={`text-session-title-${session.id}`}>
                        {session.title && session.title !== 'New Chat Session' ? session.title : t('chatHistory.untitled')}
                      </h3>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Badge
                            variant="outline"
                            className="text-xs"
                            data-testid={`badge-companion-${session.aiCompanion}`}
                          >
                            {session.aiCompanion === 'vanessa' ? '🇺🇸 Vanessa' : '🇪🇸 Monica'}
                          </Badge>
                        </div>
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4 mr-1" />
                          <span data-testid={`text-session-date-${session.id}`}>
                            {formatDate(
                              parseDateSafe(
                                session.createdAt ??
                                  session.updatedAt ??
                                  (session as any).created_at ??
                                  (session as any).updated_at ??
                                  (session as any).timestamp ??
                                  (session as any).time ??
                                  (session as any).date
                              )
                            )}
                          </span>
                        </div>
                      </div>
                      
                      {session.sessionSummary && (
                        <p className="text-sm text-muted-foreground" data-testid={`text-session-summary-${session.id}`}>
                          {session.sessionSummary}
                        </p>
                      )}
                      
                      {session.anxietyLevel && (
                        <div className="flex items-center space-x-2">
                          <span className="text-sm">{t('chatHistory.anxietyLevel')}:</span>
                          <Badge 
                            className={getAnxietyLevelColor(session.anxietyLevel)}
                            data-testid={`badge-anxiety-level-${session.id}`}
                          >
                            {session.anxietyLevel}/10 - {getAnxietyLevelText(session.anxietyLevel)}
                          </Badge>
                        </div>
                      )}
                      
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full mt-2"
                        onClick={() => window.location.href = `/chat?session=${session.id}`}
                        data-testid={`button-view-session-${session.id}`}
                      >
                        {t('chatHistory.viewConversation')}
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Anxiety Analysis History */}
        <Card data-testid="card-anxiety-analyses">
          <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Brain className="h-5 w-5" />
                <span>{t('chatHistory.interventions')}</span>
              </CardTitle>
              <CardDescription>
                {t('chatHistory.interventionsDesc')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                {recentAnalyses.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground" data-testid="text-no-analyses">
                    <Brain className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>{t('chatHistory.noAnalyses')}</p>
                    <p className="text-sm">{t('chatHistory.noAnalysesDesc')}</p>
                  </div>
                ) : (
                <div className="space-y-4">
                  {recentAnalyses.map((analysis: AnxietyAnalysis) => (
                    <div key={analysis.id} className="border rounded-lg p-4 space-y-3" data-testid={`card-analysis-${analysis.id}`}>
                      <div className="flex items-center justify-between">
                        <Badge 
                          className={getAnxietyLevelColor(analysis.anxietyLevel)}
                          data-testid={`badge-analysis-level-${analysis.id}`}
                        >
                          {analysis.anxietyLevel}/10 - {getAnxietyLevelText(analysis.anxietyLevel)}
                        </Badge>
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Clock className="h-4 w-4 mr-1" />
                          <span data-testid={`text-analysis-date-${analysis.id}`}>
                            {formatDateTime(
                              parseDateSafe(
                                analysis.createdAt ??
                                  (analysis as any).updatedAt ??
                                  (analysis as any).created_at ??
                                  (analysis as any).updated_at ??
                                  (analysis as any).timestamp ??
                                  (analysis as any).time ??
                                  (analysis as any).date
                              )
                            )}
                          </span>
                        </div>
                      </div>

                      {(analysis.anxietyTriggers ?? []).length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium mb-2">{t('chatHistory.identifiedTriggers')}:</h4>
                          <div className="flex flex-wrap gap-1" data-testid={`triggers-${analysis.id}`}>
                            {(analysis.anxietyTriggers ?? []).map((trigger, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {translateAnxietyTrigger(trigger)}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {analysis.copingStrategies.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium mb-2">{t('chatHistory.copingStrategies')}:</h4>
                          <div className="flex flex-wrap gap-1" data-testid={`strategies-${analysis.id}`}>
                            {analysis.copingStrategies.map((strategy, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {translateCopingStrategy(strategy)}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {analysis.personalizedResponse && (
                        <div>
                          <h4 className="text-sm font-medium mb-2">{t('chatHistory.aiResponse')}:</h4>
                          <p className="text-sm text-muted-foreground bg-muted p-2 rounded" data-testid={`text-personalized-response-${analysis.id}`}>
                            {translatePersonalizedResponse(analysis.personalizedResponse)}
                          </p>
                        </div>
                      )}

                      <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
                        <span data-testid={`text-analysis-source-${analysis.id}`}>
                          {t('chatHistory.sourceLabel')}: {analysis.analysisSource}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ChatHistory;
