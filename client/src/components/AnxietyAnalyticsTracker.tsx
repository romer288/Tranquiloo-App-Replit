
import React, { useState, useEffect } from 'react';
import { TrendingUp, Calendar, Target, Activity } from 'lucide-react';
import { ClaudeAnxietyAnalysis } from '@/utils/claudeAnxietyAnalysis';
import { useLanguage } from '@/context/LanguageContext';

interface AnxietyAnalyticsTrackerProps {
  analyses: ClaudeAnxietyAnalysis[];
}

interface AnalyticsTrend {
  date: string;
  anxietyLevel: number;
  gad7Score: number;
  interventionsUsed: string[];
  responseEffectiveness: number;
}

const AnxietyAnalyticsTracker: React.FC<AnxietyAnalyticsTrackerProps> = ({ analyses }) => {
  const [trends, setTrends] = useState<AnalyticsTrend[]>([]);
  const { t } = useLanguage();

  useEffect(() => {
    // Process analyses into trends
    const processedTrends = (analyses ?? []).map((analysis, index) => ({
      date: new Date().toISOString().split('T')[0], // Today's date for now
      anxietyLevel: analysis.anxietyLevel,
      gad7Score: analysis.gad7Score,
      interventionsUsed: analysis.recommendedInterventions ?? [],
      responseEffectiveness: calculateResponseEffectiveness(analysis, index, analyses)
    }));

    setTrends(processedTrends);
  }, [analyses]);

  const calculateResponseEffectiveness = (
    current: ClaudeAnxietyAnalysis, 
    index: number, 
    allAnalyses: ClaudeAnxietyAnalysis[]
  ): number => {
    if (index === 0) return 5; // Baseline
    
    const previous = allAnalyses[index - 1];
    const anxietyImprovement = previous.anxietyLevel - current.anxietyLevel;
    const gad7Improvement = previous.gad7Score - current.gad7Score;
    
    // Scale from 1-10 based on improvement
    return Math.max(1, Math.min(10, 5 + (anxietyImprovement * 2) + (gad7Improvement * 0.5)));
  };

  const getAverageAnxietyLevel = () => {
    return Math.round(((trends ?? []).reduce((s, t) => s + (t.anxietyLevel ?? 0), 0)) /
           Math.max((trends ?? []).length, 1));
  };

  const getAverageGAD7 = () => {
    return Math.round(((trends ?? []).reduce((s, t) => s + (t.gad7Score ?? 0), 0)) /
           Math.max((trends ?? []).length, 1));
  };

  const getMostEffectiveInterventions = () => {
    const interventionEffectiveness: Record<string, number[]> = {};
    
    (trends ?? []).forEach((trend) => {
      (trend.interventionsUsed ?? []).forEach((intervention) => {
        if (!interventionEffectiveness[intervention]) {
          interventionEffectiveness[intervention] = [];
        }
        interventionEffectiveness[intervention].push(trend.responseEffectiveness);
      });
    });

    return Object.entries(interventionEffectiveness)
      .map(([intervention, scores]) => ({
        intervention,
        avgEffectiveness: scores.length
          ? scores.reduce((sum, s) => sum + s, 0) / scores.length
          : 0,
        usageCount: scores.length
      }))
      .sort((a, b) => b.avgEffectiveness - a.avgEffectiveness);
  };

  const getProgressTrend = () => {
    if (trends.length < 2) return 'stable';
    
    const recent = (trends ?? []).slice(-3);
    const avgRecent = recent.length
      ? recent.reduce((s, t) => s + (t.anxietyLevel ?? 0), 0) / recent.length
      : 0;

    const earlier = (trends ?? []).slice(0, -3);
    const avgEarlier = earlier.length
      ? earlier.reduce((s, t) => s + (t.anxietyLevel ?? 0), 0) / earlier.length
      : 0;

    if (avgRecent < avgEarlier - 0.5) return 'improving';
    if (avgRecent > avgEarlier + 0.5) return 'worsening';
    return 'stable';
  };

  const mostEffectiveInterventions = getMostEffectiveInterventions();
  const progressTrend = getProgressTrend();

  if (analyses.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-4">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-6 h-6 text-blue-500" />
          <h3 className="text-lg font-semibold text-gray-900">{t('analytics.tracker.emptyTitle')}</h3>
        </div>
        <p className="text-gray-600">{t('analytics.tracker.emptyDesc')}</p>
        <div className="mt-4">
          <button 
            onClick={() => window.location.href = '/chat'}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
          >
            {t('analytics.tracker.startChat')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-4">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="w-6 h-6 text-blue-500" />
        <h3 className="text-lg font-semibold text-gray-900">{t('analytics.tracker.title')}</h3>
      </div>

      {/* Progress Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="text-center p-3 bg-blue-50 rounded-lg">
          <div className="text-2xl font-bold text-blue-600">
            {getAverageAnxietyLevel()}/10
          </div>
          <div className="text-sm text-gray-600">{t('analytics.tracker.avgAnxiety')}</div>
        </div>
        
        <div className="text-center p-3 bg-green-50 rounded-lg">
          <div className="text-2xl font-bold text-green-600">
            {getAverageGAD7()}/21
          </div>
          <div className="text-sm text-gray-600">{t('analytics.tracker.avgGad7')}</div>
        </div>
        
        <div className="text-center p-3 bg-purple-50 rounded-lg">
          <div className="text-lg font-bold text-purple-600">
            {analyses.length}
          </div>
          <div className="text-sm text-gray-600">{t('analytics.tracker.sessions')}</div>
        </div>
        
          <div className="text-center p-3 bg-orange-50 rounded-lg">
            <div className={`text-lg font-bold ${
              progressTrend === 'improving' ? 'text-green-600' : 
              progressTrend === 'worsening' ? 'text-red-600' : 
              'text-gray-600'
            }`}>
              {progressTrend.toUpperCase()}
            </div>
            <div className="text-sm text-gray-600">{t('analytics.tracker.trend')}</div>
          </div>
        </div>

      {/* Most Effective Interventions */}
      {mostEffectiveInterventions.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-4 h-4 text-green-500" />
            <span className="text-sm font-medium text-gray-700">{t('analytics.tracker.mostEffective')}</span>
          </div>
          <div className="space-y-2">
            {(mostEffectiveInterventions ?? []).slice(0, 4).map((item, index) => (
              <div key={index} className="flex items-center justify-between bg-green-50 px-3 py-2 rounded">
                <span className="text-sm text-green-800">{item.intervention}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-green-600">
                    {(item?.avgEffectiveness !== null && item?.avgEffectiveness !== undefined && !isNaN(Number(item.avgEffectiveness)) ? Number(item.avgEffectiveness).toFixed(1) : '0.0')}/10 {t('analytics.tracker.effectiveness')}
                  </span>
                  <span className="text-xs bg-green-200 text-green-800 px-2 py-1 rounded-full">
                    {t('analytics.tracker.used').replace('{count}', item.usageCount.toString())}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Progress */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-2">
          <Activity className="w-4 h-4 text-blue-500" />
          <span className="text-sm font-medium text-gray-700">{t('analytics.tracker.recentProgress')}</span>
        </div>
        <p className="text-sm text-gray-600">
          {progressTrend === 'improving' && 
            t('analytics.tracker.progressImproving')}
          {progressTrend === 'stable' && 
            t('analytics.tracker.progressStable')}
          {progressTrend === 'worsening' && 
            t('analytics.tracker.progressWorsening')}
        </p>
      </div>
    </div>
  );
};

export default AnxietyAnalyticsTracker;
