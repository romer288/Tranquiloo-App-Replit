import React from "react";
import { Loader2 } from "lucide-react";
import AnxietyAnalyticsTracker from "@/components/AnxietyAnalyticsTracker";
import { useAnalyticsData } from "@/hooks/useAnalyticsData";
import TreatmentOutcomes from "@/components/TreatmentOutcomes";
import AnalyticsHeader from "@/components/analytics/AnalyticsHeader";
import AnalyticsMetrics from "@/components/analytics/AnalyticsMetrics";
import AnxietyChartsSection from "@/components/analytics/AnxietyChartsSection";
import MonthlyChartsSection from "@/components/analytics/MonthlyChartsSection";
import TriggerAnalysisTable from "@/components/analytics/TriggerAnalysisTable";
import EmptyAnalyticsState from "@/components/analytics/EmptyAnalyticsState";
import GoalProgressSection from "@/components/analytics/GoalProgressSection";

import {
  processTriggerData,
  processSeverityDistribution,
  getAnalyticsMetrics,
} from "@/utils/analyticsDataProcessor";
import { shareWithTherapist } from "@/services/analyticsExportService";
import { useGoalsData } from "@/hooks/useGoalsData";
import { useToast } from "@/hooks/use-toast";
import ProtectedRoute from "@/components/ProtectedRoute";
import { DateRange } from "react-day-picker";
import {
  filterAnalysesByRange,
  getAnalysisDateBounds,
} from "@/utils/filterAnalysesByRange";

const AnalyticsContent = () => {
  const { data, isLoading, error, getAllAnalyses } = useAnalyticsData();
  const summariesData = useGoalsData();
  const { goals, summaries } = summariesData;
  const { toast } = useToast();
  const allAnalyses = getAllAnalyses();

  // Debug logging for chart order
  console.log("🎯 Analytics component rendering - chart order should be 1-8");
  console.log("📊 Analytics Page - allAnalyses count:", allAnalyses.length);
  console.log("📊 First analysis sample:", allAnalyses[0]);

  // Don't process data until we actually have analyses
  const hasData = allAnalyses.length > 0;

  const analysisBounds = React.useMemo(
    () => getAnalysisDateBounds(allAnalyses),
    [allAnalyses],
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

  const weeklyTrendAnalyses = React.useMemo(
    () => filterAnalysesByRange(allAnalyses, weeklyTrendsRange),
    [allAnalyses, weeklyTrendsRange],
  );

  const averageAnxietyAnalyses = React.useMemo(
    () => filterAnalysesByRange(allAnalyses, averageAnxietyRange),
    [allAnalyses, averageAnxietyRange],
  );

  const monthlyTrendAnalyses = React.useMemo(
    () => filterAnalysesByRange(allAnalyses, monthlyTrendsRange),
    [allAnalyses, monthlyTrendsRange],
  );

  const monthlyActivityAnalyses = React.useMemo(
    () => filterAnalysesByRange(allAnalyses, monthlyActivityRange),
    [allAnalyses, monthlyActivityRange],
  );

  const weeklyOutcomeAnalyses = React.useMemo(
    () => filterAnalysesByRange(allAnalyses, weeklyOutcomesRange),
    [allAnalyses, weeklyOutcomesRange],
  );

  const triggerAnalyses = React.useMemo(
    () => filterAnalysesByRange(allAnalyses, triggerAnalysisRange),
    [allAnalyses, triggerAnalysisRange],
  );

  const triggerData = processTriggerData(allAnalyses);
  const severityDistribution = processSeverityDistribution(allAnalyses);
  const { totalEntries, averageAnxiety, mostCommonTrigger } =
    getAnalyticsMetrics(allAnalyses, triggerData, goals);

  const filteredTriggerData = React.useMemo(
    () => processTriggerData(triggerAnalyses),
    [triggerAnalyses],
  );
  const filteredTriggerEntries = triggerAnalyses.length;

  const goalProgressBounds = React.useMemo(() => {
    if (!goals || goals.length === 0) {
      return {} as { min?: Date; max?: Date };
    }

    const timestamps: number[] = [];

    goals.forEach((goal) => {
      const start = goal?.start_date ? new Date(goal.start_date) : undefined;
      if (start && !Number.isNaN(start.getTime())) {
        timestamps.push(start.getTime());
      }

      const history = Array.isArray(goal.progress_history)
        ? goal.progress_history
        : [];
      history.forEach((entry) => {
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

  const handleDownloadReport = async () => {
    try {
      const { downloadSummaryReport } = await import(
        "@/services/summaryReportService"
      );
      downloadSummaryReport(summaries, goals || [], allAnalyses, {
        fileName: "analytics-history",
        title: "Analytics & Intervention History Report",
      });

      toast({
        title: "Download started",
        description: "Analytics history report is downloading.",
      });
    } catch (error) {
      console.error("Error downloading history:", error);
      toast({
        title: "Error",
        description: "Failed to download analytics history.",
        variant: "destructive",
      });
    }
  };

  const handleDownloadSummary = async () => {
    try {
      console.log("🔄 Starting download summary...");
      console.log("📊 Current analyses count:", allAnalyses.length);
      console.log("📋 Current summaries count:", summaries.length);

      // Use the summary report service to download as PDF-like format
      const { downloadSummaryReport } = await import(
        "@/services/summaryReportService"
      );
      downloadSummaryReport(summaries, goals || [], allAnalyses);

      toast({
        title: "Success",
        description: "Conversation summary downloaded successfully",
      });
    } catch (error) {
      console.error("Error downloading summary:", error);
      toast({
        title: "Error",
        description: "Failed to download conversation summary",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 pb-16 md:pb-0 overflow-x-hidden">
        <AnalyticsHeader
          analysesCount={0}
          onDownloadHistory={handleDownloadReport}
          onShareWithTherapist={() => shareWithTherapist("loading")}
          onDownloadSummary={handleDownloadSummary}
        />

        <div className="max-w-screen-md mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <span className="ml-2 text-gray-600">
              Loading analytics data...
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Check if user is authenticated - if not, show message
  if (!hasData && !isLoading && !error) {
    return (
      <div className="min-h-screen bg-gray-50 pb-16 md:pb-0 overflow-x-hidden">
        <AnalyticsHeader
          analysesCount={0}
          onDownloadHistory={handleDownloadReport}
          onShareWithTherapist={() => shareWithTherapist("no-data")}
          onDownloadSummary={handleDownloadSummary}
        />

        <div className="max-w-screen-md mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center py-12 px-4 text-center">
            <div className="text-center">
              <p className="text-gray-600 text-lg mb-4">
                Please log in to view your analytics data
              </p>
              <p className="text-gray-500">
                Your anxiety tracking data is protected and only visible when
                you're authenticated.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 pb-16 md:pb-0 overflow-x-hidden">
        <AnalyticsHeader
          analysesCount={0}
          onDownloadHistory={handleDownloadReport}
          onShareWithTherapist={() => shareWithTherapist("error")}
          onDownloadSummary={handleDownloadSummary}
        />
        <div className="max-w-screen-md mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <p className="text-red-600">Error loading data: {error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-16 md:pb-0 overflow-x-hidden">
      <AnalyticsHeader
        analysesCount={allAnalyses.length}
        onDownloadHistory={handleDownloadReport}
        onShareWithTherapist={() => shareWithTherapist("main")}
        onDownloadSummary={handleDownloadSummary}
      />

      <div className="max-w-screen-sm sm:max-w-screen-md mx-auto w-full min-w-0 px-4 sm:px-6 lg:px-8 py-8 space-y-8 overflow-hidden">
        {/* Anxiety Analytics Tracker */}
        <div className="w-full min-w-0 overflow-hidden">
          <AnxietyAnalyticsTracker analyses={allAnalyses} />
        </div>

        {!hasData ? (
          <EmptyAnalyticsState />
        ) : (
          <div className="flex flex-col w-full min-w-0 overflow-hidden">
            <div className="space-y-8 sm:space-y-12 w-full min-w-0">
              {/* Key Metrics */}
              <div className="w-full min-w-0 overflow-hidden">
                <AnalyticsMetrics
                  totalEntries={totalEntries}
                  averageAnxiety={averageAnxiety}
                  mostCommonTrigger={mostCommonTrigger}
                />
              </div>

              {/* 1️⃣ Goal Progress Overview */}
              <div className="w-full min-w-0 overflow-hidden">
                <GoalProgressSection
                  goals={goals}
                  dateRange={goalProgressRange}
                  onDateRangeChange={setGoalProgressRange}
                  minDate={goalProgressBounds.min ?? analysisBounds.min}
                  maxDate={goalProgressBounds.max ?? analysisBounds.max}
                />
              </div>

              {/* 2️⃣ Clinical Trigger Analysis */}
              <div className="w-full min-w-0 overflow-hidden">
                <TriggerAnalysisTable
                  triggerData={filteredTriggerData}
                  totalEntries={filteredTriggerEntries}
                  dateRange={triggerAnalysisRange}
                  onDateRangeChange={setTriggerAnalysisRange}
                  minDate={analysisBounds.min}
                  maxDate={analysisBounds.max}
                />
              </div>

              {/* 3️⃣ Weekly Anxiety Type Trends */}
              <div className="w-full min-w-0 overflow-hidden">
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
              <div className="w-full min-w-0 overflow-hidden">
                <AnxietyChartsSection
                  triggerData={[]}
                  severityDistribution={severityDistribution}
                  analyses={allAnalyses}
                  showOnly="distribution"
                />
              </div>

              {/* 5️⃣ Anxiety Level Trends */}
              <div className="w-full min-w-0 overflow-hidden">
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
              <div className="w-full min-w-0 overflow-hidden">
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
              <div className="w-full min-w-0 overflow-hidden">
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
              <div className="w-full min-w-0 overflow-hidden">
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
          </div>
        )}
      </div>
    </div>
  );
};

const Analytics = () => {
  return (
    <ProtectedRoute>
      <AnalyticsContent />
    </ProtectedRoute>
  );
};

export default Analytics;
