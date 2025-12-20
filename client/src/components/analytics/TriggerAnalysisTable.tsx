
import React, { useState } from 'react';
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
  const { t } = useLanguage();

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
    <Card className="p-4 sm:p-6 bg-gradient-to-br from-white to-blue-50/30 w-full min-w-0 overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 sm:mb-6 min-w-0">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
            <Brain className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-base sm:text-xl font-bold text-gray-900 truncate">{t('analytics.triggers.title')}</h3>
            <p className="text-xs sm:text-sm text-gray-600 truncate">{t('analytics.triggers.description')}</p>
          </div>
        </div>
        {onDateRangeChange && (
          <div className="flex-shrink-0">
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

      <div className="space-y-3 sm:space-y-4 w-full min-w-0 overflow-hidden">
        {triggerData
          .slice(0, 10) // Limit to top 10 triggers
          .map((trigger) => {
            const isExpanded = expandedRows.has(trigger.trigger);
            const riskLevel = trigger.avgSeverity >= 7 ? 'high' : trigger.avgSeverity >= 5 ? 'moderate' : 'low';

            return (
              <Card key={trigger.trigger} className="border border-gray-200 hover:shadow-md transition-all duration-200 w-full min-w-0 overflow-hidden">
                <Collapsible>
                  <CollapsibleTrigger asChild>
                    <div
                      className="w-full p-3 sm:p-4 cursor-pointer hover:bg-gray-50/50 transition-colors min-w-0 overflow-hidden"
                      onClick={() => toggleRow(trigger.trigger)}
                    >
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 min-w-0">
                        <div className="flex items-start sm:items-center gap-3 flex-1 min-w-0 w-full">
                          {/* Trigger Info */}
                          <div className="flex items-start gap-2 sm:gap-3 min-w-0 flex-1">
                            <div
                              className="w-4 h-4 rounded-full border-2 border-white shadow-md flex-shrink-0 mt-1 sm:mt-0"
                              style={{ backgroundColor: trigger.color }}
                            />
                            <div className="min-w-0 flex-1">
                              <h4 className="font-bold text-gray-900 text-sm sm:text-lg break-words">{trigger.trigger}</h4>
                              <p className="text-xs sm:text-sm text-gray-600 break-words">
                                {trigger.patientNarrative || trigger.description}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Metrics - Stack on mobile, row on desktop */}
                        <div className="flex flex-wrap items-center gap-3 sm:gap-6 w-full sm:w-auto min-w-0">
                          <div className="text-center">
                            <div className="text-xl sm:text-2xl font-bold text-gray-900">{trigger.count}</div>
                            <div className="text-xs text-gray-500 truncate">{t('analytics.triggers.count')}</div>
                          </div>

                          <div className="text-center">
                            <div className={`text-xl sm:text-2xl font-bold ${
                              riskLevel === 'high' ? 'text-red-600' :
                              riskLevel === 'moderate' ? 'text-orange-600' : 'text-green-600'
                            }`}>
                              {(trigger?.avgSeverity !== null && trigger?.avgSeverity !== undefined && !isNaN(Number(trigger.avgSeverity)) ? Number(trigger.avgSeverity).toFixed(1) : '0.0')}
                            </div>
                            <div className="text-xs text-gray-500 truncate">{t('analytics.triggers.avgSeverity')}</div>
                          </div>

                          <div className="text-center">
                            <div className="text-xl sm:text-2xl font-bold text-blue-600">
                              {(trigger?.count !== null && trigger?.count !== undefined && totalEntries !== null && totalEntries !== undefined && totalEntries > 0 && !isNaN(Number(trigger.count))) ? ((Number(trigger.count) / Number(totalEntries)) * 100).toFixed(0) : '0'}%
                            </div>
                            <div className="text-xs text-gray-500 truncate">{t('analytics.triggers.total')}</div>
                          </div>

                          <Badge variant={riskLevel === 'high' ? 'destructive' : riskLevel === 'moderate' ? 'secondary' : 'outline'} className="flex-shrink-0 text-xs">
                            {riskLevel} {t('analytics.triggers.trend')}
                          </Badge>
                        </div>

                        {/* Expand Icon */}
                        <div className="flex items-center flex-shrink-0 sm:ml-2">
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
                    <div className="px-3 sm:px-4 pb-3 sm:pb-4 border-t border-gray-100 bg-gray-50/50 w-full min-w-0 overflow-hidden">
                      <div className="pt-4 space-y-4 w-full min-w-0">
                        {/* Evidence Line */}
                        <Card className="p-3 sm:p-4 bg-white border-l-4 border-l-blue-500 w-full min-w-0 overflow-hidden">
                          <div className="flex items-start gap-2 sm:gap-3 min-w-0">
                            <div className="p-2 bg-blue-50 rounded-lg flex-shrink-0">
                              <Brain className="w-4 h-4 text-blue-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h5 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base truncate">{t('analytics.triggers.evidence')}</h5>
                              <p className="text-xs sm:text-sm text-gray-700 leading-relaxed break-words">
                                {trigger.evidenceLine || `Last episode ${trigger.lastEpisodeDate || 'recently'} (${trigger.avgSeverity.toFixed(0)}/10); ${trigger.count} episodes recorded; ${trigger.trend || 'stable'} trend.`}
                              </p>
                              {trigger.trend && (
                                <div className="mt-2 flex items-center gap-2 flex-wrap">
                                  <span className="text-xs text-gray-500 flex-shrink-0">{t('analytics.triggers.trendLabel')}:</span>
                                  <span className={`text-xs sm:text-sm font-medium ${getTrendColor(trigger.trend)} break-words`}>
                                    {getTrendIcon(trigger.trend)} {t('analytics.triggers.trendLabel')}: {trigger.trend}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </Card>

                        {/* Trigger Details */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 w-full min-w-0">
                          {/* Memory Context */}
                          {trigger.memoryContext && (
                            <Card className="p-3 sm:p-4 bg-white w-full min-w-0 overflow-hidden">
                              <h6 className="font-medium text-gray-900 mb-1 text-xs sm:text-sm truncate">{t('analytics.triggers.recalledContext')}</h6>
                              <p className="text-xs sm:text-sm text-gray-600 break-words">{trigger.memoryContext}</p>
                            </Card>
                          )}

                          {/* Aggravators */}
                          {trigger.aggravators && trigger.aggravators.length > 0 && (
                            <Card className="p-3 sm:p-4 bg-white w-full min-w-0 overflow-hidden">
                              <h6 className="font-medium text-gray-900 mb-1 text-xs sm:text-sm truncate">{t('analytics.triggers.aggravators')}</h6>
                              <p className="text-xs sm:text-sm text-gray-600 break-words">{trigger.aggravators.join(', ')}</p>
                            </Card>
                          )}

                          {/* Impact */}
                          {trigger.impact && (
                            <Card className="p-3 sm:p-4 bg-white w-full min-w-0 overflow-hidden">
                              <h6 className="font-medium text-gray-900 mb-1 text-xs sm:text-sm truncate">{t('analytics.triggers.impact')}</h6>
                              <p className="text-xs sm:text-sm text-gray-600 break-words">{trigger.impact}</p>
                            </Card>
                          )}

                          {/* Last Episode */}
                          {trigger.lastEpisodeDate && (
                            <Card className="p-3 sm:p-4 bg-white w-full min-w-0 overflow-hidden">
                              <h6 className="font-medium text-gray-900 mb-1 text-xs sm:text-sm truncate">{t('analytics.triggers.lastOccurrence')}</h6>
                              <p className="text-xs sm:text-sm text-gray-600 break-words">{trigger.lastEpisodeDate}</p>
                            </Card>
                          )}
                        </div>

                        {/* Related Triggers */}
                        {trigger.relatedTriggers && trigger.relatedTriggers.length > 0 && (
                          <Card className="p-3 sm:p-4 bg-white w-full min-w-0 overflow-hidden">
                            <h5 className="font-semibold text-gray-900 mb-3 text-sm sm:text-base truncate">{t('analytics.triggers.relatedPatterns')}</h5>
                            <div className="space-y-3 w-full min-w-0">
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

                                  return narratives[triggerName.toLowerCase() as keyof typeof narratives] || 'Pattern noted for ' + triggerName + '; limited details recorded. Encourage logging when/where/body cues to refine the plan.';
                                };

                                return (
                                  <div key={index} className="flex flex-col gap-2 w-full min-w-0 overflow-hidden">
                                    <Badge variant="outline" className="text-xs w-fit font-medium flex-shrink-0">
                                      {related}
                                    </Badge>
                                    <p className="text-xs text-gray-600 leading-relaxed pl-2 border-l-2 border-gray-200 break-words">
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
