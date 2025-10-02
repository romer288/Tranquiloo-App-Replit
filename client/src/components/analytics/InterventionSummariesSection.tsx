import React, { useMemo, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, TrendingUp } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { ensureTriggersArray } from '@/utils/analyticsDataProcessor';

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

const formatDate = (date: Date) =>
  new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(date);

const formatRange = (start: Date, end?: Date) => {
  if (!end || start.toDateString() === end.toDateString()) {
    return formatDate(start);
  }
  return `${formatDate(start)} — ${formatDate(end)}`;
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

const buildSummaries = (analyses: Analysis[], period: Period): SummaryContent[] => {
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
    let trendLabel = 'No prior period';
    if (previousKey) {
      const previousGroup = byPeriod.get(previousKey) ?? [];
      if (previousGroup.length > 0) {
        const previousAverage = previousGroup.reduce((sum, a) => sum + (a.anxietyLevel ?? 0), 0) / previousGroup.length;
        const delta = Number((average - previousAverage).toFixed(1));
        if (delta > 0) {
          trendLabel = `↑ +${delta} vs prior`;
        } else if (delta < 0) {
          trendLabel = `↓ ${delta} vs prior`;
        } else {
          trendLabel = 'No change vs prior';
        }
      }
    }

    const triggerCounts = new Map<string, number>();
    ordered.forEach((analysis) => {
      const normalizedTriggers = ensureTriggersArray(analysis.triggers);
      normalizedTriggers.forEach((trigger) => {
        if (!trigger) return;
        const normalized = trigger.trim();
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
    const avgSeverity = average.toFixed(1);

    const patientProblem = topTrigger
      ? `Patient experienced heightened anxiety around ${topTrigger}. Severity averaged ${avgSeverity}/10.`
      : `Patient reported anxiety averaging ${avgSeverity}/10 without clear trigger.`;

    const progressDirection = trendLabel.startsWith('↓') ? 'Improving' : trendLabel.startsWith('↑') ? 'Needs support' : 'Stable';
    const progress = `${progressDirection}: Immediate response ${trendLabel.toLowerCase()}.`;

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

    const homeworkFromTherapy = therapies[0]?.name || 'Continue agreed coping plan';
    const homework = `Focus task: ${homeworkFromTherapy}. Reinforce practice 3×/day or as assigned.`;

    return {
      id: `${period}-${key}`,
      scale: period,
      rangeLabel: formatRange(startDate, period === 'session' ? undefined : endDate),
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
      clinicalNotes: clinicalNotes.length > 0 ? clinicalNotes : ['No clinician notes documented this period.'],
      codes,
      homework,
    } satisfies SummaryContent;
  });
};

const InterventionSummariesSection: React.FC<Props> = ({ analyses = [] }) => {
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

  const sessionSummaries = useMemo(() => buildSummaries(sortedAnalyses, 'session').slice(0, 5), [sortedAnalyses]);
  const weeklySummaries = useMemo(() => buildSummaries(sortedAnalyses, 'week').slice(0, 4), [sortedAnalyses]);
  const monthlySummaries = useMemo(() => buildSummaries(sortedAnalyses, 'month').slice(0, 4), [sortedAnalyses]);
  const yearlySummaries = useMemo(() => buildSummaries(sortedAnalyses, 'year').slice(0, 3), [sortedAnalyses]);

  const renderSummary = (summary: SummaryContent) => (
    <div key={summary.id} className="border rounded-lg p-4 bg-white space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="font-semibold text-gray-900">{summary.rangeLabel}</div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Badge variant="outline">{summary.snapshot.sessions} sessions</Badge>
          <Badge className="bg-blue-50 text-blue-700 flex items-center gap-1">
            <TrendingUp className="w-4 h-4" /> {summary.snapshot.trendLabel}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700">
        <div>
          <p className="font-medium text-gray-900">Patient snapshot</p>
          <p>{summary.patientProblem}</p>
          <p className="mt-1 text-gray-600">
            Avg anxiety {summary.snapshot.average}/10 (range {summary.snapshot.min}–{summary.snapshot.max}).
          </p>
        </div>
        <div>
          <p className="font-medium text-gray-900">Progress observed</p>
          <p>{summary.progress}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700">
        <div>
          <p className="font-medium text-gray-900">Top triggers</p>
          {summary.triggers.length > 0 ? (
            <ul className="list-disc ml-6">
              {summary.triggers.map((trigger) => (
                <li key={trigger.name}>
                  {trigger.name} ({trigger.count})
                </li>
              ))}
            </ul>
          ) : (
            <p>No specific triggers documented.</p>
          )}
        </div>
        <div>
          <p className="font-medium text-gray-900">Therapy applied</p>
          {summary.therapies.length > 0 ? (
            <ul className="list-disc ml-6">
              {summary.therapies.map((therapy) => (
                <li key={therapy.name}>
                  {therapy.name} ({therapy.count}×) — adherence {therapy.adherence}
                </li>
              ))}
            </ul>
          ) : (
            <p>No interventions documented this period.</p>
          )}
        </div>
      </div>

      <div>
        <p className="font-medium text-gray-900">Clinical notes</p>
        <ul className="list-disc ml-6 text-sm text-gray-700">
          {summary.clinicalNotes.map((note, idx) => (
            <li key={idx}>{note}</li>
          ))}
        </ul>
      </div>

      <div className="text-sm text-gray-700">
        <p className="font-medium text-gray-900">Next steps / homework</p>
        <p>{summary.homework}</p>
      </div>

      {summary.codes.length > 0 && (
        <Accordion type="single" collapsible className="border rounded-md">
          <AccordionItem value="codes">
            <AccordionTrigger className="px-4 text-sm">For clinicians</AccordionTrigger>
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
          Intervention Summaries
        </CardTitle>
        <Badge variant="secondary">Updated from session data</Badge>
      </CardHeader>
      <CardContent className="space-y-8">
        <div className="flex flex-wrap gap-2">
          {[
            { label: 'Overview', value: 'overview' },
            { label: 'Session', value: 'session' },
            { label: 'Weekly', value: 'week' },
            { label: 'Monthly', value: 'month' },
            { label: 'Yearly', value: 'year' },
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
              'Recent Sessions',
              sessionSummaries,
              'No recent session summaries available.'
            )}
            {renderSection(
              'Weekly Overview',
              weeklySummaries,
              'No weekly summaries available yet.'
            )}
            {renderSection(
              'Monthly Overview',
              monthlySummaries,
              'No monthly summaries available yet.'
            )}
            {renderSection(
              'Yearly Overview',
              yearlySummaries,
              'No yearly summaries available yet.'
            )}
          </>
        )}

        {view === 'session' && renderSection('Individual Sessions', sessionSummaries, 'No recent session summaries available.')}
        {view === 'week' && renderSection('Weekly Overview', weeklySummaries, 'No weekly summaries available yet.')}
        {view === 'month' && renderSection('Monthly Overview', monthlySummaries, 'No monthly summaries available yet.')}
        {view === 'year' && renderSection('Yearly Overview', yearlySummaries, 'No yearly summaries available yet.')}
      </CardContent>
    </Card>
  );
};

export default InterventionSummariesSection;
