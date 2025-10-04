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
} from "lucide-react";

// Import therapist components
import TherapistChatInterface from "@/components/therapist/TherapistChatInterface";
import TreatmentCreation from "@/components/therapist/TreatmentCreation";
import TherapistNotifications from "@/components/therapist/TherapistNotifications";

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
                className="flex w-full items-center gap-2 justify-center rounded-lg px-4 py-3 text-sm font-semibold border border-transparent transition-colors data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:border-blue-200 lg:justify-start"
              >
                <Search className="w-4 h-4" />
                <span className="hidden lg:inline">Find Patient</span>
              </TabsTrigger>
              <TabsTrigger
                value="analytics"
                disabled={!selectedPatientId}
                className="flex w-full items-center gap-2 justify-center rounded-lg px-4 py-3 text-sm font-semibold border border-transparent transition-colors data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:border-blue-200 disabled:cursor-not-allowed disabled:opacity-60 lg:justify-start"
              >
                <TrendingUp className="w-4 h-4" />
                <span className="hidden lg:inline">Patient Analytics</span>
              </TabsTrigger>
              <TabsTrigger
                value="interventions"
                disabled={!selectedPatientId}
                className="flex w-full items-center gap-2 justify-center rounded-lg px-4 py-3 text-sm font-semibold border border-transparent transition-colors data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:border-blue-200 disabled:cursor-not-allowed disabled:opacity-60 lg:justify-start"
              >
                <ClipboardList className="w-4 h-4" />
                <span className="hidden lg:inline">Patient Intervention Summaries</span>
              </TabsTrigger>
              <TabsTrigger
                value="treatment"
                disabled={!selectedPatientId}
                className="flex w-full items-center gap-2 justify-center rounded-lg px-4 py-3 text-sm font-semibold border border-transparent transition-colors data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:border-blue-200 disabled:cursor-not-allowed disabled:opacity-60 lg:justify-start"
              >
                <Clipboard className="w-4 h-4" />
                <span className="hidden lg:inline">Create Treatment Plan</span>
              </TabsTrigger>
              <TabsTrigger
                value="current-plan"
                disabled={!selectedPatientId}
                className="flex w-full items-center gap-2 justify-center rounded-lg px-4 py-3 text-sm font-semibold border border-transparent transition-colors data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:border-blue-200 disabled:cursor-not-allowed disabled:opacity-60 lg:justify-start"
              >
                <Target className="w-4 h-4" />
                <span className="hidden lg:inline">Current Plan Overview</span>
              </TabsTrigger>
              <TabsTrigger
                value="therapist-notes"
                disabled={!selectedPatientId}
                className="flex w-full items-center gap-2 justify-center rounded-lg px-4 py-3 text-sm font-semibold border border-transparent transition-colors data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:border-blue-200 disabled:cursor-not-allowed disabled:opacity-60 lg:justify-start"
              >
                <Edit3 className="w-4 h-4" />
                <span className="hidden lg:inline">Therapist Notes Summaries</span>
              </TabsTrigger>
              <TabsTrigger
                value="medical-report"
                disabled={!selectedPatientId}
                className="flex w-full items-center gap-2 justify-center rounded-lg px-4 py-3 text-sm font-semibold text-center border border-transparent transition-colors data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:border-blue-200 disabled:cursor-not-allowed disabled:opacity-60 lg:justify-start"
              >
                <FileText className="w-4 h-4" />
                <span className="hidden lg:inline">Treatment Report</span>
              </TabsTrigger>
              <TabsTrigger
                value="chat"
                className="flex w-full items-center gap-2 justify-center rounded-lg px-4 py-3 text-sm font-semibold border border-transparent transition-colors data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:border-blue-200 lg:justify-start"
              >
                <MessageCircle className="w-4 h-4" />
                <span className="hidden lg:inline">Case Chat</span>
              </TabsTrigger>
              <TabsTrigger
                value="notifications"
                className="flex w-full items-center gap-2 justify-center rounded-lg px-4 py-3 text-sm font-semibold border border-transparent transition-colors data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:border-blue-200 lg:justify-start"
              >
                <Bell className="w-4 h-4" />
                <span className="hidden lg:inline">Notifications</span>
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
                  <Card>
                    <CardHeader>
                      <CardTitle>Current Plan Overview</CardTitle>
                      <p className="text-sm text-gray-600">
                        Snapshot of the latest goals and session notes saved
                        for this patient.
                      </p>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {latestTreatmentPlan ? (
                        <>
                          <div>
                            <h3 className="text-sm font-semibold text-gray-900">
                              Primary Goals
                            </h3>
                            {latestTreatmentPlan.goals &&
                            latestTreatmentPlan.goals.length > 0 ? (
                              <ul className="mt-2 space-y-2 text-sm text-gray-700">
                                {latestTreatmentPlan.goals
                                  .slice(0, 3)
                                  .map((goal: any) => (
                                    <li
                                      key={goal.id}
                                      className="flex items-start gap-2"
                                    >
                                      <Target className="w-4 h-4 text-blue-500 mt-1" />
                                      <span>
                                        <span className="font-medium text-gray-900">
                                          {goal.title}
                                        </span>
                                        {goal.description
                                          ? ` – ${goal.description}`
                                          : ""}
                                      </span>
                                    </li>
                                  ))}
                              </ul>
                            ) : (
                              <p className="text-sm text-gray-600">
                                No goals saved in the current treatment plan.
                              </p>
                            )}
                          </div>
                          <div>
                            <h3 className="text-sm font-semibold text-gray-900">
                              Recent Session Notes
                            </h3>
                            {latestTreatmentPlan.sessionNotes &&
                            latestTreatmentPlan.sessionNotes.length > 0 ? (
                              <ul className="mt-2 space-y-2 text-sm text-gray-700">
                                {latestTreatmentPlan.sessionNotes
                                  .slice(0, 2)
                                  .map((note: any) => (
                                    <li
                                      key={note.id}
                                      className="border rounded-md p-2 bg-gray-50"
                                    >
                                      <p className="font-medium text-gray-900">
                                        {note.meetingTitle || "Session"}
                                      </p>
                                      {note.meetingDate && (
                                        <p className="text-xs text-gray-500">
                                          {new Date(
                                            note.meetingDate,
                                          ).toLocaleDateString()}
                                        </p>
                                      )}
                                      <p className="text-xs text-gray-600 mt-1 whitespace-pre-line">
                                        {note.notes}
                                      </p>
                                    </li>
                                  ))}
                              </ul>
                            ) : (
                              <p className="text-sm text-gray-600">
                                No therapist session notes recorded yet.
                              </p>
                            )}
                          </div>
                        </>
                      ) : (
                        <p className="text-sm text-gray-600">
                          Save the treatment plan to generate a quick summary
                          here.
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardContent className="text-center py-12">
                      <Target className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                      <p className="text-gray-600">
                        Select a patient to view current plan overview
                      </p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="therapist-notes" className="space-y-6">
                {selectedPatientId && latestTreatmentPlan ? (
                  <Card>
                    <CardHeader>
                      <CardTitle>Therapist Notes Summaries</CardTitle>
                      <p className="text-sm text-gray-600">
                        All session notes with audio recordings and transcripts for this patient.
                      </p>
                    </CardHeader>
                    <CardContent>
                      {latestTreatmentPlan.sessionNotes && latestTreatmentPlan.sessionNotes.length > 0 ? (
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
                          <p>No therapist notes recorded yet</p>
                          <p className="text-sm">Go to "Create Treatment Plan" to add session notes</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardContent className="text-center py-12">
                      <Edit3 className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                      <p className="text-gray-600">
                        Select a patient to view therapist notes summaries
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
                        <CardTitle>Treatment Report</CardTitle>
                        <p className="text-sm text-gray-600">
                          Consolidated insights based on current treatment
                          plans, therapist notes, and recent analytics activity.
                        </p>
                      </CardHeader>
                      <CardContent>
                        <div className="grid gap-4 md:grid-cols-2">
                          <div>
                            <p className="text-xs uppercase text-gray-500 mb-1">
                              Patient
                            </p>
                            <p className="text-sm text-gray-800 font-medium">
                              {selectedPatientData.profile?.first_name}{" "}
                              {selectedPatientData.profile?.last_name}
                            </p>
                            <p className="text-sm text-gray-600">
                              {selectedPatientData.profile?.email}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs uppercase text-gray-500 mb-1">
                              Average Anxiety (30 days)
                            </p>
                            <p className="text-sm text-gray-800 font-semibold">
                              {averageAnxiety !== null
                                ? `${averageAnxiety.toFixed(1)}/10`
                                : "—"}
                            </p>
                            <p className="text-sm text-gray-600">
                              Top trigger:{" "}
                              {mostCommonTrigger?.trigger ||
                                "No trigger identified"}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs uppercase text-gray-500 mb-1">
                              Treatment Goals
                            </p>
                            {latestTreatmentPlan?.goals?.length ? (
                              <ul className="text-sm text-gray-700 space-y-1">
                                {latestTreatmentPlan.goals
                                  .slice(0, 3)
                                  .map((goal: any) => (
                                    <li
                                      key={goal.id}
                                      className="flex items-start gap-2"
                                    >
                                      <Target className="w-4 h-4 text-blue-500 mt-1" />
                                      <span>{goal.title}</span>
                                    </li>
                                  ))}
                                {latestTreatmentPlan.goals.length > 3 && (
                                  <li className="text-xs text-gray-500">
                                    + {latestTreatmentPlan.goals.length - 3}{" "}
                                    more goals
                                  </li>
                                )}
                              </ul>
                            ) : (
                              <p className="text-sm text-gray-600">
                                No treatment goals saved yet.
                              </p>
                            )}
                          </div>
                          <div>
                            <p className="text-xs uppercase text-gray-500 mb-1">
                              Recent Sessions
                            </p>
                            {latestTreatmentPlan?.sessionNotes?.length ? (
                              <ul className="text-sm text-gray-700 space-y-1">
                                {latestTreatmentPlan.sessionNotes
                                  .slice(0, 2)
                                  .map((note: any) => (
                                    <li key={note.id}>
                                      <span className="font-medium text-gray-900">
                                        {note.meetingTitle || "Session"}
                                      </span>
                                      {note.meetingDate && (
                                        <span className="text-xs text-gray-500 ml-2">
                                          {new Date(
                                            note.meetingDate,
                                          ).toLocaleDateString()}
                                        </span>
                                      )}
                                    </li>
                                  ))}
                              </ul>
                            ) : (
                              <p className="text-sm text-gray-600">
                                No session notes recorded.
                              </p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <AnalyticsMetrics
                      totalEntries={totalEntries}
                      averageAnxiety={averageAnxiety}
                      mostCommonTrigger={
                        mostCommonTrigger ?? { trigger: "", count: 0 }
                      }
                    />

                    <div className="grid gap-6 lg:grid-cols-2">
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
                      <TreatmentOutcomes
                        analyses={averageAnxietyAnalyses}
                        showOnly="trends"
                        dateRange={averageAnxietyRange}
                        onDateRangeChange={setAverageAnxietyRange}
                        minDate={analysisBounds.min}
                        maxDate={analysisBounds.max}
                      />
                    </div>

                    <GoalProgressSection
                      goals={goals}
                      dateRange={goalProgressRange}
                      onDateRangeChange={setGoalProgressRange}
                      minDate={goalProgressBounds.min ?? analysisBounds.min}
                      maxDate={goalProgressBounds.max ?? analysisBounds.max}
                    />

                    <TriggerAnalysisTable
                      triggerData={filteredTriggerData}
                      totalEntries={filteredTriggerEntries}
                      dateRange={triggerAnalysisRange}
                      onDateRangeChange={setTriggerAnalysisRange}
                      minDate={analysisBounds.min}
                      maxDate={analysisBounds.max}
                    />

                    <InterventionSummariesSection
                      summaries={summaries}
                      analyses={analyses}
                    />
                  </div>
                ) : (
                  <Card>
                    <CardContent className="text-center py-12">
                      <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                      <p className="text-gray-600">
                        Select a patient to generate a medical situation report
                      </p>
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
    </div>
  );
};

export default TherapistDashboard;
