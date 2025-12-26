
import React, { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronRight, Brain, AlertTriangle, Target, Lightbulb } from 'lucide-react';
import { DateRange } from 'react-day-picker';

import ChartDateRangePicker from './ChartDateRangePicker';
import { useLanguage } from '@/context/LanguageContext';

interface TriggerData {
  trigger: string;
  count: number;
  avgSeverity: number;
  color: string;
  category: string;
  description: string;
  whyExplanation: string;
  relatedTriggers?: string[];
  // New patient narrative fields
  memoryContext?: string;
  aggravators?: string[];
  impact?: string;
  lastEpisodeDate?: string;
  trend?: string;
  patientNarrative?: string;
  evidenceLine?: string;
}

interface TriggerAnalysisTableProps {
  triggerData: TriggerData[];
  totalEntries: number;
  dateRange?: DateRange;
  onDateRangeChange?: (range: DateRange | undefined) => void;
  minDate?: Date;
  maxDate?: Date;
}

const TriggerAnalysisTable: React.FC<TriggerAnalysisTableProps> = ({
  triggerData,
  totalEntries,
  dateRange,
  onDateRangeChange,
  minDate,
  maxDate
}) => {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const { t, language } = useLanguage();

  // Helper function to translate evidence line text
  const translateEvidenceLine = (text: string): string => {
    if (!text) return text;

    // Parse evidence line pattern: "Evidence: Last episode [date] ([severity]/10); [count] episodes in [timeWindow]; [trend] vs prior."
    const match = text.match(/Evidence: Last episode (.+) \((\d+)\/10\); (\d+) episodes in (.+); (.+) vs prior\./);
    if (!match) return text;

    const [, lastEpisode, severity, count, timeWindow, trend] = match;

    // Translate components
    const evidenceLabel = t('analytics.triggers.evidenceLabel', 'Evidence: Last episode');
    const severityScale = t('analytics.triggers.severityScale', '/10');
    const episodesIn = t('analytics.triggers.episodesIn', 'episodes in');
    const vsPrior = t('analytics.triggers.vsPrior', 'vs prior');

    // Translate dynamic parts
    const translatedLastEpisode = translateLastEpisode(lastEpisode);
    const translatedTimeWindow = translateTimeWindow(timeWindow);
    const translatedTrend = translateTrend(trend);

    return `${evidenceLabel} ${translatedLastEpisode} (${severity}${severityScale}); ${count} ${episodesIn} ${translatedTimeWindow}; ${translatedTrend} ${vsPrior}.`;
  };

  // Helper function to translate time window
  const translateTimeWindow = (timeWindow: string): string => {
    const timeWindowMap: Record<string, string> = {
      'past month': t('analytics.triggers.timeWindow.pastMonth', 'past month'),
      'past two weeks': t('analytics.triggers.timeWindow.pastTwoWeeks', 'past two weeks'),
      'past week': t('analytics.triggers.timeWindow.pastWeek', 'past week'),
      'past year': t('analytics.triggers.timeWindow.pastYear', 'past year')
    };

    return timeWindowMap[timeWindow] || timeWindow;
  };

  // Helper function to translate trend
  const translateTrend = (trend: string): string => {
    const trendMap: Record<string, string> = {
      'increasing': t('analytics.triggers.trend.increasing', 'increasing'),
      'decreasing': t('analytics.triggers.trend.decreasing', 'decreasing'),
      'stable': t('analytics.triggers.trend.stable', 'stable')
    };

    return trendMap[trend] || trend;
  };

  // Helper function to translate last episode date
  const translateLastEpisode = (lastEpisode: string): string => {
    // Handle specific date terms
    const dateTermMap: Record<string, string> = {
      'today': t('analytics.triggers.date.today', 'today'),
      'yesterday': t('analytics.triggers.date.yesterday', 'yesterday'),
      'recently': t('analytics.triggers.date.recently', 'recently')
    };

    // Check for exact matches first
    if (dateTermMap[lastEpisode]) {
      return dateTermMap[lastEpisode];
    }

    // Handle "X days ago" pattern
    const daysMatch = lastEpisode.match(/^(\d+) days ago$/);
    if (daysMatch) {
      const days = daysMatch[1];
      if (days === '1') {
        return t('analytics.triggers.date.oneDayAgo', '1 day ago');
      }
      return t('analytics.triggers.date.daysAgo', '{count} days ago').replace('{count}', days);
    }

    // Handle "X weeks ago" pattern
    const weeksMatch = lastEpisode.match(/^(\d+) weeks ago$/);
    if (weeksMatch) {
      const weeks = weeksMatch[1];
      if (weeks === '1') {
        return t('analytics.triggers.date.oneWeekAgo', '1 week ago');
      }
      return t('analytics.triggers.date.weeksAgo', '{count} weeks ago').replace('{count}', weeks);
    }

    // Return as-is for formatted dates like "Dec 26"
    return lastEpisode;
  };

  // Helper function to translate patient narrative text
  const translatePatientNarrative = (text: string): string => {
    if (!text) return text;

    // Handle general pattern note
    if (text.includes('Pattern noted for general anxiety; limited details recorded')) {
      return t('analytics.triggers.patternNotedGeneral');
    }

    // Handle health concerns narrative
    if (text.includes('Patient reports anxiety with health concerns, recalling physical symptoms')) {
      return t('analytics.triggers.healthConcernsNarrative');
    }

    // Handle social anxiety pattern
    if (text.includes('Patient reports anxiety with social situations, recalling')) {
      return translateSocialAnxietyNarrative(text);
    }

    // Handle work/academic anxiety pattern
    if (text.includes('Patient reports anxiety with work/academic situations, recalling')) {
      return translateWorkAnxietyNarrative(text);
    }

    // Handle financial anxiety pattern
    if (text.includes('Patient reports anxiety with financial matters, recalling')) {
      return translateFinancialAnxietyNarrative(text);
    }

    // Handle relationship anxiety pattern
    if (text.includes('Patient reports anxiety with relationships, recalling')) {
      return translateRelationshipAnxietyNarrative(text);
    }

    // Handle uncertainty anxiety pattern
    if (text.includes('Patient reports anxiety with uncertainty, recalling')) {
      return translateUncertaintyAnxietyNarrative(text);
    }

    return text; // Return original if no pattern matches
  };

  // Helper functions for translating specific narrative types
  const translateSocialAnxietyNarrative = (text: string): string => {
    // Extract dynamic parts from the text
    const match = text.match(/Patient reports anxiety with social situations, recalling (.+)\. Symptoms intensify with (.+), leading to (.+)\./);
    if (!match) return text;

    const [, memoryContext, aggravatorsText, impact] = match;
    const aggravators = aggravatorsText.split(' and ');

    // Get translation components
    const patientReports = t('analytics.triggers.patientReports.social', 'Patient reports anxiety with social situations, recalling');
    const symptomsIntensify = t('analytics.triggers.symptomsIntensify', 'Symptoms intensify with');
    const leadingTo = t('analytics.triggers.leadingTo', 'leading to');

    // Translate dynamic parts
    const translatedMemoryContext = translateMemoryContext(memoryContext);
    const translatedAggravators = aggravators.map(agg => translateAggravator(agg));
    const translatedImpact = translateImpact(impact);

    return `${patientReports} ${translatedMemoryContext}. ${symptomsIntensify} ${translatedAggravators.join(' and ')}, ${leadingTo} ${translatedImpact}.`;
  };

  const translateWorkAnxietyNarrative = (text: string): string => {
    const match = text.match(/Patient reports anxiety with work\/academic situations, recalling (.+)\. Symptoms intensify with (.+), leading to (.+)\./);
    if (!match) return text;

    const [, memoryContext, aggravatorsText, impact] = match;
    const aggravators = aggravatorsText.split(' and ');

    const patientReports = t('analytics.triggers.patientReports.work', 'Patient reports anxiety with work/academic situations, recalling');
    const symptomsIntensify = t('analytics.triggers.symptomsIntensify', 'Symptoms intensify with');
    const leadingTo = t('analytics.triggers.leadingTo', 'leading to');

    // Translate dynamic parts
    const translatedMemoryContext = translateMemoryContext(memoryContext);
    const translatedAggravators = aggravators.map(agg => translateAggravator(agg));
    const translatedImpact = translateImpact(impact);

    return `${patientReports} ${translatedMemoryContext}. ${symptomsIntensify} ${translatedAggravators.join(' and ')}, ${leadingTo} ${translatedImpact}.`;
  };

  const translateFinancialAnxietyNarrative = (text: string): string => {
    const match = text.match(/Patient reports anxiety with financial matters, recalling (.+)\. Symptoms intensify with (.+), leading to (.+)\./);
    if (!match) return text;

    const [, memoryContext, aggravatorsText, impact] = match;
    const aggravators = aggravatorsText.split(' and ');

    const patientReports = t('analytics.triggers.patientReports.financial', 'Patient reports anxiety with financial matters, recalling');
    const symptomsIntensify = t('analytics.triggers.symptomsIntensify', 'Symptoms intensify with');
    const leadingTo = t('analytics.triggers.leadingTo', 'leading to');

    // Translate dynamic parts
    const translatedMemoryContext = translateMemoryContext(memoryContext);
    const translatedAggravators = aggravators.map(agg => translateAggravator(agg));
    const translatedImpact = translateImpact(impact);

    return `${patientReports} ${translatedMemoryContext}. ${symptomsIntensify} ${translatedAggravators.join(' and ')}, ${leadingTo} ${translatedImpact}.`;
  };

  const translateRelationshipAnxietyNarrative = (text: string): string => {
    const match = text.match(/Patient reports anxiety with relationships, recalling (.+)\. Symptoms intensify with (.+), leading to (.+)\./);
    if (!match) return text;

    const [, memoryContext, aggravatorsText, impact] = match;
    const aggravators = aggravatorsText.split(' and ');

    const patientReports = t('analytics.triggers.patientReports.relationships', 'Patient reports anxiety with relationships, recalling');
    const symptomsIntensify = t('analytics.triggers.symptomsIntensify', 'Symptoms intensify with');
    const leadingTo = t('analytics.triggers.leadingTo', 'leading to');

    // Translate dynamic parts
    const translatedMemoryContext = translateMemoryContext(memoryContext);
    const translatedAggravators = aggravators.map(agg => translateAggravator(agg));
    const translatedImpact = translateImpact(impact);

    return `${patientReports} ${translatedMemoryContext}. ${symptomsIntensify} ${translatedAggravators.join(' and ')}, ${leadingTo} ${translatedImpact}.`;
  };

  const translateUncertaintyAnxietyNarrative = (text: string): string => {
    const match = text.match(/Patient reports anxiety with uncertainty, recalling (.+)\. Symptoms intensify with (.+), leading to (.+)\./);
    if (!match) return text;

    const [, memoryContext, aggravatorsText, impact] = match;
    const aggravators = aggravatorsText.split(' and ');

    const patientReports = t('analytics.triggers.patientReports.uncertainty', 'Patient reports anxiety with uncertainty, recalling');
    const symptomsIntensify = t('analytics.triggers.symptomsIntensify', 'Symptoms intensify with');
    const leadingTo = t('analytics.triggers.leadingTo', 'leading to');

    // Translate dynamic parts
    const translatedMemoryContext = translateMemoryContext(memoryContext);
    const translatedAggravators = aggravators.map(agg => translateAggravator(agg));
    const translatedImpact = translateImpact(impact);

    return `${patientReports} ${translatedMemoryContext}. ${symptomsIntensify} ${translatedAggravators.join(' and ')}, ${leadingTo} ${translatedImpact}.`;
  };

  // Helper functions for translating dynamic content
  const translateMemoryContext = (context: string): string => {
    const memoryContextMap: Record<string, string> = {
      // Social anxiety
      'encounters with attractive individuals': t('analytics.triggers.memoryContext.encountersAttractive', 'encounters with attractive individuals'),
      'past experiences of criticism': t('analytics.triggers.memoryContext.pastCriticism', 'past experiences of criticism'),
      'difficult past conversations': t('analytics.triggers.memoryContext.difficultConversations', 'difficult past conversations'),

      // Work/academic
      'past performance reviews': t('analytics.triggers.memoryContext.performanceReviews', 'past performance reviews'),
      'previous setbacks': t('analytics.triggers.memoryContext.previousSetbacks', 'previous setbacks'),
      'visa concerns': t('analytics.triggers.memoryContext.visaConcerns', 'visa concerns'),

      // Health
      'physical symptoms': t('analytics.triggers.memoryContext.physicalSymptoms', 'physical symptoms'),
      'past health scares': t('analytics.triggers.memoryContext.healthScares', 'past health scares'),

      // Financial
      'past financial struggles': t('analytics.triggers.memoryContext.financialStruggles', 'past financial struggles'),
      'job loss': t('analytics.triggers.memoryContext.jobLoss', 'job loss'),

      // Relationships
      'family conflicts': t('analytics.triggers.memoryContext.familyConflicts', 'family conflicts'),
      'relationship challenges': t('analytics.triggers.memoryContext.relationshipChallenges', 'relationship challenges'),

      // Uncertainty
      'uncertain outcomes': t('analytics.triggers.memoryContext.uncertainOutcomes', 'uncertain outcomes'),

      // Fallbacks
      'social situations': t('analytics.triggers.memoryContext.socialSituations', 'social situations'),
      'workplace challenges': t('analytics.triggers.memoryContext.workplaceChallenges', 'workplace challenges'),
      'various situations': t('analytics.triggers.memoryContext.variousSituations', 'various situations')
    };

    return memoryContextMap[context] || context;
  };

  const translateAggravator = (aggravator: string): string => {
    const aggravatorMap: Record<string, string> = {
      // Social anxiety
      'eye contact': t('analytics.triggers.aggravator.eyeContact', 'eye contact'),
      'unexpected encounters': t('analytics.triggers.aggravator.unexpectedEncounters', 'unexpected encounters'),
      'being observed': t('analytics.triggers.aggravator.beingObserved', 'being observed'),
      'performance situations': t('analytics.triggers.aggravator.performanceSituations', 'performance situations'),
      'group settings': t('analytics.triggers.aggravator.groupSettings', 'group settings'),
      'unfamiliar people': t('analytics.triggers.aggravator.unfamiliarPeople', 'unfamiliar people'),
      'crowded spaces': t('analytics.triggers.aggravator.crowdedSpaces', 'crowded spaces'),
      'unexpected attention': t('analytics.triggers.aggravator.unexpectedAttention', 'unexpected attention'),

      // Work/academic
      'deadlines': t('analytics.triggers.aggravator.deadlines', 'deadlines'),
      'evaluations': t('analytics.triggers.aggravator.evaluations', 'evaluations'),
      'high-stakes tasks': t('analytics.triggers.aggravator.highStakesTasks', 'high-stakes tasks'),
      'competition': t('analytics.triggers.aggravator.competition', 'competition'),
      'time pressure': t('analytics.triggers.aggravator.timePressure', 'time pressure'),
      'performance expectations': t('analytics.triggers.aggravator.performanceExpectations', 'performance expectations'),

      // Health
      'body sensations': t('analytics.triggers.aggravator.bodySensations', 'body sensations'),
      'medical news': t('analytics.triggers.aggravator.medicalNews', 'medical news'),

      // Financial
      'bills arriving': t('analytics.triggers.aggravator.billsArriving', 'bills arriving'),
      'budget discussions': t('analytics.triggers.aggravator.budgetDiscussions', 'budget discussions'),

      // Relationships
      'arguments': t('analytics.triggers.aggravator.arguments', 'arguments'),
      'emotional distance': t('analytics.triggers.aggravator.emotionalDistance', 'emotional distance'),

      // Uncertainty
      'lack of control': t('analytics.triggers.aggravator.lackOfControl', 'lack of control'),
      'unpredictable changes': t('analytics.triggers.aggravator.unpredictableChanges', 'unpredictable changes'),

      // General
      'stress': t('analytics.triggers.aggravator.stress', 'stress'),
      'unexpected events': t('analytics.triggers.aggravator.unexpectedEvents', 'unexpected events')
    };

    return aggravatorMap[aggravator] || aggravator;
  };

  const translateImpact = (impact: string): string => {
    const impactMap: Record<string, string> = {
      // Social anxiety
      'avoidance of social venues': t('analytics.triggers.impact.avoidanceSocialVenues', 'avoidance of social venues'),
      'social withdrawal': t('analytics.triggers.impact.socialWithdrawal', 'social withdrawal'),
      'limiting social interactions': t('analytics.triggers.impact.limitingInteractions', 'limiting social interactions'),
      'social avoidance': t('analytics.triggers.impact.socialAvoidance', 'social avoidance'),

      // Work/academic
      'procrastination': t('analytics.triggers.impact.procrastination', 'procrastination'),
      'self-doubt': t('analytics.triggers.impact.selfDoubt', 'self-doubt'),
      'work avoidance': t('analytics.triggers.impact.workAvoidance', 'work avoidance'),
      'career limitations': t('analytics.triggers.impact.careerLimitations', 'career limitations'),

      // Health
      'health monitoring': t('analytics.triggers.impact.healthMonitoring', 'health monitoring'),

      // Financial
      'spending restrictions': t('analytics.triggers.impact.spendingRestrictions', 'spending restrictions'),

      // Relationships
      'relationship strain': t('analytics.triggers.impact.relationshipStrain', 'relationship strain'),

      // Uncertainty
      'decision paralysis': t('analytics.triggers.impact.decisionParalysis', 'decision paralysis'),

      // General
      'daily functioning': t('analytics.triggers.impact.dailyFunctioning', 'daily functioning')
    };

    return impactMap[impact] || impact;
  };

  // Helper function to translate related trigger names for fallback patterns
  const translateRelatedTriggerName = (triggerName: string): string => {
    const triggerNameMap: Record<string, string> = {
      // Common triggers that appear in related triggers
      'crowded rooms': t('analytics.triggers.relatedTrigger.crowdedRooms', 'crowded rooms'),
      'group introductions': t('analytics.triggers.relatedTrigger.groupIntroductions', 'group introductions'),
      'eye contact during presentations': t('analytics.triggers.relatedTrigger.eyeContactPresentations', 'eye contact during presentations'),
      'heart racing before meetings': t('analytics.triggers.relatedTrigger.heartRacingMeetings', 'heart racing before meetings'),
      'perfectionism': t('analytics.triggers.relatedTrigger.perfectionism', 'perfectionism'),
      'sunday scaries': t('analytics.triggers.relatedTrigger.sundayScaries', 'sunday scaries'),
      'fear of judgment': t('analytics.triggers.relatedTrigger.fearOfJudgment', 'fear of judgment'),

      // Add more common trigger names as needed
      'social anxiety': t('analytics.triggers.relatedTrigger.socialAnxiety', 'social anxiety'),
      'work stress': t('analytics.triggers.relatedTrigger.workStress', 'work stress'),
      'health concerns': t('analytics.triggers.relatedTrigger.healthConcerns', 'health concerns'),
      'financial stress': t('analytics.triggers.relatedTrigger.financialStress', 'financial stress'),
      'relationship issues': t('analytics.triggers.relatedTrigger.relationshipIssues', 'relationship issues')
    };

    return triggerNameMap[triggerName.toLowerCase()] || triggerName;
  };

  // Helper function to translate category names - memoized to update when language changes
  const translateCategory = useMemo(() => {
    return (category: string): string => {
      if (!category) return category;
      
      const categoryMap: Record<string, string> = {
        'Social Anxiety': t('analytics.triggers.category.socialAnxiety', 'Social Anxiety'),
        'General Anxiety': t('analytics.triggers.category.generalAnxiety', 'General Anxiety'),
        'Health Concerns': t('analytics.triggers.category.healthConcerns', 'Health Concerns'),
      };
      
      return categoryMap[category] || category;
    };
  }, [t, language]);

  if (!triggerData || triggerData.length === 0) {
    return null;
  }

  const toggleRow = (trigger: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(trigger)) {
      newExpanded.delete(trigger);
    } else {
      newExpanded.add(trigger);
    }
    setExpandedRows(newExpanded);
  };

  // Helper function to format the trend indicator
  const getTrendIcon = (trend?: string) => {
    if (trend === 'increasing') return '↑';
    if (trend === 'decreasing') return '↓';
    return '→';
  };
  
  const getTrendColor = (trend?: string) => {
    if (trend === 'increasing') return 'text-red-600';
    if (trend === 'decreasing') return 'text-green-600';
    return 'text-gray-600';
  };

  return (
    <Card className="p-4 sm:p-6 bg-gradient-to-br from-white to-blue-50/30">
      <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center sm:justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Brain className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg sm:text-xl font-bold text-gray-900">{t('analytics.triggers.title')}</h3>
            <p className="text-xs sm:text-sm text-gray-600">{t('analytics.triggers.description')}</p>
          </div>
        </div>
        {onDateRangeChange && (
          <div className="w-full sm:w-auto">
            <ChartDateRangePicker
              value={dateRange}
              onChange={onDateRangeChange}
              minDate={minDate}
              maxDate={maxDate}
              label={t('therapistDashboard.range.label')}
            />
          </div>
        )}
      </div>

      <div className="space-y-4">
        {triggerData
          .slice(0, 10) // Limit to top 10 triggers
          .map((trigger) => {
            const isExpanded = expandedRows.has(trigger.trigger);
            const riskLevel = trigger.avgSeverity >= 7 ? 'high' : trigger.avgSeverity >= 5 ? 'moderate' : 'low';
            
            return (
              <Card key={trigger.trigger} className="border border-gray-200 hover:shadow-md transition-all duration-200">
                <Collapsible>
                  <CollapsibleTrigger asChild>
                    <div 
                      className="w-full p-3 sm:p-4 cursor-pointer hover:bg-gray-50/50 transition-colors"
                      onClick={() => toggleRow(trigger.trigger)}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div className="flex items-start sm:items-center gap-3 flex-1 min-w-0">
                          {/* Trigger Info */}
                          <div className="flex-shrink-0">
                            <div 
                              className="w-4 h-4 rounded-full border-2 border-white shadow-md mt-1 sm:mt-0" 
                              style={{ backgroundColor: trigger.color }}
                            />
                          </div>
                          <div>
                              <h4 className="font-bold text-gray-900 text-lg">{translateCategory(trigger.trigger)}</h4>
                              <p className="text-sm text-gray-600">
                {translatePatientNarrative(trigger.patientNarrative || trigger.description)}
              </p>
            </div>
                        </div>

                        {/* Metrics - Stack on mobile, horizontal on desktop */}
                        <div className="flex flex-wrap items-center gap-3 sm:gap-4 sm:ml-auto sm:mr-4">
                          <div className="text-center min-w-[60px]">
                            <div className="text-xl sm:text-2xl font-bold text-gray-900">{trigger.count}</div>
                            <div className="text-xs text-gray-500">{t('analytics.triggers.count')}</div>
                          </div>
                          
                          <div className="text-center min-w-[60px]">
                            <div className={`text-xl sm:text-2xl font-bold ${
                              riskLevel === 'high' ? 'text-red-600' : 
                              riskLevel === 'moderate' ? 'text-orange-600' : 'text-green-600'
                            }`}>
                              {(trigger?.avgSeverity !== null && trigger?.avgSeverity !== undefined && !isNaN(Number(trigger.avgSeverity)) ? Number(trigger.avgSeverity).toFixed(1) : '0.0')}
                            </div>
                            <div className="text-xs text-gray-500">{t('analytics.triggers.avgSeverity')}</div>
                          </div>
                          
                          <div className="text-center min-w-[60px]">
                            <div className="text-xl sm:text-2xl font-bold text-blue-600">
                              {(trigger?.count !== null && trigger?.count !== undefined && totalEntries !== null && totalEntries !== undefined && totalEntries > 0 && !isNaN(Number(trigger.count))) ? ((Number(trigger.count) / Number(totalEntries)) * 100).toFixed(0) : '0'}%
                            </div>
                            <div className="text-xs text-gray-500">{t('analytics.triggers.total')}</div>
                          </div>

                          <Badge variant={riskLevel === 'high' ? 'destructive' : riskLevel === 'moderate' ? 'secondary' : 'outline'} className="text-xs">
                            {riskLevel} {t('analytics.triggers.trend')}
                          </Badge>
                        </div>

                        {/* Expand Icon */}
                        <div className="flex items-center justify-end sm:justify-start flex-shrink-0">
                          {isExpanded ? (
                            <ChevronDown className="w-5 h-5 text-gray-400" />
                          ) : (
                            <ChevronRight className="w-5 h-5 text-gray-400" />
                          )}
                        </div>
                      </div>
                    </div>
                  </CollapsibleTrigger>

                  <CollapsibleContent>
                    <div className="px-3 sm:px-4 pb-3 sm:pb-4 border-t border-gray-100 bg-gray-50/50">
                      <div className="pt-3 sm:pt-4 space-y-3 sm:space-y-4">
                        {/* Evidence Line */}
                        <Card className="p-3 sm:p-4 bg-white border-l-4 border-l-blue-500">
                          <div className="flex items-start gap-2 sm:gap-3">
                            <div className="p-1.5 sm:p-2 bg-blue-50 rounded-lg flex-shrink-0">
                              <Brain className="w-4 h-4 text-blue-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h5 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">{t('analytics.triggers.evidence')}</h5>
                                <p className="text-xs sm:text-sm text-gray-700 leading-relaxed break-words">
                                {trigger.evidenceLine ? translateEvidenceLine(trigger.evidenceLine) : `Last episode ${trigger.lastEpisodeDate || 'recently'} (${trigger.avgSeverity.toFixed(0)}/10); ${trigger.count} episodes recorded; ${trigger.trend || 'stable'} trend.`}
                              </p>
                              {trigger.trend && (
                                <div className="mt-2 flex flex-wrap items-center gap-2">
                                  <span className="text-xs text-gray-500">{t('analytics.triggers.trendLabel')}:</span>
                                  <span className={`text-xs sm:text-sm font-medium ${getTrendColor(trigger.trend)}`}>
                                    {getTrendIcon(trigger.trend)} {t('analytics.triggers.trendLabel')}: {trigger.trend}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </Card>

                        {/* Trigger Details */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                          {/* Memory Context */}
                          {trigger.memoryContext && (
                            <Card className="p-3 sm:p-4 bg-white">
                              <h6 className="font-medium text-gray-900 mb-1 text-sm sm:text-base">{t('analytics.triggers.recalledContext')}</h6>
                              <p className="text-xs sm:text-sm text-gray-600 break-words">{translateMemoryContext(trigger.memoryContext)}</p>
                            </Card>
                          )}

                          {/* Aggravators */}
                          {trigger.aggravators && trigger.aggravators.length > 0 && (
                            <Card className="p-3 sm:p-4 bg-white">
                              <h6 className="font-medium text-gray-900 mb-1 text-sm sm:text-base">{t('analytics.triggers.aggravators')}</h6>
                              <p className="text-xs sm:text-sm text-gray-600 break-words">{trigger.aggravators.map(agg => translateAggravator(agg)).join(', ')}</p>
                            </Card>
                          )}

                          {/* Impact */}
                          {trigger.impact && (
                            <Card className="p-3 sm:p-4 bg-white">
                              <h6 className="font-medium text-gray-900 mb-1 text-sm sm:text-base">{t('analytics.triggers.impact')}</h6>
                              <p className="text-xs sm:text-sm text-gray-600 break-words">{translateImpact(trigger.impact)}</p>
                            </Card>
                          )}

                          {/* Last Episode */}
                          {trigger.lastEpisodeDate && (
                            <Card className="p-3 sm:p-4 bg-white">
                              <h6 className="font-medium text-gray-900 mb-1 text-sm sm:text-base">{t('analytics.triggers.lastOccurrence')}</h6>
                              <p className="text-xs sm:text-sm text-gray-600 break-words">{translateLastEpisode(trigger.lastEpisodeDate)}</p>
                            </Card>
                          )}
                        </div>

                        {/* Related Triggers */}
                        {trigger.relatedTriggers && trigger.relatedTriggers.length > 0 && (
                          <Card className="p-3 sm:p-4 bg-white">
                            <h5 className="font-semibold text-gray-900 mb-2 sm:mb-3 text-sm sm:text-base">{t('analytics.triggers.relatedPatterns')}</h5>
                            <div className="space-y-2 sm:space-y-3">
                              {trigger.relatedTriggers.slice(0, 6).map((related, index) => {
                                // Generate patient-specific narrative for related trigger
                                const getPatientNarrative = (triggerName: string) => {
                                  const narratives = {
                                    // Self-esteem and identity
                                    'self-worth concerns': 'Patient struggles with self-worth, recalling childhood comparisons to high-achieving siblings. Symptoms worsen with performance reviews and perceived failures, leading to overwork and burnout.',
                                    'body image': 'Patient feels anxious about appearance, remembering harsh comments from school peers. Symptoms intensify with social events and mirrors, leading to social withdrawal and restricted eating.',
                                    'imposter syndrome': 'Patient fears being exposed as incompetent, tracing to first job where they felt unprepared. Worsens with promotions and praise, resulting in declining opportunities.',
                                    'identity crisis': 'Patient questions sense of self, especially after recent life transition. Symptoms increase with major decisions and future planning, causing decision paralysis.',
                                    
                                    // Social and interpersonal
                                    'social interactions': 'Patient becomes anxious in social settings, recalling embarrassing party incident from college. Symptoms worsen with unfamiliar groups and expected participation, leading to social isolation.',
                                    'public speaking': 'Patient struggles with public speaking, recalling being bullied while presenting school projects in junior high. Symptoms intensify with larger audiences and self-critical thoughts linked to low self-esteem, leading to avoidance of presentations.',
                                    'crowds': 'Patient panics in crowds, remembering getting lost at a concert as a teenager. Symptoms escalate with loud noises and limited exits, resulting in avoiding public events.',
                                    'authority figures': 'Patient fears authority, stemming from harsh criticism by a demanding parent. Symptoms worsen with power imbalances and formal settings, causing difficulty advocating for themselves.',
                                    'conflict': 'Patient avoids confrontation, recalling volatile family arguments in childhood. Symptoms intensify with raised voices and disagreements, leading to passive-aggressive behaviors.',
                                    'rejection': 'Patient fears rejection deeply, tracing to early romantic disappointment. Symptoms worsen with new relationships and vulnerability, resulting in emotional walls.',
                                    'criticism': 'Patient is hypersensitive to feedback, remembering harsh teacher comments. Symptoms escalate with performance reviews and perceived judgment, causing perfectionist behaviors.',
                                    'embarrassment': 'Patient dreads embarrassment, recalling humiliating school presentation. Symptoms intensify with attention and mistakes, leading to excessive rehearsal and avoidance.',
                                    'loneliness': 'Patient struggles with isolation, feeling disconnected since moving cities. Symptoms worsen on weekends and holidays, leading to unhealthy coping mechanisms.',
                                    
                                    // Romantic and intimate relationships
                                    'attractive women': 'Patient feels anxious around attractive women, recalling rejection in high school. Symptoms worsen with eye contact and casual conversation, leading to avoidance of social situations.',
                                    'attractive men': 'Patient becomes nervous around attractive men, remembering awkward dating experiences. Symptoms intensify with flirting and romantic settings, causing missed relationship opportunities.',
                                    'dating': 'Patient avoids dating, recalling painful breakup that shattered confidence. Symptoms worsen with dating apps and first dates, leading to prolonged singleness.',
                                    'intimacy': 'Patient fears emotional closeness, stemming from betrayal in past relationship. Symptoms escalate with vulnerability and commitment discussions, causing relationship sabotage.',
                                    'relationship problems': 'Patient becomes anxious during conflicts, remembering parents\' divorce. Symptoms worsen with serious discussions and disagreements, leading to communication shutdown.',
                                    'breakups': 'Patient fears abandonment, tracing to unexpected ending of first love. Symptoms intensify with relationship uncertainty, causing clingy behaviors.',
                                    'jealousy': 'Patient struggles with jealousy, recalling partner\'s infidelity. Symptoms worsen with partner\'s opposite-sex friendships, leading to controlling behaviors.',
                                    
                                    // Academic and professional
                                    'academic pressure': 'Patient feels overwhelmed by studies, remembering failing important exam. Symptoms worsen before tests and with grade discussions, causing procrastination.',
                                    'job interviews': 'Patient dreads interviews, recalling humiliating rejection from dream job. Symptoms intensify with technical questions and panel interviews, limiting career growth.',
                                    'work stress': 'Patient feels crushed by workload, tracing to burnout at previous job. Symptoms worsen with deadlines and multiple projects, affecting work-life balance.',
                                    'performance evaluations': 'Patient becomes anxious during performance reviews, tied to fear of harsh judgment and a memory of critical feedback from an early job. Worsens with short-notice meetings; leads to sleep disruption the night before.',
                                    'deadlines': 'Patient panics about deadlines, remembering missed submission that affected graduation. Symptoms escalate as due dates approach, causing all-nighters.',
                                    'unemployment': 'Patient fears job loss, having experienced unexpected layoff before. Symptoms worsen with company changes and economic news, leading to overwork.',
                                    'workplace conflict': 'Patient avoids office disputes, recalling hostile work environment. Symptoms intensify with team tensions, causing productivity drops.',
                                    'presentations': 'Patient dreads presenting, remembering forgotten slides incident. Symptoms worsen with executive audiences and Q&A sessions, limiting visibility.',
                                    'exams': 'Patient experiences test anxiety, tracing to SAT failure. Symptoms escalate with timed tests and high stakes, affecting academic performance.',
                                    'high-stakes testing': 'Patient fears important exams, remembering medical school rejection. Symptoms worsen with standardized tests, causing career limitations.',
                                    
                                    // Family and childhood
                                    'family issues': 'Patient struggles with family dynamics, dealing with ongoing sibling rivalry. Symptoms worsen during holidays and family gatherings, causing avoidance.',
                                    'childhood trauma': 'Patient carries unresolved trauma from neglectful upbringing. Symptoms intensify with triggers resembling past events, affecting daily functioning.',
                                    'parental expectations': 'Patient feels crushed by family pressure, never meeting high standards set. Symptoms worsen with achievements discussions, causing chronic stress.',
                                    'sibling rivalry': 'Patient competes with successful sibling, feeling inadequate since childhood. Symptoms escalate during family comparisons, damaging self-esteem.',
                                    'divorce': 'Patient fears relationship failure, witnessing parents\' bitter divorce. Symptoms worsen with relationship milestones, causing commitment issues.',
                                    'parenting': 'Patient anxious about parenting, fearing they\'ll repeat parents\' mistakes. Symptoms intensify with child\'s struggles, leading to overprotection.',
                                    
                                    // Health and body
                                    'health worries': 'Patient obsesses over symptoms, after family member\'s sudden illness. Symptoms worsen with body sensations and medical news, causing frequent doctor visits.',
                                    'medical appointments': 'Patient fears doctors, remembering traumatic childhood hospitalization. Symptoms escalate with medical procedures, leading to avoided checkups.',
                                    'illness': 'Patient panics about getting sick, having experienced severe illness before. Symptoms worsen during flu season, causing excessive precautions.',
                                    'pain': 'Patient fears chronic pain returning, remembering months of suffering. Symptoms intensify with minor aches, leading to activity restrictions.',
                                    'aging': 'Patient anxious about getting older, watching parent\'s health decline. Symptoms worsen with birthdays and physical changes, causing depression.',
                                    'death': 'Patient fears mortality, triggered by unexpected loss of friend. Symptoms escalate with health scares and funerals, affecting sleep.',
                                    
                                    // Financial and security
                                    'financial concerns': 'Patient worries constantly about money, having grown up in poverty. Symptoms worsen with bills and unexpected expenses, causing insomnia.',
                                    'debt': 'Patient stressed by debt burden, accumulated during unemployment. Symptoms intensify with payment reminders, leading to avoidance behaviors.',
                                    'poverty': 'Patient fears returning to poverty, remembering childhood hardships. Symptoms worsen with job instability, causing hoarding behaviors.',
                                    'housing': 'Patient anxious about housing security, having faced eviction before. Symptoms escalate with rent increases, affecting mental health.',
                                    
                                    // Legal and immigration
                                    'immigration consequences': 'Patient fears deportation, living with uncertain legal status. Symptoms worsen with news of raids and policy changes, causing chronic stress.',
                                    'legal issues': 'Patient anxious about legal problems, dealing with ongoing court case. Symptoms intensify with legal documents, affecting concentration.',
                                    'police': 'Patient fears police encounters, after traumatic arrest experience. Symptoms worsen with sirens and uniforms, causing hypervigilance.',
                                    
                                    // Technology and modern life
                                    'technical difficulties': 'Patient frustrated by technology, feeling left behind digitally. Symptoms worsen with software updates and new devices, causing avoidance.',
                                    'social media': 'Patient anxious about online presence, comparing to others\' success. Symptoms intensify with posts and notifications, leading to account deletion.',
                                    'online harassment': 'Patient traumatized by cyberbullying, experiencing targeted attacks. Symptoms worsen with messages and comments, causing social withdrawal.',
                                    'cyber security': 'Patient fears data breaches, after identity theft incident. Symptoms escalate with password requirements, causing paranoid behaviors.',
                                    
                                    // Environmental and situational
                                    'driving': 'Patient fears driving, after witnessing serious accident. Symptoms worsen with highways and bad weather, limiting independence.',
                                    'flying': 'Patient panics on planes, remembering severe turbulence experience. Symptoms intensify with takeoff and landings, avoiding air travel.',
                                    'heights': 'Patient fears heights, after childhood fall from tree. Symptoms worsen with balconies and glass elevators, restricting activities.',
                                    'enclosed spaces': 'Patient claustrophobic, recalling being trapped in elevator. Symptoms escalate in small rooms and crowds, affecting daily life.',
                                    'storms': 'Patient anxious during storms, having survived tornado. Symptoms worsen with weather warnings, causing panic preparations.',
                                    'darkness': 'Patient fears darkness, stemming from childhood trauma. Symptoms intensify at night and power outages, affecting sleep.',
                                    
                                    // Existential and spiritual
                                    'uncertainty': 'Patient cannot tolerate unknown, needing control after chaotic childhood. Symptoms worsen with ambiguous situations, causing decision paralysis.',
                                    'future': 'Patient catastrophizes about future, unable to see positive outcomes. Symptoms intensify with planning discussions, leading to avoidance.',
                                    'change': 'Patient resists change, finding comfort in routine after instability. Symptoms worsen with transitions, causing significant distress.',
                                    'meaning': 'Patient questions life purpose, feeling lost after major loss. Symptoms escalate during quiet moments, leading to existential crisis.',
                                    
                                    // Specific phobias
                                    'animals': 'Patient fears dogs, after childhood bite incident. Symptoms worsen with barking and unexpected encounters, limiting outdoor activities.',
                                    'needles': 'Patient terrified of needles, remembering painful childhood vaccines. Symptoms escalate with medical procedures, avoiding necessary care.',
                                    'blood': 'Patient faints at blood sight, after traumatic injury witness. Symptoms worsen with medical shows and injuries, causing avoidance.',
                                    'vomiting': 'Patient fears vomiting, after food poisoning trauma. Symptoms intensify with nausea and others being sick, restricting diet.',
                                    
                                    // Catch-all categories
                                    'current situation': 'Patient overwhelmed by present circumstances, multiple stressors converging simultaneously. Symptoms worsen with additional demands, affecting all areas.',
                                    'unspecified - needs exploration': 'Pattern noted for this trigger; limited details recorded. Encourage logging when/where/body cues to refine the plan.',
                                    'general anxiety': 'Patient experiences pervasive worry without clear trigger, possibly generalized anxiety. Symptoms fluctuate unpredictably, affecting daily functioning.',
                                    'panic attacks': 'Patient fears panic attacks themselves, creating anticipatory anxiety. Symptoms worsen in previously triggering locations, causing agoraphobia.',
                                    
                                    // Additional common triggers
                                    'meetings': 'Patient anxious in meetings, recalling being criticized publicly by manager. Symptoms worsen with video calls and when presenting updates, leading to minimal participation.',
                                    'phone calls': 'Patient avoids phone calls, stemming from receiving bad news via phone about family emergency. Symptoms intensify with unknown numbers and voicemails, causing missed important calls.'
                                  };
                                  
                                  const narrative = narratives[triggerName.toLowerCase() as keyof typeof narratives];
                                  if (narrative) {
                                    return narrative;
                                  }

                                  // Fallback for unrecognized triggers - translate the pattern
                                  const translatedTriggerName = translateRelatedTriggerName(triggerName);
                                  return t('analytics.triggers.fallbackPattern', 'Pattern noted for {trigger}; limited details recorded. Encourage logging when/where/body cues to refine the plan.').replace('{trigger}', translatedTriggerName);
                                };

                                return (
                                  <div key={index} className="flex flex-col gap-2">
                                    <Badge variant="outline" className="text-xs w-fit font-medium">
                                      {related}
                                    </Badge>
                                    <p className="text-xs text-gray-600 leading-relaxed pl-2 border-l-2 border-gray-200">
                                      {getPatientNarrative(related)}
                                    </p>
                                  </div>
                                );
                              })}
                              {trigger.relatedTriggers.length > 6 && (
                                <Badge variant="secondary" className="text-xs">
                                  +{trigger.relatedTriggers.length - 6} more triggers requiring analysis
                                </Badge>
                              )}
                            </div>
                          </Card>
                        )}
                      </div>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </Card>
            );
          })}
      </div>
    </Card>
  );
};

export default TriggerAnalysisTable;
