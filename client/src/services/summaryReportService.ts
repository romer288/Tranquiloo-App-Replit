import { InterventionSummary } from '@/types/goals';
import { GoalWithProgress } from '@/types/goals';
import { ClaudeAnxietyAnalysisWithDate } from '@/services/analyticsService';
import { processTriggerData, TriggerData, processSeverityDistribution, SeverityDistribution } from '@/utils/analyticsDataProcessor';
import { buildWeeklyTrendsData, WeeklyTrendData } from '@/utils/buildWeeklyTrendsData';
import { createTranslator, Language } from '@/context/LanguageContext';
import { translateInterventionLabel } from '@/utils/anxiety/interventions';

type Period = 'session' | 'week' | 'month' | 'year';

interface PeriodSummary {
  label: string;
  snapshot: {
    sessions: number;
    average: number;
    min: number;
    max: number;
    trend: string;
  };
  patientProblem: string;
  triggers: { name: string; count: number }[];
  therapies: { name: string; count: number; adherence: '✔' | 'Partial' | '✖' }[];
  progress: string;
  clinicalNotes: string[];
  codes: string[];
  homework: string;
}

const getLocale = (language: Language) => (language === 'es' ? 'es-ES' : 'en-US');

const formatDate = (date: Date, locale: string) =>
  new Intl.DateTimeFormat(locale, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);

const formatRange = (start: Date, locale: string, end?: Date) => {
  if (!end || start.toDateString() === end.toDateString()) {
    return formatDate(start, locale);
  }
  return `${formatDate(start, locale)} — ${formatDate(end, locale)}`;
};

const getPeriodKey = (date: Date, period: Period) => {
  const year = date.getFullYear();
  const month = date.getMonth();
  switch (period) {
    case 'session':
      return date.toISOString();
    case 'week': {
      const firstDay = new Date(date);
      const day = firstDay.getDay();
      const diff = firstDay.getDate() - day + (day === 0 ? -6 : 1);
      firstDay.setDate(diff);
      firstDay.setHours(0, 0, 0, 0);
      return `${firstDay.toISOString().slice(0, 10)}`;
    }
    case 'month':
      return `${year}-${String(month + 1).padStart(2, '0')}`;
    case 'year':
      return `${year}`;
    default:
      return date.toISOString();
  }
};

const sortDesc = <T,>(arr: T[], getter: (item: T) => number) =>
  [...arr].sort((a, b) => getter(b) - getter(a));

const aggregateAnalysesByPeriod = (
  analyses: ClaudeAnxietyAnalysisWithDate[] = [],
  period: Period,
  t: (key: string, fallback?: string) => string,
  locale: string
): PeriodSummary[] => {
  if (!analyses.length) return [];

  const groups = new Map<string, ClaudeAnxietyAnalysisWithDate[]>();
  analyses.forEach((analysis) => {
    const key = getPeriodKey(new Date(analysis.created_at), period);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(analysis);
  });

  const orderedKeys = sortDesc(Array.from(groups.keys()), (key) => new Date(key).getTime());

  return orderedKeys.map((key, index) => {
    const analysesForPeriod = groups.get(key) ?? [];
    const ordered = analysesForPeriod.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    const sessions = ordered.length;
    const start = new Date(ordered[0].created_at);
    const end = new Date(ordered[ordered.length - 1].created_at);

    const values = ordered.map((a) => a.anxietyLevel ?? 0);
    const average = Number((values.reduce((sum, value) => sum + value, 0) / Math.max(values.length, 1)).toFixed(1));
    const min = Math.min(...values);
    const max = Math.max(...values);

    const previousKey = orderedKeys[index + 1];
    let trend = t('interventions.noData', 'No prior period');
    if (previousKey) {
      const previousGroup = groups.get(previousKey) ?? [];
      if (previousGroup.length) {
        const previousAverage = previousGroup.reduce((sum, a) => sum + (a.anxietyLevel ?? 0), 0) / previousGroup.length;
        const delta = Number((average - previousAverage).toFixed(1));
        trend =
          delta > 0
            ? t('interventions.trend.upVsPrior', '↑ {delta} vs prior').replace('{delta}', `+${delta}`)
            : delta < 0
              ? t('interventions.trend.downVsPrior', '↓ {delta} vs prior').replace('{delta}', `${delta}`)
              : t('interventions.progressStable', 'No change vs prior');
      }
    }

    const triggerCounts = new Map<string, number>();
    ordered.forEach((analysis) => {
      const rawTriggers: any = (analysis as any).triggers ?? (analysis as any).anxietyTriggers ?? (analysis as any).anxiety_triggers ?? [];
      const triggersArr: string[] = Array.isArray(rawTriggers)
        ? rawTriggers
        : typeof rawTriggers === 'string'
          ? (() => {
              try {
                const parsed = JSON.parse(rawTriggers);
                return Array.isArray(parsed) ? parsed : String(rawTriggers).split(/[\n,•\-]+/).map((s) => String(s).trim()).filter(Boolean);
              } catch {
                return String(rawTriggers).split(/[\n,•\-]+/).map((s) => String(s).trim()).filter(Boolean);
              }
            })()
          : [];

      triggersArr.forEach((trigger) => {
        const normalized = String(trigger ?? '').trim();
        if (!normalized) return;
        triggerCounts.set(normalized, (triggerCounts.get(normalized) ?? 0) + 1);
      });
    });
    const triggers = Array.from(triggerCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([name, count]) => ({ name, count }));

    const therapyCounts = new Map<string, number>();
    ordered.forEach((analysis) => {
      const rawInterventions: any = (analysis as any).recommendedInterventions ?? (analysis as any).copingStrategies ?? [];
      const interventions: string[] = Array.isArray(rawInterventions)
        ? rawInterventions
        : typeof rawInterventions === 'string'
          ? (() => {
              try {
                const parsed = JSON.parse(rawInterventions);
                return Array.isArray(parsed) ? parsed : String(rawInterventions).split(/[\n,•\-]+/).map((s) => String(s).trim()).filter(Boolean);
              } catch {
                return String(rawInterventions).split(/[\n,•\-]+/).map((s) => String(s).trim()).filter(Boolean);
              }
            })()
          : [];

      interventions.forEach((therapy) => {
        const normalized = String(therapy ?? '').trim();
        if (!normalized) return;
        therapyCounts.set(normalized, (therapyCounts.get(normalized) ?? 0) + 1);
      });
    });
    const therapies = Array.from(therapyCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([name, count]) => ({
        name,
        count,
        adherence: (count >= sessions ? '✔' : count >= Math.ceil(sessions / 2) ? 'Partial' : '✖') as "✔" | "Partial" | "✖",
      }));

    const topTrigger = triggers[0]?.name;
    const avgLabel = average.toFixed(1);
    const patientProblem = topTrigger
      ? t(
          'interventions.patientProblem.withTrigger',
          'Patient experienced heightened anxiety around {trigger}. Severity averaged {avg}/10.'
        )
          .replace('{trigger}', topTrigger)
          .replace('{avg}', avgLabel)
      : t(
          'interventions.patientProblem.noTrigger',
          'Patient reported anxiety averaging {avg}/10 without clear trigger.'
        ).replace('{avg}', avgLabel);

    const progressDirection = trend.startsWith('↓')
      ? t('interventions.progressImproving', 'Improving')
      : trend.startsWith('↑')
        ? t('interventions.progressNeedsSupport', 'Needs support')
        : t('interventions.progressStable', 'Stable');
    const progress = t(
      'interventions.progressSummary',
      '{direction}: Immediate response {trend}.'
    )
      .replace('{direction}', progressDirection)
      .replace('{trend}', trend);

    const notes = ordered
      .map((analysis) => analysis.personalizedResponse?.trim())
      .filter((note): note is string => Boolean(note))
      .slice(0, 3);

    const codes = Array.from(
      new Set(
        ordered
          .flatMap((analysis) => analysis.dsm5Indicators || [])
          .filter((code): code is string => Boolean(code))
      )
    );

    const homeworkTechniqueRaw = therapies[0]?.name || t('interventions.homeworkFallback', 'Continue agreed coping plan');
    const homeworkTechnique = translateInterventionLabel(homeworkTechniqueRaw, t);
    const homework = t(
      'interventions.homeworkTemplate',
      'Focus task: {task}. Reinforce practice 3×/day or as assigned.'
    ).replace('{task}', homeworkTechnique);

    return {
      label: formatRange(start, locale, period === 'session' ? undefined : end),
      snapshot: { sessions, average, min, max, trend },
      patientProblem,
      triggers,
      therapies,
      progress,
      clinicalNotes: notes.length ? notes : [t('interventions.noNotes', 'No clinician notes documented this period.')],
      codes,
      homework,
    } satisfies PeriodSummary;
  });
};

interface TreatmentOutcomeSummary {
  period: string;
  averageAnxiety: number;
  improvement: number;
  effectiveness: 'improving' | 'stable' | 'declining';
}

interface MonthlyActivitySummary {
  monthKey: string;
  label: string;
  conversationCount: number;
  sessionCount: number;
  averageAnxiety: number;
}

const calculateTreatmentOutcomesSummary = (
  analyses: ClaudeAnxietyAnalysisWithDate[] = [],
  locale: string
): TreatmentOutcomeSummary[] => {
  if (!analyses.length) return [];

  const weeklyMap = new Map<string, number[]>();

  analyses.forEach((analysis) => {
    if (!analysis?.created_at) return;
    const date = new Date(analysis.created_at);
    if (Number.isNaN(date.getTime())) return;
    const weekStart = new Date(date);
    const day = weekStart.getDay();
    weekStart.setDate(weekStart.getDate() - day + (day === 0 ? -6 : 1));
    weekStart.setHours(0, 0, 0, 0);
    const key = weekStart.toISOString().split('T')[0];
    if (!weeklyMap.has(key)) {
      weeklyMap.set(key, []);
    }
    weeklyMap.get(key)!.push(analysis.anxietyLevel ?? 0);
  });

  const orderedWeeks = Array.from(weeklyMap.keys()).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

  return orderedWeeks.map((weekKey, index) => {
    const values = weeklyMap.get(weekKey) ?? [];
    const average = values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
    const previousKey = index > 0 ? orderedWeeks[index - 1] : undefined;
    let improvement = 0;
    let effectiveness: TreatmentOutcomeSummary['effectiveness'] = 'stable';

    if (previousKey) {
      const previousValues = weeklyMap.get(previousKey) ?? [];
      const previousAverage = previousValues.length ? previousValues.reduce((sum, value) => sum + value, 0) / previousValues.length : 0;
      if (previousAverage !== 0) {
        improvement = Math.round(((previousAverage - average) / previousAverage) * 100);
      } else {
        improvement = Math.round(previousAverage - average);
      }

      if (improvement > 10) effectiveness = 'improving';
      else if (improvement < -10) effectiveness = 'declining';
    }

    const periodLabel = new Date(weekKey).toLocaleDateString(locale, {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });

    return {
      period: periodLabel,
      averageAnxiety: Number(average.toFixed(1)),
      improvement,
      effectiveness,
    };
  });
};

const buildMonthlySessionActivitySummary = (
  summaries: InterventionSummary[] = [],
  analyses: ClaudeAnxietyAnalysisWithDate[] = [],
  locale: string
): MonthlyActivitySummary[] => {
  if (!summaries.length && !analyses.length) return [];

  const activityMap = new Map<string, MonthlyActivitySummary>();

  const registerMonth = (date: Date) => {
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    if (!activityMap.has(key)) {
      const label = date.toLocaleDateString(locale, { month: 'long', year: 'numeric' });
      activityMap.set(key, {
        monthKey: key,
        label,
        conversationCount: 0,
        sessionCount: 0,
        averageAnxiety: 0,
      });
    }
    return key;
  };

  summaries.forEach((summary) => {
    if (!summary?.week_start) return;
    const date = new Date(summary.week_start);
    if (Number.isNaN(date.getTime())) return;
    const key = registerMonth(date);
    const record = activityMap.get(key);
    if (!record) return;
    const conversations = Number(summary.conversation_count ?? 0);
    record.conversationCount += Number.isFinite(conversations) ? conversations : 0;
  });

  const anxietyAccumulator = new Map<string, { total: number; count: number }>();

  analyses.forEach((analysis) => {
    if (!analysis?.created_at) return;
    const date = new Date(analysis.created_at);
    if (Number.isNaN(date.getTime())) return;
    const key = registerMonth(date);
    const record = activityMap.get(key);
    if (!record) return;
    record.sessionCount += 1;

    if (!anxietyAccumulator.has(key)) {
      anxietyAccumulator.set(key, { total: 0, count: 0 });
    }
    const bucket = anxietyAccumulator.get(key)!;
    bucket.total += analysis.anxietyLevel ?? 0;
    bucket.count += 1;
  });

  for (const [key, record] of activityMap.entries()) {
    const bucket = anxietyAccumulator.get(key);
    if (bucket && bucket.count > 0) {
      record.averageAnxiety = Number((bucket.total / bucket.count).toFixed(1));
    }
  }

  return Array.from(activityMap.values()).sort((a, b) => new Date(a.monthKey).getTime() - new Date(b.monthKey).getTime());
};

const ensureArray = (value: any): string[] => {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return parsed;
    } catch {}
    return value.split(/[\n•\-]+/).map((item) => item.trim()).filter(Boolean);
  }
  return [];
};

interface ReportOptions {
  title?: string;
  language?: Language;
  t?: (key: string, fallback?: string) => string;
}

export const generateSummaryReport = (
  summaries: InterventionSummary[],
  goals: GoalWithProgress[],
  analyses?: ClaudeAnxietyAnalysisWithDate[],
  options: ReportOptions = {}
): string => {
  const language: Language = options.language ?? 'en';
  const t = options.t ?? createTranslator(language);
  const locale = getLocale(language);

  // Spanish: generate a localized (concise) report instead of mixing English body text.
  if (language === 'es') {
    return generateSummaryReportEs(summaries, goals, analyses ?? [], t, locale, options.title);
  }

  const today = new Date().toLocaleDateString(locale);
  const reportName = 'Mental Health Medical Data';
  const heading = options.title ?? 'Analytics & Intervention History Report';

  // Calculate comprehensive statistics
  const totalAnalyses = analyses?.length || 0;
  const totalConversations = summaries.reduce((sum, s) => sum + s.conversation_count, 0);
  const avgAnxiety = analyses && analyses.length > 0 
    ? analyses.reduce((sum, a) => sum + a.anxietyLevel, 0) / analyses.length 
    : 0;
  const highAnxietySessions = analyses?.filter(a => a.anxietyLevel >= 7).length || 0;
  const crisisRiskSessions = analyses?.filter(a => a.crisisRiskLevel === 'high').length || 0;
  const escalationCount = analyses?.filter(a => a.escalationDetected).length || 0;
  const severityDistribution: SeverityDistribution[] = processSeverityDistribution((analyses ?? []) as any);
  const weeklyTrendData: WeeklyTrendData[] = buildWeeklyTrendsData(analyses ?? []);
  const treatmentOutcomeSummary = calculateTreatmentOutcomesSummary(analyses ?? [], locale);
  const monthlyActivitySummary = buildMonthlySessionActivitySummary(summaries, analyses ?? [], locale);

  const therapyTypeCounts = summaries.reduce((acc, summary) => {
    const key = summary.intervention_type?.toLowerCase() || 'unspecified';
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const topTherapyTypes = Object.entries(therapyTypeCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([type, count]) => `${type.replace(/_/g, ' ')} (${count})`);

  const weeklyTrendHighlights = weeklyTrendData
    .map((week) => {
      const categories = [
        { label: 'Work/Career', value: week.workCareer },
        { label: 'Social', value: week.social },
        { label: 'Health', value: week.health },
        { label: 'Financial', value: week.financial },
        { label: 'Relationships', value: week.relationships },
        { label: 'Future/Uncertainty', value: week.future },
        { label: 'Family', value: week.family },
      ]
        .filter((item) => item.value > 0)
        .sort((a, b) => b.value - a.value)
        .slice(0, 3)
        .map((item) => `${item.label}: ${(item.value).toFixed(1)}`)
        .join('; ');

      return `• ${week.displayLabel}: ${categories || 'No category data recorded'}`;
    })
    .join('\n');

  const severityTotals = severityDistribution.reduce((sum, bucket) => sum + bucket.count, 0);
  const severityHighlights = severityDistribution
    .map((bucket) => {
      const percent = severityTotals > 0 ? Math.round((bucket.count / severityTotals) * 100) : 0;
      return `• ${bucket.range}: ${bucket.count} sessions (${percent}%)`;
    })
    .join('\n');

  const treatmentOutcomeHighlights = treatmentOutcomeSummary
    .map((outcome) => {
      const direction = outcome.improvement > 0 ? `Improvement +${outcome.improvement}%` : outcome.improvement < 0 ? `Increase ${Math.abs(outcome.improvement)}%` : 'No change';
      return `• ${outcome.period}: Avg anxiety ${outcome.averageAnxiety}/10 (${direction}, ${outcome.effectiveness.toUpperCase()})`;
    })
    .join('\n');

  const monthlyActivityHighlights = monthlyActivitySummary
    .map((month) => {
      return `• ${month.label}: ${month.conversationCount} conversations, ${month.sessionCount} analyses, avg anxiety ${month.averageAnxiety || 0}/10`;
    })
    .join('\n');

  const weeklyTrendText = weeklyTrendHighlights || '• Not enough weekly data to determine trend patterns yet.';
  const severityText = severityDistribution.length ? severityHighlights : '• No severity distribution data recorded yet.';
  const treatmentOutcomeText = treatmentOutcomeSummary.length ? treatmentOutcomeHighlights : '• Weekly outcomes will appear once more sessions are recorded.';
  const monthlyActivityText = monthlyActivitySummary.length ? monthlyActivityHighlights : '• Monthly activity data will populate after consistent usage.';

  const getGadSeverityLabel = (score?: number | null): string => {
    if (score === null || score === undefined || Number.isNaN(score)) return 'No data recorded';
    if (score >= 15) return 'Severe anxiety';
    if (score >= 10) return 'Moderate anxiety';
    if (score >= 5) return 'Mild anxiety';
    return 'Minimal anxiety';
  };

  const formatGadScore = (score: number | null | undefined, digits = 0): string => {
    if (score === null || score === undefined || Number.isNaN(score)) {
      return 'No data recorded';
    }
    const numeric = Number(score);
    const formatted = digits > 0 ? numeric.toFixed(digits) : Math.round(numeric).toString();
    return `${formatted}/21`;
  };

  const analysesByRecency = [...(analyses ?? [])].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
  const gadScores = analysesByRecency
    .map((analysis) => (typeof analysis.gad7Score === 'number' ? analysis.gad7Score : null))
    .filter((score): score is number => score !== null && !Number.isNaN(score));

  const latestGadScore = analysesByRecency.find((analysis) =>
    typeof analysis.gad7Score === 'number' && !Number.isNaN(analysis.gad7Score)
  )?.gad7Score ?? null;
  const averageGadScoreValue = gadScores.length
    ? gadScores.reduce((sum, score) => sum + score, 0) / gadScores.length
    : null;
  const highestGadScore = gadScores.length ? Math.max(...gadScores) : null;
  const gadInterpretation = getGadSeverityLabel(latestGadScore ?? averageGadScoreValue);
  
  let report = `${reportName}
${heading}
Generated on: ${today}

==================================================
EXECUTIVE SUMMARY
==================================================

This comprehensive report provides detailed insights into your mental health journey, 
conversation patterns, and therapeutic progress. The analysis combines behavioral data, 
anxiety assessments, and goal tracking to present a holistic view of your wellbeing.

REPORT HIGHLIGHTS:
• Total therapy sessions analyzed: ${totalAnalyses}
• Average anxiety level: ${(avgAnxiety !== null && avgAnxiety !== undefined && !isNaN(Number(avgAnxiety)) ? Number(avgAnxiety).toFixed(1) : '0.0')}/10
• High-intensity sessions (7+ anxiety): ${highAnxietySessions}
• Crisis risk interventions: ${crisisRiskSessions}
• Weekly intervention summaries: ${summaries.length}
• Active treatment goals: ${goals?.length || 0}

OVERALL ASSESSMENT: ${avgAnxiety < 4 ? 'EXCELLENT PROGRESS' : 
                     avgAnxiety < 6 ? 'GOOD STABILITY' : 
                     avgAnxiety < 8 ? 'MODERATE CONCERNS' : 'REQUIRES ATTENTION'}

==================================================
`;

  if (summaries.length === 0 && totalAnalyses === 0) {
    report += `

GETTING STARTED
===============

No intervention data available yet. Here's how to begin:

✓ Start regular conversations to generate weekly summaries
✓ Complete anxiety assessments for detailed analysis  
✓ Set therapeutic goals to track progress
✓ Engage with interventions consistently

Your mental health journey starts with consistent engagement.

==================================================
`;
    return report;
  }

  // Sort all summaries by week_start date (newest first)
  const sortedSummaries = [...summaries].sort((a, b) => 
    new Date(b.week_start).getTime() - new Date(a.week_start).getTime()
  );

  // Enhanced overview with clinical insights
  report += `

CLINICAL OVERVIEW & ANALYTICS
=============================

ENGAGEMENT METRICS:
• Total Weekly Summaries: ${summaries.length}
• Total Conversations: ${totalConversations}
• Analysis Period: ${sortedSummaries.length > 0 ? 
    `${sortedSummaries[sortedSummaries.length - 1].week_start} to ${sortedSummaries[0].week_end}` : 'N/A'}
• Session Consistency: ${totalAnalyses > 0 ? 'ACTIVE' : 'INACTIVE'}

ANXIETY PROFILE:
• Baseline Anxiety Level: ${(avgAnxiety !== null && avgAnxiety !== undefined && !isNaN(Number(avgAnxiety)) ? Number(avgAnxiety).toFixed(1) : '0.0')}/10
• High-Intensity Sessions: ${highAnxietySessions} (${totalAnalyses > 0 ? Math.round((highAnxietySessions/totalAnalyses)*100) : 0}%)
• Crisis Interventions: ${crisisRiskSessions}
• Escalation Events: ${escalationCount}

GAD-7 CLINICAL SCORES:
• Latest Score: ${formatGadScore(latestGadScore)}
• Average Score: ${formatGadScore(averageGadScoreValue, 1)}
• Highest Recorded Score: ${formatGadScore(highestGadScore)}
• Screening Interpretation: ${gadInterpretation}

THERAPEUTIC PROGRESS:
• Goals Set: ${goals?.length || 0}
• Goals Completed: ${goals?.filter(g => (g.completion_rate || 0) >= 90).length || 0}
• Average Goal Progress: ${goals && goals.length > 0 ? 
    Math.round(goals.reduce((sum, g) => sum + (g.completion_rate || 0), 0) / goals.length) : 0}%

TRACK OUTCOMES & TREATMENT SUMMARY
==================================

• Weekly Intervention Summaries: ${summaries.length}
• Average Conversations per Summary: ${(summaries.length ? (totalConversations / summaries.length).toFixed(1) : '0.0')}
• Dominant Intervention Types: ${topTherapyTypes.length ? topTherapyTypes.join(', ') : 'Not yet recorded'}
• Reporting Window: ${sortedSummaries.length ? `${sortedSummaries[sortedSummaries.length - 1].week_start} → ${sortedSummaries[0].week_end}` : 'N/A'}

ANALYTICS DASHBOARD INSIGHTS
============================

WEEKLY ANXIETY TYPE TRENDS:
${weeklyTrendText}

ANXIETY LEVEL DISTRIBUTION:
${severityText}

WEEKLY TREATMENT OUTCOMES:
${treatmentOutcomeText}

MONTHLY SESSION ACTIVITY:
${monthlyActivityText}

==================================================

DETAILED WEEKLY INTERVENTION ANALYSIS
=====================================

`;

  // Group by week and show all interventions for each week
  const weekGroups = sortedSummaries.reduce((acc, summary) => {
    const weekKey = `${summary.week_start}_${summary.week_end}`;
    if (!acc[weekKey]) {
      acc[weekKey] = [];
    }
    acc[weekKey].push(summary);
    return acc;
  }, {} as Record<string, InterventionSummary[]>);

  // Add each week section with enhanced clinical insights
  for (const [weekKey, weekSummaries] of Object.entries(weekGroups)) {
    const [weekStart, weekEnd] = weekKey.split('_');
    const weekNum = Object.keys(weekGroups).indexOf(weekKey) + 1;
    
    report += `
🗓️ WEEK ${weekNum}: ${weekStart} to ${weekEnd}
${'='.repeat(50)}

`;

    // Get analyses for this week to provide clinical insights
    if (analyses && analyses.length > 0) {
      const weekStartDate = new Date(weekStart);
      const weekEndDate = new Date(weekEnd);
      const weekAnalyses = analyses.filter(analysis => {
        const analysisDate = new Date(analysis.created_at);
        return analysisDate >= weekStartDate && analysisDate <= weekEndDate;
      });

      if (weekAnalyses.length > 0) {
        const triggerData = processTriggerData(weekAnalyses);
        const weekAvgAnxiety = weekAnalyses.reduce((sum, a) => sum + a.anxietyLevel, 0) / weekAnalyses.length;
        const weekHighAnxiety = weekAnalyses.filter(a => a.anxietyLevel >= 7).length;
        const weekEscalations = weekAnalyses.filter(a => a.escalationDetected).length;
        const weekCrisis = weekAnalyses.filter(a => a.crisisRiskLevel === 'high').length;
        
        // Determine week status
        const weekStatus = weekAvgAnxiety < 4 ? '🟢 STABLE' : 
                          weekAvgAnxiety < 6 ? '🟡 MODERATE' : 
                          weekAvgAnxiety < 8 ? '🟠 ELEVATED' : '🔴 HIGH CONCERN';
        
        report += `📊 WEEKLY CLINICAL SUMMARY
${'-'.repeat(40)}

WEEK STATUS: ${weekStatus}

KEY METRICS:
• Total Sessions: ${weekAnalyses.length}
• Average Anxiety: ${(weekAvgAnxiety !== null && weekAvgAnxiety !== undefined && !isNaN(Number(weekAvgAnxiety)) ? Number(weekAvgAnxiety).toFixed(1) : '0.0')}/10
• High-Intensity Sessions: ${weekHighAnxiety} (${Math.round((weekHighAnxiety/weekAnalyses.length)*100)}%)
• Escalation Events: ${weekEscalations}
• Crisis Risk Sessions: ${weekCrisis}

IMPROVEMENT INDICATORS:
• Session Frequency: ${weekAnalyses.length >= 3 ? '✅ Excellent' : weekAnalyses.length >= 2 ? '⚠️ Good' : '❌ Needs Improvement'}
• Anxiety Management: ${weekAvgAnxiety < 5 ? '✅ Excellent' : weekAvgAnxiety < 7 ? '⚠️ Fair' : '❌ Concerning'}
• Crisis Prevention: ${weekCrisis === 0 ? '✅ Effective' : '❌ Attention Needed'}

🎯 TRIGGER ANALYSIS FOR THIS WEEK:
${'-'.repeat(40)}

`;
        
        if (triggerData.length > 0) {
          triggerData.forEach((trigger, index) => {
            const severity = trigger.avgSeverity;
            const severityIcon = severity >= 8 ? '🔴' : severity >= 6 ? '🟠' : severity >= 4 ? '🟡' : '🟢';
            
            report += `${index + 1}. ${severityIcon} ${trigger.trigger.toUpperCase()}
   📈 Frequency: ${trigger.count} occurrences (${Math.round((trigger.count / weekAnalyses.length) * 100)}% of sessions)
   📊 Severity: ${(trigger?.avgSeverity !== null && trigger?.avgSeverity !== undefined && !isNaN(Number(trigger.avgSeverity)) ? Number(trigger.avgSeverity).toFixed(1) : '0.0')}/10 average
   📂 Category: ${trigger.category}

   🧠 CLINICAL INSIGHT:
   ${trigger.whyExplanation}

   🔗 Related Patterns: ${trigger.relatedTriggers?.slice(0, 3).join(', ') || 'None identified'}

   💡 RECOMMENDATIONS:
   ${trigger.avgSeverity >= 7 ? '• Immediate therapeutic intervention recommended\n   • Consider professional consultation\n   • Implement crisis management strategies' : 
     trigger.avgSeverity >= 5 ? '• Focus on coping skill development\n   • Regular monitoring recommended\n   • Practice anxiety reduction techniques' : 
     '• Continue current management approach\n   • Maintain awareness of trigger patterns\n   • Build resilience strategies'}

`;
          });
        } else {
          report += `No specific triggers identified for this week.
This may indicate good emotional regulation or limited session data.

`;
        }
      }
    } else {
      // Fallback to original summaries if no analyses available
      weekSummaries.forEach(summary => {
        const formattedType = summary.intervention_type.replace('_', ' ').toUpperCase();
        report += `📝 ${formattedType} (${summary.conversation_count} conversations)
${'-'.repeat(formattedType.length + 25)}

INTERVENTION HIGHLIGHTS:
`;
        
        const keyPoints = summary.key_points.slice(0, 8);
        keyPoints.forEach((point, pointIndex) => {
          report += `  ✓ ${point}
`;
        });
        report += `

`;
      });
    }
  }

  // Enhanced clinical trigger analysis
  if (analyses && analyses.length > 0) {
    const triggerData = processTriggerData(analyses);
    
    if (triggerData.length > 0) {
      report += `

==================================================
🔬 COMPREHENSIVE ANXIETY TRIGGER ANALYSIS
==================================================

This section provides in-depth analysis of your anxiety patterns, triggers, 
and therapeutic insights based on ${totalAnalyses} conversation sessions.

`;
      
      triggerData.forEach((trigger, index) => {
        const severity = trigger.avgSeverity;
        const frequency = trigger.count;
        const prevalence = Math.round((frequency / totalAnalyses) * 100);
        
        const severityLevel = severity >= 8 ? 'CRITICAL' : severity >= 6 ? 'HIGH' : severity >= 4 ? 'MODERATE' : 'LOW';
        const severityIcon = severity >= 8 ? '🔴' : severity >= 6 ? '🟠' : severity >= 4 ? '🟡' : '🟢';
        const frequencyIcon = prevalence >= 50 ? '🔥' : prevalence >= 25 ? '⚡' : '💧';
        
        report += `
${index + 1}. ${severityIcon} ${trigger.trigger.toUpperCase()}
${'='.repeat(60)}

📊 TRIGGER METRICS:
• Occurrence Rate: ${frequency} times (${prevalence}% of all sessions) ${frequencyIcon}
• Average Severity: ${(severity !== null && severity !== undefined && !isNaN(Number(severity)) ? Number(severity).toFixed(1) : '0.0')}/10 (${severityLevel})
• Category: ${trigger.category}
• Risk Level: ${severity >= 7 ? 'HIGH PRIORITY' : severity >= 5 ? 'MODERATE PRIORITY' : 'LOW PRIORITY'}

📝 DESCRIPTION:
${trigger.description}

🧠 CLINICAL EXPLANATION:
${trigger.whyExplanation}

🔗 ASSOCIATED TRIGGERS:
${trigger.relatedTriggers?.length ? trigger.relatedTriggers.join(', ') : 'None identified - this appears to be an isolated trigger pattern'}

💡 THERAPEUTIC RECOMMENDATIONS:
${severity >= 7 ? 
`• IMMEDIATE ACTION REQUIRED
• Consider increasing therapy session frequency
• Implement crisis intervention protocols
• Develop specific coping strategies for this trigger
• Monitor closely for escalation patterns
• Consider medication consultation if not already addressed` :
severity >= 5 ?
`• MODERATE INTERVENTION NEEDED
• Focus therapy sessions on this trigger pattern
• Develop targeted coping mechanisms
• Practice mindfulness and grounding techniques
• Regular check-ins recommended
• Build support system awareness` :
`• MAINTENANCE APPROACH
• Continue current management strategies
• Maintain awareness of trigger patterns
• Build preventive coping skills
• Regular self-monitoring recommended`}

📈 PROGRESS TRACKING:
${prevalence >= 50 ? 'This trigger appears frequently - establishing a management plan is crucial' :
  prevalence >= 25 ? 'Moderate frequency - good opportunity for targeted intervention' :
  'Lower frequency - maintain awareness and develop prevention strategies'}

`;
      });
    }
  }

  // Enhanced goals section
  if (goals && goals.length > 0) {
    report += `

==================================================
🎯 THERAPEUTIC GOAL PROGRESS & OUTCOMES
==================================================

Goal-setting and tracking are essential components of effective therapy. 
This section analyzes your progress across ${goals.length} therapeutic goals.

OVERALL GOAL PERFORMANCE:
• Total Goals: ${goals.length}
• Completed Goals: ${goals.filter(g => (g.completion_rate || 0) >= 90).length}
• In Progress: ${goals.filter(g => (g.completion_rate || 0) >= 50 && (g.completion_rate || 0) < 90).length}
• Needs Attention: ${goals.filter(g => (g.completion_rate || 0) < 50).length}
• Average Progress: ${Math.round(goals.reduce((sum, g) => sum + (g.completion_rate || 0), 0) / goals.length)}%

`;
    
    goals.forEach((goal, index) => {
      const completionRate = goal.completion_rate || 0;
      const averageScore = goal.average_score || 0;
      
      const status = completionRate >= 90 ? '🟢 EXCELLENT' : 
                   completionRate >= 70 ? '🟡 GOOD' :
                   completionRate >= 50 ? '🟠 FAIR' : '🔴 NEEDS ATTENTION';
      
      const progressIcon = completionRate >= 90 ? '🎉' : 
                          completionRate >= 70 ? '💪' :
                          completionRate >= 50 ? '📈' : '⚠️';
      
      report += `
${progressIcon} GOAL ${index + 1}: ${goal.title}
${'-'.repeat(50)}

📋 GOAL DETAILS:
• Category: ${goal.category}
• Target End Date: ${goal.end_date || 'Ongoing/Flexible'}
• Current Status: ${status}
• Description: ${goal.description || 'No detailed description provided'}

📊 PERFORMANCE METRICS:
• Completion Rate: ${Math.round(completionRate)}%
• Average Score: ${(averageScore !== null && averageScore !== undefined && !isNaN(Number(averageScore)) ? Number(averageScore).toFixed(1) : '0.0')}/10
• Progress Trend: ${completionRate >= 70 ? 'Excellent trajectory' : 
                  completionRate >= 50 ? 'Steady progress' : 
                  'Requires focused attention'}

💡 RECOMMENDATIONS:
${completionRate >= 90 ? 
`• Congratulations on excellent progress!
• Consider setting new, more challenging goals
• Use this success as motivation for other areas
• Share successful strategies with similar goals` :
completionRate >= 70 ?
`• Great progress - maintain current approach
• Identify specific barriers to further progress
• Increase accountability measures
• Consider breaking remaining tasks into smaller steps` :
completionRate >= 50 ?
`• Progress is being made but acceleration needed
• Review goal structure and timeline
• Identify specific obstacles preventing progress
• Consider additional support or resources
• Break goal into smaller, manageable milestones` :
`• Goal requires immediate attention and restructuring
• Consider if goal is realistic and appropriately scoped
• Identify specific barriers preventing progress
• May need professional guidance for this area
• Consider breaking into much smaller, achievable steps`}

`;
    });
  }

  // Intervention summaries (session/weekly/monthly/yearly)
  const sessionSummaries = aggregateAnalysesByPeriod(analyses ?? [], 'session', t, locale);
  const weeklySummaries = aggregateAnalysesByPeriod(analyses ?? [], 'week', t, locale);
  const monthlySummaries = aggregateAnalysesByPeriod(analyses ?? [], 'month', t, locale);
  const yearlySummaries = aggregateAnalysesByPeriod(analyses ?? [], 'year', t, locale);

  const formatPeriodSummaries = (label: string, summaries: PeriodSummary[]) => {
    if (!summaries.length) {
      return `${label}: No intervention summaries available.\n\n`;
    }

    return `${label}\n${'-'.repeat(label.length)}\n${summaries
      .map((summary) => {
        const triggersText = summary.triggers.length
          ? summary.triggers.map((t) => `${t.name} (${t.count})`).join(', ')
          : 'No specific triggers documented.';

        const therapiesText = summary.therapies.length
          ? summary.therapies
              .map((therapy) => `${therapy.name} ${therapy.count}× (adherence ${therapy.adherence})`)
              .join('; ')
          : 'No interventions documented.';

        const notes = summary.clinicalNotes.join(' • ');
        const codes = summary.codes.length ? `For clinicians: ${summary.codes.join(', ')}` : '';

        return `
${summary.label} — Avg anxiety ${summary.snapshot.average}/10 (range ${summary.snapshot.min}–${summary.snapshot.max})
What happened: ${summary.patientProblem}
Top triggers: ${triggersText}
Therapy used: ${therapiesText}
Progress: ${summary.progress}
Clinical notes: ${notes}
Next: ${summary.homework}
${codes}
`;
      })
      .join('\n')}\n`;
  };

  report += `

INTERVENTION SUMMARIES
======================

${formatPeriodSummaries('Per Session', sessionSummaries)}
${formatPeriodSummaries('Weekly', weeklySummaries)}
${formatPeriodSummaries('Monthly', monthlySummaries)}
${formatPeriodSummaries('Yearly', yearlySummaries)}
==================================================
`;

  // Enhanced conclusion and recommendations
  report += `

==================================================
📋 CLINICAL SUMMARY & RECOMMENDATIONS
==================================================

OVERALL MENTAL HEALTH STATUS:
${avgAnxiety < 4 ? 
`🟢 EXCELLENT: Your anxiety levels are well-managed with an average of ${(avgAnxiety !== null && avgAnxiety !== undefined && !isNaN(Number(avgAnxiety)) ? Number(avgAnxiety).toFixed(1) : '0.0')}/10. 
Continue current strategies and maintain regular check-ins.` :
avgAnxiety < 6 ?
`🟡 GOOD: Your anxiety levels show good management with an average of ${(avgAnxiety !== null && avgAnxiety !== undefined && !isNaN(Number(avgAnxiety)) ? Number(avgAnxiety).toFixed(1) : '0.0')}/10. 
Some areas may benefit from focused attention.` :
avgAnxiety < 8 ?
`🟠 MODERATE CONCERN: Your anxiety levels average ${(avgAnxiety !== null && avgAnxiety !== undefined && !isNaN(Number(avgAnxiety)) ? Number(avgAnxiety).toFixed(1) : '0.0')}/10, indicating need for 
increased therapeutic intervention and support.` :
`🔴 HIGH CONCERN: Your anxiety levels average ${(avgAnxiety !== null && avgAnxiety !== undefined && !isNaN(Number(avgAnxiety)) ? Number(avgAnxiety).toFixed(1) : '0.0')}/10, suggesting immediate 
professional attention and intensive support may be needed.`}

KEY INSIGHTS:
• Session Engagement: ${totalAnalyses >= 12 ? 'Excellent' : totalAnalyses >= 8 ? 'Good' : totalAnalyses >= 4 ? 'Fair' : 'Needs Improvement'}
• Crisis Management: ${crisisRiskSessions === 0 ? 'Effective' : 'Requires Attention'}
• Goal Achievement: ${goals && goals.length > 0 ? 
  Math.round(goals.reduce((sum, g) => sum + (g.completion_rate || 0), 0) / goals.length) >= 70 ? 'Strong' : 'Developing' : 'Not Set'}

PRIORITY RECOMMENDATIONS:
${crisisRiskSessions > 0 ? '🚨 IMMEDIATE: Address crisis risk factors with professional support\n' : ''}${escalationCount > totalAnalyses * 0.3 ? '⚠️ HIGH: Reduce escalation frequency through coping skill development\n' : ''}${avgAnxiety >= 7 ? '📈 IMPORTANT: Focus on anxiety reduction through targeted interventions\n' : ''}${goals && goals.filter(g => (g.completion_rate || 0) < 50).length > 0 ? '🎯 MODERATE: Restructure underperforming goals for better success\n' : ''}✅ ONGOING: Continue regular engagement and monitoring

NEXT STEPS:
1. ${avgAnxiety >= 6 ? 'Schedule professional consultation for anxiety management' : 'Maintain current therapeutic approach'}
2. ${totalAnalyses < 8 ? 'Increase session frequency for better data and support' : 'Continue regular session schedule'}
3. ${goals && goals.length < 3 ? 'Consider setting additional therapeutic goals' : 'Review and adjust current goals as needed'}
4. Focus on highest-severity triggers identified in this report
5. Implement recommended coping strategies for priority areas

==================================================

📄 REPORT INFORMATION
====================

Report Type: Comprehensive Mental Health Analysis
Generated: ${today}
Data Period: ${sortedSummaries.length > 0 ? 
  `${sortedSummaries[sortedSummaries.length - 1].week_start} to ${sortedSummaries[0].week_end}` : 'N/A'}
Total Sessions Analyzed: ${totalAnalyses}
Report Version: 2.0 (Enhanced Clinical Analysis)

This report was generated automatically based on your conversation patterns, 
anxiety assessments, and therapeutic interventions. For immediate concerns or 
crisis situations, please contact your mental health provider or emergency services.

For more detailed real-time analytics and interactive insights, 
visit the Analytics Dashboard in your application.

==================================================
`;

  return report;
};

interface DownloadOptions {
  fileName?: string;
  title?: string;
  language?: Language;
  t?: (key: string, fallback?: string) => string;
}

export const downloadSummaryReport = (
  summaries: InterventionSummary[],
  goals: GoalWithProgress[],
  analyses?: ClaudeAnxietyAnalysisWithDate[],
  options: DownloadOptions = {}
) => {
  const report = generateSummaryReport(summaries, goals, analyses, {
    title: options.title,
    language: options.language,
    t: options.t,
  });
  
  // Convert to HTML for better formatting (PDF-like)
  const htmlContent = convertToPDFFormat(report, options.language);
  
  const blob = new Blob([htmlContent], { type: 'text/html' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  const baseFileName = options.fileName ?? 'mental-health-medical-data';
  a.href = url;
  a.download = `${baseFileName}-${new Date().toISOString().split('T')[0]}.html`;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
};

const convertToPDFFormat = (textContent: string, language: Language = 'en'): string => {
  // Enhanced text processing for better HTML structure
  let htmlContent = textContent
    .replace(/\n/g, '<br>')
    .replace(/=+/g, '<div class="divider"></div>')
    .replace(/^([A-Z][A-Z\s]+)$/gm, '<h2 class="section-title">$1</h2>')
    .replace(/^(Week: .+)$/gm, '<h3 class="week-title">$1</h3>')
    .replace(/^([A-Z\s]+) \((\d+) conversations\)$/gm, '<h4 class="intervention-title">$1 <span class="conversation-count">($2 conversations)</span></h4>')
    .replace(/^CLINICAL SUMMARY FOR THIS WEEK$/gm, '<h4 class="clinical-summary-title">Clinical Summary for This Week</h4>')
    .replace(/^DETAILED TRIGGER ANALYSIS:$/gm, '<h4 class="trigger-analysis-title">Detailed Trigger Analysis</h4>')
    .replace(/^(\d+\. [A-Z\s]+)$/gm, '<h5 class="trigger-item-title">$1</h5>')
    .replace(/^\s+(\d+\. .+)$/gm, '<li class="key-point">$1</li>')
    .replace(/^•\s(.+)$/gm, '<div class="stat-item">• $1</div>')
    .replace(/^CLINICAL INSIGHT:$/gm, '<div class="insight-label">Clinical Insight:</div>')
    .replace(/^Related patterns:(.+)$/gm, '<div class="related-patterns">Related patterns:$1</div>');

  // Group list items into proper ul tags
  htmlContent = htmlContent.replace(/(<li class="key-point">.*?<\/li>)+/gs, '<ul class="key-points-list">$&</ul>');

  return `
    <!DOCTYPE html>
    <html lang="${language}">
    <head>
      <title>Mental Health Medical Data</title>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body { 
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          margin: 0;
          padding: 40px;
          line-height: 1.7;
          color: #1f2937;
          background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
          min-height: 100vh;
        }
        
        .container {
          max-width: 900px;
          margin: 0 auto;
          background: white;
          border-radius: 16px;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
          overflow: hidden;
        }
        
        .header {
          background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
          color: white;
          padding: 40px;
          text-align: center;
          position: relative;
          overflow: hidden;
        }
        
        .header::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grain" width="100" height="100" patternUnits="userSpaceOnUse"><circle cx="25" cy="25" r="1" fill="white" opacity="0.1"/><circle cx="75" cy="75" r="1" fill="white" opacity="0.1"/><circle cx="50" cy="10" r="0.5" fill="white" opacity="0.1"/><circle cx="10" cy="60" r="0.5" fill="white" opacity="0.1"/></pattern></defs><rect width="100" height="100" fill="url(%23grain)"/></svg>') repeat;
          pointer-events: none;
        }
        
        .header h1 {
          font-size: 2.5rem;
          font-weight: 700;
          margin-bottom: 12px;
          position: relative;
          z-index: 1;
        }
        
        .header p {
          font-size: 1.1rem;
          opacity: 0.9;
          position: relative;
          z-index: 1;
        }
        
        .content {
          padding: 40px;
        }
        
        .section-title {
          color: #1e40af;
          font-size: 1.8rem;
          font-weight: 700;
          margin: 40px 0 24px;
          padding: 16px 0;
          border-bottom: 3px solid #3b82f6;
          background: linear-gradient(90deg, #eff6ff 0%, transparent 100%);
          padding-left: 20px;
          margin-left: -20px;
          padding-right: 20px;
          margin-right: -20px;
          border-radius: 8px 0 0 8px;
        }
        
        .week-title {
          color: #1f2937;
          font-size: 1.4rem;
          font-weight: 600;
          margin: 32px 0 20px;
          padding: 16px 20px;
          background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
          border-radius: 12px;
          border-left: 4px solid #0ea5e9;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }
        
        .clinical-summary-title {
          color: #059669;
          font-size: 1.2rem;
          font-weight: 600;
          margin: 24px 0 16px;
          padding: 12px 16px;
          background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
          border-radius: 8px;
          border-left: 4px solid #10b981;
        }
        
        .trigger-analysis-title {
          color: #dc2626;
          font-size: 1.2rem;
          font-weight: 600;
          margin: 24px 0 16px;
          padding: 12px 16px;
          background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
          border-radius: 8px;
          border-left: 4px solid #ef4444;
        }
        
        .trigger-item-title {
          color: #7c2d12;
          font-size: 1.1rem;
          font-weight: 600;
          margin: 20px 0 12px;
          padding: 10px 14px;
          background: linear-gradient(135deg, #fef7ed 0%, #fed7aa 100%);
          border-radius: 6px;
          border-left: 3px solid #ea580c;
        }
        
        .intervention-title {
          color: #374151;
          font-size: 1.3rem;
          font-weight: 600;
          margin: 24px 0 16px;
          padding: 14px 18px;
          background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%);
          border-radius: 10px;
          border: 1px solid #e5e7eb;
        }
        
        .conversation-count {
          color: #6b7280;
          font-size: 0.9rem;
          font-weight: 400;
        }
        
        .stat-item {
          margin: 8px 0;
          padding: 8px 16px;
          background: #f8fafc;
          border-radius: 6px;
          border-left: 3px solid #3b82f6;
          font-weight: 500;
        }
        
        .key-points-list {
          margin: 16px 0;
          padding: 0;
          background: #fafafa;
          border-radius: 8px;
          padding: 16px 20px;
        }
        
        .key-point {
          margin: 10px 0;
          padding: 8px 0;
          border-bottom: 1px solid #e5e7eb;
          font-weight: 500;
          color: #374151;
        }
        
        .key-point:last-child {
          border-bottom: none;
        }
        
        .insight-label {
          color: #7c3aed;
          font-weight: 600;
          margin: 16px 0 8px;
          padding: 8px 12px;
          background: linear-gradient(135deg, #faf5ff 0%, #e9d5ff 100%);
          border-radius: 6px;
          border-left: 3px solid #8b5cf6;
        }
        
        .related-patterns {
          color: #6b7280;
          font-style: italic;
          margin: 12px 0;
          padding: 10px 14px;
          background: #f8fafc;
          border-radius: 6px;
          border: 1px dashed #d1d5db;
        }
        
        .divider {
          height: 2px;
          background: linear-gradient(90deg, transparent 0%, #e5e7eb 50%, transparent 100%);
          margin: 32px 0;
          border-radius: 1px;
        }
        
        .overview {
          background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
          padding: 20px;
          border-radius: 12px;
          margin: 24px 0;
          border-left: 4px solid #f59e0b;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }
        
        /* Print styles */
        @media print {
          body {
            background: white;
            padding: 20px;
          }
          
          .container {
            box-shadow: none;
            border: 1px solid #e5e7eb;
          }
          
          .header {
            background: #3b82f6 !important;
            -webkit-print-color-adjust: exact;
            color-adjust: exact;
          }
        }
        
        /* Responsive design */
        @media (max-width: 768px) {
          body {
            padding: 20px;
          }
          
          .header h1 {
            font-size: 2rem;
          }
          
          .content {
            padding: 24px;
          }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🧠 ${language === 'es' ? 'Datos médicos de salud mental' : 'Mental Health Medical Data'}</h1>
          <p>${language === 'es' ? 'Informe de analíticas e historial de intervenciones' : 'Analytics & Intervention History Report'} • ${language === 'es' ? 'Generado el' : 'Generated on'} ${new Date().toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}</p>
        </div>
        <div class="content">
          ${htmlContent}
        </div>
      </div>
    </body>
    </html>
  `;
};

const generateSummaryReportEs = (
  summaries: InterventionSummary[],
  goals: GoalWithProgress[],
  analyses: ClaudeAnxietyAnalysisWithDate[],
  t: (key: string, fallback?: string) => string,
  locale: string,
  titleOverride?: string
): string => {
  const today = new Date().toLocaleDateString(locale);
  const heading = titleOverride ?? 'Informe de analíticas e historial de intervenciones';

  const totalAnalyses = analyses.length;
  const totalConversations = summaries.reduce((sum, s) => sum + (Number(s.conversation_count) || 0), 0);
  const avgAnxiety =
    totalAnalyses > 0 ? analyses.reduce((sum, a) => sum + (a.anxietyLevel ?? 0), 0) / totalAnalyses : 0;

  const sessionSummaries = aggregateAnalysesByPeriod(analyses, 'session', t, locale);
  const weeklySummaries = aggregateAnalysesByPeriod(analyses, 'week', t, locale);
  const monthlySummaries = aggregateAnalysesByPeriod(analyses, 'month', t, locale);
  const yearlySummaries = aggregateAnalysesByPeriod(analyses, 'year', t, locale);

  const formatPeriodSummariesEs = (label: string, periodSummaries: PeriodSummary[]) => {
    if (!periodSummaries.length) {
      return `${label}: No hay resúmenes disponibles.\n\n`;
    }

    return `${label}\n${'-'.repeat(label.length)}\n${periodSummaries
      .map((summary) => {
        const triggersText = summary.triggers.length
          ? summary.triggers.map((tr) => `${tr.name} (${tr.count})`).join(', ')
          : t('interventions.noTriggers', 'No se documentaron detonantes específicos.');

        const therapiesText = summary.therapies.length
          ? summary.therapies
              .map((therapy) => {
                const name = translateInterventionLabel(therapy.name, t);
                const adherence =
                  therapy.adherence === 'Partial'
                    ? t('interventions.adherence.partial', 'Parcial')
                    : therapy.adherence;
                return `${name} ${therapy.count}× (${t('interventions.adherence', 'adherencia')} ${adherence})`;
              })
              .join('; ')
          : t('interventions.noTherapies', 'No se documentaron intervenciones en este periodo.');

        const notes = summary.clinicalNotes.join(' • ');
        const codes = summary.codes.length ? `${t('interventions.forClinicians', 'Para clínicos')}: ${summary.codes.join(', ')}` : '';

        return `
${summary.label} — ${t('interventions.avgAnxiety', 'Ansiedad prom.')} ${summary.snapshot.average}/10 (rango ${summary.snapshot.min}–${summary.snapshot.max})
Qué pasó: ${summary.patientProblem}
Detonantes principales: ${triggersText}
Intervenciones/terapia: ${therapiesText}
Progreso: ${summary.progress}
Notas clínicas: ${notes}
Siguiente: ${summary.homework}
${codes}
`;
      })
      .join('\n')}\n`;
  };

  let report = `Datos médicos de salud mental
${heading}
Generado el: ${today}

==================================================
RESUMEN
==================================================

• Sesiones analizadas: ${totalAnalyses}
• Conversaciones (resúmenes semanales): ${summaries.length}
• Total de conversaciones registradas: ${totalConversations}
• Ansiedad promedio: ${avgAnxiety.toFixed(1)}/10

==================================================
RESÚMENES DE INTERVENCIONES
==================================================

${formatPeriodSummariesEs('Por sesión', sessionSummaries)}
${formatPeriodSummariesEs('Semanal', weeklySummaries)}
${formatPeriodSummariesEs('Mensual', monthlySummaries)}
${formatPeriodSummariesEs('Anual', yearlySummaries)}
==================================================
`;

  if (goals && goals.length > 0) {
    report += `

==================================================
METAS TERAPÉUTICAS
==================================================

• Metas: ${goals.length}
• Completadas (≥90%): ${goals.filter((g) => (g.completion_rate || 0) >= 90).length}
• En progreso: ${goals.filter((g) => (g.completion_rate || 0) >= 50 && (g.completion_rate || 0) < 90).length}
• Requieren atención: ${goals.filter((g) => (g.completion_rate || 0) < 50).length}
`;
  }

  return report;
};
