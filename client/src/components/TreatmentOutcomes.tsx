
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, BarChart, Bar, AreaChart, Area } from 'recharts';
import { ChartContainer, ChartTooltip } from '@/components/ui/chart';
import { TrendingUp, TrendingDown, Minus, Target, Calendar } from 'lucide-react';
import { DateRange } from 'react-day-picker';

import ChartDateRangePicker from '@/components/analytics/ChartDateRangePicker';
import { analyticsService, TreatmentOutcome, ClaudeAnxietyAnalysisWithDate } from '@/services/analyticsService';
import { useLanguage } from '@/context/LanguageContext';

interface TreatmentOutcomesProps {
  analyses: ClaudeAnxietyAnalysisWithDate[];
  showOnly?: 'trends' | 'outcomes' | 'all';
  dateRange?: DateRange;
  onDateRangeChange?: (range: DateRange | undefined) => void;
  minDate?: Date;
  maxDate?: Date;
}

const TreatmentOutcomes: React.FC<TreatmentOutcomesProps> = ({
  analyses,
  showOnly = 'all',
  dateRange,
  onDateRangeChange,
  minDate,
  maxDate,
}) => {
  const { t } = useLanguage();
  // Create weekly aggregated anxiety level data
  const weeklyAnxietyData = React.useMemo(() => {
    if (analyses.length === 0) return [];

    const weeklyData: Record<string, { total: number; count: number }> = {};

    const getWeekStart = (date: Date): Date => {
      const d = new Date(date);
      const day = d.getDay();
      const diff = d.getDate() - day + (day === 0 ? -6 : 1);
      return new Date(d.setDate(diff));
    };

    const formatWeekRange = (weekStart: Date): string => {
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);

      const startMonth = weekStart.toLocaleDateString('en-US', { month: 'short' });
      const startDay = weekStart.getDate();
      const endMonth = weekEnd.toLocaleDateString('en-US', { month: 'short' });
      const endDay = weekEnd.getDate();

      if (startMonth === endMonth) {
        return `${startMonth} ${startDay}-${endDay}`;
      } else {
        return `${startMonth} ${startDay} - ${endMonth} ${endDay}`;
      }
    };

    analyses.forEach(analysis => {
      const date = new Date(analysis.created_at || new Date());
      const weekStart = getWeekStart(date);
      const weekKey = weekStart.toISOString().split('T')[0];
      const anxietyLevel = analysis.anxietyLevel || 0;

      if (!weeklyData[weekKey]) {
        weeklyData[weekKey] = { total: 0, count: 0 };
      }

      weeklyData[weekKey].total += anxietyLevel;
      weeklyData[weekKey].count += 1;
    });

    return Object.keys(weeklyData)
      .sort((a, b) => a.localeCompare(b))
      .map(weekKey => {
        const weekStart = new Date(weekKey);
        const weekRange = formatWeekRange(weekStart);
        const avgAnxiety = Math.round((weeklyData[weekKey].total / weeklyData[weekKey].count) * 10) / 10;

        return {
          date: weekRange,
          anxietyLevel: avgAnxiety
        };
      })
      .slice(-5); // Last 5 weeks
  }, [analyses]);

  const outcomes = analyticsService.calculateTreatmentOutcomes(analyses);

  const getTrendIcon = (effectiveness: string) => {
    switch (effectiveness) {
      case 'improving': return <TrendingDown className="w-4 h-4 text-green-600" />;
      case 'declining': return <TrendingUp className="w-4 h-4 text-red-600" />;
      default: return <Minus className="w-4 h-4 text-gray-600" />;
    }
  };

  const getTrendColor = (effectiveness: string) => {
    switch (effectiveness) {
      case 'improving': return 'text-green-600 bg-green-50';
      case 'declining': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const CustomAxisTick = (props: any) => {
    const { x, y, payload } = props;
    const dataIndex = payload.index;
    const item = weeklyAnxietyData[dataIndex];

    if (!item) return null;

    return (
      <g transform={`translate(${x},${y})`}>
        <text
          x={0}
          y={0}
          dy={16}
          textAnchor="middle"
          fontSize={10}
          fill="currentColor"
          transform="rotate(-15)"
        >
          {item.date}
        </text>
      </g>
    );
  };

  const chartConfig = {
    anxietyLevel: { label: t('analytics.outcomes.anxietyLevel'), color: '#3B82F6' }
  };

  if (analyses.length === 0) {
    return (
      <div className="space-y-6 w-full min-w-0 overflow-hidden">
        <Card className="p-4 sm:p-6 w-full min-w-0 overflow-hidden">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4 truncate">{t('analytics.outcomes.title')}</h3>
          <p className="text-sm sm:text-base text-gray-600 break-words">{t('analytics.outcomes.emptyDesc')}</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full min-w-0 overflow-hidden">
      {/* Anxiety Trend Chart */}
      {(showOnly === 'trends' || showOnly === 'all') && (
        <Card className="bg-gradient-to-br from-background to-muted/20 border-primary/20 shadow-lg w-full min-w-0 overflow-hidden">
          <CardHeader className="pb-3">
            <div className="flex flex-wrap items-center justify-between gap-3 min-w-0">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Target className="w-5 h-5 text-primary" />
                </div>
                <CardTitle className="text-base sm:text-xl bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent truncate">
                  {t('analytics.outcomes.trendTitle')}
                </CardTitle>
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
          </CardHeader>
          <CardContent className="w-full min-w-0 overflow-hidden">
            {weeklyAnxietyData.length > 0 ? (
              <ChartContainer config={chartConfig} className="h-[300px] sm:h-[350px] w-full min-w-0">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={weeklyAnxietyData} margin={{ top: 20, right: 10, left: 0, bottom: 60 }}>
                    <defs>
                      <linearGradient id="anxietyGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="hsl(220 100% 60%)" stopOpacity={0.8}/>
                        <stop offset="25%" stopColor="hsl(280 100% 60%)" stopOpacity={0.6}/>
                        <stop offset="50%" stopColor="hsl(320 100% 60%)" stopOpacity={0.4}/>
                        <stop offset="75%" stopColor="hsl(360 100% 60%)" stopOpacity={0.3}/>
                        <stop offset="100%" stopColor="hsl(25 100% 60%)" stopOpacity={0.1}/>
                      </linearGradient>
                      <linearGradient id="strokeGradient" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="hsl(220 100% 50%)"/>
                        <stop offset="25%" stopColor="hsl(280 100% 50%)"/>
                        <stop offset="50%" stopColor="hsl(320 100% 50%)"/>
                        <stop offset="75%" stopColor="hsl(360 100% 50%)"/>
                        <stop offset="100%" stopColor="hsl(25 100% 50%)"/>
                      </linearGradient>
                      <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                        <feMerge>
                          <feMergeNode in="coloredBlur"/>
                          <feMergeNode in="SourceGraphic"/>
                        </feMerge>
                      </filter>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      className="stroke-muted/30"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="date"
                      height={80}
                      interval="preserveStartEnd"
                      tick={<CustomAxisTick />}
                      axisLine={false}
                      tickLine={false}
                      className="text-xs text-muted-foreground"
                    />
                    <YAxis
                      domain={[0, 10]}
                      axisLine={false}
                      tickLine={false}
                      className="text-xs text-muted-foreground"
                      tickFormatter={(value) => `${value}`}
                    />
                    <ChartTooltip
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-white border-2 border-gray-200 rounded-lg shadow-xl p-3 sm:p-4 max-w-[200px]">
                              <p className="font-bold text-gray-900 text-base sm:text-lg truncate">{label}</p>
                              <p className="text-xs sm:text-sm text-gray-600 break-words">
                                Anxiety Level: <span className="font-bold text-red-600 text-base sm:text-lg">{payload[0]?.value || 0}/10</span>
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="anxietyLevel"
                      stroke="url(#strokeGradient)"
                      strokeWidth={4}
                      fill="url(#anxietyGradient)"
                      fillOpacity={0.8}
                      dot={{
                        fill: 'white',
                        strokeWidth: 3,
                        r: 7,
                        stroke: 'url(#strokeGradient)',
                        filter: 'url(#glow)'
                      }}
                      activeDot={{
                        r: 10,
                        stroke: 'url(#strokeGradient)',
                        strokeWidth: 4,
                        fill: "white",
                        filter: 'url(#glow)'
                      }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </ChartContainer>
            ) : (
              <div className="h-[300px] sm:h-[350px] flex flex-col items-center justify-center text-muted-foreground px-4">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                  <Target className="w-8 h-8 sm:w-10 sm:h-10" />
                </div>
                <p className="text-base sm:text-lg font-medium text-center break-words">{t('analytics.outcomes.trendEmptyTitle')}</p>
                <p className="text-xs sm:text-sm text-center max-w-sm mt-2 break-words px-4">
                  {t('analytics.outcomes.trendEmptyDesc')}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Treatment Effectiveness by Week */}
      {(showOnly === 'outcomes' || showOnly === 'all') && outcomes.length > 0 && (
        <Card className="bg-gradient-to-br from-background to-muted/20 border-secondary/20 shadow-lg w-full min-w-0 overflow-hidden">
          <CardHeader className="pb-3">
            <div className="flex flex-wrap items-center justify-between gap-3 min-w-0">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-5 h-5 text-secondary" />
                </div>
                <CardTitle className="text-base sm:text-xl font-bold text-gray-900 truncate">
                  {t('analytics.outcomes.weeklyTitle')}
                </CardTitle>
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
          </CardHeader>
          <CardContent className="space-y-6 w-full min-w-0 overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 w-full min-w-0">
              {outcomes.slice(-3).map((outcome, index) => {
                const trendColor = outcome.treatmentEffectiveness === 'improving' ? 'border-green-500/30 bg-gradient-to-br from-green-50 to-green-100/50' :
                                 outcome.treatmentEffectiveness === 'declining' ? 'border-red-500/30 bg-gradient-to-br from-red-50 to-red-100/50' :
                                 'border-amber-500/30 bg-gradient-to-br from-amber-50 to-amber-100/50';

                const iconColor = outcome.treatmentEffectiveness === 'improving' ? 'text-green-600' :
                                outcome.treatmentEffectiveness === 'declining' ? 'text-red-600' : 'text-amber-600';

                return (
                  <Card key={outcome.period} className={`${trendColor} border-2 w-full min-w-0 overflow-hidden`}>
                    <CardContent className="p-3 sm:p-4">
                      <div className="flex items-center justify-between mb-3 min-w-0">
                        <span className="font-semibold text-foreground text-sm sm:text-base truncate">{outcome.period}</span>
                        <div className="flex-shrink-0">{getTrendIcon(outcome.treatmentEffectiveness)}</div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between min-w-0">
                          <span className="text-xs sm:text-sm text-muted-foreground truncate">{t('analytics.outcomes.avgAnxiety')}:</span>
                          <span className="font-bold text-base sm:text-lg text-foreground flex-shrink-0">{outcome.averageAnxiety}/10</span>
                        </div>
                        <div className="flex items-center justify-between min-w-0">
                          <span className="text-xs sm:text-sm text-muted-foreground flex-shrink-0">Change:</span>
                          <span className={`font-bold text-base sm:text-lg ${outcome.improvement > 0 ? 'text-green-600' : outcome.improvement < 0 ? 'text-red-600' : 'text-amber-600'} flex-shrink-0`}>
                            {outcome.improvement > 0 ? '+' : ''}{outcome.improvement}
                          </span>
                        </div>
                        <div className="mt-3 w-full min-w-0">
                          <Badge variant={outcome.treatmentEffectiveness === 'improving' ? 'default' :
                                        outcome.treatmentEffectiveness === 'declining' ? 'destructive' : 'secondary'}
                                className="w-full justify-center capitalize font-medium text-xs sm:text-sm">
                            {outcome.treatmentEffectiveness}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <ChartContainer config={chartConfig} className="h-[250px] sm:h-[280px] w-full min-w-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={outcomes} margin={{ top: 20, right: 10, left: 0, bottom: 40 }}>
                  <defs>
                    <linearGradient id="outcomesGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(142 76% 36%)" stopOpacity={1}/>
                      <stop offset="25%" stopColor="hsl(47 96% 53%)" stopOpacity={0.9}/>
                      <stop offset="50%" stopColor="hsl(25 95% 53%)" stopOpacity={0.8}/>
                      <stop offset="75%" stopColor="hsl(0 84% 60%)" stopOpacity={0.7}/>
                      <stop offset="100%" stopColor="hsl(300 76% 50%)" stopOpacity={0.6}/>
                    </linearGradient>
                    <filter id="outcomeGlow" x="-50%" y="-50%" width="200%" height="200%">
                      <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                      <feMerge>
                        <feMergeNode in="coloredBlur"/>
                        <feMergeNode in="SourceGraphic"/>
                      </feMerge>
                    </filter>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    className="stroke-muted/30"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="period"
                    axisLine={false}
                    tickLine={false}
                    className="text-xs text-muted-foreground"
                  />
                  <YAxis
                    domain={[0, 10]}
                    axisLine={false}
                    tickLine={false}
                    className="text-xs text-muted-foreground"
                    tickFormatter={(value) => `${value}`}
                  />
                  <ChartTooltip
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-white border-2 border-gray-200 rounded-lg shadow-xl p-3 sm:p-4 max-w-[200px]">
                            <p className="font-bold text-gray-900 text-base sm:text-lg truncate">{label}</p>
                            <p className="text-xs sm:text-sm text-gray-600 break-words">
                              Avg Anxiety: <span className="font-bold text-red-600 text-base sm:text-lg">{payload[0]?.value || 0}/10</span>
                            </p>
                            <p className="text-xs sm:text-sm text-gray-600 break-words">
                              Status: <span className="font-bold text-gray-900 capitalize">{data.treatmentEffectiveness}</span>
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar
                    dataKey="averageAnxiety"
                    fill="url(#outcomesGradient)"
                    radius={[8, 8, 0, 0]}
                    className="hover:opacity-80 transition-all duration-300"
                    filter="url(#outcomeGlow)"
                  />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      )}

      {/* Treatment Recommendations */}
      {(showOnly === 'outcomes' || showOnly === 'all') && (
        <Card className="p-4 sm:p-6 w-full min-w-0 overflow-hidden">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4 truncate">{t('treatment.insights.title')}</h3>

          <div className="space-y-4 w-full min-w-0">
            {outcomes.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 w-full min-w-0">
                <div className="p-3 sm:p-4 bg-blue-50 rounded-lg w-full min-w-0 overflow-hidden">
                  <h4 className="font-medium text-blue-900 mb-2 text-sm sm:text-base truncate">{t('treatment.insights.currentTrend')}</h4>
                  <p className="text-xs sm:text-sm text-blue-800 break-words">
                    {t('treatment.insights.decliningResults', undefined)
                      .replace('{status}', outcomes[outcomes.length - 1]?.treatmentEffectiveness ?? '')
                      .replace('{anxiety}', String(outcomes[outcomes.length - 1]?.averageAnxiety ?? ''))}
                  </p>
                </div>

                <div className="p-3 sm:p-4 bg-purple-50 rounded-lg w-full min-w-0 overflow-hidden">
                  <h4 className="font-medium text-purple-900 mb-2 text-sm sm:text-base truncate">{t('treatment.insights.interventionSuccess')}</h4>
                  <p className="text-xs sm:text-sm text-purple-800 break-words">
                    {t('treatment.insights.weeksImproved', undefined)
                      .replace('{improved}', String(outcomes.filter(o => o.treatmentEffectiveness === 'improving').length))
                      .replace('{total}', String(outcomes.length))}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-sm sm:text-base text-gray-600 break-words">{t('treatment.insights.noData')}</p>
            )}
          </div>
        </Card>
      )}
    </div>
  );
};

export default TreatmentOutcomes;
