import React, { useMemo, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, TrendingUp } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { ensureTriggersArray } from '@/utils/analyticsDataProcessor';
import { useLanguage } from '@/context/LanguageContext';
import { translateInterventionLabel } from '@/utils/anxiety/interventions';

interface Analysis {
  created_at: string;
  anxietyLevel: number;
  triggers: string[] | string | null | undefined;
  recommendedInterventions?: string[] | string | null;
  copingStrategies?: string[] | string | null;
  personalizedResponse?: string;
  dsm5Indicators?: string[] | string | null;
}

type Period = 'session' | 'week' | 'month' | 'year';

interface Props {
  summaries?: any[];
  analyses?: Analysis[];
}

type TriggerStat = { name: string; count: number };
type TherapyStat = { name: string; count: number; adherence: '✔' | 'Partial' | '✖' };

const normalizeTriggerToken = (raw: string): string => {
  const trimmed = String(raw ?? '').trim();
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    return trimmed.slice(1, -1).trim();
  }
  return trimmed;
};

const renderTriggerLabel = (
  raw: string,
  t: (key: string, fallback?: string) => string
): string => {
  const token = normalizeTriggerToken(raw);
  if (token.startsWith('trigger.')) {
    return t(token, token);
  }
  return token;
};

interface SummaryContent {
  id: string;
  scale: Period;
  rangeLabel: string;
  snapshot: {
    sessions: number;
    average: number;
    min: number;
    max: number;
    trendLabel: string;
  };
  patientProblem: string;
  triggers: TriggerStat[];
  therapies: TherapyStat[];
  progress: string;
  clinicalNotes: string[];
  codes: string[];
  homework: string;
}

const formatDate = (date: Date, locale: string) =>
  new Intl.DateTimeFormat(locale, {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
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
      return `${date.toISOString()}`;
    case 'week': {
      const firstDay = new Date(date);
      const day = firstDay.getDay();
      const diff = firstDay.getDate() - day + (day === 0 ? -6 : 1); // ISO week start Monday
      firstDay.setDate(diff);
      firstDay.setHours(0, 0, 0, 0);
      return `${firstDay.toISOString().slice(0, 10)}`;
    }
    case 'month':
      return `${year}-${String(month + 1).padStart(2, '0')}`;
    case 'year':
      return `${year}`;
    default:
      return `${date.toISOString()}`;
  }
};

const sortDesc = <T,>(arr: T[], getter: (item: T) => number) =>
  [...arr].sort((a, b) => getter(b) - getter(a));

const buildSummaries = (
  analyses: Analysis[],
  period: Period,
  t: (key: string, fallback?: string) => string,
  locale: string
): SummaryContent[] => {
  if (!Array.isArray(analyses) || analyses.length === 0) return [];

  const byPeriod = new Map<string, Analysis[]>();

  analyses.forEach((analysis) => {
    const createdDate = new Date(analysis.created_at);
    const key = getPeriodKey(createdDate, period);
    if (!byPeriod.has(key)) {
      byPeriod.set(key, []);
    }
    byPeriod.get(key)?.push(analysis);
  });

  const keys = Array.from(byPeriod.keys());
  const sortedKeys = sortDesc(keys, (key) => new Date(key).getTime());

  return sortedKeys.map((key, index) => {
    const group = byPeriod.get(key) ?? [];
    const sessions = group.length;
    const ordered = group.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    const startDate = new Date(ordered[0].created_at);
    const endDate = new Date(ordered[ordered.length - 1].created_at);

    const anxietyValues = ordered.map((a) => a.anxietyLevel ?? 0);
    const average = Number((anxietyValues.reduce((sum, lvl) => sum + lvl, 0) / Math.max(1, anxietyValues.length)).toFixed(1));
    const min = Math.min(...anxietyValues);
    const max = Math.max(...anxietyValues);

    const previousKey = sortedKeys[index + 1];
    let trendLabel = t('interventions.noData', 'No prior period');
    if (previousKey) {
      const previousGroup = byPeriod.get(previousKey) ?? [];
      if (previousGroup.length > 0) {
        const previousAverage = previousGroup.reduce((sum, a) => sum + (a.anxietyLevel ?? 0), 0) / previousGroup.length;
        const delta = Number((average - previousAverage).toFixed(1));
        if (delta > 0) {
          trendLabel = t('interventions.trend.upVsPrior', '↑ {delta} vs prior').replace('{delta}', `+${delta}`);
        } else if (delta < 0) {
          trendLabel = t('interventions.trend.downVsPrior', '↓ {delta} vs prior').replace('{delta}', `${delta}`);
        } else {
          trendLabel = t('interventions.progressStable', 'No change vs prior');
        }
      }
    }

    const triggerCounts = new Map<string, number>();
    ordered.forEach((analysis) => {
      const normalizedTriggers = ensureTriggersArray(analysis.triggers);
      normalizedTriggers.forEach((trigger) => {
        if (!trigger) return;
        const normalized = normalizeTriggerToken(trigger);
        if (!normalized) return;
        triggerCounts.set(normalized, (triggerCounts.get(normalized) ?? 0) + 1);
      });
    });
    const triggers: TriggerStat[] = Array.from(triggerCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([name, count]) => ({ name, count }));

    const therapyCounts = new Map<string, number>();
    ordered.forEach((analysis) => {
      const interventionsRaw = analysis.recommendedInterventions ?? analysis.copingStrategies ?? [];
      const interventions = Array.isArray(interventionsRaw)
        ? interventionsRaw
        : ensureTriggersArray(interventionsRaw);
      interventions.forEach((item) => {
        if (!item) return;
        const normalized = item.trim();
        if (!normalized) return;
        therapyCounts.set(normalized, (therapyCounts.get(normalized) ?? 0) + 1);
      });
    });
    const therapies: TherapyStat[] = Array.from(therapyCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([name, count]) => ({
        name,
        count,
        adherence: count >= sessions ? '✔' : count >= Math.ceil(sessions / 2) ? 'Partial' : '✖'
      }));

    const topTrigger = triggers[0]?.name;
    const topTriggerLabel = topTrigger ? renderTriggerLabel(topTrigger, t) : undefined;
    const avgSeverity = average.toFixed(1);

    const patientProblem = topTriggerLabel
      ? t(
          'interventions.patientProblem.withTrigger',
          'Patient experienced heightened anxiety around {trigger}. Severity averaged {avg}/10.'
        )
          .replace('{trigger}', topTriggerLabel)
          .replace('{avg}', avgSeverity)
      : t(
          'interventions.patientProblem.noTrigger',
          'Patient reported anxiety averaging {avg}/10 without clear trigger.'
        ).replace('{avg}', avgSeverity);

    const progressDirection = trendLabel.startsWith('↓')
      ? t('interventions.progressImproving', 'Improving')
      : trendLabel.startsWith('↑')
        ? t('interventions.progressNeedsSupport', 'Needs support')
        : t('interventions.progressStable', 'Stable');
    const progress = t(
      'interventions.progressSummary',
      '{direction}: Immediate response {trend}.'
    )
      .replace('{direction}', progressDirection)
      .replace('{trend}', trendLabel);

    const clinicalNotes = ordered
      .map((analysis) => analysis.personalizedResponse?.trim())
      .filter((note): note is string => Boolean(note))
      .slice(0, 3);

    const codes = Array.from(
      new Set(
        ordered
          .flatMap((analysis) => ensureTriggersArray(analysis.dsm5Indicators))
          .filter((code): code is string => Boolean(code))
      )
    );

    const homeworkFromTherapyRaw = therapies[0]?.name || t('interventions.homeworkFallback');
    const homeworkFromTherapy = translateInterventionLabel(homeworkFromTherapyRaw, t);
    const homework = t(
      'interventions.homeworkTemplate',
      'Focus task: {task}. Reinforce practice 3×/day or as assigned.'
    ).replace('{task}', homeworkFromTherapy);

    return {
      id: `${period}-${key}`,
      scale: period,
      rangeLabel: formatRange(startDate, locale, period === 'session' ? undefined : endDate),
      snapshot: {
        sessions,
        average,
        min,
        max,
        trendLabel,
      },
      patientProblem,
      triggers,
      therapies,
      progress,
      clinicalNotes: clinicalNotes.length > 0 ? clinicalNotes : [t('interventions.noNotes')],
      codes,
      homework,
    } satisfies SummaryContent;
  });
};

const InterventionSummariesSection: React.FC<Props> = ({ analyses = [] }) => {
  const { t, language } = useLanguage();
  const locale = language === 'es' ? 'es-ES' : 'en-US';
  const sortedAnalyses = useMemo(
    () =>
      Array.isArray(analyses)
        ? [...analyses].sort(
            (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          )
        : [],
    [analyses]
  );

  const [view, setView] = useState<'overview' | 'session' | 'week' | 'month' | 'year'>('overview');

  const sessionSummaries = useMemo(
    () => buildSummaries(sortedAnalyses, 'session', t, locale).slice(0, 5),
    [sortedAnalyses, t, locale]
  );
  const weeklySummaries = useMemo(
    () => buildSummaries(sortedAnalyses, 'week', t, locale).slice(0, 4),
    [sortedAnalyses, t, locale]
  );
  const monthlySummaries = useMemo(
    () => buildSummaries(sortedAnalyses, 'month', t, locale).slice(0, 4),
    [sortedAnalyses, t, locale]
  );
  const yearlySummaries = useMemo(
    () => buildSummaries(sortedAnalyses, 'year', t, locale).slice(0, 3),
    [sortedAnalyses, t, locale]
  );

  const renderSummary = (summary: SummaryContent) => (
    <div key={summary.id} className="border rounded-lg p-4 bg-white space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="font-semibold text-gray-900">{summary.rangeLabel}</div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Badge variant="outline">
            {summary.snapshot.sessions} {t('interventions.sessions')}
          </Badge>
          <Badge className="bg-blue-50 text-blue-700 flex items-center gap-1">
            <TrendingUp className="w-4 h-4" /> {summary.snapshot.trendLabel}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700">
        <div>
          <p className="font-medium text-gray-900">{t('interventions.snapshot')}</p>
          <p>{summary.patientProblem}</p>
          <p className="mt-1 text-gray-600">
            {t('interventions.avgAnxietyRange', '{label} {avg}/10 (range {min}–{max}).')
              .replace('{label}', t('interventions.avgAnxiety'))
              .replace('{avg}', String(summary.snapshot.average))
              .replace('{min}', String(summary.snapshot.min))
              .replace('{max}', String(summary.snapshot.max))}
          </p>
        </div>
        <div>
          <p className="font-medium text-gray-900">{t('interventions.progressObserved')}</p>
          <p>{summary.progress}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700">
        <div>
          <p className="font-medium text-gray-900">{t('interventions.topTriggers')}</p>
          {summary.triggers.length > 0 ? (
            <ul className="list-disc ml-6">
              {summary.triggers.map((trigger) => (
                <li key={trigger.name}>
                  {renderTriggerLabel(trigger.name, t)} ({trigger.count})
                </li>
              ))}
            </ul>
          ) : (
            <p>{t('interventions.noTriggers')}</p>
          )}
        </div>
        <div>
          <p className="font-medium text-gray-900">{t('interventions.therapyApplied')}</p>
          {summary.therapies.length > 0 ? (
            <ul className="list-disc ml-6">
              {summary.therapies.map((therapy) => (
                <li key={therapy.name}>
                  {translateInterventionLabel(therapy.name, t)} ({therapy.count}×) — {t('interventions.adherence')}{' '}
                  {therapy.adherence === 'Partial'
                    ? t('interventions.adherence.partial', 'Partial')
                    : therapy.adherence}
                </li>
              ))}
            </ul>
          ) : (
            <p>{t('interventions.noTherapies')}</p>
          )}
        </div>
      </div>

      <div>
        <p className="font-medium text-gray-900">{t('interventions.clinicalNotes')}</p>
        <ul className="list-disc ml-6 text-sm text-gray-700">
          {summary.clinicalNotes.map((note, idx) => (
            <li key={idx}>{note}</li>
          ))}
        </ul>
      </div>

      <div className="text-sm text-gray-700">
        <p className="font-medium text-gray-900">{t('interventions.homework')}</p>
        <p>{summary.homework}</p>
      </div>

      {summary.codes.length > 0 && (
        <Accordion type="single" collapsible className="border rounded-md">
          <AccordionItem value="codes">
            <AccordionTrigger className="px-4 text-sm">{t('interventions.forClinicians')}</AccordionTrigger>
            <AccordionContent className="px-4 pb-4 text-sm text-gray-700">
              {summary.codes.join(', ')}
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      )}
    </div>
  );

  const renderSection = (label: string, summaries: SummaryContent[], emptyMessage: string) => (
    <div className="space-y-4">
      <h4 className="text-lg font-semibold text-gray-900">{label}</h4>
      {summaries.length === 0 ? (
        <div className="text-sm text-gray-600">{emptyMessage}</div>
      ) : (
        <div className="space-y-4">{summaries.map(renderSummary)}</div>
      )}
    </div>
  );

  return (
    <Card>
      <CardHeader className="flex items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-blue-600" />
          {t('interventions.title')}
        </CardTitle>
        <Badge variant="secondary">{t('interventions.badge')}</Badge>
      </CardHeader>
      <CardContent className="space-y-8">
        <div className="flex flex-wrap gap-2">
          {[
            { label: t('interventions.tabs.overview'), value: 'overview' },
            { label: t('interventions.tabs.session'), value: 'session' },
            { label: t('interventions.tabs.week'), value: 'week' },
            { label: t('interventions.tabs.month'), value: 'month' },
            { label: t('interventions.tabs.year'), value: 'year' },
          ].map(({ label, value }) => (
            <Button
              key={value}
              variant={view === value ? 'default' : 'outline'}
              size="sm"
              onClick={() => setView(value as typeof view)}
            >
              {label}
            </Button>
          ))}
        </div>

        {view === 'overview' && (
          <>
            {renderSection(
              t('interventions.recent'),
              sessionSummaries,
              t('interventions.noRecent')
            )}
            {renderSection(
              t('interventions.weeklyOverview'),
              weeklySummaries,
              t('interventions.noWeekly')
            )}
            {renderSection(
              t('interventions.monthlyOverview'),
              monthlySummaries,
              t('interventions.noMonthly')
            )}
            {renderSection(
              t('interventions.yearlyOverview'),
              yearlySummaries,
              t('interventions.noYearly')
            )}
          </>
        )}

        {view === 'session' && renderSection(t('interventions.tabs.session'), sessionSummaries, t('interventions.noRecent'))}
        {view === 'week' && renderSection(t('interventions.weeklyOverview'), weeklySummaries, t('interventions.noWeekly'))}
        {view === 'month' && renderSection(t('interventions.monthlyOverview'), monthlySummaries, t('interventions.noMonthly'))}
        {view === 'year' && renderSection(t('interventions.yearlyOverview'), yearlySummaries, t('interventions.noYearly'))}
      </CardContent>
    </Card>
  );
};

export default InterventionSummariesSection;
