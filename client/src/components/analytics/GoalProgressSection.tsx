import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { GoalProgress, GoalWithProgress } from '@/types/goals';
import { Target, Trophy, TrendingUp, Star, CheckCircle2 } from 'lucide-react';
import { DateRange } from 'react-day-picker';

import ChartDateRangePicker from '@/components/analytics/ChartDateRangePicker';
import { useLanguage } from '@/context/LanguageContext';

type EnrichedGoal = GoalWithProgress & {
  averageScoreForRange: number;
  completionRateForRange: number;
  filteredHistory: GoalProgress[];
};

const startOfDay = (date: Date) => {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
};

const endOfDay = (date: Date) => {
  const copy = new Date(date);
  copy.setHours(23, 59, 59, 999);
  return copy;
};

const parseDate = (value?: string) => {
  if (!value) return undefined;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
};

const filterProgressHistory = (history: GoalProgress[] = [], range?: DateRange): GoalProgress[] => {
  if (!range?.from && !range?.to) {
    return history;
  }

  const from = range.from ? startOfDay(range.from) : undefined;
  const to = range.to ? endOfDay(range.to) : undefined;

  return history.filter((entry) => {
    const recorded = parseDate(entry.recorded_at) ?? parseDate(entry.created_at);
    if (!recorded) {
      return false;
    }

    if (from && recorded < from) {
      return false;
    }

    if (to && recorded > to) {
      return false;
    }

    return true;
  });
};

const calculateRangeCompletionRate = (
  goal: GoalWithProgress,
  history: GoalProgress[],
  range?: DateRange
): number => {
  if (!range) {
    return goal.completion_rate ?? 0;
  }

  if (!history.length) {
    return 0;
  }

  const goalStart = parseDate(goal.start_date);
  if (!goalStart) {
    return 0;
  }

  const rangeStart = range.from ? startOfDay(range.from) : startOfDay(goalStart);
  const effectiveStart = rangeStart < goalStart ? startOfDay(goalStart) : rangeStart;
  const effectiveEnd = range.to ? endOfDay(range.to) : new Date();

  if (effectiveEnd < effectiveStart) {
    return 0;
  }

  const millisecondsPerDay = 1000 * 60 * 60 * 24;
  const diffDays = Math.max(
    1,
    Math.floor((effectiveEnd.getTime() - effectiveStart.getTime()) / millisecondsPerDay) + 1
  );

  let expectedEntries = 1;
  switch (goal.frequency) {
    case 'daily':
      expectedEntries = diffDays;
      break;
    case 'weekly':
      expectedEntries = Math.max(1, Math.ceil(diffDays / 7));
      break;
    case 'monthly':
      expectedEntries = Math.max(1, Math.ceil(diffDays / 30));
      break;
    default:
      expectedEntries = diffDays;
  }

  return Math.min(100, (history.length / expectedEntries) * 100);
};

interface GoalProgressSectionProps {
  goals: GoalWithProgress[];
  dateRange?: DateRange;
  onDateRangeChange?: (range: DateRange | undefined) => void;
  minDate?: Date;
  maxDate?: Date;
}

const GoalProgressSection: React.FC<GoalProgressSectionProps> = ({
  goals,
  dateRange,
  onDateRangeChange,
  minDate,
  maxDate,
}) => {
  const { t, language } = useLanguage();
  const displayGoals = React.useMemo<EnrichedGoal[]>(() => {
    return goals.map((goal) => {
      const history = Array.isArray(goal.progress_history) ? goal.progress_history : [];
      const filteredHistory = filterProgressHistory(history, dateRange);

      const averageScoreRaw = filteredHistory.length > 0
        ? filteredHistory.reduce((sum, entry) => sum + Number(entry.score ?? 0), 0) / filteredHistory.length
        : goal.average_score ?? 0;
      const averageScoreForRange = Number.isFinite(averageScoreRaw) ? averageScoreRaw : 0;

      const completionRateRaw = calculateRangeCompletionRate(goal, filteredHistory, dateRange);
      const completionRateForRange = Number.isFinite(completionRateRaw) ? completionRateRaw : 0;

      // Translate goal titles and descriptions for mock goals
      let translatedTitle = goal.title;
      let translatedDescription = goal.description;
      
      if (goal.id === 'goal_1') {
        translatedTitle = t('goals.goal1.title', goal.title);
        translatedDescription = goal.description ? t('goals.goal1.description', goal.description) : goal.description;
      } else if (goal.id === 'goal_2') {
        translatedTitle = t('goals.goal2.title', goal.title);
        translatedDescription = goal.description ? t('goals.goal2.description', goal.description) : goal.description;
      }

      return {
        ...goal,
        title: translatedTitle,
        description: translatedDescription,
        averageScoreForRange,
        completionRateForRange,
        filteredHistory,
      };
    });
  }, [goals, dateRange, language, t]);

  if (goals.length === 0) {
    return (
      <Card className="bg-gradient-to-br from-background to-muted/20 border-primary/20 shadow-lg">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto w-16 h-16 bg-muted/50 rounded-full flex items-center justify-center mb-4">
            <Target className="w-8 h-8 text-muted-foreground" />
          </div>
          <CardTitle className="text-xl">{t('analytics.goals.emptyTitle')}</CardTitle>
          <p className="text-sm text-muted-foreground">
            {t('analytics.goals.emptyDesc')}
          </p>
        </CardHeader>
      </Card>
    );
  }

  const getCategoryConfig = (category: string) => {
    const configs = {
      treatment: { color: 'hsl(var(--primary))', bg: 'bg-primary/10', icon: Target },
      'self-care': { color: 'hsl(142 76% 36%)', bg: 'bg-green-500/10', icon: Star },
      therapy: { color: 'hsl(262 83% 58%)', bg: 'bg-purple-500/10', icon: Trophy },
      mindfulness: { color: 'hsl(220 70% 50%)', bg: 'bg-blue-500/10', icon: CheckCircle2 },
      exercise: { color: 'hsl(25 95% 53%)', bg: 'bg-orange-500/10', icon: TrendingUp },
      social: { color: 'hsl(330 81% 60%)', bg: 'bg-pink-500/10', icon: Target },
      work: { color: 'hsl(48 96% 53%)', bg: 'bg-yellow-500/10', icon: Target },
      sleep: { color: 'hsl(173 58% 39%)', bg: 'bg-cyan-500/10', icon: Star },
      nutrition: { color: 'hsl(142 76% 36%)', bg: 'bg-emerald-500/10', icon: Target }
    };
    return configs[category as keyof typeof configs] || { 
      color: 'hsl(var(--muted-foreground))', 
      bg: 'bg-muted/10', 
      icon: Target 
    };
  };

  const translateCategory = (category: string): string => {
    const categoryKey = `goals.category.${category}`;
    const translated = t(categoryKey, category);
    // If translation key doesn't exist, return formatted category name
    if (translated === categoryKey) {
      return category.replace('_', ' ');
    }
    return translated;
  };

  const totalGoals = displayGoals.length;
  const completedGoals = displayGoals.filter(goal => goal.completionRateForRange >= 80).length;
  const averageProgress = totalGoals > 0
    ? displayGoals.reduce((sum, goal) => sum + (goal.averageScoreForRange ?? 0), 0) / totalGoals
    : 0;
  const inProgressGoals = displayGoals.filter(goal => goal.completionRateForRange > 0 && goal.completionRateForRange < 80).length;

  return (
    <Card className="bg-gradient-to-br from-background to-muted/20 border-primary/20 shadow-lg">
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Target className="w-5 h-5 text-primary" />
            </div>
            <CardTitle className="text-xl bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
              {t('analytics.goals.title')}
            </CardTitle>
          </div>
          {onDateRangeChange && (
            <ChartDateRangePicker
              value={dateRange}
              onChange={onDateRangeChange}
              minDate={minDate}
              maxDate={maxDate}
              label={t('therapistDashboard.range.label')}
            />
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">{t('analytics.goals.total')}</p>
                  <p className="text-2xl font-bold text-primary">{totalGoals}</p>
                </div>
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                  <Target className="w-5 h-5 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500/5 to-green-500/10 border-green-500/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">{t('analytics.goals.completed')}</p>
                  <p className="text-2xl font-bold text-green-600">{completedGoals}</p>
                </div>
                <div className="w-10 h-10 bg-green-500/10 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-500/5 to-orange-500/10 border-orange-500/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">{t('analytics.goals.inProgress')}</p>
                  <p className="text-2xl font-bold text-orange-600">{inProgressGoals}</p>
                </div>
                <div className="w-10 h-10 bg-orange-500/10 rounded-full flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500/5 to-purple-500/10 border-purple-500/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">{t('analytics.goals.avgScore')}</p>
                  <p className="text-2xl font-bold text-purple-600">{(averageProgress !== null && averageProgress !== undefined && !isNaN(Number(averageProgress)) ? Number(averageProgress).toFixed(1) : '0.0')}</p>
                </div>
                <div className="w-10 h-10 bg-purple-500/10 rounded-full flex items-center justify-center">
                  <Trophy className="w-5 h-5 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Goals List */}
        <div className="space-y-4">
          {displayGoals.map(goal => {
            const config = getCategoryConfig(goal.category);
            const Icon = config.icon;
            const completionStatus = goal.completionRateForRange >= 80 ? 'completed' : 
                                   goal.completionRateForRange >= 50 ? 'good' : 
                                   goal.completionRateForRange > 0 ? 'started' : 'new';
            
            return (
              <Card key={goal.id} className="bg-gradient-to-r from-muted/30 to-background hover:from-muted/50 hover:to-muted/10 transition-all duration-200 border-l-4" 
                    style={{ borderLeftColor: config.color }}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full ${config.bg} flex items-center justify-center`}>
                        <Icon className="w-5 h-5" style={{ color: config.color }} />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-foreground text-base">{goal.title}</h4>
                     <div className="flex items-center gap-2 mt-1">
                       <Badge variant="outline" className="text-xs">
                         {translateCategory(goal.category)}
                       </Badge>
                       <Badge 
                         variant={completionStatus === 'completed' ? 'default' : 
                                completionStatus === 'good' ? 'secondary' : 'outline'}
                         className="text-xs"
                       >
                          {completionStatus === 'completed'
                            ? t('analytics.goals.badge.completed')
                            : completionStatus === 'good'
                            ? t('analytics.goals.badge.good')
                            : completionStatus === 'started'
                            ? t('analytics.goals.badge.started')
                            : t('analytics.goals.badge.new')}
                       </Badge>
                     </div>
                   </div>
                 </div>
                 <div className="text-right">
                   <p className="text-lg font-bold text-foreground">
                     {(goal?.averageScoreForRange !== null && goal?.averageScoreForRange !== undefined && !isNaN(Number(goal.averageScoreForRange)) ? Number(goal.averageScoreForRange).toFixed(1) : '0.0')}/10
                   </p>
                   <p className="text-xs text-muted-foreground">
                      {(Number(goal.completionRateForRange ?? 0)).toFixed(2)}% {t('analytics.goals.adherence')}
                   </p>
                 </div>
               </div>
                  
                  <div className="space-y-2">
                    <Progress 
                      value={Number(goal.completionRateForRange ?? 0)} 
                      className="h-3"
                      style={{ 
                        '--progress-background': config.color + '20',
                        '--progress-foreground': config.color 
                      } as React.CSSProperties}
                    />
                  <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{t('analytics.goals.progressLabel')}: {Number(goal.completionRateForRange ?? 0).toFixed(0)}%</span>
                      <span>{t('analytics.goals.scoreLabel')}: {(goal?.averageScoreForRange !== null && goal?.averageScoreForRange !== undefined && !isNaN(Number(goal.averageScoreForRange)) ? Number(goal.averageScoreForRange).toFixed(1) : '0.0')}/10</span>
                   </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default GoalProgressSection;
