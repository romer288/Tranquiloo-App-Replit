import React, { useState, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "@/routes";
import {
  Search,
  Users,
  TrendingUp,
  FileText,
  MessageCircle,
  Clipboard,
  Bell,
  Target,
  ClipboardList,
  Edit3,
  BookOpen,
  Calendar,
} from "lucide-react";

// Import therapist components
import PatientDirectory from "@/components/therapist/PatientDirectory";
import TherapistChatInterface from "@/components/therapist/TherapistChatInterface";
import TreatmentCreation from "@/components/therapist/TreatmentCreation";
import TherapistNotifications from "@/components/therapist/TherapistNotifications";
import AppointmentsCalendar from "@/components/therapist/AppointmentsCalendar";
import CallInitiator from "@/components/video-call/CallInitiator";
import VideoCallInterface from "@/components/video-call/VideoCallInterface";
import IncomingCallNotification from "@/components/video-call/IncomingCallNotification";

// Import analytics components to match patient view exactly
import AnalyticsHeader from "@/components/analytics/AnalyticsHeader";
import AnxietyAnalyticsTracker from "@/components/AnxietyAnalyticsTracker";
import AnalyticsMetrics from "@/components/analytics/AnalyticsMetrics";
import AnxietyChartsSection from "@/components/analytics/AnxietyChartsSection";
import TreatmentOutcomes from "@/components/TreatmentOutcomes";
import MonthlyChartsSection from "@/components/analytics/MonthlyChartsSection";
import GoalProgressSection from "@/components/analytics/GoalProgressSection";
import TriggerAnalysisTable from "@/components/analytics/TriggerAnalysisTable";
import InterventionSummariesSection from "@/components/analytics/InterventionSummariesSection";
import { downloadSummaryReport, generateSummaryReport } from "@/services/summaryReportService";
import {
  processTriggerData,
  processSeverityDistribution,
  getAnalyticsMetrics,
} from "@/utils/analyticsDataProcessor";
import { DateRange } from "react-day-picker";
import {
  filterAnalysesByRange,
  getAnalysisDateBounds,
} from "@/utils/filterAnalysesByRange";

interface PatientRecord {
  id: string;
  user_id: string;
  therapist_name: string;
  contact_value: string;
  created_at: string;
  patient_profile: {
    first_name: string;
    last_name: string;
    email: string;
  };
}

type InsightTone = "success" | "warning" | "danger" | "neutral" | "muted";

const toneBackgroundClass: Record<InsightTone, string> = {
  success: "border-green-200 bg-green-50",
  warning: "border-amber-200 bg-amber-50",
  danger: "border-red-200 bg-red-50",
  neutral: "border-slate-200 bg-slate-50",
  muted: "border-slate-200 bg-white",
};

const toneValueClass: Record<InsightTone, string> = {
  success: "text-green-700",
  warning: "text-amber-600",
  danger: "text-red-600",
  neutral: "text-slate-900",
  muted: "text-slate-600",
};

const toneBadgeClass: Record<InsightTone, string> = {
  success: "bg-green-100 text-green-700 border-green-200",
  warning: "bg-amber-100 text-amber-700 border-amber-200",
  danger: "bg-red-100 text-red-700 border-red-200",
  neutral: "bg-slate-100 text-slate-700 border-slate-200",
  muted: "bg-slate-50 text-slate-600 border-slate-200",
};

const navLabelClass =
  "hidden lg:inline flex-1 text-left leading-tight whitespace-normal break-words";

interface TreatmentReportInsights {
  summaryStats: Array<{
    label: string;
    value: string;
    helper?: string;
    tone: InsightTone;
  }>;
  highlights: string[];
  priorityActions: string[];
  triggers: Array<{ label: string; count: number }>;
  interventions: Array<{ label: string; count: number }>;
  goals: {
    total: number;
    active: number;
    completed: number;
    averageCompletion: number | null;
    struggling: string[];
  };
  timeframe: {
    label: string;
    detail?: string;
  };
  trend: {
    label: string;
    detail?: string;
    delta: number | null;
    direction: "up" | "down" | "flat";
    tone: InsightTone;
  };
  narrative: string;
  conversationCount: number;
  totalSummaries: number;
  recentSessions: Array<{
    id: string;
    title?: string;
    dateLabel?: string;
    notesPreview?: string;
  }>;
  latestSummary?: {
    label: string;
    keyPoints: string[];
  };
}

const TherapistDashboard: React.FC = () => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchEmail, setSearchEmail] = useState("");
  const [searchCode, setSearchCode] = useState("");
  const [patientRecords, setPatientRecords] = useState<PatientRecord[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState<string>("");
  const [selectedPatientData, setSelectedPatientData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("search");
  const [therapistEmail, setTherapistEmail] = useState("");
  const [vanessaOpen, setVanessaOpen] = useState(false);
  const [latestTreatmentPlan, setLatestTreatmentPlan] = useState<any>(null);

  // Video call state
  const [isInCall, setIsInCall] = useState(false);
  const [callRoomId, setCallRoomId] = useState<string>("");
  const [incomingCall, setIncomingCall] = useState<{
    callerName: string;
    callType: 'video' | 'audio';
    roomId: string;
  } | null>(null);

  // Initialize therapist email when component loads
  React.useEffect(() => {
    if (user?.email) {
      setTherapistEmail(user.email);
    }
  }, [user?.email]);

  const analyses = selectedPatientData?.analyses ?? [];
  const goals = selectedPatientData?.goals ?? [];
  const summaries = selectedPatientData?.summaries ?? [];

  const analysisBounds = React.useMemo(
    () => getAnalysisDateBounds(analyses),
    [analyses],
  );

  const [weeklyTrendsRange, setWeeklyTrendsRange] = React.useState<DateRange>();
  const [averageAnxietyRange, setAverageAnxietyRange] =
    React.useState<DateRange>();
  const [monthlyTrendsRange, setMonthlyTrendsRange] =
    React.useState<DateRange>();
  const [monthlyActivityRange, setMonthlyActivityRange] =
    React.useState<DateRange>();
  const [weeklyOutcomesRange, setWeeklyOutcomesRange] =
    React.useState<DateRange>();
  const [triggerAnalysisRange, setTriggerAnalysisRange] =
    React.useState<DateRange>();
  const [goalProgressRange, setGoalProgressRange] = React.useState<DateRange>();

  React.useEffect(() => {
    setWeeklyTrendsRange(undefined);
    setAverageAnxietyRange(undefined);
    setMonthlyTrendsRange(undefined);
    setMonthlyActivityRange(undefined);
    setWeeklyOutcomesRange(undefined);
    setTriggerAnalysisRange(undefined);
    setGoalProgressRange(undefined);
  }, [selectedPatientId]);

  React.useEffect(() => {
    setLatestTreatmentPlan(null);
  }, [selectedPatientId]);

  const weeklyTrendAnalyses = React.useMemo(
    () => filterAnalysesByRange(analyses, weeklyTrendsRange),
    [analyses, weeklyTrendsRange],
  );

  const averageAnxietyAnalyses = React.useMemo(
    () => filterAnalysesByRange(analyses, averageAnxietyRange),
    [analyses, averageAnxietyRange],
  );

  const monthlyTrendAnalyses = React.useMemo(
    () => filterAnalysesByRange(analyses, monthlyTrendsRange),
    [analyses, monthlyTrendsRange],
  );

  const monthlyActivityAnalyses = React.useMemo(
    () => filterAnalysesByRange(analyses, monthlyActivityRange),
    [analyses, monthlyActivityRange],
  );

  const weeklyOutcomeAnalyses = React.useMemo(
    () => filterAnalysesByRange(analyses, weeklyOutcomesRange),
    [analyses, weeklyOutcomesRange],
  );

  const triggerAnalyses = React.useMemo(
    () => filterAnalysesByRange(analyses, triggerAnalysisRange),
    [analyses, triggerAnalysisRange],
  );

  const triggerData = React.useMemo(
    () => processTriggerData(analyses || []),
    [analyses],
  );

  const filteredTriggerData = React.useMemo(
    () => processTriggerData(triggerAnalyses || []),
    [triggerAnalyses],
  );

  const filteredTriggerEntries = triggerAnalyses.length;

  const severityDistribution = React.useMemo(
    () => processSeverityDistribution(analyses || []),
    [analyses],
  );

  const { totalEntries, averageAnxiety, mostCommonTrigger } = React.useMemo(
    () => getAnalyticsMetrics(analyses, triggerData, goals),
    [analyses, triggerData, goals],
  );

  const goalProgressBounds = React.useMemo(() => {
    if (!goals || goals.length === 0) {
      return {} as { min?: Date; max?: Date };
    }

    const timestamps: number[] = [];

    goals.forEach((goal: any) => {
      const start = goal?.start_date ? new Date(goal.start_date) : undefined;
      if (start && !Number.isNaN(start.getTime())) {
        timestamps.push(start.getTime());
      }

      const history = Array.isArray(goal.progress_history)
        ? goal.progress_history
        : [];
      history.forEach((entry: any) => {
        const recorded = entry?.recorded_at
          ? new Date(entry.recorded_at)
          : entry?.created_at
            ? new Date(entry.created_at)
            : undefined;
        if (recorded && !Number.isNaN(recorded.getTime())) {
          timestamps.push(recorded.getTime());
        }
      });
    });

    if (!timestamps.length) {
      return {} as { min?: Date; max?: Date };
    }

  return {
    min: new Date(Math.min(...timestamps)),
    max: new Date(Math.max(...timestamps)),
  };
}, [goals]);

  const aiNarrative = React.useMemo(
    () =>
      generateSummaryReport(summaries, goals, analyses, {
        title: "Treatment Report Analysis",
      }),
    [summaries, goals, analyses],
  );

  const treatmentReportInsights = React.useMemo<TreatmentReportInsights | null>(() => {
    const safeAnalyses = Array.isArray(analyses) ? analyses : [];
    const safeSummaries = Array.isArray(summaries) ? summaries : [];
    const safeGoals = Array.isArray(goals) ? goals : [];
    const safeSessionNotes = Array.isArray(latestTreatmentPlan?.sessionNotes)
      ? latestTreatmentPlan.sessionNotes
      : [];

    if (
      !safeAnalyses.length &&
      !safeSummaries.length &&
      !safeGoals.length &&
      !safeSessionNotes.length
    ) {
      return null;
    }

    const toNumber = (value: any): number => {
      const numeric = Number(value);
      return Number.isFinite(numeric) ? numeric : 0;
    };

    const formatDate = (value: any): string | null => {
      if (!value) return null;
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) return null;
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    };

    const normalizeList = (value: any): string[] => {
      if (!value) return [];
      if (Array.isArray(value)) {
        return value
          .map((item) => (item == null ? "" : String(item).trim()))
          .filter(Boolean);
      }
      if (typeof value === "string") {
        const trimmed = value.trim();
        if (!trimmed) return [];
        try {
          const parsed = JSON.parse(trimmed);
          if (Array.isArray(parsed)) {
            return parsed
              .map((item) => (item == null ? "" : String(item).trim()))
              .filter(Boolean);
          }
        } catch (error) {
          // ignore JSON parse errors and fall back to delimiter split
        }
        return trimmed
          .split(/[\n,;•\-]+/)
          .map((item) => item.trim())
          .filter(Boolean);
      }
      return [];
    };

    const incrementCounts = (
      map: Map<string, { label: string; count: number }>,
      values: string[],
    ) => {
      values.forEach((raw) => {
        const normalized = raw.trim();
        if (!normalized) return;
        const key = normalized.toLowerCase();
        const existing = map.get(key);
        if (existing) {
          existing.count += 1;
        } else {
          map.set(key, { label: normalized, count: 1 });
        }
      });
    };

    const totalAnalyses = safeAnalyses.length;
    const totalSummaries = safeSummaries.length;
    const averageAnxietyValue =
      totalAnalyses > 0
        ? safeAnalyses.reduce(
            (sum, analysis) =>
              sum +
              toNumber(
                (analysis as any).anxietyLevel ??
                  (analysis as any).anxiety_level ??
                  0,
              ),
            0,
          ) / totalAnalyses
        : null;

    const highIntensitySessions = safeAnalyses.filter((analysis) =>
      toNumber((analysis as any).anxietyLevel ?? 0) >= 7,
    ).length;

    const crisisRiskSessions = safeAnalyses.filter((analysis) => {
      const risk = (
        (analysis as any).crisisRiskLevel ??
        (analysis as any).crisis_risk_level ??
        "low"
      )
        .toString()
        .toLowerCase();
      return risk === "high" || risk === "critical";
    }).length;

    const escalationCount = safeAnalyses.filter((analysis) =>
      Boolean(
        (analysis as any).escalationDetected ??
          (analysis as any).escalation_detected ??
          (analysis as any).escalationRecommended ??
          (analysis as any).requiresEscalation,
      ),
    ).length;

    const analysesWithDates = safeAnalyses
      .map((analysis) => {
        const rawDate =
          (analysis as any).created_at ??
          (analysis as any).createdAt ??
          (analysis as any).created_on;
        const date = rawDate ? new Date(rawDate) : null;
        return {
          analysis,
          date,
        };
      })
      .filter((item) => item.date && !Number.isNaN(item.date.getTime()))
      .sort((a, b) => a.date!.getTime() - b.date!.getTime());

    const timeframeStart = analysesWithDates[0]?.date ?? null;
    const timeframeEnd =
      analysesWithDates[analysesWithDates.length - 1]?.date ?? null;

    const computeAverage = (items: typeof safeAnalyses) => {
      if (!items.length) return null;
      const total = items.reduce(
        (sum, item) =>
          sum +
          toNumber(
            (item as any).anxietyLevel ??
              (item as any).anxiety_level ??
              0,
          ),
        0,
      );
      return items.length ? total / items.length : null;
    };

    const sampleDescending = analysesWithDates
      .slice()
      .sort((a, b) => b.date!.getTime() - a.date!.getTime())
      .map((item) => item.analysis);

    const recentSample = sampleDescending.slice(0, 5);
    const previousSample = sampleDescending.slice(5, 10);
    const recentAverage = computeAverage(recentSample);
    const previousAverage = computeAverage(previousSample);

    let trendLabel = "Limited data available";
    let trendDetail: string | undefined;
    let trendDirection: "up" | "down" | "flat" = "flat";
    let trendTone: InsightTone = "muted";
    let trendDelta: number | null = null;

    if (recentAverage !== null && previousAverage !== null) {
      const delta = Number((recentAverage - previousAverage).toFixed(1));
      trendDelta = delta;
      if (Math.abs(delta) < 0.2) {
        trendLabel = "Anxiety levels are stable";
        trendDetail = `Change ${delta >= 0 ? "+" : ""}${delta}`;
        trendDirection = "flat";
        trendTone = "neutral";
      } else if (delta < 0) {
        trendLabel = "Anxiety is trending down";
        trendDetail = `Down ${Math.abs(delta).toFixed(1)} vs prior period`;
        trendDirection = "down";
        trendTone = "success";
      } else {
        trendLabel = "Anxiety is trending up";
        trendDetail = `Up +${delta.toFixed(1)} vs prior period`;
        trendDirection = "up";
        trendTone = delta >= 1 ? "danger" : "warning";
      }
    }

    let severityHelper = "No recent data";
    let severityTone: InsightTone = "muted";
    if (averageAnxietyValue !== null) {
      if (averageAnxietyValue >= 8) {
        severityHelper = "Critical focus required";
        severityTone = "danger";
      } else if (averageAnxietyValue >= 6) {
        severityHelper = "Elevated - monitor closely";
        severityTone = "warning";
      } else if (averageAnxietyValue >= 4) {
        severityHelper = "Stable progress";
        severityTone = "neutral";
      } else {
        severityHelper = "Improvement trend";
        severityTone = "success";
      }
    }

    const summaryStats: TreatmentReportInsights["summaryStats"] = [
      {
        label: "Average Anxiety",
        value:
          averageAnxietyValue !== null
            ? `${averageAnxietyValue.toFixed(1)}/10`
            : "No data",
        helper: severityHelper,
        tone: severityTone,
      },
      {
        label: "Sessions Analyzed",
        value: String(totalAnalyses),
        helper:
          totalSummaries > 0
            ? `${totalSummaries} intervention summaries`
            : undefined,
        tone: totalAnalyses > 0 ? "neutral" : "muted",
      },
      {
        label: "Crisis Alerts",
        value: String(crisisRiskSessions),
        helper:
          crisisRiskSessions > 0
            ? "Follow-up required"
            : "No crisis alerts",
        tone: crisisRiskSessions > 0 ? "danger" : "success",
      },
      {
        label: "Active Goals",
        value: String(
          safeGoals.filter((goal: any) => goal?.is_active !== false).length,
        ),
        helper:
          safeGoals.length > 0
            ? `Avg completion ${Math.round(
                safeGoals.reduce(
                  (sum: number, goal: any) =>
                    sum + toNumber(goal?.completion_rate ?? 0),
                  0,
                ) / safeGoals.length,
              )}%`
            : "No goals recorded",
        tone:
          safeGoals.length > 0
            ? (() => {
                const avg =
                  safeGoals.reduce(
                    (sum: number, goal: any) =>
                      sum + toNumber(goal?.completion_rate ?? 0),
                    0,
                  ) / safeGoals.length;
                if (avg >= 70) return "success";
                if (avg < 40) return "warning";
                return "neutral";
              })()
            : "muted",
      },
    ];

    const triggerCounts = new Map<string, { label: string; count: number }>();
    const interventionCounts = new Map<
      string,
      { label: string; count: number }
    >();

    safeAnalyses.forEach((analysis) => {
      incrementCounts(
        triggerCounts,
        normalizeList(
          (analysis as any).triggers ??
            (analysis as any).anxietyTriggers ??
            (analysis as any).anxiety_triggers ??
            [],
        ),
      );
      incrementCounts(
        interventionCounts,
        normalizeList(
          (analysis as any).recommendedInterventions ??
            (analysis as any).copingStrategies ??
            [],
        ),
      );
    });

    const topTriggers = Array.from(triggerCounts.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
    const topInterventions = Array.from(interventionCounts.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const averageGoalCompletion =
      safeGoals.length > 0
        ? Math.round(
            safeGoals.reduce(
              (sum: number, goal: any) =>
                sum + toNumber(goal?.completion_rate ?? 0),
              0,
            ) / safeGoals.length,
          )
        : null;

    const completedGoals = safeGoals.filter(
      (goal: any) => toNumber(goal?.completion_rate ?? 0) >= 90,
    ).length;

    const strugglingGoals = safeGoals
      .filter((goal: any) => toNumber(goal?.completion_rate ?? 0) < 50)
      .map((goal: any) => String(goal?.title || "Untitled goal"))
      .slice(0, 3);

    const conversationCount = safeSummaries.reduce(
      (sum, summary: any) => sum + toNumber(summary?.conversation_count ?? 0),
      0,
    );

    const sortedSummaries = safeSummaries
      .slice()
      .sort(
        (a: any, b: any) =>
          new Date(b?.week_end ?? b?.week_start ?? 0).getTime() -
          new Date(a?.week_end ?? a?.week_start ?? 0).getTime(),
      );

    const latestSummary = sortedSummaries[0]
      ? {
          label:
            formatDate(sortedSummaries[0].week_start) &&
            formatDate(sortedSummaries[0].week_end)
              ? `${formatDate(sortedSummaries[0].week_start)} → ${formatDate(
                  sortedSummaries[0].week_end,
                )}`
              : formatDate(sortedSummaries[0].week_start) ?? "Most recent summary",
          keyPoints: normalizeList(sortedSummaries[0].key_points).slice(0, 4),
        }
      : undefined;

    const highlights = [
      averageAnxietyValue !== null
        ? `Average anxiety is ${averageAnxietyValue.toFixed(1)}/10.`
        : "No anxiety assessments recorded yet.",
      topTriggers.length
        ? `Top triggers: ${topTriggers
            .slice(0, 3)
            .map((trigger) => `${trigger.label} (${trigger.count})`)
            .join(", ")}.`
        : "No triggers detected in recent sessions.",
      topInterventions.length
        ? `Most used interventions: ${topInterventions
            .slice(0, 3)
            .map((item) => `${item.label} (${item.count})`)
            .join(", ")}.`
        : "No intervention usage recorded yet.",
      highIntensitySessions > 0
        ? `${highIntensitySessions} session${
            highIntensitySessions === 1 ? "" : "s"
          } reported anxiety ≥7.`
        : undefined,
      conversationCount > 0
        ? `${conversationCount} conversations captured across intervention summaries.`
        : undefined,
    ].filter((item): item is string => Boolean(item));

    const priorityActions: string[] = [];
    if (crisisRiskSessions > 0) {
      priorityActions.push(
        "🚨 Address crisis risk factors with immediate follow-up.",
      );
    }
    if (escalationCount > Math.max(1, Math.floor(totalAnalyses * 0.3))) {
      priorityActions.push(
        "⚠️ Assess escalation patterns and reinforce coping strategies.",
      );
    }
    if (averageAnxietyValue !== null && averageAnxietyValue >= 7) {
      priorityActions.push(
        "📈 Focus sessions on acute anxiety reduction techniques.",
      );
    }
    if (safeGoals.some((goal: any) => toNumber(goal?.completion_rate ?? 0) < 50)) {
      priorityActions.push(
        "🎯 Revisit underperforming goals to remove blockers or reset targets.",
      );
    }
    if (!priorityActions.length) {
      priorityActions.push(
        "✅ Continue reinforcing effective interventions and monitor progress weekly.",
      );
    }

    const narrativeParts: string[] = [];
    if (averageAnxietyValue !== null) {
      narrativeParts.push(
        `Average anxiety is ${averageAnxietyValue.toFixed(1)}/10 ${
          trendDetail ? `(${trendDetail})` : ""
        }.`,
      );
    }
    if (crisisRiskSessions > 0) {
      narrativeParts.push(
        `${crisisRiskSessions} crisis-level session${
          crisisRiskSessions === 1 ? "" : "s"
        } detected in the current window.`,
      );
    }
    if (topTriggers.length) {
      narrativeParts.push(
        `Primary triggers include ${topTriggers
          .slice(0, 2)
          .map((item) => item.label)
          .join(" and ")}.`,
      );
    }
    if (averageGoalCompletion !== null) {
      narrativeParts.push(
        `Goals show an average completion of ${averageGoalCompletion}% with ${completedGoals} near completion.`,
      );
    }

    const recentSessions = safeSessionNotes.slice(0, 2).map((note: any) => ({
      id: String(note?.id ?? Math.random()),
      title: note?.meetingTitle ?? "Session",
      dateLabel: formatDate(note?.meetingDate) ?? undefined,
      notesPreview: note?.notes
        ? String(note.notes).split(/\n+/)[0].slice(0, 160)
        : undefined,
    }));

    return {
      summaryStats,
      highlights,
      priorityActions,
      triggers: topTriggers,
      interventions: topInterventions,
      goals: {
        total: safeGoals.length,
        active: safeGoals.filter((goal: any) => goal?.is_active !== false).length,
        completed: completedGoals,
        averageCompletion: averageGoalCompletion,
        struggling: strugglingGoals,
      },
      timeframe: {
        label:
          timeframeStart && timeframeEnd
            ? `${formatDate(timeframeStart)} → ${formatDate(timeframeEnd)}`
            : timeframeEnd
            ? `Last session ${formatDate(timeframeEnd)}`
            : "Timeline unavailable",
        detail:
          totalAnalyses > 0
            ? `${totalAnalyses} recorded assessment${
                totalAnalyses === 1 ? "" : "s"
              }`
            : undefined,
      },
      trend: {
        label: trendLabel,
        detail: trendDetail,
        delta: trendDelta,
        direction: trendDirection,
        tone: trendTone,
      },
      narrative: narrativeParts.join(" ").trim(),
      conversationCount,
      totalSummaries,
      recentSessions,
      latestSummary,
    } satisfies TreatmentReportInsights;
  }, [analyses, summaries, goals, latestTreatmentPlan]);

  const handlePatientSearch = async () => {
    if (!searchEmail || !searchCode) {
      toast({
        title: "Search Required",
        description: "Please enter both patient email AND patient code",
        variant: "destructive",
      });
      return;
    }

    if (!therapistEmail) {
      toast({
        title: "Therapist Email Required",
        description: "Please enter your therapist email address",
        variant: "destructive",
      });
      return;
    }

    setSearchLoading(true);
    try {
      const response = await fetch("/api/therapist/search-patient", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: searchEmail,
          patientCode: searchCode,
        }),
      });

      if (response.ok) {
        const patient = await response.json();
        setPatientRecords([
          {
            id: patient.id,
            user_id: patient.id,
            therapist_name: user?.email || "",
            contact_value: user?.email || "",
            created_at: new Date().toISOString(),
            patient_profile: {
              first_name: patient.firstName || "",
              last_name: patient.lastName || "",
              email: patient.email,
            },
          },
        ]);

        // Automatically select the found patient
        toast({
          title: "Patient Found",
          description: `${patient.firstName} ${patient.lastName} - Loading patient data...`,
        });
        await handleSelectPatient(patient.id);
      } else {
        toast({
          title: "Patient Not Found",
          description: "No patient found with the provided credentials",
          variant: "destructive",
        });
        setPatientRecords([]);
      }
    } catch (error) {
      toast({
        title: "Search Error",
        description: "Failed to search for patient",
        variant: "destructive",
      });
    } finally {
      setSearchLoading(false);
    }
  };

  const handleSelectPatient = async (patientId: string) => {
    setSelectedPatientId(patientId);
    setActiveTab("analytics"); // Switch to analytics tab when patient is selected

    // Helper function to calculate completion rate
    const calcCompletion = (goal: any) => {
      const progress = goal.goal_progress ?? goal.progress_history ?? [];
      const start = new Date(goal.start_date ?? goal.created_at ?? Date.now());
      const days = Math.max(
        1,
        Math.ceil((Date.now() - start.getTime()) / 86400000),
      );
      let expected = 1;
      switch ((goal.frequency ?? "").toLowerCase()) {
        case "daily":
          expected = days;
          break;
        case "weekly":
          expected = Math.ceil(days / 7);
          break;
        case "monthly":
          expected = Math.ceil(days / 30);
          break;
      }
      const actual = progress.length;
      return Math.min(100, (actual / expected) * 100);
    };

    // Load patient's complete analytics data
    try {
      const response = await fetch(
        `/api/therapist/patient-analytics?patientId=${encodeURIComponent(patientId)}&therapistEmail=${encodeURIComponent(therapistEmail || user?.email || "")}`,
      );
      if (response.ok) {
        const analyticsData = await response.json();

        // Normalize analytics data to handle both camelCase and snake_case
        const normalizedData = {
          ...analyticsData,
          analyses: (analyticsData.analyses || []).map((analysis: any) => ({
            id: analysis.id,
            user_id: analysis.user_id || analysis.userId || patientId,
            anxietyLevel: analysis.anxiety_level || analysis.anxietyLevel || 0,
            triggers:
              analysis.anxietyTriggers ||
              analysis.anxiety_triggers ||
              analysis.triggers ||
              [],
            createdAt:
              analysis.created_at ||
              analysis.createdAt ||
              new Date().toISOString(),
            created_at:
              analysis.created_at ||
              analysis.createdAt ||
              new Date().toISOString(),
            personalizedResponse:
              analysis.personalized_response ||
              analysis.personalizedResponse ||
              "",
            copingStrategies:
              analysis.coping_strategies || analysis.copingStrategies || [],
            cognitiveDistortions:
              analysis.cognitive_distortions ||
              analysis.cognitiveDistortions ||
              [],
            escalationDetected:
              analysis.escalation_detected ||
              analysis.escalationDetected ||
              false,
            crisisRiskLevel:
              analysis.crisis_risk_level || analysis.crisisRiskLevel || "low",
            sentiment: analysis.sentiment || "neutral",
          })),
          goals: (analyticsData.goals || []).map((goal: any) => {
            const progress = goal.goal_progress ?? [];
            const avg = progress.length
              ? progress.reduce((s: number, p: any) => s + (p.score ?? 0), 0) /
                progress.length
              : 0;
            return {
              ...goal,
              created_at: goal.created_at || goal.createdAt,
              updated_at: goal.updated_at || goal.updatedAt,
              user_id: goal.user_id || goal.userId || patientId,
              progress_history: progress,
              average_score: avg,
              completion_rate: calcCompletion(goal),
              latest_progress: progress[0] ?? null,
            };
          }),
          summaries: (analyticsData.summaries || []).map((summary: any) => ({
            ...summary,
            created_at: summary.created_at || summary.createdAt,
            user_id: summary.user_id || summary.userId || patientId,
          })),
        };

        setSelectedPatientData(normalizedData);
      }
    } catch (error) {
      console.error("Failed to load patient analytics:", error);
    }
  };

  // Memoize handlers to prevent re-renders
  const handlePatientSearchMemo = React.useCallback(handlePatientSearch, [
    searchEmail,
    searchCode,
    therapistEmail,
    toast,
  ]);
  const handleSelectPatientMemo = React.useCallback(handleSelectPatient, [
    therapistEmail,
    user?.email,
  ]);
  const handleLogout = async () => {
    try {
      await signOut();
    } finally {
      navigate(ROUTES.therapistLogin);
    }
  };

  // Video call handlers
  const handleInitiateCall = (callType: 'video' | 'audio', roomId: string) => {
    setCallRoomId(roomId);
    setIsInCall(true);
  };

  const handleAcceptCall = (roomId: string) => {
    setCallRoomId(roomId);
    setIsInCall(true);
    setIncomingCall(null);
  };

  const handleRejectCall = () => {
    setIncomingCall(null);
  };

  const handleEndCall = () => {
    setIsInCall(false);
    setCallRoomId("");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-8 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Mental Therapist Portal
            </h1>
            <p className="text-gray-600">
              Welcome, Dr. {user?.username || "Therapist"}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Badge variant="default" className="bg-green-600">
              Therapist Dashboard
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setVanessaOpen(true)}
              className="border-blue-200 text-blue-600 hover:bg-blue-50"
            >
              Ask Vanessa
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="text-gray-600 hover:text-gray-900"
            >
              Logout
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 p-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="grid gap-8 lg:grid-cols-[260px_1fr]">
            <TabsList className="flex flex-wrap gap-2 bg-white p-3 rounded-xl border border-gray-200 shadow-sm lg:flex-col lg:sticky lg:top-24 lg:h-fit lg:gap-1">
              <TabsTrigger
                value="search"
                className="flex w-full items-center gap-2 justify-center rounded-lg px-4 py-3 text-sm font-semibold border border-transparent transition-colors data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:border-blue-200 lg:justify-start lg:items-start"
              >
                <Search className="w-4 h-4" />
                <span className={navLabelClass}>Find Patient</span>
              </TabsTrigger>
              <TabsTrigger
                value="directory"
                className="flex w-full items-center gap-2 justify-center rounded-lg px-4 py-3 text-sm font-semibold border border-transparent transition-colors data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:border-blue-200 lg:justify-start lg:items-start"
              >
                <BookOpen className="w-4 h-4" />
                <span className={navLabelClass}>Patient Directory</span>
              </TabsTrigger>
              <TabsTrigger
                value="appointments"
                className="flex w-full items-center gap-2 justify-center rounded-lg px-4 py-3 text-sm font-semibold border border-transparent transition-colors data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:border-blue-200 lg:justify-start lg:items-start"
              >
                <Calendar className="w-4 h-4" />
                <span className={navLabelClass}>Appointments</span>
              </TabsTrigger>
              <TabsTrigger
                value="analytics"
                disabled={!selectedPatientId}
                className="flex w-full items-center gap-2 justify-center rounded-lg px-4 py-3 text-sm font-semibold border border-transparent transition-colors data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:border-blue-200 disabled:cursor-not-allowed disabled:opacity-60 lg:justify-start lg:items-start"
              >
                <TrendingUp className="w-4 h-4" />
                <span className={navLabelClass}>Patient Analytics</span>
              </TabsTrigger>
              <TabsTrigger
                value="interventions"
                disabled={!selectedPatientId}
                className="flex w-full items-center gap-2 justify-center rounded-lg px-4 py-3 text-sm font-semibold border border-transparent transition-colors data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:border-blue-200 disabled:cursor-not-allowed disabled:opacity-60 lg:justify-start lg:items-start"
              >
                <ClipboardList className="w-4 h-4" />
                <span className={navLabelClass}>Patient Intervention Summaries</span>
              </TabsTrigger>
              <TabsTrigger
                value="treatment"
                disabled={!selectedPatientId}
                className="flex w-full items-center gap-2 justify-center rounded-lg px-4 py-3 text-sm font-semibold border border-transparent transition-colors data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:border-blue-200 disabled:cursor-not-allowed disabled:opacity-60 lg:justify-start lg:items-start"
              >
                <Clipboard className="w-4 h-4" />
                <span className={navLabelClass}>
                  Start Session & Create Treatment Plan
                </span>
              </TabsTrigger>
              <TabsTrigger
                value="current-plan"
                disabled={!selectedPatientId}
                className="flex w-full items-center gap-2 justify-center rounded-lg px-4 py-3 text-sm font-semibold border border-transparent transition-colors data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:border-blue-200 disabled:cursor-not-allowed disabled:opacity-60 lg:justify-start lg:items-start"
              >
                <Target className="w-4 h-4" />
                <span className={navLabelClass}>Treatment Plan & Notes</span>
              </TabsTrigger>
              <TabsTrigger
                value="medical-report"
                disabled={!selectedPatientId}
                className="flex w-full items-center gap-2 justify-center rounded-lg px-4 py-3 text-sm font-semibold text-center border border-transparent transition-colors data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:border-blue-200 disabled:cursor-not-allowed disabled:opacity-60 lg:justify-start lg:items-start"
              >
                <FileText className="w-4 h-4" />
                <span className={navLabelClass}>Treatment Report Analysis</span>
              </TabsTrigger>
              <TabsTrigger
                value="chat"
                className="flex w-full items-center gap-2 justify-center rounded-lg px-4 py-3 text-sm font-semibold border border-transparent transition-colors data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:border-blue-200 lg:justify-start lg:items-start"
              >
                <MessageCircle className="w-4 h-4" />
                <span className={navLabelClass}>Case Chat</span>
              </TabsTrigger>
              <TabsTrigger
                value="notifications"
                className="flex w-full items-center gap-2 justify-center rounded-lg px-4 py-3 text-sm font-semibold border border-transparent transition-colors data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:border-blue-200 lg:justify-start lg:items-start"
              >
                <Bell className="w-4 h-4" />
                <span className={navLabelClass}>Notifications</span>
              </TabsTrigger>
            </TabsList>

            <div className="flex-1 space-y-6">
              <Card className="border-blue-100 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-blue-900">
                    <Users className="w-5 h-5" />
                    Find Patient
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="mb-1">
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      Your Therapist Email
                    </label>
                    <Input
                      type="email"
                      placeholder="therapist@example.com"
                      value={therapistEmail}
                      onChange={(e) => setTherapistEmail(e.target.value)}
                      data-testid="input-therapist-email"
                    />
                  </div>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-2 block">
                        Patient Email
                      </label>
                      <Input
                        type="email"
                        placeholder="patient@email.com"
                        value={searchEmail}
                        onChange={(e) => setSearchEmail(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-2 block">
                        Patient Code
                      </label>
                      <Input
                        placeholder="PT-XXXXXX"
                        value={searchCode}
                        onChange={(e) => setSearchCode(e.target.value)}
                      />
                    </div>
                  </div>
                  <Button
                    onClick={handlePatientSearchMemo}
                    disabled={searchLoading}
                    className="w-full"
                  >
                    {searchLoading ? "Searching..." : "Search Patient"}
                  </Button>
                </CardContent>
              </Card>

              <TabsContent value="search" className="space-y-6">
                {patientRecords.length > 0 ? (
                  <Card>
                    <CardHeader>
                      <CardTitle>Search Results</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {patientRecords.map((patient) => (
                        <div
                          key={patient.id}
                          className="p-4 border rounded-lg cursor-pointer hover:bg-gray-50"
                          onClick={() => handleSelectPatientMemo(patient.id)}
                        >
                          <div className="flex justify-between items-center">
                            <div>
                              <h3 className="font-medium">
                                {patient.patient_profile.first_name}{" "}
                                {patient.patient_profile.last_name}
                              </h3>
                              <p className="text-sm text-gray-500">
                                {patient.patient_profile.email}
                              </p>
                            </div>
                            <Button size="sm">View Patient Data</Button>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardContent className="text-center py-12 text-gray-500">
                      Start by searching for a patient to load their records.
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="directory" className="space-y-6">
                <PatientDirectory therapistEmail={therapistEmail} />
              </TabsContent>

              <TabsContent value="appointments" className="space-y-6">
                <AppointmentsCalendar therapistEmail={therapistEmail} />
              </TabsContent>

              <TabsContent value="analytics" className="space-y-6">
                {selectedPatientData ? (
                  <div className="min-h-screen bg-gray-50">
                    <AnalyticsHeader
                      analysesCount={analyses.length}
                      onDownloadHistory={() => {}}
                      onShareWithTherapist={() => {}}
                      onDownloadSummary={() => {}}
                    />

                    <div className="max-w-7xl mx-auto px-8 py-8">
                      {/* Anxiety Analytics Tracker */}
                      <AnxietyAnalyticsTracker analyses={analyses} />

                      {analyses.length === 0 ? (
                        <div className="flex items-center justify-center py-12">
                          <div className="text-center">
                            <p className="text-gray-600 text-lg mb-4">
                              No analytics data available for this patient
                            </p>
                            <p className="text-gray-500">
                              Patient needs to start chatting to see analytics.
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col">
                          <div className="space-y-12">
                            {/* Key Metrics */}
                            <AnalyticsMetrics
                              totalEntries={totalEntries}
                              averageAnxiety={averageAnxiety}
                              mostCommonTrigger={
                                mostCommonTrigger ?? { trigger: "", count: 0 }
                              }
                            />

                            {/* 1️⃣ Goal Progress Overview */}
                            <div className="w-full">
                              <GoalProgressSection
                                goals={goals}
                                dateRange={goalProgressRange}
                                onDateRangeChange={setGoalProgressRange}
                                minDate={
                                  goalProgressBounds.min ?? analysisBounds.min
                                }
                                maxDate={
                                  goalProgressBounds.max ?? analysisBounds.max
                                }
                              />
                            </div>

                            {/* 2️⃣ Clinical Trigger Analysis */}
                            <TriggerAnalysisTable
                              triggerData={filteredTriggerData}
                              totalEntries={filteredTriggerEntries}
                              dateRange={triggerAnalysisRange}
                              onDateRangeChange={setTriggerAnalysisRange}
                              minDate={analysisBounds.min}
                              maxDate={analysisBounds.max}
                            />

                            {/* 3️⃣ Weekly Anxiety Type Trends */}
                            <div className="w-full">
                              <AnxietyChartsSection
                                triggerData={triggerData}
                                severityDistribution={[]}
                                analyses={weeklyTrendAnalyses}
                                showOnly="trends"
                                dateRange={weeklyTrendsRange}
                                onDateRangeChange={setWeeklyTrendsRange}
                                minDate={analysisBounds.min}
                                maxDate={analysisBounds.max}
                              />
                            </div>

                            {/* 4️⃣ Anxiety Levels Distribution */}
                            <div className="w-full">
                              <AnxietyChartsSection
                                triggerData={[]}
                                severityDistribution={severityDistribution}
                                analyses={analyses}
                                showOnly="distribution"
                              />
                            </div>

                            {/* 5️⃣ Anxiety Level Trends */}
                            <div className="w-full">
                              <TreatmentOutcomes
                                analyses={averageAnxietyAnalyses}
                                showOnly="trends"
                                dateRange={averageAnxietyRange}
                                onDateRangeChange={setAverageAnxietyRange}
                                minDate={analysisBounds.min}
                                maxDate={analysisBounds.max}
                              />
                            </div>

                            {/* 6️⃣ Monthly Anxiety Trends */}
                            <div className="w-full">
                              <MonthlyChartsSection
                                analyses={monthlyTrendAnalyses}
                                showOnly="trends"
                                dateRange={monthlyTrendsRange}
                                onDateRangeChange={setMonthlyTrendsRange}
                                minDate={analysisBounds.min}
                                maxDate={analysisBounds.max}
                              />
                            </div>

                            {/* 7️⃣ Weekly Treatment Outcomes */}
                            <div className="w-full">
                              <TreatmentOutcomes
                                analyses={weeklyOutcomeAnalyses}
                                showOnly="outcomes"
                                dateRange={weeklyOutcomesRange}
                                onDateRangeChange={setWeeklyOutcomesRange}
                                minDate={analysisBounds.min}
                                maxDate={analysisBounds.max}
                              />
                            </div>

                            {/* 8️⃣ Monthly Session Activity */}
                            <div className="w-full">
                              <MonthlyChartsSection
                                analyses={monthlyActivityAnalyses}
                                showOnly="activity"
                                dateRange={monthlyActivityRange}
                                onDateRangeChange={setMonthlyActivityRange}
                                minDate={analysisBounds.min}
                                maxDate={analysisBounds.max}
                              />
                            </div>
                          </div>

                          {/* Detailed Trigger Analysis Table */}
                          <TriggerAnalysisTable
                            triggerData={filteredTriggerData}
                            totalEntries={filteredTriggerEntries}
                            dateRange={triggerAnalysisRange}
                            onDateRangeChange={setTriggerAnalysisRange}
                            minDate={analysisBounds.min}
                            maxDate={analysisBounds.max}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <Card>
                    <CardContent className="text-center py-12">
                      <p className="text-gray-600">
                        Please select a patient to view analytics
                      </p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="interventions" className="space-y-6">
                {selectedPatientId && selectedPatientData ? (
                  <InterventionSummariesSection
                    summaries={summaries}
                    analyses={analyses}
                  />
                ) : (
                  <Card>
                    <CardContent className="text-center py-12">
                      <p className="text-gray-600">
                        Select a patient to review intervention summaries
                      </p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="chat" className="space-y-6">
                <TherapistChatInterface
                  patientId={selectedPatientId || undefined}
                  patientName={
                    selectedPatientData
                      ? `${selectedPatientData.profile?.first_name || ""} ${
                          selectedPatientData.profile?.last_name || ""
                        }`.trim() || "Patient"
                      : undefined
                  }
                />
              </TabsContent>

              <TabsContent value="treatment" className="space-y-6">
                {selectedPatientId && selectedPatientData ? (
                  <TreatmentCreation
                    patientId={selectedPatientId}
                    patientName={
                      `${selectedPatientData.profile?.first_name || ""} ${selectedPatientData.profile?.last_name || ""}`.trim() ||
                      "Patient"
                    }
                    onPlanUpdate={setLatestTreatmentPlan}
                    onOpenAssistant={() => setVanessaOpen(true)}
                  />
                ) : (
                  <Card>
                    <CardContent className="text-center py-12">
                      <Clipboard className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                      <p className="text-gray-600">
                        Please select a patient to manage treatment plans
                      </p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="current-plan" className="space-y-6">
                {selectedPatientId && selectedPatientData ? (
                  <>
                    {/* Goals Overview Card */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Treatment Goals Overview</CardTitle>
                        <p className="text-sm text-gray-600">
                          Primary goals for this patient's treatment plan.
                        </p>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {latestTreatmentPlan?.goals && latestTreatmentPlan.goals.length > 0 ? (
                          <ul className="space-y-3">
                            {latestTreatmentPlan.goals.map((goal: any) => (
                              <li key={goal.id} className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                                <Target className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                                <div>
                                  <p className="font-semibold text-gray-900">{goal.title}</p>
                                  {goal.description && (
                                    <p className="text-sm text-gray-600 mt-1">{goal.description}</p>
                                  )}
                                </div>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <div className="text-center py-8 text-gray-500">
                            <Target className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                            <p>No treatment goals saved yet</p>
                            <p className="text-sm">Go to "Start Session & Create Treatment Plan" to add goals</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Session Notes Card */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Session Notes & Recordings</CardTitle>
                        <p className="text-sm text-gray-600">
                          All session notes with audio recordings and transcripts for this patient.
                        </p>
                      </CardHeader>
                      <CardContent>
                        {latestTreatmentPlan?.sessionNotes && latestTreatmentPlan.sessionNotes.length > 0 ? (
                          <div className="space-y-4">
                            {latestTreatmentPlan.sessionNotes.map((note: any) => (
                              <div key={note.id} className="border rounded-lg p-4 bg-slate-50">
                                <div className="flex items-start justify-between mb-2">
                                  <div>
                                    <h5 className="font-semibold text-slate-900">{note.meetingTitle}</h5>
                                    {note.meetingDate && (
                                      <p className="text-xs text-slate-500">
                                        {new Date(note.meetingDate).toLocaleDateString()}
                                      </p>
                                    )}
                                  </div>
                                  <Badge variant="outline">Session Note</Badge>
                                </div>
                                {note.linkedGoalTitle && (
                                  <p className="text-xs text-blue-600 mb-2">
                                    Linked goal: <span className="font-medium">{note.linkedGoalTitle}</span>
                                  </p>
                                )}
                                <div className="space-y-3">
                                  <div>
                                    <h6 className="text-sm font-semibold text-slate-700 mb-1">Notes:</h6>
                                    <p className="text-sm text-slate-700 whitespace-pre-line">{note.notes}</p>
                                  </div>
                                  {note.transcript && (
                                    <div>
                                      <h6 className="text-sm font-semibold text-slate-700 mb-1">Transcript:</h6>
                                      <p className="text-sm text-slate-600 whitespace-pre-line bg-white p-3 rounded border">
                                        {note.transcript}
                                      </p>
                                    </div>
                                  )}
                                  {note.audioUrl && (
                                    <div>
                                      <h6 className="text-sm font-semibold text-slate-700 mb-1">Audio Recording:</h6>
                                      <audio controls className="w-full">
                                        <source src={note.audioUrl} />
                                        Your browser does not support audio playback.
                                      </audio>
                                    </div>
                                  )}
                                </div>
                                <p className="mt-3 text-xs text-slate-400">
                                  Added {new Date(note.createdAt).toLocaleString()}
                                </p>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-12 text-gray-500">
                            <Edit3 className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                            <p>No session notes recorded yet</p>
                            <p className="text-sm">Go to "Start Session & Create Treatment Plan" to add session notes</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </>
                ) : (
                  <Card>
                    <CardContent className="text-center py-12">
                      <Target className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                      <p className="text-gray-600">
                        Select a patient to view treatment plan and notes
                      </p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="notifications" className="space-y-6">
                <TherapistNotifications
                  therapistEmail={therapistEmail || user?.email || ""}
                />
              </TabsContent>

              <TabsContent value="medical-report" className="space-y-6">
                {selectedPatientId && selectedPatientData ? (
                  <div className="space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>Treatment Report Analysis</CardTitle>
                        <p className="text-sm text-gray-600">
                          AI-generated clinical analysis combining intervention summaries, patient analytics, and therapist notes.
                        </p>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div className="flex flex-wrap items-start justify-between gap-4">
                          <div>
                            <p className="text-xs uppercase text-gray-500">Patient</p>
                            <p className="text-base font-semibold text-gray-900">
                              {selectedPatientData.profile?.first_name} {selectedPatientData.profile?.last_name}
                            </p>
                            <p className="text-sm text-gray-600">
                              {selectedPatientData.profile?.email}
                            </p>
                            {treatmentReportInsights?.timeframe.label && (
                              <p className="mt-2 text-xs text-slate-500">
                                {treatmentReportInsights.timeframe.label}
                                {treatmentReportInsights.timeframe.detail && (
                                  <span className="ml-2">
                                    • {treatmentReportInsights.timeframe.detail}
                                  </span>
                                )}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            {treatmentReportInsights && (
                              <Badge
                                variant="outline"
                                className={toneBadgeClass[
                                  treatmentReportInsights.trend.tone
                                ]}
                              >
                                {treatmentReportInsights.trend.label}
                                {treatmentReportInsights.trend.detail && (
                                  <span className="ml-1 text-xs">
                                    ({treatmentReportInsights.trend.detail})
                                  </span>
                                )}
                              </Badge>
                            )}
                            <Button
                              variant="outline"
                              onClick={() =>
                                downloadSummaryReport(summaries, goals, analyses, {
                                  title: "Treatment Report Analysis",
                                })
                              }
                            >
                              Download Report
                            </Button>
                          </div>
                        </div>

                        {treatmentReportInsights?.narrative && (
                          <div className="rounded-lg border border-blue-100 bg-blue-50/70 p-4">
                            <p className="text-sm font-semibold text-blue-900">
                              Executive Summary
                            </p>
                            <p className="mt-1 text-sm text-slate-800">
                              {treatmentReportInsights.narrative}
                            </p>
                          </div>
                        )}

                        {treatmentReportInsights ? (
                          <>
                            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                              {treatmentReportInsights.summaryStats.map((stat) => (
                                <div
                                  key={stat.label}
                                  className={`rounded-lg border p-4 ${toneBackgroundClass[stat.tone]}`}
                                >
                                  <p className="text-xs font-medium uppercase text-slate-500">
                                    {stat.label}
                                  </p>
                                  <p
                                    className={`text-xl font-semibold ${toneValueClass[stat.tone]}`}
                                  >
                                    {stat.value}
                                  </p>
                                  {stat.helper && (
                                    <p className="mt-1 text-xs text-slate-600">
                                      {stat.helper}
                                    </p>
                                  )}
                                </div>
                              ))}
                            </div>

                            <div className="grid gap-4 lg:grid-cols-2">
                              <div className="rounded-lg border bg-white p-4">
                                <h4 className="text-sm font-semibold text-slate-900">
                                  Key Highlights
                                </h4>
                                <ul className="mt-3 space-y-2 text-sm text-slate-700">
                                  {treatmentReportInsights.highlights.map((highlight, index) => (
                                    <li key={`${highlight}-${index}`} className="flex items-start gap-2">
                                      <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-blue-400" />
                                      <span>{highlight}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                              <div className="rounded-lg border bg-white p-4">
                                <h4 className="text-sm font-semibold text-slate-900">
                                  Priority Actions
                                </h4>
                                <ul className="mt-3 space-y-2 text-sm text-slate-700">
                                  {treatmentReportInsights.priorityActions.map((action, index) => (
                                    <li key={`${action}-${index}`} className="flex items-start gap-2">
                                      <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-amber-400" />
                                      <span>{action}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </div>

                            <div className="grid gap-4 lg:grid-cols-2">
                              <div className="rounded-lg border bg-white p-4">
                                <h4 className="text-sm font-semibold text-slate-900">
                                  Leading Triggers
                                </h4>
                                {treatmentReportInsights.triggers.length ? (
                                  <ul className="mt-3 space-y-2 text-sm text-slate-700">
                                    {treatmentReportInsights.triggers.map((trigger) => (
                                      <li key={trigger.label} className="flex items-center justify-between">
                                        <span>{trigger.label}</span>
                                        <span className="text-xs text-slate-500">
                                          {trigger.count} occurrence{trigger.count === 1 ? "" : "s"}
                                        </span>
                                      </li>
                                    ))}
                                  </ul>
                                ) : (
                                  <p className="mt-3 text-sm text-slate-500">
                                    No triggers recorded yet.
                                  </p>
                                )}
                              </div>
                              <div className="rounded-lg border bg-white p-4">
                                <h4 className="text-sm font-semibold text-slate-900">
                                  Intervention Engagement
                                </h4>
                                {treatmentReportInsights.interventions.length ? (
                                  <ul className="mt-3 space-y-2 text-sm text-slate-700">
                                    {treatmentReportInsights.interventions.map((item) => (
                                      <li key={item.label} className="flex items-center justify-between">
                                        <span>{item.label}</span>
                                        <span className="text-xs text-slate-500">
                                          {item.count} mention{item.count === 1 ? "" : "s"}
                                        </span>
                                      </li>
                                    ))}
                                  </ul>
                                ) : (
                                  <p className="mt-3 text-sm text-slate-500">
                                    No intervention data captured yet.
                                  </p>
                                )}
                              </div>
                            </div>

                            <div className="grid gap-4 lg:grid-cols-2">
                              <div className="rounded-lg border bg-white p-4">
                                <h4 className="text-sm font-semibold text-slate-900">
                                  Goal Progress Snapshot
                                </h4>
                                <div className="mt-3 grid gap-2 text-sm text-slate-700">
                                  <div className="flex items-center justify-between">
                                    <span>Total goals</span>
                                    <span>{treatmentReportInsights.goals.total}</span>
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <span>Active goals</span>
                                    <span>{treatmentReportInsights.goals.active}</span>
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <span>Completed / near complete</span>
                                    <span>{treatmentReportInsights.goals.completed}</span>
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <span>Average completion</span>
                                    <span>
                                      {treatmentReportInsights.goals.averageCompletion !== null
                                        ? `${treatmentReportInsights.goals.averageCompletion}%`
                                        : "No data"}
                                    </span>
                                  </div>
                                </div>
                                {treatmentReportInsights.goals.struggling.length > 0 && (
                                  <div className="mt-3 rounded-md border border-amber-200 bg-amber-50 p-3">
                                    <p className="text-xs font-semibold text-amber-800 uppercase">
                                      Goals needing attention
                                    </p>
                                    <ul className="mt-2 space-y-1 text-xs text-amber-700">
                                      {treatmentReportInsights.goals.struggling.map((goal, index) => (
                                        <li key={`${goal}-${index}`}>• {goal}</li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                              </div>

                              {treatmentReportInsights.latestSummary && (
                                <div className="rounded-lg border bg-white p-4">
                                  <h4 className="text-sm font-semibold text-slate-900">
                                    Latest Intervention Summary
                                  </h4>
                                  <p className="mt-2 text-xs uppercase text-slate-500">
                                    {treatmentReportInsights.latestSummary.label}
                                  </p>
                                  {treatmentReportInsights.latestSummary.keyPoints.length ? (
                                    <ul className="mt-3 space-y-2 text-sm text-slate-700">
                                      {treatmentReportInsights.latestSummary.keyPoints.map((point, index) => (
                                        <li key={`${point}-${index}`} className="flex items-start gap-2">
                                          <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-slate-400" />
                                          <span>{point}</span>
                                        </li>
                                      ))}
                                    </ul>
                                  ) : (
                                    <p className="mt-3 text-sm text-slate-500">
                                      No key points recorded.
                                    </p>
                                  )}
                                </div>
                              )}
                            </div>

                            {treatmentReportInsights.recentSessions.length > 0 && (
                              <div className="rounded-lg border bg-white p-4">
                                <h4 className="text-sm font-semibold text-slate-900">
                                  Recent Therapist Notes
                                </h4>
                                <div className="mt-3 grid gap-3 md:grid-cols-2">
                                  {treatmentReportInsights.recentSessions.map((session) => (
                                    <div
                                      key={session.id}
                                      className="rounded-md border border-slate-200 bg-slate-50 p-3"
                                    >
                                      <div className="flex items-start justify-between gap-2">
                                        <p className="text-sm font-semibold text-slate-900">
                                          {session.title}
                                        </p>
                                        {session.dateLabel && (
                                          <span className="text-xs text-slate-500">
                                            {session.dateLabel}
                                          </span>
                                        )}
                                      </div>
                                      {session.notesPreview && (
                                        <p className="mt-2 text-xs text-slate-600">
                                          {session.notesPreview}
                                          {session.notesPreview.length >= 160 && "…"}
                                        </p>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            <details className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                              <summary className="cursor-pointer font-semibold text-slate-900">
                                View full AI narrative
                              </summary>
                              <div className="mt-3 max-h-[45vh] overflow-auto rounded border bg-white p-3">
                                <pre className="whitespace-pre-wrap text-xs text-slate-800">
                                  {aiNarrative}
                                </pre>
                              </div>
                            </details>
                          </>
                        ) : (
                          <div className="rounded border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-600">
                            Not enough patient data to build an analysis yet. Encourage the patient to log sessions and assessments to unlock this view.
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                ) : (
                  <Card>
                    <CardContent className="text-center py-12">
                      <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                      <p className="text-gray-600">Select a patient to generate an AI analysis report</p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </div>
          </div>
        </Tabs>
      </div>
      <Sheet open={vanessaOpen} onOpenChange={setVanessaOpen}>
        <SheetContent side="right" className="w-full sm:max-w-xl">
          <SheetHeader>
            <SheetTitle>Vanessa – AI Treatment Assistant</SheetTitle>
          </SheetHeader>
          <div className="mt-4">
            <TherapistChatInterface
              patientId={selectedPatientId || undefined}
              patientName={
                selectedPatientData
                  ? `${selectedPatientData.profile?.first_name || ""} ${
                      selectedPatientData.profile?.last_name || ""
                    }`.trim() || "Patient"
                  : undefined
              }
            />
          </div>
        </SheetContent>
      </Sheet>

      <Button
        onClick={() => setVanessaOpen(true)}
        className="fixed bottom-6 right-6 bg-blue-600 text-white shadow-lg hover:bg-blue-700"
      >
        <MessageCircle className="w-4 h-4 mr-2" /> Ask Vanessa
      </Button>

      {/* Incoming Call Notification */}
      {incomingCall && (
        <IncomingCallNotification
          callerName={incomingCall.callerName}
          callType={incomingCall.callType}
          roomId={incomingCall.roomId}
          onAccept={handleAcceptCall}
          onReject={handleRejectCall}
        />
      )}

      {/* Video Call Interface */}
      {isInCall && callRoomId && (
        <VideoCallInterface
          roomId={callRoomId}
          userName={user?.username || "Therapist"}
          userRole="therapist"
          onEndCall={handleEndCall}
        />
      )}
    </div>
  );
};

export default TherapistDashboard;
